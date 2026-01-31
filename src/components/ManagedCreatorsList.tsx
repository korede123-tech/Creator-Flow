import { Users, Plus, Search, Edit2, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { formatCurrency, Currency } from '../utils/currency';

interface SocialAccount {
  id: string;
  platform: 'tiktok' | 'instagram' | 'youtube';
  handle: string;
  followers: number;
  rateOverride?: number;
}

interface ManagedCreator {
  id: string;
  displayName: string;
  niche?: string;
  baseRate: number;
  currency: Currency;
  socialAccounts: SocialAccount[];
  status: 'active' | 'inactive';
}

interface ManagedCreatorsListProps {
  creators: ManagedCreator[];
  onAddCreator: () => void;
  onManageCreator: (creatorId: string) => void;
  onViewCampaigns: (creatorId: string) => void;
}

export function ManagedCreatorsList({
  creators,
  onAddCreator,
  onManageCreator,
  onViewCampaigns
}: ManagedCreatorsListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCreators = creators.filter(creator =>
    creator.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    creator.niche?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    creator.socialAccounts.some(acc => acc.handle.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getPlatformIcon = (platform: string) => {
    const icons = {
      tiktok: '🎵',
      instagram: '📸',
      youtube: '▶️'
    };
    return icons[platform as keyof typeof icons] || '•';
  };

  const getLargestFollowerCount = (socialAccounts: SocialAccount[]) => {
    if (!socialAccounts.length) return 0;
    return Math.max(...socialAccounts.map(acc => acc.followers));
  };

  const getPrimaryHandle = (socialAccounts: SocialAccount[]) => {
    if (!socialAccounts.length) return 'No accounts';
    const primary = socialAccounts.reduce((max, acc) => 
      acc.followers > max.followers ? acc : max
    );
    return `@${primary.handle}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white mb-1">Managed Creators</h3>
          <p className="text-sm text-slate-400">
            {creators.length} {creators.length === 1 ? 'creator' : 'creators'} managed
          </p>
        </div>
        <button
          onClick={onAddCreator}
          className="px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Creator
        </button>
      </div>

      {/* Search */}
      {creators.length > 2 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search creators..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-500 focus:border-[#0ea5e9] focus:outline-none transition-colors"
          />
        </div>
      )}

      {/* Creator Cards */}
      <div className="space-y-3">
        {filteredCreators.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-slate-600" />
            </div>
            <h3 className="text-base font-medium text-white mb-1">
              {searchQuery ? 'No creators found' : 'No creators yet'}
            </h3>
            <p className="text-sm text-slate-500">
              {searchQuery ? 'Try adjusting your search' : 'Add your first creator to get started'}
            </p>
          </div>
        ) : (
          filteredCreators.map((creator, index) => (
            <motion.div
              key={creator.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[#0D0D0D]/50 border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-all"
            >
              <div className="flex items-center justify-between gap-4">
                {/* Creator Info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0ea5e9] to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {creator.displayName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-white truncate">
                        {creator.displayName}
                      </h4>
                      {creator.status === 'active' && (
                        <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-xs font-medium">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                      <span>{getPrimaryHandle(creator.socialAccounts)}</span>
                      <span>•</span>
                      <span>{creator.niche || 'General'}</span>
                      <span>•</span>
                      <span>{getLargestFollowerCount(creator.socialAccounts).toLocaleString()} followers</span>
                    </div>
                  </div>
                </div>

                {/* Social Platforms */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {creator.socialAccounts.slice(0, 3).map(account => (
                    <div
                      key={account.id}
                      className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center"
                      title={`${account.platform}: @${account.handle}`}
                    >
                      <span className="text-sm">{getPlatformIcon(account.platform)}</span>
                    </div>
                  ))}
                  {creator.socialAccounts.length > 3 && (
                    <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                      <span className="text-xs text-slate-400">+{creator.socialAccounts.length - 3}</span>
                    </div>
                  )}
                </div>

                {/* Base Rate */}
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-slate-500 mb-1">Base Rate</div>
                  <div className="text-sm font-bold text-white">
                    {formatCurrency(creator.baseRate, creator.currency)}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => onViewCampaigns(creator.id)}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                    title="View campaigns"
                  >
                    <TrendingUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onManageCreator(creator.id)}
                    className="px-3 py-1.5 bg-white/[0.05] border border-white/[0.06] rounded-lg text-xs font-medium text-white hover:bg-white/[0.08] transition-colors flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3 h-3" />
                    Manage
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
