import type { Currency } from "../../utils/currency";

export interface CreatorProfileRow {
  id: string;
  user_id: string;
  display_name: string;
  location: string;
  title: string;
  bio: string | null;
  niches: string[];
  audience_region: string;
  gender: string | null;
  languages: string[];
  status: "draft" | "live";
  created_at?: string;
  updated_at?: string;
}

export interface CreatorSocialRow {
  id: string;
  creator_id: string;
  platform: string;
  handle: string;
  follower_range: string;
  updated_at?: string;
}

export interface CreatorPackageRow {
  id: string;
  creator_id: string;
  platform: "instagram" | "tiktok";
  activity_type: string;
  quantity: number;
  price_base_ngn: number;
  price_converted: number;
  currency: string;
  is_price_fixed: boolean;
  description: string | null;
  created_at?: string;
}

export type FollowerRangeByPlatform = Partial<
  Record<"instagram" | "tiktok", string>
>;

export interface CreatorProfileProps {
  userId: string;
  creatorId: string;
  initialProfile: CreatorProfileRow | null;
  initialSocial: CreatorSocialRow[];
  initialPackages: CreatorPackageRow[];
  currency: Currency;
  onRefresh: () => void;
}

export type CreatorProfileTab = "social" | "packages";
