import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";

export interface AgencyCampaignOption {
  campaign_id: string;
  brand: string;
  title: string;
  platform: string;
  compensation: number;
}

interface SendOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaigns: AgencyCampaignOption[];
  preselectedCampaignId?: string | null;
  onSend: (params: {
    campaignId: string;
    creatorEmail: string;
    rate: number;
    deadline: string | null;
  }) => Promise<{ ok: boolean; error?: string }>;
}

export function SendOfferModal({
  isOpen,
  onClose,
  campaigns,
  preselectedCampaignId,
  onSend,
}: SendOfferModalProps) {
  const [campaignId, setCampaignId] = useState(
    preselectedCampaignId || (campaigns[0]?.campaign_id ?? ""),
  );
  const [creatorEmail, setCreatorEmail] = useState("");
  const [rate, setRate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const selected = campaigns.find((c) => c.campaign_id === campaignId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const r = parseFloat(rate);
    if (!campaignId) {
      setError("Select a campaign");
      return;
    }
    if (!creatorEmail.trim()) {
      setError("Creator email is required");
      return;
    }
    if (isNaN(r) || r < 0) {
      setError("Rate must be a positive number");
      return;
    }
    setSending(true);
    try {
      const res = await onSend({
        campaignId,
        creatorEmail: creatorEmail.trim(),
        rate: r,
        deadline: deadline.trim() || null,
      });
      if (res.ok) {
        setSuccess(true);
        setCreatorEmail("");
        setRate("");
        setDeadline("");
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 1200);
      } else {
        setError(res.error || "Failed to send offer");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send offer");
    } finally {
      setSending(false);
    }
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
            className="bg-[#0D0D0D] border border-white/[0.12] rounded-2xl max-w-lg w-full"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
              <h2 className="text-lg font-semibold text-white">Send Offer</h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                  Offer sent.
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Campaign
                </label>
                <select
                  value={campaignId}
                  onChange={(e) => setCampaignId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-white focus:border-[#0ea5e9] focus:outline-none"
                >
                  {campaigns.length === 0 ? (
                    <option value="">No campaigns</option>
                  ) : (
                    campaigns.map((c) => (
                      <option key={c.campaign_id} value={c.campaign_id}>
                        {c.brand} – {c.title}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Creator email *
                </label>
                <input
                  type="email"
                  value={creatorEmail}
                  onChange={(e) => setCreatorEmail(e.target.value)}
                  placeholder="creator@example.com"
                  className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-white placeholder-slate-500 focus:border-[#0ea5e9] focus:outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Creator must have a Dobble Tap account with this email.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Offer rate (NGN) *
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder={selected ? String(selected.compensation) : "0"}
                  className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-white placeholder-slate-500 focus:border-[#0ea5e9] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Deadline (optional)
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-white focus:border-[#0ea5e9] focus:outline-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-lg border border-white/[0.06] text-slate-300 hover:bg-white/[0.04] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending || campaigns.length === 0}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-white text-black font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
                >
                  {sending ? "Sending…" : "Send Offer"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
