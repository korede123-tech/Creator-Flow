/**
 * SMM-style creator package pricing. NGN baselines, tier-based.
 * All amounts in NGN; convert to user currency via convertToUserCurrency.
 */

import { convertCurrency, type Currency } from "./currency";

export type PricingTier = "0–5k" | "6k–20k" | "21k–50k" | "51k–100k" | "100k+";

export const PRICING_TIERS: PricingTier[] = [
  "0–5k",
  "6k–20k",
  "21k–50k",
  "51k–100k",
  "100k+",
];

const STORY_PRICE_NGN: Record<PricingTier, number> = {
  "0–5k": 200,
  "6k–20k": 400,
  "21k–50k": 700,
  "51k–100k": 1_200,
  "100k+": 2_000,
};

/** Reel/Video: story × 5 (spec). */
function getReelOrVideoPriceNgn(tier: PricingTier): number {
  return STORY_PRICE_NGN[tier] * 5;
}

/** Comment: ₦100–₦300 tier-based. */
const COMMENT_PRICE_NGN: Record<PricingTier, number> = {
  "0–5k": 100,
  "6k–20k": 150,
  "21k–50k": 200,
  "51k–100k": 250,
  "100k+": 300,
};

/** Repost: ₦300–₦800 tier-based. */
const REPOST_PRICE_NGN: Record<PricingTier, number> = {
  "0–5k": 300,
  "6k–20k": 400,
  "21k–50k": 500,
  "51k–100k": 600,
  "100k+": 800,
};

export function getStoryPriceNgn(tier: PricingTier): number {
  return STORY_PRICE_NGN[tier];
}

export function getReelPriceNgn(tier: PricingTier): number {
  return getReelOrVideoPriceNgn(tier);
}

export function getVideoPriceNgn(tier: PricingTier): number {
  return getReelOrVideoPriceNgn(tier);
}

export function getCommentPriceNgn(tier: PricingTier): number {
  return COMMENT_PRICE_NGN[tier];
}

export function getRepostPriceNgn(tier: PricingTier): number {
  return REPOST_PRICE_NGN[tier];
}

export type ActivityType =
  | "instagram_reel"
  | "tiktok_video"
  | "instagram_story"
  | "tiktok_story"
  | "comment"
  | "repost";

export type PackagePlatform = "instagram" | "tiktok";

export interface PackagePriceResult {
  priceBaseNgn: number;
  isFixed: boolean;
}

export function getPackagePriceNgn(
  activityType: ActivityType,
  _platform: PackagePlatform,
  quantity: number,
  tier: PricingTier,
): PackagePriceResult {
  const isStory =
    activityType === "instagram_story" || activityType === "tiktok_story";
  if (isStory) {
    const base = getStoryPriceNgn(tier);
    return {
      priceBaseNgn: base * Math.max(1, Math.min(10, quantity)),
      isFixed: false,
    };
  }
  switch (activityType) {
    case "instagram_reel":
      return { priceBaseNgn: getReelPriceNgn(tier), isFixed: true };
    case "tiktok_video":
      return { priceBaseNgn: getVideoPriceNgn(tier), isFixed: true };
    case "comment":
      return { priceBaseNgn: getCommentPriceNgn(tier), isFixed: true };
    case "repost":
      return { priceBaseNgn: getRepostPriceNgn(tier), isFixed: true };
    default:
      return { priceBaseNgn: 0, isFixed: true };
  }
}

/** NGN → user currency. Uses NGN as base. */
export function convertToUserCurrency(
  ngn: number,
  userCurrency: Currency,
): number {
  return convertCurrency(ngn, "NGN", userCurrency);
}

/** User currency → NGN. For Reel/Video price overrides. */
export function convertToNgn(amount: number, userCurrency: Currency): number {
  return Math.round(convertCurrency(amount, userCurrency, "NGN"));
}

/** Normalize follower_range to PricingTier. Fallback 0–5k. */
export function toPricingTier(followerRange: string | undefined): PricingTier {
  const t = followerRange?.trim();
  if (PRICING_TIERS.includes(t as PricingTier)) return t as PricingTier;
  return "0–5k";
}
