import { DollarSign, CheckCircle2, Circle, Clock, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { formatCurrency, Currency } from '../utils/currency';

interface PaymentStatusProps {
  amount: number;
  currency?: Currency;
}

interface StatusStep {
  label: string;
  description: string;
  completed: boolean;
}

export function PaymentStatus({ amount, currency = 'NGN' }: PaymentStatusProps) {
  const steps: StatusStep[] = [
    { label: 'Content Submitted', description: 'Your video was received', completed: true },
    { label: 'Review Approved', description: 'Content meets requirements', completed: true },
    { label: 'Posted Live', description: 'Published on TikTok', completed: true },
    { label: 'Payment Processing', description: 'Payout initiated', completed: false }
  ];

  const completedSteps = steps.filter(s => s.completed).length;
  const progress = (completedSteps / steps.length) * 100;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header Section */}
      <div className="border-b border-white/[0.08]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0ea5e9]/10 border border-[#0ea5e9]/20 rounded-full mb-4">
              <TrendingUp className="w-3 h-3 text-[#0ea5e9]" />
              <span className="text-xs text-[#0ea5e9] font-medium">Campaign Progress</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
              Payment Status
            </h1>
            <p className="text-sm text-slate-400">
              Track your campaign completion and payment processing
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        {/* Payment Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative mb-8"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#0ea5e9]/10 via-purple-500/10 to-pink-500/10 rounded-2xl blur-xl"></div>
          <div className="relative bg-[#0D0D0D] border border-white/[0.08] rounded-2xl p-8 sm:p-12">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">Total Earnings</div>
                <div className="text-5xl sm:text-6xl font-bold text-white tracking-tight">
                  {formatCurrency(amount, currency)}
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#0ea5e9]/10 border border-[#0ea5e9]/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[#0ea5e9]" />
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Progress</span>
                <span>{completedSteps} of {steps.length} complete</span>
              </div>
              <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-gradient-to-r from-[#0ea5e9] to-purple-500 rounded-full"
                />
              </div>
            </div>

            {/* Status Message */}
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400 font-medium">Campaign Completed Successfully</span>
            </div>
          </div>
        </motion.div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 bg-[#0ea5e9] rounded-full"></div>
            <h2 className="text-sm font-semibold text-white uppercase tracking-widest">Timeline</h2>
          </div>

          <div className="bg-[#0D0D0D] border border-white/[0.08] rounded-xl p-6">
            <div className="space-y-6">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="relative flex gap-4"
                >
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className={`absolute left-4 top-10 w-px h-10 ${
                      step.completed ? 'bg-emerald-500/30' : 'bg-white/[0.08]'
                    }`} />
                  )}

                  {/* Icon */}
                  <div className="flex-shrink-0 relative z-10">
                    {step.completed ? (
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                        <Circle className="w-4 h-4 text-slate-500" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className={`text-sm font-semibold ${
                        step.completed ? 'text-white' : 'text-slate-500'
                      }`}>
                        {step.label}
                      </h3>
                      {step.completed && (
                        <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md font-medium">
                          Done
                        </span>
                      )}
                    </div>
                    <p className={`text-xs ${
                      step.completed ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Payment Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6"
        >
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#0ea5e9]/10 border border-[#0ea5e9]/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#0ea5e9]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">
                Payment Timeline
              </h3>
              <p className="text-sm text-slate-400 mb-3">
                Your payment is being processed and will arrive within 24-48 hours.
              </p>
              <p className="text-xs text-slate-500">
                No action needed. You'll receive a notification once the payment is complete.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}