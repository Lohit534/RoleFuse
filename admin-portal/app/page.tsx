"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { checkIsAdmin } from "@/lib/auth-client";
import { 
  Loader2, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Mail, 
  KeyRound, 
  Users, 
  MessageSquare, 
  Lock, 
  CheckCircle2,
  Activity,
  ArrowRight,
  Shield,
  RotateCcw
} from "lucide-react";

export default function LoginPage() {
  const [authMode, setAuthMode] = useState<"otp" | "password">("otp");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    let mounted = true;

    // Check for error param in URL
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const urlError = urlParams.get("error");
      if (urlError) setError(decodeURIComponent(urlError));
    }

    const verifyAndRedirect = async (session: any) => {
      if (!session?.user) {
        if (mounted) setChecking(false);
        return;
      }
      const isAllowed = await checkIsAdmin(session.user, session.access_token);
      if (isAllowed && mounted) {
        window.location.href = "/dashboard";
        return;
      }
      if (mounted) setChecking(false);
    };

    // 1. Listen for auth state transitions (handles incoming OAuth tokens & hash redirects)
    const { data: authListener } = (supabase as any).auth.onAuthStateChange(
      async (_event: string, session: any) => {
        if (session?.user) {
          await verifyAndRedirect(session);
        }
      }
    );

    // 2. Immediate session evaluation
    supabase.auth.getSession().then(({ data }) => {
      verifyAndRedirect(data.session);
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your admin email address.");
      return;
    }
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const { error: otpError } = await (supabase as any).auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (otpError) throw otpError;
      setOtpSent(true);
      setInfo(`A 6-digit OTP code has been sent to ${email.trim()}. Enter it below, or click the magic link in your email.`);
    } catch (err: any) {
      setError(err.message || "Failed to dispatch verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setError("Please enter the verification code from your email.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { data, error: verifyErr } = await (supabase as any).auth.verifyOtp({
        email: email.trim(),
        token: otpCode.trim(),
        type: "email",
      });
      if (verifyErr) throw verifyErr;

      const user = data?.user || data?.session?.user;
      const token = data?.session?.access_token;
      if (!user) throw new Error("Verification succeeded, but session could not be established.");

      const isAllowed = await checkIsAdmin(user, token);
      if (!isAllowed) {
        await (supabase as any).auth.signOut();
        throw new Error("Access restricted: This account is authenticated but does not possess administrator privileges in the database.");
      }

      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password 
      });
      if (authError) {
        if (authError.message?.toLowerCase().includes("invalid login credentials")) {
          throw new Error("Invalid password. If you originally registered via Google or Email OTP, use those options.");
        }
        throw authError;
      }

      const isAllowed = await checkIsAdmin(data.user, data.session?.access_token);
      if (!isAllowed) {
        await supabase.auth.signOut();
        throw new Error("Access restricted: This account does not possess administrator privileges in the database.");
      }

      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const { error: authError } = await (supabase as any).auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (authError) throw authError;
    } catch (err: any) {
      setError(err.message || "Google sign-in failed.");
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="text-center space-y-3">
          <div className="relative mx-auto h-10 w-10 flex items-center justify-center">
            <img src="/logo.svg" alt="RoleFuse Logo" className="h-8 w-8 object-contain animate-pulse" />
          </div>
          <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Authenticating Administrative Session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#f8fafc] text-slate-900 font-sans selection:bg-[#0d6e5a]/15">
      
      {/* ── LEFT PANE: Professional Admin Showroom (Desktop Only) ── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 lg:p-16 bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-100/70 border-r border-slate-200 relative overflow-hidden">
        {/* Subtle Ambient Glows */}
        <div className="absolute top-1/4 left-1/4 h-[400px] w-[400px] rounded-full bg-teal-500/5 blur-[120px] -z-10 pointer-events-none" />
        <div className="absolute bottom-10 right-10 h-[300px] w-[300px] rounded-full bg-emerald-500/5 blur-[100px] -z-10 pointer-events-none" />

        {/* Top: RoleFuse Logo & Brand Header */}
        <div className="flex items-center gap-2.5 select-none">
          <img 
            src="/logo.svg" 
            alt="RoleFuse Logo" 
            className="h-5 w-5 object-contain" 
          />
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight text-slate-900 leading-none">
              RoleFuse
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#0d6e5a] mt-0.5">
              Admin Workspace
            </span>
          </div>
        </div>

        {/* Middle: Feature highlights and telemetry */}
        <div className="space-y-8 max-w-lg my-auto">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-[#0d6e5a] text-xs font-bold">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secure Enterprise Console
            </div>
            <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900 leading-tight">
              Control, monitor, and scale RoleFuse in real-time.
            </h2>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              Unified command center for registered users, billing tier modifications, support ticketing workflows, and user feedback telemetry.
            </p>
          </div>

          {/* Feature List Cards */}
          <div className="space-y-3 pt-2">
            {[
              {
                icon: Users,
                title: "User & Subscription Modifier",
                desc: "Search, inspect, and elevate user tiers (Free, Premium Pro, Pro Max, Owner).",
              },
              {
                icon: MessageSquare,
                title: "Support Ticketing Center",
                desc: "Live query response portal directly synchronized with client inboxes.",
              },
              {
                icon: Activity,
                title: "Real-Time Telemetry & Financials",
                desc: "Live revenue metrics, token credits utilization, and platform activity logs.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm transition-colors"
              >
                <div className="h-8 w-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0 text-[#0d6e5a] mt-0.5">
                  <item.icon className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: System Status & Security */}
        <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-semibold select-none">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-600 text-[11px] font-medium">System Status: Operational</span>
          </div>
          <span className="text-[11px] text-slate-500">RoleFuse Admin v2.0</span>
        </div>
      </div>

      {/* ── RIGHT PANE: Authentication Box ── */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 relative bg-slate-50/50">
        <div className="w-full max-w-md space-y-5">

          {/* Mobile Top Header (only visible on mobile) */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-2 select-none">
            <img src="/logo.svg" alt="RoleFuse Logo" className="h-6 w-6 object-contain" />
            <span className="font-extrabold text-lg tracking-tight text-slate-900">
              RoleFuse <span className="text-[#0d6e5a] text-xs uppercase ml-1 font-black">Admin</span>
            </span>
          </div>

          {/* Sign In Header */}
          <div className="space-y-1.5 text-center lg:text-left">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Administrator Login
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Verify your administrator identity to access the console.
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5 shadow-lg relative">
            
            {/* Quick Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-11 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.4 9 5 12 5z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
                <path fill="#FBBC05" d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.7 0-1.1.2-2 .4-2.7L1.9 6.4C.7 8.8 0 10.8 0 12s.7 3.2 1.9 5.6l3.7-2.9z" />
                <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.3L1.9 16C3.7 19.8 7.5 23 12 23z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-2 select-none">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">or sign in with</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Auth Mode Toggle Tabs (Email OTP vs Password) */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl select-none">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("otp");
                  setError("");
                  setInfo("");
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  authMode === "otp"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Mail className="h-3.5 w-3.5 text-[#0d6e5a]" />
                <span>Email OTP</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("password");
                  setError("");
                  setInfo("");
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  authMode === "password"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <KeyRound className="h-3.5 w-3.5 text-[#0d6e5a]" />
                <span>Password</span>
              </button>
            </div>

            {/* MODE 1: EMAIL OTP SIGN IN */}
            {authMode === "otp" && (
              <div>
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-[#0d6e5a]" />
                        Admin Email
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@rolefuse.in"
                        className="w-full bg-white text-slate-900 border border-slate-200 rounded-xl px-4 py-3 text-sm placeholder-slate-400 outline-none focus:border-[#0d6e5a] focus:ring-2 focus:ring-[#0d6e5a]/20 transition-all font-medium"
                      />
                    </div>

                    {error && (
                      <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700 font-medium leading-relaxed">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-11 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 bg-[#0d6e5a] hover:bg-[#094d3f] shadow-sm"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Mail className="h-4 w-4" />
                          <span>Send 6-Digit OTP</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="bg-teal-50/80 border border-teal-200/80 rounded-xl p-3 text-xs text-[#0d6e5a] font-medium leading-relaxed">
                      {info || `Verification code dispatched to ${email}.`}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5 text-[#0d6e5a]" />
                        6-Digit Verification Code
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={8}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="123456"
                        autoFocus
                        className="w-full bg-white text-slate-900 text-center tracking-widest text-lg font-mono font-bold border border-slate-200 rounded-xl px-4 py-2.5 placeholder-slate-300 outline-none focus:border-[#0d6e5a] focus:ring-2 focus:ring-[#0d6e5a]/20 transition-all"
                      />
                    </div>

                    {error && (
                      <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700 font-medium leading-relaxed">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-11 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 bg-[#0d6e5a] hover:bg-[#094d3f] shadow-sm"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Verify OTP & Enter Console</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <button
                        type="button"
                        onClick={() => handleSendOtp()}
                        disabled={loading}
                        className="text-[#0d6e5a] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Resend Code</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setOtpCode("");
                          setError("");
                          setInfo("");
                        }}
                        className="text-slate-500 hover:text-slate-800 underline font-medium cursor-pointer"
                      >
                        Change Email
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* MODE 2: PASSWORD SIGN IN */}
            {authMode === "password" && (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-[#0d6e5a]" />
                    Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@rolefuse.in"
                    className="w-full bg-white text-slate-900 border border-slate-200 rounded-xl px-4 py-3 text-sm placeholder-slate-400 outline-none focus:border-[#0d6e5a] focus:ring-2 focus:ring-[#0d6e5a]/20 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <KeyRound className="h-3.5 w-3.5 text-[#0d6e5a]" />
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter administrator password"
                      className="w-full bg-white text-slate-900 border border-slate-200 rounded-xl pl-4 pr-11 py-3 text-sm placeholder-slate-400 outline-none focus:border-[#0d6e5a] focus:ring-2 focus:ring-[#0d6e5a]/20 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700 font-medium leading-relaxed">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 bg-[#0d6e5a] hover:bg-[#094d3f] shadow-sm"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      <span>Authenticate with Password</span>
                    </>
                  )}
                </button>
              </form>
            )}

          </div>

          <p className="text-center text-[11px] text-slate-500 font-medium select-none">
            Strictly restricted to RoleFuse administrators. Unauthorized access attempts are monitored and logged.
          </p>
        </div>
      </div>

    </div>
  );
}
