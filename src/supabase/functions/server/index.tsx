import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Middleware
app.use("*", cors());
app.use("*", logger(console.log));

// Supabase client
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

// Helper: Verify auth token
async function verifyAuth(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
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
      ...(init.headers ?? {}),
    },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      json?.message || json?.error || `Paystack request failed (${res.status})`;
    throw new Error(message);
  }
  return json;
}

// Withdraw Endpoints

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
  } catch (error) {
    console.error("Wallet fetch error:", error);
    return c.json({ error: "Failed to fetch wallet" }, 500);
  }
});

// GET /make-server-8061e72e/banks — Paystack NGN bank list for bank selector
app.get("/make-server-8061e72e/banks", async (c) => {
  try {
    const user = await verifyAuth(c.req.header("Authorization"));
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const json = await paystackRequest("/bank?country=nigeria&perPage=100", {
      method: "GET",
    });
    const data = (json?.data ?? []) as Array<{
      name: string;
      code: string;
      slug?: string;
    }>;
    const banks = data
      .filter((b) => b?.name && b?.code)
      .map((b) => ({ name: b.name, code: b.code }));

    return c.json({ banks });
  } catch (error) {
    console.error("Banks fetch error:", error);
    return c.json({ error: "Failed to fetch banks" }, 500);
  }
});

