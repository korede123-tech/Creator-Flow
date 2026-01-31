import { useState, useEffect, type ReactNode } from "react";
import { motion } from "motion/react";
import { Instagram, Youtube, Globe, Music2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../utils/supabase/client";
import { SOCIAL_PLATFORMS, FOLLOWER_RANGES } from "./constants";
import type { CreatorSocialRow } from "./types";

const platformIconMap: Record<string, ReactNode> = {
  instagram: <Instagram className="w-5 h-5" />,
  youtube: <Youtube className="w-5 h-5" />,
  tiktok: <Music2 className="w-5 h-5" />,
};

interface SocialTabProps {
  creatorId: string;
  initial: CreatorSocialRow[];
  onSave: () => void;
}

type PlatformId = (typeof SOCIAL_PLATFORMS)[number]["id"];

export function SocialTab({ creatorId, initial, onSave }: SocialTabProps) {
  const byPlatform = new Map<
    PlatformId,
    { handle: string; follower_range: string }
  >();
  SOCIAL_PLATFORMS.forEach((p) => {
    const row = initial.find((r) => r.platform === p.id);
    byPlatform.set(p.id, {
      handle: row?.handle ?? "",
      follower_range: row?.follower_range ?? FOLLOWER_RANGES[0],
    });
  });

  const [state, setState] = useState(byPlatform);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const next = new Map<
      PlatformId,
      { handle: string; follower_range: string }
    >();
    SOCIAL_PLATFORMS.forEach((p) => {
      const row = initial.find((r) => r.platform === p.id);
      next.set(p.id, {
        handle: row?.handle ?? "",
        follower_range: row?.follower_range ?? FOLLOWER_RANGES[0],
      });
    });
    setState(next);
  }, [initial]);

  const update = (
    platform: PlatformId,
    field: "handle" | "follower_range",
    value: string,
  ) => {
    setState((prev) => {
      const next = new Map(prev);
      const cur = next.get(platform) ?? {
        handle: "",
        follower_range: FOLLOWER_RANGES[0],
      };
      next.set(platform, { ...cur, [field]: value });
      return next;
    });
  };

  const filled = Array.from(state.entries()).filter(([, v]) => v.handle.trim());
  const canSave = filled.length >= 1;

  const handleSave = async () => {
    if (!canSave) {
      setError("Add at least one platform with handle or URL.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const existing = await supabase
        .from("creator_social_accounts")
        .select("id, platform")
        .eq("creator_id", creatorId);
      const existingPlatforms = new Set(
        (existing.data ?? []).map((r: any) => r.platform),
      );

      for (const [platform, v] of state) {
        const h = v.handle.trim();
        if (!h) {
          if (existingPlatforms.has(platform)) {
            await supabase
              .from("creator_social_accounts")
              .delete()
              .eq("creator_id", creatorId)
              .eq("platform", platform);
          }
          continue;
        }
        const row = {
          creator_id: creatorId,
          platform,
          handle: h,
          follower_range: v.follower_range,
          updated_at: new Date().toISOString(),
        };
        await supabase.from("creator_social_accounts").upsert(row, {
          onConflict: "creator_id,platform",
        });
      }
      await supabase
        .from("creator_social_accounts")
        .delete()
        .eq("creator_id", creatorId)
        .eq("platform", "twitter");
      toast.success("Social accounts saved");
      onSave();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Save failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const baseInput =
    "w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-500 focus:border-[#0ea5e9] focus:outline-none";
  const baseLabel = "block text-xs text-slate-500 mb-2";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0D0D0D]/50 border border-white/[0.06] rounded-xl p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Share2 className="w-4 h-4 text-slate-400" />
        <h2 className="text-base font-semibold text-white">Social Media</h2>
      </div>
      <div className="space-y-4">
        {SOCIAL_PLATFORMS.map((p) => {
          const v = state.get(p.id) ?? {
            handle: "",
            follower_range: FOLLOWER_RANGES[0],
          };
          const filled = !!v.handle.trim();
          const icon = platformIconMap[p.id] ?? <Globe className="w-5 h-5" />;
          return (
            <div
              key={p.id}
              className={`bg-[#0D0D0D]/50 border rounded-xl p-5 transition-colors ${
                filled
                  ? "border-white/[0.08]"
                  : "border-white/[0.04] opacity-70"
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center text-slate-400">
                  {icon}
                </div>
                <span className="font-medium text-white">{p.label}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={baseLabel}>Handle or URL</label>
                  <input
                    type="text"
                    value={v.handle}
                    onChange={(e) => update(p.id, "handle", e.target.value)}
                    placeholder="@handle"
                    className={baseInput}
                  />
                </div>
                <div>
                  <label className={baseLabel}>Follower range</label>
                  <select
                    value={v.follower_range}
                    onChange={(e) =>
                      update(p.id, "follower_range", e.target.value)
                    }
                    className={baseInput}
                  >
                    {FOLLOWER_RANGES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {error}
        </div>
      )}
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave || saving}
          className="flex items-center justify-center px-6 py-2.5 bg-white text-black rounded-lg text-sm font-semibold tracking-[0.2px] hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </motion.div>
  );
}
