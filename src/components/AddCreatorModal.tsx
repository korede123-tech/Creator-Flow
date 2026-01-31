import { X, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { Currency } from '../utils/currency';

interface SocialAccountInput {
  id: string;
  platform: 'tiktok' | 'instagram' | 'youtube';
  handle: string;
  followers: string;
  rateOverride: string;
}

interface AddCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
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
  }) => void;
  defaultCurrency?: Currency;
}

export function AddCreatorModal({ isOpen, onClose, onSave, defaultCurrency = 'NGN' }: AddCreatorModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [niche, setNiche] = useState('');
  const [baseRate, setBaseRate] = useState('');
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccountInput[]>([
    { id: '1', platform: 'tiktok', handle: '', followers: '', rateOverride: '' }
  ]);

  const addSocialAccount = () => {
    setSocialAccounts([
      ...socialAccounts,
      { id: Date.now().toString(), platform: 'tiktok', handle: '', followers: '', rateOverride: '' }
    ]);
  };

  const removeSocialAccount = (id: string) => {
    if (socialAccounts.length > 1) {
      setSocialAccounts(socialAccounts.filter(acc => acc.id !== id));
    }
  };

  const updateSocialAccount = (id: string, field: keyof SocialAccountInput, value: string) => {
    setSocialAccounts(socialAccounts.map(acc =>
      acc.id === id ? { ...acc, [field]: value } : acc
    ));
  };

  const handleSave = () => {
    if (!displayName || !baseRate) return;

    const validAccounts = socialAccounts.filter(acc => acc.handle && acc.followers);
    
    onSave({
      displayName,
      niche: niche || 'General',
      baseRate: parseFloat(baseRate),
      currency,
      socialAccounts: validAccounts.map(acc => ({
        platform: acc.platform,
        handle: acc.handle,
        followers: parseInt(acc.followers),
        rateOverride: acc.rateOverride ? parseFloat(acc.rateOverride) : undefined
      }))
    });

    // Reset form
    setDisplayName('');
    setNiche('');
    setBaseRate('');
    setSocialAccounts([{ id: '1', platform: 'tiktok', handle: '', followers: '', rateOverride: '' }]);
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
            className="bg-[#0D0D0D] border border-white/[0.12] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/[0.06] sticky top-0 bg-[#0D0D0D] z-10">
              <h2 className="text-xl font-bold text-white">Add Creator</h2>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-2">Creator Name *</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-600 focus:border-[#0ea5e9] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-2">Niche</label>
                  <input
                    type="text"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    placeholder="e.g. Beauty, Tech, Lifestyle"
                    className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-600 focus:border-[#0ea5e9] focus:outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-2">Base Rate *</label>
                    <input
                      type="number"
                      value={baseRate}
                      onChange={(e) => setBaseRate(e.target.value)}
                      placeholder="50000"
                      className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-600 focus:border-[#0ea5e9] focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-2">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as Currency)}
                      className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white focus:border-[#0ea5e9] focus:outline-none transition-colors"
                    >
                      <option value="NGN">NGN</option>
                      <option value="USD">USD</option>
                      <option value="GBP">GBP</option>
                      <option value="EUR">EUR</option>
                      <option value="ZAR">ZAR</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Social Accounts */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs text-slate-500">Social Accounts</label>
                  <button
                    onClick={addSocialAccount}
                    disabled={socialAccounts.length >= 10}
                    className="px-2 py-1 text-xs text-[#0ea5e9] hover:text-[#0ea5e9]/80 transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    <Plus className="w-3 h-3" />
                    Add Account
                  </button>
                </div>

                <div className="space-y-3">
                  {socialAccounts.map((account, index) => (
                    <div key={account.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Account {index + 1}</span>
                        {socialAccounts.length > 1 && (
                          <button
                            onClick={() => removeSocialAccount(account.id)}
                            className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-slate-600 mb-1">Platform</label>
                          <select
                            value={account.platform}
                            onChange={(e) => updateSocialAccount(account.id, 'platform', e.target.value)}
                            className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-xs text-white focus:border-[#0ea5e9] focus:outline-none transition-colors"
                          >
                            <option value="tiktok">TikTok</option>
                            <option value="instagram">Instagram</option>
                            <option value="youtube">YouTube</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-600 mb-1">Handle</label>
                          <input
                            type="text"
                            value={account.handle}
                            onChange={(e) => updateSocialAccount(account.id, 'handle', e.target.value)}
                            placeholder="username"
                            className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-xs text-white placeholder-slate-600 focus:border-[#0ea5e9] focus:outline-none transition-colors"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-slate-600 mb-1">Followers</label>
                          <input
                            type="number"
                            value={account.followers}
                            onChange={(e) => updateSocialAccount(account.id, 'followers', e.target.value)}
                            placeholder="50000"
                            className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-xs text-white placeholder-slate-600 focus:border-[#0ea5e9] focus:outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-600 mb-1">Rate Override (optional)</label>
                          <input
                            type="number"
                            value={account.rateOverride}
                            onChange={(e) => updateSocialAccount(account.id, 'rateOverride', e.target.value)}
                            placeholder="Custom rate"
                            className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-xs text-white placeholder-slate-600 focus:border-[#0ea5e9] focus:outline-none transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-white/[0.06] space-y-3 sticky bottom-0 bg-[#0D0D0D]">
              <button
                onClick={handleSave}
                disabled={!displayName || !baseRate || !socialAccounts.some(acc => acc.handle && acc.followers)}
                className="w-full px-4 py-3 bg-white text-black rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Creator
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
      )}
    </AnimatePresence>
  );
}
