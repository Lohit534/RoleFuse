"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  MessageSquare, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  HelpCircle, 
  Briefcase, 
  Building2, 
  Printer, 
  Send, 
  Trophy, 
  Star, 
  Layers, 
  Zap, 
  RefreshCw,
  Lock
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useUpgradeModalStore } from "@/store/useUpgradeModalStore";
import { MockInterviewSkeleton } from "@/components/SkeletonShimmer";
import { isOwnerEmail } from "@/types";

interface InterviewQuestion {
  id: string;
  category: "behavioral" | "technical" | "situational";
  difficulty: "Easy" | "Medium" | "Hard";
  question: string;
  whyAsked: string;
  sampleAnswer: string;
  keyPoints: string[];
}

interface AnswerEvaluation {
  score: number;
  verdict: "Exceptional" | "Solid" | "Needs Improvement";
  feedback: string;
  starBreakdown: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  strengths: string[];
  improvements: string[];
  improvedVersion: string;
}

export default function MockInterviewPage() {
  const router = useRouter();
  const [loadingUser, setLoadingUser] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  // Setup inputs
  const [savedResumes, setSavedResumes] = useState<any[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [company, setCompany] = useState("");
  const [isCustomCompany, setIsCustomCompany] = useState(false);
  const [jobDescription, setJobDescription] = useState("");

  // Question generation states
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [overview, setOverview] = useState("");
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<"all" | "behavioral" | "technical" | "situational">("all");

  // Expanded views
  const [expandedModelAnswer, setExpandedModelAnswer] = useState<string | null>(null);

  // Practice & evaluation states
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [evaluatingMap, setEvaluatingMap] = useState<Record<string, boolean>>({});
  const [evaluations, setEvaluations] = useState<Record<string, AnswerEvaluation>>({});
  const [showInputs, setShowInputs] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/auth/login?redirect=/dashboard/mock-interview");
          return;
        }

        // Check Pro Max access
        let allowed = false;
        try {
          const credRes = await fetch("/api/credits");
          if (credRes.ok) {
            const credData = await credRes.json();
            allowed = credData.isOwner || (credData.planId === "promax" && !credData.isFirst50);
          }
        } catch (e) {}

        if (!allowed && user.email && isOwnerEmail(user.email)) {
          allowed = true;
        }
        setIsAllowed(allowed);

        const res = await fetch("/api/resumes");
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.resumes || []);
          setSavedResumes(list);
          setSelectedResumeId("");
          setResumeText("");
        }
      } catch (err) {
        console.error("Init mock interview error:", err);
      } finally {
        setLoadingUser(false);
      }
    }
    init();
  }, [router]);

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

  const handleGenerateQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAllowed) {
      toast.error("AI Mock Interview Coach is exclusively available for Pro Max members.");
      useUpgradeModalStore.getState().openModal({
        badge: "MAX",
        title: "Unlock AI Mock Interview Coach",
        description: "AI Mock Interview Coach is exclusively available for Pro Max members. Upgrade to Pro Max to simulate role-specific STAR questions and get instant AI feedback.",
      });
      return;
    }
    if (!resumeText.trim()) {
      toast.error("Please supply your resume content.");
      return;
    }
    if (jobDescription.trim().length < 50) {
      toast.error("Please paste the target job description (minimum 50 characters required).");
      return;
    }

    setGeneratingQuestions(true);
    try {
      const res = await fetch("/api/interview/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          jobDescription,
          jobTitle: jobTitle.trim() || undefined,
          company: company.trim() || undefined
        })
      });

      const resData = await res.json();
      if (!res.ok) {
        if (res.status === 403) {
          useUpgradeModalStore.getState().openModal({
            badge: "MAX",
            title: "Unlock AI Mock Interview Coach",
            description: "AI Mock Interview Coach is exclusively available for Pro Max members. Upgrade to Pro Max to simulate role-specific STAR questions and get instant AI feedback.",
          });
        }
        throw new Error(resData.error || "Failed to generate interview questions");
      }

      setOverview(resData.data?.overview || "");
      setQuestions(resData.data?.questions || []);
      setShowInputs(false);
      toast.success("Generated tailored interview loop! (2 credits deducted)");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("credits-updated"));
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate questions.");
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleEvaluateAnswer = async (questionId: string, questionText: string) => {
    const answer = userAnswers[questionId];
    if (!answer || !answer.trim()) {
      toast.error("Please type your practice answer first.");
      return;
    }

    setEvaluatingMap(prev => ({ ...prev, [questionId]: true }));
    try {
      const res = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: questionText,
          userAnswer: answer,
          jobDescription,
          resumeText
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to evaluate answer");
      }

      setEvaluations(prev => ({ ...prev, [questionId]: data.evaluation }));
      toast.success("Answer scored and analyzed!");
    } catch (err: any) {
      toast.error(err.message || "Failed to score answer.");
    } finally {
      setEvaluatingMap(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const filteredQuestions = questions.filter(q => {
    if (selectedCategory === "all") return true;
    return q.category === selectedCategory;
  });

  if (loadingUser) {
    return <MockInterviewSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFB] flex flex-col text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-5 sm:space-y-6 pb-28 sm:pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200/80 pb-4 sm:pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#087F6E] bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60">
                STAR Method Engine
              </span>
              <span className="text-xs text-slate-400">&bull;</span>
              <span className="text-xs font-medium text-slate-500">Commercial Standard</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              AI Mock Interview Simulator &amp; Evaluator
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              Anticipate exact behavioral and technical questions for your target role, practice answers with instant STAR scoring, and master model responses.
            </p>
          </div>

          {questions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="w-full sm:w-auto h-9 text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5 mr-1.5" />
              Print / Save Questions
            </Button>
          )}
        </div>

        {/* Locked Pro Max Gate or Main Experience */}
        {!isAllowed ? (
          <Card className="bg-white border-slate-200 shadow-sm rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6">
            <div className="h-16 w-16 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#087F6E] mx-auto shadow-xs">
              <Lock className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-[#087F6E] text-xs font-black uppercase tracking-wider">
                Pro Max Exclusive Feature
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Unlock AI Mock Interview Coach
              </h2>
              <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                AI Mock Interview Coach is exclusively available for Pro Max members. Simulate role-specific behavioral, technical, and situational loops with real-time STAR rubric scoring and model answers.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={() => {
                  useUpgradeModalStore.getState().openModal({
                    badge: "MAX",
                    title: "Unlock AI Mock Interview Coach",
                    description:
                      "AI Mock Interview Coach is exclusively available for Pro Max members. Upgrade to Pro Max to simulate role-specific STAR questions and get instant AI feedback.",
                  });
                }}
                className="w-full sm:w-auto bg-[#087F6E] hover:bg-[#065F53] text-white font-bold text-sm h-11 px-8 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Zap className="h-4 w-4 mr-2" />
                Upgrade to Pro Max
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
        ) : generatingQuestions ? (
          /* Prominent Generating Spinner at Top */
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-4 animate-in fade-in duration-300">
            <div className="h-12 w-12 rounded-full border-4 border-slate-100 border-t-[#087F6E] animate-spin mx-auto" />
            <h2 className="text-xl font-bold text-slate-900">Generating Realistic Interview Loop...</h2>
            <p className="text-xs text-slate-500">
              Formulating target behavioral, technical, and situational STAR questions for <span className="font-semibold text-slate-800">{jobTitle || "your target role"}</span> {company ? `at ${company}` : ""}.
            </p>
          </div>
        ) : (
          <>
            {/* When questions are generated, show Results Top Bar & Results AT THE TOP */}
            {questions.length > 0 && !showInputs && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-[#087F6E] text-white text-[10px] font-bold border-none">
                      {questions.length} Questions Ready
                    </Badge>
                    <span className="text-xs font-bold text-slate-900">
                      {jobTitle || "Target Role"} {company ? `at ${company}` : ""}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Practice questions tailored to your job description with real-time STAR scoring.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInputs(true)}
                  className="text-xs h-9 font-bold border-slate-200 text-slate-700 hover:bg-slate-50 rounded-md cursor-pointer shadow-xs flex items-center gap-1.5 self-start sm:self-center"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
                  <span>Change Target Role &amp; JD</span>
                </Button>
              </div>
            )}

            {/* Input Parameters Section - Shown when no questions or when editing inputs */}
            {(questions.length === 0 || showInputs) && (
              <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                <CardContent className="p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#087F6E]" />
                      <h2 className="font-extrabold text-sm text-slate-900">Target Role &amp; Experience Setup</h2>
                    </div>
                    {questions.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowInputs(false)}
                        className="text-xs text-slate-500 hover:text-slate-800 font-medium"
                      >
                        Cancel / Back to Questions
                      </Button>
                    )}
                  </div>

                  <form onSubmit={handleGenerateQuestions} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Resume Source */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Resume Background</label>
                        {savedResumes.length > 0 && (
                          <select
                            value={selectedResumeId}
                            onChange={(e) => handleSelectResume(e.target.value)}
                            className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#087F6E]/20 mb-1.5"
                          >
                            <option value="">-- Choose saved resume (or paste below) --</option>
                            {savedResumes.map((res) => (
                              <option key={res.id} value={res.id}>
                                {res.title || res.jobTitle || "Master Resume"}
                              </option>
                            ))}
                          </select>
                        )}
                        <Input
                          placeholder="Paste resume excerpt..."
                          value={resumeText}
                          onChange={(e) => {
                            setResumeText(e.target.value);
                            if (selectedResumeId) setSelectedResumeId("");
                          }}
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck={false}
                          data-lpignore="true"
                          className="text-xs bg-slate-50 border-slate-200 rounded-xl h-9"
                        />
                      </div>

                      {/* Company Name (Dropdown + Manual Type) */}
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
                            placeholder="Type custom company (e.g. OpenAI, Stripe, Startup)..."
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            autoFocus
                            className="text-xs bg-white border-slate-200 focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2] rounded-md h-10 px-3"
                          />
                        )}
                      </div>

                      {/* Job Title / IT Roles (Dropdown + Manual Type) */}
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
                            placeholder="Type custom role (e.g. Senior Backend Engineer)..."
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            autoFocus
                            className="text-xs bg-white border-slate-200 focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2] rounded-md h-10 px-3"
                          />
                        )}
                      </div>
                    </div>

                    {/* Job Description */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 block">
                          Job Description &amp; Requirements
                        </label>
                        <span className="text-[10px] text-slate-400">
                          {jobDescription.trim().length} chars {jobDescription.trim().length < 50 ? "(min 50)" : ""}
                        </span>
                      </div>
                      <Textarea
                        placeholder="Paste the target job description to pinpoint interview questions (minimum 50 characters required)..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        rows={4}
                        required
                        autoComplete="off"
                        spellCheck={false}
                        data-lpignore="true"
                        className="text-xs bg-white border-slate-200 focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2] rounded-md p-3"
                      />
                      {jobDescription.trim().length > 0 && jobDescription.trim().length < 50 && (
                        <p className="text-[11px] text-amber-600 font-medium">
                          Job description is too short ({jobDescription.trim().length}/50 characters). Please paste the complete requirements.
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <Button
                        type="submit"
                        disabled={generatingQuestions || jobDescription.trim().length < 50}
                        className={`h-10 px-6 font-bold text-xs rounded-md flex items-center justify-center gap-2 shadow-xs transition-all ${
                          jobDescription.trim().length >= 50 && !generatingQuestions
                            ? "bg-[#0A66C2] hover:bg-[#084e96] text-white cursor-pointer"
                            : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
                        }`}
                      >
                        {generatingQuestions ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin text-white mr-1" />
                            <span>Generating Questions &amp; Rubrics...</span>
                          </>
                        ) : (
                          <span>Generate Interview Questions &amp; Rubrics (2 credits)</span>
                        )}
                      </Button>
                      {jobDescription.trim().length < 50 && (
                        <span className="text-[11px] text-amber-600 font-medium">
                          {jobDescription.trim().length === 0
                            ? "Paste target job description above (min 50 chars) to generate questions"
                            : `Need ${50 - jobDescription.trim().length} more characters to enable interview generator`}
                        </span>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

        {/* Overview Banner */}
        {overview && (
          <div className="bg-teal-50/70 border border-teal-200/90 rounded-2xl p-4 flex items-start gap-3">
            <Star className="h-5 w-5 text-[#087F6E] shrink-0 mt-0.5" />
            <div>
              <h3 className="font-extrabold text-xs text-teal-900 uppercase tracking-wider">Hiring Manager Strategy</h3>
              <p className="text-xs text-teal-950 font-medium mt-0.5 leading-relaxed">{overview}</p>
            </div>
          </div>
        )}

        {/* Category Filters */}
        {questions.length > 0 && (
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: "all", label: `All Questions (${questions.length})` },
              { id: "behavioral", label: `Behavioral (${questions.filter(q => q.category === "behavioral").length})` },
              { id: "technical", label: `Technical & Domain (${questions.filter(q => q.category === "technical").length})` },
              { id: "situational", label: `Situational (${questions.filter(q => q.category === "situational").length})` }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id as any)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedCategory === tab.id
                    ? "bg-[#087F6E] text-white border-[#087F6E]"
                    : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Questions Loop Cards */}
        {questions.length > 0 && (
          <div className="space-y-4">
            {filteredQuestions.map((q, idx) => {
              const evalResult = evaluations[q.id];
              const isEvaluating = evaluatingMap[q.id] || false;
              const isModelExpanded = expandedModelAnswer === q.id;

              return (
                <Card key={q.id || idx} className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
                  <CardContent className="p-5 sm:p-6 space-y-4">
                    {/* Top Badges & Question */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 hover:bg-slate-100 border-none rounded-md">
                            {q.category}
                          </Badge>
                          <Badge className={`text-[10px] font-bold rounded-md ${
                            q.difficulty === "Easy" ? "bg-emerald-50 text-emerald-700" :
                            q.difficulty === "Hard" ? "bg-rose-50 text-rose-700" :
                            "bg-amber-50 text-amber-700"
                          } border-none`}>
                            {q.difficulty}
                          </Badge>
                        </div>
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug">
                          {idx + 1}. {q.question}
                        </h3>
                      </div>
                    </div>

                    {/* Why Asked Insight */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-md p-3 text-xs text-slate-600 space-y-1">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <HelpCircle className="h-3.5 w-3.5 text-[#087F6E]" />
                        What the Interviewer is Evaluating:
                      </div>
                      <p className="leading-relaxed pl-5">{q.whyAsked}</p>
                    </div>

                    {/* Key Points to Hit */}
                    {q.keyPoints?.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Key Elements to Include:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {q.keyPoints.map((pt, i) => (
                            <span key={i} className="text-[11px] font-medium text-slate-600 bg-teal-50/70 border border-teal-200/60 px-2 py-0.5 rounded-md">
                              &bull; {pt}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Practice Response Area */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                        <span>Your Practice Response:</span>
                        <span className="text-[11px] text-slate-500 font-medium">STAR Format (Situation, Task, Action, Result)</span>
                      </label>
                      <Textarea
                        placeholder="Type how you would answer this in an actual interview (Situation, Task, Action, Result)..."
                        value={userAnswers[q.id] || ""}
                        onChange={(e) => setUserAnswers({ ...userAnswers, [q.id]: e.target.value })}
                        rows={4}
                        className="text-xs sm:text-sm bg-white text-slate-900 border border-slate-300 focus:border-[#087F6E] focus:ring-1 focus:ring-[#087F6E] rounded-md leading-relaxed p-3 shadow-2xs font-normal"
                      />

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                        <Button
                          type="button"
                          size="sm"
                          disabled={isEvaluating || !userAnswers[q.id]?.trim()}
                          onClick={() => handleEvaluateAnswer(q.id, q.question)}
                          className="w-full sm:w-auto h-9 text-xs font-bold bg-[#087F6E] hover:bg-[#065F53] text-white rounded-md shadow-xs cursor-pointer px-4"
                        >
                          {isEvaluating ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                              Evaluating with STAR Rubric...
                            </>
                          ) : (
                            <>
                              <Send className="h-3.5 w-3.5 mr-1.5" />
                              Evaluate My Answer
                            </>
                          )}
                        </Button>

                        <button
                          type="button"
                          onClick={() => setExpandedModelAnswer(isModelExpanded ? null : q.id)}
                          className="text-xs font-bold text-[#087F6E] hover:underline flex items-center justify-center sm:justify-start gap-1 cursor-pointer py-1"
                        >
                          {isModelExpanded ? "Hide Model Answer" : "View Sample 10/10 Answer"}
                          {isModelExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* AI Evaluation Result Card */}
                    {evalResult && (
                      <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 space-y-3 mt-3 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                          <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-emerald-700" />
                            <span className="font-extrabold text-xs text-emerald-900">AI Evaluation Feedback</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-600 text-white font-extrabold text-xs rounded-md">
                              Score: {evalResult.score}/100
                            </Badge>
                            <span className="text-xs font-bold text-emerald-800">{evalResult.verdict}</span>
                          </div>
                        </div>

                        <p className="text-xs text-emerald-950 leading-relaxed font-medium">
                          {evalResult.feedback}
                        </p>

                        {/* STAR Breakdown */}
                        {evalResult.starBreakdown && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                            <div className="bg-white p-2.5 rounded-md border border-emerald-200">
                              <span className="font-bold text-emerald-900 block">Situation</span>
                              <span className="text-slate-600">{evalResult.starBreakdown.situation || "Covered"}</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-md border border-emerald-200">
                              <span className="font-bold text-emerald-900 block">Task</span>
                              <span className="text-slate-600">{evalResult.starBreakdown.task || "Covered"}</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-md border border-emerald-200">
                              <span className="font-bold text-emerald-900 block">Action</span>
                              <span className="text-slate-600">{evalResult.starBreakdown.action || "Covered"}</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-md border border-emerald-200">
                              <span className="font-bold text-emerald-900 block">Result</span>
                              <span className="text-slate-600">{evalResult.starBreakdown.result || "Covered"}</span>
                            </div>
                          </div>
                        )}

                        {/* Improved Version */}
                        {evalResult.improvedVersion && (
                          <div className="bg-white rounded-md p-3 border border-emerald-200 text-xs space-y-1">
                            <span className="font-bold text-emerald-900 block">Polished STAR Rephrasing:</span>
                            <p className="text-slate-700 leading-relaxed italic">&quot;{evalResult.improvedVersion}&quot;</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Expandable Model Answer */}
                    {isModelExpanded && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2 mt-2">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-[#087F6E]" />
                          RoleFuse Model Answer (STAR Method):
                        </div>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap pl-5 font-normal">
                          {q.sampleAnswer}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
          </>
        )}
      </main>
    </div>
  );
}

