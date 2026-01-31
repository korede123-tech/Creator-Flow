import { Mail, CheckCircle2 } from "lucide-react";
import logo from "figma:asset/136d294c79c3778ac95b0b1978b968aedfe25bbd.png";

interface SignupSuccessPageProps {
    email: string;
    onContinueToLogin: () => void;
}

export function SignupSuccessPage({ email, onContinueToLogin }: SignupSuccessPageProps) {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#0A0A0A]">
            <div className="w-full max-w-md">
                {/* Logo and Brand */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <img src={logo} alt="DobbleTap" className="w-10 h-10" />
                    <span className="text-2xl font-semibold text-white">DobbleTap</span>
                </div>

                {/* Success Card */}
                <div
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center"
                    style={{
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                    }}
                >
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                        </div>
                    </div>

                    <h1 className="text-2xl font-semibold text-white mb-2">Registration Successful!</h1>
                    <p className="text-slate-400 mb-8">
                        Thank you for joining DobbleTap. We've sent a confirmation email to:
                        <br />
                        <span className="text-white font-medium">{email}</span>
                    </p>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-8 text-left">
                        <div className="flex items-start gap-3">
                            <Mail className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-blue-200">
                                Please click the link in your email to confirm your account. You won't be able to log in until your email is verified.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onContinueToLogin}
                        className="w-full bg-white text-black font-medium py-3 rounded-lg hover:bg-white/90 transition-all focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:ring-offset-2 focus:ring-offset-[#0A0A0A]"
                    >
                        Continue to Login
                    </button>
                </div>
            </div>
        </div>
    );
}
