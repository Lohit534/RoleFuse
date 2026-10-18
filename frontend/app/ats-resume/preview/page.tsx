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
  const { candidate, layoutType, atsScore, name, tagline, hasPhoto, photoUrl } = template;
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

          {/* Full-Size Document Showcase Centerpiece (Increased Size) */}
          <div className="flex justify-center">
            <div className="w-full max-w-[860px] bg-slate-100/70 p-4 sm:p-8 rounded-2xl border border-slate-200 shadow-inner flex justify-center">
              {/* ─────────────────────────────────────────────────────────────
                  TEMPLATE 1: Classic Academic / Data Analyst (Image 1 Style)
                  ───────────────────────────────────────────────────────────── */}
              {layoutType === "image1-academic" && (
                <div
                  id="resume-document-sheet"
                  className="w-full max-w-[800px] min-h-[1050px] bg-white text-slate-900 shadow-2xl border border-slate-300 p-8 sm:p-14 rounded-xs selection:bg-[#087F6E]/15 text-[12px] sm:text-[13px] leading-relaxed space-y-4"
                  style={{ fontFamily: 'Times-Roman, "Times New Roman", Times, Georgia, serif' }}
                >
                  {/* Centered LaTeX Style Header */}
                  <header className="text-center space-y-1 pb-2">
                    <h2 className="text-2xl sm:text-3xl font-black tracking-widest text-black uppercase">
                      {candidate.fullName}
                    </h2>
                    <div className="text-xs text-slate-700">
                      {candidate.location} — {candidate.phone} — {candidate.email}
                    </div>
                    <div className="text-xs text-slate-600">
                      LinkedIn — GitHub
                    </div>
                  </header>

                  {/* Professional Summary */}
                  <section className="space-y-1.5">
                    <h3 className="font-bold text-sm sm:text-base text-black">
                      Professional Summary
                    </h3>
                    <p className="text-slate-700 leading-relaxed text-justify">
                      {candidate.summary}
                    </p>
                  </section>

                  {/* Technical Skills with Horizontal Rule */}
                  <section className="space-y-1.5">
                    <h3 className="font-bold text-sm sm:text-base text-black border-b border-black pb-0.5">
                      Technical Skills
                    </h3>
                    <div className="space-y-1 text-slate-800">
                      {candidate.skills.map((skill, idx) => (
                        <div key={idx} className="leading-snug">
                          <span className="font-bold text-black">{skill.label}: </span>
                          <span>{skill.items}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Projects with Horizontal Rule */}
                  <section className="space-y-2.5">
                    <h3 className="font-bold text-sm sm:text-base text-black border-b border-black pb-0.5">
                      Projects
                    </h3>
                    {candidate.projects?.map((proj, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-baseline font-bold text-black text-sm">
                          <span>{proj.title}</span>
                          {proj.tech && (
                            <span className="italic font-normal text-xs text-slate-600">
                              {proj.tech}
                            </span>
                          )}
                        </div>
                        <ul className="list-disc pl-5 space-y-1 text-slate-700">
                          {proj.bullets.map((bullet, bIdx) => (
                            <li key={bIdx} className="pl-1">
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </section>

                  {/* Internship */}
                  <section className="space-y-2">
                    <h3 className="font-bold text-sm sm:text-base text-black border-b border-black pb-0.5">
                      Internship
                    </h3>
                    {candidate.experience.map((exp, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="font-bold text-black text-sm">
                          {exp.role} — <span className="font-semibold text-slate-800">{exp.company}</span>
                        </div>
                        <ul className="list-disc pl-5 space-y-1 text-slate-700">
                          {exp.bullets.map((bullet, bIdx) => (
                            <li key={bIdx} className="pl-1">
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </section>

                  {/* Education */}
                  <section className="space-y-2">
                    <h3 className="font-bold text-sm sm:text-base text-black border-b border-black pb-0.5">
                      Education
                    </h3>
                    {candidate.education.map((edu, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex justify-between font-bold text-black">
                          <span>{edu.degree}</span>
                          <span className="font-semibold text-slate-700">{edu.dates}</span>
                        </div>
                        <div className="flex justify-between text-slate-700">
                          <span>{edu.school}</span>
                          {edu.score && <span className="font-bold text-black">{edu.score}</span>}
                        </div>
                      </div>
                    ))}
                  </section>

                  {/* Certifications */}
                  {candidate.certifications && (
                    <section className="space-y-1.5">
                      <h3 className="font-bold text-sm sm:text-base text-black border-b border-black pb-0.5">
                        Certifications
                      </h3>
                      <ul className="list-disc pl-5 space-y-0.5 text-slate-700">
                        {candidate.certifications.map((cert, idx) => (
                          <li key={idx} className="pl-1">
                            {cert}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {/* Languages */}
                  {candidate.languages && (
                    <section className="space-y-1">
                      <h3 className="font-bold text-sm sm:text-base text-black border-b border-black pb-0.5">
                        Languages
                      </h3>
                      <div className="text-slate-700">
                        {candidate.languages.join(", ")}
                      </div>
                    </section>
                  )}
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  TEMPLATE 2: Modern Java Backend Developer (Image 2 Style)
                  ───────────────────────────────────────────────────────────── */}
              {layoutType === "image2-backend" && (
                <div
                  id="resume-document-sheet"
                  className="w-full max-w-[800px] min-h-[1050px] bg-white text-slate-900 shadow-2xl border border-slate-300 p-8 sm:p-14 rounded-xs selection:bg-[#087F6E]/15 text-[12px] sm:text-[13px] leading-relaxed space-y-4"
                  style={{ fontFamily: 'Times-Roman, "Times New Roman", Times, Georgia, serif' }}
                >
                  {/* Header */}
                  <header className="text-center space-y-1 pb-2">
                    <h2 className="text-2xl sm:text-4xl font-normal tracking-widest text-slate-900 uppercase">
                      {candidate.fullName}
                    </h2>
                    <div className="text-sm font-bold text-slate-800">
                      {candidate.title}
                    </div>
                    <div className="text-xs text-slate-600 flex flex-wrap justify-center items-center gap-x-2 gap-y-1 pt-1">
                      <span>📞 {candidate.phone}</span>
                      <span>✉ {candidate.email}</span>
                      <span>💼 {candidate.linkedin}</span>
                      <span>💻 {candidate.github}</span>
                      {candidate.portfolio && <span>🌐 {candidate.portfolio}</span>}
                    </div>
                  </header>

                  {/* Summary */}
                  <section className="space-y-1">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900">
                      Summary
                    </h3>
                    <p className="text-slate-700 leading-relaxed text-justify">
                      {candidate.summary}
                    </p>
                  </section>

                  {/* Skills with Horizontal Rule */}
                  <section className="space-y-1.5">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 border-b border-slate-700 pb-0.5">
                      Skills
                    </h3>
                    <div className="space-y-1 text-slate-800">
                      {candidate.skills.map((skill, idx) => (
                        <div key={idx} className="leading-snug">
                          <span className="font-bold text-slate-900">{skill.label}: </span>
                          <span>{skill.items}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Experience with Horizontal Rule */}
                  <section className="space-y-3">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 border-b border-slate-700 pb-0.5">
                      Experience
                    </h3>
                    {candidate.experience.map((exp, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-baseline font-bold text-slate-950 text-sm">
                          <span>{exp.role}</span>
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">{exp.dates}</span>
                        </div>
                        <div className="flex justify-between text-slate-700 italic text-xs sm:text-sm">
                          <span>{exp.company}</span>
                          <span>{exp.tech}</span>
                        </div>
                        <ul className="list-disc pl-5 space-y-1 text-slate-700 pt-0.5">
                          {exp.bullets.map((bullet, bIdx) => (
                            <li key={bIdx} className="pl-1">
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </section>

                  {/* Projects with Horizontal Rule */}
                  <section className="space-y-3">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 border-b border-slate-700 pb-0.5">
                      Projects
                    </h3>
                    {candidate.projects?.map((proj, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-baseline font-bold text-slate-950 text-sm">
                          <span>
                            {proj.title}
                            {proj.tech && <span className="font-normal text-slate-700"> — {proj.tech}</span>}
                          </span>
                          {proj.year && <span className="font-bold text-slate-900 text-xs sm:text-sm">{proj.year}</span>}
                        </div>
                        <ul className="list-disc pl-5 space-y-1 text-slate-700 pt-0.5">
                          {proj.bullets.map((bullet, bIdx) => (
                            <li key={bIdx} className="pl-1">
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </section>

                  {/* Awards & Certifications */}
                  {candidate.certifications && (
                    <section className="space-y-1.5">
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 border-b border-slate-700 pb-0.5">
                        Awards &amp; Certifications
                      </h3>
                      <ul className="list-disc pl-5 space-y-1 text-slate-700">
                        {candidate.certifications.map((cert, idx) => (
                          <li key={idx} className="pl-1">
                            {cert}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {/* Education */}
                  <section className="space-y-1">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 border-b border-slate-700 pb-0.5">
                      Education
                    </h3>
                    {candidate.education.map((edu, idx) => (
                      <div key={idx} className="flex justify-between font-bold text-slate-900">
                        <span>{edu.degree} — {edu.school}</span>
                        <span>{edu.dates}</span>
                      </div>
                    ))}
                  </section>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  TEMPLATE 3: High-Contrast Tech ATS (Image 3 Style)
                  ───────────────────────────────────────────────────────────── */}
              {layoutType === "image3-boldtech" && (
                <div
                  id="resume-document-sheet"
                  className="w-full max-w-[800px] min-h-[1050px] bg-white text-slate-900 shadow-2xl border-2 border-slate-950 p-8 sm:p-14 rounded-xs selection:bg-[#087F6E]/15 text-[12px] sm:text-[13px] leading-relaxed space-y-4"
                  style={{ fontFamily: 'Times-Roman, "Times New Roman", Times, Georgia, serif' }}
                >
                  {/* Header */}
                  <header className="text-center space-y-1 pb-2 border-b-2 border-black">
                    <h2 className="text-2xl sm:text-4xl font-black tracking-widest text-black uppercase">
                      {candidate.fullName}
                    </h2>
                    <div className="text-xs text-slate-800">
                      {candidate.location} — {candidate.phone} — {candidate.email}
                    </div>
                    <div className="text-xs text-slate-600">
                      LinkedIn — GitHub
                    </div>
                  </header>

                  {/* Career Objective */}
                  <section className="space-y-1">
                    <h3 className="font-black text-sm sm:text-base text-black uppercase">
                      Career Objective:
                    </h3>
                    <p className="text-slate-800 leading-relaxed text-justify">
                      {candidate.summary}
                    </p>
                  </section>

                  {/* Technical Skills with Thick Rule */}
                  <section className="space-y-1.5">
                    <h3 className="font-black text-sm sm:text-base text-black uppercase border-b-2 border-black pb-0.5">
                      Technical Skills
                    </h3>
                    <div className="space-y-1 text-slate-900">
                      {candidate.skills.map((skill, idx) => (
                        <div key={idx} className="leading-snug">
                          <span className="font-bold text-black">{skill.label}: </span>
                          <span>{skill.items}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Projects with Thick Rule */}
                  <section className="space-y-2.5">
                    <h3 className="font-black text-sm sm:text-base text-black uppercase border-b-2 border-black pb-0.5">
                      Projects
                    </h3>
                    {candidate.projects?.map((proj, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-baseline font-bold text-black text-sm">
                          <span>{proj.title}</span>
                          {proj.tech && (
                            <span className="italic font-normal text-xs text-slate-700">
                              {proj.tech}
                            </span>
                          )}
                        </div>
                        <ul className="list-disc pl-5 space-y-1 text-slate-800">
                          {proj.bullets.map((bullet, bIdx) => (
                            <li key={bIdx} className="pl-1">
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </section>

                  {/* Internship */}
                  <section className="space-y-2">
                    <h3 className="font-black text-sm sm:text-base text-black uppercase border-b-2 border-black pb-0.5">
                      Internship
                    </h3>
                    {candidate.experience.map((exp, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="font-bold text-black text-sm">
                          {exp.role} — <span className="font-semibold text-slate-800">{exp.company}</span>
                        </div>
                        <ul className="list-disc pl-5 space-y-1 text-slate-800">
                          {exp.bullets.map((bullet, bIdx) => (
                            <li key={bIdx} className="pl-1">
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </section>

                  {/* Education */}
                  <section className="space-y-1.5">
                    <h3 className="font-black text-sm sm:text-base text-black uppercase border-b-2 border-black pb-0.5">
                      Education
                    </h3>
                    {candidate.education.map((edu, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex justify-between font-bold text-black">
                          <span>{edu.degree}</span>
                          <span className="font-semibold">{edu.dates}</span>
                        </div>
                        <div className="flex justify-between text-slate-700">
                          <span>{edu.school}</span>
                          {edu.score && <span className="font-bold text-black">{edu.score}</span>}
                        </div>
                      </div>
                    ))}
                  </section>

                  {/* Certifications */}
                  {candidate.certifications && (
                    <section className="space-y-1">
                      <h3 className="font-black text-sm sm:text-base text-black uppercase border-b-2 border-black pb-0.5">
                        Certifications
                      </h3>
                      <ul className="list-disc pl-5 space-y-0.5 text-slate-800">
                        {candidate.certifications.map((cert, idx) => (
                          <li key={idx} className="pl-1">
                            {cert}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {/* Achievements */}
                  {candidate.achievements && (
                    <section className="space-y-1">
                      <h3 className="font-black text-sm sm:text-base text-black uppercase border-b-2 border-black pb-0.5">
                        Achievements
                      </h3>
                      <ul className="list-disc pl-5 space-y-0.5 text-slate-800">
                        {candidate.achievements.map((ach, idx) => (
                          <li key={idx} className="pl-1">
                            {ach}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {/* Languages */}
                  {candidate.languages && (
                    <section className="space-y-1">
                      <h3 className="font-black text-sm sm:text-base text-black uppercase border-b-2 border-black pb-0.5">
                        Languages
                      </h3>
                      <div className="text-slate-800">
                        {candidate.languages.join(", ")}
                      </div>
                    </section>
                  )}
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  TEMPLATE 4: Modern Executive with Photo Avatar (Photo Header)
                  ───────────────────────────────────────────────────────────── */}
              {layoutType === "image4-photo" && (
                <div
                  id="resume-document-sheet"
                  className="w-full max-w-[800px] min-h-[1050px] bg-white text-slate-900 shadow-2xl border border-slate-300 p-8 sm:p-14 rounded-xs selection:bg-[#087F6E]/15 text-[12px] sm:text-[13px] leading-relaxed space-y-5"
                  style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                >
                  {/* Photo Header */}
                  <header className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-5 border-b-2 border-teal-500">
                    <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-2xl overflow-hidden border-2 border-[#087F6E] shadow-md shrink-0 bg-slate-100">
                      <img
                        src={photoUrl || "/avatars/user-1.jpg"}
                        alt={candidate.fullName}
                        className="w-full h-full object-cover select-none"
                      />
                    </div>
                    <div className="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
                      <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                        {candidate.fullName}
                      </h2>
                      <div className="text-sm sm:text-base font-bold text-[#087F6E]">
                        {candidate.title}
                      </div>
                      <div className="text-xs text-slate-600 flex flex-wrap justify-center sm:justify-start gap-x-3 gap-y-1 pt-1">
                        <span>📍 {candidate.location}</span>
                        <span>📞 {candidate.phone}</span>
                        <span>✉ {candidate.email}</span>
                        <span>💼 {candidate.linkedin}</span>
                        {candidate.portfolio && <span>🌐 {candidate.portfolio}</span>}
                      </div>
                    </div>
                  </header>

                  {/* Executive Profile */}
                  <section className="space-y-1.5">
                    <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#087F6E]" />
                      Executive Profile
                    </h3>
                    <p className="text-slate-700 leading-relaxed text-justify">
                      {candidate.summary}
                    </p>
                  </section>

                  {/* Core Competencies */}
                  <section className="space-y-2">
                    <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#087F6E]" />
                      Core Competencies
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {candidate.skills.map((skill, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="font-bold text-slate-900 block mb-0.5">{skill.label}</span>
                          <span className="text-slate-600 text-[11.5px]">{skill.items}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Professional Experience */}
                  <section className="space-y-3.5">
                    <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#087F6E]" />
                      Professional Experience
                    </h3>
                    {candidate.experience.map((exp, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between text-xs sm:text-sm gap-1">
                          <span className="font-bold text-slate-950 text-sm sm:text-base">
                            {exp.role}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                            {exp.dates}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-[#087F6E]">
                          {exp.company} — {exp.location}
                        </div>
                        <ul className="list-disc pl-5 space-y-1 text-slate-700 pt-0.5">
                          {exp.bullets.map((bullet, bIdx) => (
                            <li key={bIdx} className="pl-1">
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </section>

                  {/* Education */}
                  <section className="space-y-2">
                    <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#087F6E]" />
                      Education
                    </h3>
                    {candidate.education.map((edu, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex justify-between font-bold text-slate-900 text-xs sm:text-sm">
                          <span>{edu.degree}</span>
                          <span className="font-semibold text-slate-500">{edu.dates}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 text-xs">
                          <span>{edu.school}</span>
                          {edu.score && <span className="font-semibold text-slate-800">{edu.score}</span>}
                        </div>
                      </div>
                    ))}
                  </section>

                  {/* Certifications */}
                  {candidate.certifications && (
                    <section className="space-y-1.5">
                      <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-900 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#087F6E]" />
                        Certifications &amp; Credentials
                      </h3>
                      <ul className="list-disc pl-5 space-y-1 text-slate-700 text-xs">
                        {candidate.certifications.map((cert, idx) => (
                          <li key={idx} className="pl-1">
                            {cert}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>
              )}
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
