import { FeedbackData } from '../App';
import { Button } from './Button';
import { AlertCircle, Upload, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';

interface FeedbackPageProps {
  data: FeedbackData;
  onUpload: () => void;
}

export function FeedbackPage({ data, onUpload }: FeedbackPageProps) {
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
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full mb-4">
              <MessageSquare className="w-3 h-3 text-amber-400" />
              <span className="text-xs text-amber-400 font-medium">Review Feedback</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
              Changes Requested
            </h1>
            <p className="text-sm text-slate-400">
              Your video needs some adjustments. Please address the feedback below and resubmit.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-6 mb-8"
        >
          <div className="flex gap-4">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-amber-400 mb-1">
                Quick Review Required
              </h3>
              <p className="text-sm text-slate-300">
                Don't worry! These are minor adjustments. Once addressed, we'll fast-track your approval.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Feedback Items */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 bg-amber-400 rounded-full"></div>
            <h2 className="text-sm font-semibold text-white uppercase tracking-widest">Feedback Items</h2>
          </div>

          {data.items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="bg-[#0D0D0D] border border-white/[0.08] rounded-xl p-6 hover:border-white/[0.12] transition-all"
            >
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-amber-400">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {item}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Button
            variant="primary"
            onClick={onUpload}
          >
            <span className="flex items-center justify-center gap-2">
              <Upload className="w-4 h-4" />
              <span>Upload Revised Video</span>
            </span>
          </Button>
        </motion.div>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-6 text-center text-xs text-slate-500"
        >
          Need clarification? The brand team will respond within 24 hours
        </motion.div>
      </div>
    </div>
  );
}