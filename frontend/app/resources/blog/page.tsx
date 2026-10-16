"use client";

import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  BookOpen,
  CheckCircle2,
  Calendar,
  Sparkles,
  ShieldCheck,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const ARTICLES = [
  {
    title: "How to Answer 'Tell Me About Yourself' in Tech Interviews",
    category: "Interview Preparation",
    readTime: "4 min read",
    date: "October 2026",
    desc: "The proven Present-Past-Future narrative framework used by candidates landing Senior & Staff offers at Google, Meta, and high-growth fintechs.",
    link: "/resources/blog",
  },
  {
    title: "The 30-Second Resume Rule: What Recruiters Actually Look At",
    category: "Resume Strategy",
    readTime: "3 min read",
    date: "October 2026",
    desc: "Eye-tracking heatmaps reveal recruiters scan current company, current title, key skills, and recent metrics before reading a single bullet point.",
    link: "/resources/blog",
  },
  {
    title: "How Many Keywords Is Too Many on a Resume?",
    category: "ATS Deep Dive",
    readTime: "3 min read",
    date: "September 2026",
    desc: "Avoiding the penalty box: Why modern semantic ATS algorithms penalize keyword stuffing and reward natural, contextual placement.",
    link: "/resources/resume-keywords",
  },
  {
    title: "1-Page vs 2-Page Resume: The Definitive 2026 Verdict",
    category: "Resume Formatting",
    readTime: "2 min read",
    date: "September 2026",
    desc: "Under 5 years experience should strictly stick to 1 page. Discover when it is appropriate to expand to 2 pages without hurting readability.",
    link: "/resources/ats-formatting-mistakes",
  },
];

export default function BlogPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-[#111827] font-sans selection:bg-[#087F6E]/15 selection:text-[#087F6E]">
      <Navbar />

      <main className="flex-1">
        {/* Header Hero */}
        <section className="bg-white border-b border-slate-200 pt-12 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-4 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-[#087F6E] text-xs font-bold">
              <BookOpen className="h-3.5 w-3.5" />
              <span>Career Advice &amp; Recruiter Insights</span>
            </div>
            <h1 className="font-heading text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              FastHire Career Blog &amp; Guides
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Actionable advice, hiring trends, and resume optimization secrets curated
              by technical recruiters and career coaches.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {ARTICLES.map((art, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#087F6E] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {art.category}
                    </span>
                    <span className="text-slate-400 font-medium">{art.readTime}</span>
                  </div>

                  <h2 className="font-heading font-extrabold text-lg text-slate-900 leading-snug">
                    {art.title}
                  </h2>

                  <p className="text-xs text-slate-600 leading-relaxed">{art.desc}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">{art.date}</span>
                  <Link href={art.link}>
                    <Button
                      variant="outline"
                      className="h-8 px-3 text-xs font-bold rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Read Guide
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Action CTA */}
          <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 text-center space-y-5">
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold">
              Ready to Upgrade Your Application?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              Test your resume against real applicant tracking systems with FastHire AI.
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
