"use client";

import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Key,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  Layers,
  ShieldCheck,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ResumeKeywordsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-[#111827] font-sans selection:bg-[#087F6E]/15 selection:text-[#087F6E]">
      <Navbar />

      <main className="flex-1">
        {/* Header Hero */}
        <section className="bg-white border-b border-slate-200 pt-12 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-4 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-[#087F6E] text-xs font-bold">
              <Key className="h-3.5 w-3.5" />
              <span>Keyword Optimization Strategy</span>
            </div>
            <h1 className="font-heading text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Resume Keywords: What ATS Scans For
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Discover how applicant tracking systems extract, weigh, and rank technical skills,
              certifications, and domain terms without falling into keyword stuffing traps.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12">
          {/* Visual Blueprint of Keyword Placement */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="font-heading font-extrabold text-lg text-slate-900">
                Where to Place Keywords on Your Resume
              </h2>
              <span className="text-[11px] font-bold text-[#087F6E] bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                Strategic Placement
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="h-8 w-8 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-xs">
                  01
                </div>
                <h3 className="font-bold text-sm text-slate-900">Professional Summary</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Include 2–3 core domain keywords matching your target title. Example: Full Stack Engineer specializing in TypeScript, Next.js, and Distributed Cloud Systems.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="h-8 w-8 rounded-lg bg-[#087F6E] text-white flex items-center justify-center font-bold text-xs">
                  02
                </div>
                <h3 className="font-bold text-sm text-slate-900">Technical Skills Block</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Group your tools categorically: Languages, Frameworks, Cloud &amp; DevOps, Databases. This section gives parsers a clean inventory of hard skills.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="h-8 w-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  03
                </div>
                <h3 className="font-bold text-sm text-slate-900">Achievement Bullets</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Embed keywords in context with quantifiable results: Built microservices using PostgreSQL and Docker, reducing API latency by 35% for 100K+ DAUs.
                </p>
              </div>
            </div>
          </div>

          {/* Hard vs Soft Skills Comparison Table */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <h2 className="font-heading font-extrabold text-xl text-slate-900">
              Hard Skills vs Soft Skills in ATS Parsing
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-teal-50/50 border border-teal-200 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#087F6E]" />
                  <h3 className="font-bold text-sm text-slate-900">High-Weight Hard Skills (Do This)</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Parsers give 80%+ of score weight to hard credentials:
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {["React.js", "Python", "Kubernetes", "PostgreSQL", "AWS IAM", "Financial Modeling", "ETL Pipelines", "GitOps"].map((sk) => (
                    <span key={sk} className="text-[11px] font-bold text-[#087F6E] bg-white px-2 py-0.5 rounded border border-teal-200">
                      ✓ {sk}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-slate-500" />
                  <h3 className="font-bold text-sm text-slate-900">Low-Weight Soft Skills (Avoid Overusing)</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Generic adjectives carry near-zero weight in search queries:
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {["Team player", "Hard worker", "Detail oriented", "Self starter", "Strong communicator", "Passionate"].map((sk) => (
                    <span key={sk} className="text-[11px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 text-center space-y-5">
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold">
              Detect Missing Keywords with FastHire AI
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              Paste your target job description and see exactly which hard keywords are missing from your resume before you apply.
            </p>
            <div className="pt-2">
              <Link href="/ats-optimizer">
                <Button className="h-12 px-8 bg-[#087F6E] hover:bg-[#065F53] text-white font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer">
                  Optimize Keywords Free
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