// POST /make-server-8061e72e/referrals/apply — link referred_by on signup via /join/:code
app.post("/make-server-8061e72e/referrals/apply", async (c) => {
  try {
    const user = await verifyAuth(c.req.header("Authorization"));
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json().catch(() => ({}));
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

    const referrerId = referrerProfile.user_id;
    if (referrerId === user.id)
      return c.json({ error: "Cannot use your own code" }, 400);

    const { data: myProfile, error: myErr } = await supabase
      .from("profiles")
      .select("referred_by")
      .eq("user_id", user.id)
      .maybeSingle();
    if (myErr) return c.json({ error: "Failed to load profile" }, 500);
    if (myProfile?.referred_by) return c.json({ message: "Already applied" });

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
    const nextCount = Math.max(0, Number(refProfile?.referral_count ?? 0)) + 1;
    await supabase
      .from("profiles")
      .update({
        referral_count: nextCount,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", referrerId);

    return c.json({ message: "Referral applied" });
  } catch (error) {
    console.error("Referral apply error:", error);
    return c.json({ error: "Failed to apply referral" }, 500);
  }
});

// POST /make-server-8061e72e/payments/withdraw/initiate
app.post("/make-server-8061e72e/payments/withdraw/initiate", async (c) => {
  try {
    const user = await verifyAuth(c.req.header("Authorization"));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const {
      amount,
      currency = "NGN",
      note,
      bank_account_id,
    } = await c.req.json();

    if (!amount || amount <= 0) {
      return c.json({ error: "Invalid amount" }, 400);
    }

    const walletId = await getWalletIdForUser(user.id);
    if (!walletId) {
      return c.json({ error: "Wallet not found" }, 404);
    }

    const { data: walletBalance, error: balErr } = await supabase
      .from("wallet_balances")
      .select("available_balance,currency")
      .eq("wallet_id", walletId)
      .maybeSingle();
    if (balErr) {
      console.error("Balance lookup error:", balErr);
      return c.json({ error: "Failed to validate balance" }, 500);
    }

    const availableBalance = Number(walletBalance?.available_balance ?? 0);

    if (amount > availableBalance) {
      return c.json({ error: "Insufficient balance" }, 400);
    }

    // Fetch bank account (required for Paystack transfers)
    const { data: bank, error: bankErr } = await supabase
      .from("bank_accounts")
      .select(
        "id,bank_name,bank_code,account_number,account_name,recipient_code,currency,verified",
      )
      .eq("user_id", user.id)
      .eq("id", bank_account_id ?? "")
      .maybeSingle();
    if (bankErr || !bank) {
      return c.json({ error: "Bank account not found" }, 400);
    }
    if (!bank.bank_code || !bank.account_number) {
      return c.json(
        { error: "Bank account is missing bank_code or account_number" },
        400,
      );
    }

    let recipientCode: string | null = bank.recipient_code ?? null;
    if (!recipientCode) {
      const recipientResp = await paystackRequest("/transferrecipient", {
        method: "POST",
        body: JSON.stringify({
          type: "nuban",
          name: bank.account_name || bank.bank_name,
          account_number: bank.account_number,
          bank_code: bank.bank_code,
          currency: bank.currency || currency,
        }),
      });
      recipientCode = recipientResp?.data?.recipient_code ?? null;
      if (!recipientCode)
        throw new Error("Failed to create transfer recipient");

      await supabase
        .from("bank_accounts")
        .update({ recipient_code: recipientCode, verified: true })
        .eq("id", bank.id);
    }

    // Create withdrawal request record (DB)
    const withdrawalId = crypto.randomUUID();
    const paystackReference = `DTWD-${Date.now()}-${withdrawalId.slice(0, 8)}`;

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

    // Lock funds by writing a pending withdrawal ledger entry (append-only)
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

    // Initiate Paystack transfer
    const transferResp = await paystackRequest("/transfer", {
      method: "POST",
      body: JSON.stringify({
        source: "balance",
        amount: Math.round(Number(amount) * 100), // kobo
        recipient: recipientCode,
        reference: paystackReference,
        reason: note ?? "Dobble Tap withdrawal",
      }),
    });

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
  } catch (error) {
    console.error("Withdrawal initiation error:", error);
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

    const body = JSON.parse(rawBody);
    const { event, data } = body;

    // Handle both charge and transfer style events; use reference in payload
    const reference: string | undefined =
      data?.reference ?? data?.transfer_code ?? data?.id;
    if (!reference) return c.json({ status: "ignored" });

    if (event === "charge.success" || event === "transfer.success") {
      // Mark withdrawal completed (idempotent)
      const { data: existing, error: findErr } = await supabase
        .from("withdrawal_requests")
        .select("id,status,user_id,amount,paystack_reference")
        .eq("paystack_reference", reference)
        .maybeSingle();
      if (findErr || !existing)
        return c.json({ error: "Withdrawal not found" }, 404);
      if (existing.status === "completed") return c.json({ status: "ok" });

      await supabase
        .from("withdrawal_requests")
        .update({ status: "completed", processed_at: new Date().toISOString() })
        .eq("id", existing.id);

      await supabase
        .from("wallet_ledger")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("reference", reference)
        .eq("type", "withdrawal")
        .eq("status", "pending");

      console.log(`Withdrawal ${existing.id} completed`);
    } else if (event === "charge.failed" || event === "transfer.failed") {
      const reason = data?.gateway_response ?? data?.message ?? "failed";

      const { data: existing, error: findErr } = await supabase
        .from("withdrawal_requests")
        .select("id,status")
        .eq("paystack_reference", reference)
        .maybeSingle();
      if (findErr || !existing)
        return c.json({ error: "Withdrawal not found" }, 404);
      if (existing.status === "failed") return c.json({ status: "ok" });

      await supabase
        .from("withdrawal_requests")
        .update({
          status: "failed",
          failure_reason: reason,
          processed_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      await supabase
        .from("wallet_ledger")
        .update({ status: "failed", completed_at: new Date().toISOString() })
        .eq("reference", reference)
        .eq("type", "withdrawal")
        .eq("status", "pending");

      console.log(`Withdrawal ${existing.id} failed: ${reason}`);
    }

    return c.json({ status: "webhook processed" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return c.json({ error: "Webhook processing failed" }, 500);
  }
});

// Managed Creators Endpoints

// GET /make-server-8061e72e/managed-creators
app.get("/make-server-8061e72e/managed-creators", async (c) => {
  try {
    const user = await verifyAuth(c.req.header("Authorization"));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const creators = await kv.getByPrefix(`managed_creator:${user.id}:`);
    return c.json({ creators });
  } catch (error) {
    console.error("Failed to fetch managed creators:", error);
    return c.json({ error: "Failed to fetch creators" }, 500);
  }
});

// POST /make-server-8061e72e/managed-creators
app.post("/make-server-8061e72e/managed-creators", async (c) => {
  try {
    const user = await verifyAuth(c.req.header("Authorization"));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { displayName, niche, baseRate, currency, socialAccounts } =
      await c.req.json();

    if (
      !displayName ||
      !baseRate ||
      !socialAccounts ||
      socialAccounts.length === 0
    ) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const creatorId = crypto.randomUUID();
    const creator = {
      id: creatorId,
      managerUserId: user.id,
      displayName,
      niche: niche || "General",
      baseRate,
      currency: currency || "NGN",
      status: "active",
      socialAccounts: socialAccounts.map((acc: any) => ({
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
  } catch (error) {
    console.error("Failed to create managed creator:", error);
    return c.json({ error: "Failed to create creator" }, 500);
  }
});

// PUT /make-server-8061e72e/managed-creators/:id
app.put("/make-server-8061e72e/managed-creators/:id", async (c) => {
  try {
    const user = await verifyAuth(c.req.header("Authorization"));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const creatorId = c.req.param("id");
    const updates = await c.req.json();

    const creatorKey = `managed_creator:${user.id}:${creatorId}`;
    const existingCreator = await kv.get(creatorKey);

    if (!existingCreator) {
      return c.json({ error: "Creator not found" }, 404);
    }

    const updatedCreator = {
      ...existingCreator,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(creatorKey, updatedCreator);

    return c.json({ creator: updatedCreator });
  } catch (error) {
    console.error("Failed to update managed creator:", error);
    return c.json({ error: "Failed to update creator" }, 500);
  }
});

// Campaign Upload Submission Endpoints

// POST /make-server-8061e72e/campaigns/:campaignId/submit-content
app.post(
  "/make-server-8061e72e/campaigns/:campaignId/submit-content",
  async (c) => {
    try {
      const user = await verifyAuth(c.req.header("Authorization"));
      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const campaignId = c.req.param("campaignId");
      const { type, url, note, fileName, fileSize } = await c.req.json();

      if (!type || !url) {
        return c.json({ error: "Missing required fields: type and url" }, 400);
      }

      if (type !== "file" && type !== "drive_link") {
        return c.json(
          { error: "Invalid type. Must be file or drive_link" },
          400,
        );
      }

      // Get campaign
      const campaignKey = `campaign:${campaignId}`;
      const campaign = await kv.get(campaignKey);

      if (!campaign) {
        return c.json({ error: "Campaign not found" }, 404);
      }

      // Verify user owns this campaign
      if (campaign.creatorId !== user.id) {
        return c.json({ error: "Forbidden" }, 403);
      }

      // Create asset record
      const assetId = crypto.randomUUID();
      const versionNumber = (campaign.currentVersion || 0) + 1;

      const asset = {
        id: assetId,
        campaignId: campaignId,
        creatorId: user.id,
        assetType: "draft_video",
        assetSource: type,
        assetUrl: url,
        fileName: fileName || null,
        fileSize: fileSize || null,
        versionNumber,
        note: note || null,
        status: "pending_review",
        createdAt: new Date().toISOString(),
      };

      await kv.set(`asset:${assetId}`, asset);

      // Update campaign status
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

      // Generate review token
      const reviewToken = crypto.randomUUID();
      const reviewTokenRecord = {
        token: reviewToken,
        campaignId: campaignId,
        assetId: assetId,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 30 days
      };

      await kv.set(`review_token:${reviewToken}`, reviewTokenRecord);

      // In production, send notification to agency/client
      // const reviewUrl = `${Deno.env.get('FRONTEND_URL')}/review/${reviewToken}`;
      // await sendNotification(campaign.agencyEmail, reviewUrl);

      console.log(
        `Content submitted for campaign ${campaignId}, asset ${assetId}, version ${versionNumber}`,
      );

      return c.json({
        success: true,
        assetId,
        versionNumber,
        reviewToken,
        campaign: updatedCampaign,
      });
    } catch (error) {
      console.error("Content submission error:", error);
      return c.json({ error: "Failed to submit content" }, 500);
    }
  },
);

// GET /make-server-8061e72e/campaigns/:campaignId/assets
app.get("/make-server-8061e72e/campaigns/:campaignId/assets", async (c) => {
  try {
    const user = await verifyAuth(c.req.header("Authorization"));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const campaignId = c.req.param("campaignId");

    // Get all assets for this campaign
    const allAssets = await kv.getByPrefix("asset:");
    const campaignAssets = allAssets.filter(
      (asset: any) => asset.campaignId === campaignId,
    );

    // Sort by version number descending
    campaignAssets.sort((a: any, b: any) => b.versionNumber - a.versionNumber);

    return c.json({ assets: campaignAssets });
  } catch (error) {
    console.error("Failed to fetch campaign assets:", error);
    return c.json({ error: "Failed to fetch assets" }, 500);
  }
});

// GET /make-server-8061e72e/review/:token
app.get("/make-server-8061e72e/review/:token", async (c) => {
  try {
    const token = c.req.param("token");

    const reviewTokenRecord = await kv.get(`review_token:${token}`);

    if (!reviewTokenRecord) {
      return c.json({ error: "Invalid or expired review link" }, 404);
    }

    // Check if token is expired
    const expiresAt = new Date(reviewTokenRecord.expiresAt);
    if (expiresAt < new Date()) {
      return c.json({ error: "Review link has expired" }, 410);
    }

    // Get asset
    const asset = await kv.get(`asset:${reviewTokenRecord.assetId}`);
    if (!asset) {
      return c.json({ error: "Asset not found" }, 404);
    }

    // Get campaign
    const campaign = await kv.get(`campaign:${reviewTokenRecord.campaignId}`);
    if (!campaign) {
      return c.json({ error: "Campaign not found" }, 404);
    }

    return c.json({
      asset,
      campaign: {
        id: campaign.id,
        title: campaign.title,
        brand: campaign.brand,
        platform: campaign.platform,
      },
    });
  } catch (error) {
    console.error("Failed to fetch review data:", error);
    return c.json({ error: "Failed to fetch review data" }, 500);
  }
});

// Health check
app.get("/make-server-8061e72e/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

Deno.serve(app.fetch);
