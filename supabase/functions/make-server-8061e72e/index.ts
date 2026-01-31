import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.ts";

const app = new Hono();

app.use("*", cors());
app.use("*", logger(console.log));

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

async function verifyAuth(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.substring(7);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

async function getWalletIdForUser(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("creators")
    .select("wallet_id")
    .eq("creator_id", userId)
    .maybeSingle();
  if (error) return null;
  return data?.wallet_id ?? null;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyPaystackSignature(
  rawBody: string,
  signatureHeader: string | null,
): Promise<boolean> {
  const secret = Deno.env.get("PAYSTACK_SECRET_KEY") ?? "";
  if (!secret || !signatureHeader) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(rawBody),
  );
  const expected = toHex(new Uint8Array(sig));
  return expected === signatureHeader;
}

async function paystackRequest(path: string, init: RequestInit) {
  const secret = Deno.env.get("PAYSTACK_SECRET_KEY") ?? "";
  if (!secret) throw new Error("Missing PAYSTACK_SECRET_KEY");
  const res = await fetch(`https://api.paystack.co${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      ...((init.headers as Record<string, string>) ?? {}),
    },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      (json as { message?: string })?.message ??
      (json as { error?: string })?.error ??
      `Paystack request failed (${res.status})`;
    throw new Error(String(msg));
  }
  return json as Record<string, unknown>;
}

// GET /make-server-8061e72e/wallet
app.get("/make-server-8061e72e/wallet", async (c) => {
  try {
    const user = await verifyAuth(c.req.header("Authorization"));
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const walletId = await getWalletIdForUser(user.id);
    if (!walletId) return c.json({ error: "Wallet not found" }, 404);
    const { data: balance, error: balErr } = await supabase
      .from("wallet_balances")
      .select("*")
      .eq("wallet_id", walletId)
      .maybeSingle();
    if (balErr) return c.json({ error: "Failed to load balance" }, 500);
    const { data: ledger, error: ledErr } = await supabase
      .from("wallet_ledger")
      .select(
        "ledger_id,type,amount,currency,status,reference,note,created_at,completed_at,creator_campaign_id",
      )
      .eq("wallet_id", walletId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (ledErr) return c.json({ error: "Failed to load transactions" }, 500);
    return c.json({ wallet_id: walletId, balance, ledger });
  } catch (err) {
    console.error("Wallet fetch error:", err);
    return c.json({ error: "Failed to fetch wallet" }, 500);
  }
});

// GET /make-server-8061e72e/banks
app.get("/make-server-8061e72e/banks", async (c) => {
  try {
    const user = await verifyAuth(c.req.header("Authorization"));
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const json = await paystackRequest("/bank?country=nigeria&perPage=100", {
      method: "GET",
    });
    const data = (json?.data ?? []) as Array<{ name: string; code: string }>;
    const banks = data
      .filter((b) => b?.name && b?.code)
      .map((b) => ({ name: b.name, code: b.code }));
    return c.json({ banks });
  } catch (err) {
    console.error("Banks fetch error:", err);
    return c.json({ error: "Failed to fetch banks" }, 500);
  }
});

// POST /make-server-8061e72e/referrals/apply
app.post("/make-server-8061e72e/referrals/apply", async (c) => {
  try {
    const user = await verifyAuth(c.req.header("Authorization"));
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const body = (await c.req.json().catch(() => ({}))) as {
      referralCode?: string;
    };
    const referralCode =
      typeof body?.referralCode === "string"
        ? body.referralCode.trim().toUpperCase()
        : "";
    if (!referralCode) return c.json({ error: "Missing referralCode" }, 400);
    const { data: referrerProfile, error: refErr } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("referral_code", referralCode)
      .maybeSingle();
    if (refErr || !referrerProfile)
      return c.json({ error: "Invalid referral code" }, 400);
    const referrerId = referrerProfile.user_id as string;
    if (referrerId === user.id)
      return c.json({ error: "Cannot use your own code" }, 400);
    const { data: myProfile, error: myErr } = await supabase
      .from("profiles")
      .select("referred_by")
      .eq("user_id", user.id)
      .maybeSingle();
    if (myErr) return c.json({ error: "Failed to load profile" }, 500);
    if ((myProfile as { referred_by?: string } | null)?.referred_by)
      return c.json({ message: "Already applied" });
    const { error: upErr } = await supabase
      .from("profiles")
      .update({ referred_by: referrerId, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);
    if (upErr) {
      console.error("Referral apply update profile:", upErr);
      return c.json({ error: "Failed to apply referral" }, 500);
    }
    const { error: insErr } = await supabase.from("referrals").insert({
      referrer_user_id: referrerId,
      referred_user_id: user.id,
      status: "active",
      activated_at: new Date().toISOString(),
    });
    if (insErr) {
      if (insErr.code === "23505")
        return c.json({ message: "Already applied" });
      console.error("Referral apply insert:", insErr);
      return c.json({ error: "Failed to apply referral" }, 500);
    }
    const { data: refProfile } = await supabase
      .from("profiles")
      .select("referral_count")
      .eq("user_id", referrerId)
      .maybeSingle();
    const refCount =
      (refProfile as { referral_count?: number } | null)?.referral_count ?? 0;
    const nextCount = Math.max(0, Number(refCount)) + 1;
    await supabase
      .from("profiles")
      .update({
        referral_count: nextCount,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", referrerId);
    return c.json({ message: "Referral applied" });
  } catch (err) {
    console.error("Referral apply error:", err);
    return c.json({ error: "Failed to apply referral" }, 500);
  }
});

// POST /make-server-8061e72e/payments/creator-earning/complete
// Mark campaign_earning as completed (pending → completed). Triggers 2% referral commission for referrers.
// Call when escrow releases or agency marks creator as paid.
app.post(
  "/make-server-8061e72e/payments/creator-earning/complete",
  async (c) => {
    try {
      const user = await verifyAuth(c.req.header("Authorization"));
      if (!user) return c.json({ error: "Unauthorized" }, 401);
      const body = (await c.req.json().catch(() => ({}))) as {
        creator_campaign_id?: string;
        ledger_id?: string;
      };
      const creatorCampaignId = body?.creator_campaign_id;
      const ledgerId = body?.ledger_id;
      if (!creatorCampaignId && !ledgerId) {
        return c.json(
          { error: "Provide creator_campaign_id or ledger_id" },
          400,
        );
      }

      let q = supabase
        .from("wallet_ledger")
        .select("ledger_id,wallet_id,creator_campaign_id")
        .eq("type", "campaign_earning")
        .eq("status", "pending");
      if (creatorCampaignId) q = q.eq("creator_campaign_id", creatorCampaignId);
      else if (ledgerId) q = q.eq("ledger_id", ledgerId);
      const { data: row, error: findErr } = await q.limit(1).maybeSingle();
      if (findErr || !row)
        return c.json({ error: "Pending campaign earning not found" }, 404);

      const { error: upErr } = await supabase
        .from("wallet_ledger")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("ledger_id", (row as { ledger_id: string }).ledger_id);
      if (upErr) {
        console.error("Creator earning complete update error:", upErr);
        return c.json({ error: "Failed to complete earning" }, 500);
      }
      return c.json({
        message: "Earning completed",
        ledger_id: (row as { ledger_id: string }).ledger_id,
      });
    } catch (err) {
      console.error("Creator earning complete error:", err);
      return c.json({ error: "Failed to complete earning" }, 500);
    }
  },
);

// POST /make-server-8061e72e/payments/withdraw/initiate
// Body may include test: true for demo withdrawal (skips Paystack, marks completed immediately).
app.post("/make-server-8061e72e/payments/withdraw/initiate", async (c) => {
  try {
    const user = await verifyAuth(c.req.header("Authorization"));
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const body = (await c.req.json().catch(() => ({}))) as {
      amount?: number;
      currency?: string;
      note?: string;
      bank_account_id?: string;
      test?: boolean;
    };
    const {
      amount,
      currency = "NGN",
      note,
      bank_account_id,
      test: isTest,
    } = body;
    if (!amount || amount <= 0) return c.json({ error: "Invalid amount" }, 400);
    const walletId = await getWalletIdForUser(user.id);
    if (!walletId) return c.json({ error: "Wallet not found" }, 404);
    const { data: walletBalance, error: balErr } = await supabase
      .from("wallet_balances")
      .select("available_balance,currency")
      .eq("wallet_id", walletId)
      .maybeSingle();
    if (balErr) return c.json({ error: "Failed to validate balance" }, 500);
    const availableBalance = Number(
      (walletBalance as { available_balance?: number } | null)
        ?.available_balance ?? 0,
    );
    if (amount > availableBalance)
      return c.json({ error: "Insufficient balance" }, 400);
    const { data: bank, error: bankErr } = await supabase
      .from("bank_accounts")
      .select(
        "id,bank_name,bank_code,account_number,account_name,recipient_code,currency,verified",
      )
      .eq("user_id", user.id)
      .eq("id", bank_account_id ?? "")
      .maybeSingle();
    if (bankErr || !bank)
      return c.json({ error: "Bank account not found" }, 400);
    const b = bank as {
      bank_code?: string;
      account_number?: string;
      account_name?: string;
      bank_name?: string;
      id?: string;
      recipient_code?: string | null;
      currency?: string;
    };
    if (!b.bank_code || !b.account_number)
      return c.json(
        { error: "Bank account is missing bank_code or account_number" },
        400,
      );

    const withdrawalId = crypto.randomUUID();
    const paystackReference = isTest
      ? `DTWD-DEMO-${Date.now()}-${withdrawalId.slice(0, 8)}`
      : `DTWD-${Date.now()}-${withdrawalId.slice(0, 8)}`;

    if (isTest) {
      const { error: wrErr } = await supabase
        .from("withdrawal_requests")
        .insert({
          id: withdrawalId,
          user_id: user.id,
          amount,
          currency,
          status: "processing",
          paystack_reference: paystackReference,
          bank_account_id: bank_account_id ?? null,
          paystack_recipient_code: null,
          note: note ?? null,
        });
      if (wrErr) {
        console.error("Withdrawal insert error:", wrErr);
        return c.json({ error: "Failed to create withdrawal request" }, 500);
      }
      const { error: ledErr } = await supabase.from("wallet_ledger").insert({
        wallet_id: walletId,
        type: "withdrawal",
        amount,
        currency,
        status: "pending",
        reference: paystackReference,
        note: note ?? "Dobble Tap withdrawal (test)",
      });
      if (ledErr) {
        console.error("Ledger insert error:", ledErr);
        return c.json({ error: "Failed to lock funds" }, 500);
      }
      const now = new Date().toISOString();
      await supabase
        .from("withdrawal_requests")
        .update({ status: "completed", processed_at: now })
        .eq("id", withdrawalId);
      await supabase
        .from("wallet_ledger")
        .update({ status: "completed", completed_at: now })
        .eq("reference", paystackReference);
      return c.json({
        withdrawalId,
        reference: paystackReference,
        status: "completed",
        test: true,
      });
    }

    let recipientCode: string | null = b.recipient_code ?? null;
    if (!recipientCode) {
      const recipientResp = (await paystackRequest("/transferrecipient", {
        method: "POST",
        body: JSON.stringify({
          type: "nuban",
          name: b.account_name || b.bank_name,
          account_number: b.account_number,
          bank_code: b.bank_code,
          currency: b.currency || currency,
        }),
      })) as { data?: { recipient_code?: string } };
      recipientCode = recipientResp?.data?.recipient_code ?? null;
      if (!recipientCode)
        throw new Error("Failed to create transfer recipient");
      await supabase
        .from("bank_accounts")
        .update({ recipient_code: recipientCode, verified: true })
        .eq("id", b.id);
    }
    const { error: wrErr } = await supabase.from("withdrawal_requests").insert({
      id: withdrawalId,
      user_id: user.id,
      amount,
      currency,
      status: "processing",
      paystack_reference: paystackReference,
      bank_account_id: bank_account_id ?? null,
      paystack_recipient_code: recipientCode,
      note: note ?? null,
    });
    if (wrErr) {
      console.error("Withdrawal insert error:", wrErr);
      return c.json({ error: "Failed to create withdrawal request" }, 500);
    }
    const { error: ledErr } = await supabase.from("wallet_ledger").insert({
      wallet_id: walletId,
      type: "withdrawal",
      amount,
      currency,
      status: "pending",
      reference: paystackReference,
      note: note ?? null,
    });
    if (ledErr) {
      console.error("Ledger insert error:", ledErr);
      return c.json({ error: "Failed to lock funds" }, 500);
    }
    const transferResp = (await paystackRequest("/transfer", {
      method: "POST",
      body: JSON.stringify({
        source: "balance",
        amount: Math.round(Number(amount) * 100),
        recipient: recipientCode,
        reference: paystackReference,
        reason: note ?? "Dobble Tap withdrawal",
      }),
    })) as { data?: { transfer_code?: string; id?: number } };
    const transferCode = transferResp?.data?.transfer_code ?? null;
    const transferId = transferResp?.data?.id ?? null;
    await supabase
      .from("withdrawal_requests")
      .update({
        paystack_transfer_code: transferCode,
        paystack_transfer_id: transferId,
      })
      .eq("id", withdrawalId);
    return c.json({
      withdrawalId,
      reference: paystackReference,
      transfer_code: transferCode,
      status: "processing",
    });
  } catch (err) {
    console.error("Withdrawal initiation error:", err);
    return c.json({ error: "Failed to initiate withdrawal" }, 500);
  }
});

// POST /make-server-8061e72e/payments/paystack/webhook
app.post("/make-server-8061e72e/payments/paystack/webhook", async (c) => {
  try {
    const rawBody = await c.req.text();
    const signature = c.req.header("x-paystack-signature");
    const ok = await verifyPaystackSignature(rawBody, signature);
    if (!ok) return c.json({ error: "Invalid signature" }, 401);
    const body = JSON.parse(rawBody) as {
      event?: string;
      data?: {
        reference?: string;
        transfer_code?: string;
        id?: string;
        gateway_response?: string;
        message?: string;
      };
    };
    const { event, data } = body;
    const reference = data?.reference ?? data?.transfer_code ?? data?.id;
    if (!reference) return c.json({ status: "ignored" });
    if (event === "charge.success" || event === "transfer.success") {
      const { data: existing, error: findErr } = await supabase
        .from("withdrawal_requests")
        .select("id,status,user_id,amount,paystack_reference")
        .eq("paystack_reference", reference)
        .maybeSingle();
      if (findErr || !existing)
        return c.json({ error: "Withdrawal not found" }, 404);
      if ((existing as { status?: string }).status === "completed")
        return c.json({ status: "ok" });
      await supabase
        .from("withdrawal_requests")
        .update({ status: "completed", processed_at: new Date().toISOString() })
        .eq("id", (existing as { id?: string }).id);
      await supabase
        .from("wallet_ledger")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("reference", reference)
        .eq("type", "withdrawal")
        .eq("status", "pending");
      console.log(`Withdrawal ${(existing as { id?: string }).id} completed`);
    } else if (event === "charge.failed" || event === "transfer.failed") {
      const reason = data?.gateway_response ?? data?.message ?? "failed";
      const { data: existing, error: findErr } = await supabase
        .from("withdrawal_requests")
        .select("id,status")
        .eq("paystack_reference", reference)
        .maybeSingle();
      if (findErr || !existing)
        return c.json({ error: "Withdrawal not found" }, 404);
      if ((existing as { status?: string }).status === "failed")
        return c.json({ status: "ok" });
      await supabase
        .from("withdrawal_requests")
        .update({
          status: "failed",
          failure_reason: reason,
          processed_at: new Date().toISOString(),
        })
        .eq("id", (existing as { id?: string }).id);
      await supabase
        .from("wallet_ledger")
        .update({ status: "failed", completed_at: new Date().toISOString() })
        .eq("reference", reference)
        .eq("type", "withdrawal")
        .eq("status", "pending");
      console.log(
        `Withdrawal ${(existing as { id?: string }).id} failed: ${reason}`,
      );
    }
    return c.json({ status: "webhook processed" });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return c.json({ error: "Webhook processing failed" }, 500);
  }
});

// Managed creators
app.get("/make-server-8061e72e/managed-creators", async (c) => {
  try {
    const user = await verifyAuth(c.req.header("Authorization"));
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const creators = await kv.getByPrefix(`managed_creator:${user.id}:`);
    return c.json({ creators });
  } catch (err) {
    console.error("Failed to fetch managed creators:", err);
    return c.json({ error: "Failed to fetch creators" }, 500);
  }
});

app.post("/make-server-8061e72e/managed-creators", async (c) => {
  try {
    const user = await verifyAuth(c.req.header("Authorization"));
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const { displayName, niche, baseRate, currency, socialAccounts } =
      (await c.req.json()) as {
        displayName?: string;
        niche?: string;
        baseRate?: number;
        currency?: string;
        socialAccounts?: Array<{
          platform?: string;
          handle?: string;
          followers?: number;
          rateOverride?: number;
        }>;
      };
    if (!displayName || !baseRate || !socialAccounts?.length)
      return c.json({ error: "Missing required fields" }, 400);
    const creatorId = crypto.randomUUID();
    const creator = {
      id: creatorId,
      managerUserId: user.id,
      displayName,
      niche: niche || "General",
      baseRate,
      currency: currency || "NGN",
      status: "active",
      socialAccounts: socialAccounts.map((acc) => ({
        id: crypto.randomUUID(),
        platform: acc.platform,
        handle: acc.handle,
        followers: acc.followers,
        rateOverride: acc.rateOverride,
        createdAt: new Date().toISOString(),
      })),
      createdAt: new Date().toISOString(),
    };
    await kv.set(`managed_creator:${user.id}:${creatorId}`, creator);
    return c.json({ creator });
  } catch (err) {
    console.error("Failed to create managed creator:", err);
    return c.json({ error: "Failed to create creator" }, 500);
  }
});

app.put("/make-server-8061e72e/managed-creators/:id", async (c) => {
  try {
    const user = await verifyAuth(c.req.header("Authorization"));
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const creatorId = c.req.param("id");
    const updates = (await c.req.json()) as Record<string, unknown>;
    const creatorKey = `managed_creator:${user.id}:${creatorId}`;
    const existingCreator = (await kv.get(creatorKey)) as
      | Record<string, unknown>
      | undefined;
    if (!existingCreator) return c.json({ error: "Creator not found" }, 404);
    const updatedCreator = {
      ...existingCreator,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await kv.set(creatorKey, updatedCreator);
    return c.json({ creator: updatedCreator });
  } catch (err) {
    console.error("Failed to update managed creator:", err);
    return c.json({ error: "Failed to update creator" }, 500);
  }
});

// Campaign submit content
app.post(
  "/make-server-8061e72e/campaigns/:campaignId/submit-content",
  async (c) => {
    try {
      const user = await verifyAuth(c.req.header("Authorization"));
      if (!user) return c.json({ error: "Unauthorized" }, 401);
      const campaignId = c.req.param("campaignId");
      const { type, url, note, fileName, fileSize } = (await c.req.json()) as {
        type?: string;
        url?: string;
        note?: string;
        fileName?: string;
        fileSize?: number;
      };
      if (!type || !url)
        return c.json({ error: "Missing required fields: type and url" }, 400);
      if (type !== "file" && type !== "drive_link")
        return c.json(
          { error: "Invalid type. Must be file or drive_link" },
          400,
        );
      const campaignKey = `campaign:${campaignId}`;
      const campaign = (await kv.get(campaignKey)) as
        | {
            creatorId?: string;
            currentVersion?: number;
            id?: string;
            title?: string;
            brand?: string;
            platform?: string;
          }
        | undefined;
      if (!campaign) return c.json({ error: "Campaign not found" }, 404);
      if (campaign.creatorId !== user.id)
        return c.json({ error: "Forbidden" }, 403);
      const assetId = crypto.randomUUID();
      const versionNumber = (campaign.currentVersion ?? 0) + 1;
      const asset = {
        id: assetId,
        campaignId,
        creatorId: user.id,
        assetType: "draft_video",
        assetSource: type,
        assetUrl: url,
        fileName: fileName ?? null,
        fileSize: fileSize ?? null,
        versionNumber,
        note: note ?? null,
        status: "pending_review",
        createdAt: new Date().toISOString(),
      };
      await kv.set(`asset:${assetId}`, asset);
      const updatedCampaign = {
        ...campaign,
        status: "in_review",
        currentStep: "review",
        currentVersion: versionNumber,
        lastSubmittedAt: new Date().toISOString(),
        lastAssetId: assetId,
        updatedAt: new Date().toISOString(),
      };
      await kv.set(campaignKey, updatedCampaign);
      const reviewToken = crypto.randomUUID();
      await kv.set(`review_token:${reviewToken}`, {
        token: reviewToken,
        campaignId,
        assetId,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      });
      return c.json({
        success: true,
        assetId,
        versionNumber,
        reviewToken,
        campaign: updatedCampaign,
      });
    } catch (err) {
      console.error("Content submission error:", err);
      return c.json({ error: "Failed to submit content" }, 500);
    }
  },
);

app.get("/make-server-8061e72e/campaigns/:campaignId/assets", async (c) => {
  try {
    const user = await verifyAuth(c.req.header("Authorization"));
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const campaignId = c.req.param("campaignId");
    const allAssets = (await kv.getByPrefix("asset:")) as Array<{
      campaignId?: string;
      versionNumber?: number;
    }>;
    const campaignAssets = allAssets.filter((a) => a.campaignId === campaignId);
    campaignAssets.sort(
      (a, b) => (b.versionNumber ?? 0) - (a.versionNumber ?? 0),
    );
    return c.json({ assets: campaignAssets });
  } catch (err) {
    console.error("Failed to fetch campaign assets:", err);
    return c.json({ error: "Failed to fetch assets" }, 500);
  }
});

app.get("/make-server-8061e72e/review/:token", async (c) => {
  try {
    const token = c.req.param("token");
    const reviewTokenRecord = (await kv.get(`review_token:${token}`)) as
      | {
          expiresAt?: string;
          assetId?: string;
          campaignId?: string;
        }
      | undefined;
    if (!reviewTokenRecord)
      return c.json({ error: "Invalid or expired review link" }, 404);
    const expiresAt = new Date(reviewTokenRecord.expiresAt ?? 0);
    if (expiresAt < new Date())
      return c.json({ error: "Review link has expired" }, 410);
    const asset = await kv.get(`asset:${reviewTokenRecord.assetId}`);
    if (!asset) return c.json({ error: "Asset not found" }, 404);
    const campaign = await kv.get(`campaign:${reviewTokenRecord.campaignId}`);
    if (!campaign) return c.json({ error: "Campaign not found" }, 404);
    const camp = campaign as {
      id?: string;
      title?: string;
      brand?: string;
      platform?: string;
    };
    return c.json({
      asset,
      campaign: {
        id: camp.id,
        title: camp.title,
        brand: camp.brand,
        platform: camp.platform,
      },
    });
  } catch (err) {
    console.error("Failed to fetch review data:", err);
    return c.json({ error: "Failed to fetch review data" }, 500);
  }
});

app.get("/make-server-8061e72e/health", (c) =>
  c.json({ status: "ok", timestamp: new Date().toISOString() }),
);

Deno.serve(app.fetch);
