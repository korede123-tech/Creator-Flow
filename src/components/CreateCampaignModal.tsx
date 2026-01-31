import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { Currency } from "../utils/currency";

export interface CreateCampaignForm {
  brand: string;
  brandLogoUrl?: string;
  title: string;
  platform: "tiktok" | "instagram" | "youtube";
  deliverable: string;
  compensation: number;
  timeline: string;
}

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CreateCampaignForm) => void | Promise<void>;
  currency?: Currency;
}

export function CreateCampaignModal({
  isOpen,
  onClose,
  onCreate,
  currency = "NGN",
}: CreateCampaignModalProps) {
  const [brand, setBrand] = useState("");
  const [brandLogoUrl, setBrandLogoUrl] = useState("");
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState<"tiktok" | "instagram" | "youtube">(
    "tiktok",
  );
  const [deliverable, setDeliverable] = useState("");
  const [compensation, setCompensation] = useState("");
  const [timeline, setTimeline] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const comp = parseFloat(compensation);
    if (!brand.trim()) {
      setError("Brand is required");
      return;
    }
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!deliverable.trim()) {
      setError("Deliverable is required");
      return;
    }
    if (isNaN(comp) || comp < 0) {
      setError("Compensation must be a positive number");
      return;
    }
    setSaving(true);
    try {
      await onCreate({
        brand: brand.trim(),
        brandLogoUrl: brandLogoUrl.trim() || undefined,
        title: title.trim(),
        platform,
        deliverable: deliverable.trim(),
        compensation: comp,
        timeline: timeline.trim() || "TBD",
      });
      setBrand("");
      setBrandLogoUrl("");
      setTitle("");
      setDeliverable("");
      setCompensation("");
      setTimeline("");
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create campaign",
      );
    } finally {
      setSaving(false);
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
            className="bg-[#0D0D0D] border border-white/[0.12] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
              <h2 className="text-lg font-semibold text-white">
                Create Campaign
              </h2>
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
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Brand *
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Nike"
                  className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-white placeholder-slate-500 focus:border-[#0ea5e9] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Brand logo URL
                </label>
                <input
                  type="url"
                  value={brandLogoUrl}
                  onChange={(e) => setBrandLogoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-white placeholder-slate-500 focus:border-[#0ea5e9] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Campaign title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Summer Product Launch"
                  className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-white placeholder-slate-500 focus:border-[#0ea5e9] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Platform
                </label>
                <select
                  value={platform}
                  onChange={(e) =>
                    setPlatform(
                      e.target.value as "tiktok" | "instagram" | "youtube",
                    )
                  }
                  className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-white focus:border-[#0ea5e9] focus:outline-none"
                >
                  <option value="tiktok">TikTok</option>
                  <option value="instagram">Instagram</option>
                  <option value="youtube">YouTube</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Deliverable *
                </label>
                <textarea
                  value={deliverable}
                  onChange={(e) => setDeliverable(e.target.value)}
                  placeholder="e.g. 60s video, 3 Reels..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-white placeholder-slate-500 focus:border-[#0ea5e9] focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Compensation ({currency}) *
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={compensation}
                  onChange={(e) => setCompensation(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-white placeholder-slate-500 focus:border-[#0ea5e9] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Timeline
                </label>
                <input
                  type="text"
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  placeholder="e.g. 2 weeks, TBD"
                  className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-white placeholder-slate-500 focus:border-[#0ea5e9] focus:outline-none"
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
                  disabled={saving}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-white text-black font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
                >
                  {saving ? "Creating…" : "Create Campaign"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
