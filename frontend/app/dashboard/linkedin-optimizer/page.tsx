"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Sparkles, 
  Copy, 
  Check, 
  TrendingUp, 
  Search, 
  ArrowRight, 
  Loader2, 
  Zap, 
  FileText, 
  CheckCircle2, 
  Briefcase,
  HelpCircle,
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Target,
  Building2,
  Share2
} from "lucide-react";
import { LinkedInIcon } from "@/components/icons/LinkedInIcon";
import { toast } from "react-hot-toast";
import { LinkedInOptimizerSkeleton } from "@/components/SkeletonShimmer";

interface HeadlineItem {
  style: string;
  headline: string;
  reason: string;
}

interface AboutItem {
  style: string;
  description: string;
  content: string;
}

interface ExperienceUpgrade {
  role: string;
  before: string;
  after: string;
  why: string;
}

interface SkillGaps {
  missingSkills: string[];
  matchedSkills: string[];
}

interface LinkedInPack {
  profileScore: number;
  profileScoreFeedback: string;
  dropoffAnalysis?: string;
  skillGaps?: SkillGaps;
  headlines: HeadlineItem[];
  aboutSummaries: AboutItem[];
  recruiterKeywords: string[];
  experienceUpgrades: ExperienceUpgrade[];
}

export default function LinkedInOptimizerPage() {
  const router = useRouter();
  const [loadingUser, setLoadingUser] = useState(true);

  // Step state (1: Add LinkedIn Profile URL, 2: Add Jobs)
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Step 1: Profile Input
  const [inputMethod, setInputMethod] = useState<"url" | "resume" | "paste">("url");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [savedResumes, setSavedResumes] = useState<any[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [showUrlGuide, setShowUrlGuide] = useState(true);

  // Step 2: Job Targeting
  const [targetRole, setTargetRole] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  // Scan & Output state
  const [generating, setGenerating] = useState(false);
  const [pack, setPack] = useState<LinkedInPack | null>(null);
  const [activeTab, setActiveTab] = useState<"gaps" | "headlines" | "about" | "keywords" | "experience">("gaps");
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/auth/login?redirect=/dashboard/linkedin-optimizer");
          return;
        }

        const res = await fetch("/api/resumes");
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.resumes || []);
          setSavedResumes(list);
          if (list.length > 0) {
            setSelectedResumeId(list[0].id);
            setResumeText(list[0].content || JSON.stringify(list[0].resumeJSON || ""));
            // Only auto-fill real target role if it's not a resume document name (e.g. "Lohith Peyyala's Resume")
            if (list[0].jobTitle) {
              const isDocName = /resume|cv/i.test(list[0].jobTitle) || list[0].jobTitle.includes("'s");
              if (!isDocName) setTargetRole(list[0].jobTitle);
            }
            if (list[0].company && list[0].company.toLowerCase() !== "general application") {
              setTargetCompany(list[0].company);
            }
          }
        }
      } catch (err) {
        console.error("Init linkedin optimizer error:", err);
      } finally {
        setLoadingUser(false);
      }
    }
    init();
  }, [router]);

  const handleSelectResume = (id: string) => {
    setSelectedResumeId(id);
    const found = savedResumes.find(r => r.id === id);
    if (found) {
      setResumeText(found.content || JSON.stringify(found.resumeJSON || ""));
      if (found.jobTitle && !targetRole) {
        const isDocName = /resume|cv/i.test(found.jobTitle) || found.jobTitle.includes("'s");
        if (!isDocName) setTargetRole(found.jobTitle);
      }
      if (found.company && !targetCompany && found.company.toLowerCase() !== "general application") {
        setTargetCompany(found.company);
      }
    }
  };

  const handleScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (inputMethod === "url" && !linkedinUrl.trim()) {
      toast.error("Please enter your LinkedIn profile URL.");
      return;
    }

    if (inputMethod === "paste" && !resumeText.trim()) {
      toast.error("Please paste your profile or resume background text.");
      return;
    }

    if (!jobDescription.trim() && !targetRole.trim()) {
      toast.error("Please provide a target job title or paste a job description.");
      setCurrentStep(2);
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/linkedin/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          linkedinUrl: linkedinUrl.trim() || undefined,
          resumeText: resumeText || (savedResumes[0]?.content ?? "Technical Professional Profile"),
          targetRole: targetRole.trim() || "Target Role",
          industry: targetCompany.trim() || "Corporate / Technology",
          jobDescription: jobDescription.trim() || undefined
        })
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to generate LinkedIn optimization pack");
      }

      setPack(resData.data);
      toast.success("LinkedIn profile analyzed and optimized!");
    } catch (err: any) {
      toast.error(err.message || "Failed to optimize profile.");
    } finally {
      setGenerating(false);
    }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedItem(null), 2000);
  };

  if (loadingUser) {
    return <LinkedInOptimizerSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-[#111827]">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        {/* Jobscan-style Hero Header - Exclusively Teal & Black */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-[#087F6E] text-xs font-bold uppercase tracking-wider">
            <LinkedInIcon className="h-3.5 w-3.5" />
            <span>LinkedIn Optimization</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#111827] leading-tight">
            Get noticed on LinkedIn. <br />
            <span className="text-[#087F6E]">Your LinkedIn profile score is just 2 steps away.</span>
          </h1>

          <p className="text-sm sm:text-base font-bold text-[#111827]">
            Get found on LinkedIn:
          </p>

          {/* 3 Core Value Props matching Jobscan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-1">
            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-start gap-2.5 shadow-2xs">
              <CheckCircle2 className="h-4 w-4 text-[#087F6E] shrink-0 mt-0.5" />
              <p className="text-xs text-slate-700 font-medium leading-snug">
                A profile score that shows exactly where recruiters lose interest
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-start gap-2.5 shadow-2xs">
              <CheckCircle2 className="h-4 w-4 text-[#087F6E] shrink-0 mt-0.5" />
              <p className="text-xs text-slate-700 font-medium leading-snug">
                AI-rewritten headline &amp; summary that actually get you found
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-start gap-2.5 shadow-2xs">
              <CheckCircle2 className="h-4 w-4 text-[#087F6E] shrink-0 mt-0.5" />
              <p className="text-xs text-slate-700 font-medium leading-snug">
                Skill gaps flagged against the job you&apos;re targeting
              </p>
            </div>
          </div>
        </div>

        {/* 2-Step Interactive Wizard Form */}
        <Card className="bg-white border-slate-200 shadow-sm rounded-3xl overflow-hidden">
          {/* Step Selector Header Tabs */}
          <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50/70 select-none">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`p-4 sm:p-5 flex items-center justify-center gap-3 transition-all cursor-pointer border-r border-slate-200 ${
                currentStep === 1
                  ? "bg-white font-extrabold text-[#087F6E] border-b-2 border-b-[#087F6E]"
                  : "text-slate-500 hover:text-[#111827]"
              }`}
            >
              <span className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                currentStep === 1 ? "bg-[#087F6E] text-white" : "bg-slate-200 text-[#111827]"
              }`}>
                1
              </span>
              <div className="text-left">
                <div className="text-xs sm:text-sm font-bold leading-tight">Add LinkedIn Profile URL</div>
                <div className="text-[10px] text-slate-400 font-normal hidden sm:block">URL, PDF or saved resume</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className={`p-4 sm:p-5 flex items-center justify-center gap-3 transition-all cursor-pointer ${
                currentStep === 2
                  ? "bg-white font-extrabold text-[#087F6E] border-b-2 border-b-[#087F6E]"
                  : "text-slate-500 hover:text-[#111827]"
              }`}
            >
              <span className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                currentStep === 2 ? "bg-[#087F6E] text-white" : "bg-slate-200 text-[#111827]"
              }`}>
                2
              </span>
              <div className="text-left">
                <div className="text-xs sm:text-sm font-bold leading-tight">Add Target Jobs</div>
                <div className="text-[10px] text-slate-400 font-normal hidden sm:block">Match skills &amp; keywords</div>
              </div>
            </button>
          </div>

          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* STEP 1: ADD LINKEDIN PROFILE URL */}
            {currentStep === 1 && (
              <div className="space-y-6 max-w-3xl mx-auto">
                {/* Method selector pills */}
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  {[
                    { id: "url", label: "LinkedIn Profile URL" },
                    { id: "resume", label: "Use Saved Resume Background" },
                    { id: "paste", label: "Paste Profile Text" }
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setInputMethod(m.id as any)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                        inputMethod === m.id
                          ? "bg-[#087F6E] text-white border-[#087F6E]"
                          : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {inputMethod === "url" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#111827] block">
                        Add LinkedIn Profile URL
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-3 text-xs font-bold text-slate-400 select-none">
                          https://
                        </span>
                        <Input
                          placeholder="www.linkedin.com/in/your-name"
                          value={linkedinUrl.replace(/^https?:\/\//, "")}
                          onChange={(e) => {
                            const val = e.target.value.trim();
                            setLinkedinUrl(val.startsWith("http") ? val : `https://${val}`);
                          }}
                          className="pl-20 text-xs sm:text-sm bg-slate-50 border-slate-200 focus:border-[#087F6E] rounded-xl h-11"
                        />
                      </div>
                    </div>

                    {/* How to Get Your LinkedIn URL Guide (Jobscan exact instructions) */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 text-xs">
                      <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowUrlGuide(!showUrlGuide)}>
                        <h3 className="font-extrabold text-[#111827] flex items-center gap-2">
                          <HelpCircle className="h-4 w-4 text-[#087F6E]" />
                          How to Get Your LinkedIn URL
                        </h3>
                        {showUrlGuide ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                      </div>

                      {showUrlGuide && (
                        <div className="space-y-3 pt-2 border-t border-slate-200/80 text-slate-700 leading-relaxed">
                          <div className="flex items-start gap-2.5">
                            <span className="h-5 w-5 rounded-full bg-slate-200 text-[#111827] font-bold text-[11px] flex items-center justify-center shrink-0">1</span>
                            <p><span className="font-bold text-[#111827]">Log into LinkedIn.</span></p>
                          </div>

                          <div className="flex items-start gap-2.5">
                            <span className="h-5 w-5 rounded-full bg-slate-200 text-[#111827] font-bold text-[11px] flex items-center justify-center shrink-0">2</span>
                            <p>
                              Click the <span className="font-bold text-[#111827]">Me</span> icon at the top of your LinkedIn homepage.
                            </p>
                          </div>

                          <div className="flex items-start gap-2.5">
                            <span className="h-5 w-5 rounded-full bg-slate-200 text-[#111827] font-bold text-[11px] flex items-center justify-center shrink-0">3</span>
                            <div>
                              <p>Copy the URL from your browser’s address bar.</p>
                              <code className="text-[11px] font-mono text-[#087F6E] bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60 mt-1 inline-block">
                                e.g. https://www.linkedin.com/in/your-name
                              </code>
                            </div>
                          </div>

                          <div className="flex items-start gap-2.5">
                            <span className="h-5 w-5 rounded-full bg-slate-200 text-[#111827] font-bold text-[11px] flex items-center justify-center shrink-0">4</span>
                            <p>Paste the URL into the URL profile field above.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {inputMethod === "resume" && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#111827]">Choose Master Resume Background</label>
                    <select
                      value={selectedResumeId}
                      onChange={(e) => handleSelectResume(e.target.value)}
                      className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#087F6E]/20"
                    >
                      {savedResumes.map((res) => (
                        <option key={res.id} value={res.id}>
                          {res.title || res.jobTitle || "Master Resume"} {res.company ? `(${res.company})` : ""}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500">
                      We will extract your career highlights, skills, and experience to model your LinkedIn profile.
                    </p>
                  </div>
                )}

                {inputMethod === "paste" && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#111827]">Paste Profile Experience Text</label>
                    <Textarea
                      placeholder="Paste your current LinkedIn About, headline, or work history bullets here..."
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      rows={6}
                      className="text-xs bg-slate-50 border-slate-200 focus:border-[#087F6E] rounded-xl"
                    />
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="h-10 px-6 bg-[#087F6E] hover:bg-[#065F53] text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span>Next: Add Target Jobs</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: ADD JOBS */}
            {currentStep === 2 && (
              <div className="space-y-6 max-w-3xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5 text-slate-400" /> Target Job Title
                    </label>
                    <Input
                      placeholder="e.g. Senior Product Manager, Full Stack Engineer"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      className="text-xs bg-slate-50 border-slate-200 focus:border-[#087F6E] rounded-xl h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" /> Target Company / Industry
                    </label>
                    <Input
                      placeholder="e.g. Google, Stripe, SaaS, FinTech"
                      value={targetCompany}
                      onChange={(e) => setTargetCompany(e.target.value)}
                      className="text-xs bg-slate-50 border-slate-200 focus:border-[#087F6E] rounded-xl h-10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#111827]">
                      Paste Target Job Description (Optional but Recommended)
                    </label>
                    <span className="text-[10px] text-slate-400">{jobDescription.length} chars</span>
                  </div>
                  <Textarea
                    placeholder="Paste the requirements from a job posting you want to get found for. We'll identify exact recruiter search keywords and skill gaps."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={6}
                    className="text-xs bg-slate-50 border-slate-200 focus:border-[#087F6E] rounded-xl"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="h-10 text-xs font-bold border-slate-200 text-[#111827] hover:bg-slate-100 rounded-xl"
                  >
                    &larr; Back to Step 1
                  </Button>

                  <Button
                    type="button"
                    disabled={generating}
                    onClick={handleScan}
                    className="h-10 px-6 bg-[#111827] hover:bg-[#000000] text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                        Scanning Profile &amp; Calculating Match...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 text-[#087F6E]" />
                        Scan Profile &amp; Get Score
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* RESULTS WORKSPACE (Jobscan Match Diagnostic) */}
        {pack && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Score & Recruiter Dropoff Diagnostic */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Score Dial */}
              <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  LinkedIn Optimization Score
                </span>
                <div className="text-5xl font-black text-[#087F6E] my-2">
                  {pack.profileScore}<span className="text-xl font-normal text-slate-400">/100</span>
                </div>
                <Badge className={`text-xs font-bold ${
                  pack.profileScore >= 80 ? "bg-[#087F6E] text-white" :
                  pack.profileScore >= 60 ? "bg-[#111827] text-white" :
                  "bg-slate-700 text-white"
                }`}>
                  {pack.profileScore >= 80 ? "Recruiter Ready" : pack.profileScore >= 60 ? "Moderate Visibility" : "Search Dropoff Risk"}
                </Badge>
              </div>

              {/* Where Recruiters Lose Interest Analysis */}
              <div className="md:col-span-8 space-y-2.5">
                <div className="flex items-center gap-2 text-[#087F6E] font-extrabold text-xs uppercase tracking-wider">
                  <ShieldAlert className="h-4 w-4" />
                  <span>Where Recruiters Lose Interest:</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                  {pack.dropoffAnalysis || pack.profileScoreFeedback}
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-600 font-medium">
                  <span className="flex items-center gap-1 text-[#087F6E] font-bold">
                    <TrendingUp className="h-3.5 w-3.5" /> +280% Recruiter InMails
                  </span>
                  <span>&bull;</span>
                  <span>Algorithm-Tested</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2">
              {[
                { id: "gaps", label: `Skill Gaps (${(pack.skillGaps?.missingSkills?.length || 0) + (pack.skillGaps?.matchedSkills?.length || 0)})` },
                { id: "headlines", label: `AI Headlines (${pack.headlines?.length || 0})` },
                { id: "about", label: `AI Summary (${pack.aboutSummaries?.length || 0})` },
                { id: "keywords", label: `Recruiter Keywords (${pack.recruiterKeywords?.length || 0})` },
                { id: "experience", label: `Bullet Power-Ups (${pack.experienceUpgrades?.length || 0})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-[#087F6E] text-white shadow-xs"
                      : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB 1: SKILL GAPS FLAGGED */}
            {activeTab === "gaps" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Missing Skills */}
                <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2 text-[#111827]">
                        <AlertTriangle className="h-4 w-4 text-[#087F6E]" />
                        <h3 className="font-extrabold text-xs uppercase tracking-wider">Missing Target Skills</h3>
                      </div>
                      <Badge className="bg-slate-100 text-[#111827] border-slate-200 text-[10px] font-bold">
                        {pack.skillGaps?.missingSkills?.length || 0} Gaps Flagged
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Recruiters actively filter for these skills. Add them to your Skills &amp; Experience sections:
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(pack.skillGaps?.missingSkills || ["System Architecture", "Cloud Native", "GraphQL", "Leadership"]).map((skill, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-100 text-[#111827] border border-slate-200 text-xs font-bold">
                          + {skill}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Matched Skills */}
                <Card className="bg-white border-teal-200 shadow-sm rounded-2xl overflow-hidden">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-teal-100 pb-2">
                      <div className="flex items-center gap-2 text-[#087F6E]">
                        <CheckCircle2 className="h-4 w-4" />
                        <h3 className="font-extrabold text-xs uppercase tracking-wider">Matched Skills Found</h3>
                      </div>
                      <Badge className="bg-teal-50 text-[#087F6E] border-teal-200 text-[10px] font-bold">
                        {pack.skillGaps?.matchedSkills?.length || 0} Present
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      These keywords are already detected in your background and boosting your search rank:
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(pack.skillGaps?.matchedSkills || ["React", "TypeScript", "Problem Solving"]).map((skill, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-teal-50 text-[#087F6E] border border-teal-200 text-xs font-bold">
                          ✓ {skill}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* TAB 2: AI HEADLINES */}
            {activeTab === "headlines" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pack.headlines.map((hl, i) => {
                  const id = `hl-${i}`;
                  return (
                    <Card key={i} className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden flex flex-col justify-between">
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge className="text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-[#087F6E] border-teal-200">
                            {hl.style}
                          </Badge>
                          <span className="text-[10px] font-mono text-slate-400">
                            {hl.headline.length} / 220 chars
                          </span>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-[#111827] leading-snug">
                          {hl.headline}
                        </div>

                        <p className="text-[11px] text-slate-600 font-medium">
                          &bull; {hl.reason}
                        </p>

                        <div className="pt-2 border-t border-slate-100 flex justify-end">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => copyText(hl.headline, id)}
                            className="h-8 text-xs font-bold border-slate-200 hover:bg-slate-50 text-[#111827]"
                          >
                            {copiedItem === id ? <Check className="h-3.5 w-3.5 text-[#087F6E] mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                            {copiedItem === id ? "Copied" : "Copy Headline"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* TAB 3: AI ABOUT SUMMARIES */}
            {activeTab === "about" && (
              <div className="space-y-4">
                {pack.aboutSummaries.map((abt, i) => {
                  const id = `abt-${i}`;
                  return (
                    <Card key={i} className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                      <CardContent className="p-5 sm:p-6 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <div>
                            <h3 className="font-extrabold text-sm text-[#111827]">{abt.style}</h3>
                            <p className="text-[11px] text-slate-500">{abt.description}</p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => copyText(abt.content, id)}
                            className="h-8 text-xs font-bold border-slate-200 hover:bg-slate-50 text-[#111827]"
                          >
                            {copiedItem === id ? <Check className="h-3.5 w-3.5 text-[#087F6E] mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                            {copiedItem === id ? "Copied" : "Copy Bio"}
                          </Button>
                        </div>

                        <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 text-xs text-[#111827] font-sans leading-relaxed whitespace-pre-wrap">
                          {abt.content}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* TAB 4: RECRUITER KEYWORDS */}
            {activeTab === "keywords" && (
              <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                <CardContent className="p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="space-y-0.5">
                      <h3 className="font-extrabold text-sm text-[#111827]">High-Impact Search Keywords</h3>
                      <p className="text-xs text-slate-500">Recruiters filter for these exact keywords on LinkedIn Recruiter</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => copyText(pack.recruiterKeywords.join(", "), "all-kw")}
                      className="h-8 text-xs font-bold border-slate-200 hover:bg-slate-50 text-[#111827]"
                    >
                      {copiedItem === "all-kw" ? <Check className="h-3.5 w-3.5 text-[#087F6E] mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                      {copiedItem === "all-kw" ? "Copied All" : "Copy All Keywords"}
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {pack.recruiterKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 text-[#087F6E] border border-teal-200 text-xs font-bold shadow-2xs"
                      >
                        <Search className="h-3 w-3 opacity-60" />
                        {kw}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* TAB 5: EXPERIENCE POWER-UPS */}
            {activeTab === "experience" && (
              <div className="space-y-4">
                {pack.experienceUpgrades.map((exp, i) => (
                  <Card key={i} className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                    <CardContent className="p-5 space-y-3">
                      <Badge className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-[#111827] border-none">
                        {exp.role || "Experience Bullet"}
                      </Badge>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
                          <span className="font-bold text-[#111827] block text-[10px] uppercase tracking-wider">Before (Weak / Passive):</span>
                          <p className="text-slate-600 leading-relaxed">{exp.before}</p>
                        </div>

                        <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-xs space-y-1">
                          <span className="font-bold text-[#087F6E] block text-[10px] uppercase tracking-wider">After (Optimized XYZ Formula):</span>
                          <p className="text-[#111827] font-medium leading-relaxed">{exp.after}</p>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-600 font-medium pt-1">
                        <span className="font-bold text-[#111827]">Why this converts:</span> {exp.why}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
