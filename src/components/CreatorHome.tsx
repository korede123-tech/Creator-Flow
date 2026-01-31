import { DollarSign, Briefcase, Clock, CheckCircle2, Upload, TrendingUp, Share2, Copy, ArrowUpRight, ExternalLink, ChevronRight, Sparkles, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Campaign } from '../App';
import { Button } from './Button';
import { useState } from 'react';

interface CreatorHomeProps {
  onNavigate: (screen: string, campaign?: Campaign) => void;
  onViewCampaign: (campaign: Campaign) => void;
  campaigns: Campaign[];
  walletBalance: {
    available: number;
    pending: number;
    lifetime: number;
  };
  referralData: {
    code: string;
    totalEarnings: number;
    totalReferred: number;
  };
  onWithdraw: () => void;
}

type TabType = 'offers' | 'inProgress' | 'needsAction' | 'completed';

export function CreatorHome({ 
  onNavigate, 
  onViewCampaign,
  campaigns, 
  walletBalance,
  referralData,
  onWithdraw
}: CreatorHomeProps) {
  const [activeTab, setActiveTab] = useState<TabType>('offers');
  const [copied, setCopied] = useState(false);

  const offers = campaigns.filter(c => c.status === 'offered');
  const inProgress = campaigns.filter(c => ['accepted', 'submitted'].includes(c.status));
  const needsAction = campaigns.filter(c => c.status === 'approved');
  const completed = campaigns.filter(c => ['posted', 'paid'].includes(c.status));

  const getTabCampaigns = () => {
    switch (activeTab) {
      case 'offers': return offers;
      case 'inProgress': return inProgress;
      case 'needsAction': return needsAction;
      case 'completed': return completed;
    }
  };

  const getActionButton = (campaign: Campaign) => {
    switch (campaign.status) {
      case 'offered':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewCampaign(campaign);
            }}
            className="px-5 py-2.5 bg-white text-black rounded-lg hover:bg-white/90 transition-all font-semibold text-sm flex items-center gap-2 group"
          >
            Review Offer
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        );
      case 'accepted':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewCampaign(campaign);
            }}
            className="px-5 py-2.5 bg-[#0ea5e9] text-white rounded-lg hover:bg-[#0ea5e9]/90 transition-all font-semibold text-sm flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>
        );
      case 'submitted':
        return (
          <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></div>
            <span className="text-amber-400 text-sm font-medium">Under Review</span>
          </div>
        );
      case 'approved':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewCampaign(campaign);
            }}
            className="px-5 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all font-semibold text-sm flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Post Now
          </button>
        );
      case 'posted':
        return (
          <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 text-sm font-medium">Posted</span>
          </div>
        );
      case 'paid':
        return (
          <div className="px-4 py-2 bg-slate-500/10 border border-slate-500/20 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400 text-sm font-medium">Completed</span>
          </div>
        );
    }
  };

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(`https://dobbletap.com/join/${referralData.code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'tiktok': return 'from-pink-500 to-cyan-500';
      case 'instagram': return 'from-purple-500 to-pink-500';
      case 'youtube': return 'from-red-500 to-red-600';
      case 'twitter': return 'from-blue-400 to-blue-500';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Wallet Section */}
      <div className="border-b border-white/[0.08] bg-gradient-to-b from-[#0D0D0D] to-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Greeting */}
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                Welcome back 👋
              </h1>
              <p className="text-slate-400">Here's what's happening with your campaigns</p>
            </div>

            {/* Wallet Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Available Balance - Primary Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="lg:col-span-2 relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#0ea5e9]/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
                <div className="relative bg-gradient-to-br from-[#0D0D0D] via-[#0D0D0D] to-[#0D0D0D]/80 border border-white/[0.1] rounded-3xl p-8 backdrop-blur-xl">
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0ea5e9] to-purple-500 flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">Available Balance</span>
                      </div>
                      <div className="text-6xl font-bold text-white tracking-tight mb-2">
                        ${walletBalance.available.toLocaleString()}
                      </div>
                      <p className="text-sm text-slate-400">Ready to withdraw anytime</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Button variant="primary" onClick={onWithdraw} className="flex-shrink-0">
                      <span className="flex items-center gap-2">
                        <ArrowUpRight className="w-4 h-4" />
                        Withdraw Funds
                      </span>
                    </Button>
                    <button
                      onClick={() => onNavigate('wallet')}
                      className="px-5 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-lg hover:bg-white/[0.08] transition-all text-sm text-slate-300 font-medium flex items-center gap-2 group"
                    >
                      View Wallet
                      <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Stats Cards */}
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="bg-[#0D0D0D] border border-white/[0.08] rounded-2xl p-6 hover:border-white/[0.12] transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-amber-400" />
                    </div>
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pending</span>
                  </div>
                  <div className="text-3xl font-bold text-amber-400 mb-1">
                    ${walletBalance.pending.toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-500">Awaiting verification</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="bg-[#0D0D0D] border border-white/[0.08] rounded-2xl p-6 hover:border-white/[0.12] transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Lifetime</span>
                  </div>
                  <div className="text-3xl font-bold text-emerald-400 mb-1">
                    ${walletBalance.lifetime.toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-500">Total earned</p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Campaigns */}
          <div className="lg:col-span-2 space-y-8">
            {/* Campaign Inbox */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Your Campaigns</h2>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span>{campaigns.length} active</span>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                <button
                  onClick={() => setActiveTab('offers')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                    activeTab === 'offers'
                      ? 'bg-white text-black shadow-lg shadow-white/20'
                      : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-slate-300'
                  }`}
                >
                  Offers {offers.length > 0 && `(${offers.length})`}
                </button>
                <button
                  onClick={() => setActiveTab('inProgress')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                    activeTab === 'inProgress'
                      ? 'bg-white text-black shadow-lg shadow-white/20'
                      : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-slate-300'
                  }`}
                >
                  In Progress {inProgress.length > 0 && `(${inProgress.length})`}
                </button>
                <button
                  onClick={() => setActiveTab('needsAction')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all relative ${
                    activeTab === 'needsAction'
                      ? 'bg-white text-black shadow-lg shadow-white/20'
                      : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-slate-300'
                  }`}
                >
                  {needsAction.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                  )}
                  Action Required {needsAction.length > 0 && `(${needsAction.length})`}
                </button>
                <button
                  onClick={() => setActiveTab('completed')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                    activeTab === 'completed'
                      ? 'bg-white text-black shadow-lg shadow-white/20'
                      : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-slate-300'
                  }`}
                >
                  Completed {completed.length > 0 && `(${completed.length})`}
                </button>
              </div>

              {/* Campaign Cards */}
              <AnimatePresence mode="wait">
                {getTabCampaigns().length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#0D0D0D] border border-white/[0.08] rounded-2xl p-16 text-center"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
                      <Briefcase className="w-8 h-8 text-slate-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {activeTab === 'offers' && 'No new offers'}
                      {activeTab === 'inProgress' && 'No campaigns in progress'}
                      {activeTab === 'needsAction' && 'All caught up!'}
                      {activeTab === 'completed' && 'No completed campaigns yet'}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {activeTab === 'offers' && 'New offers will appear here via WhatsApp, SMS, or email'}
                      {activeTab === 'inProgress' && 'Accepted campaigns will show up here'}
                      {activeTab === 'needsAction' && 'Nothing needs your attention right now'}
                      {activeTab === 'completed' && 'Your completed campaigns will be listed here'}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {getTabCampaigns().map((campaign, index) => (
                      <motion.div
                        key={campaign.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => onViewCampaign(campaign)}
                        className="group bg-[#0D0D0D] border border-white/[0.08] rounded-2xl p-6 hover:border-white/[0.15] hover:bg-[#111111] transition-all cursor-pointer"
                      >
                        <div className="flex items-start gap-4">
                          {/* Platform Badge */}
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getPlatformColor(campaign.platform)} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                            <span className="text-white font-bold text-sm">{campaign.platform.charAt(0)}</span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-[#0ea5e9] transition-colors truncate">
                                  {campaign.title}
                                </h3>
                                <p className="text-sm text-slate-400">{campaign.brand}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="text-2xl font-bold text-white mb-1">
                                  ${campaign.rate.toLocaleString()}
                                </div>
                                <div className="text-xs text-slate-500">{campaign.platform}</div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3 text-xs text-slate-500">
                                <span className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5" />
                                  Due {campaign.deadline}
                                </span>
                              </div>
                              <div onClick={(e) => e.stopPropagation()}>
                                {getActionButton(campaign)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Right Column - Referrals & Quick Stats */}
          <div className="space-y-6">
            {/* Referral Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-orange-500/20 rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
              <div className="relative bg-gradient-to-br from-[#0D0D0D] to-[#0D0D0D]/80 border border-white/[0.1] rounded-3xl p-6 backdrop-blur-xl">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Referral Program</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">Earn 5% Forever</h3>
                    <p className="text-sm text-slate-400">Grow your network</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="bg-white/[0.04] rounded-xl p-4">
                    <div className="text-xs text-slate-500 mb-1">Your Earnings</div>
                    <div className="text-3xl font-bold text-purple-400">${referralData.totalEarnings}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/[0.04] rounded-xl p-3">
                      <div className="text-xs text-slate-500 mb-1">Your Code</div>
                      <div className="text-sm font-bold text-white">{referralData.code}</div>
                    </div>
                    <div className="bg-white/[0.04] rounded-xl p-3">
                      <div className="text-xs text-slate-500 mb-1">Referred</div>
                      <div className="text-sm font-bold text-white">{referralData.totalReferred} creators</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleCopyReferral}
                    className="w-full px-4 py-2.5 bg-white text-black rounded-xl hover:bg-white/90 transition-all font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Link
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => onNavigate('referral')}
                    className="w-full px-4 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-xl hover:bg-white/[0.08] transition-all text-sm text-slate-300 font-medium flex items-center justify-center gap-2 group"
                  >
                    View Details
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-[#0D0D0D] border border-white/[0.08] rounded-2xl p-6"
            >
              <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Active Campaigns</span>
                  <span className="text-lg font-bold text-white">{inProgress.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">New Offers</span>
                  <span className="text-lg font-bold text-[#0ea5e9]">{offers.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Completed</span>
                  <span className="text-lg font-bold text-emerald-400">{completed.length}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}