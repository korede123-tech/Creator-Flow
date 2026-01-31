export const NICHES = [
  "Fashion",
  "Lifestyle",
  "Sports",
  "Food",
  "Music",
  "Tech",
  "Culture",
  "Comedy",
] as const;

export const AUDIENCE_REGIONS = [
  "Nigeria",
  "West Africa",
  "Africa-wide",
  "Global",
] as const;

export const GENDERS = ["Male", "Female", "Prefer not to say"] as const;

/** Pricing-tier follower ranges (Option A). Used by Social + Packages. */
export const FOLLOWER_RANGES = [
  "0–5k",
  "6k–20k",
  "21k–50k",
  "51k–100k",
  "100k+",
] as const;

export const SOCIAL_PLATFORMS = [
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
] as const;

/** SMM-style package activities. Platform implied for Reel/Story; Comment/Repost need platform. */
export const PACKAGE_ACTIVITIES = [
  {
    id: "instagram_reel",
    label: "Instagram Reel",
    platform: "instagram" as const,
  },
  { id: "tiktok_video", label: "TikTok Video", platform: "tiktok" as const },
  {
    id: "instagram_story",
    label: "Instagram Story",
    platform: "instagram" as const,
  },
  { id: "tiktok_story", label: "TikTok Story", platform: "tiktok" as const },
  { id: "comment", label: "Comment", platform: null },
  { id: "repost", label: "Repost", platform: null },
] as const;

export const PACKAGE_PLATFORMS = ["instagram", "tiktok"] as const;

export const BIO_MAX_LENGTH = 800;
