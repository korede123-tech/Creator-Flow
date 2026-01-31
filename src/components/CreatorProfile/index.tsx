import { useState, useMemo, useEffect } from "react";
import { motion } from "motion/react";
import { CheckCircle2, Circle, Send, Target } from "lucide-react";
import { supabase } from "../../utils/supabase/client";
import { SocialTab } from "./SocialTab";
import { PackagesTab } from "./PackagesTab";
import type {
  CreatorProfileProps,
  CreatorProfileTab,
  FollowerRangeByPlatform,
} from "./types";

function buildFollowerRangeByPlatform(
  social: { platform: string; follower_range: string }[],
): FollowerRangeByPlatform {
  const out: FollowerRangeByPlatform = {};
  for (const r of social) {
    if (r.platform === "instagram" || r.platform === "tiktok") {
      out[r.platform] = r.follower_range;
    }
  }
  return out;
}

export function CreatorProfile({
  userId,
  creatorId,
  initialProfile,
  initialSocial,
  initialPackages,
  currency,
  onRefresh,
}: CreatorProfileProps) {
  const [tab, setTab] = useState<CreatorProfileTab>("social");
  const [profile, setProfile] = useState(initialProfile);
  const [social, setSocial] = useState(initialSocial);
  const [packages, setPackages] = useState(initialPackages);
  const [publishing, setPublishing] = useState(false);

  const followerRangeByPlatform = useMemo(
    () => buildFollowerRangeByPlatform(social),
    [social],
  );

  useEffect(() => {
    setProfile(initialProfile);
    setSocial(initialSocial);
    setPackages(initialPackages);
  }, [initialProfile, initialSocial, initialPackages]);

  const detailsValid = useMemo(() => {
    const p = profile;
    if (!p) return false;
    const loc = (p.location ?? "").trim();
    const n = p.niches ?? [];
    return loc.length > 0 && n.length >= 1;
  }, [profile]);

  const socialValid = (social?.length ?? 0) >= 1;
  const packagesValid = (packages?.length ?? 0) >= 1;
  const complete = detailsValid && socialValid && packagesValid;
  const isLive = profile?.status === "live";

  const refresh = () => {
    onRefresh();
  };

  const handleSocialSave = () => refresh();
  const handlePackagesSave = () => refresh();

  const handlePublish = async () => {
    if (!complete || !profile?.id) return;
    setPublishing(true);
    try {
      const { error } = await supabase
        .from("creator_profiles")
        .update({
          status: isLive ? "draft" : "live",
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);
      if (error) throw error;
      setProfile((p) =>
        p ? { ...p, status: isLive ? "draft" : "live" } : null,
      );
      refresh();
    } finally {
      setPublishing(false);
    }
  };

  const tabs: { id: CreatorProfileTab; label: string }[] = [
    { id: "social", label: "Social Media" },
    { id: "packages", label: "Packages" },
  ];

  return (
    <div className="space-y-6">
      {/* Completion indicator — Account-style card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0D0D0D]/50 border border-white/[0.06] rounded-xl p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-slate-400" />
          <h2 className="text-base font-semibold text-white">
            Profile completion
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {[
            { done: detailsValid, label: "Details" },
            { done: socialValid, label: "1+ social" },
            { done: packagesValid, label: "1+ package" },
          ].map(({ done, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              {done ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Circle className="w-4 h-4 text-slate-500" />
              )}
              <span
                className={`text-xs ${done ? "text-emerald-400" : "text-slate-500"}`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handlePublish}
            disabled={!complete || publishing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0ea5e9] text-white text-sm font-semibold hover:bg-[#0ea5e9]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
            {publishing ? "…" : isLive ? "Unpublish" : "Publish"}
          </button>
          {isLive && (
            <span className="text-xs text-emerald-400 font-medium">
              Live — visible to brands
            </span>
          )}
          {!complete && (
            <span className="text-xs text-slate-500">
              Complete all steps to publish
            </span>
          )}
        </div>
      </motion.div>

      {/* Sub-tabs */}
      <div className="border-b border-white/[0.06]">
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t.id
                  ? "text-white border-[#0ea5e9]"
                  : "text-slate-400 border-transparent hover:text-slate-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "social" && (
        <SocialTab
          creatorId={creatorId}
          initial={social}
          onSave={handleSocialSave}
        />
      )}
      {tab === "packages" && (
        <PackagesTab
          creatorId={creatorId}
          initial={packages}
          currency={currency}
          followerRangeByPlatform={followerRangeByPlatform}
          onSave={handlePackagesSave}
        />
      )}
    </div>
  );
}
