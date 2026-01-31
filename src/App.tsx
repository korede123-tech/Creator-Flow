import { useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { SignupAccountPage } from "./components/SignupAccountPage";
import { SignupSocialPage } from "./components/SignupSocialPage";
import { SignupPayoutPage } from "./components/SignupPayoutPage";
import { SignupSuccessPage } from "./components/SignupSuccessPage";
import { LoginPage } from "./components/LoginPage";
import { Home } from "./components/Home";
import { Campaigns } from "./components/Campaigns";
import { Wallet } from "./components/Wallet";
import { Profile } from "./components/Profile";
import { Insights } from "./components/Insights";
import { AgencyCreators } from "./components/AgencyCreators";
import { AgencyCampaignRequests } from "./components/AgencyCampaignRequests";
import { CampaignDetail } from "./components/CampaignDetail";
import { MobileNav } from "./components/MobileNav";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { Menu, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import logo from "figma:asset/fcad7446971be733d3427a6b22f8f64253529daf.png";
import { Currency } from "./utils/currency";
import { supabase } from "./utils/supabase/client";
import type {
  CreatorProfileRow,
  CreatorSocialRow,
  CreatorPackageRow,
} from "./components/CreatorProfile/types";
import {
  getStoredReferralCode,
  clearStoredReferralCode,
} from "./components/JoinPage";
import { Skeleton } from "./components/ui/skeleton";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate
} from "react-router-dom";
import { AdminLayout } from "./components/Admin/AdminLayout";
import { AdminDashboard } from "./components/Admin/AdminDashboard";
import { AdminUsers } from "./components/Admin/AdminUsers";

type WalletBalance = {
  available: number;
  pending: number;
  locked: number;
  lifetime: number;
};
type WalletTx = {
  id: string;
  type: string;
  amount: number;
  status: string;
  campaign?: string;
  date: string;
};
type BankAccount = {
  id: string;
  bankName: string;
  bankCode?: string;
  accountNumber: string;
  accountName: string;
};
type ProfileData = { fullName: string; email: string; phone: string };

export type Screen =
  | "home"
  | "campaigns"
  | "wallet"
  | "profile"
  | "insights"
  | "agency-creators"
  | "campaign-detail";
export type AccountType = "creator" | "agency";

export interface Campaign {
  id: string;
  brand: string;
  brandLogo?: string;
  title: string;
  platform: string;
  deliverable: string;
  compensation: number;
  /** Offer rate (creator_campaigns.rate); same as compensation for offered campaigns */
  rate?: number;
  timeline: string;
  status: string;
  deadline?: string;
  /** ISO string for sorting / nextDeadline */
  deadlineISO?: string;
  offerDate?: string;
  lastFeedback?: string;
  metrics?: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
  };
}

export interface AccountData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  agreeToTerms: boolean;
}

export interface SocialProfile {
  id: string;
  platform: string;
  handle: string;
  followerCount: string;
  isPrimary: boolean;
}

export interface PayoutData {
  country: string;
  payoutMethod: "bank" | "mobile";
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  mobileMoneyNetwork?: string;
  mobileMoneyNumber?: string;
  mpesaNumber?: string;
  confirmed: boolean;
}

export interface Creator {
  id: string;
  name: string;
  platform: string;
  niche: string;
  followers: number;
  engagement: number;
  avgViews: number;
  rate: number;
  status: "active" | "pending" | "inactive";
  campaigns: number;
  earnings: number;
  availableBalance: number;
  activeCampaigns: number;
}

export interface OfferData {
  brand: string;
  brandLogo?: string;
  campaignTitle: string;
  amount: number;
  counterAmount: number;
  deliverables: string[];
  deadline?: string;
  expiresIn?: string;
}

export interface FeedbackData {
  items: string[];
}

