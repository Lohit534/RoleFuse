"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import {
  Loader2,
  AlertCircle,
  Check,
  Sparkles,
} from "lucide-react";
import { toast } from "react-hot-toast";

export const dynamic = "force-dynamic";

function LoginFormContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "auth-code-error") {
      setError("Authentication link expired or invalid. Please try signing in again.");
    }

    if (searchParams.get("sample") !== "true" && localStorage.getItem("fastHire_pendingSample") !== "true") {
      localStorage.removeItem("fastHire_pendingSample");
      localStorage.removeItem("fastHire_sampleResume");
      localStorage.removeItem("fastHire_sampleJD");
    }
  }, [searchParams]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const isSample = searchParams.get("sample") === "true" || localStorage.getItem("fastHire_pendingSample") === "true";
      const nextPath = isSample ? "/dashboard?sample=true" : "/dashboard";

      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      });

      if (authError) {
        throw authError;
      }
    } catch (err: any) {
      const msg = err.message || "Google sign-in failed. Please try again.";
      setError(msg);
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white text-[#111827] font-sans">
      
      {/* LEFT PANE: Light Brand Showroom with Soft Ambient Background */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] p-12 xl:p-16 bg-[#F8FCFB] relative overflow-hidden border-r border-[#DCE7E9]">
        {/* Subtle soft circular ambient background shapes */}
        <div className="absolute -top-24 -left-24 w-[480px] h-[480px] rounded-full bg-gradient-to-br from-[#E5F8F5] to-transparent opacity-70 blur-2xl pointer-events-none" />
        <div className="absolute bottom-10 right-0 w-[420px] h-[420px] rounded-full bg-gradient-to-tl from-[#D4F3EF]/60 to-transparent opacity-60 blur-3xl pointer-events-none" />

        {/* Top Brand Header */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 select-none group w-fit transition-transform hover:scale-[1.02]">
            <img src="/logo.svg" alt="RoleFuse Logo" className="h-8 w-8 object-contain" />
            <span className="font-extrabold text-[24px] tracking-tight text-[#111827]">
              RoleFuse
            </span>
          </Link>
        </div>

        {/* Middle Showcase: New Logo with slightly moving / floating animation */}
        <div className="relative z-10 my-auto py-10 flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center">
            {/* Soft radial glow */}
            <div className="absolute w-56 h-56 rounded-full bg-[#087F6E]/12 blur-2xl pointer-events-none" />

            {/* Slightly moving floating emblem */}
            <div className="animate-float-slow transition-transform">
              <div className="w-36 h-36 xl:w-44 xl:h-44 rounded-3xl bg-white shadow-xl shadow-teal-900/10 border border-teal-100/90 p-7 flex items-center justify-center relative">
                <img
                  src="/logo.svg"
                  alt="RoleFuse Emblem"
                  className="w-full h-full object-contain filter drop-shadow-sm"
                />
                {/* Sparkle badge */}
                <span className="absolute -top-2.5 -right-2.5 bg-white border border-teal-200 text-teal-600 rounded-full p-1.5 shadow-xs">
                  <Sparkles className="w-4 h-4 text-[#087F6E]" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Lower Section: Headline + Features List */}
        <div className="relative z-10 space-y-5 max-w-lg">
          <h2 className="text-3xl xl:text-[38px] font-black tracking-tight leading-[1.15] text-[#111827]">
            One tap, then <span className="text-[#087F6E]">27 seconds</span> to your score
          </h2>
          <p className="text-sm xl:text-[15px] text-[#526176] font-normal leading-relaxed">
            No password to invent or forget. 2 free resume optimizations every month, no card.
          </p>

          {/* Feature Bullet List */}
          <div className="space-y-2.5 pt-2 text-[13px] font-medium text-[#111827]">
            <div className="flex items-center gap-2.5">
              <Check className="h-4 w-4 text-[#087F6E] stroke-[2.5] shrink-0" />
              <span>ATS keyword matching for any job</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Check className="h-4 w-4 text-[#087F6E] stroke-[2.5] shrink-0" />
              <span>Stronger bullet points with real impact</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Check className="h-4 w-4 text-[#087F6E] stroke-[2.5] shrink-0" />
              <span>Before &amp; after score — see the improvement</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Check className="h-4 w-4 text-[#087F6E] stroke-[2.5] shrink-0" />
              <span>PDF &amp; DOCX download, ready to send</span>
            </div>
          </div>

          <p className="text-[11px] text-[#526176]/70 pt-2 font-normal">
            Your data is never sold. Resume content is used only to generate your tailored resume.
          </p>
        </div>
      </div>

      {/* RIGHT PANE: Clean Centered Card Form */}
      <div className="flex flex-col justify-between w-full lg:w-[48%] p-8 sm:p-12 min-h-screen bg-white">
        {/* Mobile Brand Bar */}
        <div className="flex lg:hidden justify-between items-center w-full mb-8">
          <Link href="/" className="inline-flex items-center gap-2 select-none">
            <img src="/logo.svg" alt="RoleFuse" className="h-6 w-6 object-contain" />
            <span className="font-extrabold text-lg text-[#111827]">RoleFuse</span>
          </Link>
          <Link href="/" className="text-xs font-semibold text-[#526176] hover:text-[#111827]">
            ← Back to home
          </Link>
        </div>

        {/* Centered Auth Box */}
        <div className="w-full max-w-[420px] mx-auto my-auto space-y-7">
          <div className="text-center space-y-2">
            <h1 className="text-3xl sm:text-[36px] font-extrabold tracking-tight text-[#111827]">
              Welcome back
            </h1>
            <p className="text-sm text-[#526176] font-normal">
              Sign in to start improving your resume.
            </p>
          </div>

          {/* Alert Error Box */}
          {error && (
            <div className="flex items-start gap-2 p-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Card with Google Button */}
          <div className="bg-white border border-[#DCE7E9] rounded-2xl p-6 sm:p-8 shadow-xs space-y-5">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-12 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-800 font-bold text-sm flex items-center justify-center gap-3 rounded-xl shadow-xs hover:shadow-sm transition-all cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-[#087F6E]" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" width="20" height="20">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* free • no card needed divider */}
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100" />
              </div>
              <span className="relative bg-white px-3 text-[11px] text-[#526176] font-medium tracking-wide">
                free • no card needed
              </span>
            </div>
          </div>

          {/* Trust Checkmarks below card */}
          <div className="space-y-2 text-xs text-[#526176] font-medium pl-1">
            <div className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-[#087F6E] stroke-[2.5] shrink-0" />
              <span>We never sell your data or post anything</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-[#087F6E] stroke-[2.5] shrink-0" />
              <span>Delete everything from Account, any time</span>
            </div>
          </div>

          {/* Legal terms & privacy note */}
          <div className="text-[11px] text-[#526176] leading-relaxed text-center sm:text-left pt-1">
            By signing in you agree to our{" "}
            <Link href="/terms" className="text-[#087F6E] hover:underline font-semibold">Terms</Link>{" "}
            &amp;{" "}
            <Link href="/privacy" className="text-[#087F6E] hover:underline font-semibold">Privacy Policy</Link>.{" "}
            Anonymized resume data may be used to improve RoleFuse&apos;s AI. You can opt out in Data Preferences.
          </div>

          {/* Back to home */}
          <div className="text-center pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#526176] hover:text-[#087F6E] transition-colors"
            >
              <span>← Back to home</span>
            </Link>
          </div>
        </div>

        {/* Bottom switch link between Login and Signup */}
        <div className="text-center text-xs text-[#526176] pt-6">
          Don&apos;t have an account?{" "}
          <Link
            href={searchParams.get("sample") === "true" ? "/auth/signup?sample=true" : "/auth/signup"}
            className="text-[#087F6E] font-bold hover:underline"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F8FCFB]">
        <Loader2 className="h-8 w-8 animate-spin text-[#087F6E]" />
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}
