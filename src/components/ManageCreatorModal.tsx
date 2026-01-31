import { X, Plus, Trash2, Edit2, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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

interface ManageCreatorModalProps {
  isOpen: boolean;
  creator: ManagedCreator | null;
  onClose: () => void;
  onSave: (data: Partial<ManagedCreator>) => void;
  onDelete: (creatorId: string) => void;
  onAddSocialAccount: (creatorId: string, account: Omit<SocialAccount, 'id'>) => void;
  onUpdateSocialAccount: (creatorId: string, accountId: string, data: Partial<SocialAccount>) => void;
  onDeleteSocialAccount: (creatorId: string, accountId: string) => void;
}

type TabType = 'details' | 'social';

export function ManageCreatorModal({
  isOpen,
  creator,
  onClose,
  onSave,
  onDelete,
  onAddSocialAccount,
  onUpdateSocialAccount,
  onDeleteSocialAccount
}: ManageCreatorModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [displayName, setDisplayName] = useState(creator?.displayName || '');
  const [niche, setNiche] = useState(creator?.niche || '');
  const [baseRate, setBaseRate] = useState(creator?.baseRate.toString() || '');
  const [currency, setCurrency] = useState<Currency>(creator?.currency || 'NGN');
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Reset state when creator changes
  useState(() => {
    if (creator) {
      setDisplayName(creator.displayName);
      setNiche(creator.niche || '');
      setBaseRate(creator.baseRate.toString());
      setCurrency(creator.currency);
    }
  });

  if (!creator) return null;

  const handleSaveDetails = () => {
    onSave({
      id: creator.id,
      displayName,
      niche: niche || 'General',
      baseRate: parseFloat(baseRate),
      currency
    });
  };

  const getPlatformIcon = (platform: string) => {
    const icons = {
      tiktok: '🎵',
      instagram: '📸',
      youtube: '▶️'
    };
    return icons[platform as keyof typeof icons] || '•';
  };

  const getPlatformColor = (platform: string) => {
    const colors = {
      tiktok: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
      instagram: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      youtube: 'bg-red-500/10 text-red-400 border-red-500/20'
    };
    return colors[platform as keyof typeof colors] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0D0D0D] border border-white/[0.12] rounded-2xl max-w-md w-full max-h-[70vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0ea5e9] to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                  {creator.displayName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">{creator.displayName}</h2>
                  <p className="text-xs text-slate-400">{creator.niche || 'General'}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 px-4 border-b border-white/[0.06]">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-3 py-2 text-sm font-medium transition-colors relative ${
                  activeTab === 'details'
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Details
                {activeTab === 'details' && (
                  <motion.div
                    layoutId="manageCreatorTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
                  />
                )}
              </button>
              <button
                onClick={() => setActiveTab('social')}
                className={`px-3 py-2 text-sm font-medium transition-colors relative ${
                  activeTab === 'social'
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Social accounts
                {activeTab === 'social' && (
                  <motion.div
                    layoutId="manageCreatorTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
                  />
                )}
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <AnimatePresence mode="wait">
                {activeTab === 'details' ? (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-3"
                  >
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Creator Name</label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white focus:border-[#0ea5e9] focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Niche</label>
                      <input
                        type="text"
                        value={niche}
                        onChange={(e) => setNiche(e.target.value)}
                        placeholder="e.g. Beauty, Tech, Lifestyle"
                        className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-600 focus:border-[#0ea5e9] focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-500 mb-2">Base Rate</label>
                        <input
                          type="number"
                          value={baseRate}
                          onChange={(e) => setBaseRate(e.target.value)}
                          className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white focus:border-[#0ea5e9] focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-2">Currency</label>
                        <select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value as Currency)}
                          className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white focus:border-[#0ea5e9] focus:outline-none transition-colors"
                        >
                          <option value="NGN">NGN</option>
                          <option value="USD">USD</option>
                          <option value="GBP">GBP</option>
                          <option value="EUR">EUR</option>
                          <option value="ZAR">ZAR</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={handleSaveDetails}
                        className="w-full px-3 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save Changes
                      </button>
                    </div>

                    {/* Delete Creator */}
                    <div className="pt-4 border-t border-white/[0.06]">
                      <p className="text-xs text-slate-500 mb-3">
                        Remove this creator from your roster. This action cannot be undone.
                      </p>
                      {!showDeleteConfirm ? (
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="px-4 py-2 text-red-400 text-sm font-medium hover:text-red-300 transition-colors"
                        >
                          Delete Creator
                        </button>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-slate-400">Are you sure?</span>
                          <button
                            onClick={() => {
                              onDelete(creator.id);
                              onClose();
                            }}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                          >
                            Yes, Delete
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="px-4 py-2 text-slate-400 text-sm font-medium hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="social"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-slate-400">
                        {creator.socialAccounts.length} {creator.socialAccounts.length === 1 ? 'account' : 'accounts'} connected
                      </p>
                      <button
                        onClick={() => setShowAddAccountModal(true)}
                        className="px-3 py-1.5 bg-white text-black rounded-lg text-xs font-semibold hover:bg-white/90 transition-colors flex items-center gap-1.5"
                      >
                        <Plus className="w-3 h-3" />
                        Add Account
                      </button>
                    </div>

                    {creator.socialAccounts.length === 0 ? (
                      <div className="py-12 text-center">
                        <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
                          <Plus className="w-6 h-6 text-slate-600" />
                        </div>
                        <h3 className="text-base font-medium text-white mb-1">No social accounts</h3>
                        <p className="text-sm text-slate-500">Add a social account to get started</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {creator.socialAccounts.map((account) => (
                          <div
                            key={account.id}
                            className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className={`w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 ${getPlatformColor(account.platform)}`}>
                                  <span className="text-lg">{getPlatformIcon(account.platform)}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-semibold text-white capitalize">
                                      {account.platform}
                                    </span>
                                  </div>
                                  <div className="text-sm text-slate-400 truncate mb-1">
                                    @{account.handle}
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-slate-500">
                                    <span>{account.followers.toLocaleString()} followers</span>
                                    {account.rateOverride && (
                                      <>
                                        <span>•</span>
                                        <span>Rate: {formatCurrency(account.rateOverride, currency)}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setEditingAccountId(account.id)}
                                  className="p-2 text-slate-400 hover:text-white transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => onDeleteSocialAccount(creator.id, account.id)}
                                  className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                                  title="Remove"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-white/[0.06]">
              <button
                onClick={onClose}
                className="w-full px-3 py-2 text-slate-400 text-sm font-medium hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>

          {/* Add Social Account Modal */}
          {showAddAccountModal && (
            <AddSocialAccountModal
              onClose={() => setShowAddAccountModal(false)}
              onSave={(account) => {
                onAddSocialAccount(creator.id, account);
                setShowAddAccountModal(false);
              }}
            />
          )}

          {/* Edit Social Account Modal */}
          {editingAccountId && (
            <EditSocialAccountModal
              account={creator.socialAccounts.find(a => a.id === editingAccountId)!}
              onClose={() => setEditingAccountId(null)}
              onSave={(data) => {
                onUpdateSocialAccount(creator.id, editingAccountId, data);
                setEditingAccountId(null);
              }}
              currency={currency}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Add Social Account Modal
interface AddSocialAccountModalProps {
  onClose: () => void;
  onSave: (account: Omit<SocialAccount, 'id'>) => void;
}

function AddSocialAccountModal({ onClose, onSave }: AddSocialAccountModalProps) {
  const [platform, setPlatform] = useState<'tiktok' | 'instagram' | 'youtube'>('tiktok');
  const [handle, setHandle] = useState('');
  const [followers, setFollowers] = useState('');
  const [rateOverride, setRateOverride] = useState('');

  const normalizeHandle = (value: string) => {
    return value.replace(/^@/, '');
  };

  const handleSave = () => {
    if (!handle || !followers) return;

    onSave({
      platform,
      handle: normalizeHandle(handle),
      followers: parseInt(followers),
      rateOverride: rateOverride ? parseFloat(rateOverride) : undefined
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0D0D0D] border border-white/[0.12] rounded-2xl max-w-md w-full mx-4"
      >
        <div className="p-6 border-b border-white/[0.06]">
          <h3 className="text-lg font-bold text-white">Add Social Account</h3>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-slate-500 mb-2">Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as any)}
              className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white focus:border-[#0ea5e9] focus:outline-none transition-colors"
            >
              <option value="tiktok">TikTok</option>
              <option value="instagram">Instagram</option>
              <option value="youtube">YouTube</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-2">Handle</label>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="username"
              className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-600 focus:border-[#0ea5e9] focus:outline-none transition-colors"
            />
            <p className="mt-1 text-xs text-slate-500">Without the @ symbol</p>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-2">Followers</label>
            <input
              type="number"
              value={followers}
              onChange={(e) => setFollowers(e.target.value)}
              placeholder="50000"
              className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-600 focus:border-[#0ea5e9] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-2">Rate Override (optional)</label>
            <input
              type="number"
              value={rateOverride}
              onChange={(e) => setRateOverride(e.target.value)}
              placeholder="Custom rate for this platform"
              className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-600 focus:border-[#0ea5e9] focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="p-6 border-t border-white/[0.06] space-y-3">
          <button
            onClick={handleSave}
            disabled={!handle || !followers}
            className="w-full px-4 py-3 bg-white text-black rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Account
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-3 text-slate-400 text-sm font-medium hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Edit Social Account Modal
interface EditSocialAccountModalProps {
  account: SocialAccount;
  onClose: () => void;
  onSave: (data: Partial<SocialAccount>) => void;
  currency: Currency;
}

function EditSocialAccountModal({ account, onClose, onSave, currency }: EditSocialAccountModalProps) {
  const [handle, setHandle] = useState(account.handle);
  const [followers, setFollowers] = useState(account.followers.toString());
  const [rateOverride, setRateOverride] = useState(account.rateOverride?.toString() || '');

  const normalizeHandle = (value: string) => {
    return value.replace(/^@/, '');
  };

  const handleSave = () => {
    onSave({
      handle: normalizeHandle(handle),
      followers: parseInt(followers),
      rateOverride: rateOverride ? parseFloat(rateOverride) : undefined
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0D0D0D] border border-white/[0.12] rounded-2xl max-w-md w-full mx-4"
      >
        <div className="p-6 border-b border-white/[0.06]">
          <h3 className="text-lg font-bold text-white">Edit {account.platform.charAt(0).toUpperCase() + account.platform.slice(1)} Account</h3>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-slate-500 mb-2">Handle</label>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white focus:border-[#0ea5e9] focus:outline-none transition-colors"
            />
            <p className="mt-1 text-xs text-slate-500">Without the @ symbol</p>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-2">Followers</label>
            <input
              type="number"
              value={followers}
              onChange={(e) => setFollowers(e.target.value)}
              className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white focus:border-[#0ea5e9] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-2">Rate Override (optional)</label>
            <input
              type="number"
              value={rateOverride}
              onChange={(e) => setRateOverride(e.target.value)}
              placeholder="Custom rate for this platform"
              className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-600 focus:border-[#0ea5e9] focus:outline-none transition-colors"
            />
            <p className="mt-1 text-xs text-slate-500">
              Leave empty to use base rate of {formatCurrency(0, currency)}
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-white/[0.06] space-y-3">
          <button
            onClick={handleSave}
            className="w-full px-4 py-3 bg-white text-black rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors"
          >
            Save Changes
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-3 text-slate-400 text-sm font-medium hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
