"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase/client";
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Target,
  Sparkles,
  BarChart3,
  Layers,
  Lock,
  Search,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const ATS_JOB_SIMULATIONS = [
  {
    title: "Cloud DevOps Engineer",
    baselineScore: 36,
    optimizedScore: 94,
    missingKeywords: ["Terraform", "Kubernetes", "Helm", "GitOps", "Prometheus", "AWS IAM"],
    matchedKeywords: ["Linux", "Python", "Docker", "CI/CD"],
    scoreBreakdown: [
      { label: "Keyword Match Rate", before: "32%", after: "96%" },
      { label: "Quantifiable Impact", before: "25%", after: "88%" },
      { label: "Section Parseability", before: "70%", after: "100%" },
      { label: "Skills Alignment", before: "40%", after: "95%" },
    ],
  },
  {
    title: "Senior Frontend Developer",
    baselineScore: 42,
    optimizedScore: 91,
    missingKeywords: ["Next.js", "Server Components", "Tailwind CSS", "Redux Toolkit", "Web Vitals"],
    matchedKeywords: ["JavaScript", "HTML5", "CSS3", "React", "Git"],
    scoreBreakdown: [
      { label: "Keyword Match Rate", before: "40%", after: "92%" },
      { label: "Quantifiable Impact", before: "30%", after: "90%" },
      { label: "Section Parseability", before: "80%", after: "100%" },
      { label: "Skills Alignment", before: "48%", after: "94%" },
    ],
  },
  {
    title: "Financial Risk Analyst",
    baselineScore: 31,
    optimizedScore: 89,
    missingKeywords: ["Monte Carlo Simulations", "Credit Risk", "Basel III", "SQL", "Bloomberg Terminal"],
    matchedKeywords: ["Excel", "Financial Modeling", "Economics"],
    scoreBreakdown: [
      { label: "Keyword Match Rate", before: "28%", after: "89%" },
      { label: "Quantifiable Impact", before: "20%", after: "85%" },
      { label: "Section Parseability", before: "65%", after: "100%" },
      { label: "Skills Alignment", before: "35%", after: "92%" },
    ],
  },
];

