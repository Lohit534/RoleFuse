"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, CheckCircle2, AlertTriangle, ArrowRight, RotateCw, Zap } from "lucide-react";

export default function ScoreClimbShowcase() {
  const [score, setScore] = useState(34);
  const [phase, setPhase] = useState<"before" | "optimizing" | "after">("before");
  const [isReplaying, setIsReplaying] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const runAnimation = () => {
    setIsReplaying(true);
    setScore(34);
    setPhase("before");

    // Start climbing after 600ms
    const timer1 = setTimeout(() => {
      setPhase("optimizing");
      const start = 34;
      const target = 91;
      const duration = 2000;
      const startTime = performance.now();

      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (target - start) * ease);
        setScore(current);

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          setScore(91);
          setPhase("after");
          setIsReplaying(false);
        }
      };
      requestAnimationFrame(step);
    }, 600);

    return () => clearTimeout(timer1);
  };

  useEffect(() => {
    if (!mounted) return;
    const initialTimer = setTimeout(() => {
      runAnimation();
    }, 500);

    const autoLoop = setInterval(() => {
      runAnimation();
    }, 11000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(autoLoop);
    };
  }, [mounted]);

  // Enterprise professional color palette
  const getTheme = (s: number) => {
    if (s < 50) {
      return {
        ringColor: "#64748B",
        badge: "bg-slate-100 text-slate-700 border-slate-200",
        label: "Baseline: Needs Optimization",
      };
    } else if (s < 78) {
      return {
        ringColor: "#0D9488",
        badge: "bg-teal-50 text-[#087F6E] border-teal-200",
        label: "Semantic Matching & Keyword Injection",
      };
    } else {
      return {
        ringColor: "#087F6E",
        badge: "bg-emerald-50 text-[#075E53] border-emerald-200",
        label: "Recruiter-Ready • High Interview Probability",
      };
    }
  };

  const theme = getTheme(score);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="w-full max-w-5xl mx-auto" suppressHydrationWarning>
      {/* ── Enterprise Clean Card ────────────────────────────────────────── */}
      <div className="relative rounded-2xl bg-white border border-[#DCE7E9] shadow-xs p-6 sm:p-8 lg:p-9 overflow-hidden">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
              Automated Parser Analysis
            </span>
            <span className="hidden sm:inline text-xs text-slate-300">•</span>
            <span className="text-xs font-normal text-slate-500">
              Target JD: Senior Full Stack Engineer
            </span>
          </div>

          <button
            onClick={runAnimation}
            disabled={isReplaying}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={`h-3 w-3 ${isReplaying ? "animate-spin text-[#087F6E]" : ""}`} />
            <span>Re-run Simulation</span>
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-center pt-6">
          {/* LEFT: Clean Circular ATS Gauge */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-xl bg-[#F8FAFC] border border-slate-200/80">
            <div className="relative flex items-center justify-center">
              <svg width={136} height={136} className="-rotate-90">
                <circle
                  cx={68}
                  cy={68}
                  r={radius}
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth={9}
                />
                <circle
                  cx={68}
                  cy={68}
                  r={radius}
                  fill="none"
                  stroke={theme.ringColor}
                  strokeWidth={9}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-[stroke,stroke-dashoffset] duration-300 ease-out"
                />
              </svg>

              {/* Center Counter */}
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-4xl font-heading font-extrabold tracking-tight text-[#111827]">
                  {score}%
                </span>
                <span className="text-[10.5px] font-mono font-medium uppercase tracking-wider text-slate-500">
                  {score >= 85 ? "Target Score" : score > 50 ? "Analyzing" : "Baseline"}
                </span>
              </div>
            </div>

            {/* Dynamic Status Pill */}
            <div className="mt-4 text-center">
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-medium border transition-colors duration-300 ${theme.badge}`}
              >
                {theme.label}
              </span>
            </div>

            {/* Score Range Progression Bar */}
            <div className="w-full mt-6 space-y-1.5">
              <div className="flex justify-between text-[11.5px] font-mono text-slate-500">
                <span>Baseline: <strong className="text-slate-800 font-semibold">34%</strong></span>
                <span className="text-[#087F6E] font-bold">+57 Pts Lift</span>
                <span>Recruiter Target: <strong className="text-[#087F6E] font-semibold">91%</strong></span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200/80 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-slate-400 via-teal-500 to-[#087F6E] transition-all duration-300"
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          </div>

          {/* RIGHT: Professional Text Transformation */}
          <div className="lg:col-span-7 space-y-3.5">
            {/* Before Item */}
            <div
              className={`p-4 rounded-xl border transition-all duration-300 ${
                score > 70
                  ? "bg-slate-50/70 border-slate-200/80 opacity-70"
                  : "bg-slate-50 border-slate-200 shadow-2xs"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <AlertTriangle className="h-3.5 w-3.5 text-slate-500" />
                  <span>Before (Unoptimized Baseline)</span>
                </div>
                <span className="text-[11px] font-mono font-medium text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded">
                  34% ATS Match
                </span>
              </div>
              <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed font-mono bg-white p-2.5 rounded border border-slate-200/70">
                "Worked on backend APIs, helped team fix system bugs, and updated database tables as needed."
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2 text-[11px] text-slate-500 font-medium">
                <span className="bg-slate-200/60 px-2 py-0.5 rounded">No measurable impact</span>
                <span className="bg-slate-200/60 px-2 py-0.5 rounded">Missing target keywords</span>
              </div>
            </div>

            {/* Clean Transition Arrow */}
            <div className="flex items-center justify-center gap-2.5 py-0.5">
              <div className="h-px bg-slate-200 flex-1" />
              <div className="flex items-center gap-1 px-3 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-[#087F6E] text-[11.5px] font-semibold">
                <Zap className="h-3 w-3 fill-[#087F6E]" />
                <span>RoleFuse AI Semantic Rewrite</span>
                <ArrowRight className="h-3 w-3" />
              </div>
              <div className="h-px bg-slate-200 flex-1" />
            </div>

            {/* After Item */}
            <div
              className={`p-4 rounded-xl border transition-all duration-500 ${
                score > 70
                  ? "bg-white border-[#087F6E]/40 shadow-xs ring-1 ring-[#087F6E]/15"
                  : "bg-white border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#087F6E]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#087F6E]" />
                  <span>Optimized (Recruiter-Ready Standard)</span>
                </div>
                <span className="text-[11px] font-mono font-bold text-[#075E53] bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                  91% ATS Match
                </span>
              </div>
              <p className="text-xs sm:text-[13px] text-slate-900 leading-relaxed font-sans font-medium bg-teal-50/25 p-2.5 rounded border border-teal-100">
                "Architected <span className="text-[#075E53] font-semibold bg-teal-50 px-1 rounded">14+ microservices</span> in Go & PostgreSQL, slashing API latency by <span className="text-[#075E53] font-semibold bg-teal-50 px-1 rounded">42%</span> and scaling pipelines to support <span className="text-[#075E53] font-semibold bg-teal-50 px-1 rounded">2.8M daily requests</span>."
              </p>

              {/* Injected JD Keywords */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                <span className="text-[10.5px] font-mono uppercase font-semibold text-slate-500 mr-0.5">
                  Injected Keywords:
                </span>
                <span className="text-[11px] font-medium bg-white text-slate-800 border border-slate-200 px-2 py-0.5 rounded flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5 text-[#087F6E]" />
                  Microservices Architecture
                </span>
                <span className="text-[11px] font-medium bg-white text-slate-800 border border-slate-200 px-2 py-0.5 rounded flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5 text-[#087F6E]" />
                  PostgreSQL Optimization
                </span>
                <span className="text-[11px] font-medium bg-white text-slate-800 border border-slate-200 px-2 py-0.5 rounded flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5 text-[#087F6E]" />
                  Distributed Pipelines
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