export default function App() {
  // Auth state (Supabase session-driven)
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();
  const [signupStep, setSignupStep] = useState<1 | 2 | 3>(1);
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [socialProfiles, setSocialProfiles] = useState<SocialProfile[]>([]);
  const [payoutData, setPayoutData] = useState<PayoutData | null>(null);

  // App state
  const [currentScreen, setCurrentScreen] = useState<Screen>("home");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null,
  );
  const [accountType, setAccountType] = useState<AccountType>("creator");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [currency, setCurrency] = useState<Currency>("NGN");
  const [role, setRole] = useState<"creator" | "admin" | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [walletBalance, setWalletBalance] = useState<WalletBalance>({
    available: 0,
    pending: 0,
    locked: 0,
    lifetime: 0,
  });
  const [transactions, setTransactions] = useState<WalletTx[]>([]);
  const [bankAccount, setBankAccount] = useState<BankAccount | undefined>(
    undefined,
  );
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [refreshSeq, setRefreshSeq] = useState(0);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const ensureReferralAttemptedRef = useRef(false);
  const [referralData, setReferralData] = useState<{
    referralCode: string;
    totalEarnings: number;
    totalReferred: number;
    referrals: Array<{
      id: string;
      name: string;
      joinedDate: string;
      earnings: number;
      status: "active" | "inactive";
    }>;
  }>({
    referralCode: "",
    totalEarnings: 0,
    totalReferred: 0,
    referrals: [],
  });
  const [creatorProfile, setCreatorProfile] =
    useState<CreatorProfileRow | null>(null);
  const [creatorSocial, setCreatorSocial] = useState<CreatorSocialRow[]>([]);
  const [creatorPackages, setCreatorPackages] = useState<CreatorPackageRow[]>(
    [],
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      },
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  // Redirect from /join/:code stores code and sends ?signup=1
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("signup") === "1") {
      setSignupStep(1);
      navigate("/signup");
    }
  }, []);

  // Apply stored referral code after signup (when session exists)
  useEffect(() => {
    if (!session?.access_token) return;
    const code = getStoredReferralCode();
    if (!code?.trim()) return;

    const apply = async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/make-server-8061e72e/referrals/apply`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ referralCode: code.trim() }),
        });
        clearStoredReferralCode();
        if (res.ok) setRefreshSeq((n) => n + 1);
      } catch {
        clearStoredReferralCode();
      }
    };
    apply();
  }, [session?.access_token]);

  const isAuthenticated = !!session;

  useEffect(() => {
    if (!session?.user) {
      setDataLoading(false);
      setDataError(null);
      return;
    }

    const load = async () => {
      setDataLoading(true);
      setDataError(null);
      try {
        // Campaigns
        const { data: ccRows } = await supabase
          .from("creator_campaigns")
          .select(
            "id,status,rate,deadline,offer_date,last_feedback,campaign:campaigns(brand,brand_logo_url,title,platform,deliverable,timeline,compensation)",
          )
          .eq("creator_id", session!.user!.id)
          .order("offer_date", { ascending: false });

        setCampaigns(
          (ccRows ?? []).map((row: any) => {
            const rate = Number(row.rate ?? row.campaign?.compensation ?? 0);
            return {
              id: row.id,
              brand: row.campaign?.brand ?? "—",
              brandLogo: row.campaign?.brand_logo_url ?? undefined,
              title: row.campaign?.title ?? "Untitled",
              platform: row.campaign?.platform ?? "tiktok",
              deliverable: row.campaign?.deliverable ?? "",
              compensation: rate,
              rate,
              timeline: row.campaign?.timeline ?? "",
              status: row.status ?? "offered",
              deadline: row.deadline
                ? new Date(row.deadline).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
                : undefined,
              deadlineISO: row.deadline
                ? typeof row.deadline === "string"
                  ? row.deadline
                  : new Date(row.deadline).toISOString()
                : undefined,
              offerDate: row.offer_date
                ? new Date(row.offer_date).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
                : undefined,
              lastFeedback: row.last_feedback ?? undefined,
            };
          }),
        );

        // Profile
        const [{ data: profileRow }, { data: creatorRow }] = await Promise.all([
          supabase
            .from("profiles")
            .select(
              "full_name,email,phone,referral_code,referral_earnings,referral_count",
            )
            .eq("user_id", session!.user!.id)
            .maybeSingle(),
          supabase
            .from("creators")
            .select("display_name")
            .eq("creator_id", session!.user!.id)
            .maybeSingle(),
        ]);

        setProfile({
          fullName:
            creatorRow?.display_name ??
            profileRow?.full_name ??
            session!.user!.user_metadata?.full_name ??
            "",
          email: profileRow?.email ?? session!.user!.email ?? "",
          phone: profileRow?.phone ?? session!.user!.user_metadata?.phone ?? "",
        });

        let referralCode = (profileRow?.referral_code ?? "").trim();
        if (!referralCode && profileRow) {
          const { data: ensured } = await supabase.rpc("ensure_referral_code");
          referralCode = (ensured ?? "").trim();
        }
        if (referralCode) {
          const { data: refRows } = await supabase
            .from("referrals")
            .select(
              "id,status,created_at,referred_user_id,earned_from_referred",
            )
            .eq("referrer_user_id", session!.user!.id)
            .order("created_at", { ascending: false })
            .limit(50);

          const referredIds = (refRows ?? []).map(
            (r: any) => r.referred_user_id,
          );
          const { data: referredProfiles } = referredIds.length
            ? await supabase
              .from("profiles")
              .select("user_id,full_name")
              .in("user_id", referredIds)
            : { data: [] as any[] };

          const nameById = new Map(
            (referredProfiles ?? []).map((p: any) => [
              p.user_id,
              p.full_name || "New user",
            ]),
          );

          setReferralData({
            referralCode,
            totalEarnings: Number(profileRow?.referral_earnings ?? 0),
            totalReferred: Number(
              profileRow?.referral_count ?? (refRows ?? []).length,
            ),
            referrals: (refRows ?? []).map((r: any) => ({
              id: r.id,
              name: nameById.get(r.referred_user_id) ?? "New user",
              joinedDate: r.created_at
                ? new Date(r.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                })
                : "",
              earnings: Number(r.earned_from_referred ?? 0),
              status: r.status === "active" ? "active" : "inactive",
            })),
          });
        }

        // Bank account (primary)
        const { data: bankRows } = await supabase
          .from("bank_accounts")
          .select(
            "id,bank_name,bank_code,account_number,account_name,is_primary",
          )
          .eq("user_id", session!.user!.id)
          .order("is_primary", { ascending: false })
          .limit(1);
        const b = bankRows?.[0];
        setBankAccount(
          b
            ? {
              id: b.id,
              bankName: b.bank_name,
              bankCode: b.bank_code ?? undefined,
              accountNumber: b.account_number,
              accountName: b.account_name,
            }
            : undefined,
        );

        // Wallet (creators only; agencies may have no wallet)
        const { data: creator } = await supabase
          .from("creators")
          .select("wallet_id")
          .eq("creator_id", session!.user!.id)
          .maybeSingle();
        const walletId = creator?.wallet_id as string | undefined;
        if (walletId) {
          const { data: bal } = await supabase
            .from("wallet_balances")
            .select("*")
            .eq("wallet_id", walletId)
            .maybeSingle();
          setWalletBalance({
            available: Number(bal?.available_balance ?? 0),
            pending: Number(bal?.pending_earnings ?? 0),
            locked: Number(bal?.pending_withdrawals ?? 0),
            lifetime: Number(bal?.lifetime_earned ?? 0),
          });

          const { data: ledgerRows } = await supabase
            .from("wallet_ledger")
            .select(
              "ledger_id,type,amount,status,created_at,creator_campaign_id,cc:creator_campaigns(campaign:campaigns(title))",
            )
            .eq("wallet_id", walletId)
            .order("created_at", { ascending: false })
            .limit(50);

          setTransactions(
            (ledgerRows ?? []).map((l: any) => ({
              id: l.ledger_id,
              type: l.type,
              amount: Number(l.amount),
              status:
                l.status === "completed"
                  ? "cleared"
                  : l.status === "failed"
                    ? "reversed"
                    : "pending",
              campaign: l.cc?.campaign?.title ?? undefined,
              date: l.created_at
                ? new Date(l.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
                : "",
            })),
          );
        }

        // Creator Profile module (creators)
        const [{ data: cp }, { data: csa }, { data: cpkg }] = await Promise.all(
          [
            supabase
              .from("creator_profiles")
              .select("*")
              .eq("user_id", session!.user!.id)
              .maybeSingle(),
            supabase
              .from("creator_social_accounts")
              .select("*")
              .eq("creator_id", session!.user!.id),
            supabase
              .from("creator_packages")
              .select("*")
              .eq("creator_id", session!.user!.id),
          ],
        );
        setCreatorProfile((cp ?? null) as CreatorProfileRow | null);
        setCreatorSocial((csa ?? []) as CreatorSocialRow[]);
        setCreatorPackages((cpkg ?? []) as CreatorPackageRow[]);
      } catch (e) {
        setDataError(e instanceof Error ? e.message : "Failed to load data");
      } finally {
        setDataLoading(false);
      }
    };

    load();
  }, [session?.user?.id, refreshSeq]);

  useEffect(() => {
    if (!session?.user?.id) {
      setRole(null);
      setRoleLoading(false);
      return;
    }

    const fetchRole = async () => {
      setRoleLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role, email")
          .eq("user_id", session.user.id)
          .single();

        if (error) throw error;

        // Solomon Exception: explicitly allow role as admin if email matches
        const isSolomon = data.email === "solomonidrissu@gmail.com";
        const userRole = isSolomon ? "admin" : (data.role as "creator" | "admin");

        setRole(userRole);
      } catch (err) {
        console.error("Error fetching role:", err);
        setRole("creator"); // Fallback
      } finally {
        setRoleLoading(false);
      }
    };

    fetchRole();
  }, [session?.user?.id]);

  // When viewing Profile, ensure referral code exists (generate via RPC if missing) then refetch
  useEffect(() => {
    if (currentScreen !== "profile") {
      ensureReferralAttemptedRef.current = false;
      return;
    }
    if (!session?.user || (referralData.referralCode ?? "").trim()) return;
    if (ensureReferralAttemptedRef.current) return;
    ensureReferralAttemptedRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        await supabase.rpc("ensure_referral_code");
        if (!cancelled) setRefreshSeq((s) => s + 1);
      } catch {
        /* RPC may be missing before migration */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentScreen, session?.user?.id, referralData.referralCode]);

  // referralData is now loaded from Supabase

  const engagementData = [
    {
      date: "Jan 1",
      engagements: 12400,
      views: 45000,
      likes: 8900,
      comments: 2300,
      shares: 1200,
    },
    {
      date: "Jan 8",
      engagements: 15600,
      views: 52000,
      likes: 11200,
      comments: 2800,
      shares: 1600,
    },
    {
      date: "Jan 15",
      engagements: 18900,
      views: 61000,
      likes: 13500,
      comments: 3200,
      shares: 2200,
    },
    {
      date: "Jan 22",
      engagements: 22100,
      views: 68000,
      likes: 15800,
      comments: 3900,
      shares: 2400,
    },
  ];

  const insightsStats = useMemo(() => {
    const submitted = campaigns.filter((c) => c.status === "submitted").length;
    const approved = campaigns.filter((c) =>
      ["approved", "ready_to_post", "posted_submitted"].includes(c.status),
    ).length;
    const published = campaigns.filter((c) =>
      ["posted_verified", "paid"].includes(c.status),
    ).length;
    return {
      postsSubmitted: submitted,
      postsApproved: approved,
      postsPublished: published,
      totalViews: 0,
      totalEngagements: 0,
      avgViewsPerPost: 0,
      engagementRate: 0,
      earningsUnlocked: walletBalance.lifetime,
      earningsPending: walletBalance.pending,
    };
  }, [campaigns, walletBalance.lifetime, walletBalance.pending]);

  const insightsPosts = useMemo(() => {
    const statuses = [
      "submitted",
      "approved",
      "ready_to_post",
      "posted_submitted",
      "posted_verified",
      "paid",
    ];
    return campaigns
      .filter((c) => statuses.includes(c.status))
      .map((c) => {
        const isVerified = ["posted_verified", "paid"].includes(c.status);
        const isPaid = c.status === "paid";
        return {
          id: c.id,
          campaign: c.title,
          platform: c.platform,
          postUrl: "#",
          datePosted: c.offerDate ?? "—",
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          status: (isVerified ? "verified" : "pending_scrape") as
            | "pending_scrape"
            | "verified"
            | "flagged",
          paymentStatus: (isPaid
            ? "paid"
            : isVerified
              ? "unlocked"
              : "locked") as "locked" | "unlocked" | "paid",
          amount: c.rate ?? c.compensation ?? 0,
        };
      });
  }, [campaigns]);

  const workSummary = useMemo(() => {
    const offers = campaigns.filter((c) => c.status === "offered");
    const needsAction = campaigns.filter((c) =>
      ["needs_revision", "ready_to_post"].includes(c.status),
    );
    const active = campaigns.filter((c) =>
      [
        "accepted",
        "in_draft",
        "submitted",
        "approved",
        "ready_to_post",
        "posted_submitted",
      ].includes(c.status),
    );
    const withDeadline = campaigns
      .filter((c) => c.deadlineISO)
      .sort((a, b) => (a.deadlineISO! < b.deadlineISO! ? -1 : 1));
    const next = withDeadline[0];
    const nextDeadline = next
      ? (() => {
        const d = new Date(next.deadlineISO!);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        d.setHours(0, 0, 0, 0);
        const daysLeft = Math.max(
          0,
          Math.ceil((d.getTime() - today.getTime()) / 86400000),
        );
        return {
          campaign: next.title,
          date:
            next.deadline ??
            d.toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
          daysLeft,
        };
      })()
      : undefined;
    return {
      pendingOffers: offers.length,
      needsAction: needsAction.length,
      activeCampaigns: active.length,
      ...(nextDeadline && { nextDeadline }),
    };
  }, [campaigns]);

  const priorityItems = useMemo(() => {
    const items: Array<{
      id: string;
      type: "offer" | "revision" | "post_link" | "proof";
      campaign: string;
      message: string;
      urgent: boolean;
      campaignRef: Campaign;
    }> = [];
    const offers = campaigns.filter((c) => c.status === "offered");
    const needsRevision = campaigns.filter(
      (c) => c.status === "needs_revision",
    );
    const readyToPost = campaigns.filter((c) => c.status === "ready_to_post");
    for (const c of offers) {
      items.push({
        id: c.id,
        type: "offer",
        campaign: c.title,
        message: "New campaign offer - Review and respond",
        urgent: false,
        campaignRef: c,
      });
    }
    for (const c of needsRevision) {
      const deadline = c.deadline ?? "soon";
      items.push({
        id: c.id,
        type: "revision",
        campaign: c.title,
        message: `Content needs revision - Resubmit by ${deadline}`,
        urgent: true,
        campaignRef: c,
      });
    }
    for (const c of readyToPost) {
      items.push({
        id: c.id,
        type: "post_link",
        campaign: c.title,
        message: "Submit your post link",
        urgent: false,
        campaignRef: c,
      });
    }
    return items;
  }, [campaigns]);

  const mockCreators: Creator[] = [
    {
      id: "1",
      name: "Chioma Adeleke",
      platform: "TikTok",
      niche: "Fashion & Lifestyle",
      followers: 125000,
      engagement: 8.5,
      avgViews: 45000,
      rate: 180000,
      status: "active",
      campaigns: 12,
      earnings: 2100000,
      availableBalance: 850000,
      activeCampaigns: 2,
    },
    {
      id: "2",
      name: "Tunde Okafor",
      platform: "Instagram",
      niche: "Tech Reviews",
      followers: 89000,
      engagement: 6.2,
      avgViews: 28000,
      rate: 150000,
      status: "active",
      campaigns: 8,
      earnings: 1200000,
      availableBalance: 320000,
      activeCampaigns: 1,
    },
    {
      id: "3",
      name: "Amara Johnson",
      platform: "YouTube",
      niche: "Beauty & Skincare",
      followers: 210000,
      engagement: 12.3,
      avgViews: 85000,
      rate: 350000,
      status: "active",
      campaigns: 15,
      earnings: 4800000,
      availableBalance: 0,
      activeCampaigns: 0,
    },
  ];

  const [agencyCreators, setAgencyCreators] = useState<Creator[]>(mockCreators);

  // Auth handlers
  const handleAccountComplete = (data: AccountData) => {
    setAccountData(data);
    setSignupStep(2);
  };

  const handleSocialComplete = (profiles: SocialProfile[]) => {
    setSocialProfiles(profiles);
    setSignupStep(3);
  };

  const handlePayoutComplete = async (data: PayoutData) => {
    setPayoutData(data);
    if (!accountData?.email) {
      setSignupStep(1);
      navigate("/login");
      return;
    }

    // If password was provided, create an email+password user.
    // Otherwise, default to magic link.
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: accountData.email,
      password: accountData.password,
      options: {
        data: {
          full_name: accountData.fullName,
          phone: accountData.phone,
          role: "creator", // Default role
        },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      console.error("Sign up failed:", error);
      toast.error(error.message);
      return;
    }

    if (signUpData.session) {
      toast.success("Account created! Logging you in...");
      setSignupStep(1);
      navigate("/app");
    } else {
      // Show success screen (step 4)
      setSignupStep(4);
    }
  };

  const handleBackSignup = () => {
    if (signupStep > 1) {
      setSignupStep((prev) => (prev - 1) as 1 | 2 | 3);
    }
  };

  const switchToLogin = () => {
    setSignupStep(1);
    navigate("/login");
  };

  const switchToSignup = () => {
    setSignupStep(1);
    navigate("/signup");
  };

  // Login is handled by magic link; session updates via onAuthStateChange

  // Navigation handlers
  const handleNavigate = (screen: Screen) => {
    setCurrentScreen(screen);
    setSelectedCampaign(null);
  };

  const handleViewCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setCurrentScreen("campaign-detail");
  };

  const handleToggleAuth = async () => {
    if (isAuthenticated) {
      await supabase.auth.signOut();
      window.location.href = "/login";
    }
  };

  const handleRetryLoad = () => {
    setDataError(null);
    setRefreshSeq((n) => n + 1);
  };

  const handleWithdraw = async (
    amount: number,
    note?: string,
    opts?: { test?: boolean },
  ): Promise<void> => {
    if (!session?.access_token) throw new Error("Not authenticated");
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/make-server-8061e72e/payments/withdraw/initiate`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        amount,
        currency,
        note,
        bank_account_id: bankAccount?.id ?? null,
        test: opts?.test ?? false,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      toast.error(data?.error ?? "Withdrawal failed");
      throw new Error(data?.error ?? "Withdrawal failed");
    }
    toast.success("Withdrawal initiated");
    setRefreshSeq((n) => n + 1);
  };

  const handleSaveProfile = async (next: ProfileData) => {
    if (!session?.user) return;
    try {
      setProfile(next);
      await Promise.all([
        supabase
          .from("profiles")
          .update({
            full_name: next.fullName,
            email: next.email,
            phone: next.phone,
          })
          .eq("user_id", session.user.id),
        supabase
          .from("creators")
          .update({ display_name: next.fullName })
          .eq("creator_id", session.user.id),
      ]);
      toast.success("Profile saved");
      setRefreshSeq((n) => n + 1);
    } catch {
      toast.error("Failed to save profile");
    }
  };

  const handleSaveBank = async (next: BankAccount) => {
    if (!session?.user) return;
    try {
      setBankAccount(next);
      await supabase.from("bank_accounts").upsert({
        id: next.id ? next.id : undefined,
        user_id: session.user.id,
        bank_name: next.bankName,
        bank_code: next.bankCode ?? null,
        account_number: next.accountNumber,
        account_name: next.accountName,
        is_primary: true,
      });
      toast.success("Bank details saved");
      setRefreshSeq((n) => n + 1);
    } catch {
      toast.error("Failed to save bank details");
    }
  };

  const handleSaveCreatorProfile = async (data: {
    display_name: string;
    location: string;
    niches: string[];
    audience_region: string;
    gender: string;
  }) => {
    if (!session?.user) return;
    try {
      const existing = creatorProfile;
      const row = {
        user_id: session.user.id,
        display_name: data.display_name,
        location: data.location,
        niches: data.niches,
        audience_region: data.audience_region,
        gender: data.gender || null,
        title: existing?.title ?? "Creator",
        bio: existing?.bio ?? null,
        languages: existing?.languages?.length ? existing.languages : ["English"],
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from("creator_profiles")
        .upsert(row, { onConflict: "user_id" });
      if (error) throw error;
      await supabase
        .from("creators")
        .update({
          display_name: data.display_name,
          updated_at: new Date().toISOString(),
        })
        .eq("creator_id", session.user.id);
      toast.success("Creator profile saved");
      setRefreshSeq((n) => n + 1);
    } catch {
      toast.error("Failed to save creator profile");
    }
  };

  const handleToggleAccountType = () => {
    setAccountType((prev) => (prev === "creator" ? "agency" : "creator"));
  };

  const handleDeleteAgencyCreator = (creatorId: string) => {
    setAgencyCreators((prev) => prev.filter((c) => c.id !== creatorId));
  };

  const handleAddAgencyCreator = (data: {
    displayName: string;
    niche: string;
    baseRate: number;
    currency: Currency;
    socialAccounts: Array<{
      platform: string;
      handle: string;
      followers: number;
      rateOverride?: number;
    }>;
  }) => {
    const primaryAccount = data.socialAccounts[0];
    const totalFollowers = data.socialAccounts.reduce(
      (sum, acc) => sum + acc.followers,
      0,
    );

    const newCreator: Creator = {
      id: Date.now().toString(),
      name: data.displayName,
      platform: primaryAccount?.platform ?? "tiktok",
      niche: data.niche,
      followers: totalFollowers,
      engagement: 5.0,
      avgViews: Math.round(totalFollowers * 0.3),
      rate: data.baseRate,
      status: "pending",
      campaigns: 0,
      earnings: 0,
      availableBalance: 0,
      activeCampaigns: 0,
    };

    setAgencyCreators((prev) => [...prev, newCreator]);
    toast.success("Creator added");
  };

  const handleSeedDemoOffers = async (): Promise<{
    ok: boolean;
    error?: string;
  }> => {
    const { data, error } = await supabase.rpc("seed_demo_campaigns");
    if (error) return { ok: false, error: error.message };
    const res =
      (data as { ok?: boolean; error?: string; message?: string }) ?? {};
    if (res.ok) setRefreshSeq((n) => n + 1);
    return { ok: !!res.ok, error: res.error };
  };

  const handleAcceptOffer = async (amount: number) => {
    if (!selectedCampaign?.id || !session?.user) return;
    await supabase
      .from("creator_campaigns")
      .update({
        status: "accepted",
        rate: amount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedCampaign.id)
      .eq("creator_id", session.user.id);
    setRefreshSeq((n) => n + 1);
    setCurrentScreen("campaigns");
    setSelectedCampaign(null);
  };

  const handleDeclineOffer = async () => {
    if (!selectedCampaign?.id || !session?.user) return;
    await supabase
      .from("creator_campaigns")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", selectedCampaign.id)
      .eq("creator_id", session.user.id);
    setRefreshSeq((n) => n + 1);
    setCurrentScreen("campaigns");
    setSelectedCampaign(null);
  };

  const handleSubmitForReview = async () => {
    if (!selectedCampaign?.id || !session?.user) return;
    await supabase
      .from("creator_campaigns")
      .update({ status: "submitted", updated_at: new Date().toISOString() })
      .eq("id", selectedCampaign.id)
      .eq("creator_id", session.user.id);
    setRefreshSeq((n) => n + 1);
    setSelectedCampaign((prev) =>
      prev ? { ...prev, status: "submitted" } : null,
    );
  };

  const handlePostConfirm = () => {
    setRefreshSeq((n) => n + 1);
    setCurrentScreen("campaigns");
    setSelectedCampaign(null);
  };

  const handleDemoApprove = async () => {
    if (!selectedCampaign?.id || !session?.user) return;
    await supabase
      .from("creator_campaigns")
      .update({ status: "approved", updated_at: new Date().toISOString() })
      .eq("id", selectedCampaign.id)
      .eq("creator_id", session.user.id);
    setRefreshSeq((n) => n + 1);
    setSelectedCampaign((prev) =>
      prev ? { ...prev, status: "approved" } : null,
    );
  };

  // Render auth flow
  if (roleLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const AdminView = () => {
    const location = useLocation();
    const navigate = useNavigate();

    if (roleLoading) return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;
    if (role !== "admin") return <Navigate to="/app" replace />;

    return (
      <AdminLayout currentPath={location.pathname} onNavigate={(path) => navigate(path)}>
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/users" element={<AdminUsers />} />
          <Route path="/referrals" element={<div className="p-8 text-center text-slate-500">Referrals Management (Coming Soon)</div>} />
          <Route path="/analytics" element={<div className="p-8 text-center text-slate-500">Platform Analytics (Coming Soon)</div>} />
          <Route path="/settings" element={<div className="p-8 text-center text-slate-500">Admin Settings (Coming Soon)</div>} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </AdminLayout>
    );
  };

  const CreatorView = () => {
    const navigate = useNavigate();
    // Only allow access if user has a session. Role doesn't block admins anymore.

    return (
      <div className="min-h-screen bg-[#0A0A0A] pb-20">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-sm border-b border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleNavigate("home")}
                className="flex items-center gap-3 text-left hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A] rounded-lg"
              >
                <img src={logo} alt="Dobble Tap" className="h-8 w-8" />
                <span className="text-lg font-bold text-white">Dobble Tap</span>
              </button>
              {accountType === "agency" && (
                <span className="ml-2 px-2 py-0.5 bg-purple-500/10 text-purple-400 text-xs font-semibold rounded border border-purple-500/20">
                  AGENCY
                </span>
              )}
              {role === "admin" && (
                <button
                  onClick={() => navigate("/admin")}
                  className="ml-4 px-3 py-1 bg-blue-600/10 text-blue-400 text-xs font-bold rounded-full border border-blue-600/20 hover:bg-blue-600/20 transition-colors"
                >
                  ADMIN
                </button>
              )}
            </div>
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="p-2 text-slate-400 hover:text-white transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </header>

        <main>
          {isAuthenticated && dataError && currentScreen !== "campaign-detail" && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center min-h-[40vh]">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                <AlertCircle className="w-7 h-7 text-red-400" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">Couldn’t load data</h2>
              <p className="text-sm text-slate-400 text-center max-w-md mb-6">{dataError}</p>
              <button
                type="button"
                onClick={handleRetryLoad}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Try again
              </button>
            </div>
          )}

          {isAuthenticated && !dataError && dataLoading && currentScreen !== "campaign-detail" && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                <span className="text-sm text-slate-400">Loading…</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-32 bg-white/[0.06] rounded-xl" />
                <Skeleton className="h-32 bg-white/[0.06] rounded-xl" />
                <Skeleton className="h-32 bg-white/[0.06] rounded-xl" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-4 w-48 bg-white/[0.06] rounded" />
                <Skeleton className="h-24 bg-white/[0.06] rounded-xl" />
                <Skeleton className="h-24 bg-white/[0.06] rounded-xl" />
              </div>
            </div>
          )}

          {(!isAuthenticated || !dataError) && (!dataLoading || currentScreen === "campaign-detail") && (
            <>
              {currentScreen === "home" && (
                <Home
                  walletBalance={walletBalance}
                  workSummary={workSummary}
                  engagementData={engagementData}
                  priorityItems={priorityItems}
                  onViewOffers={() => setCurrentScreen("campaigns")}
                  onViewNeedsAction={() => setCurrentScreen("campaigns")}
                  onViewCampaigns={() => setCurrentScreen("campaigns")}
                  onHandlePriority={(item) => {
                    const c = (item as { campaignRef?: Campaign }).campaignRef;
                    if (c) {
                      setSelectedCampaign(c);
                      setCurrentScreen("campaign-detail");
                    }
                  }}
                  onWithdraw={() => setCurrentScreen("wallet")}
                  onNavigateToWallet={() => setCurrentScreen("wallet")}
                  currency={currency}
                />
              )}

              {currentScreen === "campaigns" && accountType === "agency" && (
                <AgencyCampaignRequests
                  userId={session?.user?.id}
                  onRefresh={() => setRefreshSeq((n) => n + 1)}
                  refreshTrigger={refreshSeq}
                  currency={currency}
                />
              )}
              {currentScreen === "campaigns" && accountType === "creator" && (
                <Campaigns
                  campaigns={campaigns}
                  walletBalance={walletBalance}
                  onViewCampaign={handleViewCampaign}
                  onWithdraw={() => setCurrentScreen("wallet")}
                  onNavigateToWallet={() => setCurrentScreen("wallet")}
                  onSeedDemo={handleSeedDemoOffers}
                  currency={currency}
                />
              )}

              {currentScreen === "wallet" && (
                <Wallet
                  balance={walletBalance}
                  transactions={transactions}
                  onWithdraw={handleWithdraw}
                  isAuthenticated={isAuthenticated}
                  currency={currency}
                  bankAccount={bankAccount}
                  onAddBankDetails={() => setCurrentScreen("profile")}
                />
              )}

              {currentScreen === "profile" && (
                <Profile
                  referralData={referralData}
                  isAuthenticated={isAuthenticated}
                  onRequestAuth={(action) =>
                    console.log("Request auth:", action)
                  }
                  currency={currency}
                  onCurrencyChange={setCurrency}
                  profile={profile || undefined}
                  bankAccount={bankAccount}
                  onSaveProfile={handleSaveProfile}
                  onSaveBankAccount={handleSaveBank}
                  accountType={accountType}
                  creatorProfile={creatorProfile}
                  creatorSocial={creatorSocial}
                  creatorPackages={creatorPackages}
                  onRefreshCreatorProfile={() => setRefreshSeq((n) => n + 1)}
                  userId={session?.user?.id ?? ""}
                  creatorId={
                    accountType === "creator" ? (session?.user?.id ?? "") : ""
                  }
                  onSaveCreatorProfile={
                    accountType === "creator"
                      ? handleSaveCreatorProfile
                      : undefined
                  }
                  role={role}
                  onLogout={handleToggleAuth}
                  onSwitchToAdmin={role === "admin" ? () => navigate("/admin") : undefined}
                  managedCreators={
                    accountType === "agency"
                      ? agencyCreators.map((c) => ({
                        id: c.id,
                        displayName: c.name,
                        niche: c.niche,
                        baseRate: c.rate,
                        currency,
                        socialAccounts: [
                          {
                            id: `${c.id}-primary`,
                            platform: (c.platform.toLowerCase() as "tiktok" | "instagram" | "youtube") || "tiktok",
                            handle: c.name.toLowerCase().replace(/\s+/g, ""),
                            followers: c.followers,
                          },
                        ],
                        status: c.status === "active" ? "active" : "inactive",
                      }))
                      : undefined
                  }
                  onAddCreator={
                    accountType === "agency" ? handleAddAgencyCreator : undefined
                  }
                  onDeleteCreator={
                    accountType === "agency"
                      ? handleDeleteAgencyCreator
                      : undefined
                  }
                />
              )}

              {currentScreen === "insights" && (
                <Insights
                  stats={insightsStats}
                  posts={insightsPosts}
                  engagementData={engagementData}
                  currency={currency}
                />
              )}

              {currentScreen === "agency-creators" &&
                accountType === "agency" && (
                  <AgencyCreators
                    creators={agencyCreators}
                    onSelectCreator={(creator) =>
                      console.log("Select creator:", creator)
                    }
                    onAddCreator={handleAddAgencyCreator}
                    onDeleteCreator={handleDeleteAgencyCreator}
                    currency={currency}
                  />
                )}

              {currentScreen === "campaign-detail" && selectedCampaign && (
                <CampaignDetail
                  campaign={selectedCampaign}
                  onBack={() => setCurrentScreen("campaigns")}
                  onAccept={handleAcceptOffer}
                  onDecline={handleDeclineOffer}
                  onUploadSubmit={handleSubmitForReview}
                  onFeedbackUpload={() => { }}
                  onPostConfirm={handlePostConfirm}
                  onDemoApprove={handleDemoApprove}
                  currency={currency}
                />
              )}
            </>
          )}
        </main>

        {currentScreen !== "campaign-detail" && (
          <MobileBottomNav
            currentScreen={currentScreen}
            accountType={accountType}
            onNavigate={handleNavigate}
          />
        )}

        <MobileNav
          isOpen={isMobileNavOpen}
          onClose={() => setIsMobileNavOpen(false)}
          currentScreen={currentScreen}
          accountType={accountType}
          onNavigate={handleNavigate}
          isAuthenticated={isAuthenticated}
          onToggleAuth={handleToggleAuth}
          onToggleAccountType={handleToggleAccountType}
          role={role}
          onNavigateToAdmin={() => navigate("/admin")}
        />
      </div>
    );
  };

  return (
    <>
      <Routes>
        <Route path="/login" element={isAuthenticated ? (role === "admin" ? <Navigate to="/admin" replace /> : <Navigate to="/app" replace />) : <LoginPage onSwitchToSignup={switchToSignup} />} />
        <Route path="/signup" element={isAuthenticated ? (role === "admin" ? <Navigate to="/admin" replace /> : <Navigate to="/app" replace />) : (
          signupStep === 1 ? <SignupAccountPage onComplete={handleAccountComplete} onSwitchToLogin={switchToLogin} /> :
            signupStep === 2 ? <SignupSocialPage initialProfiles={socialProfiles} onComplete={handleSocialComplete} onBack={handleBackSignup} /> :
              signupStep === 3 ? <SignupPayoutPage onComplete={handlePayoutComplete} onBack={handleBackSignup} /> :
                <SignupSuccessPage email={accountData?.email ?? ""} onContinueToLogin={switchToLogin} />
        )} />
        <Route path="/admin/*" element={<AdminView />} />
        <Route path="/app/*" element={<CreatorView />} />
        <Route path="/" element={isAuthenticated ? (role === "admin" ? <Navigate to="/admin" replace /> : <Navigate to="/app" replace />) : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster richColors position="top-center" />
    </>
  );
}
