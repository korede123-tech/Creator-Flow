import {
  Briefcase,
  Check,
  Clock,
  X,
  ThumbsUp,
  ThumbsDown,
  Eye,
  FileText,
  ExternalLink,
  PlayCircle,
  CheckSquare,
  Square,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatCurrency, Currency } from "../utils/currency";
import { supabase } from "../utils/supabase/client";

type TabType = "offers" | "active" | "needsAction" | "completed";

export interface CreatorCampaignRequest {
  id: string;
  creatorId: string;
  creatorName: string;
  brand: string;
  title: string;
  platform: string;
  status: string;
  rate: number;
  deadline: string | null;
  description: string;
  deliverables: string;
  submissionUrl?: string;
  submissionType?: string;
  submissionNote?: string;
}

interface AgencyCampaignRequestsProps {
  userId: string | undefined;
  onRefresh?: () => void;
  refreshTrigger?: number;
  currency?: Currency;
}

const platformColors: Record<string, string> = {
  tiktok: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  instagram: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  youtube: "bg-red-500/10 text-red-400 border-red-500/20",
};

const statusColors: Record<string, string> = {
  offered: "bg-[#0ea5e9]/10 text-[#0ea5e9] border-[#0ea5e9]/20",
  accepted: "bg-purple-400/10 text-purple-400 border-purple-400/20",
  in_draft: "bg-amber-400/10 text-amber-400 border-amber-400/20",
  submitted: "bg-amber-400/10 text-amber-400 border-amber-400/20",
  needs_revision: "bg-red-400/10 text-red-400 border-red-400/20",
  approved: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
  ready_to_post: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
  posted_submitted: "bg-amber-400/10 text-amber-400 border-amber-400/20",
  posted_verified: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
  paid: "bg-slate-400/10 text-slate-400 border-slate-400/20",
  cancelled: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export function AgencyCampaignRequests({
  userId,
  onRefresh,
  refreshTrigger = 0,
  currency = "NGN",
}: AgencyCampaignRequestsProps) {
  const [requests, setRequests] = useState<CreatorCampaignRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("offers");
  const [revisionModal, setRevisionModal] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [revisionFeedback, setRevisionFeedback] = useState("");
  const [viewRequest, setViewRequest] = useState<CreatorCampaignRequest | null>(
    null,
  );
  const [updating, setUpdating] = useState(false);

  // Filter campaigns by tab
  const offers = requests.filter((c) => c.status === "offered");
  const active = requests.filter((c) =>
    [
      "accepted",
      "in_draft",
      "submitted",
      "approved",
      "ready_to_post",
      "posted_submitted",
    ].includes(c.status),
  );
  const needsAction = requests.filter((c) =>
    ["needs_revision", "ready_to_post"].includes(c.status),
  );
  const completed = requests.filter((c) =>
    ["posted_verified", "paid"].includes(c.status),
  );

  const getTabRequests = () => {
    switch (activeTab) {
      case "offers":
        return offers;
      case "active":
        return active;
      case "needsAction":
        return needsAction;
      case "completed":
        return completed;
    }
  };

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setRequests([]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: mcRows } = await supabase
          .from("managed_creators")
          .select("id, display_name, creator_id")
          .eq("manager_user_id", userId)
          .not("creator_id", "is", null);

        const creatorIds = (mcRows ?? [])
          .map((r: { creator_id: string }) => r.creator_id)
          .filter(Boolean);
        const nameByCreatorId = new Map(
          (mcRows ?? []).map(
            (r: { creator_id: string; display_name: string }) => [
              r.creator_id,
              r.display_name ?? "Creator",
            ],
          ),
        );

        if (creatorIds.length === 0) {
          setRequests([]);
          setLoading(false);
          return;
        }

        const { data: ccRows } = await supabase
          .from("creator_campaigns")
          .select(
            "id, creator_id, status, rate, deadline, offer_date, submission_url, submission_type, submission_note, campaign:campaigns(brand, title, platform, description, deliverable)",
          )
          .in("creator_id", creatorIds)
          .order("offer_date", { ascending: false });

        setRequests(
          (ccRows ?? []).map((row: any) => ({
            id: row.id,
            creatorId: row.creator_id,
            creatorName: nameByCreatorId.get(row.creator_id) ?? "Creator",
            brand: row.campaign?.brand ?? "—",
            title: row.campaign?.title ?? "Untitled",
            platform: row.campaign?.platform ?? "tiktok",
            status: row.status ?? "offered",
            rate: Number(row.rate ?? 0),
            deadline: row.deadline
              ? new Date(row.deadline).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : null,
            description: row.campaign?.description ?? "",
            deliverables: row.campaign?.deliverable ?? "",
            submissionUrl: row.submission_url,
            submissionType: row.submission_type,
            submissionNote: row.submission_note,
          })),
        );
      } catch {
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, refreshTrigger]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeTab]);

  const handleAcceptOffer = async (id: string) => {
    setUpdating(true);
    try {
      await supabase
        .from("creator_campaigns")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("id", id);
      toast.success("Offer accepted");
      onRefresh?.();
    } finally {
      setUpdating(false);
    }
  };

  const handleDeclineOffer = async (id: string) => {
    setUpdating(true);
    try {
      await supabase
        .from("creator_campaigns")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", id);
      toast.success("Offer declined");
      onRefresh?.();
    } finally {
      setUpdating(false);
    }
  };

  const handleApprove = async (id: string) => {
    setUpdating(true);
    try {
      await supabase
        .from("creator_campaigns")
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", id);
      toast.success("Content approved");
      onRefresh?.();
    } finally {
      setUpdating(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionModal?.id || !revisionFeedback.trim()) return;
    setUpdating(true);
    try {
      await supabase
        .from("creator_campaigns")
        .update({
          status: "needs_revision",
          last_feedback: revisionFeedback.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", revisionModal.id);
      setRevisionModal(null);
      setRevisionFeedback("");
      toast.success("Revision requested");
      onRefresh?.();
    } finally {
      setUpdating(false);
    }
  };

  const handleBulkAccept = async () => {
    if (selectedIds.size === 0) return;
    setUpdating(true);
    try {
      await supabase
        .from("creator_campaigns")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .in("id", Array.from(selectedIds));

      toast.success(`Accepted ${selectedIds.size} offers`);
      setSelectedIds(new Set());
      onRefresh?.();
    } catch (e) {
      toast.error("Failed to accept offers");
    } finally {
      setUpdating(false);
    }
  };

  const handleBulkDecline = async () => {
    if (selectedIds.size === 0) return;
    setUpdating(true);
    try {
      await supabase
        .from("creator_campaigns")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .in("id", Array.from(selectedIds));

      toast.success(`Declined ${selectedIds.size} offers`);
      setSelectedIds(new Set());
      onRefresh?.();
    } catch (e) {
      toast.error("Failed to decline offers");
    } finally {
      setUpdating(false);
    }
  };

  const toggleSelectAll = () => {
    const list = getTabRequests();
    const selectable =
      activeTab === "offers"
        ? list
        : list.filter((r) => r.status === "submitted");

    const allSelected =
      selectable.length > 0 && selectable.every((r) => selectedIds.has(r.id));
    const next = new Set(selectedIds);
    selectable.forEach((r) =>
      allSelected ? next.delete(r.id) : next.add(r.id),
    );
    setSelectedIds(next);
  };

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    setUpdating(true);
    try {
      await supabase
        .from("creator_campaigns")
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .in("id", Array.from(selectedIds));

      toast.success(`Approved ${selectedIds.size} campaigns`);
      setSelectedIds(new Set());
      onRefresh?.();
    } catch (e) {
      toast.error("Failed to approve campaigns");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-400 text-sm">Loading…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">
          Creator campaign requests
        </h1>
        <p className="text-sm text-slate-400">
          Campaign offers and status for creators you manage
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-6 border-b border-white/[0.06] pb-px overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab("offers")}
          className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors relative ${
            activeTab === "offers"
              ? "text-white"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          Offers{" "}
          {offers.length > 0 && (
            <span className="ml-1 sm:ml-1.5 px-1.5 py-0.5 bg-[#0ea5e9] text-white rounded text-xs font-bold">
              {offers.length}
            </span>
          )}
          {activeTab === "offers" && (
            <motion.div
              layoutId="agencyActiveTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab("active")}
          className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors relative ${
            activeTab === "active"
              ? "text-white"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          Active {active.length > 0 && `(${active.length})`}
          {activeTab === "active" && (
            <motion.div
              layoutId="agencyActiveTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab("needsAction")}
          className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors relative ${
            activeTab === "needsAction"
              ? "text-white"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          <span className="hidden sm:inline">Needs Action</span>
          <span className="sm:hidden">Action</span>
          {needsAction.length > 0 && (
            <span className="ml-1 sm:ml-1.5 px-1.5 py-0.5 bg-red-500 text-white rounded text-xs font-bold">
              {needsAction.length}
            </span>
          )}
          {activeTab === "needsAction" && (
            <motion.div
              layoutId="agencyActiveTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors relative ${
            activeTab === "completed"
              ? "text-white"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          Completed {completed.length > 0 && `(${completed.length})`}
          {activeTab === "completed" && (
            <motion.div
              layoutId="agencyActiveTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
            />
          )}
        </button>
      </div>

      {/* Select All / Bulk Actions Header */}
      {(activeTab === "offers" && offers.length > 0) ||
      (activeTab === "active" &&
        active.some((r) => r.status === "submitted")) ? (
        <div className="flex items-center gap-2 mb-4 px-1">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            {(activeTab === "offers" &&
              offers.every((r) => selectedIds.has(r.id))) ||
            (activeTab === "active" &&
              active
                .filter((r) => r.status === "submitted")
                .every((r) => selectedIds.has(r.id)) &&
              active.some((r) => r.status === "submitted")) ? (
              <CheckSquare className="w-5 h-5 text-[#0ea5e9]" />
            ) : (
              <Square className="w-5 h-5" />
            )}
            <span>Select All {activeTab === "active" ? "Submitted" : ""}</span>
          </button>
        </div>
      ) : null}

      {requests.length === 0 ? (
        <div className="py-20 text-center">
          <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-6 h-6 text-slate-600" />
          </div>
          <h3 className="text-base font-medium text-white mb-1">
            No campaign requests yet
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Add creators to your roster and link them to platform accounts to
            see their campaign requests.
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {getTabRequests().length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 sm:py-20 text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-6 h-6 text-slate-600" />
              </div>
              <h3 className="text-sm sm:text-base font-medium text-white mb-1">
                No campaigns here
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                {activeTab === "offers" && "New offers will appear here"}
                {activeTab === "active" && "Active campaigns will show up here"}
                {activeTab === "needsAction" && "All caught up!"}
                {activeTab === "completed" &&
                  "Completed campaigns will be listed here"}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              {getTabRequests().map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-[#0D0D0D]/50 border border-white/[0.06] rounded-xl p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row">
                    {(r.status === "submitted" || r.status === "offered") && (
                      <button
                        onClick={() => toggleSelection(r.id)}
                        className="mt-1 shrink-0 text-slate-400 hover:text-white transition-colors"
                      >
                        {selectedIds.has(r.id) ? (
                          <CheckSquare className="w-5 h-5 text-[#0ea5e9]" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                    )}
                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-4 min-w-0 justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-slate-500 mb-1">
                          {r.creatorName}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-white">
                            {r.brand}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs font-medium border ${platformColors[r.platform] ?? "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}
                          >
                            {r.platform}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs font-medium border ${statusColors[r.status] ?? "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}
                          >
                            {r.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        <h3 className="text-white mb-1">{r.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
                          <span>{formatCurrency(r.rate, currency)}</span>
                          {r.deadline && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                Due {r.deadline}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {/* Action buttons based on status */}
                      <div className="flex flex-wrap justify-end gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setViewRequest(r)}
                          className="p-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.1] transition-colors"
                          title="View Brief"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {r.status === "offered" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleAcceptOffer(r.id)}
                              disabled={updating}
                              className="px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                            >
                              <ThumbsUp className="w-4 h-4" />
                              Accept
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeclineOffer(r.id)}
                              disabled={updating}
                              className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-sm font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                            >
                              <ThumbsDown className="w-4 h-4" />
                              Decline
                            </button>
                          </>
                        )}
                        {(r.status === "accepted" ||
                          r.status === "in_draft") && (
                          <div className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg text-xs text-purple-400 font-medium flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-purple-400 animate-pulse"></div>
                            Awaiting content
                          </div>
                        )}
                        {r.status === "submitted" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(r.id)}
                              disabled={updating}
                              className="px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                            >
                              <Check className="w-4 h-4" />
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setRevisionModal({ id: r.id, title: r.title })
                              }
                              disabled={updating}
                              className="px-3 py-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 text-sm font-medium hover:bg-amber-500/30 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                            >
                              <X className="w-4 h-4" />
                              Request revision
                            </button>
                          </>
                        )}
                        {r.status === "needs_revision" && (
                          <div className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 font-medium flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-red-400 animate-pulse"></div>
                            Awaiting revision
                          </div>
                        )}
                        {(r.status === "approved" ||
                          r.status === "ready_to_post") && (
                          <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400 font-medium">
                            Ready to post
                          </div>
                        )}
                        {r.status === "posted_submitted" && (
                          <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400 font-medium flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-amber-400 animate-pulse"></div>
                            Verifying...
                          </div>
                        )}
                        {r.status === "posted_verified" && (
                          <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400 font-medium">
                            Verified
                          </div>
                        )}
                        {r.status === "paid" && (
                          <div className="px-3 py-1.5 bg-slate-500/10 border border-slate-500/20 rounded-lg text-xs text-slate-400 font-medium">
                            Paid
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <AnimatePresence>
        {revisionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            onClick={() => setRevisionModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0D0D0D] border border-white/[0.12] rounded-2xl max-w-md w-full p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-2">
                Request revision
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                {revisionModal.title}
              </p>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Feedback for creator
              </label>
              <textarea
                value={revisionFeedback}
                onChange={(e) => setRevisionFeedback(e.target.value)}
                placeholder="e.g. Please show the product more clearly in the first 10 seconds..."
                rows={4}
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-lg text-white placeholder-slate-500 focus:border-amber-500/50 focus:outline-none resize-none mb-4"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRevisionModal(null);
                    setRevisionFeedback("");
                  }}
                  className="flex-1 py-2.5 px-4 rounded-lg border border-white/[0.06] text-slate-300 hover:bg-white/[0.04] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRequestRevision}
                  disabled={updating || !revisionFeedback.trim()}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-amber-500 text-black font-medium hover:bg-amber-400 transition-colors disabled:opacity-50"
                >
                  {updating ? "Sending…" : "Send feedback"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {viewRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            onClick={() => setViewRequest(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0D0D0D] border border-white/[0.12] rounded-2xl max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="text-sm text-slate-500 mb-1">
                    {viewRequest.brand}
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    {viewRequest.title}
                  </h3>
                </div>
                <button
                  onClick={() => setViewRequest(null)}
                  className="p-1 rounded-lg hover:bg-white/[0.06] text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {viewRequest.submissionUrl && (
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                    <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                      <PlayCircle className="w-4 h-4 text-[#0ea5e9]" />
                      Submission
                    </h4>
                    <div className="flex items-center justify-between gap-4 p-3 bg-black/20 rounded-lg border border-white/[0.06] mb-3">
                      <div className="min-w-0">
                        <div className="text-sm text-white truncate">
                          {viewRequest.submissionUrl}
                        </div>
                        <div className="text-xs text-slate-500 capitalize">
                          {viewRequest.submissionType?.replace("_", " ") ||
                            "Link"}
                        </div>
                      </div>
                      <a
                        href={viewRequest.submissionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    {viewRequest.submissionNote && (
                      <div className="text-sm text-slate-400">
                        <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold block mb-1">
                          Note from creator
                        </span>
                        "{viewRequest.submissionNote}"
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    Description
                  </h4>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {viewRequest.description || "No description provided."}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                    <Check className="w-4 h-4 text-slate-400" />
                    Deliverables
                  </h4>
                  <div className="space-y-2">
                    {viewRequest.deliverables ? (
                      viewRequest.deliverables
                        .split("\n")
                        .filter(Boolean)
                        .map((item, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 text-sm text-slate-400"
                          >
                            <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-600 shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))
                    ) : (
                      <p className="text-sm text-slate-500">
                        No specific deliverables listed.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6 pt-6 border-t border-white/[0.06]">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Rate</div>
                    <div className="text-lg font-semibold text-white">
                      {formatCurrency(viewRequest.rate, currency)}
                    </div>
                  </div>
                  {viewRequest.deadline && (
                    <div>
                      <div className="text-xs text-slate-500 mb-1">
                        Deadline
                      </div>
                      <div className="text-sm font-medium text-white flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {viewRequest.deadline}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8">
                <button
                  onClick={() => setViewRequest(null)}
                  className="w-full py-2.5 rounded-lg bg-white text-black font-medium hover:bg-white/90 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 sm:bottom-8 left-1/2 -translate-x-1/2 z-40"
          >
            <div className="bg-[#0D0D0D] border border-white/[0.12] rounded-full px-6 py-3 shadow-2xl flex items-center gap-4">
              <span className="text-sm text-white font-medium">
                {selectedIds.size}{" "}
                {selectedIds.size === 1 ? "campaign" : "campaigns"} selected
              </span>
              <div className="h-4 w-px bg-white/20" />
              {activeTab === "offers" ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBulkAccept}
                    disabled={updating}
                    className="px-4 py-1.5 bg-emerald-500 text-black text-sm font-bold rounded-full hover:bg-emerald-400 transition-colors disabled:opacity-50"
                  >
                    Accept
                  </button>
                  <button
                    onClick={handleBulkDecline}
                    disabled={updating}
                    className="px-4 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 text-sm font-bold rounded-full hover:bg-red-500/30 transition-colors disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleBulkApprove}
                  disabled={updating}
                  className="px-4 py-1.5 bg-emerald-500 text-black text-sm font-bold rounded-full hover:bg-emerald-400 transition-colors disabled:opacity-50"
                >
                  {updating ? "Approving..." : "Approve Selected"}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
