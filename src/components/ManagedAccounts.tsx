import { Users, Plus, Search, Settings, Shield, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { formatCurrency, Currency } from '../utils/currency';

interface ManagedAccount {
  id: string;
  name: string;
  avatar?: string;
  platforms: {
    tiktok?: string;
    instagram?: string;
    youtube?: string;
  };
  followers: string;
  permissionLevel: 'full' | 'limited';
  consentGiven: boolean;
  walletSummary: {
    available: number;
    pending: number;
  };
  activeCampaigns: number;
}

interface ManagedAccountsProps {
  accounts: ManagedAccount[];
  onAddAccount: () => void;
  onSwitchContext: (accountId: string) => void;
  onManagePermissions: (accountId: string) => void;
  currency?: Currency;
}

export function ManagedAccounts({
  accounts,
  onAddAccount,
  onSwitchContext,
  onManagePermissions,
  currency = 'NGN'
}: ManagedAccountsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredAccounts = accounts.filter(account =>
    account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    Object.values(account.platforms).some(handle => handle?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getPermissionBadge = (level: 'full' | 'limited', consentGiven: boolean) => {
    if (level === 'full' && consentGiven) {
      return (
        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-xs font-medium">
          Full Access
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md text-xs font-medium">
        Limited
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white mb-1">Managed Accounts</h3>
          <p className="text-sm text-slate-400">Manage multiple creator accounts and permissions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Account
        </button>
      </div>

      {/* Search */}
      {accounts.length > 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search accounts..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-500 focus:border-[#0ea5e9] focus:outline-none transition-colors"
          />
        </div>
      )}

      {/* Account List */}
      <div className="space-y-3">
        {filteredAccounts.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-slate-600" />
            </div>
            <h3 className="text-base font-medium text-white mb-1">No accounts found</h3>
            <p className="text-sm text-slate-500">
              {searchQuery ? 'Try adjusting your search' : 'Add your first managed account'}
            </p>
          </div>
        ) : (
          filteredAccounts.map((account, index) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-all"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0ea5e9] to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {account.avatar || account.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-white truncate">{account.name}</h4>
                      {getPermissionBadge(account.permissionLevel, account.consentGiven)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      {account.platforms.tiktok && (
                        <span>TikTok: @{account.platforms.tiktok}</span>
                      )}
                      {account.platforms.instagram && (
                        <>
                          {account.platforms.tiktok && <span>•</span>}
                          <span>IG: @{account.platforms.instagram}</span>
                        </>
                      )}
                      {account.platforms.youtube && (
                        <>
                          {(account.platforms.tiktok || account.platforms.instagram) && <span>•</span>}
                          <span>YT: @{account.platforms.youtube}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{account.followers} followers</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-xs text-slate-500 mb-1">Available</div>
                    <div className="text-sm font-bold text-emerald-400">
                      {formatCurrency(account.walletSummary.available, currency)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500 mb-1">Active</div>
                    <div className="text-sm font-bold text-white">{account.activeCampaigns}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onManagePermissions(account.id)}
                      className="p-2 text-slate-400 hover:text-white transition-colors"
                      title="Manage permissions"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onSwitchContext(account.id)}
                      className="px-3 py-1.5 bg-white/[0.05] border border-white/[0.06] rounded-lg text-xs font-medium text-white hover:bg-white/[0.08] transition-colors flex items-center gap-1.5"
                    >
                      Switch
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Add Account Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0D0D0D] border border-white/[0.12] rounded-2xl p-8 max-w-md w-full"
            >
              <h3 className="text-xl font-bold text-white mb-2">Add Account</h3>
              <p className="text-sm text-slate-400 mb-6">Choose how to add a new creator account</p>

              <div className="space-y-3 mb-6">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    onAddAccount();
                  }}
                  className="w-full p-4 bg-white/[0.05] border border-white/[0.06] rounded-xl hover:border-white/[0.12] transition-all text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#0ea5e9]/10 border border-[#0ea5e9]/20 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-[#0ea5e9]" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-white mb-1">Invite Creator</div>
                      <p className="text-xs text-slate-400">
                        Send an invitation link for the creator to join and connect their account
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowAddModal(false);
                    onAddAccount();
                  }}
                  className="w-full p-4 bg-white/[0.05] border border-white/[0.06] rounded-xl hover:border-white/[0.12] transition-all text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-white mb-1">Add Managed Profile</div>
                      <p className="text-xs text-slate-400">
                        Create a limited profile now, full access requires creator verification
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setShowAddModal(false)}
                className="w-full px-4 py-2 text-slate-400 text-sm font-medium hover:text-white transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
