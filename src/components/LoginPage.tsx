import { useEffect, useState } from "react";
import { Eye, EyeOff, Mail } from "lucide-react";
import logo from "figma:asset/136d294c79c3778ac95b0b1978b968aedfe25bbd.png";
import { supabase } from "../utils/supabase/client";

interface LoginPageProps {
  onSwitchToSignup: () => void;
}

export function LoginPage({ onSwitchToSignup }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(true);
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const savedEmail = window.localStorage.getItem("dt_last_email") || "";
    const savedRemember = window.localStorage.getItem("dt_remember_email");

    if (savedRemember === "0") setRememberEmail(false);
    if (savedEmail) setEmail(savedEmail);
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email))
      newErrors.email = "Invalid email address";
    if (!password)
      newErrors.password = "Password is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setStatus("sending");
    setStatusMessage("");
    try {
      window.localStorage.setItem(
        "dt_remember_email",
        rememberEmail ? "1" : "0",
      );
      if (rememberEmail) window.localStorage.setItem("dt_last_email", email);
      else window.localStorage.removeItem("dt_last_email");

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      setStatus("idle");
      setStatusMessage("");
    } catch (err) {
      setStatus("error");
      console.error("Login attempt failed:", err);
      const message = err instanceof Error ? err.message : "Login failed";

      if (message === "Invalid login credentials") {
        setStatusMessage("Invalid login credentials. Please check your email and password. (Note: Make sure you've confirmed your email link if required)");
      } else if (message.toLowerCase().includes("email not confirmed")) {
        setStatusMessage("Please confirm your email address before logging in. Check your inbox for the confirmation link.");
      } else {
        setStatusMessage(message);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <img src={logo} alt="DobbleTap" className="w-10 h-10" />
          <span className="text-2xl font-semibold">DobbleTap</span>
        </div>

        {/* Auth Card */}
        <div
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
          style={{
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
          }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold mb-2">Welcome back</h1>
            <p className="text-sm text-white/60">
              Log in to your account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] transition-all"
                placeholder="you@example.com"
                disabled={status === "sending"}
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 pr-12 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] transition-all"
                  placeholder="Enter your password"
                  disabled={status === "sending"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* Remember email */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="rememberEmail"
                checked={rememberEmail}
                onChange={(e) => setRememberEmail(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#0ea5e9] focus:ring-2 focus:ring-[#0ea5e9] focus:ring-offset-0"
              />
              <label htmlFor="rememberEmail" className="text-sm text-white/70">
                Remember my email on this device
              </label>
            </div>

            {statusMessage && (
              <div
                className={`rounded-lg border px-4 py-3 text-sm bg-red-500/10 border-red-500/20 text-red-200`}
              >
                <div className="flex items-center gap-2">
                  <Mail size={16} />
                  <span>{statusMessage}</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-white text-black font-medium py-3 rounded-lg hover:bg-white/90 transition-all focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:ring-offset-2 focus:ring-offset-[#0A0A0A] mt-6 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={
                !email.trim() ||
                status === "sending" ||
                !password
              }
            >
              {status === "sending" ? "Working…" : "Log in"}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-white/60">
              Don't have an account?{" "}
              <button
                onClick={onSwitchToSignup}
                className="text-[#0ea5e9] hover:underline"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
