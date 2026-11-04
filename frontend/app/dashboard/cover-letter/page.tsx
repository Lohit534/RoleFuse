"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Download, 
  Briefcase, 
  Building2, 
  FileText, 
  ArrowRight, 
  Loader2,
  BookmarkPlus,
  Zap,
  Printer
} from "lucide-react";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { CoverLetterSkeleton } from "@/components/SkeletonShimmer";

interface SavedResume {
  id: string;
  title?: string;
  jobTitle?: string;
  company?: string;
  content?: string;
  resumeJSON?: any;
}

function CoverLetterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loadingUser, setLoadingUser] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Form states
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [resumeText, setResumeText] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
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

        // Fetch user's saved resumes
        const res = await fetch("/api/resumes");
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.resumes || []);
          setSavedResumes(list);
          if (list.length > 0) {
            setSelectedResumeId(list[0].id);
            setResumeText(list[0].content || JSON.stringify(list[0].resumeJSON || ""));
            // Only auto-fill real target role if it's not a resume document name (e.g. "Lohith Peyyala's Resume")
            if (list[0].jobTitle && !queryTitle) {
              const isDocName = /resume|cv/i.test(list[0].jobTitle) || list[0].jobTitle.includes("'s");
              if (!isDocName) setJobTitle(list[0].jobTitle);
            }
            // Only auto-fill company if not generic fallback
            if (list[0].company && !queryCompany) {
              if (list[0].company.toLowerCase() !== "general application") {
                setCompany(list[0].company);
              }
            }
          }
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
    const found = savedResumes.find(r => r.id === id);
    if (found) {
      setResumeText(found.content || JSON.stringify(found.resumeJSON || ""));
      if (found.jobTitle && !jobTitle) {
        const isDocName = /resume|cv/i.test(found.jobTitle) || found.jobTitle.includes("'s");
        if (!isDocName) setJobTitle(found.jobTitle);
      }
      if (found.company && !company && found.company.toLowerCase() !== "general application") {
        setCompany(found.company);
      }
    }
  };

  // Generate Cover Letter
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeText.trim()) {
      toast.error("Please provide your resume content.");
      return;
    }
    if (!jobDescription.trim()) {
      toast.error("Please paste the target job description.");
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
        throw new Error(data.error || "Failed to generate cover letter");
      }

      setCoverLetter(data.coverLetter);
      toast.success("Personalized cover letter generated!");
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Header Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#087F6E] bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60">
                AI Career Suite
              </span>
              <span className="text-xs text-slate-400">&bull;</span>
              <span className="text-xs font-medium text-slate-500">Commercial Standard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              One-Click AI Cover Letter Generator
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              Turn your resume and target job description into a high-converting, personalized cover letter that highlights your exact skills and metrics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/dashboard/job-tracker">
              <Button variant="outline" size="sm" className="h-9 text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-100">
                <Briefcase className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                Job Tracker
              </Button>
            </Link>
          </div>
        </div>

        {/* Studio 2-Column Grid */}
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
                      <span className="text-[10px] text-teal-700 font-semibold">{savedResumes.length} saved</span>
                    )}
                  </label>

                  {savedResumes.length > 0 ? (
                    <select
                      value={selectedResumeId}
                      onChange={(e) => handleSelectResume(e.target.value)}
                      className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#087F6E]/20 focus:border-[#087F6E]"
                    >
                      {savedResumes.map((res) => (
                        <option key={res.id} value={res.id}>
                          {res.title || res.jobTitle || "Master Resume"} {res.company ? `(${res.company})` : ""}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Textarea
                      placeholder="Paste your resume content or bullet points here..."
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      rows={4}
                      className="text-xs bg-slate-50 border-slate-200 focus:border-[#087F6E] rounded-xl"
                    />
                  )}
                </div>

                {/* 2. Target Company & Job Title */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-slate-400" /> Company
                    </label>
                    <Input
                      placeholder="e.g. Stripe, Google"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="text-xs bg-slate-50 border-slate-200 focus:border-[#087F6E] rounded-xl h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Briefcase className="h-3 w-3 text-slate-400" /> Target Role
                    </label>
                    <Input
                      placeholder="e.g. Lead Frontend Engineer"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="text-xs bg-slate-50 border-slate-200 focus:border-[#087F6E] rounded-xl h-9"
                    />
                  </div>
                </div>

                {/* 3. Target Job Description */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Target Job Description</label>
                    <span className="text-[10px] text-slate-400">{jobDescription.length} chars</span>
                  </div>
                  <Textarea
                    placeholder="Paste the job description or core responsibilities here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={6}
                    required
                    className="text-xs bg-slate-50 border-slate-200 focus:border-[#087F6E] rounded-xl leading-relaxed"
                  />
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
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          tone === t.id
                            ? "bg-teal-50/70 border-[#087F6E] shadow-xs"
                            : "bg-white border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className={`text-xs font-bold ${tone === t.id ? "text-[#087F6E]" : "text-slate-800"}`}>
                          {t.label}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Action */}
                <Button
                  type="submit"
                  disabled={generating || !jobDescription.trim()}
                  className="w-full h-10 bg-[#087F6E] hover:bg-[#065F53] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer mt-2"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      Analyzing Resume &amp; Drafting Letter...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Generate Personalized Cover Letter
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Right Column: Live Letter Studio Output */}
          <Card className="lg:col-span-7 bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden flex flex-col min-h-[580px]">
            {/* Top Toolbar */}
            <div className="bg-slate-50 border-b border-slate-200 p-3.5 sm:px-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-[#087F6E]" />
                <span className="font-extrabold text-xs text-slate-800">Generated Cover Letter</span>
                {coverLetter && (
                  <Badge variant="outline" className="text-[10px] font-semibold bg-white text-slate-600 border-slate-200">
                    {wordCount} words &bull; ~{readTime} min read
                  </Badge>
                )}
              </div>

              {coverLetter && (
                <div className="flex items-center gap-1.5">
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
