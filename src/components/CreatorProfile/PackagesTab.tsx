import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { Plus, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../utils/supabase/client";
import { formatCurrency, type Currency } from "../../utils/currency";
import {
  getPackagePriceNgn,
  convertToUserCurrency,
  convertToNgn,
  toPricingTier,
  type ActivityType,
  type PackagePlatform,
} from "../../utils/creatorPackagePricing";
import { PACKAGE_ACTIVITIES, PACKAGE_PLATFORMS } from "./constants";
import type { CreatorPackageRow, FollowerRangeByPlatform } from "./types";

interface PackageDraft {
  id: string | null;
  activity_type: ActivityType;
  platform: PackagePlatform;
  quantity: number;
  description: string;
  /** User-currency override for Reel/Video only. Null = use computed default. */
  priceOverride: number | null;
}

interface PackagesTabProps {
  creatorId: string;
  initial: CreatorPackageRow[];
  currency: Currency;
  followerRangeByPlatform: FollowerRangeByPlatform;
  onSave: () => void;
}

function isReelOrVideo(a: ActivityType): boolean {
  return a === "instagram_reel" || a === "tiktok_video";
}

const toDraft = (
  r: CreatorPackageRow,
  currency: Currency,
  followerRangeByPlatform: FollowerRangeByPlatform,
): PackageDraft => {
  const act = r.activity_type as ActivityType;
  const platform = r.platform as PackagePlatform;
  const priceOverride =
    isReelOrVideo(act) && !r.is_price_fixed && r.price_converted > 0
      ? r.price_converted
      : null;
  return {
    id: r.id,
    activity_type: act,
    platform,
    quantity: r.quantity,
    description: r.description ?? "",
    priceOverride,
  };
};

function isStory(a: ActivityType): boolean {
  return a === "instagram_story" || a === "tiktok_story";
}

function activityNeedsPlatform(a: ActivityType): boolean {
  return a === "comment" || a === "repost";
}

const emptyDraft = (): PackageDraft => ({
  id: null,
  activity_type: "instagram_story",
  platform: "instagram",
  quantity: 1,
  description: "",
  priceOverride: null,
});

const baseInput =
  "w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-500 focus:border-[#0ea5e9] focus:outline-none";
const baseLabel = "block text-xs text-slate-500 mb-2";

export function PackagesTab({
  creatorId,
  initial,
  currency,
  followerRangeByPlatform,
  onSave,
}: PackagesTabProps) {
  const [packages, setPackages] = useState<PackageDraft[]>(() =>
    initial.length
      ? initial.map((r) => toDraft(r, currency, followerRangeByPlatform))
      : [emptyDraft()],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setPackages(
      initial.length
        ? initial.map((r) => toDraft(r, currency, followerRangeByPlatform))
        : [emptyDraft()],
    );
  }, [initial, currency, followerRangeByPlatform]);

  const update = (index: number, field: keyof PackageDraft, value: unknown) => {
    setPackages((prev) => {
      let updated: PackageDraft = {
        ...prev[index],
        [field]: value,
      } as PackageDraft;
      if (field === "activity_type" && updated) {
        const act = updated.activity_type as ActivityType;
        updated = { ...updated, priceOverride: null };
        if (!activityNeedsPlatform(act)) {
          const chosen = PACKAGE_ACTIVITIES.find((a) => a.id === act);
          updated = {
            ...updated,
            platform: chosen?.platform ?? updated.platform,
            quantity: isStory(act)
              ? Math.max(1, Math.min(10, updated.quantity))
              : 1,
          };
        } else {
          updated = {
            ...updated,
            platform:
              updated.platform === "instagram" || updated.platform === "tiktok"
                ? updated.platform
                : "instagram",
            quantity: 1,
          };
        }
      }
      return prev.map((p, i) => (i === index ? updated : p));
    });
  };

  const add = () => setPackages((prev) => [...prev, emptyDraft()]);
  const remove = (index: number) => {
    if (packages.length <= 1) return;
    setPackages((prev) => prev.filter((_, i) => i !== index));
  };

  const valid = useMemo(() => {
    return packages.every((p) => {
      const tier = toPricingTier(followerRangeByPlatform[p.platform]);
      const { isFixed } = getPackagePriceNgn(
        p.activity_type,
        p.platform,
        p.quantity,
        tier,
      );
      if (isStory(p.activity_type)) return p.quantity >= 1 && p.quantity <= 10;
      if (isReelOrVideo(p.activity_type))
        return (
          p.quantity === 1 && (p.priceOverride === null || p.priceOverride > 0)
        );
      return p.quantity === 1 && isFixed;
    });
  }, [packages, followerRangeByPlatform]);

  const canSave = packages.length >= 1 && valid;

  const handleSave = async () => {
    if (!canSave) {
      setError(
        "Add at least one package. Stories: quantity 1–10. Fixed activities: quantity 1.",
      );
      return;
    }
    setError("");
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from("creator_packages")
        .select("id")
        .eq("creator_id", creatorId);
      const existingIds = new Set(
        (existing ?? []).map((r: { id: string }) => r.id),
      );

      for (const p of packages) {
        const tier = toPricingTier(followerRangeByPlatform[p.platform]);
        const { priceBaseNgn, isFixed } = getPackagePriceNgn(
          p.activity_type,
          p.platform,
          p.quantity,
          tier,
        );
        let price_base_ngn: number;
        let price_converted: number;
        let is_price_fixed: boolean;
        if (
          isReelOrVideo(p.activity_type) &&
          p.priceOverride != null &&
          p.priceOverride > 0
        ) {
          price_base_ngn = convertToNgn(p.priceOverride, currency);
          price_converted = p.priceOverride;
          is_price_fixed = false;
        } else {
          price_base_ngn = priceBaseNgn;
          price_converted = convertToUserCurrency(priceBaseNgn, currency);
          is_price_fixed = isFixed;
        }
        const row = {
          creator_id: creatorId,
          platform: p.platform,
          activity_type: p.activity_type,
          quantity: p.quantity,
          price_base_ngn,
          price_converted,
          currency,
          is_price_fixed,
          description: p.description.trim() || null,
        };
        if (p.id && existingIds.has(p.id)) {
          await supabase.from("creator_packages").update(row).eq("id", p.id);
        } else {
          await supabase.from("creator_packages").insert(row);
        }
      }

      const keptIds = new Set(packages.map((p) => p.id).filter(Boolean));
      for (const id of existingIds) {
        if (!keptIds.has(id)) {
          await supabase.from("creator_packages").delete().eq("id", id);
        }
      }
      toast.success("Packages saved");
      onSave();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Save failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0D0D0D]/50 border border-white/[0.06] rounded-xl p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-4 h-4 text-slate-400" />
        <h2 className="text-base font-semibold text-white">Packages</h2>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        Prices are standardized based on your audience size to ensure fairness
        and consistency for brands.
      </p>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-slate-400">Offer packages</span>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-sm font-medium text-white hover:bg-white/[0.1] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add package
        </button>
      </div>

      <div className="space-y-6">
        {packages.map((p, index) => {
          const tier = toPricingTier(followerRangeByPlatform[p.platform]);
          const { priceBaseNgn } = getPackagePriceNgn(
            p.activity_type,
            p.platform,
            p.quantity,
            tier,
          );
          const priceConverted = convertToUserCurrency(priceBaseNgn, currency);
          const showPlatform = activityNeedsPlatform(p.activity_type);
          const isStoryActivity = isStory(p.activity_type);
          return (
            <div
              key={index}
              className="bg-[#0D0D0D]/50 border border-white/[0.06] rounded-xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-400">
                  Package {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  disabled={packages.length <= 1}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={baseLabel}>Activity type</label>
                  <select
                    value={p.activity_type}
                    onChange={(e) =>
                      update(
                        index,
                        "activity_type",
                        e.target.value as ActivityType,
                      )
                    }
                    className={baseInput}
                  >
                    {PACKAGE_ACTIVITIES.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>
                {showPlatform && (
                  <div>
                    <label className={baseLabel}>Platform</label>
                    <select
                      value={p.platform}
                      onChange={(e) =>
                        update(
                          index,
                          "platform",
                          e.target.value as PackagePlatform,
                        )
                      }
                      className={baseInput}
                    >
                      {PACKAGE_PLATFORMS.map((x) => (
                        <option key={x} value={x}>
                          {x === "instagram" ? "Instagram" : "TikTok"}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={baseLabel}>Quantity</label>
                  {isStoryActivity ? (
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={p.quantity}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10) || 1;
                        update(index, "quantity", Math.max(1, Math.min(10, v)));
                      }}
                      className={baseInput}
                    />
                  ) : (
                    <input
                      type="number"
                      value={1}
                      readOnly
                      disabled
                      className={`${baseInput} opacity-60 cursor-not-allowed`}
                    />
                  )}
                </div>
                <div>
                  <label className={baseLabel}>Price ({currency})</label>
                  {isReelOrVideo(p.activity_type) ? (
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={
                        p.priceOverride != null
                          ? p.priceOverride
                          : priceConverted
                      }
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        if (raw === "") {
                          update(index, "priceOverride", null);
                          return;
                        }
                        const v = parseInt(raw, 10);
                        if (!Number.isNaN(v)) update(index, "priceOverride", v);
                      }}
                      className={baseInput}
                      placeholder={String(priceConverted)}
                    />
                  ) : (
                    <div
                      className={`${baseInput} bg-white/[0.02] cursor-default`}
                      aria-readonly
                    >
                      {formatCurrency(priceConverted, currency)}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className={baseLabel}>Description</label>
                <textarea
                  value={p.description}
                  onChange={(e) => update(index, "description", e.target.value)}
                  placeholder="Short explanation of what the brand gets"
                  rows={2}
                  className={`${baseInput} resize-none`}
                />
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
