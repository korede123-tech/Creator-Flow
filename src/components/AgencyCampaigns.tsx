import { Briefcase, FlaskConical, Plus, Send } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { formatCurrency, Currency } from "../utils/currency";
import { CreateCampaignModal, CreateCampaignForm } from "./CreateCampaignModal";
import { SendOfferModal, AgencyCampaignOption } from "./SendOfferModal";

interface AgencyCampaignsProps {
  campaigns: AgencyCampaignOption[];
  onCreateCampaign: (data: CreateCampaignForm) => void | Promise<void>;
  onSendOffer: (params: {
    campaignId: string;
    creatorEmail: string;
    rate: number;
    deadline: string | null;
  }) => Promise<{ ok: boolean; error?: string }>;
  onSeedDemo: () => Promise<{ ok: boolean; error?: string }>;
  onRefresh: () => void;
  currency?: Currency;
}

const platformColors: Record<string, string> = {
  tiktok: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  instagram: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  youtube: "bg-red-500/10 text-red-400 border-red-500/20",
};

export function AgencyCampaigns({
  campaigns,
  onCreateCampaign,
  onSendOffer,
  onSeedDemo,
  onRefresh,
  currency = "NGN",
}: AgencyCampaignsProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [showSendOffer, setShowSendOffer] = useState(false);
  const [sendOfferCampaignId, setSendOfferCampaignId] = useState<string | null>(
    null,
  );
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState("");

  const handleCreate = async (data: CreateCampaignForm) => {
    await onCreateCampaign(data);
    onRefresh();
  };

  const openSendOffer = (campaignId: string) => {
    setSendOfferCampaignId(campaignId);
    setShowSendOffer(true);
  };

  const closeSendOffer = () => {
    setShowSendOffer(false);
    setSendOfferCampaignId(null);
    onRefresh();
  };

  const handleSeedDemo = async () => {
    setSeedError("");
    setSeeding(true);
    try {
      const res = await onSeedDemo();
      if (!res.ok) setSeedError(res.error ?? "Failed to load demo campaigns");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">My Campaigns</h1>
          <p className="text-sm text-slate-400">
            Create campaigns and send offers to creators
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Campaign
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="py-20 text-center">
          <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-6 h-6 text-slate-600" />
          </div>
          <h3 className="text-base font-medium text-white mb-1">
            No campaigns yet
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            Create a campaign, then send offers to creators. Or load demo
            campaigns to test.
          </p>
          {seedError && (
            <div className="mb-4 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm max-w-md mx-auto">
              {seedError}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleSeedDemo}
              disabled={seeding}
              className="px-4 py-2 bg-[#0ea5e9] text-white rounded-lg text-sm font-semibold hover:bg-[#0ea5e9]/90 transition-colors inline-flex items-center gap-2 disabled:opacity-50"
            >
              <FlaskConical className="w-4 h-4" />
              {seeding ? "Loading…" : "Load demo campaigns"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Campaign
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c, i) => (
            <motion.div
              key={c.campaign_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-[#0D0D0D]/50 border border-white/[0.06] hover:border-white/[0.12] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-white">{c.brand}</span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-xs font-medium border ${platformColors[c.platform] ?? "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}
                  >
                    {c.platform}
                  </span>
                </div>
                <h3 className="text-white mb-1">{c.title}</h3>
                <p className="text-sm text-slate-400">
                  {formatCurrency(c.compensation, currency)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => openSendOffer(c.campaign_id)}
                className="shrink-0 px-4 py-2 rounded-lg bg-[#0ea5e9] text-white text-sm font-medium hover:bg-[#0ea5e9]/90 transition-colors inline-flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send Offer
              </button>
            </motion.div>
          ))}
        </div>
      )}

      <CreateCampaignModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
        currency={currency}
      />
      <SendOfferModal
        isOpen={showSendOffer}
        onClose={closeSendOffer}
        campaigns={campaigns}
        preselectedCampaignId={sendOfferCampaignId}
        onSend={onSendOffer}
      />
    </div>
  );
}
