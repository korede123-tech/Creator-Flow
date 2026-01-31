import { OfferData } from '../App';
import { Button } from './Button';
import { Clock, Sparkles, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { formatCurrency, Currency } from '../utils/currency';

interface OfferPageProps {
  data: OfferData;
  onAccept: (amount: number) => void;
  onDecline: () => void;
  currency?: Currency;
}

export function OfferPage({ data, onAccept, onDecline, currency = 'NGN' }: OfferPageProps) {
  const [negotiateAmount, setNegotiateAmount] = useState(data.counterAmount.toString());
  const [showNegotiateInput, setShowNegotiateInput] = useState(false);

  const handleNegotiate = () => {
    const amount = parseFloat(negotiateAmount);
    if (!isNaN(amount) && amount > 0) {
      onAccept(amount);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col"
    >
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-white/[0.06] to-transparent border-b border-white/[0.08]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-center gap-2 mb-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0D0D0D] border border-white/[0.08] rounded-full">
              <Sparkles className="w-3 h-3 text-[#0ea5e9]" />
              <span className="text-xs text-slate-300 font-medium">Campaign Invitation</span>
            </div>
          </motion.div>

          {/* Campaign Title */}
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl sm:text-5xl font-bold text-center text-white mb-4 tracking-tight"
          >
            {data.campaignTitle}
          </motion.h1>

          {/* Brand Info */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-center text-sm text-slate-400 mb-8"
          >
            From <span className="text-white font-medium">{data.brand}</span> via <span className="text-[#0ea5e9]">Dobble Tap</span>
          </motion.div>

          {/* Payment Amount - Hero Style */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="relative mb-8"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#0ea5e9]/10 via-purple-500/10 to-pink-500/10 rounded-2xl blur-xl"></div>
            <div className="relative bg-[#0D0D0D] border border-white/[0.08] rounded-2xl p-8 sm:p-12">
              <div className="text-center">
                <div className="text-xs text-slate-500 uppercase tracking-widest mb-3">Compensation</div>
                <div className="text-7xl sm:text-8xl font-bold text-white mb-2 tracking-tight">
                  {formatCurrency(data.amount, currency)}
                </div>
                <div className="text-sm text-slate-400">One-time payment</div>
              </div>
            </div>
          </motion.div>

          {/* Expiry Warning */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-2 text-xs mb-6"
          >
            <Clock className="w-3 h-3 text-amber-400" />
            <span className="text-amber-400 font-medium">Offer expires in {data.expiresIn}</span>
          </motion.div>

          {/* Campaign Deadline */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 mb-8"
          >
            <div className="flex items-center justify-center gap-3">
              <div className="text-xs text-slate-500">Campaign Deadline</div>
              <div className="text-sm font-semibold text-white">{data.deadline}</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        {/* Deliverables Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 bg-[#0ea5e9] rounded-full"></div>
            <h2 className="text-sm font-semibold text-white uppercase tracking-widest">What You'll Create</h2>
          </div>
          
          <div className="space-y-3">
            {data.deliverables.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="flex gap-4 bg-[#0D0D0D] border border-white/[0.08] rounded-xl p-4 hover:border-white/[0.12] transition-all"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-md bg-[#0ea5e9]/10 border border-[#0ea5e9]/20 flex items-center justify-center mt-0.5">
                  <Check className="w-3 h-3 text-[#0ea5e9]" />
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{item}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="space-y-3"
        >
          <Button
            variant="primary"
            onClick={() => onAccept(data.amount)}
          >
            <span className="flex items-center justify-center gap-2">
              <Check className="w-4 h-4" />
              <span>Accept {formatCurrency(data.amount, currency)}</span>
            </span>
          </Button>
          
          {!showNegotiateInput ? (
            <Button
              variant="secondary"
              onClick={() => setShowNegotiateInput(true)}
            >
              Negotiate Amount
            </Button>
          ) : (
            <div className="bg-[#0D0D0D] border border-white/[0.08] rounded-xl p-4 space-y-3">
              <label className="block text-xs text-slate-400 font-medium mb-2">
                Enter your counter offer
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg font-semibold">$</span>
                <input
                  type="number"
                  value={negotiateAmount}
                  onChange={(e) => setNegotiateAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full pl-8 pr-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-lg text-base text-white font-semibold placeholder-slate-600 focus:border-[#0ea5e9] focus:outline-none transition-colors"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleNegotiate}
                  disabled={!negotiateAmount || parseFloat(negotiateAmount) <= 0}
                  className="flex-1 px-4 py-2.5 bg-white text-black rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Offer
                </button>
                <button
                  onClick={() => setShowNegotiateInput(false)}
                  className="px-4 py-2.5 text-slate-400 text-sm font-medium hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          <Button
            variant="outline"
            onClick={onDecline}
          >
            Decline
          </Button>
        </motion.div>

        {/* Footer Note */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-8 text-center text-xs text-slate-500"
        >
          By accepting, you agree to create content according to the brief above
        </motion.div>
      </div>
    </motion.div>
  );
}