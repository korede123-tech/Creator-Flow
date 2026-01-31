import {
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  DollarSign,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { formatCurrency, Currency } from "../utils/currency";
import { InsightsOverview } from "./InsightsOverview";

interface InsightsProps {
  stats: {
    postsSubmitted: number;
    postsApproved: number;
    postsPublished: number;
    totalViews: number;
    totalEngagements: number;
    avgViewsPerPost: number;
    engagementRate: number;
    earningsUnlocked: number;
    earningsPending: number;
  };
  posts: Array<{
    id: string;
    campaign: string;
    platform: string;
    postUrl: string;
    datePosted: string;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    status: "pending_scrape" | "verified" | "flagged";
    paymentStatus: "locked" | "unlocked" | "paid";
    amount: number;
  }>;
  engagementData: Array<{
    date: string;
    engagements: number;
    views: number;
    likes: number;
    comments: number;
    shares: number;
  }>;
  currency?: Currency;
}

type TabType = "overview" | "posts" | "earnings" | "benchmarks";

export function Insights({
  stats,
  posts,
  engagementData,
  currency,
}: InsightsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const getPlatformBadge = (platform: string) => {
    const colors =
      {
        tiktok: "bg-pink-500/10 text-pink-400 border-pink-500/20",
        instagram: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        youtube: "bg-red-500/10 text-red-400 border-red-500/20",
      }[platform.toLowerCase()] ||
      "bg-slate-500/10 text-slate-400 border-slate-500/20";

    return (
      <span
        className={`px-2 py-0.5 rounded-md text-xs font-medium border ${colors}`}
      >
        {platform}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles =
      {
        pending_scrape: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        verified: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        flagged: "bg-red-500/10 text-red-400 border-red-500/20",
      }[status] || "bg-slate-500/10 text-slate-400 border-slate-500/20";

    return (
      <span
        className={`px-2 py-0.5 rounded-md text-xs font-medium border ${styles}`}
      >
        {status.replace("_", " ")}
      </span>
    );
  };

  const getPaymentBadge = (paymentStatus: string) => {
    const styles =
      {
        locked: "bg-slate-500/10 text-slate-400 border-slate-500/20",
        unlocked: "bg-[#0ea5e9]/10 text-[#0ea5e9] border-[#0ea5e9]/20",
        paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      }[paymentStatus] || "bg-slate-500/10 text-slate-400 border-slate-500/20";

    return (
      <span
        className={`px-2 py-0.5 rounded-md text-xs font-medium border ${styles}`}
      >
        {paymentStatus}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-white mb-8">Insights</h1>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-white/[0.06] pb-px">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
            activeTab === "overview"
              ? "text-white"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          Overview
          {activeTab === "overview" && (
            <motion.div
              layoutId="insightsTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab("posts")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
            activeTab === "posts"
              ? "text-white"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          Posts
          {activeTab === "posts" && (
            <motion.div
              layoutId="insightsTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab("earnings")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
            activeTab === "earnings"
              ? "text-white"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          Earnings
          {activeTab === "earnings" && (
            <motion.div
              layoutId="insightsTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab("benchmarks")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
            activeTab === "benchmarks"
              ? "text-white"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          Benchmarks
          {activeTab === "benchmarks" && (
            <motion.div
              layoutId="insightsTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
            />
          )}
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <InsightsOverview
          metrics={stats}
          engagementData={engagementData}
          secondaryInsights={{
            completionRate: 85,
            avgTimeToPost: 4,
            verificationSuccessRate: 92,
          }}
          currency={currency}
        />
      )}

      {/* Posts Tab */}
      {activeTab === "posts" && (
        <div className="space-y-3">
          {posts.length === 0 ? (
            <div className="bg-[#0D0D0D]/50 border border-white/[0.06] rounded-xl p-12 text-center">
              <Eye className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-sm text-slate-400">No posts yet</p>
            </div>
          ) : (
            posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="bg-[#0D0D0D]/50 border border-white/[0.06] rounded-xl p-5"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm font-semibold text-white truncate">
                        {post.campaign}
                      </h3>
                      {getPlatformBadge(post.platform)}
                      {getStatusBadge(post.status)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{post.datePosted}</span>
                      {post.postUrl && post.postUrl !== "#" ? (
                        <a
                          href={post.postUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0ea5e9] hover:underline"
                        >
                          View post →
                        </a>
                      ) : null}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white mb-1">
                      {formatCurrency(post.amount, currency)}
                    </div>
                    {getPaymentBadge(post.paymentStatus)}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 pt-4 border-t border-white/[0.06]">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Views</div>
                    <div className="text-sm font-semibold text-white">
                      {post.views.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Likes</div>
                    <div className="text-sm font-semibold text-white">
                      {post.likes.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Comments</div>
                    <div className="text-sm font-semibold text-white">
                      {post.comments.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Shares</div>
                    <div className="text-sm font-semibold text-white">
                      {post.shares.toLocaleString()}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Earnings Tab */}
      {activeTab === "earnings" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0D0D0D]/50 border border-white/[0.06] rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">
                  Unlocked Earnings
                </h3>
              </div>
              <div className="text-4xl font-bold text-emerald-400 mb-2">
                {formatCurrency(stats.earningsUnlocked, currency)}
              </div>
              <p className="text-xs text-slate-500">Ready to withdraw</p>
            </div>

            <div className="bg-[#0D0D0D]/50 border border-white/[0.06] rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">
                  Pending Verification
                </h3>
              </div>
              <div className="text-4xl font-bold text-amber-400 mb-2">
                {formatCurrency(stats.earningsPending, currency)}
              </div>
              <p className="text-xs text-slate-500">
                Awaiting post verification
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Benchmarks Tab */}
      {activeTab === "benchmarks" && (
        <div className="bg-[#0D0D0D]/50 border border-white/[0.06] rounded-xl p-8 text-center">
          <TrendingUp className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-white mb-2">
            Benchmarks Coming Soon
          </h3>
          <p className="text-sm text-slate-400">
            Compare your performance against tier medians and get rate
            suggestions
          </p>
        </div>
      )}
    </div>
  );
}
