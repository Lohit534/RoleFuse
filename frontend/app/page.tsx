"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useResumeStore } from "@/store/useResumeStore";
import Navbar from "@/components/Navbar";
import {
  ArrowRight,
  Zap,
  Target,
  Shield,
  CheckCircle2,
  Sparkles,
  Download,
  Play,
  ChevronDown,
  ChevronUp,
  Briefcase,
  FileText,
  TrendingUp,
} from "lucide-react";
import ScrollFadeIn from "@/components/ScrollFadeIn";
import CircleGauge from "@/components/CircleGauge";
import { supabase } from "@/lib/supabase/client";
import { DemoVideoModal } from "@/components/DemoVideoModal";
import { SAMPLE_RESUME_TEXT, SAMPLE_JD_TEXT } from "@/lib/sample-data";
import Footer from "@/components/Footer";
import { DashboardSkeleton } from "@/components/SkeletonShimmer";

/* ── Landing FAQ ─────────────────────────────────────────── */
const LANDING_FAQS = [
  {
    q: "Is RoleFuse completely free?",
    a: "Yes! You get 2 free AI resume optimizations every month with no credit card required. You can upgrade to Premium Pro or Pro Max for more optimizations and features.",
  },
  {
    q: "How does RoleFuse improve my resume?",
    a: "Our AI analyzes your resume against the job description, identifies missing keywords, rewrites bullet points for impact, and scores your ATS compatibility — all in under 30 seconds.",
  },
  {
    q: "Will my resume actually pass ATS systems?",
    a: "Our AI is trained specifically on ATS parsing patterns. Users see an average ATS score lift of 57+ points after optimization. Results depend on how well your experience matches the target role.",
  },
  {
    q: "Is my resume data safe and private?",
    a: "Absolutely. Your resume is only used for the optimization request and is never sold, shared, or used to train third-party AI models. We take privacy very seriously.",
  },
  {
    q: "What file formats can I download?",
    a: "You can download your optimized resume as a professionally formatted PDF and DOCX (Word) file. Both are ATS-compatible and recruiter-ready.",
  },
  {
    q: "Can I use RoleFuse for different job roles?",
    a: "Yes! You can optimize your resume for as many different job roles or companies as you want. Just paste a new job description each time to get role-specific optimization.",
  },
  {
    q: "How is RoleFuse different from ChatGPT?",
    a: "RoleFuse is purpose-built for ATS optimization. It doesn't just rewrite — it scores your resume, identifies specific missing keywords, generates PDF/DOCX exports, tracks your history, and produces cover letters tailored to each JD.",
  },
  {
    q: "Do I need to install anything?",
    a: "No downloads required. RoleFuse works entirely in your browser. Just sign up and start optimizing your resume in seconds.",
  },
];

