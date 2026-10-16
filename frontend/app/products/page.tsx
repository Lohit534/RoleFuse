"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase/client";
import {
  Sparkles,
  Search,
  FileText,
  Briefcase,
  History,
  CheckCircle2,
  ArrowRight,
  Zap,
  Target,
  ShieldCheck,
  Download,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProductsPage() {
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

  const handleNavigate = async (path: string, requiresAuth = false) => {
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
      // Map public fallback paths to authenticated dashboard routes
      if (path === "/ats-optimizer") {
        router.push("/dashboard");
        return;
      }
      if (path === "/resume-builder") {
        router.push("/dashboard/resumes");
        return;
      }
      router.push(path);
      return;
    }

    if (requiresAuth) {
      router.push(`/auth/login?redirect=${encodeURIComponent(path)}`);
    } else {
      router.push(path);
    }
  };

  const PRODUCTS = [
    {
      id: "optimizer",
      name: "AI Resume Optimizer",
      tagline: "Tailor your resume against any target job description in under 30 seconds",
      badge: "Core AI Tool",
      icon: <Sparkles className="h-6 w-6 text-[#087F6E]" />,
      badgeColor: "bg-teal-50 text-[#087F6E] border-teal-200",
      description:
        "Our neural optimization engine analyzes your resume against any job posting. It identifies missing keywords, rewrites bullet points for quantifiable impact, and boosts ATS compatibility scores by an average of 57+ points.",
      highlights: [
        "Semantic JD keyword gap analysis and auto-injection",
        "Bullet point re-engineering with strong action verbs and metrics",
        "Preserves your genuine dates, degrees, and career milestones",
        "Instant one-click ATS score comparison before and after",
      ],
      ctaText: "Launch AI Optimizer",
      ctaPath: user ? "/dashboard" : "/ats-optimizer",
      requiresAuth: false,
      preview: (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5 text-xs select-none">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-slate-500 font-bold uppercase">ATS Score Optimization</span>
            <span className="text-[10px] font-bold text-[#087F6E] bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">+54 Pts Lift</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white border border-slate-200 rounded-xl p-2.5">
              <div className="text-[9px] text-slate-400 uppercase font-bold">Original Match</div>
              <div className="text-xl font-black text-rose-500 font-heading">38%</div>
              <div className="text-[9px] text-rose-500 font-semibold mt-0.5">Missing 14 keywords</div>
            </div>
            <div className="bg-white border border-teal-200 rounded-xl p-2.5">
              <div className="text-[9px] text-[#087F6E] uppercase font-bold">Optimized Match</div>
              <div className="text-xl font-black text-[#087F6E] font-heading">92%</div>
              <div className="text-[9px] text-[#087F6E] font-semibold mt-0.5">Recruiter Ready</div>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-1">
            <div className="text-[9px] font-bold text-slate-700">Injected Target Keywords:</div>
            <div className="flex flex-wrap gap-1">
              <span className="bg-teal-50 text-[#087F6E] border border-teal-200 text-[9px] font-semibold px-1.5 py-0.5 rounded">Distributed Systems</span>
              <span className="bg-teal-50 text-[#087F6E] border border-teal-200 text-[9px] font-semibold px-1.5 py-0.5 rounded">TypeScript</span>
              <span className="bg-teal-50 text-[#087F6E] border border-teal-200 text-[9px] font-semibold px-1.5 py-0.5 rounded">CI/CD Pipeline</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "scanner",
      name: "ATS Resume Checker",
      tagline: "Deep audit of your resume's parseability, keyword match rate, and ranking score",
      badge: "Free Diagnostic",
      icon: <Search className="h-6 w-6 text-[#087F6E]" />,
      badgeColor: "bg-teal-50 text-[#087F6E] border-teal-200",
      description:
        "Test how Workday, Taleo, Greenhouse, and Lever parse your resume file. Receive an instant score breakdown across keyword density, quantifiable metrics, and section readability.",
      highlights: [
        "Full ATS text-layer extraction & formatting audit",
        "Missing technical skills and hard credential identification",
        "Section parseability verification to prevent silent rejections",
        "Actionable improvement checklist ready for human recruiters",
      ],
      ctaText: "Run Free ATS Check",
      ctaPath: "/ats-checker",
      requiresAuth: false,
      preview: (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5 text-xs select-none">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-slate-500 font-bold uppercase">Commercial Parser Diagnostics</span>
            <span className="text-[10px] font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-full">Workday / Taleo</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-semibold text-slate-700">
              <span>Text Layer Parseability</span>
              <span className="text-[#087F6E]">100% Passed</span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#087F6E] w-full" />
            </div>
            <div className="flex justify-between text-[10px] font-semibold text-slate-700">
              <span>Section Header Compliance</span>
              <span className="text-[#087F6E]">96% Match</span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#087F6E] w-[96%]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 text-[10px]">
            <div className="bg-white border border-slate-200 rounded-xl p-2 text-center">
              <span className="text-slate-400 block text-[9px] font-bold uppercase">Parser Errors</span>
              <span className="font-bold text-[#087F6E]">0 Detected</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-2 text-center">
              <span className="text-slate-400 block text-[9px] font-bold uppercase">Formatting Grade</span>
              <span className="font-bold text-[#087F6E]">A+ Verified</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "builder",
      name: "AI Resume Builder",
      tagline: "Craft parser-safe, beautifully structured resumes and export clean PDFs",
      badge: "ATS Certified",
      icon: <FileText className="h-6 w-6 text-[#087F6E]" />,
      badgeColor: "bg-teal-50 text-[#087F6E] border-teal-200",
      description:
        "Build a polished, professional resume section by section with smart AI suggestions. Save multiple tailored resumes for different roles, customize technical skills matrices, and download high-resolution ATS-safe PDFs.",
      highlights: [
        "Single-column ATS standard layout with zero parser-breaking tables",
        "Dedicated experience, education, projects, skills, and certifications modules",
        "Smart bullet point enricher with action verb recommendations",
        "Save and manage multiple named resumes under your account",
      ],
      ctaText: "Build Your Resume",
      ctaPath: user ? "/dashboard/resumes" : "/resume-builder",
      requiresAuth: false,
      preview: (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 text-xs select-none">
          <div className="w-full bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-1.5 font-sans">
            <div className="flex justify-between items-baseline border-b border-slate-200 pb-1.5">
              <div>
                <div className="font-extrabold text-[10px] text-slate-900">JORDAN BLAKE</div>
                <div className="text-[7.5px] text-slate-500">San Francisco, CA • jordan@fastmail.com</div>
              </div>
              <span className="text-[8px] font-bold text-[#087F6E] bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">ATS Safe</span>
            </div>
            <div className="space-y-0.5">
              <div className="text-[8px] font-bold text-slate-900 uppercase tracking-wide">EXPERIENCE</div>
              <div className="text-[8px] font-semibold text-slate-800 flex justify-between">
                <span>Senior Full Stack Engineer</span>
                <span className="text-slate-400 font-normal">2021 – Present</span>
              </div>
              <div className="text-[7.5px] text-slate-600 pl-1 leading-snug">
                • Built high-concurrency microservices reducing latency by 44%.
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "tracker",
      name: "Job Application Tracker",
      tagline: "Organize your job search with a visual Kanban pipeline and interview timeline",
      badge: "Workflow Tool",
      icon: <Briefcase className="h-6 w-6 text-[#087F6E]" />,
      badgeColor: "bg-teal-50 text-[#087F6E] border-teal-200",
      description:
        "Stay organized throughout your job search. Track applications across Applied, Screening, Interview, Offer, and Rejected stages. Record salary ranges, interview dates, and custom notes in one unified workspace.",
      highlights: [
        "Visual 5-stage drag-and-drop Kanban pipeline",
        "Salary, location, and interview deadline tracking",
        "Application success rate metrics and stage counters",
        "Directly linked to your optimized resumes for each application",
      ],
      ctaText: user ? "Open Job Tracker" : "Sign In to Access Tracker",
      ctaPath: "/dashboard/job-tracker",
      requiresAuth: true,
      preview: (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 text-xs select-none">
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 font-bold uppercase">
            <span>Visual Application Pipeline</span>
            <span className="text-[#087F6E]">4 Stages Active</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <div className="bg-white border border-slate-200 rounded-xl p-2 space-y-1">
              <div className="flex justify-between text-[8px] font-bold text-slate-600 uppercase">
                <span>Applied</span>
                <span className="text-slate-400">12</span>
              </div>
              <div className="p-1 rounded bg-slate-50 border border-slate-200/80 text-[7.5px] font-semibold text-slate-800 truncate">
                Google • SWE
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-2 space-y-1">
              <div className="flex justify-between text-[8px] font-bold text-[#087F6E] uppercase">
                <span>Interview</span>
                <span className="text-[#087F6E]">4</span>
              </div>
              <div className="p-1 rounded bg-teal-50 border border-teal-200 text-[7.5px] font-semibold text-[#087F6E] truncate">
                Stripe • Tech Lead
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-2 space-y-1">
              <div className="flex justify-between text-[8px] font-bold text-emerald-700 uppercase">
                <span>Offer</span>
                <span className="text-emerald-700">1</span>
              </div>
              <div className="p-1 rounded bg-emerald-50 border border-emerald-200 text-[7.5px] font-semibold text-emerald-800 truncate">
                Meta • Senior
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "history",
      name: "Optimization History & Downloads",
      tagline: "Review past resume iterations, score lifts, and download ATS PDFs anytime",
      badge: "Cloud Library",
      icon: <History className="h-6 w-6 text-[#087F6E]" />,
      badgeColor: "bg-teal-50 text-[#087F6E] border-teal-200",
      description:
        "Every resume optimization you perform is securely saved. Compare previous ATS score increases, view the exact job descriptions you applied for, and re-download clean PDF and Word documents whenever needed.",
      highlights: [
        "Complete historical log of all resume optimizations and scans",
        "Side-by-side before and after ATS score comparisons",
        "Instant PDF & DOCX re-download with zero data loss",
        "Quick duplication to target new job descriptions",
      ],
      ctaText: user ? "View Saved History" : "Sign In to View History",
      ctaPath: "/dashboard/history",
      requiresAuth: true,
      preview: (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 text-xs select-none">
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 font-bold uppercase">
            <span>Saved Cloud Exports</span>
            <span className="text-[#087F6E]">Cloud Sync</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[9px] font-bold text-slate-900">Software_Engineer_Google.pdf</div>
              <div className="text-[7.5px] text-slate-500">Scored 94% • 2 days ago</div>
            </div>
            <span className="text-[8px] font-bold text-[#087F6E] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              PDF / DOCX
            </span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[9px] font-bold text-slate-900">FullStack_AWS_Tailored.pdf</div>
              <div className="text-[7.5px] text-slate-500">Scored 91% • 1 week ago</div>
            </div>
            <span className="text-[8px] font-bold text-[#087F6E] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              PDF / DOCX
            </span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-[#111827] font-sans selection:bg-[#087F6E]/15 selection:text-[#087F6E]">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-16 md:pt-18 md:pb-22 border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-[#087F6E] text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>The Complete FastHire AI Career Platform</span>
            </div>

            <h1 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
              Every Tool You Need to <br />
              <span className="text-[#087F6E]">Land More Tech &amp; Corporate Interviews</span>
            </h1>

            <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              From scoring your existing resume against real ATS algorithms to tailoring keyword-rich
              bullet points and tracking your applications — explore our full suite of career tools.
            </p>

            {/* Visual Hero Showcase Banner */}
            <div className="pt-6 max-w-4xl mx-auto">
              <div className="relative rounded-3xl overflow-hidden border border-slate-200/90 shadow-xl bg-slate-900">
                <img
                  src="/images/products-showcase.jpg"
                  alt="FastHire AI Product Suite Dashboard"
                  className="w-full h-auto object-cover select-none"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Product Suite Cards Grid */}
        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
              {PRODUCTS.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xs hover:shadow-md hover:border-[#087F6E]/40 transition-all flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#087F6E]">
                        {prod.icon}
                      </div>
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${prod.badgeColor}`}
                      >
                        {prod.badge}
                      </span>
                    </div>

                    {/* Title & Tagline */}
                    <div>
                      <h2 className="font-heading font-extrabold text-xl text-slate-900">
                        {prod.name}
                      </h2>
                      <p className="text-xs font-medium text-[#087F6E] mt-0.5">
                        {prod.tagline}
                      </p>
                    </div>

                    {/* Visual Preview Mockup / Image */}
                    <div className="pt-1">
                      {prod.preview}
                    </div>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {prod.description}
                    </p>

                    {/* Highlights */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      {prod.highlights.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#087F6E] shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action CTA */}
                  <div className="pt-2">
                    <Button
                      onClick={() => handleNavigate(prod.ctaPath, prod.requiresAuth)}
                      className="w-full h-11 bg-slate-900 hover:bg-[#087F6E] text-white font-bold text-xs rounded-xl shadow-xs transition-all gap-2 cursor-pointer"
                    >
                      {prod.requiresAuth && !user && <Lock className="h-3.5 w-3.5" />}
                      <span>{prod.ctaText}</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto space-y-5">
            <h2 className="font-heading text-2xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Upgrade Your Job Application Process?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl mx-auto">
              Get 2 free AI resume optimizations every month with no credit card required. Upgrade anytime for higher optimization limits.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={() => handleNavigate(user ? "/dashboard" : "/auth/signup")}
                className="h-12 px-7 bg-[#087F6E] hover:bg-[#065F53] text-white font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer w-full sm:w-auto"
              >
                <span>{user ? "Go to Dashboard" : "Get Started Free"}</span>
              </Button>
              <Button
                onClick={() => router.push("/ats-checker")}
                variant="outline"
                className="h-12 px-6 bg-transparent hover:bg-white/10 text-white border-slate-700 font-bold text-sm rounded-xl transition-all cursor-pointer w-full sm:w-auto"
              >
                <span>Check Your ATS Score</span>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
