import { X, Mail, Phone, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoginModalProps {
  onLogin: () => void;
  onClose: () => void;
  message: string;
}

export function LoginModal({ onLogin, onClose, message }: LoginModalProps) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-[#0D0D0D] border border-white/[0.08] rounded-2xl p-6 w-full max-w-md"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.05] transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>

          {/* Content */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-2">Sign in to continue</h2>
            <p className="text-sm text-slate-400">{message}</p>
          </div>

          {/* Login Options */}
          <div className="space-y-3">
            <button
              onClick={onLogin}
              className="w-full flex items-center gap-4 p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-white/[0.06] hover:border-white/[0.12] transition-all text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-[#0ea5e9]/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-[#0ea5e9]" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">Email Magic Link</div>
                <div className="text-xs text-slate-500">Sign in with your email</div>
              </div>
            </button>

            <button
              onClick={onLogin}
              className="w-full flex items-center gap-4 p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-white/[0.06] hover:border-white/[0.12] transition-all text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Phone className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">Phone OTP</div>
                <div className="text-xs text-slate-500">Get a one-time code</div>
              </div>
            </button>

            <button
              onClick={onLogin}
              className="w-full flex items-center gap-4 p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-white/[0.06] hover:border-white/[0.12] transition-all text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">WhatsApp</div>
                <div className="text-xs text-slate-500">Quick login via WhatsApp</div>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
