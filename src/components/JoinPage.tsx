import { useEffect } from "react";
import { Users } from "lucide-react";
import logo from "figma:asset/fcad7446971be733d3427a6b22f8f64253529daf.png";

const REFERRAL_CODE_KEY = "dobble_referral_code";

export function joinPageCode(): string | null {
  const p = typeof window !== "undefined" ? window.location.pathname : "";
  const match = p.match(/^\/join\/([^/]+)/);
  return match ? decodeURIComponent(match[1]).trim() || null : null;
}

export function storeReferralCode(code: string): void {
  try {
    sessionStorage.setItem(REFERRAL_CODE_KEY, code);
  } catch {
    /* ignore */
  }
}

export function getStoredReferralCode(): string | null {
  try {
    return sessionStorage.getItem(REFERRAL_CODE_KEY);
  } catch {
    return null;
  }
}

export function clearStoredReferralCode(): void {
  try {
    sessionStorage.removeItem(REFERRAL_CODE_KEY);
  } catch {
    /* ignore */
  }
}

interface JoinPageProps {
  code: string;
}

export function JoinPage({ code }: JoinPageProps) {
  useEffect(() => {
    if (code) storeReferralCode(code);
  }, [code]);

  const base = typeof window !== "undefined" ? window.location.origin : "";
  const signupUrl = `${base}/?signup=1`;
  const loginUrl = `${base}/`;

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <img src={logo} alt="Dobble Tap" className="h-10 w-10" />
          <span className="text-xl font-bold text-white">Dobble Tap</span>
        </div>

        <div className="bg-[#0D0D0D]/50 border border-white/[0.06] rounded-2xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-purple-500/10 text-purple-400 mb-6">
            <Users className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">
            You&apos;re invited
          </h1>
          <p className="text-slate-400 text-sm mb-6">
            Someone wants you to join Dobble Tap. Sign up to earn from brand
            campaigns and start creating.
          </p>
          {code && (
            <div className="font-mono text-sm text-slate-500 mb-8 px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] inline-block">
              Code: <span className="text-white font-semibold">{code}</span>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <a
              href={signupUrl}
              className="w-full py-3 px-4 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition-colors text-center"
            >
              Sign up
            </a>
            <a
              href={loginUrl}
              className="w-full py-3 px-4 bg-white/[0.05] border border-white/[0.06] text-white font-medium rounded-xl hover:bg-white/[0.08] transition-colors text-center"
            >
              Log in
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-8">
          By continuing, you agree to our terms and privacy policy.
        </p>
      </div>
    </div>
  );
}