export default function AtsCheckerPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeJobIndex, setActiveJobIndex] = useState(0);
  const activeSim = ATS_JOB_SIMULATIONS[activeJobIndex];

  useEffect(() => {
    supabase.auth.getSession().then(({ data }: any) => {
      if (data?.session?.user) {
        setUser(data.session.user);
        router.replace("/dashboard");
      }
    });
    supabase.auth.getUser().then(({ data }: any) => {
      if (data?.user) {
        setUser(data.user);
        router.replace("/dashboard");
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (session?.user) {
        setUser(session.user);
        router.replace("/dashboard");
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#111827] font-sans selection:bg-[#087F6E]/15 selection:text-[#087F6E]">
      <Navbar />

      <main className="flex-1">
        {/* ── Hero Section ── */}
        <section className="relative px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-16 sm:pb-24 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-[#087F6E] text-xs font-bold tracking-wide">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>FastHire Free ATS Scanner &bull; Instant ATS Score Checker</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              FastHire Free ATS Scanner: Test Your Resume Against Any <span className="text-[#087F6E]">Job Description</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              FastHire free ATS optimization scores your ATS resume against modern applicant tracking systems like Greenhouse, Lever, Workday, and Taleo. Discover missing keywords, optimize formatting, and beat recruiter filters before you apply.
            </p>

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link href={user ? "/dashboard" : "/auth/login?redirect=/dashboard"}>
                <Button className="h-12 px-7 bg-[#087F6E] hover:bg-[#075E53] text-white font-bold text-sm rounded-xl shadow-md transition-all gap-2 cursor-pointer w-full sm:w-auto">
                  {!user && <Lock className="h-4 w-4" />}
                  <span>{user ? "Open ATS Optimizer" : "Sign In to Check Your Resume"}</span>
                </Button>
              </Link>
              <Link href="/ats-optimizer">
                <Button variant="outline" className="h-12 px-6 border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-sm rounded-xl w-full sm:w-auto">
                  See ATS Optimizer
                </Button>
              </Link>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Free monthly scans &bull; Instant ATS compatibility score in under 30 seconds
            </p>

            {/* Visual ATS Audit Report Preview */}
            <div className="pt-6 max-w-[360px] mx-auto">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-md bg-white">
                <img
                  src="/images/ats-scanner-audit.jpg"
                  alt="Real-time ATS Resume Scanner Audit Report"
                  className="w-full max-h-[250px] object-cover select-none"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Interactive Score Improvement Test for Specific Jobs ── */}
        <section className="px-4 sm:px-6 lg:px-8 py-12 bg-slate-50/70 border-y border-slate-200/80">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Score Improvement Test by Job Category
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Test how resumes score before and after aligning with role-specific job descriptions.
              </p>
            </div>

            {/* Job selector tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {ATS_JOB_SIMULATIONS.map((item, idx) => (
                <button
                  key={item.title}
                  onClick={() => setActiveJobIndex(idx)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeJobIndex === idx
                      ? "bg-[#087F6E] text-white shadow-sm"
                      : "bg-white text-slate-700 border border-slate-200 hover:border-[#087F6E]/40"
                  }`}
                >
                  {item.title}
                </button>
              ))}
            </div>

            {/* Score Comparison Display */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                
                {/* Before Optimization Box */}
                <div className="p-6 rounded-2xl border border-red-200 bg-red-50/30 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-red-700 uppercase tracking-wider">Unoptimized Resume</span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-red-100 text-red-700 border border-red-200">
                      Rejected by ATS
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-red-600">{activeSim.baselineScore}%</span>
                    <span className="text-xs text-red-600 font-semibold">Overall Match</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2 text-red-700 font-medium">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{activeSim.missingKeywords.length} vital keywords missing from job description</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {activeSim.missingKeywords.slice(0, 4).map((kw) => (
                      <span key={kw} className="text-[10px] font-bold text-red-700 bg-white/80 px-2 py-0.5 rounded border border-red-200">
                        ✕ {kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* After Optimization Box */}
                <div className="p-6 rounded-2xl border border-teal-200 bg-teal-50/40 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-[#087F6E] uppercase tracking-wider">FastHire AI Optimized</span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-teal-100 text-[#087F6E] border border-teal-200">
                      Top 5% Candidate
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-[#087F6E]">{activeSim.optimizedScore}%</span>
                    <span className="text-xs text-[#087F6E] font-semibold">Overall Match (+{activeSim.optimizedScore - activeSim.baselineScore}pts)</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <div className="flex items-center gap-2 text-[#087F6E] font-medium">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>All required technical and domain keywords incorporated naturally</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {activeSim.missingKeywords.slice(0, 4).map((kw) => (
                      <span key={kw} className="text-[10px] font-bold text-[#087F6E] bg-white px-2 py-0.5 rounded border border-teal-200">
                        ✓ {kw}
                      </span>
                    ))}
                  </div>
                </div>

              </div>

              {/* Detailed Metrics Breakdown */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Scoring Criteria Breakdown for {activeSim.title}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {activeSim.scoreBreakdown.map((item) => (
                    <div key={item.label} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                      <p className="text-[11px] font-semibold text-slate-600 truncate">{item.label}</p>
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-red-500">{item.before}</span>
                        <ArrowRight className="h-3 w-3 text-slate-400" />
                        <span className="text-[#087F6E]">{item.after}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Call to Action ── */}
        <section className="px-4 sm:px-6 lg:px-8 py-16 bg-slate-900 text-white text-center">
          <div className="max-w-2xl mx-auto space-y-5">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Check Your Real ATS Score Now
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Sign in to scan your resume against any job posting. Get a detailed breakdown of your score, missing keywords, and recommended bullet improvements in seconds.
            </p>
            <div className="pt-2">
              <Link href={user ? "/dashboard" : "/auth/login?redirect=/dashboard"}>
                <Button className="h-12 px-8 bg-[#087F6E] hover:bg-[#075E53] text-white font-bold text-sm rounded-xl shadow-lg transition-all gap-2 cursor-pointer">
                  {!user && <Lock className="h-4 w-4" />}
                  <span>{user ? "Open ATS Optimizer" : "Sign In to Run Free ATS Check"}</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
