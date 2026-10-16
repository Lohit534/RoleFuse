"use client";

import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HowAtsWorksPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-[#111827] font-sans selection:bg-[#087F6E]/15 selection:text-[#087F6E]">
      <Navbar />

      <main className="flex-1">
        {/* Header Hero */}
        <section className="bg-white border-b border-slate-200 pt-12 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-4 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-[#087F6E] text-xs font-bold">
              <Cpu className="h-3.5 w-3.5" />
              <span>Applicant Tracking Systems Explained</span>
            </div>
            <h1 className="font-heading text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              How ATS Software Works in 2026
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Understand the exact parsing pipeline and candidate ranking algorithms used by
              Workday, Taleo, Greenhouse, and Lever before your resume ever reaches human eyes.
            </p>
          </div>
        </section>

        {/* Visual ATS Architecture Diagram */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12">
          {/* Visual SVG Diagram Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-teal-50 text-[#087F6E] flex items-center justify-center font-bold text-sm">
                  01
                </div>
                <h2 className="font-heading font-extrabold text-lg text-slate-900">
                  The 4-Stage ATS Filtering Pipeline
                </h2>
              </div>
              <span className="text-[11px] font-bold text-[#087F6E] bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                Enterprise Process
              </span>
            </div>

            {/* Visual Process Grid with authentic diagram graphics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="h-8 w-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  A
                </div>
                <h3 className="font-bold text-xs text-slate-900">1. Document Ingestion</h3>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Your PDF or DOCX file is fed into the OCR engine. Text layers are stripped of formatting and extracted into a linear stream.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="h-8 w-8 rounded-lg bg-[#087F6E] text-white flex items-center justify-center font-bold text-xs">
                  B
                </div>
                <h3 className="font-bold text-xs text-slate-900">2. Entity Recognition</h3>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Natural Language Processing (NLP) categorizes data into discrete fields: Contact Info, Work History, Education, and Skills.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="h-8 w-8 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-xs">
                  C
                </div>
                <h3 className="font-bold text-xs text-slate-900">3. Keyword Matching</h3>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  The candidate record is evaluated against job criteria. Exact match strings and semantic vector embeddings (SBERT) determine relevance.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="h-8 w-8 rounded-lg bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                  D
                </div>
                <h3 className="font-bold text-xs text-slate-900">4. Recruiter Ranking</h3>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Recruiters view a prioritized candidate leaderboard. Only applicants in the top 10–20% match tier receive human review.
                </p>
              </div>
            </div>
          </div>

          {/* In-depth Detailed Articles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
              <div className="h-10 w-10 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#087F6E]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className="font-heading font-extrabold text-xl text-slate-900">
                Why Standard Resumes Get Discarded
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Applicant tracking systems are programmed to reject what they cannot read. When candidates submit resumes designed in complex graphic design tools with multi-column tables, text frames, or non-standard fonts, the parser produces jumbled garbage.
              </p>
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#087F6E] shrink-0" />
                  <span>Dual column tables merge job titles and company names into one line</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#087F6E] shrink-0" />
                  <span>Header and footer layers are completely skipped by legacy parsers</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#087F6E] shrink-0" />
                  <span>Graphic skill bars cannot be parsed into measurable keywords</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
              <div className="h-10 w-10 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#087F6E]">
                <Sparkles className="h-5 w-5" />
              </div>
              <h2 className="font-heading font-extrabold text-xl text-slate-900">
                How to Guarantee 95%+ Match Scores
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Scoring high does not require tricking the ATS. It requires presenting your authentic experience in the exact semantic structure that the ATS indexes for the target role.
              </p>
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#087F6E] shrink-0" />
                  <span>Include exact keyword matches in your dedicated technical skills block</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#087F6E] shrink-0" />
                  <span>Quantify every bullet with metrics (percentages, team sizes, dollars saved)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#087F6E] shrink-0" />
                  <span>Use standard reverse-chronological headers: Work Experience, Education</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTA Box */}
          <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 text-center space-y-5">
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold">
              Test How Your Resume Parses Today
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              Run your resume through our free ATS diagnostic scanner. Identify parsing gaps, missing keywords, and section readability in seconds.
            </p>
            <div className="pt-2">
              <Link href="/ats-checker">
                <Button className="h-12 px-8 bg-[#087F6E] hover:bg-[#065F53] text-white font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer">
                  Check Your ATS Score Free
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
