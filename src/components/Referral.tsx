import {
  Copy,
  Share2,
  Check,
  Users,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { formatCurrency, Currency } from "../utils/currency";

interface ReferralProps {
  referralCode: string;
  stats: {
    totalEarned: number;
    pendingEarnings: number;
    totalReferred: number;
    activeReferrals: number;
  };
  referrals: Array<{
    id: string;
    name: string;
    joinedDate: string;
    earnings: number;
    status: "active" | "inactive";
  }>;
  currency?: Currency;
}

export function Referral({
  referralCode,
  stats,
  referrals,
  currency,
}: ReferralProps) {
  const [copied, setCopied] = useState(false);
  const referralLink = `https://dobbletap.com/join/${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Join Dobble Tap",
        text: `Join me on Dobble Tap and start earning from brand campaigns! Use my code: ${referralCode}`,
        url: referralLink,
      });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-white/[0.08]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full mb-4">
              <Users className="w-3 h-3 text-purple-400" />
              <span className="text-xs text-purple-400 font-medium">
                Referral Program
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
              Earn from Referrals
            </h1>
            <p className="text-sm text-slate-400">
              Get 2% of every payment your referrals earn, for 6 months
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Earnings Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mb-8"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 rounded-2xl blur-xl"></div>
          <div className="relative bg-[#0D0D0D] border border-white/[0.08] rounded-2xl p-6 sm:p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">
                  Referral Earnings
                </div>
                <div className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
                  {formatCurrency(stats.totalEarned, currency)}
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-400" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/[0.03] rounded-lg p-4">
                <div className="text-xs text-slate-500 mb-1">
                  Total Referrals
                </div>
                <div className="text-2xl font-bold text-white">
                  {stats.totalReferred}
                </div>
              </div>
              <div className="bg-white/[0.03] rounded-lg p-4">
                <div className="text-xs text-slate-500 mb-1">Active</div>
                <div className="text-2xl font-bold text-emerald-400">
                  {stats.activeReferrals}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Share Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold text-white mb-4">
            Your Referral Link
          </h2>

          <div className="bg-[#0D0D0D] border border-white/[0.08] rounded-xl p-6">
            {/* Referral Code */}
            <div className="mb-6">
              <label className="block text-xs text-slate-400 uppercase tracking-widest mb-3">
                Your Code
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-12 px-4 bg-white/[0.03] border border-white/[0.08] rounded-lg flex items-center">
                  <span className="text-2xl font-bold text-white tracking-wider">
                    {referralCode}
                  </span>
                </div>
                <button
                  onClick={handleCopy}
                  className="h-12 px-4 bg-white/[0.03] border border-white/[0.08] rounded-lg hover:bg-white/[0.06] transition-all flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm text-emerald-400 font-medium">
                        Copied!
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-400 font-medium">
                        Copy
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Referral Link */}
            <div className="mb-6">
              <label className="block text-xs text-slate-400 uppercase tracking-widest mb-3">
                Shareable Link
              </label>
              <div className="h-12 px-4 bg-white/[0.03] border border-white/[0.08] rounded-lg flex items-center">
                <span className="text-sm text-slate-400 truncate">
                  {referralLink}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="primary" onClick={handleCopy}>
                <span className="flex items-center justify-center gap-2">
                  <Copy className="w-4 h-4" />
                  <span>Copy Link</span>
                </span>
              </Button>
              <Button variant="secondary" onClick={handleShare}>
                <span className="flex items-center justify-center gap-2">
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </span>
              </Button>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-4 bg-[#0ea5e9]/5 border border-[#0ea5e9]/20 rounded-xl p-4">
            <div className="flex gap-3">
              <TrendingUp className="w-5 h-5 text-[#0ea5e9] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">
                  How it works
                </h4>
                <p className="text-xs text-slate-400">
                  Share your link with other creators. When they join and earn,
                  you get 2% of every payment they receive for 6 months. The
                  more they earn, the more you earn.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Referrals List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-lg font-semibold text-white mb-4">
            Your Referrals
          </h2>

          {referrals.length === 0 ? (
            <div className="bg-[#0D0D0D] border border-white/[0.08] rounded-xl p-12 text-center">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-base font-semibold text-white mb-2">
                No referrals yet
              </h3>
              <p className="text-sm text-slate-400">
                Start sharing your link to build your network
              </p>
            </div>
          ) : (
            <div className="bg-[#0D0D0D] border border-white/[0.08] rounded-xl divide-y divide-white/[0.08]">
              {referrals.map((referral, index) => (
                <motion.div
                  key={referral.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  className="p-5 hover:bg-white/[0.02] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-white">
                          {referral.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white mb-1">
                          {referral.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">
                            Joined {referral.joinedDate}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs font-medium border ${
                              referral.status === "active"
                                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                : "text-slate-400 bg-slate-500/10 border-slate-500/20"
                            }`}
                          >
                            {referral.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold text-emerald-400 mb-1">
                        +{formatCurrency(referral.earnings, currency)}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                          referral.status === "active"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                        }`}
                      >
                        {referral.status}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
