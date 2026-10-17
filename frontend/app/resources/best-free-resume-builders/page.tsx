"use client";

import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  FileText,
  Download,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    title: "100% Free ATS Compatibility",
    desc: "Single-column hierarchy, standard headings, and clean text layers tested against Greenhouse, Workday, and Lever.",
    icon: ShieldCheck,
  },
  {
    title: "Real-Time AI Tailoring",
    desc: "Match your resume directly against target job descriptions and paste bullet points optimized for recruiter keywords.",
    icon: Sparkles,
  },
  {
    title: "Clean PDF & Word Exports",
    desc: "Download instant ATS-friendly files without surprise subscription traps, credit card prompts, or watermarks.",
    icon: Download,
  },
  {
    title: "Instant ATS Score Check",
    desc: "Scan your resume content in seconds to uncover missing hard skills, formatting errors, and keyword density.",
    icon: Zap,
  },
];

const BEST_PRACTICES = [
  "Use standard section headers: Work Experience, Education, Skills, and Summary.",
  "Avoid multi-column tables, text boxes, and complex graphics that confuse OCR parsers.",
  "Export directly as PDF with machine-readable text layers or clean Word (.docx).",
  "Quantify your career results with metrics, percentages, and tangible revenue figures.",
  "Tailor hard skill keywords to match each specific job posting you apply to.",
];

export default function BestFreeResumeBuildersPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-[#111827] font-sans selection:bg-[#087F6E]/15 selection:text-[#087F6E]">
      <Navbar />

      <main className="flex-1">
        {/* Header Hero */}
        <section className="bg-white border-b border-slate-200 pt-12 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-4 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-[#087F6E] text-xs font-bold">
              <FileText className="h-3.5 w-3.5" />
              <span>RoleFuse Resume Builder Guide</span>
            </div>
            <h1 className="font-heading text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Build an ATS-Friendly Resume for Free with RoleFuse
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Create a recruiter-ready, ATS-compliant resume without hidden fees, paywall traps, or complex design software.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
          {/* Core FastHire Capabilities */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <h2 className="font-heading font-extrabold text-xl text-slate-900">
              Why Job Seekers Choose RoleFuse
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {FEATURES.map((item) => {
                const IconComp = item.icon;
                return (
                  <div
                    key={item.title}
                    className="p-5 rounded-2xl bg-teal-50/40 border border-teal-100 space-y-3"
                  >
                    <div className="h-9 w-9 rounded-xl bg-white border border-teal-200 flex items-center justify-center text-[#087F6E] shadow-2xs">
                      <IconComp className="h-4 w-4" />
                    </div>
                    <h3 className="font-heading font-extrabold text-sm text-slate-900">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Standards & Best Practices */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
            <h2 className="font-heading font-extrabold text-xl text-slate-900">
              RoleFuse Resume Quality Standards
            </h2>
            <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
              {BEST_PRACTICES.map((tip) => (
                <div key={tip} className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-[#087F6E] shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action CTA */}
          <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 text-center space-y-5">
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold">
              Build Your Resume with RoleFuse
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              Step into an ATS-optimized career path with our intelligent builder. Free, fast, and verified for modern hiring systems.
            </p>
            <div className="pt-2">
              <Link href="/resume-builder">
                <Button className="h-12 px-8 bg-[#087F6E] hover:bg-[#065F53] text-white font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer">
                  Start Building Your Resume Now
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
