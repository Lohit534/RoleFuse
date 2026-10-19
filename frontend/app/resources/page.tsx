"use client";

import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Search,
  Key,
  AlertTriangle,
  Type,
  Bot,
  Target,
  FileCheck,
  Star,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const ALL_RESOURCES = [
  {
    title: "How ATS Software Works",
    subtitle: "How recruiters screen resumes.",
    href: "/resources/how-ats-works",
    icon: Search,
  },
  {
    title: "Resume Keywords",
    subtitle: "Add the keywords ATS scans for.",
    href: "/resources/resume-keywords",
    icon: Key,
  },
  {
    title: "ATS Formatting Mistakes",
    subtitle: "Formatting errors ATS can't read.",
    href: "/resources/ats-formatting-mistakes",
    icon: AlertTriangle,
  },
  {
    title: "Best Resume Fonts",
    subtitle: "The best fonts for an ATS resume.",
    href: "/resources/best-resume-fonts",
    icon: Type,
  },
  {
    title: "ChatGPT Resume",
    subtitle: "Write your resume with ChatGPT.",
    href: "/resources/chatgpt-resume",
    icon: Bot,
  },
  {
    title: "Tailor Your Resume to the Job",
    subtitle: "Match your resume to each job post.",
    href: "/resources/tailor-resume",
    icon: Target,
  },
  {
    title: "Convert Resume to ATS Format",
    subtitle: "Make any resume ATS-ready.",
    href: "/resources/convert-resume-ats",
    icon: FileCheck,
  },
  {
    title: "Best Free Resume Builders",
    subtitle: "Free resume builders, compared.",
    href: "/resources/best-free-resume-builders",
    icon: Star,
  },
  {
    title: "RoleFuse Career Blog",
    subtitle: "Advice and guides for job seekers.",
    href: "/resources/blog",
    icon: BookOpen,
  },
];

export default function ResourcesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-[#111827] font-sans selection:bg-[#087F6E]/15 selection:text-[#087F6E]">
      <Navbar />

      <main className="flex-1">
        {/* Header Hero */}
        <section className="bg-white border-b border-slate-200 pt-12 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-[1240px] mx-auto space-y-10">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-[#087F6E] text-xs font-bold">
                <BookOpen className="h-3.5 w-3.5" />
                <span>Career Resources &amp; Guides</span>
              </div>
              <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                RoleFuse Career &amp; ATS Knowledge Hub
              </h1>
              <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Practical, research-backed guides on recruiter screening algorithms, resume keyword matching,
                and technical career growth.
              </p>
            </div>

            {/* Split Layout: Useful text on Left + Reduced Size Image on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xs">
              {/* Left Column: Useful Editorial Text */}
              <div className="lg:col-span-7 space-y-5 text-left">
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#087F6E]">
                    What You'll Learn
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
                    Master Every Dimension of Resume Screening
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Recruiters spend an average of 6 seconds reviewing a resume, and applicant tracking software automatically filters out 75% before human eyes ever see them. Our guides teach you how to write for both machines and hiring managers.
                  </p>
                </div>

                {/* 4 Core Learning Pillars */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs">
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                      <FileCheck className="h-4 w-4 text-[#087F6E] shrink-0" />
                      <span>Parser Compliance</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Understand why multi-column layouts, text boxes, and fancy graphics break ATS parsing.
                    </p>
                  </div>

                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs">
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                      <Target className="h-4 w-4 text-[#087F6E] shrink-0" />
                      <span>Keyword Strategy</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Discover how exact-match hard skills, tool proficiency, and certifications drive match percentages.
                    </p>
                  </div>

                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs">
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                      <Sparkles className="h-4 w-4 text-[#087F6E] shrink-0" />
                      <span>Actionable Bullets</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Use the Google XYZ formula: "Accomplished [X] as measured by [Y], by doing [Z]".
                    </p>
                  </div>

                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs">
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                      <Search className="h-4 w-4 text-[#087F6E] shrink-0" />
                      <span>ATS Checker Insights</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Learn how commercial parsers extract work history dates, job titles, and company names.
                    </p>
                  </div>
                </div>

                {/* Action CTA */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Link href="/resources/ats-formatting-mistakes">
                    <Button className="bg-[#087F6E] hover:bg-[#065F53] text-white font-bold text-xs h-10 px-5 rounded-md shadow-xs">
                      Read Top Formatting Mistakes
                    </Button>
                  </Link>
                  <Link href="/resources/how-ats-works">
                    <Button variant="outline" className="bg-white hover:bg-slate-50 text-slate-800 border-slate-300 font-bold text-xs h-10 px-4 rounded-md">
                      How ATS Works
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right Column: Reduced Size Image with Professional Frame */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-md bg-white max-w-[350px] w-full">
                  <img
                    src="/images/resources-guide.jpg"
                    alt="RoleFuse Career Growth & ATS Optimization Advice"
                    className="w-full max-h-[250px] object-cover select-none"
                  />
                  <div className="absolute bottom-2.5 right-2.5 bg-slate-900/85 backdrop-blur-xs text-white text-[10px] font-semibold px-2.5 py-1 rounded-md border border-white/10 shadow-xs">
                    Editorial Career Guides
                  </div>
                </div>
              </div>
            </div>

            {/* Down (Underneath): Key Rules & Insights Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>Rule #1: Single-Column Format</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Single-column layouts parse with 99.4% accuracy across Workday, Taleo, and Greenhouse without text scramble.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>Rule #2: Standard ATS Fonts</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Fonts like Times New Roman, Calibri, Arial, and Helvetica ensure reliable OCR character recognition.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>Rule #3: 70%+ Match Threshold</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Resumes matching at least 70% of job description keywords are 3.8x more likely to reach the interview round.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3x3 Grid Matching User Reference Image */}
        <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ALL_RESOURCES.map((item) => {
              const IconComp = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-[#087F6E] hover:shadow-md transition-all flex flex-col justify-between space-y-4 group cursor-pointer"
                >
                  <div className="space-y-3">
                    <div className="h-10 w-10 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0 group-hover:bg-[#087F6E] transition-colors">
                      <IconComp className="h-5 w-5 text-[#087F6E] group-hover:text-white transition-colors" />
                    </div>
                    <h2 className="font-heading font-extrabold text-base text-slate-900 group-hover:text-[#087F6E] transition-colors">
                      {item.title}
                    </h2>
                    <p className="text-xs text-slate-500 leading-relaxed font-normal">
                      {item.subtitle}
                    </p>
                  </div>
                  <div className="pt-2 text-xs font-bold text-[#087F6E]">
                    Read Guide
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Action CTA */}
          <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 text-center space-y-5">
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold">
              Ready to Test Your Resume?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              Scan your resume against any job posting to see keyword density, parseability, and real ATS score in seconds.
            </p>
            <div className="pt-2">
              <Link href="/ats-checker">
                <Button className="h-12 px-8 bg-[#087F6E] hover:bg-[#065F53] text-white font-bold text-sm rounded-md shadow-lg transition-all cursor-pointer">
                  Check Your ATS Score
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
