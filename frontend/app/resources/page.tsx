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
          <div className="max-w-4xl mx-auto space-y-4 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-[#087F6E] text-xs font-bold">
              <BookOpen className="h-3.5 w-3.5" />
              <span>Career Resources &amp; Guides</span>
            </div>
            <h1 className="font-heading text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              RoleFuse Career Resources
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Explore our comprehensive guides on ATS scoring, keyword optimization, formatting
              rules, and AI resume writing.
            </p>

            {/* Visual Editorial Resources Guide Banner */}
            <div className="pt-6 max-w-3xl mx-auto">
              <div className="relative rounded-3xl overflow-hidden border border-slate-200/90 shadow-xl bg-white">
                <img
                  src="/images/resources-guide.jpg"
                  alt="RoleFuse Career Growth & ATS Optimization Advice"
                  className="w-full h-auto object-cover select-none"
                />
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
                <Button className="h-12 px-8 bg-[#087F6E] hover:bg-[#065F53] text-white font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer">
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
