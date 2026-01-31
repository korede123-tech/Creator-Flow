import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Upload as UploadIcon,
} from "lucide-react";
import { Campaign, OfferData, FeedbackData } from "../App";
import { OfferPage } from "./OfferPage";
import { UploadContent } from "./UploadContent";
import { FeedbackPage } from "./FeedbackPage";
import { UnderReview } from "./UnderReview";
import { PostSubmission } from "./PostSubmission";
import { PaymentStatus } from "./PaymentStatus";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { supabase } from "../utils/supabase/client";
import logo from "figma:asset/fcad7446971be733d3427a6b22f8f64253529daf.png";
import { Currency } from "../utils/currency";

interface CampaignDetailProps {
  campaign: Campaign;
  onBack: () => void;
  onAccept: (amount: number) => void;
  onDecline: () => void;
  onUploadSubmit: () => void;
  onFeedbackUpload: () => void;
  onPostConfirm: () => void;
  onDemoApprove?: () => void;
  currency?: Currency;
}

export function CampaignDetail({
  campaign,
  onBack,
  onAccept,
  onDecline,
  onUploadSubmit,
  onFeedbackUpload,
  onPostConfirm,
  onDemoApprove,
  currency = "NGN",
}: CampaignDetailProps) {
  // Convert campaign data to offer data format
  const rate = campaign.rate ?? campaign.compensation;
  const offerData: OfferData = {
    brand: campaign.brand,
    brandLogo: campaign.brandLogo || "",
    campaignTitle: campaign.title,
    amount: rate,
    counterAmount: rate * 1.2,
    deliverables: campaign.deliverable
      ? campaign.deliverable.split(/\n/).filter(Boolean)
      : [
          "60-second video showcasing the product",
          "Include product demo",
          "Use trending audio",
          "Tag brand and use campaign hashtag",
        ],
    deadline: campaign.deadline,
    expiresIn: "24h",
  };

  const feedbackData: FeedbackData = {
    items: campaign.lastFeedback
      ? [campaign.lastFeedback]
      : [
          "Please show the product application more clearly in the first 10 seconds",
          "Audio levels are slightly low—can you increase volume?",
          "Add text overlay with product name at 0:15",
          "End with our tagline",
        ],
  };

  // Define workflow steps
  const steps = [
    { id: "offered", label: "Offer", status: "offered" },
    { id: "accepted", label: "Upload", status: "accepted" },
    { id: "submitted", label: "Review", status: "submitted" },
    { id: "approved", label: "Post", status: "approved" },
    { id: "posted", label: "Payment", status: "posted" },
  ];

  const currentStepIndex = steps.findIndex((s) => {
    if (s.status === campaign.status) return true;
    if (
      s.status === "posted" &&
      ["posted_verified", "paid"].includes(campaign.status)
    )
      return true;
    return false;
  });
  const stepIndex = currentStepIndex >= 0 ? currentStepIndex : steps.length - 1;

  const [showReUpload, setShowReUpload] = useState(false);
  const version =
    campaign.status === "needs_revision" && campaign.lastFeedback ? 2 : 1;
  const lastFeedback = campaign.lastFeedback;

  const handleUploadSubmit = (data: {
    type: "file" | "drive_link";
    url: string;
    note?: string;
  }) => {
    setShowReUpload(false);
    onUploadSubmit();
  };

  const handleFeedbackUpload = () => {
    setShowReUpload(true);
  };

  const [postToken, setPostToken] = useState<string | null>(null);
  useEffect(() => {
    if (campaign.status !== "approved" || !campaign.id) {
      setPostToken(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc("get_or_create_post_submit_token", {
        p_creator_campaign_id: campaign.id,
      });
      const res = data as { ok?: boolean; token?: string } | null;
      if (!cancelled && res?.ok && res.token) setPostToken(res.token);
    })();
    return () => {
      cancelled = true;
    };
  }, [campaign.status, campaign.id]);

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0A0A0A]/95 border-b border-white/[0.06] backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <img src={logo} alt="Dobble Tap" className="h-7 w-7" />
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Campaigns
              </button>
            </div>
            <div className="text-sm text-slate-500">
              {campaign.brand} • {campaign.platform}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="border-b border-white/[0.06] bg-[#0D0D0D]/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      index <= stepIndex
                        ? "bg-white text-black"
                        : "bg-white/[0.06] text-slate-500"
                    }`}
                  >
                    {index < stepIndex ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div
                    className={`mt-2 text-xs font-medium ${
                      index <= stepIndex ? "text-white" : "text-slate-500"
                    }`}
                  >
                    {step.label}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-px mx-3 ${
                      index < stepIndex ? "bg-white" : "bg-white/[0.06]"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={campaign.status}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {campaign.status === "offered" && (
            <OfferPage
              data={offerData}
              onAccept={onAccept}
              onDecline={onDecline}
              currency={currency}
            />
          )}

          {(campaign.status === "accepted" ||
            campaign.status === "in_draft" ||
            (campaign.status === "needs_revision" && showReUpload)) && (
            <UploadContent
              campaign={{
                id: campaign.id,
                title: campaign.title,
                brand: campaign.brand,
                platform: campaign.platform,
                status: campaign.status,
              }}
              version={version}
              lastFeedback={lastFeedback}
              onBack={onBack}
              onSubmit={handleUploadSubmit}
            />
          )}

          {campaign.status === "needs_revision" && !showReUpload && (
            <FeedbackPage data={feedbackData} onUpload={handleFeedbackUpload} />
          )}

          {campaign.status === "submitted" && (
            <UnderReview onDemoApprove={onDemoApprove} />
          )}

          {campaign.status === "approved" && (
            <PostSubmission
              onConfirm={onPostConfirm}
              token={postToken ?? undefined}
              campaignId={campaign.id}
            />
          )}

          {(campaign.status === "posted" ||
            campaign.status === "posted_verified" ||
            campaign.status === "paid") && (
            <PaymentStatus amount={campaign.rate} currency={currency} />
          )}
        </motion.div>
      </div>
    </div>
  );
}
