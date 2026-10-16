"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase/client";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Layers,
  Lock,
  Target,
  FileCheck,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const OPTIMIZATION_CASE_STUDIES = [
  {
    role: "AI & Machine Learning Engineer",
    jdSummary: "Seeking Senior ML Engineer with PyTorch, LLM fine-tuning, latency optimization, and Triton server deployment.",
    before: [
      "Trained machine learning models on customer text datasets.",
      "Worked with PyTorch and Python to deploy neural network models.",
      "Assisted senior engineers with model evaluation and testing.",
    ],
    after: [
      "Fine-tuned 7B+ parameter open-source LLMs using PyTorch & LoRA on 15M+ customer dialog tokens, boosting domain accuracy by 27%.",
      "Deployed optimized transformer inference pipelines on NVIDIA Triton servers, slashing P99 token latency from 85ms to 24ms.",
      "Engineered automated model benchmarking suite tracking BLEU and ROUGE scores across 4 production release cycles.",
    ],
    keyChanges: [
      "Injected exact target keywords: LoRA, NVIDIA Triton, P99 Latency, BLEU/ROUGE",
      "Transformed generic duty statements into quantifiable business results",
      "Added technical scale indicators: 7B+ parameters, 15M+ tokens, 24ms latency",
    ],
  },
  {
    role: "Cybersecurity Analyst",
    jdSummary: "Requires SOC Analyst experienced in SIEM (Splunk), threat hunting, MITRE ATT&CK framework, and incident response.",
    before: [
      "Monitored network traffic for suspicious activities and security alerts.",
      "Handled security tickets and investigated potential malware infections.",
      "Wrote reports on security incidents for department management.",
    ],
    after: [
      "Monitored enterprise perimeter across 10,000+ endpoints using Splunk SIEM, triaging and resolving 150+ monthly alerts within 12-min SLA.",
      "Executed proactive threat hunting mapped to MITRE ATT&CK framework, neutralizing 14 stealth command-and-control intrusions.",
      "Formulated comprehensive incident response post-mortems adopted company-wide, reducing Mean Time to Remediate (MTTR) by 38%.",
    ],
    keyChanges: [
      "Injected exact target keywords: Splunk SIEM, MITRE ATT&CK, MTTR, 12-min SLA",
      "Demonstrated scope: 10,000+ endpoints, 150+ monthly alerts",
      "Replaced passive wording with strong cybersecurity action verbs: Triaged, Neutralized, Formulated",
    ],
  },
];

export default function AtsOptimizerPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [selectedCaseIndex, setSelectedCaseIndex] = useState(0);
  const currentCase = OPTIMIZATION_CASE_STUDIES[selectedCaseIndex];

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
              <Sparkles className="h-3.5 w-3.5" />
              <span>Intelligent ATS Optimizer</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              What Changes When You Optimize for a <span className="text-[#087F6E]">Specific Job?</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              See how FastHire AI scans a target job description, discovers every missing technical requirement, and rewrites your resume experience with powerful metrics and action verbs in 30 seconds.
            </p>

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link href={user ? "/dashboard" : "/auth/login?redirect=/dashboard"}>
                <Button className="h-12 px-7 bg-[#087F6E] hover:bg-[#075E53] text-white font-bold text-sm rounded-xl shadow-md transition-all gap-2 cursor-pointer w-full sm:w-auto">
                  {!user && <Lock className="h-4 w-4" />}
                  <span>{user ? "Open AI Optimizer" : "Sign In to Optimize Your Resume"}</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <Link href="/resume-builder">
                <Button variant="outline" className="h-12 px-6 border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-sm rounded-xl w-full sm:w-auto">
                  View Resume Builder
                </Button>
              </Link>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Adaptive summaries &bull; Single clean skills section &bull; Zero date hallucinations
            </p>
          </div>
        </section>

        {/* ── Interactive Case Studies: What Changes for Specific Jobs ── */}
        <section className="px-4 sm:px-6 lg:px-8 py-12 bg-slate-50/70 border-y border-slate-200/80">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Live Optimization Breakdown for Target Roles
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Observe the line-by-line transformation from a generic resume into a job-specific ATS powerhouse.
              </p>
            </div>

            {/* Case Study Switcher */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {OPTIMIZATION_CASE_STUDIES.map((item, idx) => (
                <button
                  key={item.role}
                  onClick={() => setSelectedCaseIndex(idx)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    selectedCaseIndex === idx
                      ? "bg-[#087F6E] text-white shadow-sm"
                      : "bg-white text-slate-700 border border-slate-200 hover:border-[#087F6E]/40"
                  }`}
                >
                  {item.role}
                </button>
              ))}
            </div>

            {/* Comparison Container */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              {/* Target Job Summary Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Target Job Description Requirement:</span>
                <p className="font-medium text-slate-800 italic">"{currentCase.jdSummary}"</p>
              </div>

              {/* Side by Side Bullets */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Original Unoptimized */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-wider">
                    <span>Original Unoptimized Bullets</span>
                  </div>
                  <div className="space-y-2.5">
                    {currentCase.before.map((bullet, i) => (
                      <div key={i} className="p-3.5 rounded-xl border border-rose-200/80 bg-rose-50/30 text-xs text-slate-700 leading-relaxed font-mono">
                        {bullet}
                      </div>
                    ))}
                  </div>
                </div>

                {/* FastHire AI Optimized */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[#087F6E] font-bold text-xs uppercase tracking-wider">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>FastHire AI Targeted Bullets</span>
                  </div>
                  <div className="space-y-2.5">
                    {currentCase.after.map((bullet, i) => (
                      <div key={i} className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/40 text-xs text-slate-900 leading-relaxed font-mono">
                        {bullet}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* What specifically changed analysis */}
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 pt-4">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Key Changes Applied for this Specific Job:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {currentCase.keyChanges.map((change, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#087F6E] shrink-0" />
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── Call to Action ── */}
        <section className="px-4 sm:px-6 lg:px-8 py-16 bg-slate-900 text-white text-center">
          <div className="max-w-2xl mx-auto space-y-5">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Tailor Your Resume for Any Job Posting
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Sign in to input your current resume and paste the target job description. Get an ATS-optimized rewrite and downloadable PDF in under 30 seconds.
            </p>
            <div className="pt-2">
              <Link href={user ? "/dashboard" : "/auth/login?redirect=/dashboard"}>
                <Button className="h-12 px-8 bg-[#087F6E] hover:bg-[#075E53] text-white font-bold text-sm rounded-xl shadow-lg transition-all gap-2 cursor-pointer">
                  {!user && <Lock className="h-4 w-4" />}
                  <span>{user ? "Open AI Optimizer" : "Sign In to Access ATS Optimizer"}</span>
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
