import { useState, useEffect } from "react";
import {
  Link2,
  CheckCircle2,
  Upload,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "./Button";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../utils/supabase/client";

interface PostSubmissionProps {
  onConfirm: () => void;
  token?: string;
  campaignId?: string;
}

type SubmissionStatus =
  | "idle"
  | "submitting"
  | "checking"
  | "success"
  | "needs_proof"
  | "error";

export function PostSubmission({
  onConfirm,
  token,
  campaignId,
}: PostSubmissionProps) {
  const [postUrl, setPostUrl] = useState("");
  const [status, setStatus] = useState<SubmissionStatus>("idle");
  const [error, setError] = useState("");
  const [platform, setPlatform] = useState("");
  const [metrics, setMetrics] = useState<any>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);

  // Poll for status after submission
  useEffect(() => {
    if (status === "checking" && token) {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/make-server-8061e72e/api/public/post/status?token=${token}`,
            {
              headers: {
                apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              },
            },
          );

          const data = await response.json();

          if (data.scrape_status === "success") {
            setStatus("success");
            setMetrics(data);
            clearInterval(interval);
            setTimeout(() => onConfirm(), 2000);
          } else if (data.scrape_status === "needs_manual_proof") {
            setStatus("needs_proof");
            setError(
              data.scrape_error || "Unable to verify post automatically",
            );
            clearInterval(interval);
          } else if (data.scrape_status === "failed") {
            setStatus("error");
            setError(data.scrape_error || "Failed to verify post");
            clearInterval(interval);
          }
        } catch (err) {
          console.error("Error polling status:", err);
        }
      }, 3000); // Poll every 3 seconds

      return () => clearInterval(interval);
    }
  }, [status, token]);

  const handleSubmit = async () => {
    if (!postUrl.trim()) {
      setError("Please enter a post URL");
      return;
    }
    if (!token) {
      setError("Missing campaign token");
      return;
    }

    setStatus("submitting");
    setError("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/make-server-8061e72e/api/public/post/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            token,
            post_url: postUrl,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit post");
      }

      setPlatform(data.platform);
      setStatus("checking");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to submit post");
    }
  };

  const handleMarkPostedDemo = async () => {
    if (!campaignId) return;
    setStatus("submitting");
    setError("");
    try {
      const { error: updateErr } = await supabase
        .from("creator_campaigns")
        .update({
          status: "posted_verified",
          updated_at: new Date().toISOString(),
        })
        .eq("id", campaignId);
      if (updateErr) throw updateErr;

      const { data: rpcData } = await supabase.rpc(
        "complete_campaign_earning_for_posted",
        {
          p_creator_campaign_id: campaignId,
        },
      );
      const res = rpcData as { ok?: boolean; error?: string } | null;
      if (!res?.ok) throw new Error(res?.error ?? "Failed to credit wallet");

      setStatus("success");
      setTimeout(() => onConfirm(), 1500);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to mark as posted");
    }
  };

  const handleManualProof = async () => {
    if (!proofFile) {
      setError("Please select a screenshot");
      return;
    }
    if (!token) {
      setError("Missing campaign token");
      return;
    }

    try {
      setIsUploadingProof(true);
      setError("");

      // Upload screenshot to Supabase Storage
      const fileExt = proofFile.name.split(".").pop() || "png";
      const objectPath = `proofs/${token}/${Date.now()}.${fileExt}`;
      const { error: uploadErr } = await supabase.storage
        .from("proofs")
        .upload(objectPath, proofFile, {
          upsert: true,
          contentType: proofFile.type,
        });
      if (uploadErr) throw uploadErr;

      const { data: publicUrlData } = supabase.storage
        .from("proofs")
        .getPublicUrl(objectPath);
      const screenshotUrl = publicUrlData.publicUrl;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/make-server-8061e72e/api/public/post/manual-proof`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            token,
            screenshot_url: screenshotUrl,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit proof");
      }

      setStatus("success");
      setTimeout(() => onConfirm(), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit proof");
    } finally {
      setIsUploadingProof(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {status === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="mb-8 text-center">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Link2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Submit Your Post
              </h1>
              <p className="text-sm text-slate-400">
                Paste the link to your published post below
              </p>
            </div>

            <div className="bg-[#0D0D0D]/50 border border-white/[0.06] rounded-xl p-6 mb-6">
              <label className="block text-sm font-medium text-white mb-3">
                Post URL
              </label>
              <input
                type="url"
                value={postUrl}
                onChange={(e) => setPostUrl(e.target.value)}
                placeholder="https://tiktok.com/@username/video/..."
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-lg text-white placeholder:text-slate-500 focus:border-[#0ea5e9] focus:outline-none transition-colors"
                autoFocus
              />
              <p className="mt-2 text-xs text-slate-500">
                Supported platforms: TikTok, Instagram, YouTube
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={!postUrl.trim()}
                className="flex-1"
              >
                Submit Post
              </Button>
              {campaignId && (
                <button
                  type="button"
                  onClick={handleMarkPostedDemo}
                  className="px-4 py-3 rounded-lg border border-white/[0.12] text-slate-400 text-sm font-medium hover:bg-white/[0.04] hover:text-white transition-colors"
                >
                  Mark as posted (demo)
                </button>
              )}
            </div>
          </motion.div>
        )}

        {(status === "submitting" || status === "checking") && (
          <motion.div
            key="checking"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-[#0ea5e9]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-[#0ea5e9] animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              {status === "submitting"
                ? "Submitting..."
                : "Verifying Your Post"}
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              This usually takes a few seconds
            </p>
            {platform && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/[0.05] border border-white/[0.06] rounded-lg">
                <span className="text-xs text-slate-400">Platform:</span>
                <span className="text-sm font-medium text-white capitalize">
                  {platform}
                </span>
              </div>
            )}
          </motion.div>
        )}

        {status === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Post Confirmed!
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              Your post has been verified successfully
            </p>

            {metrics && (
              <div className="bg-[#0D0D0D]/50 border border-white/[0.06] rounded-xl p-6 mb-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Views</div>
                    <div className="text-lg font-bold text-white">
                      {metrics.views?.toLocaleString() || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Likes</div>
                    <div className="text-lg font-bold text-white">
                      {metrics.likes?.toLocaleString() || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Comments</div>
                    <div className="text-lg font-bold text-white">
                      {metrics.comments?.toLocaleString() || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Shares</div>
                    <div className="text-lg font-bold text-white">
                      {metrics.shares?.toLocaleString() || 0}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="text-sm text-slate-400">
              Payment will be processed within 24-48 hours
            </div>
          </motion.div>
        )}

        {status === "needs_proof" && (
          <motion.div
            key="proof"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="mb-8 text-center">
              <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                Manual Verification Needed
              </h2>
              <p className="text-sm text-slate-400">
                We couldn't verify your post automatically. Please upload a
                screenshot.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-sm text-amber-400">{error}</p>
              </div>
            )}

            <div className="bg-[#0D0D0D]/50 border border-white/[0.06] rounded-xl p-6 mb-6">
              <label className="block text-sm font-medium text-white mb-3">
                Upload Screenshot
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white file:text-black file:text-sm file:font-medium hover:file:bg-white/90"
              />
              <p className="mt-2 text-xs text-slate-500">
                Include post metrics visible in the screenshot
              </p>
            </div>

            <Button
              variant="primary"
              onClick={handleManualProof}
              disabled={!proofFile}
            >
              {isUploadingProof ? "Uploading…" : "Submit Proof"}
            </Button>
          </motion.div>
        )}

        {status === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Submission Failed
            </h2>
            <p className="text-sm text-red-400 mb-6">{error}</p>
            <button
              onClick={() => {
                setStatus("idle");
                setError("");
              }}
              className="px-4 py-2 bg-white/[0.05] border border-white/[0.06] rounded-lg text-sm font-medium text-white hover:bg-white/[0.08] transition-colors"
            >
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
