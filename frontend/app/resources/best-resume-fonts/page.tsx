"use client";

import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Type,
  CheckCircle2,
  FileText,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const FONTS = [
  {
    name: "Calibri",
    type: "Sans-Serif",
    badge: "Most Popular",
    size: "10–11pt",
    bestFor: "Tech, Operations, General Corporate",
    desc: "The default standard in Microsoft Word. Highly legible on screens and 100% supported by every ATS parser worldwide.",
    sample: "Architected microservices using TypeScript, reducing API response latency by 42%.",
  },
  {
    name: "Arial",
    type: "Sans-Serif",
    badge: "Universal Standard",
    size: "10–11pt",
    bestFor: "Engineering, Product, Marketing",
    desc: "A clean, modern geometric typeface that translates flawlessly across Windows, macOS, Linux, and mobile devices.",
    sample: "Led cross-functional team of 12 engineers across 6 sprint cycles delivering SaaS MVP.",
  },
  {
    name: "Helvetica",
    type: "Sans-Serif",
    badge: "Designer Favorite",
    size: "10–11pt",
    bestFor: "UI/UX, Product Design, Frontend",
    desc: "Renowned for its neutral aesthetics and balanced character kerning. Produces crisp high-density PDF exports.",
    sample: "Engineered responsive web applications supporting 250,000+ daily active users.",
  },
  {
    name: "Georgia",
    type: "Serif",
    badge: "Modern Elegance",
    size: "10–11pt",
    bestFor: "Executive, Legal, Consulting, Academic",
    desc: "Specifically designed for digital screen readability. The larger x-height makes it far easier to read than legacy serifs.",
    sample: "Managed $4.2M departmental budget and formulated enterprise risk mitigation framework.",
  },
  {
    name: "Times New Roman",
    type: "Serif",
    badge: "Classic Corporate",
    size: "10.5–11.5pt",
    bestFor: "Finance, Banking, Government, Law",
    desc: "The traditional publishing and corporate standard. Excellent typographic density for fitting extensive experience into 1 page.",
    sample: "Executed M&A financial valuation models across 8 portfolio asset transactions.",
  },
];

export default function BestResumeFontsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-[#111827] font-sans selection:bg-[#087F6E]/15 selection:text-[#087F6E]">
      <Navbar />

      <main className="flex-1">
        {/* Header Hero */}
        <section className="bg-white border-b border-slate-200 pt-12 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-4 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-[#087F6E] text-xs font-bold">
              <Type className="h-3.5 w-3.5" />
              <span>Typography Guide</span>
            </div>
            <h1 className="font-heading text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              The Best Fonts for an ATS Resume in 2026
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Why custom downloadable fonts break parser character mapping, and which
              system-safe fonts guarantee 100% optical character recognition accuracy.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {FONTS.map((font) => (
              <div
                key={font.name}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-heading font-extrabold text-xl text-slate-900">
                        {font.name}
                      </h2>
                      <span className="text-xs text-slate-400 font-semibold">{font.type}</span>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-teal-50 text-[#087F6E] border border-teal-200">
                      {font.badge}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{font.desc}</p>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="text-[11px] font-bold text-slate-700">Sample Rendering:</div>
                    <p className="text-xs text-slate-800 italic font-normal">{font.sample}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 text-slate-600">
                    <span><strong>Optimal Body Size:</strong> {font.size}</span>
                    <span><strong>Target:</strong> {font.bestFor.split(",")[0]}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sizing Scale Box */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
            <h2 className="font-heading font-extrabold text-xl text-slate-900">
              The ATS Font Sizing Hierarchy
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-xs font-bold text-slate-500">Candidate Name</span>
                <div className="text-2xl font-extrabold text-slate-900">18–22pt</div>
                <p className="text-[11px] text-slate-600">Prominent top hierarchy</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-xs font-bold text-slate-500">Section Headers</span>
                <div className="text-2xl font-extrabold text-[#087F6E]">12–14pt</div>
                <p className="text-[11px] text-slate-600">Uppercase or Bold format</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-xs font-bold text-slate-500">Body Bullet Text</span>
                <div className="text-2xl font-extrabold text-slate-900">10–11pt</div>
                <p className="text-[11px] text-slate-600">High density &amp; clean line height</p>
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 text-center space-y-5">
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold">
              Build With Calibrated Typography
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              RoleFuse automates all typography sizing and line heights for clean, verified ATS exports.
            </p>
            <div className="pt-2">
              <Link href="/resume-builder">
                <Button className="h-12 px-8 bg-[#087F6E] hover:bg-[#065F53] text-white font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer">
                  Launch Resume Builder
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
