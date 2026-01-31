import { Clock, Send } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "./Button";

interface UnderReviewProps {
  onDemoApprove?: () => void;
}

export function UnderReview({ onDemoApprove }: UnderReviewProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="border-b border-white/[0.08]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-amber-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Under review
            </h1>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
              Your content has been submitted. The brand team will review it and
              get back to you soon. You’ll see feedback here if any changes are
              needed.
            </p>
            {onDemoApprove && (
              <Button
                variant="secondary"
                onClick={onDemoApprove}
                className="inline-flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Continue to post (demo)
              </Button>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
