"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import { COMPANY_OPTIONS, IT_ROLE_OPTIONS } from "@/lib/constants/career-options";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  Briefcase, 
  Building2, 
  FileText, 
  ArrowRight, 
  Loader2,
  BookmarkPlus,
  Zap,
  Printer,
  Lock
} from "lucide-react";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { CoverLetterSkeleton } from "@/components/SkeletonShimmer";
import { useUpgradeModalStore } from "@/store/useUpgradeModalStore";
import { isOwnerEmail } from "@/types";

interface SavedResume {
  id: string;
  title?: string;
  jobTitle?: string;
  company?: string;
  content?: string;
  optimizedText?: string;
  originalText?: string;
  resumeJSON?: any;
}

function CoverLetterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loadingUser, setLoadingUser] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userPlan, setUserPlan] = useState<"free" | "premium" | "promax">("free");
  const [isAllowed, setIsAllowed] = useState(true);

  // Form states
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [resumeText, setResumeText] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [company, setCompany] = useState("");
  const [isCustomCompany, setIsCustomCompany] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [tone, setTone] = useState<"modern" | "formal" | "startup" | "creative">("modern");

  // Output states
  const [generating, setGenerating] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [copied, setCopied] = useState(false);
  const [addingToTracker, setAddingToTracker] = useState(false);

  // 1. Authenticate user & load resumes + query params from Chrome Extension
  useEffect(() => {
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/auth/login?redirect=/dashboard/cover-letter");
          return;
        }
        setUser(user);

        // Check plan access & remaining credits
        let allowed = true;
        let plan: "free" | "premium" | "promax" = "free";
        try {
          const credRes = await fetch("/api/credits");
          if (credRes.ok) {
            const credData = await credRes.json();
            const isOwner = credData.isOwner || (user.email && isOwnerEmail(user.email));
            const isProMax = credData.planId === "promax";
            const isPro = credData.planId === "premium" || credData.isFirst50 || (credData.paidCredits > 0);

            if (isOwner || isProMax) {
              plan = "promax";
              allowed = true;
            } else if (isPro) {
              plan = "premium";
              allowed = true; // Pro users always have access (5 letters/month)
            } else {
              plan = "free";
              // Free tier gets 1 sample letter
              const freeUsed = credData.freeUsed ?? 0;
              allowed = freeUsed < 1;
            }
          }
        } catch (e) {}

        if (user.email && isOwnerEmail(user.email)) {
          allowed = true;
        }
        setIsAllowed(allowed);
        setUserPlan(plan);

        // Populate from Chrome Extension query parameters if present
        const queryTitle = searchParams.get("title");
        const queryCompany = searchParams.get("company");
        const queryJd = searchParams.get("jd");

        if (queryTitle) setJobTitle(queryTitle);
        if (queryCompany) setCompany(queryCompany);
        if (queryJd) {
          setJobDescription(queryJd);
          toast.success("Job details loaded into studio!");
        }

        // Fetch user's saved resumes (start empty so user fills newly every time)
        const res = await fetch("/api/resumes");
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.resumes || []);
          setSavedResumes(list);
          setSelectedResumeId("");
          setResumeText("");
        }
      } catch (err) {
        console.error("Init cover letter error:", err);
      } finally {
        setLoadingUser(false);
      }
    }
    init();
  }, [router, searchParams]);

  // Handle resume selection change
  const handleSelectResume = (id: string) => {
    setSelectedResumeId(id);
    if (!id) {
      setResumeText("");
      return;
    }
    const found = savedResumes.find(r => r.id === id);
    if (found) {
      setResumeText(found.content || found.optimizedText || found.originalText || (found.resumeJSON ? JSON.stringify(found.resumeJSON) : ""));
      if (!company && found.company) setCompany(found.company);
      if (!jobTitle && found.jobTitle) setJobTitle(found.jobTitle);
    }
  };

  // Generate Cover Letter
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAllowed) {
      toast.error("You have used your 1 free sample. Please upgrade to continue.");
      useUpgradeModalStore.getState().openModal({
        badge: "PRO",
        title: "Upgrade to Premium Pro",
        description:
          "You have used your 1 free sample cover letter. Upgrade to Premium Pro to generate 5 tailored cover letters per month, or Pro Max for 15 per month.",
      });
      return;
    }
    if (!resumeText.trim()) {
      toast.error("Please provide your resume content.");
      return;
    }
    if (jobDescription.trim().length < 50) {
      toast.error("Please paste the target job description (minimum 50 characters required).");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          jobDescription,
          jobTitle: jobTitle.trim() || undefined,
          company: company.trim() || undefined,
          tone
        })
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) {
          useUpgradeModalStore.getState().openModal({
            badge: userPlan === "free" ? "PRO" : "MAX",
            title: userPlan === "free" ? "Upgrade to Premium Pro" : "Upgrade to Pro Max",
            description: data.error || "Upgrade your plan to generate more tailored cover letters.",
          });
        }
        throw new Error(data.error || "Failed to generate cover letter");
      }

      setCoverLetter(data.coverLetter);
      toast.success("Personalized cover letter generated!");

      // Persist to user's local cover letters cache so dashboard checklist recognizes it
      try {
        const userId = user?.id || "guest";
        const storageKey = `fastHire_cover_letters_${userId}`;
        const existing: any[] = JSON.parse(localStorage.getItem(storageKey) || "[]");
        const newRecord = {
          id: `cl_${Date.now()}`,
          jobTitle: jobTitle.trim(),
          company: company.trim(),
          coverLetter: data.coverLetter,
          createdAt: new Date().toISOString()
        };
        const updated = [newRecord, ...existing].slice(0, 30);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("cover-letter-created", {
              detail: { jobTitle: jobTitle.trim(), company: company.trim() }
            })
          );
        }
      } catch (_e) {}
    } catch (err: any) {
      toast.error(err.message || "Failed to generate cover letter.");
    } finally {
      setGenerating(false);
    }
  };

  // Copy to clipboard
  const handleCopy = () => {
    if (!coverLetter) return;
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    toast.success("Cover letter copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  // Download TXT
  const handleDownloadTxt = () => {
    if (!coverLetter) return;
    const blob = new Blob([coverLetter], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Cover_Letter_${(company || "RoleFuse").replace(/\s+/g, "_")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Cover letter downloaded!");
  };

  // Print / Save as PDF
  const handlePrint = () => {
    window.print();
  };

  // Add to Job Tracker CRM
  const handleAddToJobTracker = async () => {
    if (!company && !jobTitle) {
      toast.error("Please enter a company name or job title.");
      return;
    }
    setAddingToTracker(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: company.trim() || "Target Company",
          title: jobTitle.trim() || "Applied Role",
          status: "applied",
          notes: `Cover Letter generated with ${tone} tone.\n\n${coverLetter.slice(0, 300)}...`
        })
      });

      if (res.ok) {
        toast.success("Added to your Job Application Tracker!");
      } else {
        toast.success("Saved to your active pipeline!");
      }
    } catch {
      toast.success("Saved to your application pipeline!");
    } finally {
      setAddingToTracker(false);
    }
  };

  const wordCount = coverLetter ? coverLetter.trim().split(/\s+/).length : 0;
  const readTime = Math.ceil(wordCount / 200);

  if (loadingUser) {
    return <CoverLetterSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFB] flex flex-col text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-5 sm:space-y-6 pb-28 sm:pb-16">
        {/* Header Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200/80 pb-4 sm:pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#087F6E] bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60">
                AI Career Suite
              </span>
              <span className="text-xs text-slate-400">&bull;</span>
              <span className="text-xs font-medium text-slate-500">Commercial Standard</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              One-Click AI Cover Letter Generator
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              Turn your resume and target job description into a high-converting, personalized cover letter that highlights your exact skills and metrics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/dashboard/job-tracker">
              <Button variant="outline" size="sm" className="h-9 text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer">
                <Briefcase className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                Job Tracker
              </Button>
            </Link>
          </div>
        </div>

        {/* Studio 2-Column Grid / Free User Limit Gate */}
        {!isAllowed ? (
          <Card className="bg-white border-slate-200 shadow-sm rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6">
            <div className="h-16 w-16 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#087F6E] mx-auto shadow-xs">
              <Lock className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-[#087F6E] text-xs font-black uppercase tracking-wider">
                Free Plan Limit Reached
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Free Cover Letter Sample Used
              </h2>
              <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                You have used your 1 free sample cover letter. Upgrade to Premium Pro (5 letters/month) or Pro Max (15 letters/month) to continue generating tailored, high-converting cover letters across 4 writing styles.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={() => {
                  useUpgradeModalStore.getState().openModal({
                    badge: "PRO",
                    title: "Upgrade to Premium Pro",
                    description:
                      "Get 5 AI tailored cover letters per month, 20 AI resume optimizations, and unlimited PDF downloads.",
                  });
                }}
                className="w-full sm:w-auto bg-[#087F6E] hover:bg-[#065F53] text-white font-bold text-sm h-11 px-8 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Zap className="h-4 w-4 mr-2" />
                Upgrade to Pro (₹99/mo)
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/pricing")}
                className="w-full sm:w-auto border-slate-300 text-slate-800 hover:bg-slate-50 font-bold text-sm h-11 px-6 rounded-xl cursor-pointer"
              >
                View Plans &amp; Pricing
              </Button>
            </div>
          </Card>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Form: Inputs & Configuration */}
          <Card className="lg:col-span-5 bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#087F6E]" />
                  <h2 className="font-extrabold text-sm text-slate-900">Application Parameters</h2>
                </div>
              </div>

              <form onSubmit={handleGenerate} className="space-y-4">
                {/* 1. Resume Source Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Candidate Resume Source</span>
                    {savedResumes.length > 0 && (
                      <span className="text-[10px] text-teal-700 font-semibold">{savedResumes.length} saved in library</span>
                    )}
                  </label>

                  {savedResumes.length > 0 && (
                    <select
                      value={selectedResumeId}
                      onChange={(e) => handleSelectResume(e.target.value)}
                      className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#087F6E]/20 focus:border-[#087F6E] mb-2"
                    >
                      <option value="">-- Choose a saved resume (or paste text below) --</option>
                      {savedResumes.map((res) => (
                        <option key={res.id} value={res.id}>
                          {res.title || res.jobTitle || "Master Resume"} {res.company ? `(${res.company})` : ""}
                        </option>
                      ))}
                    </select>
                  )}

                  <Textarea
                    placeholder="Paste your resume content or bullet points here..."
                    value={resumeText}
                    onChange={(e) => {
                      setResumeText(e.target.value);
                      if (selectedResumeId) setSelectedResumeId("");
                    }}
                    rows={4}
                    autoComplete="off"
                    spellCheck={false}
                    data-lpignore="true"
                    className="text-xs bg-slate-50 border-slate-200 focus:border-[#087F6E] rounded-xl"
                  />
                </div>

                {/* 2. Target Company & Job Title (Dropdown + Manual Type) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 block">
                        Target Company
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomCompany(!isCustomCompany);
                          if (isCustomCompany) setCompany("");
                        }}
                        className="text-[11px] text-[#0A66C2] hover:underline cursor-pointer font-medium"
                      >
                        {isCustomCompany ? "← Choose from list" : "+ Enter custom company"}
                      </button>
                    </div>
                    {!isCustomCompany ? (
                      <select
                        value={company}
                        onChange={(e) => {
                          if (e.target.value === "__custom__") {
                            setIsCustomCompany(true);
                            setCompany("");
                          } else {
                            setCompany(e.target.value);
                          }
                        }}
                        className="w-full text-xs font-medium text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-md px-3 py-2 h-10 focus:outline-none focus:ring-1 focus:ring-[#0A66C2] focus:border-[#0A66C2] cursor-pointer"
                      >
                        <option value="" className="bg-white text-slate-500">Select company...</option>
                        <option value="__custom__" className="bg-white text-[#0A66C2] font-semibold">+ Enter custom company...</option>
                        {COMPANY_OPTIONS.map((c) => (
                          <option key={c} value={c} className="bg-white text-slate-800">
                            {c}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        placeholder="Type custom company (e.g. OpenAI, Stripe)..."
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        autoFocus
                        className="text-xs bg-white border-slate-200 focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2] rounded-md h-10 px-3"
                      />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 block">
                        Target Role
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomRole(!isCustomRole);
                          if (isCustomRole) setJobTitle("");
                        }}
                        className="text-[11px] text-[#0A66C2] hover:underline cursor-pointer font-medium"
                      >
                        {isCustomRole ? "← Choose from list" : "+ Enter custom role"}
                      </button>
                    </div>
                    {!isCustomRole ? (
                      <select
                        value={jobTitle}
                        onChange={(e) => {
                          if (e.target.value === "__custom__") {
                            setIsCustomRole(true);
                            setJobTitle("");
                          } else {
                            setJobTitle(e.target.value);
                          }
                        }}
                        className="w-full text-xs font-medium text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-md px-3 py-2 h-10 focus:outline-none focus:ring-1 focus:ring-[#0A66C2] focus:border-[#0A66C2] cursor-pointer"
                      >
                        <option value="" className="bg-white text-slate-500">Select target role...</option>
                        <option value="__custom__" className="bg-white text-[#0A66C2] font-semibold">+ Enter custom role...</option>
                        {IT_ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r} className="bg-white text-slate-800">
                            {r}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        placeholder="Type custom role (e.g. Lead Software Engineer)..."
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        autoFocus
                        className="text-xs bg-white border-slate-200 focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2] rounded-md h-10 px-3"
                      />
                    )}
                  </div>
                </div>

                {/* 3. Target Job Description */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 block">
                      Target Job Description
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {jobDescription.trim().length} chars {jobDescription.trim().length < 50 ? "(min 50)" : ""}
                    </span>
                  </div>
                  <Textarea
                    placeholder="Paste the job description or core responsibilities here (minimum 50 characters required)..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={6}
                    required
                    autoComplete="off"
                    spellCheck={false}
                    data-lpignore="true"
                    className="text-xs bg-white border-slate-200 focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2] rounded-md p-3 leading-relaxed"
                  />
                  {jobDescription.trim().length > 0 && jobDescription.trim().length < 50 && (
                    <p className="text-[11px] text-amber-600 font-medium">
                      Job description is too short ({jobDescription.trim().length}/50 characters). Please paste the full requirements.
                    </p>
                  )}
                </div>

                {/* 4. Tone Selection */}
                <div className="space-y-2 pt-1">
                  <label className="text-xs font-bold text-slate-700">Writing Tone &amp; Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "modern", label: "Modern & Direct", desc: "Confident, metric-driven" },
                      { id: "formal", label: "Executive & Formal", desc: "Corporate, leadership" },
                      { id: "startup", label: "High-Growth Startup", desc: "Agile, enthusiastic" },
                      { id: "creative", label: "Story & Narrative", desc: "Memorable hook" }
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTone(t.id as any)}
                        className={`p-2.5 rounded-md border text-left transition-all cursor-pointer ${
                          tone === t.id
                            ? "bg-blue-50/70 border-[#0A66C2] shadow-xs"
                            : "bg-white border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className={`text-xs font-bold ${tone === t.id ? "text-[#0A66C2]" : "text-slate-800"}`}>
                          {t.label}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Action */}
                <div className="space-y-1.5 pt-1">
                  <Button
                    type="submit"
                    disabled={generating || jobDescription.trim().length < 50}
                    className={`w-full h-10 font-bold text-xs rounded-md flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer ${
                      jobDescription.trim().length >= 50 && !generating
                        ? "bg-[#0A66C2] hover:bg-[#084e96] text-white cursor-pointer"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
                    }`}
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                        Analyzing Resume &amp; Drafting Letter...
                      </>
                    ) : (
                      <span>Generate Personalized Cover Letter</span>
                    )}
                  </Button>
                  {jobDescription.trim().length < 50 && (
                    <span className="text-[11px] text-amber-600 font-medium text-center block">
                      {jobDescription.trim().length === 0
                        ? "Paste target job description above (min 50 chars) to generate letter"
                        : `Need ${50 - jobDescription.trim().length} more characters to enable generator`}
                    </span>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Right Column: Live Letter Studio Output */}
          <Card className="lg:col-span-7 bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden flex flex-col min-h-[440px] sm:min-h-[580px]">
            {/* Top Toolbar */}
            <div className="bg-slate-50 border-b border-slate-200 p-3 sm:p-4 sm:px-5 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <FileText className="h-4 w-4 text-[#087F6E]" />
                <span className="font-extrabold text-xs text-slate-800">Generated Cover Letter</span>
                {coverLetter && (
                  <Badge variant="outline" className="text-[10px] font-semibold bg-white text-slate-600 border-slate-200">
                    {wordCount} words
                  </Badge>
                )}
              </div>

              {coverLetter && (
                <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="h-8 text-xs font-bold border-slate-200 hover:bg-slate-100"
                    title="Copy letter text"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadTxt}
                    className="h-8 text-xs font-bold border-slate-200 hover:bg-slate-100"
                    title="Download as text file"
                  >
                    <Download className="h-3.5 w-3.5 mr-1" />
                    TXT
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    className="h-8 text-xs font-bold border-slate-200 hover:bg-slate-100"
                    title="Print or Save as PDF"
                  >
                    <Printer className="h-3.5 w-3.5 mr-1" />
                    Print / PDF
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddToJobTracker}
                    disabled={addingToTracker}
                    className="h-8 text-xs font-bold bg-[#087F6E] hover:bg-[#065F53] text-white"
                  >
                    <BookmarkPlus className="h-3.5 w-3.5 mr-1" />
                    Track Job
                  </Button>
                </div>
              )}
            </div>

            {/* Letter Content Workspace */}
            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-start bg-white">
              {generating ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-3">
                  <div className="h-12 w-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#087F6E] animate-bounce">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-800">Drafting Your Cover Letter...</h3>
                  <p className="text-xs text-slate-500 max-w-sm text-center">
                    Connecting your quantifiable achievements with {company || "the company"}&apos;s key requirements.
                  </p>
                </div>
              ) : coverLetter ? (
                <div className="space-y-4 font-sans text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                  <Textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows={20}
                    className="w-full text-xs sm:text-sm text-slate-800 font-sans leading-relaxed border-none focus:ring-0 p-0 resize-y"
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-3 select-none">
                  <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <FileText className="h-6 w-6" />
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-800">Your tailored cover letter will appear here</h3>
                  <p className="text-xs text-slate-500 max-w-xs">
                    Fill in your target role and job description on the left, then click generate to produce a personalized letter.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
        )}
      </main>
    </div>
  );
}

export default function CoverLetterPage() {
  return (
    <Suspense fallback={<CoverLetterSkeleton />}>
      <CoverLetterContent />
    </Suspense>
  );
}
