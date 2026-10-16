"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase/client";
import {
  FileText,
  Search,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  LayoutTemplate,
  AlertTriangle,
  Lock,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const ATS_TEMPLATES = [
  {
    id: "financial-analyst",
    name: "Financial Data Analyst",
    tagline: "Executive quantitative single-column ATS layout",
    atsScore: "99/100",
    image: "/templates/financial-analyst.png",
  },
  {
    id: "kickresume-black",
    name: "Modern Black ATS",
    tagline: "High-contrast clean tech format engineered for ATS parsers",
    atsScore: "98/100",
    image: "/templates/kickresume-black.png",
  },
  {
    id: "classic-ats",
    name: "Classic Corporate ATS",
    tagline: "Traditional single-column format preferred by Fortune 500",
    atsScore: "98/100",
    image: "/templates/classic-ats.webp",
  },
  {
    id: "resumedone-clean",
    name: "Clean Minimalist ATS",
    tagline: "Streamlined modern structure with optimal OCR readability",
    atsScore: "97/100",
    image: "/templates/resumedone-clean.png",
  },
];

const ATS_RULES = [
  {
    title: "1. Strictly Single-Column",
    desc: "Dual columns and sidebars cause parsers to read horizontally across the page, mangling separate jobs into illegible gibberish.",
  },
  {
    title: "2. Standard System Fonts",
    desc: "Use Arial, Calibri, Helvetica, Georgia, or Times New Roman. Fancy custom web fonts can cause broken character encoding in PDF text layers.",
  },
  {
    title: "3. Quantifiable Impact Bullets",
    desc: "State accomplishments using the formula: Action Verb + Project + Quantifiable Metric (%, $, numbers, hours saved).",
  },
  {
    title: "4. Preserve Genuine Dates",
    desc: "Never hallucinate or skip dates. Background verification checks compare your resume strictly against legal employment history.",
  },
  {
    title: "5. Zero Graphic Elements",
    desc: "Avoid star ratings, visual progress bars, photo avatars, and icons. ATS algorithms cannot interpret images and score those skills as zero.",
  },
];

export default function AtsResumePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }: any) => {
      if (data?.session?.user) setUser(data.session.user);
    });
    supabase.auth.getUser().then((res: any) => {
      if (res.data?.user) setUser(res.data.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleStartBuilding = async () => {
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
      router.push("/dashboard/resumes");
    } else {
      router.push("/resume-builder");
    }
  };

  const handleScanResume = async () => {
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
      router.push("/dashboard");
    } else {
      router.push("/ats-checker");
    }
  };

  const handleUseTemplate = async (templateId: string) => {
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
      router.push(`/dashboard/resumes?template=${templateId}`);
    } else {
      router.push(`/auth/login?redirect=${encodeURIComponent(`/dashboard/resumes?template=${templateId}`)}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-[#111827] font-sans selection:bg-[#087F6E]/15 selection:text-[#087F6E]">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-16 md:pt-18 md:pb-22 border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-[#087F6E] text-xs font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>100% Compliant with Workday, Taleo, Greenhouse &amp; Lever</span>
            </div>

            <h1 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
              The Complete <span className="text-[#087F6E]">ATS Resume</span> Guide &amp; Hub
            </h1>

            <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              Over 75% of resumes are discarded before a recruiter ever looks at them. FastHire AI
              helps you build, test, and download resumes guaranteed to pass algorithmic screening.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                type="button"
                onClick={handleScanResume}
                className="h-12 px-7 bg-[#087F6E] hover:bg-[#065F53] text-white font-bold text-sm rounded-xl shadow-md transition-all gap-2 cursor-pointer w-full sm:w-auto"
              >
                <Search className="h-4 w-4" />
                <span>Scan Resume Compatibility</span>
              </Button>
              <Button
                type="button"
                onClick={handleStartBuilding}
                variant="outline"
                className="h-12 px-6 bg-white hover:bg-slate-50 text-slate-800 border-slate-300 font-bold text-sm rounded-xl transition-all cursor-pointer w-full sm:w-auto"
              >
                <FileText className="h-4 w-4 text-[#087F6E]" />
                <span>Build ATS Resume Free</span>
              </Button>
            </div>
          </div>
        </section>

        {/* Section 1: The ATS Scanner & Builder Dual Hub */}
        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              {/* Card 1: Scanner */}
              <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-xs space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="h-12 w-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#087F6E]">
                    <Search className="h-6 w-6" />
                  </div>
                  <h2 className="font-heading font-extrabold text-2xl text-slate-900">
                    ATS Resume Scanner
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Upload your resume and test how enterprise applicant tracking systems read your experience.
                    Get an instant 0–100 score and pinpoint missing keywords.
                  </p>
                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#087F6E]" />
                      <span>Text extraction verification across 4 parser engines</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#087F6E]" />
                      <span>Keyword density and skills gap report</span>
                    </div>
                  </div>
                </div>
                <div className="pt-3">
                  <Button
                    type="button"
                    onClick={handleScanResume}
                    className="w-full h-11 bg-slate-900 hover:bg-[#087F6E] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <span>Test Your Resume Now</span>
                  </Button>
                </div>
              </div>

              {/* Card 2: Builder */}
              <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-xs space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="h-12 w-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#087F6E]">
                    <FileText className="h-6 w-6" />
                  </div>
                  <h2 className="font-heading font-extrabold text-2xl text-slate-900">
                    ATS Resume Builder
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Build a recruiter-ready resume from scratch. Pick an ATS-approved layout,
                    fill in structured modules, and download a pristine PDF with guaranteed OCR clarity.
                  </p>
                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#087F6E]" />
                      <span>Clean single-column structure with zero parser traps</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#087F6E]" />
                      <span>One-click export to high-res ATS PDF &amp; Word formats</span>
                    </div>
                  </div>
                </div>
                <div className="pt-3">
                  <Button
                    type="button"
                    onClick={handleStartBuilding}
                    className="w-full h-11 bg-[#087F6E] hover:bg-[#065F53] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <span>Start Building Free</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Section 2: Resume Templates */}
            <div id="templates" className="pt-8 space-y-6">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#087F6E]">
                  Pre-Approved Templates
                </span>
                <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900">
                  ATS-Friendly Resume Templates
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  All templates are verified against the top commercial recruitment algorithms.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {ATS_TEMPLATES.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs flex flex-col justify-between space-y-3 hover:border-[#087F6E] hover:shadow-md transition-all group"
                  >
                    <div className="space-y-3">
                      {/* Realistic Visual Resume Template Image Preview */}
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 aspect-[3/4] w-full group-hover:border-[#087F6E]/40 transition-colors">
                        <img
                          src={tmpl.image}
                          alt={tmpl.name}
                          className="w-full h-full object-cover object-top hover:scale-[1.02] transition-transform duration-300 select-none"
                        />
                        <div className="absolute top-2.5 right-2.5 z-10">
                          <span className="text-[10px] font-bold text-[#087F6E] bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full border border-teal-200 shadow-xs select-none">
                            {tmpl.atsScore} ATS
                          </span>
                        </div>
                      </div>

                      <div className="space-y-0.5 px-1">
                        <h3 className="font-bold text-sm text-slate-900 group-hover:text-[#087F6E] transition-colors">{tmpl.name}</h3>
                        <p className="text-[11px] text-slate-500 leading-snug">{tmpl.tagline}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <Button
                        onClick={() => handleUseTemplate(tmpl.id)}
                        className="w-full h-10 bg-[#087F6E] hover:bg-[#065F53] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                      >
                        <span>Use This Template</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: The 5 Golden Rules */}
            <div id="rules" className="pt-10 space-y-6">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#087F6E]">
                  Compliance Checklist
                </span>
                <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900">
                  The 5 Golden Rules of ATS Formatting
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {ATS_RULES.map((rule, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2 shadow-2xs"
                  >
                    <h3 className="font-bold text-xs text-slate-900">{rule.title}</h3>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{rule.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-2xl mx-auto space-y-5">
            <h2 className="font-heading text-2xl sm:text-4xl font-extrabold tracking-tight">
              Test Your Resume Before You Apply
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Don't leave your career to chance. Run a free scan or build a clean ATS resume in seconds.
            </p>
            <div className="pt-2">
              <Link href="/ats-checker">
                <Button className="h-12 px-8 bg-[#087F6E] hover:bg-[#065F53] text-white font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer">
                  <span>Run Free Resume ATS Check</span>
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
