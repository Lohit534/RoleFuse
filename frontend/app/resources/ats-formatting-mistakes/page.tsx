"use client";

import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const MISTAKES = [
  {
    num: "01",
    title: "Multi-Column Layouts & Sidebars",
    problem: "Dual columns cause text extractors to read horizontally from left to right across both columns, merging unrelated jobs and skill sets.",
    solution: "Use a clean, single-column linear layout that reads top-to-bottom sequentially.",
  },
  {
    num: "02",
    title: "Placing Contact Info in Header/Footer Layers",
    problem: "Many legacy ATS parsers (Taleo, older Workday configurations) completely ignore Word and PDF header and footer layers.",
    solution: "Place your full name, city, phone, email, and LinkedIn directly at the top of the body text.",
  },
  {
    num: "03",
    title: "Tables and Text Boxes for Alignment",
    problem: "Invisible tables used to align dates or titles can cause content to be read out of chronological order.",
    solution: "Use standard tab spacing and left/right margin alignment instead of HTML or Word table borders.",
  },
  {
    num: "04",
    title: "Visual Skill Ratings and Progress Bars",
    problem: "Rating your Python skills with 4/5 stars, dots, or progress bars cannot be read by OCR engines and scores as zero.",
    solution: "Spell out skills as text grouped under clear categories: e.g. Languages: Python, Go, TypeScript.",
  },
  {
    num: "05",
    title: "Creative or Non-Standard Section Titles",
    problem: "Headings like 'My Journey', 'Where I've Been', or 'Toolbox' confuse parsers looking for standard taxonomy.",
    solution: "Stick strictly to recognized headings: Work Experience, Education, Technical Skills, Projects.",
  },
  {
    num: "06",
    title: "Non-Standard Graphic Symbols for Bullets",
    problem: "Arrows, checkmark emojis, and custom graphic symbols can convert into bizarre unicode glyphs or question marks.",
    solution: "Use standard circular solid bullets (•) or hyphens that convert cleanly into all ASCII/UTF-8 streams.",
  },
  {
    num: "07",
    title: "Submitting as PNG, JPG, or Flat Scanned PDF",
    problem: "Image-based files contain zero embedded selectable text layers, leaving the parser with an empty candidate profile.",
    solution: "Always submit a selectable text-based PDF or DOCX file generated from clean document software.",
  },
];

export default function AtsFormattingMistakesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-[#111827] font-sans selection:bg-[#087F6E]/15 selection:text-[#087F6E]">
      <Navbar />

      <main className="flex-1">
        {/* Header Hero */}
        <section className="bg-white border-b border-slate-200 pt-12 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-4 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-[#087F6E] text-xs font-bold">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>ATS Compliance Audit</span>
            </div>
            <h1 className="font-heading text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Top 7 ATS Formatting Mistakes to Avoid
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Formatting errors are the #1 reason qualified candidates get silently rejected.
              Review the critical layout traps that break resume parsers and how to fix them.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
          <div className="space-y-4">
            {MISTAKES.map((item) => (
              <div
                key={item.num}
                className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {item.num}
                    </span>
                    <h2 className="font-heading font-extrabold text-lg text-slate-900">
                      {item.title}
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-rose-600">
                      <XCircle className="h-4 w-4 shrink-0" />
                      <span>The Parser Problem</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.problem}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-[#087F6E]">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>The ATS-Safe Solution</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{item.solution}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action CTA */}
          <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 text-center space-y-5">
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold">
              Build an ATS-Safe Resume in Minutes
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              RoleFuse automatically applies all 7 formatting rules. Zero tables, zero header traps, and 100% clean selectable text layers.
            </p>
            <div className="pt-2">
              <Link href="/resume-builder">
                <Button className="h-12 px-8 bg-[#087F6E] hover:bg-[#065F53] text-white font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer">
                  Launch Free Resume Builder
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
