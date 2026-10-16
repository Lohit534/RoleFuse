"use client";

import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  FileCheck,
  CheckCircle2,
  Sparkles,
  FileText,
  ShieldCheck,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ConvertResumeAtsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-[#111827] font-sans selection:bg-[#087F6E]/15 selection:text-[#087F6E]">
      <Navbar />

      <main className="flex-1">
        {/* Header Hero */}
        <section className="bg-white border-b border-slate-200 pt-12 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-4 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-[#087F6E] text-xs font-bold">
              <FileCheck className="h-3.5 w-3.5" />
              <span>Format Conversion Guide</span>
            </div>
            <h1 className="font-heading text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Convert Your Existing Resume to ATS Format
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              How to transform complex graphic designs, dual-column PDFs, and unstructured Word documents
              into clean, 100% parseable ATS-compliant resumes.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <h2 className="font-heading font-extrabold text-xl text-slate-900">
              The 3-Step ATS Conversion Blueprint
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="h-8 w-8 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-xs">
                  01
                </div>
                <h3 className="font-bold text-sm text-slate-900">Strip Complex Tables</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Remove all tables, floating text boxes, and sidebar panels. Convert all content into a linear single-column structure that reads top to bottom.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="h-8 w-8 rounded-lg bg-[#087F6E] text-white flex items-center justify-center font-bold text-xs">
                  02
                </div>
                <h3 className="font-bold text-sm text-slate-900">Standardize Headers</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Replace creative titles with parser standards: Contact Information, Professional Summary, Work Experience, Technical Skills, Education.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="h-8 w-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  03
                </div>
                <h3 className="font-bold text-sm text-slate-900">Export Verified PDF</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Generate a text-based PDF where words can be highlighted and copied. Never submit a flattened image scan.
                </p>
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 text-center space-y-5">
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold">
              Convert Your Resume Instantly With FastHire AI
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              Upload your old resume and let our AI parser restructure your experience into clean, verified ATS templates.
            </p>
            <div className="pt-2">
              <Link href="/resume-builder">
                <Button className="h-12 px-8 bg-[#087F6E] hover:bg-[#065F53] text-white font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer">
                  Convert to ATS Format Free
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
