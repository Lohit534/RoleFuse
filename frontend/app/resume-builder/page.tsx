"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase/client";
import {
  FileText,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Target,
  Zap,
  Briefcase,
  Layers,
  ChevronRight,
  ShieldCheck,
  Star,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const ROLE_EXAMPLES = [
  {
    role: "Full Stack Engineer",
    targetKeywords: ["React.js", "Node.js", "TypeScript", "PostgreSQL", "Docker", "AWS", "CI/CD", "RESTful APIs"],
    sampleJob: "Senior Full Stack Developer at High-Growth Fintech",
    beforeBullet: "Built features for company web application and fixed bugs.",
    afterBullet: "Architected 12+ scalable microservices using Node.js & TypeScript, cutting API latency by 42% for 250K+ daily active users on AWS.",
    keywordsAdded: ["TypeScript", "Microservices", "API Latency", "AWS"],
    matchIncrease: "+54%",
  },
  {
    role: "Product Manager",
    targetKeywords: ["Agile/Scrum", "Product Roadmap", "User Research", "A/B Testing", "KPI Tracking", "SQL", "PRDs"],
    sampleJob: "Lead Product Manager at Enterprise SaaS",
    beforeBullet: "Managed product roadmap and worked with engineering team.",
    afterBullet: "Led cross-functional team of 14 across 8 sprint cycles, executing 24+ A/B tests that boosted user activation by 31% and retention by 18%.",
    keywordsAdded: ["A/B Testing", "Sprint Cycles", "Retention", "User Activation"],
    matchIncrease: "+61%",
  },
  {
    role: "Data Analyst / Scientist",
    targetKeywords: ["Python", "SQL", "Tableau", "PowerBI", "Machine Learning", "Statistical Modeling", "ETL Pipelines"],
    sampleJob: "Data Analytics Specialist at Global Logistics",
    beforeBullet: "Created reports in Excel and analyzed customer data.",
    afterBullet: "Engineered automated ETL pipelines in Python & SQL processing 2M+ daily records, delivering executive Tableau dashboards saving 15 hrs/wk.",
    keywordsAdded: ["ETL Pipelines", "Python", "SQL", "Tableau"],
    matchIncrease: "+58%",
  },
];

export default function ResumeBuilderPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);
  const activeRole = ROLE_EXAMPLES[selectedRoleIndex];

  useEffect(() => {
    supabase.auth.getSession().then(({ data }: any) => {
      if (data?.session?.user) {
        setUser(data.session.user);
        router.replace("/dashboard/resumes");
      }
    });
    supabase.auth.getUser().then(({ data }: any) => {
      if (data?.user) {
        setUser(data.user);
        router.replace("/dashboard/resumes");
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (session?.user) {
        setUser(session.user);
        router.replace("/dashboard/resumes");
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#111827] font-sans selection:bg-[#087F6E]/15 selection:text-[#087F6E]">
      <Navbar />

      <main className="flex-1">
        {/* ── Hero Section ── */}
        <section className="relative px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-16 sm:pb-24 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-[#087F6E] text-xs font-bold tracking-wide">
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI-Powered Resume Builder</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Build a High-Scoring Resume Tailored to <span className="text-[#087F6E]">Specific Jobs</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Learn how to structure your resume from scratch, target ATS algorithms, and inject job-specific keywords that recruiters and applicant tracking systems search for.
            </p>

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link href={user ? "/dashboard/resumes" : "/auth/login?redirect=/dashboard/resumes"}>
                <Button className="h-12 px-7 bg-[#087F6E] hover:bg-[#075E53] text-white font-bold text-sm rounded-xl shadow-md transition-all gap-2 cursor-pointer w-full sm:w-auto">
                  {!user && <Lock className="h-4 w-4" />}
                  <span>{user ? "Open Resume Builder" : "Sign In to Access Resume Builder"}</span>
                </Button>
              </Link>
              <Link href="/ats-checker">
                <Button variant="outline" className="h-12 px-6 border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-sm rounded-xl w-full sm:w-auto">
                  Explore ATS Checker
                </Button>
              </Link>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Free to use &bull; Sign in to create &amp; save your manual resume cards
            </p>

            {/* Visual Resume Builder Workspace Preview */}
            <div className="pt-6 max-w-[360px] mx-auto">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-md bg-white">
                <img
                  src="/images/resume-builder-workspace.jpg"
                  alt="Live ATS Resume Builder Workspace"
                  className="w-full max-h-[250px] object-cover select-none"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Interactive Role Test: How to Build Resumes for Specific Jobs ── */}
        <section className="px-4 sm:px-6 lg:px-8 py-12 bg-slate-50/70 border-y border-slate-200/80">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                How Keywords Change for Specific Jobs
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Select a target role below to see how our Resume Builder injects exact industry keywords and quantifiable impact.
              </p>
            </div>

            {/* Role selector tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {ROLE_EXAMPLES.map((item, idx) => (
                <button
                  key={item.role}
                  onClick={() => setSelectedRoleIndex(idx)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    selectedRoleIndex === idx
                      ? "bg-[#087F6E] text-white shadow-sm"
                      : "bg-white text-slate-700 border border-slate-200 hover:border-[#087F6E]/40"
                  }`}
                >
                  {item.role}
                </button>
              ))}
            </div>

            {/* Live Interactive Comparison Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Role Application</span>
                  <h3 className="text-lg font-bold text-slate-900">{activeRole.sampleJob}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Score Improvement:</span>
                  <span className="text-sm font-black text-[#087F6E] bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                    {activeRole.matchIncrease} Match
                  </span>
                </div>
              </div>

              {/* Target Keywords Grid */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700">Crucial Keywords for This Role:</span>
                <div className="flex flex-wrap gap-2">
                  {activeRole.targetKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="px-2.5 py-1 rounded-md bg-teal-50/80 border border-teal-200/80 text-[11px] font-semibold text-[#087F6E]"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Before vs After Bullet Example */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-rose-50/40 border border-rose-200/60 space-y-2">
                  <div className="flex items-center gap-1.5 text-rose-700 text-xs font-bold">
                    <span>✕ Basic Resume Bullet (Low ATS Score)</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-mono">
                    "{activeRole.beforeBullet}"
                  </p>
                  <p className="text-[11px] text-rose-600 font-medium pt-1">
                    Missing metrics, missing action verbs, no target keywords.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-teal-50/40 border border-teal-200/80 space-y-2">
                  <div className="flex items-center gap-1.5 text-[#087F6E] text-xs font-bold">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>✓ Built with Target Keywords &amp; Metrics</span>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed font-mono">
                    "{activeRole.afterBullet}"
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] font-bold text-slate-500">Added Keywords:</span>
                    {activeRole.keywordsAdded.map((k) => (
                      <span key={k} className="text-[10px] font-bold text-[#087F6E] bg-white px-2 py-0.5 rounded border border-teal-200">
                        +{k}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4-Step Guide: How to Build Your Resume ── */}
        <section className="px-4 sm:px-6 lg:px-8 py-16 max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              The 4 Essential Rules of High-Scoring Resumes
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Follow these best practices to ensure your resume sails through ATS scanners and impresses hiring managers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
              <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#087F6E] font-bold text-sm">
                01
              </div>
              <h3 className="font-bold text-sm text-slate-900">Adaptive Summary</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Include a summary if you have 2+ years experience. For entry-level and freshers, keep it focused on core skills and projects without fluff.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
              <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#087F6E] font-bold text-sm">
                02
              </div>
              <h3 className="font-bold text-sm text-slate-900">Single Skills Header</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Consolidate technical skills into one clean, well-categorized TECHNICAL SKILLS section. Zero duplicate headers or redundant lines.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
              <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#087F6E] font-bold text-sm">
                03
              </div>
              <h3 className="font-bold text-sm text-slate-900">Quantifiable Metrics</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                State results using numbers (%, $, hours saved). Recruiters look for measurable impact, not just daily duty lists.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
              <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#087F6E] font-bold text-sm">
                04
              </div>
              <h3 className="font-bold text-sm text-slate-900">Preserve Real Dates</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Never invent dates or periods. Keep project years and certification dates accurate to build trust with background verification checks.
              </p>
            </div>
          </div>
        </section>

        {/* ── Call to Action (Redirects to Login) ── */}
        <section className="px-4 sm:px-6 lg:px-8 py-16 bg-slate-900 text-white text-center">
          <div className="max-w-2xl mx-auto space-y-5">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Build Your Tailored Resume?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Sign in to use the full Resume Builder tool. Save multiple custom resumes named after you, export clean ATS-ready PDFs, and apply with confidence.
            </p>
            <div className="pt-2">
              <Link href={user ? "/dashboard/resumes" : "/auth/login?redirect=/dashboard/resumes"}>
                <Button className="h-12 px-8 bg-[#087F6E] hover:bg-[#075E53] text-white font-bold text-sm rounded-xl shadow-lg transition-all gap-2 cursor-pointer">
                  {!user && <Lock className="h-4 w-4" />}
                  <span>{user ? "Open Resume Builder" : "Sign In to Access Resume Builder"}</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            <p className="text-[11px] text-slate-400">
              Don't have an account yet? <Link href="/auth/signup" className="text-teal-400 font-bold hover:underline">Sign up free</Link>
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
