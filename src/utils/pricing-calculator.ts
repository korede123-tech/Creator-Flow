/**
 * Nigeria-first pricing calculator for Dobble Tap
 * Calculates fair creator rates based on multiple factors
 */

export interface PricingInputs {
  platform: 'tiktok' | 'instagram' | 'youtube';
  deliverable: 'tiktok_30_45s' | 'tiktok_60s_concept' | 'ig_reel' | 'story_set_3' | 'carousel' | 'youtube_short';
  followerRange?: '1k-10k' | '10k-50k' | '50k-200k' | '200k-1m' | '1m+';
  avgViews?: number;
  engagementRate?: number;
  complexity?: 'simple' | 'medium' | 'high';
  usageRights: 'organic' | '30d_paid' | '90d_paid' | 'buyout';
  exclusivity: 'none' | '7d' | '30d' | '90d';
  turnaround: 'standard' | 'fast' | 'rush';
  niche?: 'beauty' | 'finance' | 'music' | 'food' | 'tech' | 'general';
  creatorPool: 'my_network' | 'all_creators';
}

export interface PricingBreakdown {
  basePrice: number;
  deliverableMultiplier: number;
  rightsMultiplier: number;
  exclusivityMultiplier: number;
  urgencyMultiplier: number;
  complexityMultiplier: number;
  subtotal: number;
  platformFee: number;
  handlingFee: number;
  totalBrandCost: number;
  creatorPayout: number;
  currency: 'NGN';
}

export interface PricingResult {
  fairPrice: number;
  lowRange: number;
  premiumRange: number;
  breakdown: PricingBreakdown;
  currency: 'NGN';
}

// Nigeria pricing constants
const FOLLOWER_TIERS = {
  '1k-10k': { min: 15000, max: 50000 },
  '10k-50k': { min: 50000, max: 200000 },
  '50k-200k': { min: 200000, max: 600000 },
  '200k-1m': { min: 600000, max: 2500000 },
  '1m+': { min: 2500000, max: 10000000 }
};

const CPM_RANGES = {
  beauty: { min: 1200, max: 2500 },
  finance: { min: 1500, max: 2500 },
  music: { min: 800, max: 1800 },
  food: { min: 1000, max: 2000 },
  tech: { min: 1200, max: 2200 },
  general: { min: 800, max: 1500 }
};

const DELIVERABLE_MULTIPLIERS = {
  tiktok_30_45s: 1.0,
  tiktok_60s_concept: 1.3,
  ig_reel: 1.1,
  story_set_3: 0.6,
  carousel: 0.9,
  youtube_short: 1.2
};

const RIGHTS_MULTIPLIERS = {
  organic: 1.0,
  '30d_paid': 1.3,
  '90d_paid': 1.6,
  buyout: 2.5
};

const EXCLUSIVITY_MULTIPLIERS = {
  none: 1.0,
  '7d': 1.15,
  '30d': 1.35,
  '90d': 1.7
};

const URGENCY_MULTIPLIERS = {
  standard: 1.0,
  fast: 1.25,
  rush: 1.6
};

const COMPLEXITY_MULTIPLIERS = {
  simple: 1.0,
  medium: 1.2,
  high: 1.5
};

const PLATFORM_FEE_PERCENTAGE = 15; // 15% platform fee
const ALL_CREATORS_FEE_PERCENTAGE = 12; // 12% handling fee for All Creators pool

/**
 * Calculate base price from followers or average views
 */
function calculateBasePrice(inputs: PricingInputs): number {
  // If avgViews provided, use CPM method
  if (inputs.avgViews && inputs.avgViews > 0) {
    const niche = inputs.niche || 'general';
    const cpmRange = CPM_RANGES[niche];
    const avgCPM = (cpmRange.min + cpmRange.max) / 2;
    return (inputs.avgViews / 1000) * avgCPM;
  }

  // Otherwise use follower tier
  if (inputs.followerRange) {
    const tier = FOLLOWER_TIERS[inputs.followerRange];
    return (tier.min + tier.max) / 2; // Use midpoint
  }

  // Default fallback
  return 50000; // ₦50k default
}

/**
 * Main pricing calculation function
 */
export function calculatePrice(inputs: PricingInputs): PricingResult {
  // Calculate base price
  const basePrice = calculateBasePrice(inputs);

  // Apply multipliers
  const deliverableMultiplier = DELIVERABLE_MULTIPLIERS[inputs.deliverable] || 1.0;
  const rightsMultiplier = RIGHTS_MULTIPLIERS[inputs.usageRights] || 1.0;
  const exclusivityMultiplier = EXCLUSIVITY_MULTIPLIERS[inputs.exclusivity] || 1.0;
  const urgencyMultiplier = URGENCY_MULTIPLIERS[inputs.turnaround] || 1.0;
  const complexityMultiplier = inputs.complexity ? COMPLEXITY_MULTIPLIERS[inputs.complexity] : 1.0;

  // Calculate subtotal
  const subtotal = basePrice * 
    deliverableMultiplier * 
    rightsMultiplier * 
    exclusivityMultiplier * 
    urgencyMultiplier * 
    complexityMultiplier;

  // Calculate fees
  const platformFee = subtotal * (PLATFORM_FEE_PERCENTAGE / 100);
  const handlingFee = inputs.creatorPool === 'all_creators' 
    ? subtotal * (ALL_CREATORS_FEE_PERCENTAGE / 100) 
    : 0;

  // Calculate totals
  const totalBrandCost = subtotal + platformFee + handlingFee;
  const creatorPayout = subtotal;
  const fairPrice = Math.round(totalBrandCost);

  // Calculate ranges
  const lowRange = Math.round(fairPrice * 0.85);
  const premiumRange = Math.round(fairPrice * 1.25);

  return {
    fairPrice,
    lowRange,
    premiumRange,
    breakdown: {
      basePrice: Math.round(basePrice),
      deliverableMultiplier,
      rightsMultiplier,
      exclusivityMultiplier,
      urgencyMultiplier,
      complexityMultiplier,
      subtotal: Math.round(subtotal),
      platformFee: Math.round(platformFee),
      handlingFee: Math.round(handlingFee),
      totalBrandCost: Math.round(totalBrandCost),
      creatorPayout: Math.round(creatorPayout),
      currency: 'NGN'
    },
    currency: 'NGN'
  };
}

/**
 * Format NGN currency
 */
export function formatNGN(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}

/**
 * Get follower tier from follower count
 */
export function getFollowerTier(followers: number): '1k-10k' | '10k-50k' | '50k-200k' | '200k-1m' | '1m+' {
  if (followers >= 1000000) return '1m+';
  if (followers >= 200000) return '200k-1m';
  if (followers >= 50000) return '50k-200k';
  if (followers >= 10000) return '10k-50k';
  return '1k-10k';
}

/**
 * Parse follower string (e.g., "125K") to number
 */
export function parseFollowerCount(followerStr: string): number {
  const cleaned = followerStr.toUpperCase().replace(/[,\s]/g, '');
  if (cleaned.includes('M')) {
    return parseFloat(cleaned.replace('M', '')) * 1000000;
  }
  if (cleaned.includes('K')) {
    return parseFloat(cleaned.replace('K', '')) * 1000;
  }
  return parseInt(cleaned, 10);
}