function LandingFAQ() {
  const [openIdx, setOpenIdx] = React.useState<number | null>(null);
  return (
    <div className="space-y-3.5">
      {LANDING_FAQS.map((faq, idx) => {
        const isOpen = openIdx === idx;
        return (
          <div
            key={idx}
            className="border border-[#DCE7E9] bg-white rounded-2xl overflow-hidden transition-all duration-200 shadow-xs"
          >
            <button
              onClick={() => setOpenIdx(isOpen ? null : idx)}
              className="w-full flex items-center justify-between p-5 text-left font-semibold text-[15px] sm:text-base text-[#111827] transition-colors cursor-pointer"
            >
              <span>{faq.q}</span>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-[#087F6E] shrink-0 ml-3" />
              ) : (
                <ChevronDown className="h-4 w-4 text-[#526176] shrink-0 ml-3" />
              )}
            </button>
            {isOpen && (
              <div className="px-5 pb-5 text-[15px] text-[#526176] font-normal leading-[1.7] border-t border-[#DCE7E9] pt-4 bg-[#F5FAFA]">
                {faq.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Animated number counter (scroll-triggered) ─────────── */
function AnimatedCounter({
  from,
  to,
  duration = 1600,
  suffix = "",
}: {
  from: number;
  to: number;
  duration?: number;
  suffix?: string;
}) {
  const [count, setCount] = useState(from);
  const [started, setStarted] = useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) setStarted(true);
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    setCount(from);
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(from + (to - from) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, from, to, duration]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const { setResumeText, setJobDescription } = useResumeStore();
  const [barReady, setBarReady] = useState(false);

  const [checkingAuth, setCheckingAuth] = useState<boolean>(false);

  useEffect(() => {
    localStorage.removeItem("fastHire_pendingSample");
    localStorage.removeItem("fastHire_sampleResume");
    localStorage.removeItem("fastHire_sampleJD");

    let isMounted = true;

    async function checkLoggedIn() {
      try {
        await supabase.auth.getSession();
      } catch (e) {}

      if (isMounted) {
        setCheckingAuth(false);
      }
    }

    checkLoggedIn();

    const t = setTimeout(() => setBarReady(true), 350);
    return () => {
      isMounted = false;
      clearTimeout(t);
    };
  }, [router]);

  if (checkingAuth) {
    return <DashboardSkeleton />;
  }

  const handleTrySample = async () => {
    setResumeText(SAMPLE_RESUME_TEXT);
    setJobDescription(SAMPLE_JD_TEXT);
    localStorage.setItem("fastHire_pendingSample", "true");
    localStorage.setItem("fastHire_sampleResume", SAMPLE_RESUME_TEXT);
    localStorage.setItem("fastHire_sampleJD", SAMPLE_JD_TEXT);

    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        router.push("/dashboard?sample=true");
        return;
      }
    } catch {}

    router.push("/dashboard?sample=true");
  };

  return (
    <div className="flex flex-col min-h-screen bg-transparent text-[#111827] antialiased font-sans selection:bg-[#087F6E]/15 selection:text-[#087F6E]">
      <Navbar />

      {/* ── 1. HERO SECTION (Follows Panel 1 of Reference Image) ──────────────── */}
      <section className="relative overflow-hidden pt-14 pb-20 md:pt-20 md:pb-28 border-b border-[#DCE7E9]">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

            {/* LEFT COLUMN: Messaging */}
            <div className="lg:col-span-6 space-y-7 animate-fade-in-up">
              {/* Announcement Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#DCE7E9] shadow-xs text-[#075E53] text-xs font-semibold tracking-wide">
                <span className="h-2 w-2 rounded-full bg-[#087F6E] animate-pulse shrink-0" />
                <span>RoleFuse Free ATS Optimization &amp; Free ATS Scanner &bull; 2 Free Scans / Month</span>
              </div>

              {/* Main Headline */}
              <h1 className="font-heading text-[38px] sm:text-[48px] lg:text-[58px] font-extrabold tracking-[-0.03em] leading-[1.08] text-[#111827]">
                Stop Getting Rejected.
                <br />
                <span className="text-[#087F6E]">Start Getting Interviews.</span>
              </h1>

              {/* Supporting Copy */}
              <p className="text-base sm:text-lg text-[#526176] max-w-xl leading-[1.68] font-normal">
                <strong>RoleFuse free ATS optimization</strong> and instant <strong>ATS resume scanner</strong>. Test your resume against any job description, identify missing keywords, rewrite bullet points with impact, and generate an ATS-friendly resume guaranteed to pass recruiter screening.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3.5 pt-1">
                <Link href="/auth/signup">
                  <button className="bg-[#087F6E] hover:bg-[#075E53] text-white px-7 py-3.5 text-[15px] font-semibold flex items-center justify-center rounded-xl shadow-xs transition-colors cursor-pointer">
                    <span>Get Started Free</span>
                  </button>
                </Link>

                <button
                  onClick={handleTrySample}
                  className="border border-[#DCE7E9] bg-white hover:bg-[#F5FAFA] text-[#111827] px-7 py-3.5 text-[15px] font-semibold rounded-xl flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                >
                  <span>Try Sample Resume</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 text-[13px] text-[#526176] font-medium pt-1">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#087F6E]" />
                  <span>Free to start</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#087F6E]" />
                  <span>No credit card required</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-[#087F6E]" />
                  <span>100% Private resume handling</span>
                </span>
              </div>

              {/* Social Proof Row with AI Generated Job Seeker Photos */}
              <div className="flex items-center gap-3 pt-2">
                <div className="flex -space-x-2.5 overflow-hidden py-0.5">
                  <img
                    src="/avatars/user-1.jpg"
                    alt="Job Seeker"
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover shadow-xs"
                  />
                  <img
                    src="/avatars/user-2.jpg"
                    alt="Job Seeker"
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover shadow-xs"
                  />
                  <img
                    src="/avatars/user-3.jpg"
                    alt="Job Seeker"
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover shadow-xs"
                  />
                  <img
                    src="/avatars/user-4.jpg"
                    alt="Job Seeker"
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover shadow-xs"
                  />
                </div>
                <div className="text-xs text-[#526176]">
                  <span className="font-semibold text-[#111827]">Trusted by 10,000+ job seekers</span>
                  <span className="mx-1.5">•</span>
                  <span>4.9/5 satisfaction</span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Realistic Product Preview (Directly from Reference Panel 1) */}
            <div className="lg:col-span-6 flex justify-center lg:justify-end animate-fade-in-up" style={{ animationDelay: "150ms" }}>
              <div className="relative w-full max-w-[480px]">

                {/* Panel 1 Signature Fluid Mint Backdrop Shape Behind Preview Card */}
                <div
                  className="absolute -inset-6 sm:-inset-10 -z-10 rounded-[44px] pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(ellipse 90% 80% at 65% 45%, rgba(212, 243, 239, 0.8) 0%, rgba(229, 248, 245, 0.6) 45%, rgba(234, 249, 248, 0.4) 75%, transparent 100%)",
                    filter: "blur(24px)",
                  }}
                />

                {/* Subtle Real-time status pill top right */}
                <div className="absolute -top-3.5 right-4 z-20 flex items-center gap-2 bg-white border border-[#DCE7E9] px-3.5 py-1.5 rounded-full shadow-xs">
                  <span className="h-2 w-2 rounded-full bg-[#087F6E] animate-pulse" />
                  <span className="text-[11px] font-semibold text-[#111827]">Real-time rewrite active</span>
                </div>

                {/* Main Product Score Box Card with White Surface and Subtle Border (Panel 1) */}
                <div className="relative bg-white border border-[#DCE7E9] rounded-2xl p-6 sm:p-7 shadow-[0_12px_36px_rgba(0,0,0,0.06)] overflow-hidden">
                  
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-5 mb-5 border-b border-[#DCE7E9]">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-teal-50 border border-teal-200/80 flex items-center justify-center text-[#087F6E]">
                        <CheckCircle2 className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-sm sm:text-base text-[#111827]">
                          ATS Optimization
                        </h3>
                        <p className="text-[11px] text-[#526176]">Automated parser analysis</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-md bg-[#F5FAFA] border border-[#DCE7E9] text-[#087F6E]">
                      Live Scan
                    </span>
                  </div>

                  {/* Score Visualization Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-[#F5FAFA] border border-[#DCE7E9] rounded-xl p-4">
                      <div className="text-[11px] font-mono font-semibold text-[#526176] uppercase tracking-wider mb-1">
                        Current Score
                      </div>
                      <div className="text-3xl sm:text-4xl font-extrabold text-[#EF4444] font-heading leading-tight">
                        <AnimatedCounter from={0} to={34} duration={900} suffix="%" />
                      </div>
                      <div className="text-[11px] font-medium text-[#EF4444] mt-1 flex items-center gap-1">
                        <span>✕ Needs optimization</span>
                      </div>
                    </div>

                    <div className="bg-[#F5FAFA] border border-[#DCE7E9] rounded-xl p-4 text-right">
                      <div className="text-[11px] font-mono font-semibold text-[#526176] uppercase tracking-wider mb-1">
                        Target Score
                      </div>
                      <div className="text-3xl sm:text-4xl font-extrabold text-[#087F6E] font-heading leading-tight">
                        <AnimatedCounter from={34} to={91} duration={1600} suffix="%" />
                      </div>
                      <div className="text-[11px] font-medium text-[#087F6E] mt-1 flex items-center justify-end gap-1">
                        <span>✓ Recruiter-ready</span>
                      </div>
                    </div>
                  </div>

                  {/* Horizontal Progress Bar (Red -> Amber -> Teal) */}
                  <div className="space-y-1.5 mb-5">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#526176]">
                      <span>Baseline: 34%</span>
                      <span className="font-semibold text-[#087F6E]">Optimized: 91%</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full overflow-hidden bg-slate-100 border border-[#DCE7E9]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: barReady ? "91%" : "34%",
                          transition: "width 1.6s cubic-bezier(0.22, 1, 0.36, 1)",
                          background: "linear-gradient(90deg, #EF4444 0%, #F59E0B 45%, #087F6E 100%)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Optimization Checklist from Reference Panel 1 */}
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between text-xs sm:text-[13px] text-[#111827] bg-[#F5FAFA] border border-[#DCE7E9] px-3.5 py-2.5 rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <span className="h-5 w-5 rounded-full bg-rose-50 border border-rose-200/80 text-[#EF4444] font-bold text-[10px] flex items-center justify-center shrink-0">
                          ✕
                        </span>
                        <span className="font-medium">Missing 14 keywords</span>
                      </div>
                      <span className="text-[11px] font-semibold text-[#EF4444]">Action required</span>
                    </div>

                    <div className="flex items-center justify-between text-xs sm:text-[13px] text-[#111827] bg-[#F5FAFA] border border-[#DCE7E9] px-3.5 py-2.5 rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <span className="h-5 w-5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                          !
                        </span>
                        <span className="font-medium">Improve bullet points</span>
                      </div>
                      <span className="text-[11px] font-semibold text-amber-600">Metric rewrites</span>
                    </div>

                    <div className="flex items-center justify-between text-xs sm:text-[13px] text-[#111827] bg-teal-50/50 border border-teal-200/60 px-3.5 py-2.5 rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <span className="h-5 w-5 rounded-full bg-teal-100 text-[#087F6E] font-bold text-[10px] flex items-center justify-center shrink-0">
                          ✓
                        </span>
                        <span className="font-medium text-[#111827]">ATS-friendly format</span>
                      </div>
                      <span className="text-[11px] font-semibold text-[#087F6E]">Clean standard</span>
                    </div>

                    <div className="flex items-center justify-between text-xs sm:text-[13px] text-[#111827] bg-teal-50/50 border border-teal-200/60 px-3.5 py-2.5 rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <span className="h-5 w-5 rounded-full bg-teal-100 text-[#087F6E] font-bold text-[10px] flex items-center justify-center shrink-0">
                          ✓
                        </span>
                        <span className="font-medium text-[#111827]">Role-specific suggestions</span>
                      </div>
                      <span className="text-[11px] font-semibold text-[#087F6E]">Matched to JD</span>
                    </div>
                  </div>

                  {/* Footnote / Disclaimer */}
                  <p className="text-[11px] text-[#526176] text-center mt-4">
                    Illustrative demonstration data • Real-time ATS match analysis
                  </p>
                </div>

                {/* Overlapping Bottom Highlight Pill (Reference Panel 1) */}
                <div className="mt-3.5 flex items-center justify-center">
                  <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white border border-[#DCE7E9] rounded-full shadow-xs text-xs font-semibold text-[#111827]">
                    <Sparkles className="h-3.5 w-3.5 text-[#087F6E]" />
                    <span>Your resume could be 2x stronger with AI-powered suggestions</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 2. SCORE LIFT SECTION (Visual ATS Score Verification) ─────────────── */}
      <ScrollFadeIn className="py-16 md:py-24 border-b border-[#DCE7E9] bg-transparent">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#087F6E]">
              Real Results
            </span>
            <h2 className="font-heading text-3xl sm:text-[36px] font-bold text-[#111827] tracking-tight">
              Watch Your ATS Score Climb
            </h2>
            <p className="text-[#526176] text-base max-w-lg mx-auto font-normal leading-relaxed">
              Every optimization is scored before and after so you can see exactly how much better your resume performs.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-16">
            {/* Before gauge */}
            <div className="flex flex-col items-center gap-2 bg-white border border-[#DCE7E9] p-5 rounded-2xl shadow-xs">
              <div className="block md:hidden">
                <CircleGauge value={34} label="Before" size={90} />
              </div>
              <div className="hidden md:block">
                <CircleGauge value={34} label="Before" size={110} />
              </div>
              <p className="text-xs text-[#526176] font-mono font-medium">14 keywords missing</p>
            </div>

            {/* AI Engine connector */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="h-px w-10 md:w-20 bg-[#DCE7E9] md:block hidden" />
              <div className="h-6 w-px bg-[#DCE7E9] md:hidden block" />
              <span className="text-xs font-mono font-semibold text-[#087F6E] bg-white border border-[#DCE7E9] px-3.5 py-1.5 rounded-full whitespace-nowrap shadow-xs">
                ⚡ AI Engine
              </span>
              <div className="h-px w-10 md:w-20 bg-[#DCE7E9] md:block hidden" />
              <div className="h-6 w-px bg-[#DCE7E9] md:hidden block" />
            </div>

            {/* After gauge */}
            <div className="flex flex-col items-center gap-2 bg-white border border-[#DCE7E9] p-5 rounded-2xl shadow-xs">
              <div className="block md:hidden">
                <CircleGauge value={91} label="After" size={90} />
              </div>
              <div className="hidden md:block">
                <CircleGauge value={91} label="After" size={110} />
              </div>
              <p className="text-xs text-[#087F6E] font-mono font-bold">ATS-ready ✓</p>
            </div>
          </div>
        </div>
      </ScrollFadeIn>

      {/* ── 3. FEATURE SECTION (Clean 4 Core Modules + Platform Strengths) ───── */}
      <section id="features" className="py-20 md:py-28 bg-transparent border-b border-[#DCE7E9]">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 space-y-16">

          {/* Section Header */}
          <div className="text-center space-y-3">
            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#087F6E]">
              Core Capabilities
            </span>
            <h2 className="font-heading text-3xl sm:text-[38px] font-bold text-[#111827] tracking-tight">
              A Complete Career-Tech Workspace
            </h2>
            <p className="text-[#526176] text-base max-w-xl mx-auto leading-relaxed">
              Everything you need to optimize, target, and organize your job search with precision.
            </p>
          </div>

          {/* 4 Core Features Grid with Realistic Visual Mockups */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* Feature 1: Resume Optimizer */}
            <div className="bg-white border border-[#DCE7E9] rounded-2xl p-7 sm:p-8 space-y-5 shadow-xs hover:border-[#087F6E]/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-11 w-11 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-[#087F6E]">
                    <FileText className="h-5.5 w-5.5" />
                  </div>
                  <span className="text-xs font-semibold text-[#087F6E] bg-teal-50/80 px-3 py-1 rounded-full border border-teal-200/60">
                    Core Tool
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-heading font-bold text-[#111827] text-xl">
                    Resume Optimizer
                  </h3>
                  <p className="text-[14px] text-[#526176] leading-[1.6]">
                    ATS-friendly suggestions and resume improvements. Paste your resume against any job description to detect missing keywords, score compatibility, and rewrite bullet points for measurable impact.
                  </p>
                </div>

                {/* Visual Interface Mockup */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 select-none">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 font-bold uppercase">
                    <span>Keyword Gap Injector</span>
                    <span className="text-[#087F6E]">+57 Pts Lift</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <span className="bg-white border border-teal-200 text-[#087F6E] text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                      <span className="text-teal-600 font-bold">✓</span> Distributed Systems
                    </span>
                    <span className="bg-white border border-teal-200 text-[#087F6E] text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                      <span className="text-teal-600 font-bold">✓</span> AWS Architecture
                    </span>
                    <span className="bg-white border border-teal-200 text-[#087F6E] text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                      <span className="text-teal-600 font-bold">✓</span> Microservices
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-2 text-xs font-medium text-[#526176]">
                <span className="bg-[#F5FAFA] border border-[#DCE7E9] px-2.5 py-1 rounded-md">Keyword Density</span>
                <span className="bg-[#F5FAFA] border border-[#DCE7E9] px-2.5 py-1 rounded-md">Bullet Rewrites</span>
                <span className="bg-[#F5FAFA] border border-[#DCE7E9] px-2.5 py-1 rounded-md">ATS Scorer</span>
              </div>
            </div>

            {/* Feature 2: Job Matcher */}
            <div className="bg-white border border-[#DCE7E9] rounded-2xl p-7 sm:p-8 space-y-5 shadow-xs hover:border-[#087F6E]/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-11 w-11 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-[#087F6E]">
                    <Target className="h-5.5 w-5.5" />
                  </div>
                  <span className="text-xs font-semibold text-[#087F6E] bg-teal-50/80 px-3 py-1 rounded-full border border-teal-200/60">
                    Targeting
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-heading font-bold text-[#111827] text-xl">
                    Job Matcher
                  </h3>
                  <p className="text-[14px] text-[#526176] leading-[1.6]">
                    Relevant job opportunities matched to your profile. Inspect alignment percentages, uncover role-specific requirements, and tailor applications specifically for each company before applying.
                  </p>
                </div>

                {/* Visual Interface Mockup */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 select-none">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 font-bold uppercase">
                    <span>Role Alignment Radar</span>
                    <span className="text-[#087F6E]">94% Fit</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-semibold text-slate-700">
                      <span>Technical Requirements</span>
                      <span className="text-[#087F6E]">96%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-[#087F6E] w-[96%]" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-2 text-xs font-medium text-[#526176]">
                <span className="bg-[#F5FAFA] border border-[#DCE7E9] px-2.5 py-1 rounded-md">Match Percentage</span>
                <span className="bg-[#F5FAFA] border border-[#DCE7E9] px-2.5 py-1 rounded-md">Role Requirements</span>
                <span className="bg-[#F5FAFA] border border-[#DCE7E9] px-2.5 py-1 rounded-md">Direct Alignment</span>
              </div>
            </div>

            {/* Feature 3: Application Tracker */}
            <div className="bg-white border border-[#DCE7E9] rounded-2xl p-7 sm:p-8 space-y-5 shadow-xs hover:border-[#087F6E]/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-11 w-11 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-[#087F6E]">
                    <Briefcase className="h-5.5 w-5.5" />
                  </div>
                  <span className="text-xs font-semibold text-[#087F6E] bg-teal-50/80 px-3 py-1 rounded-full border border-teal-200/60">
                    Organization
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-heading font-bold text-[#111827] text-xl">
                    Application Tracker
                  </h3>
                  <p className="text-[14px] text-[#526176] leading-[1.6]">
                    Organized job applications in a single pipeline. Track your submissions across Wishlist, Applied, Interviewing, and Offered stages without juggling messy spreadsheets.
                  </p>
                </div>

                {/* Visual Interface Mockup */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 grid grid-cols-3 gap-1.5 select-none">
                  <div className="bg-white border border-slate-200 rounded-lg p-1.5 text-center">
                    <span className="text-[8px] font-bold text-slate-500 uppercase block">Applied</span>
                    <span className="text-xs font-bold text-slate-800">12</span>
                  </div>
                  <div className="bg-white border border-teal-200 rounded-lg p-1.5 text-center">
                    <span className="text-[8px] font-bold text-[#087F6E] uppercase block">Interview</span>
                    <span className="text-xs font-bold text-[#087F6E]">4</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-1.5 text-center">
                    <span className="text-[8px] font-bold text-slate-700 uppercase block">Offer</span>
                    <span className="text-xs font-bold text-slate-900">1</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-2 text-xs font-medium text-[#526176]">
                <span className="bg-[#F5FAFA] border border-[#DCE7E9] px-2.5 py-1 rounded-md">Stage Pipeline</span>
                <span className="bg-[#F5FAFA] border border-[#DCE7E9] px-2.5 py-1 rounded-md">Interview Dates</span>
                <span className="bg-[#F5FAFA] border border-[#DCE7E9] px-2.5 py-1 rounded-md">Notes &amp; Salary</span>
              </div>
            </div>

            {/* Feature 4: Career Insights */}
            <div className="bg-white border border-[#DCE7E9] rounded-2xl p-7 sm:p-8 space-y-5 shadow-xs hover:border-[#087F6E]/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-11 w-11 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-[#087F6E]">
                    <TrendingUp className="h-5.5 w-5.5" />
                  </div>
                  <span className="text-xs font-semibold text-[#087F6E] bg-teal-50/80 px-3 py-1 rounded-full border border-teal-200/60">
                    Analytics
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-heading font-bold text-[#111827] text-xl">
                    Career Insights
                  </h3>
                  <p className="text-[14px] text-[#526176] leading-[1.6]">
                    Personalized progress and skill development. Monitor your ATS score trajectory over time, review historical optimization logs, and pinpoint skill development areas for future career moves.
                  </p>
                </div>

                {/* Visual Interface Mockup */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between select-none">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono text-slate-500 font-bold uppercase block">ATS Score Progression</span>
                    <span className="text-xs font-bold text-slate-800">34% → 91% Average Lift</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#087F6E] bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                    +57 Pts
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-2 text-xs font-medium text-[#526176]">
                <span className="bg-[#F5FAFA] border border-[#DCE7E9] px-2.5 py-1 rounded-md">Score History</span>
                <span className="bg-[#F5FAFA] border border-[#DCE7E9] px-2.5 py-1 rounded-md">Skill Gap Roadmap</span>
                <span className="bg-[#F5FAFA] border border-[#DCE7E9] px-2.5 py-1 rounded-md">Past Scans</span>
              </div>
            </div>
          </div>

          {/* ── 1. RESUME BUILDER SECTION ── */}
          <div className="pt-12 pb-8 border-t border-[#DCE7E9]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              {/* Content Column */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-[#087F6E] text-xs font-bold tracking-wide">
                  <FileText className="h-3.5 w-3.5" />
                  <span>AI Resume Builder</span>
                </div>

                <h2 className="font-heading text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-[#111827] tracking-tight leading-[1.15]">
                  Build Your Best Resume <br />
                  <span className="text-[#087F6E]">Recruiter-Approved &amp; ATS-Ready</span>
                </h2>

                <p className="text-base text-[#526176] leading-relaxed font-normal">
                  Create a professional, high-scoring resume in minutes. Choose recruiter-tested layouts, adjust accents, and preview your live ATS document in real time.
                </p>

                <div className="space-y-3.5 text-sm text-[#374151]">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#087F6E] shrink-0 mt-0.5" />
                    <span>Single-column linear structure guaranteed to pass Taleo, Workday, and Greenhouse</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#087F6E] shrink-0 mt-0.5" />
                    <span>Curated typography and color palettes tailored for optimal human and algorithmic reading</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#087F6E] shrink-0 mt-0.5" />
                    <span>Instant export to clean, high-resolution ATS PDF and editable DOCX formats</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link href="/resume-builder">
                    <button className="bg-[#087F6E] hover:bg-[#075E53] text-white px-7 py-3.5 text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer">
                      Build ATS Resume Free
                    </button>
                  </Link>
                </div>
              </div>

              {/* Visual Showcase Column */}
              <div className="lg:col-span-6 flex justify-center">
                <div className="relative rounded-3xl overflow-hidden border border-slate-200/90 shadow-xl bg-gradient-to-br from-emerald-50/40 via-white to-teal-50/30 p-4 sm:p-6 w-full max-w-[540px]">
                  <img
                    src="/images/resume-builder-feature.png"
                    alt="RoleFuse Resume Builder Format Preview"
                    className="w-full h-auto object-contain select-none rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── 2. BEAT THE BOTS SECTION ── */}
          <div className="pt-16 pb-10 border-t border-[#DCE7E9]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              {/* Visual Showcase Column (Left on desktop) */}
              <div className="lg:col-span-6 order-2 lg:order-1 flex justify-center">
                <div className="relative rounded-3xl overflow-hidden border border-slate-200/90 shadow-xl bg-gradient-to-br from-teal-50/40 via-white to-slate-50 p-4 sm:p-6 w-full max-w-[540px]">
                  <img
                    src="/images/beat-the-bots.png"
                    alt="Beat the Bots ATS Resume Inspection Tips"
                    className="w-full h-auto object-contain select-none rounded-xl"
                  />
                </div>
              </div>

              {/* Content Column (Right on desktop) */}
              <div className="lg:col-span-6 order-1 lg:order-2 space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-[#087F6E] text-xs font-bold tracking-wide">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Beat the Bots</span>
                </div>

                <h2 className="font-heading text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-[#111827] tracking-tight leading-[1.15]">
                  Beat the Bots &amp; <br />
                  <span className="text-[#087F6E]">Land More Job Interviews</span>
                </h2>

                <p className="text-base text-[#526176] leading-relaxed font-normal">
                  Over 75% of resumes are discarded by automated applicant tracking filters before a human recruiter even sees them. RoleFuse identifies formatting traps, missing keywords, and section errors so your resume reaches decision makers.
                </p>

                <div className="space-y-3.5 text-sm text-[#374151]">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#087F6E] shrink-0 mt-0.5" />
                    <span>Keyword Density Audit: Discover exactly which critical terms are missing from your target role</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#087F6E] shrink-0 mt-0.5" />
                    <span>Formatting Error Detection: Eliminate multi-column layouts, tables, and unreadable graphics</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#087F6E] shrink-0 mt-0.5" />
                    <span>Objective ATS Compatibility Score: Benchmark your resume against top commercial screening engines</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link href="/ats-checker">
                    <button className="bg-[#087F6E] hover:bg-[#075E53] text-white px-7 py-3.5 text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer">
                      Scan Your Resume Free
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary 4-Card Strength Grid (Retaining Platform Value Propositions) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-4">
            {[
              {
                icon: Target,
                title: "ATS-First Design",
                desc: "Every rewrite targets the exact parsing criteria enterprise applicant tracking systems filter for.",
              },
              {
                icon: Zap,
                title: "30-Second Turnaround",
                desc: "No waiting or complex multi-step wizards. Just paste and generate a polished resume immediately.",
              },
              {
                icon: Shield,
                title: "100% Private & Safe",
                desc: "Your data is strictly confidential, encrypted, and never used to train third-party public models.",
              },
              {
                icon: Download,
                title: "PDF & DOCX Ready",
                desc: "Export clean, recruiter-approved documents formatted with standard ATS typography and margins.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white border border-[#DCE7E9] p-6 rounded-2xl space-y-3 shadow-xs hover:border-[#087F6E]/40 hover:shadow-sm transition-all duration-200"
              >
                <div className="h-9 w-9 rounded-lg bg-teal-50 border border-teal-200/60 flex items-center justify-center text-[#087F6E]">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-heading font-bold text-[#111827] text-base">{title}</h4>
                  <p className="text-xs sm:text-[13px] text-[#526176] leading-relaxed font-normal">{desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── 4. STATS SECTION ─────────────────────────────────────────────────── */}
      <ScrollFadeIn className="py-16 md:py-24 border-b border-[#DCE7E9] bg-transparent">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-3">
            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#087F6E]">
              By The Numbers
            </span>
            <h2 className="font-heading text-3xl sm:text-[36px] font-bold text-[#111827] tracking-tight">
              Trusted by Job Seekers Worldwide
            </h2>
            <p className="text-[#526176] text-base max-w-md mx-auto leading-relaxed">
              Job seekers have landed interview callbacks using FastHire AI’s precision optimizations.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { value: 1000, suffix: "+", label: "Users Optimized", color: "#087F6E", sub: "Active job hunters" },
              { value: 94, suffix: "%", label: "Success Rate", color: "#075E53", sub: "Reported more callbacks" },
              { value: 57, suffix: "+", label: "Avg. Score Lift", color: "#087F6E", sub: "ATS points gained" },
              { value: 800, suffix: "+", label: "Positive Reviews", color: "#075E53", sub: "Verified user feedbacks" },
            ].map(({ value, suffix, label, color, sub }) => (
              <div
                key={label}
                className="bg-white border border-[#DCE7E9] rounded-2xl p-6 text-center shadow-xs hover:border-[#087F6E]/40 transition-all duration-200"
              >
                <div className="space-y-1">
                  <div className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading" style={{ color }}>
                    <AnimatedCounter from={0} to={value} duration={1800} suffix={suffix} />
                  </div>
                  <div className="text-sm font-bold text-[#111827] mt-2">{label}</div>
                  <div className="text-xs text-[#526176] font-medium">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollFadeIn>

      {/* ── 5. TOP COMPANIES MARQUEE ─────────────────────────────────────────── */}
      <ScrollFadeIn className="py-16 border-b border-[#DCE7E9] bg-transparent">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 space-y-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#087F6E]">
              Top Companies
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
              Resumes Shortlisted At
            </h2>
            <p className="text-[#526176] text-sm sm:text-base max-w-md mx-auto leading-relaxed">
              Our users have been shortlisted and hired across top global technology teams.
            </p>
          </div>

          {/* Infinite scroll marquee */}
          <div className="relative overflow-hidden">
            <div
              className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
              style={{ background: "linear-gradient(to right, #F5FAFA, transparent)" }}
            />
            <div
              className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
              style={{ background: "linear-gradient(to left, #F5FAFA, transparent)" }}
            />

            <div className="flex animate-marquee gap-6 whitespace-nowrap">
              {[
                "Google", "Microsoft", "Amazon", "Meta", "Apple",
                "Flipkart", "Infosys", "Wipro", "TCS", "Accenture",
                "Deloitte", "IBM", "Capgemini", "HCL", "Cognizant",
                "Swiggy", "Zomato", "Razorpay", "PhonePe",
                "Paytm", "Freshworks", "Zoho",
              ]
                .concat([
                  "Google", "Microsoft", "Amazon", "Meta", "Apple",
                  "Flipkart", "Infosys", "Wipro", "TCS", "Accenture",
                ])
                .map((company, i) => (
                  <div
                    key={i}
                    className="inline-flex items-center px-6 py-3 rounded-xl bg-white border border-[#DCE7E9] text-[#111827] font-semibold text-sm hover:border-[#087F6E]/40 transition-all shrink-0 shadow-xs"
                  >
                    <span className="h-2 w-2 rounded-full bg-[#087F6E] mr-2 shrink-0" />
                    {company}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </ScrollFadeIn>

      {/* ── 6. USER TESTIMONIALS ─────────────────────────────────────────────── */}
      <ScrollFadeIn className="py-20 md:py-28 border-b border-[#DCE7E9] bg-transparent">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 space-y-3">
            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#087F6E]">
              Real Feedback
            </span>
            <h2 className="font-heading text-3xl sm:text-[36px] font-bold text-[#111827] tracking-tight">
              What Job Seekers Are Saying
            </h2>
            <p className="text-[#526176] text-base max-w-md mx-auto leading-relaxed">
              Transparent feedback from professionals optimizing their careers with RoleFuse.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: "Arjun Sharma",
                role: "Software Engineer",
                country: "India",
                text: "My ATS score went from 42% to 89% in under 30 seconds. Got interview calls from 4 companies within a week. Absolutely game-changing!",
              },
              {
                name: "Priya Menon",
                role: "Data Analyst",
                country: "India",
                text: "RoleFuse rewrote my bullet points to match the target JD perfectly. I used to get zero callbacks. Now I have 3 interviews lined up.",
              },
              {
                name: "Rohan Gupta",
                role: "Full Stack Developer",
                country: "India",
                text: "The keyword matching is remarkably accurate. It identified 17 keywords I was missing and naturally integrated them into my project descriptions.",
              },
              {
                name: "Sarah Chen",
                role: "Product Manager",
                country: "Singapore",
                text: "I was skeptical at first, but the ATS score improvement was immediate and visible. The clean PDF export rendered flawlessly on every system.",
              },
              {
                name: "Rahul Verma",
                role: "DevOps Engineer",
                country: "India",
                text: "The job tracker and tailored cover letter generator keep my search completely organized. No other career tool comes close in execution.",
              },
              {
                name: "Ayesha Khan",
                role: "UI/UX Designer",
                country: "Pakistan",
                text: "Went from months of silent rejections to getting 2 solid offers in 3 weeks after optimizing with RoleFuse. The difference is night and day!",
              },
            ].map(({ name, role, country, text }, i) => (
              <div
                key={i}
                className="bg-white border border-[#DCE7E9] rounded-2xl p-6 sm:p-7 space-y-4 hover:border-[#087F6E]/40 shadow-xs hover:shadow-sm transition-all duration-200"
              >
                <p className="text-[14px] sm:text-[15px] text-[#526176] leading-relaxed font-normal">
                  "{text}"
                </p>
                <div className="flex items-center gap-3 pt-3 border-t border-[#DCE7E9]">
                  <div className="h-9 w-9 rounded-full bg-[#087F6E] flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {name[0]}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#111827]">{name}</div>
                    <div className="text-[11px] text-[#526176]">
                      {role} • {country}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollFadeIn>

      {/* ── 7. COUNTRIES MARQUEE ─────────────────────────────────────────────── */}
      <ScrollFadeIn className="py-16 border-b border-[#DCE7E9] bg-transparent">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 space-y-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#087F6E]">
              Global Reach
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
              Used Across the World
            </h2>
            <p className="text-[#526176] text-sm sm:text-base max-w-md mx-auto leading-relaxed">
              Job seekers from over 30 countries use RoleFuse to land interviews faster.
            </p>
          </div>

          <div className="relative overflow-hidden">
            <div
              className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
              style={{ background: "linear-gradient(to right, #F5FAFA, transparent)" }}
            />
            <div
              className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
              style={{ background: "linear-gradient(to left, #F5FAFA, transparent)" }}
            />

            <div className="flex animate-marquee-reverse gap-5 whitespace-nowrap">
              {[
                { flag: "🇮🇳", name: "India" },
                { flag: "🇺🇸", name: "USA" },
                { flag: "🇬🇧", name: "UK" },
                { flag: "🇩🇪", name: "Germany" },
                { flag: "🇨🇦", name: "Canada" },
                { flag: "🇦🇺", name: "Australia" },
                { flag: "🇸🇬", name: "Singapore" },
                { flag: "🇦🇪", name: "UAE" },
                { flag: "🇯🇵", name: "Japan" },
                { flag: "🇫🇷", name: "France" },
                { flag: "🇧🇷", name: "Brazil" },
                { flag: "🇵🇰", name: "Pakistan" },
                { flag: "🇳🇱", name: "Netherlands" },
                { flag: "🇸🇪", name: "Sweden" },
                { flag: "🇿🇦", name: "South Africa" },
                { flag: "🇧🇩", name: "Bangladesh" },
                { flag: "🇵🇭", name: "Philippines" },
                { flag: "🇮🇩", name: "Indonesia" },
                { flag: "🇲🇾", name: "Malaysia" },
                { flag: "🇨🇭", name: "Switzerland" },
              ]
                .concat([
                  { flag: "🇮🇳", name: "India" },
                  { flag: "🇺🇸", name: "USA" },
                  { flag: "🇬🇧", name: "UK" },
                  { flag: "🇩🇪", name: "Germany" },
                  { flag: "🇨🇦", name: "Canada" },
                ])
                .map(({ flag, name }, i) => (
                  <div
                    key={i}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-[#DCE7E9] text-[#111827] font-medium text-xs sm:text-sm hover:border-[#087F6E]/40 transition-all shrink-0 shadow-xs"
                  >
                    <span>{flag}</span>
                    <span>{name}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </ScrollFadeIn>

      {/* ── 8. FAQ SECTION ───────────────────────────────────────────────────── */}
      <ScrollFadeIn id="faq" className="py-20 md:py-28 border-b border-[#DCE7E9] bg-transparent">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-3">
            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#087F6E]">
              FAQ
            </span>
            <h2 className="font-heading text-3xl sm:text-[36px] font-bold text-[#111827] tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-[#526176] text-base max-w-md mx-auto leading-relaxed">
              Everything you need to know about RoleFuse and our optimization process.
            </p>
          </div>

          <LandingFAQ />
        </div>
      </ScrollFadeIn>

      {/* ── 9. FINAL CTA ─────────────────────────────────────────────────────── */}
      <ScrollFadeIn className="py-20 md:py-28 bg-transparent">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#DCE7E9] text-[#075E53] text-xs font-semibold shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-[#087F6E]" />
            <span>Free Forever Tier • No Credit Card Required</span>
          </div>

          <h2 className="font-heading text-3xl sm:text-[42px] font-extrabold text-[#111827] tracking-tight leading-[1.15]">
            Ready to Land More{" "}
            <span className="text-[#087F6E]">Interviews?</span>
          </h2>

          <p className="text-[#526176] text-base sm:text-lg max-w-md mx-auto leading-relaxed font-normal">
            2 free resume optimizations every month. Start right now in your browser.
          </p>

          <div className="flex flex-wrap justify-center gap-3.5 pt-3">
            <Link href="/auth/signup">
              <button className="bg-[#087F6E] hover:bg-[#075E53] text-white px-8 py-3.5 text-[15px] font-semibold flex items-center gap-2 rounded-xl shadow-xs transition-colors cursor-pointer">
                <span>Start For Free</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>

            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="border border-[#DCE7E9] bg-white hover:bg-[#F5FAFA] text-[#111827] px-8 py-3.5 text-[15px] font-semibold rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Play className="h-4 w-4 text-[#087F6E] fill-[#087F6E]" />
              <span>See a Demo</span>
            </button>
          </div>
        </div>
      </ScrollFadeIn>

      <Footer />

      <DemoVideoModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />
    </div>
  );
}
