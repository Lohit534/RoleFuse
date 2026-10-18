"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase/client";
import {
  ATS_TEMPLATES_DATA,
  getTemplateById,
  AtsTemplateProfile,
} from "@/lib/ats-templates-data";
import { Button } from "@/components/ui/button";
import {
  Download,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  Eye,
  Layers,
  Copy,
  Printer,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";

function TemplatePreviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialId = searchParams.get("template") || "financial-analyst";

  const [activeTemplateId, setActiveTemplateId] = useState(initialId);
  const [user, setUser] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (initialId) {
      setActiveTemplateId(initialId);
    }
  }, [initialId]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }: any) => {
      if (data?.session?.user) setUser(data.session.user);
    });
    supabase.auth.getUser().then((res: any) => {
      if (res.data?.user) setUser(res.data.user);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const template = getTemplateById(activeTemplateId);
  const { candidate, styleVariant, atsScore, name, tagline } = template;
  const isSerif = template.fontFamily === "serif";

  // Handle switching template
  const handleSelectTemplate = (id: string) => {
    setActiveTemplateId(id);
    window.history.replaceState(null, "", `/ats-resume/preview?template=${id}`);
  };

  // Handle "Use Template" CTA
  const handleUseTemplate = async () => {
    let currentUser = user;
    if (!currentUser) {
      try {
        const { data } = await supabase.auth.getSession();
        currentUser = data?.session?.user ?? null;
      } catch (e) {}
    }
    if (!currentUser) {
      try {
        const { data } = await supabase.auth.getUser();
        currentUser = data?.user ?? null;
      } catch (e) {}
    }

    if (currentUser) {
      router.push(`/dashboard/resumes?template=${template.id}`);
    } else {
      router.push(
        `/auth/login?redirect=${encodeURIComponent(
          `/dashboard/resumes?template=${template.id}`
        )}`
      );
    }
  };

  // Handle "Download Template" PDF export
  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);
      const toastId = toast.loading("Generating ATS-compliant PDF document...");

      const response = await fetch(
        `/api/export/template-pdf?template=${template.id}`
      );
      if (!response.ok) {
        throw new Error("Failed to generate template PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${template.name.replace(/\s+/g, "_")}_ATS_Resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`${template.name} PDF downloaded successfully!`, {
        id: toastId,
      });
    } catch (err: any) {
      toast.error("Could not download template PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-[#111827] font-sans selection:bg-[#087F6E]/15 selection:text-[#087F6E]">
      <Navbar />

      <main className="flex-1 pb-20">
        {/* Sticky Control & Navigation Header */}
        <section className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3.5">
            {/* Left: Back Link & Active Template Title */}
            <div className="flex items-center gap-3">
              <Link
                href="/ats-resume#templates"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#087F6E] transition-colors py-1.5 px-2.5 rounded-md hover:bg-slate-100"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>All Templates</span>
              </Link>
              <div className="h-4 w-[1px] bg-slate-200 hidden sm:block" />
              <div>
                <h1 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <span>{name}</span>
                  <span className="text-[10px] font-bold text-[#087F6E] bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                    {atsScore} Score
                  </span>
                </h1>
                <p className="text-[11px] text-slate-500 hidden sm:block truncate max-w-[400px]">
                  {tagline}
                </p>
              </div>
            </div>

            {/* Right: The Two Primary Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0">
              <Button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                variant="outline"
                className="h-10 px-4 bg-white hover:bg-slate-50 text-slate-800 border-slate-300 font-bold text-xs rounded-md shadow-2xs gap-2 cursor-pointer"
              >
                <Download className="h-4 w-4 text-[#087F6E]" />
                <span>{isDownloading ? "Generating..." : "Download Template"}</span>
              </Button>

              <Button
                type="button"
                onClick={handleUseTemplate}
                className="h-10 px-5 bg-[#087F6E] hover:bg-[#065F53] text-white font-bold text-xs rounded-md shadow-xs gap-1.5 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Use Template</span>
              </Button>
            </div>
          </div>

          {/* Quick Template Switcher Tabs */}
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-2 border-t border-slate-100 overflow-x-auto flex items-center gap-2 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pr-1 shrink-0">
              Switch Template:
            </span>
            {ATS_TEMPLATES_DATA.map((tmpl) => {
              const isSelected = tmpl.id === activeTemplateId;
              return (
                <button
                  key={tmpl.id}
                  onClick={() => handleSelectTemplate(tmpl.id)}
                  className={`px-3 py-1.5 rounded-md font-bold text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  <span>{tmpl.name}</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                      isSelected
                        ? "bg-teal-500/30 text-teal-200"
                        : "bg-white text-slate-600"
                    }`}
                  >
                    {tmpl.atsScore}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Main Document Preview Container */}
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
          {/* Top Verification Stats Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs text-left">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-[#087F6E] shrink-0">
                <FileCheck className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Single-Column</div>
                <div className="text-[10px] text-slate-500">100% Horizontal Safety</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-[#087F6E] shrink-0">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Standard Fonts</div>
                <div className="text-[10px] text-slate-500">OCR &amp; UTF-8 Verified</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-[#087F6E] shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">0 Broken Tables</div>
                <div className="text-[10px] text-slate-500">No Multi-Column Mangling</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-[#087F6E] shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Enterprise Certified</div>
                <div className="text-[10px] text-slate-500">Workday &amp; Taleo Approved</div>
              </div>
            </div>
          </div>

          {/* Full-Size Document Showcase Centerpiece */}
          <div className="flex justify-center">
            <div className="w-full max-w-[840px] bg-slate-100/60 p-4 sm:p-8 rounded-2xl border border-slate-200 shadow-inner flex justify-center">
              {/* The Actual A4 Sheet Preview (Increased Size) */}
              <div
                id="resume-document-sheet"
                className="w-full max-w-[800px] min-h-[1050px] bg-white text-slate-900 shadow-2xl border border-slate-300 p-8 sm:p-14 rounded-xs selection:bg-[#087F6E]/15"
                style={{
                  fontFamily: isSerif
                    ? 'Times-Roman, "Times New Roman", Times, Georgia, serif'
                    : 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}
              >
                {/* 1. Header: Full Name, Role Title & Contact Information */}
                <header
                  className={`space-y-1.5 pb-4 ${
                    styleVariant === "executive" ? "text-center" : "text-left"
                  }`}
                >
                  <h2
                    className={`font-black text-slate-950 tracking-tight leading-tight ${
                      styleVariant === "tech"
                        ? "text-2xl sm:text-3xl uppercase tracking-wider"
                        : styleVariant === "finance"
                        ? "text-2xl sm:text-3xl tracking-wide"
                        : styleVariant === "executive"
                        ? "text-2xl sm:text-3xl tracking-widest uppercase font-serif"
                        : "text-2xl sm:text-3xl font-extrabold"
                    }`}
                  >
                    {candidate.fullName}
                  </h2>

                  <div className="text-xs sm:text-sm font-bold text-[#087F6E]">
                    {candidate.title}
                  </div>

                  <div
                    className={`text-xs text-slate-600 flex flex-wrap gap-x-2.5 gap-y-1 pt-0.5 ${
                      styleVariant === "executive" ? "justify-center" : "justify-start"
                    }`}
                  >
                    <span>{candidate.location}</span>
                    <span>•</span>
                    <span>{candidate.phone}</span>
                    <span>•</span>
                    <span className="font-medium text-slate-800">{candidate.email}</span>
                    <span>•</span>
                    <span>{candidate.linkedin}</span>
                    {candidate.website && (
                      <>
                        <span>•</span>
                        <span className="text-[#087F6E]">{candidate.website}</span>
                      </>
                    )}
                  </div>
                </header>

                {/* Primary Section Divider */}
                <div
                  className={`w-full mb-5 ${
                    styleVariant === "tech"
                      ? "h-[2px] bg-slate-950"
                      : styleVariant === "finance"
                      ? "h-[1.5px] bg-[#087F6E]"
                      : styleVariant === "executive"
                      ? "h-[1.5px] bg-slate-800"
                      : "h-[1px] bg-slate-300"
                  }`}
                />

                {/* 2. Professional Summary Section */}
                <section className="space-y-2 mb-6">
                  <h3
                    className={`text-xs sm:text-sm font-black uppercase text-slate-950 tracking-wider pb-1 border-b ${
                      styleVariant === "tech"
                        ? "border-slate-900"
                        : "border-slate-200"
                    }`}
                  >
                    {styleVariant === "tech"
                      ? "PROFESSIONAL PROFILE"
                      : "PROFESSIONAL SUMMARY"}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed text-justify">
                    {candidate.summary}
                  </p>
                </section>

                {/* 3. Core Competencies / Technical Skills Section */}
                <section className="space-y-2 mb-6">
                  <h3
                    className={`text-xs sm:text-sm font-black uppercase text-slate-950 tracking-wider pb-1 border-b ${
                      styleVariant === "tech"
                        ? "border-slate-900"
                        : "border-slate-200"
                    }`}
                  >
                    {styleVariant === "tech"
                      ? "TECHNICAL EXPERTISE"
                      : "CORE COMPETENCIES"}
                  </h3>
                  <div className="space-y-1.5 text-xs sm:text-[13px] text-slate-700">
                    {candidate.skills.map((skillGroup, idx) => (
                      <div key={idx} className="leading-snug">
                        <span className="font-bold text-slate-900">
                          {skillGroup.label}:{" "}
                        </span>
                        <span>{skillGroup.items}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 4. Professional Work Experience Section */}
                <section className="space-y-4 mb-6">
                  <h3
                    className={`text-xs sm:text-sm font-black uppercase text-slate-950 tracking-wider pb-1 border-b ${
                      styleVariant === "tech"
                        ? "border-slate-900"
                        : "border-slate-200"
                    }`}
                  >
                    PROFESSIONAL EXPERIENCE
                  </h3>

                  {candidate.experience.map((exp, expIdx) => (
                    <div key={expIdx} className="space-y-1.5">
                      {/* Job Header: Role & Dates */}
                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between text-xs sm:text-[13px] gap-1">
                        <span className="font-bold text-slate-950 text-sm sm:text-base">
                          {exp.role}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                          {exp.dates}
                        </span>
                      </div>

                      {/* Company & Location */}
                      <div className="text-xs font-semibold text-[#087F6E]">
                        {exp.company} — {exp.location}
                      </div>

                      {/* Accomplishment Bullet Points */}
                      <ul className="space-y-1.5 pt-1 text-xs sm:text-[12.5px] text-slate-700 pl-4 list-disc leading-relaxed text-justify">
                        {exp.bullets.map((bullet, bIdx) => (
                          <li key={bIdx} className="pl-1">
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </section>

                {/* 5. Education Section */}
                <section className="space-y-2 mb-6">
                  <h3
                    className={`text-xs sm:text-sm font-black uppercase text-slate-950 tracking-wider pb-1 border-b ${
                      styleVariant === "tech"
                        ? "border-slate-900"
                        : "border-slate-200"
                    }`}
                  >
                    EDUCATION
                  </h3>
                  {candidate.education.map((edu, eduIdx) => (
                    <div key={eduIdx} className="space-y-0.5">
                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between text-xs sm:text-[13px]">
                        <span className="font-bold text-slate-950">
                          {edu.degree}
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">
                          {edu.dates}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 flex justify-between">
                        <span>
                          {edu.school} — {edu.location}
                        </span>
                        {edu.honors && (
                          <span className="italic font-medium text-slate-700">
                            {edu.honors}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </section>

                {/* 6. Certifications Section */}
                <section className="space-y-2">
                  <h3
                    className={`text-xs sm:text-sm font-black uppercase text-slate-950 tracking-wider pb-1 border-b ${
                      styleVariant === "tech"
                        ? "border-slate-900"
                        : "border-slate-200"
                    }`}
                  >
                    CERTIFICATIONS &amp; CREDENTIALS
                  </h3>
                  <ul className="space-y-1 text-xs sm:text-[12.5px] text-slate-700 pl-4 list-disc">
                    {candidate.certifications.map((cert, cIdx) => (
                      <li key={cIdx} className="pl-1 font-medium">
                        {cert}
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>
          </div>

          {/* Underneath: Bottom Action Footer */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
            <div className="space-y-1">
              <h3 className="font-heading font-extrabold text-lg text-slate-900">
                Ready to optimize with {name}?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Download this template as a verified PDF or launch it inside our AI resume editor.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                variant="outline"
                className="h-11 px-5 bg-white hover:bg-slate-50 text-slate-800 border-slate-300 font-bold text-xs rounded-md shadow-xs gap-2 cursor-pointer"
              >
                <Download className="h-4 w-4 text-[#087F6E]" />
                <span>{isDownloading ? "Generating..." : "Download Template PDF"}</span>
              </Button>

              <Button
                type="button"
                onClick={handleUseTemplate}
                className="h-11 px-6 bg-[#087F6E] hover:bg-[#065F53] text-white font-bold text-xs rounded-md shadow-xs gap-1.5 cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>Use Template Now</span>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function AtsResumePreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-slate-500 text-sm">
          Loading ATS Resume Preview...
        </div>
      }
    >
      <TemplatePreviewContent />
    </Suspense>
  );
}
