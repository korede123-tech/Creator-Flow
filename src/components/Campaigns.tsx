import {
  DollarSign,
  Clock,
  ArrowUpRight,
  ChevronRight,
  Briefcase,
  AlertCircle,
  FlaskConical,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Campaign } from "../App";
import { useState } from "react";
import { formatCurrency, Currency } from "../utils/currency";

interface CampaignsProps {
  campaigns: Campaign[];
  walletBalance: {
    available: number;
    pending: number;
    lifetime: number;
  };
  onViewCampaign: (campaign: Campaign) => void;
  onWithdraw: () => void;
  onNavigateToWallet: () => void;
  onSeedDemo?: () => Promise<{ ok: boolean; error?: string }>;
  currency?: Currency;
}

type TabType = "offers" | "active" | "needsAction" | "completed";

export function Campaigns({
  campaigns,
  walletBalance,
  onViewCampaign,
  onWithdraw,
  onNavigateToWallet,
  onSeedDemo,
  currency,
}: CampaignsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("offers");
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState("");

  const offers = campaigns.filter((c) => c.status === "offered");
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
  const needsAction = campaigns.filter((c) =>
    ["needs_revision", "ready_to_post"].includes(c.status),
  );
  const completed = campaigns.filter((c) =>
    ["posted_verified", "paid"].includes(c.status),
  );

  const getTabCampaigns = () => {
    switch (activeTab) {
      case "offers":
        return offers;
      case "active":
        return active;
      case "needsAction":
        return needsAction;
      case "completed":
        return completed;
    }
  };

  const handleSeedDemo = async () => {
    if (!onSeedDemo) return;
    setSeedError("");
    setSeeding(true);
    try {
      const res = await onSeedDemo();
      if (!res.ok) setSeedError(res.error ?? "Failed to load demo offers");
    } finally {
      setSeeding(false);
    }
  };

  const getPlatformBadgeColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "tiktok":
        return "bg-pink-500/10 text-pink-400 border-pink-500/20";
      case "instagram":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "youtube":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const getWorkInMotionStep = (
    status: string,
  ): { label: string; color: string } => {
    const steps: Record<string, { label: string; color: string }> = {
      offered: {
        label: "New offer",
        color: "bg-[#0ea5e9]/10 text-[#0ea5e9] border-[#0ea5e9]/20",
      },
      accepted: {
        label: "Accepted",
        color: "bg-purple-400/10 text-purple-400 border-purple-400/20",
      },
      in_draft: {
        label: "Drafting",
        color: "bg-amber-400/10 text-amber-400 border-amber-400/20",
      },
      submitted: {
        label: "Under review",
        color: "bg-amber-400/10 text-amber-400 border-amber-400/20",
      },
      needs_revision: {
        label: "Needs revision",
        color: "bg-red-400/10 text-red-400 border-red-400/20",
      },
      approved: {
        label: "Approved",
        color: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
      },
      ready_to_post: {
        label: "Ready to post",
        color: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
      },
      posted_submitted: {
        label: "Verifying post",
        color: "bg-amber-400/10 text-amber-400 border-amber-400/20",
      },
      posted_verified: {
        label: "Post verified",
        color: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
      },
      paid: {
        label: "Paid",
        color: "bg-slate-400/10 text-slate-400 border-slate-400/20",
      },
    };
    return (
      steps[status] || {
        label: status,
        color: "bg-slate-400/10 text-slate-400 border-slate-400/20",
      }
    );
  };

  const getActionButton = (campaign: Campaign) => {
    const buttonClass =
      "px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 justify-center";

    switch (campaign.status) {
      case "offered":
        return (
          <button
            type="button"
            onClick={() => onViewCampaign(campaign)}
            className={`${buttonClass} bg-white text-black hover:bg-white/90`}
          >
            <span className="hidden sm:inline">View Offer</span>
            <span className="sm:hidden">View</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        );
      case "accepted":
      case "in_draft":
        return (
          <button
            onClick={() => onViewCampaign(campaign)}
            className={`${buttonClass} bg-[#0ea5e9] text-white hover:bg-[#0ea5e9]/90 w-full sm:w-auto`}
          >
            <span className="hidden sm:inline">Upload Content</span>
            <span className="sm:hidden">Upload</span>
          </button>
        );
      case "submitted":
        return (
          <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400 font-medium flex items-center gap-1.5 justify-center w-full sm:w-auto">
            <div className="w-1 h-1 rounded-full bg-amber-400 animate-pulse"></div>
            <span className="hidden sm:inline">Under Review</span>
            <span className="sm:hidden">Review</span>
          </div>
        );
      case "needs_revision":
        return (
          <button
            onClick={() => onViewCampaign(campaign)}
            className={`${buttonClass} bg-red-500 text-white hover:bg-red-600 w-full sm:w-auto`}
          >
            <AlertCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Fix & Resubmit</span>
            <span className="sm:hidden">Fix</span>
          </button>
        );
      case "approved":
      case "ready_to_post":
        return (
          <button
            className={`${buttonClass} bg-emerald-500 text-white hover:bg-emerald-600 w-full sm:w-auto`}
          >
            <span className="hidden sm:inline">Post Now</span>
            <span className="sm:hidden">Post</span>
          </button>
        );
      case "posted_submitted":
        return (
          <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400 font-medium w-full sm:w-auto text-center">
            Verifying...
          </div>
        );
      case "posted_verified":
        return (
          <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400 font-medium w-full sm:w-auto text-center">
            Verified
          </div>
        );
      case "paid":
        return (
          <button
            className={`${buttonClass} text-slate-400 hover:text-white transition-colors w-full sm:w-auto`}
          >
            <span className="hidden sm:inline">View Receipt</span>
            <span className="sm:hidden">Receipt</span>
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Slim Wallet Summary */}
      <div className="mb-4 sm:mb-6 lg:mb-8 bg-[#0D0D0D]/50 border border-white/[0.06] rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-4 sm:gap-8 w-full sm:w-auto">
            <div>
              <div className="text-xs text-slate-500 mb-1">Available</div>
              <div className="text-xl sm:text-2xl font-bold text-white">
                {formatCurrency(walletBalance.available, currency)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Pending</div>
              <div className="text-base sm:text-lg font-semibold text-amber-400">
                {formatCurrency(walletBalance.pending, currency)}
              </div>
            </div>
            <div className="hidden sm:block h-10 w-px bg-white/[0.06]"></div>
            <div className="col-span-2 sm:col-span-1">
              <div className="text-xs text-slate-500 mb-1">Lifetime</div>
              <div className="text-base sm:text-lg font-semibold text-emerald-400">
                {formatCurrency(walletBalance.lifetime, currency)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={onWithdraw}
              className="flex-1 sm:flex-none px-4 py-2 sm:py-2.5 bg-white text-black rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors"
            >
              Withdraw
            </button>
            <button
              onClick={onNavigateToWallet}
              className="flex-1 sm:flex-none px-4 py-2 sm:py-2.5 text-slate-400 text-sm font-medium hover:text-white transition-colors flex items-center justify-center gap-1.5 border border-white/[0.06] rounded-lg sm:border-0"
            >
              <span className="hidden sm:inline">View Wallet</span>
              <span className="sm:hidden">Wallet</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Campaign Inbox */}
      <div>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Campaigns
          </h1>
          <div className="text-xs sm:text-sm text-slate-500">
            {campaigns.length} total
          </div>
        </div>

        {/* Tabs - Horizontal scroll on mobile */}
        <div className="flex items-center gap-1 sm:gap-2 mb-4 sm:mb-6 border-b border-white/[0.06] pb-px overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab("offers")}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors relative ${
              activeTab === "offers"
                ? "text-white"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            Offers{" "}
            {offers.length > 0 && (
              <span className="ml-1 sm:ml-1.5 px-1.5 py-0.5 bg-[#0ea5e9] text-white rounded text-xs font-bold">
                {offers.length}
              </span>
            )}
            {activeTab === "offers" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab("active")}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors relative ${
              activeTab === "active"
                ? "text-white"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            Active {active.length > 0 && `(${active.length})`}
            {activeTab === "active" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab("needsAction")}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors relative ${
              activeTab === "needsAction"
                ? "text-white"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            <span className="hidden sm:inline">Needs Action</span>
            <span className="sm:hidden">Action</span>
            {needsAction.length > 0 && (
              <span className="ml-1 sm:ml-1.5 px-1.5 py-0.5 bg-red-500 text-white rounded text-xs font-bold">
                {needsAction.length}
              </span>
            )}
            {activeTab === "needsAction" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors relative ${
              activeTab === "completed"
                ? "text-white"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            Completed {completed.length > 0 && `(${completed.length})`}
            {activeTab === "completed" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
              />
            )}
          </button>
        </div>

        {/* Campaign Cards */}
        <AnimatePresence mode="wait">
          {getTabCampaigns().length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 sm:py-20 text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-6 h-6 text-slate-600" />
              </div>
              <h3 className="text-sm sm:text-base font-medium text-white mb-1">
                No campaigns here
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mb-4">
                {activeTab === "offers" && "New offers will appear here"}
                {activeTab === "active" &&
                  "Accepted campaigns will show up here"}
                {activeTab === "needsAction" && "All caught up!"}
                {activeTab === "completed" &&
                  "Completed campaigns will be listed here"}
              </p>
              {activeTab === "offers" && onSeedDemo && (
                <>
                  {seedError && (
                    <div className="mb-4 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm max-w-md mx-auto">
                      {seedError}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleSeedDemo}
                    disabled={seeding}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#0ea5e9] text-white rounded-lg text-sm font-semibold hover:bg-[#0ea5e9]/90 transition-colors disabled:opacity-50"
                  >
                    <FlaskConical className="w-4 h-4" />
                    {seeding ? "Loading…" : "Load demo offers"}
                  </button>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              {getTabCampaigns().map((campaign, index) => {
                const workStep = getWorkInMotionStep(campaign.status);
                return (
                  <motion.div
                    key={campaign.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => onViewCampaign(campaign)}
                    className="group bg-[#0D0D0D]/50 border border-white/[0.06] hover:border-white/[0.12] rounded-xl p-4 sm:p-5 cursor-pointer transition-all"
                  >
                    {/* Mobile Layout - Stack everything */}
                    <div className="sm:hidden space-y-3">
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-sm font-semibold text-white group-hover:text-[#0ea5e9] transition-colors flex-1 min-w-0">
                            {campaign.title}
                          </h3>
                          <div className="text-base font-bold text-white whitespace-nowrap">
                            {formatCurrency(campaign.compensation, currency)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs font-medium border ${getPlatformBadgeColor(campaign.platform)}`}
                          >
                            {campaign.platform}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs font-medium border ${workStep.color}`}
                          >
                            {workStep.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                          <span className="truncate">{campaign.brand}</span>
                          <span className="flex items-center gap-1 whitespace-nowrap">
                            <Clock className="w-3 h-3" />
                            {campaign.deadline}
                          </span>
                        </div>
                      </div>
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full"
                      >
                        {getActionButton(campaign)}
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden sm:flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-base font-semibold text-white group-hover:text-[#0ea5e9] transition-colors truncate">
                            {campaign.title}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs font-medium border ${getPlatformBadgeColor(campaign.platform)}`}
                          >
                            {campaign.platform}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs font-medium border ${workStep.color}`}
                          >
                            {workStep.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span>{campaign.brand}</span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            Due {campaign.deadline}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-xl font-bold text-white">
                            {formatCurrency(campaign.compensation, currency)}
                          </div>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          {getActionButton(campaign)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
