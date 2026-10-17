"use client";

import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Target,
  CheckCircle2,
  Sparkles,
  FileText,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TailorResumePage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-[#111827] font-sans selection:bg-[#087F6E]/15 selection:text-[#087F6E]">
      <Navbar />

      <main className="flex-1">
        {/* Header Hero */}
        <section className="bg-white border-b border-slate-200 pt-12 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-4 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-[#087F6E] text-xs font-bold">
              <Target className="h-3.5 w-3.5" />
              <span>Targeted Job Customization</span>
            </div>
            <h1 className="font-heading text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              How to Tailor Your Resume to Any Job Post
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Why submitting 1 generic resume to 50 jobs rarely works, and how tailoring your
              bullet points for specific roles boosts interview callback rates by 3.8x.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
              <span className="h-8 w-8 rounded-xl bg-teal-50 text-[#087F6E] flex items-center justify-center font-bold text-xs">
                01
              </span>
              <h2 className="font-heading font-extrabold text-lg text-slate-900">
                1. Extract Core Competencies
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Identify the 5–8 non-negotiable tools, frameworks, and qualifications explicitly repeated in the job description requirements.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
              <span className="h-8 w-8 rounded-xl bg-teal-50 text-[#087F6E] flex items-center justify-center font-bold text-xs">
                02
              </span>
              <h2 className="font-heading font-extrabold text-lg text-slate-900">
                2. Re-Align Bullet Action Verbs
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                If the posting emphasizes "orchestrated" or "architected", update your project descriptions to demonstrate high-level technical leadership.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
              <span className="h-8 w-8 rounded-xl bg-teal-50 text-[#087F6E] flex items-center justify-center font-bold text-xs">
                03
              </span>
              <h2 className="font-heading font-extrabold text-lg text-slate-900">
                3. Update Categorized Skills
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Move the exact languages and cloud providers mentioned in the JD to the front of your technical skills line for immediate match detection.
              </p>
            </div>
          </div>

          {/* Action CTA */}
          <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 text-center space-y-5">
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold">
              Automate Resume Tailoring with AI
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              Paste your target job description into RoleFuse and get a customized, keyword-tailored resume in under 30 seconds.
            </p>
            <div className="pt-2">
              <Link href="/ats-optimizer">
                <Button className="h-12 px-8 bg-[#087F6E] hover:bg-[#065F53] text-white font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer">
                  Tailor My Resume Now
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
