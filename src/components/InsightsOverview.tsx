import { TrendingUp, Eye, CheckCircle2, Send, Heart, Target, DollarSign, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { EngagementChart } from './EngagementChart';
import { formatCurrency, Currency } from '../utils/currency';
import { useState } from 'react';

interface InsightsOverviewProps {
  metrics: {
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
  engagementData: Array<{
    date: string;
    engagements: number;
    views: number;
    likes: number;
    comments: number;
    shares: number;
  }>;
  secondaryInsights?: {
    completionRate: number;
    avgTimeToPost: number;
    verificationSuccessRate: number;
  };
  currency?: Currency;
}

export function InsightsOverview({ metrics, engagementData, secondaryInsights, currency = 'NGN' }: InsightsOverviewProps) {
  const [showSecondary, setShowSecondary] = useState(false);

  const statCards = [
    {
      label: 'Posts Submitted',
      value: metrics.postsSubmitted,
      icon: Send,
      color: 'text-[#0ea5e9]',
      bgColor: 'bg-[#0ea5e9]/10',
      borderColor: 'border-[#0ea5e9]/20'
    },
    {
      label: 'Posts Approved',
      value: metrics.postsApproved,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20'
    },
    {
      label: 'Posts Published',
      value: metrics.postsPublished,
      icon: TrendingUp,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20'
    },
    {
      label: 'Total Views',
      value: metrics.totalViews.toLocaleString(),
      icon: Eye,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      label: 'Total Engagements',
      value: metrics.totalEngagements.toLocaleString(),
      icon: Heart,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
      borderColor: 'border-pink-500/20'
    },
    {
      label: 'Avg Views/Post',
      value: Math.round(metrics.avgViewsPerPost).toLocaleString(),
      icon: Target,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20'
    },
    {
      label: 'Engagement Rate',
      value: `${metrics.engagementRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Engagement Chart - MOVED TO TOP */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0 }}
      >
        <h3 className="text-base font-semibold text-white mb-4">Performance Trends</h3>
        <EngagementChart data={engagementData} defaultMetric="engagements" defaultRange="30d" />
      </motion.div>

      {/* Summary Tiles */}
      <div>
        <h3 className="text-base font-semibold text-white mb-4">Performance Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="bg-[#0D0D0D]/50 border border-white/[0.06] rounded-xl p-4 hover:border-white/[0.12] transition-all"
              >
                <div className={`w-8 h-8 rounded-lg ${stat.bgColor} border ${stat.borderColor} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-xs text-slate-400">{stat.label}</div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Secondary Insights (Collapsible) */}
      {secondaryInsights && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <button
            onClick={() => setShowSecondary(!showSecondary)}
            className="w-full text-left mb-4 text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <span>{showSecondary ? '▼' : '▶'}</span>
            <span className="font-medium">Additional Insights</span>
          </button>
          
          {showSecondary && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <div className="text-xs text-slate-500 mb-2">Campaign Completion Rate</div>
                <div className="text-3xl font-bold text-white mb-1">
                  {secondaryInsights.completionRate.toFixed(0)}%
                </div>
                <div className="text-xs text-slate-400">Of accepted campaigns</div>
              </div>
              
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <div className="text-xs text-slate-500 mb-2">Avg Time to Post</div>
                <div className="text-3xl font-bold text-white mb-1">
                  {secondaryInsights.avgTimeToPost}d
                </div>
                <div className="text-xs text-slate-400">From approval to publish</div>
              </div>
              
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <div className="text-xs text-slate-500 mb-2">Verification Success Rate</div>
                <div className="text-3xl font-bold text-white mb-1">
                  {secondaryInsights.verificationSuccessRate.toFixed(0)}%
                </div>
                <div className="text-xs text-slate-400">Posts verified on first try</div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}