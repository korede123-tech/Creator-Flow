import {
  TrendingUp,
  Eye,
  Heart,
  Users,
  ArrowUpRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  Wallet as WalletIcon,
  Briefcase,
} from "lucide-react";
import { motion } from "motion/react";
import { Campaign } from "../App";
import { formatCurrency, Currency } from "../utils/currency";
import { EngagementChart } from "./EngagementChart";

interface HomeProps {
  walletBalance: {
    available: number;
    pending: number;
    lifetime: number;
  };
  workSummary: {
    pendingOffers: number;
    needsAction: number;
    activeCampaigns: number;
    nextDeadline?: {
      campaign: string;
      date: string;
      daysLeft: number;
    };
  };
  engagementData: Array<{
    date: string;
    engagements: number;
    views: number;
    likes: number;
    comments: number;
    shares: number;
  }>;
  priorityItems: Array<{
    id: string;
    type: "offer" | "revision" | "post_link" | "proof";
    campaign: string;
    message: string;
    urgent: boolean;
    campaignRef?: Campaign;
  }>;
  onViewOffers: () => void;
  onViewNeedsAction: () => void;
  onViewCampaigns: () => void;
  onHandlePriority: (item: {
    id: string;
    type: string;
    campaignRef?: Campaign;
  }) => void;
  onWithdraw: () => void;
  onNavigateToWallet: () => void;
  currency?: Currency;
}

export function Home({
  walletBalance,
  workSummary,
  engagementData,
  priorityItems,
  onViewOffers,
  onViewNeedsAction,
  onViewCampaigns,
  onHandlePriority,
  onWithdraw,
  onNavigateToWallet,
  currency = "NGN",
}: HomeProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Wallet Summary Strip */}
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

      {/* Work Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onViewOffers}
          className="bg-[#0D0D0D]/50 border border-white/[0.06] rounded-xl p-3 sm:p-5 cursor-pointer hover:border-white/[0.12] transition-all group"
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#0ea5e9]/10 border border-[#0ea5e9]/20 flex items-center justify-center">
              <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-[#0ea5e9]" />
            </div>
            {workSummary.pendingOffers > 0 && (
              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-[#0ea5e9] text-white rounded-md text-xs font-bold">
                {workSummary.pendingOffers}
              </span>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
            {workSummary.pendingOffers}
          </div>
          <div className="text-xs sm:text-sm text-slate-400">
            Pending Offers
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          onClick={onViewNeedsAction}
          className="bg-[#0D0D0D]/50 border border-white/[0.06] rounded-xl p-3 sm:p-5 cursor-pointer hover:border-white/[0.12] transition-all group"
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
            </div>
            {workSummary.needsAction > 0 && (
              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-red-500 text-white rounded-md text-xs font-bold">
                {workSummary.needsAction}
              </span>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
            {workSummary.needsAction}
          </div>
          <div className="text-xs sm:text-sm text-slate-400">Needs Action</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={onViewCampaigns}
          className="bg-[#0D0D0D]/50 border border-white/[0.06] rounded-xl p-3 sm:p-5 cursor-pointer hover:border-white/[0.12] transition-all group col-span-2 lg:col-span-1"
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
            {workSummary.activeCampaigns}
          </div>
          <div className="text-xs sm:text-sm text-slate-400">
            Active Campaigns
          </div>
        </motion.div>
      </div>

      {/* Next Deadline Card */}
      {workSummary.nextDeadline && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-4 sm:mb-6 lg:mb-8 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4 sm:p-5"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white mb-1">
                Next Deadline
              </div>
              <div className="text-xs text-slate-400 truncate">
                {workSummary.nextDeadline.campaign}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-xl sm:text-2xl font-bold text-amber-400">
                {workSummary.nextDeadline.daysLeft}d
              </div>
              <div className="text-xs text-slate-500">
                {workSummary.nextDeadline.date}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Engagement Progress Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-4 sm:mb-6 lg:mb-8"
      >
        <h2 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">
          Engagement Overview
        </h2>
        <EngagementChart
          data={engagementData}
          defaultMetric="engagements"
          defaultRange="30d"
        />
      </motion.div>

      {/* Priority List */}
      {priorityItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h2 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">
            Priority Actions
          </h2>
          <div className="space-y-3">
            {priorityItems.slice(0, 3).map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + index * 0.05 }}
                className="bg-[#0D0D0D]/50 border border-white/[0.06] rounded-xl p-4 sm:p-5"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0 w-full">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${item.urgent ? "bg-red-400 animate-pulse" : "bg-amber-400"}`}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white mb-1 break-words">
                        {item.campaign}
                      </div>
                      <div className="text-xs text-slate-400 break-words">
                        {item.message}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onHandlePriority(item)}
                    className="w-full sm:w-auto px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-white/90 transition-colors flex-shrink-0 whitespace-nowrap"
                  >
                    {item.type === "offer" && "Review Offer"}
                    {item.type === "revision" && "Fix & Resubmit"}
                    {item.type === "post_link" && "Submit Link"}
                    {item.type === "proof" && "Upload Proof"}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
