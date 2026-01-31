import { useState } from 'react';
import { Mail, Phone, MessageCircle, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from './Button';
import { motion } from 'motion/react';
import logo from 'figma:asset/fcad7446971be733d3427a6b22f8f64253529daf.png';

interface LoginProps {
  onLogin: () => void;
}

type LoginMethod = 'email' | 'phone' | 'whatsapp' | null;

export function Login({ onLogin }: LoginProps) {
  const [loginMethod, setLoginMethod] = useState<LoginMethod>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      onLogin();
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo/Brand */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-6">
              <img src={logo} alt="DTTracker" className="h-12 w-12" />
              <span className="text-2xl font-bold text-white">DTTracker</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-sm text-slate-400">
              Your talent manager in your pocket
            </p>
          </div>

          {!loginMethod ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              {/* Email Login */}
              <button
                onClick={() => setLoginMethod('email')}
                className="w-full bg-[#0D0D0D] border border-white/[0.08] rounded-xl p-5 hover:border-white/[0.12] hover:bg-white/[0.02] transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#0ea5e9]/10 border border-[#0ea5e9]/20 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-[#0ea5e9]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-white mb-1">
                      Email Magic Link
                    </h3>
                    <p className="text-xs text-slate-400">
                      Sign in with your email
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
                </div>
              </button>

              {/* Phone Login */}
              <button
                onClick={() => setLoginMethod('phone')}
                className="w-full bg-[#0D0D0D] border border-white/[0.08] rounded-xl p-5 hover:border-white/[0.12] hover:bg-white/[0.02] transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <Phone className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-white mb-1">
                      Phone OTP
                    </h3>
                    <p className="text-xs text-slate-400">
                      Get a one-time code via SMS
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
                </div>
              </button>

              {/* WhatsApp Login */}
              <button
                onClick={() => setLoginMethod('whatsapp')}
                className="w-full bg-[#0D0D0D] border border-white/[0.08] rounded-xl p-5 hover:border-white/[0.12] hover:bg-white/[0.02] transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-white mb-1">
                      WhatsApp Login
                    </h3>
                    <p className="text-xs text-slate-400">
                      Quick login via WhatsApp
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
                </div>
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Email Form */}
              {loginMethod === 'email' && (
                <>
                  <div>
                    <label className="block mb-3 text-xs text-slate-400 uppercase tracking-widest font-medium">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="creator@example.com"
                      className="w-full h-12 px-4 bg-white/[0.03] border border-white/[0.08] focus:bg-white/[0.06] focus:border-[#0ea5e9]/50 rounded-lg focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[#0ea5e9]/50 text-white text-sm placeholder:text-slate-500 transition-all"
                      autoFocus
                    />
                  </div>
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={!email || loading}
                  >
                    {loading ? 'Sending link...' : 'Send Magic Link'}
                  </Button>
                </>
              )}

              {/* Phone Form */}
              {loginMethod === 'phone' && (
                <>
                  <div>
                    <label className="block mb-3 text-xs text-slate-400 uppercase tracking-widest font-medium">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full h-12 px-4 bg-white/[0.03] border border-white/[0.08] focus:bg-white/[0.06] focus:border-[#0ea5e9]/50 rounded-lg focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[#0ea5e9]/50 text-white text-sm placeholder:text-slate-500 transition-all"
                      autoFocus
                    />
                  </div>
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={!phone || loading}
                  >
                    {loading ? 'Sending code...' : 'Send OTP'}
                  </Button>
                </>
              )}

              {/* WhatsApp */}
              {loginMethod === 'whatsapp' && (
                <>
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-6 text-center">
                    <MessageCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                    <p className="text-sm text-slate-300 mb-4">
                      We'll send a login link to your WhatsApp
                    </p>
                  </div>
                  <div>
                    <label className="block mb-3 text-xs text-slate-400 uppercase tracking-widest font-medium">
                      WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full h-12 px-4 bg-white/[0.03] border border-white/[0.08] focus:bg-white/[0.06] focus:border-[#0ea5e9]/50 rounded-lg focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[#0ea5e9]/50 text-white text-sm placeholder:text-slate-500 transition-all"
                      autoFocus
                    />
                  </div>
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={!phone || loading}
                  >
                    {loading ? 'Sending...' : 'Send WhatsApp Link'}
                  </Button>
                </>
              )}

              <button
                onClick={() => setLoginMethod(null)}
                className="w-full text-sm text-slate-400 hover:text-white transition-colors"
              >
                ← Back to options
              </button>
            </motion.div>
          )}

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-slate-500">
            By continuing, you agree to Dobble Tap's Terms & Privacy
          </div>
        </motion.div>
      </div>
    </div>
  );
}