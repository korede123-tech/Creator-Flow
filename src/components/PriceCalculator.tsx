import { Calculator, Info, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { calculatePrice, formatCurrency, type PricingInputs } from '../utils/pricing-calculator';

interface PriceCalculatorProps {
  mode?: 'creator' | 'brand' | 'agency';
  initialInputs?: Partial<PricingInputs>;
  onPriceCalculated?: (price: number) => void;
  currency?: 'NGN' | 'USD';
}

export function PriceCalculator({ mode = 'creator', initialInputs, onPriceCalculated, currency = 'NGN' }: PriceCalculatorProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [inputs, setInputs] = useState<PricingInputs>({
    platform: initialInputs?.platform || 'tiktok',
    deliverable: initialInputs?.deliverable || 'tiktok_30_45s',
    followerRange: initialInputs?.followerRange || '10k-50k',
    usageRights: initialInputs?.usageRights || 'organic',
    exclusivity: initialInputs?.exclusivity || 'none',
    turnaround: initialInputs?.turnaround || 'standard',
    creatorPool: initialInputs?.creatorPool || 'my_network',
    complexity: initialInputs?.complexity || 'simple',
    niche: initialInputs?.niche || 'general'
  });

  const result = calculatePrice(inputs);

  const updateInput = (key: keyof PricingInputs, value: any) => {
    const newInputs = { ...inputs, [key]: value };
    setInputs(newInputs);
    if (onPriceCalculated) {
      const newResult = calculatePrice(newInputs);
      onPriceCalculated(newResult.fairPrice);
    }
  };

  return (
    <div className="bg-[#0D0D0D]/50 border border-white/[0.06] rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="w-5 h-5 text-[#0ea5e9]" />
        <h3 className="text-base font-semibold text-white">Price Calculator</h3>
      </div>

      {/* Input Grid */}
      <div className="space-y-4 mb-6">
        {/* Platform */}
        <div>
          <label className="block text-xs text-slate-500 mb-2">Platform</label>
          <select
            value={inputs.platform}
            onChange={(e) => updateInput('platform', e.target.value)}
            className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white focus:border-[#0ea5e9] focus:outline-none transition-colors"
          >
            <option value="tiktok">TikTok</option>
            <option value="instagram">Instagram</option>
            <option value="youtube">YouTube</option>
          </select>
        </div>

        {/* Deliverable */}
        <div>
          <label className="block text-xs text-slate-500 mb-2">Deliverable</label>
          <select
            value={inputs.deliverable}
            onChange={(e) => updateInput('deliverable', e.target.value)}
            className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white focus:border-[#0ea5e9] focus:outline-none transition-colors"
          >
            <option value="tiktok_30_45s">TikTok 30-45s</option>
            <option value="tiktok_60s_concept">TikTok 60s with concept</option>
            <option value="ig_reel">Instagram Reel</option>
            <option value="story_set_3">Story Set (3)</option>
            <option value="carousel">Carousel</option>
            <option value="youtube_short">YouTube Short</option>
          </select>
        </div>

        {/* Follower Range */}
        <div>
          <label className="block text-xs text-slate-500 mb-2">Follower Range</label>
          <select
            value={inputs.followerRange}
            onChange={(e) => updateInput('followerRange', e.target.value)}
            className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white focus:border-[#0ea5e9] focus:outline-none transition-colors"
          >
            <option value="1k-10k">1K - 10K</option>
            <option value="10k-50k">10K - 50K</option>
            <option value="50k-200k">50K - 200K</option>
            <option value="200k-1m">200K - 1M</option>
            <option value="1m+">1M+</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Usage Rights */}
          <div>
            <label className="block text-xs text-slate-500 mb-2">Usage Rights</label>
            <select
              value={inputs.usageRights}
              onChange={(e) => updateInput('usageRights', e.target.value)}
              className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white focus:border-[#0ea5e9] focus:outline-none transition-colors"
            >
              <option value="organic">Organic only</option>
              <option value="30d_paid">30d paid</option>
              <option value="90d_paid">90d paid</option>
              <option value="buyout">Full buyout</option>
            </select>
          </div>

          {/* Exclusivity */}
          <div>
            <label className="block text-xs text-slate-500 mb-2">Exclusivity</label>
            <select
              value={inputs.exclusivity}
              onChange={(e) => updateInput('exclusivity', e.target.value)}
              className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white focus:border-[#0ea5e9] focus:outline-none transition-colors"
            >
              <option value="none">None</option>
              <option value="7d">7 days</option>
              <option value="30d">30 days</option>
              <option value="90d">90 days</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Turnaround */}
          <div>
            <label className="block text-xs text-slate-500 mb-2">Turnaround</label>
            <select
              value={inputs.turnaround}
              onChange={(e) => updateInput('turnaround', e.target.value)}
              className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white focus:border-[#0ea5e9] focus:outline-none transition-colors"
            >
              <option value="standard">Standard (5-7d)</option>
              <option value="fast">Fast (48-72h)</option>
              <option value="rush">Rush (24h)</option>
            </select>
          </div>

          {/* Complexity */}
          <div>
            <label className="block text-xs text-slate-500 mb-2">Complexity</label>
            <select
              value={inputs.complexity}
              onChange={(e) => updateInput('complexity', e.target.value)}
              className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white focus:border-[#0ea5e9] focus:outline-none transition-colors"
            >
              <option value="simple">Simple</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        {/* Creator Pool (for agencies/brands) */}
        {(mode === 'agency' || mode === 'brand') && (
          <div>
            <label className="block text-xs text-slate-500 mb-2">Creator Pool</label>
            <select
              value={inputs.creatorPool}
              onChange={(e) => updateInput('creatorPool', e.target.value)}
              className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white focus:border-[#0ea5e9] focus:outline-none transition-colors"
            >
              <option value="my_network">My Network</option>
              <option value="all_creators">All Creators</option>
            </select>
          </div>
        )}
      </div>

      {/* Result */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-6 mb-4">
        <div className="text-center mb-4">
          <div className="text-xs text-slate-500 mb-2">Fair Price</div>
          <div className="text-5xl font-bold text-white mb-2">
            {formatCurrency(result.fairPrice, currency)}
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <span>Range: {formatCurrency(result.lowRange, currency)}</span>
            <span>•</span>
            <span>{formatCurrency(result.premiumRange, currency)}</span>
          </div>
        </div>

        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="w-full flex items-center justify-center gap-2 text-xs text-[#0ea5e9] hover:text-[#0ea5e9]/80 transition-colors"
        >
          <span>View breakdown</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showBreakdown ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Breakdown */}
      <AnimatePresence>
        {showBreakdown && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 space-y-2 text-sm">
              <div className="flex items-center justify-between text-slate-400">
                <span>Base price</span>
                <span>{formatCurrency(result.breakdown.basePrice, currency)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Deliverable ({result.breakdown.deliverableMultiplier}x)</span>
                <span>—</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Rights ({result.breakdown.rightsMultiplier}x)</span>
                <span>—</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Exclusivity ({result.breakdown.exclusivityMultiplier}x)</span>
                <span>—</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Urgency ({result.breakdown.urgencyMultiplier}x)</span>
                <span>—</span>
              </div>
              <div className="h-px bg-white/[0.06] my-2"></div>
              <div className="flex items-center justify-between text-white font-medium">
                <span>Subtotal</span>
                <span>{formatCurrency(result.breakdown.subtotal, currency)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Platform fee (15%)</span>
                <span>{formatCurrency(result.breakdown.platformFee, currency)}</span>
              </div>
              {result.breakdown.handlingFee > 0 && (
                <div className="flex items-center justify-between text-slate-400">
                  <span>Handling fee (12%)</span>
                  <span>{formatCurrency(result.breakdown.handlingFee, currency)}</span>
                </div>
              )}
              <div className="h-px bg-white/[0.06] my-2"></div>
              <div className="flex items-center justify-between text-white font-bold text-base">
                <span>Total brand cost</span>
                <span>{formatCurrency(result.breakdown.totalBrandCost, currency)}</span>
              </div>
              <div className="flex items-center justify-between text-emerald-400 font-medium">
                <span>Creator payout</span>
                <span>{formatCurrency(result.breakdown.creatorPayout, currency)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info */}
      <div className="mt-4 flex items-start gap-2 text-xs text-slate-500">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>
          This calculator uses Nigeria-specific pricing based on follower tiers, CPM ranges, and market rates.
          Rates are automatically adjusted for deliverable type, usage rights, and urgency.
        </p>
      </div>
    </div>
  );
}