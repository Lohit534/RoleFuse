"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useResumeStore } from "@/store/useResumeStore";
import Navbar from "@/components/Navbar";
import ResumeInput from "@/components/ResumeInput";
import JobDescriptionInput from "@/components/JobDescriptionInput";
import KeywordBadges from "@/components/KeywordBadges";
import { extractTechTerms, isTechnicalKeyword } from "@/lib/ats/keywords";
import ResumeViewer from "@/components/ResumeViewer";
import BulletImprover from "@/components/BulletImprover";
import { hasQuantifiedMetric } from "@/lib/ats/scorer";
import { hasStrongActionVerb, extractScorableBullets, cleanBulletText } from "@/lib/ats/bullets";
// Removed LoadingOverlay import as user requested native background animation
import BulletEnrichmentModal, {
  WeakBullet,
} from "@/components/BulletEnrichmentModal";
import { enrichResumeWithAnswers } from "@/lib/resume-inspector";
import { DashboardSkeleton } from "@/components/SkeletonShimmer";
import { LinkedInIcon } from "@/components/icons/LinkedInIcon";
import { GeminiIcon } from "@/components/icons/GeminiIcon";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ATSScore, isOwnerEmail } from "@/types";
import { generateUUID } from "@/lib/utils";
import { SAMPLE_RESUME_TEXT, SAMPLE_JD_TEXT } from "@/lib/sample-data";
import {
  Sparkles,
  Loader2,
  RefreshCw,
  History,
  ArrowLeft,
  Zap,
  Target,
  FileText,
  TrendingUp,
  ArrowRight,
  Lock,
  GraduationCap,
  Briefcase,
  X,
  ChevronDown,
  ChevronRight,
  Shield,
  FolderOpen,
  Check,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Calendar,
  FileCheck2,
  Bell,
  BookmarkPlus,
  BookmarkCheck,
  RotateCcw,
} from "lucide-react";
import { toast } from "react-hot-toast";
import Link from "next/link";
import CircleGauge from "@/components/CircleGauge";
import ScrollFadeIn from "@/components/ScrollFadeIn";
import { UseSavedResumeModal } from "@/components/UseSavedResumeModal";
import PlaceholderFiller, {
  ResumePlaceholder,
} from "@/components/PlaceholderFiller";
import OptimizingProgress from "@/components/OptimizingProgress";
import FeedbackToast from "@/components/FeedbackToast";
import { useUpgradeModalStore } from "@/store/useUpgradeModalStore";

// Session storage & local storage persistence helpers for active optimization results
const ACTIVE_KEYS = {
  RESULT: "fastHire_activeOptimizationResult",
  BEFORE_SCORE: "fastHire_activeBeforeScore",
  AFTER_SCORE: "fastHire_activeAfterScore",
  RESUME_ID: "fastHire_activeResumeId",
  RESUME_TEXT: "fastHire_activeResumeText",
  JOB_DESCRIPTION: "fastHire_activeJobDescription",
  ROADMAP_CONTENT: "fastHire_activeRoadmapContent",
  COVER_LETTER: "fastHire_activeCoverLetter",
  TRACKER_ADDED: "fastHire_activeTrackerAdded",
  USER_ID: "fastHire_activeUserId",
};

function saveActiveSession(data: {
  result?: any;
  beforeScore?: any;
  afterScore?: any;
  resumeId?: string;
  resumeText?: string;
  jobDescription?: string;
  roadmapContent?: string | null;
  coverLetter?: string | null;
  trackerAdded?: boolean;
  userId?: string;
}) {
  if (typeof window === "undefined") return;
  try {
    if (data.result !== undefined && data.result !== null) {
      const val = JSON.stringify(data.result);
      sessionStorage.setItem(ACTIVE_KEYS.RESULT, val);
      localStorage.setItem(ACTIVE_KEYS.RESULT, val);
    }
    if (data.beforeScore !== undefined) {
      if (data.beforeScore) {
        const val = JSON.stringify(data.beforeScore);
        sessionStorage.setItem(ACTIVE_KEYS.BEFORE_SCORE, val);
        localStorage.setItem(ACTIVE_KEYS.BEFORE_SCORE, val);
      } else {
        sessionStorage.removeItem(ACTIVE_KEYS.BEFORE_SCORE);
        localStorage.removeItem(ACTIVE_KEYS.BEFORE_SCORE);
      }
    }
    if (data.afterScore !== undefined) {
      if (data.afterScore) {
        const val = JSON.stringify(data.afterScore);
        sessionStorage.setItem(ACTIVE_KEYS.AFTER_SCORE, val);
        localStorage.setItem(ACTIVE_KEYS.AFTER_SCORE, val);
      } else {
        sessionStorage.removeItem(ACTIVE_KEYS.AFTER_SCORE);
        localStorage.removeItem(ACTIVE_KEYS.AFTER_SCORE);
      }
    }
    if (data.resumeId !== undefined) {
      sessionStorage.setItem(ACTIVE_KEYS.RESUME_ID, data.resumeId || "");
      localStorage.setItem(ACTIVE_KEYS.RESUME_ID, data.resumeId || "");
    }
    // Input text and URLs are never stored: every time the user fills newly
    sessionStorage.removeItem(ACTIVE_KEYS.RESUME_TEXT);
    localStorage.removeItem(ACTIVE_KEYS.RESUME_TEXT);
    sessionStorage.removeItem(ACTIVE_KEYS.JOB_DESCRIPTION);
    localStorage.removeItem(ACTIVE_KEYS.JOB_DESCRIPTION);
    if (data.roadmapContent !== undefined) {
      if (data.roadmapContent) {
        sessionStorage.setItem(ACTIVE_KEYS.ROADMAP_CONTENT, data.roadmapContent);
        localStorage.setItem(ACTIVE_KEYS.ROADMAP_CONTENT, data.roadmapContent);
      } else {
        sessionStorage.removeItem(ACTIVE_KEYS.ROADMAP_CONTENT);
        localStorage.removeItem(ACTIVE_KEYS.ROADMAP_CONTENT);
      }
    }
    if (data.coverLetter !== undefined) {
      if (data.coverLetter) {
        sessionStorage.setItem(ACTIVE_KEYS.COVER_LETTER, data.coverLetter);
        localStorage.setItem(ACTIVE_KEYS.COVER_LETTER, data.coverLetter);
      } else {
        sessionStorage.removeItem(ACTIVE_KEYS.COVER_LETTER);
        localStorage.removeItem(ACTIVE_KEYS.COVER_LETTER);
      }
    }
    if (data.trackerAdded !== undefined) {
      const val = data.trackerAdded ? "true" : "false";
      sessionStorage.setItem(ACTIVE_KEYS.TRACKER_ADDED, val);
      localStorage.setItem(ACTIVE_KEYS.TRACKER_ADDED, val);
    }
    if (data.userId) {
      sessionStorage.setItem(ACTIVE_KEYS.USER_ID, data.userId);
      localStorage.setItem(ACTIVE_KEYS.USER_ID, data.userId);
    }
  } catch (e) {
    console.error("Failed to save active session:", e);
  }
}

function clearActiveSession() {
  if (typeof window === "undefined") return;
  Object.values(ACTIVE_KEYS).forEach((key) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });
}

function loadActiveSession() {
  if (typeof window === "undefined") return null;
  try {
    const rawResult =
      sessionStorage.getItem(ACTIVE_KEYS.RESULT) ||
      localStorage.getItem(ACTIVE_KEYS.RESULT);
    if (!rawResult) return null;
    const result = JSON.parse(rawResult);
    if (!result || (!result.optimizedText && !result.resume)) return null;

    const rawBefore =
      sessionStorage.getItem(ACTIVE_KEYS.BEFORE_SCORE) ||
      localStorage.getItem(ACTIVE_KEYS.BEFORE_SCORE);
    const rawAfter =
      sessionStorage.getItem(ACTIVE_KEYS.AFTER_SCORE) ||
      localStorage.getItem(ACTIVE_KEYS.AFTER_SCORE);
    const resumeId =
      sessionStorage.getItem(ACTIVE_KEYS.RESUME_ID) ||
      localStorage.getItem(ACTIVE_KEYS.RESUME_ID);
    // Never reload old input text into the form inputs
    const resumeText = "";
    const jobDescription = "";
    const roadmapContent =
      sessionStorage.getItem(ACTIVE_KEYS.ROADMAP_CONTENT) ||
      localStorage.getItem(ACTIVE_KEYS.ROADMAP_CONTENT);
    const coverLetter =
      sessionStorage.getItem(ACTIVE_KEYS.COVER_LETTER) ||
      localStorage.getItem(ACTIVE_KEYS.COVER_LETTER);
    const trackerAdded =
      sessionStorage.getItem(ACTIVE_KEYS.TRACKER_ADDED) ||
      localStorage.getItem(ACTIVE_KEYS.TRACKER_ADDED);
    const activeUserId =
      sessionStorage.getItem(ACTIVE_KEYS.USER_ID) ||
      localStorage.getItem(ACTIVE_KEYS.USER_ID);

    return {
      result,
      beforeScore: rawBefore ? JSON.parse(rawBefore) : null,
      afterScore: rawAfter ? JSON.parse(rawAfter) : null,
      resumeId: resumeId || null,
      resumeText: resumeText || "",
      jobDescription: jobDescription || "",
      roadmapContent: roadmapContent || null,
      coverLetter: coverLetter || null,
      trackerAdded: trackerAdded === "true",
      userId: activeUserId || null,
    };
  } catch (e) {
    console.error("Failed to load active session:", e);
    clearActiveSession();
    return null;
  }
}

function getScoreRingStyle(score: number) {
  if (score >= 75) {
    return {
      gradient: "from-[#087F6E] via-emerald-400 to-teal-300",
      textColor: "text-[#087F6E]",
    };
  }
  if (score >= 50) {
    return {
      gradient: "from-amber-500 via-amber-400 to-yellow-300",
      textColor: "text-amber-600",
    };
  }
  return {
    gradient: "from-rose-500 via-rose-400 to-orange-400",
    textColor: "text-rose-600",
  };
}

export default function DashboardPage() {
  const router = useRouter();

  const {
    resumeText,
    jobDescription,
    setResumeText,
    setJobDescription,
    reset: resetStore,
  } = useResumeStore();

  const [authLoading, setAuthLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("");

  const [beforeScore, setBeforeScore] = useState<ATSScore | null>(null);
  const [afterScore, setAfterScore] = useState<ATSScore | null>(null);
  const [optimizeResult, setOptimizeResult] = useState<any>(null);
  const [originalResumeSnapshot, setOriginalResumeSnapshot] = useState<string>("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [instructions, setInstructions] = useState("");
  const [lengthOption, setLengthOption] = useState("Auto-detect");

  // User plan states
  const [user, setUser] = useState<any>(null);
  const [userPlan, setUserPlan] = useState<string>("free");
  const isOwner = userPlan === "owner" || (user?.email && isOwnerEmail(user.email));
  const [userCredits, setUserCredits] = useState<any>(null);
  const [trackerAdded, setTrackerAdded] = useState(false);
  const [isSavedToResumes, setIsSavedToResumes] = useState(false);
  const [savingToResumes, setSavingToResumes] = useState(false);

  const handleSaveToResumes = async () => {
    if (!user) {
      toast.error("Please sign in to save resumes to your library.");
      return;
    }
    const textToSave = optimizeResult?.optimizedText || resumeText;
    if (!textToSave) {
      toast.error("No optimized resume text found to save.");
      return;
    }

    setSavingToResumes(true);
    try {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: generateUUID(),
          originalText: resumeText,
          optimizedText: textToSave,
          jobDescription: "", // Empty JD marks it as user's standalone resume in /dashboard/resumes
          jobTitle: optimizeResult?.jobTitle ? `${optimizeResult.jobTitle} (Optimized)` : "Target Role Resume",
          company: optimizeResult?.company || "General Application",
          scoreBefore: beforeScore?.overall || 50,
          scoreAfter: afterScore?.overall || 85,
          keywordsBefore: beforeScore?.foundKeywords?.length || 0,
          keywordsAfter: afterScore?.foundKeywords?.length || 10,
          impactBefore: beforeScore?.impactBullets || 0,
          impactAfter: afterScore?.impactBullets || 10,
          keywordsAdded: optimizeResult?.keywordsAdded || [],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save to Resumes library.");
      }

      setIsSavedToResumes(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to save resume.");
    } finally {
      setSavingToResumes(false);
    }
  };
  const [bulletImprovementsCount, setBulletImprovementsCount] = useState(0);
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);
  // Placeholder filler state
  const [showPlaceholderFiller, setShowPlaceholderFiller] = useState(false);
  const [pendingPlaceholders, setPendingPlaceholders] = useState<
    ResumePlaceholder[]
  >([]);

  // Roadmap & Cover letter generator states
  const [selectedRoadmapSkills, setSelectedRoadmapSkills] = useState<string[]>(
    [],
  );
  const [roadmapContent, setRoadmapContent] = useState<string | null>(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [coverLetterGenerated, setCoverLetterGenerated] = useState<
    string | null
  >(null);
  const [generatingLetter, setGeneratingLetter] = useState(false);
  const [pdfGenerationStatus, setPdfGenerationStatus] = useState<string>("");
  const [isPrechecking, setIsPrechecking] = useState(false);
  const [activeOptimizationText, setActiveOptimizationText] = useState("");
  const [activeOptimizationInstructions, setActiveOptimizationInstructions] =
    useState("");
  const [showRoadmapAccordion, setShowRoadmapAccordion] = useState(false);
  const [showCoverLetterAccordion, setShowCoverLetterAccordion] =
    useState(false);
  const [resultsSubTab, setResultsSubTab] = useState<"roadmap" | "cover_letter">("roadmap");
  // Removed isAILoading state
  const [isSavedResumesOpen, setIsSavedResumesOpen] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Bullet enrichment modal state
  const [weakBullets, setWeakBullets] = useState<WeakBullet[]>([]);
  const [showBulletModal, setShowBulletModal] = useState(false);
  const [pendingResumeText, setPendingResumeText] = useState("");
  const [showOneTimeFeedback, setShowOneTimeFeedback] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const sampleLoadedRef = useRef(false);

  const [viewMode, setViewMode] = useState<"result" | "editor">("editor");

  // Executive Overview Cards State (Latest Resume Scan & Job Tracker)
  const [latestScanInfo, setLatestScanInfo] = useState<{
    score: number;
    jobTitle: string;
    company: string;
  }>({
    score: 40,
    jobTitle: "Software Engineer",
    company: "Company Name",
  });

  const [jobTrackerStats, setJobTrackerStats] = useState<{
    total: number;
    saved: number;
    applied: number;
    interview: number;
    offer: number;
    nextInterview: string | null;
  }>({
    total: 0,
    saved: 0,
    applied: 0,
    interview: 0,
    offer: 0,
    nextInterview: null,
  });

  useEffect(() => {
    const handleOpenEditor = () => {
      clearActiveSession();
      resetStore();
      setOptimizeResult(null);
      setBeforeScore(null);
      setAfterScore(null);
      setResumeText("");
      setJobDescription("");
      setTrackerAdded(false);
      setViewMode("editor");
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("open-optimize-editor", handleOpenEditor);
    return () => window.removeEventListener("open-optimize-editor", handleOpenEditor);
  }, [resetStore, setResumeText, setJobDescription]);

  useEffect(() => {
    // Purge any old input text or URLs from storage so the user fills fresh every time
    try {
      localStorage.removeItem(ACTIVE_KEYS.RESUME_TEXT);
      localStorage.removeItem(ACTIVE_KEYS.JOB_DESCRIPTION);
      sessionStorage.removeItem(ACTIVE_KEYS.RESUME_TEXT);
      sessionStorage.removeItem(ACTIVE_KEYS.JOB_DESCRIPTION);
      localStorage.removeItem("fasthire-resume-storage");
      sessionStorage.removeItem("fasthire-resume-storage");
    } catch {}

    if (sampleLoadedRef.current) return;

    // Check if sample data was requested from landing page or query
    const isPendingSample =
      typeof window !== "undefined" &&
      localStorage.getItem("fastHire_pendingSample");
    const sampleResume =
      typeof window !== "undefined" &&
      localStorage.getItem("fastHire_sampleResume");
    const sampleJD =
      typeof window !== "undefined" &&
      localStorage.getItem("fastHire_sampleJD");
    const hasSampleQuery =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("sample") === "true";

    if (isPendingSample === "true" || hasSampleQuery) {
      sampleLoadedRef.current = true;
      clearActiveSession();
      setResumeText(sampleResume || SAMPLE_RESUME_TEXT);
      setJobDescription(sampleJD || SAMPLE_JD_TEXT);
      // Clean up sample storage once loaded into state
      localStorage.removeItem("fastHire_pendingSample");
      localStorage.removeItem("fastHire_sampleResume");
      localStorage.removeItem("fastHire_sampleJD");
      // Clean up URL so a page refresh clears sample data
      if (
        typeof window !== "undefined" &&
        window.location.search.includes("sample")
      ) {
        window.history.replaceState({}, "", "/dashboard");
      }
    } else {
      // Clear inputs to blank so user fills newly every time
      setResumeText("");
      setJobDescription("");
      const activeSession = loadActiveSession();
      if (activeSession) {
        sampleLoadedRef.current = true;
        setOptimizeResult(activeSession.result);
        if (activeSession.result?.originalText) setOriginalResumeSnapshot(activeSession.result.originalText);
        if (activeSession.beforeScore) setBeforeScore(activeSession.beforeScore);
        if (activeSession.afterScore) setAfterScore(activeSession.afterScore);
        if (activeSession.resumeId) setCurrentResumeId(activeSession.resumeId);
        if (activeSession.roadmapContent) setRoadmapContent(activeSession.roadmapContent);
        if (activeSession.coverLetter) setCoverLetterGenerated(activeSession.coverLetter);
        if (activeSession.trackerAdded) setTrackerAdded(true);
      }
    }
  }, [setResumeText, setJobDescription]);

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user) {
          toast.error("Please sign in to continue.");
          const hasSample =
            typeof window !== "undefined" &&
            (new URLSearchParams(window.location.search).get("sample") ===
              "true" ||
              localStorage.getItem("fastHire_pendingSample") === "true");
          router.push(hasSample ? "/auth/login?sample=true" : "/auth/login");
          return;
        }

        // Email verification guard: block unconfirmed email accounts
        const isEmailProvider =
          data.user.app_metadata?.provider === "email" ||
          data.user.identities?.[0]?.provider === "email";
        if (isEmailProvider && !data.user.email_confirmed_at) {
          toast.error(
            "Please verify your email address before accessing your dashboard.",
          );
          await supabase.auth.signOut();
          router.push("/auth/login?error=email-not-confirmed");
          return;
        }

        setUser(data.user);
        // If restored session belonged to a different user, clear it
        const savedUserId =
          (typeof window !== "undefined" &&
            (sessionStorage.getItem(ACTIVE_KEYS.USER_ID) ||
              localStorage.getItem(ACTIVE_KEYS.USER_ID))) ||
          null;
        if (savedUserId && savedUserId !== data.user.id) {
          clearActiveSession();
          resetStore();
          setOptimizeResult(null);
          setBeforeScore(null);
          setAfterScore(null);
        }
        // Pre-load cached plan to prevent UI flash
        const cachedPlan = localStorage.getItem(
          `fastHire_plan_${data.user.id}`,
        );
        if (cachedPlan) {
          setUserPlan(cachedPlan);
        }
        setAuthLoading(false);

        // Load Job Tracker counts for overview card
        try {
          const storedJobsStr = localStorage.getItem(`fastHire_jobs_${data.user.id}`);
          if (storedJobsStr) {
            const parsed = JSON.parse(storedJobsStr);
            if (Array.isArray(parsed)) {
              // Sanitize: remove blank/empty placeholder jobs (no company AND no title)
              const validJobs = parsed.filter(
                (j: any) => j && typeof j === "object" && (String(j.company || "").trim() || String(j.title || "").trim())
              );
              // Persist cleaned list if entries were removed
              if (validJobs.length !== parsed.length) {
                localStorage.setItem(`fastHire_jobs_${data.user.id}`, JSON.stringify(validJobs));
              }
              const totalCount = validJobs.length;
              const savedCount = validJobs.filter((j: any) => j.status === "wishlist" || j.status === "saved").length;
              const appliedCount = validJobs.filter((j: any) => j.status === "applied").length;
              const interviewCount = validJobs.filter((j: any) => j.status === "interviewing" || j.status === "interview").length;
              const offerCount = validJobs.filter((j: any) => j.status === "offered" || j.status === "offer").length;
              const upcoming = validJobs.find((j: any) => (j.status === "interviewing" || j.status === "interview") && j.date);
              setJobTrackerStats({
                total: totalCount,
                saved: savedCount,
                applied: appliedCount,
                interview: interviewCount,
                offer: offerCount,
                nextInterview: upcoming ? upcoming.date : null,
              });
            } else {
              setJobTrackerStats({
                total: 0,
                saved: 0,
                applied: 0,
                interview: 0,
                offer: 0,
                nextInterview: null,
              });
            }
          } else {
            setJobTrackerStats({
              total: 0,
              saved: 0,
              applied: 0,
              interview: 0,
              offer: 0,
              nextInterview: null,
            });
          }
        } catch (e) {}

        // Load Latest Scan Information for overview card
        try {
          const cachedHistory = localStorage.getItem(`fastHire_history_cache_${data.user.id}`);
          if (cachedHistory) {
            const historyList = JSON.parse(cachedHistory);
            if (Array.isArray(historyList) && historyList.length > 0) {
              const latest = historyList[0];
              const scoreVal = typeof latest.scoreAfter === "number" ? latest.scoreAfter : (typeof latest.scoreBefore === "number" ? latest.scoreBefore : 40);
              setLatestScanInfo({
                score: scoreVal,
                jobTitle: latest.jobTitle || "Software Engineer",
                company: latest.company || "Target Company",
              });
            }
          }
        } catch (e) {}

        // Fetch plan/credits details safely in separate block
        try {
          const creditsRes = await fetch("/api/credits");
          if (creditsRes.ok) {
            const creditsData = await creditsRes.json();
            setUserCredits(creditsData);
            let plan = "free";
            if (creditsData.isOwner) {
              plan = "owner";
            } else if (
              creditsData.planId === "promax" &&
              !creditsData.isFirst50
            ) {
              plan = "promax";
            } else if (
              creditsData.planId === "premium" ||
              creditsData.isFirst50 ||
              creditsData.paidCredits > 0
            ) {
              plan = "premium";
            } else {
              plan =
                creditsData.planId ||
                localStorage.getItem(`fastHire_plan_${data.user.id}`) ||
                "free";
            }
            setUserPlan(plan);
            localStorage.setItem(`fastHire_plan_${data.user.id}`, plan);
          }
        } catch (creditsErr) {
          // silent — failed to load credits info
        }
      } catch (err) {
        // silent — auth check failed, redirecting
        router.push("/auth/login");
      }
    }
    checkAuth();
  }, [router]);

  // Live listener to keep Job Tracker counts on dashboard updated in real-time
  useEffect(() => {
    if (!user?.id) return;
    const syncStats = () => {
      try {
        const storedJobsStr = localStorage.getItem(`fastHire_jobs_${user.id}`);
        if (storedJobsStr) {
          const parsed = JSON.parse(storedJobsStr);
          if (Array.isArray(parsed)) {
            const validJobs = parsed.filter(
              (j: any) => j && typeof j === "object" && (String(j.company || "").trim() || String(j.title || "").trim())
            );
            const totalCount = validJobs.length;
            const savedCount = validJobs.filter((j: any) => j.status === "wishlist" || j.status === "saved").length;
            const appliedCount = validJobs.filter((j: any) => j.status === "applied").length;
            const interviewCount = validJobs.filter((j: any) => j.status === "interviewing" || j.status === "interview").length;
            const offerCount = validJobs.filter((j: any) => j.status === "offered" || j.status === "offer").length;
            const upcoming = validJobs.find((j: any) => (j.status === "interviewing" || j.status === "interview") && j.date);
            setJobTrackerStats({
              total: totalCount,
              saved: savedCount,
              applied: appliedCount,
              interview: interviewCount,
              offer: offerCount,
              nextInterview: upcoming ? upcoming.date : null,
            });
            return;
          }
        }
        setJobTrackerStats({
          total: 0,
          saved: 0,
          applied: 0,
          interview: 0,
          offer: 0,
          nextInterview: null,
        });
      } catch (e) {
        setJobTrackerStats({
          total: 0,
          saved: 0,
          applied: 0,
          interview: 0,
          offer: 0,
          nextInterview: null,
        });
      }
    };

    window.addEventListener("focus", syncStats);
    window.addEventListener("storage", syncStats);
    window.addEventListener("fastHire_jobs_updated", syncStats);
    return () => {
      window.removeEventListener("focus", syncStats);
      window.removeEventListener("storage", syncStats);
      window.removeEventListener("fastHire_jobs_updated", syncStats);
    };
  }, [user?.id]);

  // Listen for SIGNED_OUT event so that logging out never leaves user on /dashboard
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any) => {
      if (event === "SIGNED_OUT") {
        const isMobile =
          typeof window !== "undefined" &&
          (window.innerWidth < 768 ||
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
              navigator.userAgent
            ));
        window.location.href = isMobile ? "/auth/login" : "/";
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const runAIAutoImprove = async (
    targetResumeText = resumeText,
    optimizationInstructions = instructions,
  ) => {
    if (!targetResumeText.trim() || !jobDescription.trim()) {
      setValidationMessage("Please provide both resume text and job description.");
      return;
    }
    setValidationMessage(null);

    setActiveOptimizationText(targetResumeText);
    setActiveOptimizationInstructions(optimizationInstructions);
    setOriginalResumeSnapshot(targetResumeText);
    setOptimizing(true);
    setBeforeScore(null);
    setAfterScore(null);
    setOptimizeResult(null);
    setTrackerAdded(false);
    setBulletImprovementsCount(0);
    clearActiveSession();

    // Clear detail view states
    setRoadmapContent(null);
    setSelectedRoadmapSkills([]);
    setCoverLetterGenerated(null);
    setShowRoadmapAccordion(false);
    setShowCoverLetterAccordion(false);
  };

  const handleOptimizationComplete = (data: any) => {
    const finalData = {
      ...data,
      originalText: data.originalText || originalResumeSnapshot || activeOptimizationText,
    };
    setOptimizeResult(finalData);
    setViewMode("result");

    // Store resumeId so subsequent bullet improvements can patch the history record
    const targetResumeId = data?.resumeId || data?.id;
    if (targetResumeId) {
      setCurrentResumeId(targetResumeId);
    }

    // Scores returned from the pipeline
    if (data.scoreBefore) setBeforeScore(data.scoreBefore);
    if (data.scoreAfter) setAfterScore(data.scoreAfter);

    setShowPlaceholderFiller(false);
    setPendingPlaceholders([]);

    setOptimizing(false);

    // Save active optimization session so page reload / refresh keeps the result view intact
    saveActiveSession({
      result: finalData,
      beforeScore: data.scoreBefore || null,
      afterScore: data.scoreAfter || null,
      resumeId: targetResumeId || undefined,
      resumeText: activeOptimizationText || originalResumeSnapshot || "", // Store the original text for accurate diff highlights
      jobDescription: "", // Do not retain old input text in storage
      trackerAdded: false,
      userId: user?.id,
    });

    // Clear input fields and active states so after optimization inputs are reset cleanly
    setResumeText("");
    setJobDescription("");
    setActiveOptimizationText("");
    setActiveOptimizationInstructions("");
    try {
      localStorage.removeItem(ACTIVE_KEYS.RESUME_TEXT);
      sessionStorage.removeItem(ACTIVE_KEYS.RESUME_TEXT);
      localStorage.removeItem(ACTIVE_KEYS.JOB_DESCRIPTION);
      sessionStorage.removeItem(ACTIVE_KEYS.JOB_DESCRIPTION);
    } catch {}

    // Small delay before scrolling to results
    setTimeout(() => {
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
  };

  const handleOptimize = async () => {
    setValidationMessage(null);
    if (!resumeText?.trim()) {
      setValidationMessage("Please add your resume first.");
      return;
    }
    if (!jobDescription?.trim()) {
      setValidationMessage("Please paste the job description to match against.");
      return;
    }

    const hasAvailableCredits =
      (userCredits?.paidCredits && userCredits.paidCredits > 0) ||
      (userCredits?.freeRemaining && userCredits.freeRemaining > 0);

    if (
      !hasAvailableCredits &&
      userPlan === "free" &&
      userCredits &&
      (userCredits.freeRemaining <= 0)
    ) {
      useUpgradeModalStore.getState().openModal({
        badge: "UPGRADE REQUIRED",
        title: "Free Optimizations Used Up",
        description:
          "You have used your free optimizations. Upgrade to Premium Pro (20 optimizations) or Pro Max (90 optimizations) to continue.",
      });
      return;
    }

    // Launch the ongoing optimization pipeline directly!
    // Any missing metrics are detected & queried seamlessly in the middle of progress.
    runAIAutoImprove(resumeText, instructions);
  };

  const handleBulletEnrichmentSubmit = (answers: Record<string, string>) => {
    setShowBulletModal(false);

    const enrichmentLines = weakBullets
      .map((b) => {
        const ans = answers[b.id]?.trim();
        if (ans) {
          return `[User Added Metric for "${b.originalBullet}"]: ${ans}`;
        }
        return null;
      })
      .filter(Boolean);

    let enriched = pendingResumeText;
    if (enrichmentLines.length > 0) {
      enriched += `\n\n--- USER SUPPLEMENTAL METRICS (integrate these into the exact bullets) ---\n${enrichmentLines.join("\n")}`;
    }

    runAIAutoImprove(enriched, instructions);
  };

  const handleBulletEnrichmentCancel = () => {
    setShowBulletModal(false);
    runAIAutoImprove(pendingResumeText, instructions);
  };

  const handleReset = () => {
    clearActiveSession();
    resetStore();
    setInstructions("");
    setLengthOption("Auto-detect");
    setBeforeScore(null);
    setAfterScore(null);
    setOptimizeResult(null);
    setOriginalResumeSnapshot("");
    setCurrentResumeId(null);
    setTrackerAdded(false);
    setBulletImprovementsCount(0);
    // silent clear — user can see the cleared workspace
  };

  const handleReScoreBefore = async (
    newText: string,
    currentImprovementsCount?: number,
  ) => {
    const impCount = currentImprovementsCount ?? bulletImprovementsCount;
    const targetId =
      currentResumeId || optimizeResult?.resumeId || optimizeResult?.id;

    try {
      let newScoreData: any = null;

      try {
        const afterRes = await fetch("/api/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resumeText: newText,
            jobDescription,
            scoreBefore: beforeScore?.overall,
            bulletImprovementsCount: impCount,
          }),
        });
        if (afterRes.ok) {
          newScoreData = await afterRes.json();
        }
      } catch (scoreErr) {
        console.error("Score refresh error:", scoreErr);
      }

      // Guard: bullet improvement must NEVER reduce the score below current afterScore
      if (newScoreData && afterScore?.overall) {
        if (newScoreData.overall < afterScore.overall) {
          newScoreData.overall = afterScore.overall;
          newScoreData.keywordMatch = Math.max(afterScore.keywordMatch || 0, newScoreData.keywordMatch);
          newScoreData.impactBullets = Math.max(afterScore.impactBullets || 0, newScoreData.impactBullets);
        }
      }

      const dynamicScore = newScoreData || afterScore;
      setAfterScore(dynamicScore);

      // Immediately reflect improved text & dynamic score in local optimizeResult state
      setOptimizeResult((prev: any) => {
        const updated = prev
          ? {
              ...prev,
              optimizedText: newText,
              scoreAfter: dynamicScore,
              resumeId: targetId || prev.resumeId,
            }
          : prev;
        if (updated) {
          saveActiveSession({
            result: updated,
            afterScore: dynamicScore,
            resumeId: targetId || undefined,
            userId: user?.id,
          });
        }
        return updated;
      });

      // Persist updated scoreAfter and optimizedText to history DB via PATCH
      if (targetId && dynamicScore?.overall) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData?.session?.access_token;
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          };
          if (accessToken) {
            headers["Authorization"] = `Bearer ${accessToken}`;
          }

          await fetch("/api/history", {
            method: "PATCH",
            headers,
            body: JSON.stringify({
              resumeId: targetId,
              scoreAfter: dynamicScore.overall,
              optimizedText: newText,
            }),
          });
        } catch (patchErr) {
          console.error("Failed to patch history:", patchErr);
        }

        // Also update the local storage history cache so navigating to History immediately reflects the improvement
        if (user?.id) {
          try {
            const cacheKey = `fastHire_history_cache_${user.id}`;
            const cachedStr = localStorage.getItem(cacheKey);
            if (cachedStr) {
              const cached = JSON.parse(cachedStr);
              if (Array.isArray(cached)) {
                const updated = cached.map((r: any) =>
                  r.id === targetId
                    ? {
                        ...r,
                        scoreAfter: dynamicScore.overall,
                        optimizedText: newText,
                      }
                    : r,
                );
                localStorage.setItem(cacheKey, JSON.stringify(updated));
              }
            }
          } catch {}
        }
      }
    } catch (e) {
      console.error("Error updating score and history:", e);
    }
  };

  const handleAddToTracker = () => {
    if (!user || !optimizeResult) return;
    const currentJobsString =
      localStorage.getItem(`fastHire_jobs_${user.id}`) || "[]";
    let currentJobs = [];
    try {
      currentJobs = JSON.parse(currentJobsString);
    } catch (e) {
      currentJobs = [];
    }

    const newJob = {
      id: Math.random().toString(36).substr(2, 9),
      company: optimizeResult.company || "General Application",
      title: optimizeResult.jobTitle || "Optimized Resume",
      date: new Date().toISOString().split("T")[0],
      status: "applied" as const,
      notes: "Added automatically from optimization results screen.",
    };

    localStorage.setItem(
      `fastHire_jobs_${user.id}`,
      JSON.stringify([newJob, ...currentJobs]),
    );
    setTrackerAdded(true);
    saveActiveSession({
      trackerAdded: true,
      userId: user?.id,
    });
  };

  const availableSkills = React.useMemo(() => {
    return Array.from(new Set([
      ...(optimizeResult?.keywordsAdded || []),
      ...(afterScore?.missingKeywords || []),
      ...extractTechTerms(jobDescription || ""),
      ...extractTechTerms(optimizeResult?.optimizedText || "")
    ]))
      .filter((s) => s && s.length > 1 && isTechnicalKeyword(s))
      .slice(0, 16);
  }, [optimizeResult, afterScore, jobDescription]);

  const currentResumeText = optimizeResult?.optimizedText || resumeText || "";
  const scorableBullets = React.useMemo(() => {
    return extractScorableBullets(currentResumeText);
  }, [currentResumeText]);

  const bulletsNeedingImprovementCount = React.useMemo(() => {
    return scorableBullets.filter((b) => {
      const clean = cleanBulletText(b.rawLine);
      const hasVerb = hasStrongActionVerb(clean);
      const hasMetric = hasQuantifiedMetric(clean);
      return !hasVerb || !hasMetric;
    }).length;
  }, [scorableBullets]);

  const handleOptimizeAnother = () => {
    clearActiveSession();
    resetStore();
    setOptimizeResult(null);
    setBeforeScore(null);
    setAfterScore(null);
    setOriginalResumeSnapshot("");
    setResumeText("");
    setJobDescription("");
    setInstructions("");
    setSelectedRoadmapSkills([]);
    setRoadmapContent(null);
    setCoverLetterGenerated(null);
    setTrackerAdded(false);
    setIsSavedToResumes(false);
    setViewMode("editor");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleRoadmapSkill = (skill: string) => {
    if (selectedRoadmapSkills.includes(skill)) {
      setSelectedRoadmapSkills(
        selectedRoadmapSkills.filter((s) => s !== skill),
      );
    } else {
      if (selectedRoadmapSkills.length >= 3) {
        toast.error(
          "You can select up to 3 skills for your comprehensive roadmap.",
        );
        return;
      }
      setSelectedRoadmapSkills([...selectedRoadmapSkills, skill]);
    }
  };

  const handleGenerateRoadmap = async () => {
    const isOwner =
      userPlan === "owner" || (user?.email && isOwnerEmail(user.email));
    if (userPlan === "free" && !isOwner) {
      useUpgradeModalStore.getState().openModal({
        badge: "PRO",
        title: "Unlock AI Skill Learning Roadmaps",
        description:
          "Skills learning roadmaps are a Pro & Pro Max feature. Please upgrade your plan to unlock instant career roadmaps!",
      });
      return;
    }

    if (selectedRoadmapSkills.length === 0) {
      toast.error(
        "Please select at least 1 skill (up to 3) to generate your roadmap.",
      );
      return;
    }

    if (!isOwner) {
      const monthKey = new Date().toISOString().slice(0, 7); // "YYYY-MM"
      const limit = userPlan === "premium" ? 5 : 15;
      const storageKey = `fastHire_roadmaps_count_${user?.id || "anon"}_${monthKey}`;
      const currentCount = parseInt(
        localStorage.getItem(storageKey) || "0",
        10,
      );

      if (currentCount >= limit) {
        useUpgradeModalStore.getState().openModal({
          badge: "PRO",
          title: "Roadmap Quota Reached",
          description: `You have reached your monthly limit of ${limit} roadmaps for the ${userPlan === "premium" ? "Premium Pro" : "Pro Max"} plan. Upgrade to unlock more roadmaps and 90 optimizations/month.`,
        });
        return;
      }
      localStorage.setItem(storageKey, (currentCount + 1).toString());
    }

    setRoadmapLoading(true);
    setRoadmapContent(null);
    try {
      const res = await fetch("/api/skill-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills: selectedRoadmapSkills }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to generate roadmap.");
      }
      const content: string = data.roadmap;
      setRoadmapContent(content);
      saveActiveSession({
        roadmapContent: content,
        userId: user?.id,
      });

      const targetId = currentResumeId || optimizeResult?.resumeId || optimizeResult?.id;
      if (targetId) {
        if (typeof window !== "undefined") {
          localStorage.setItem(`fastHire_roadmap_${targetId}`, content);
        }
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData?.session?.access_token;
          const headers: Record<string, string> = { "Content-Type": "application/json" };
          if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

          fetch("/api/history", {
            method: "PATCH",
            headers,
            body: JSON.stringify({ resumeId: targetId, roadmap: content }),
          }).catch(() => {});
        } catch (_e) {}
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to generate learning roadmap.");
    } finally {
      setRoadmapLoading(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    const isOwner =
      userPlan === "owner" || (user?.email && isOwnerEmail(user.email));
    if (!isOwner) {
      const monthKey = new Date().toISOString().slice(0, 7); // "YYYY-MM"
      const limit = userPlan === "free" ? 1 : userPlan === "premium" ? 5 : 15;
      const storageKey = `fastHire_coverLetters_count_${user?.id || "anon"}_${monthKey}`;
      const currentCount = parseInt(
        localStorage.getItem(storageKey) || "0",
        10,
      );

      if (currentCount >= limit) {
        useUpgradeModalStore.getState().openModal({
          badge: "PRO",
          title: "Cover Letter Limit Reached",
          description: `You have reached your limit of ${limit} cover letters for the ${userPlan === "free" ? "Free" : userPlan === "premium" ? "Premium Pro" : "Pro Max"} plan. Please upgrade to unlock more cover letters and 90 optimizations/month.`,
        });
        return;
      }
      localStorage.setItem(storageKey, (currentCount + 1).toString());
    }

    setGeneratingLetter(true);
    try {
      const res = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: optimizeResult?.optimizedText || resumeText,
          jobDescription,
          jobTitle: optimizeResult?.jobTitle,
          company: optimizeResult?.company,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate cover letter.");
      }

      const data = await res.json();
      setCoverLetterGenerated(data.coverLetter);
      saveActiveSession({
        coverLetter: data.coverLetter,
        userId: user?.id,
      });

      const targetId = currentResumeId || optimizeResult?.resumeId || optimizeResult?.id;
      if (targetId) {
        if (typeof window !== "undefined") {
          localStorage.setItem(`fastHire_coverLetter_${targetId}`, data.coverLetter);
        }
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData?.session?.access_token;
          const headers: Record<string, string> = { "Content-Type": "application/json" };
          if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

          fetch("/api/history", {
            method: "PATCH",
            headers,
            body: JSON.stringify({ resumeId: targetId, coverLetter: data.coverLetter }),
          }).catch(() => {});
        } catch (_e) {}
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to generate cover letter.");
    } finally {
      setGeneratingLetter(false);
    }
  };

  if (authLoading) {
    return <DashboardSkeleton />;
  }

  const hasResults = !optimizing && (optimizeResult || beforeScore);
  const showResults = hasResults && optimizeResult && viewMode === "result";
  const delta =
    afterScore && beforeScore ? afterScore.overall - beforeScore.overall : 0;

  const isScoreLow = (afterScore?.overall ?? 0) < 75;
  const shouldShowBulletImprover = bulletsNeedingImprovementCount > 0 || isScoreLow;

  return (
    <div className="flex flex-col min-h-screen bg-transparent text-[#111827] font-sans">
      <Navbar refreshKey={refreshKey} />

      <main className="relative flex-1 mx-auto max-w-[1280px] w-full px-3.5 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-28 sm:pb-8">

        {/* ── LOADING OVERLAY ─────────────────────────────────────── */}
        {optimizing && (
          <div className="fixed inset-0 bg-white/98 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 select-none overflow-y-auto min-h-screen">
            <div className="w-full max-w-[560px] mx-auto py-4 sm:py-6 my-auto">
              <OptimizingProgress
                onComplete={handleOptimizationComplete}
                onError={(err) => {
                  toast.error(err);
                  setOptimizing(false);
                }}
                resumeText={activeOptimizationText || resumeText}
                jobDescription={jobDescription}
                instructions={activeOptimizationInstructions || instructions}
              />
            </div>
          </div>
        )}

        {/* Results header or editor title block */}
        {showResults ? (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none">
            {/* Score improvement headline */}
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#111827] tracking-tight">
                Score improved{" "}
                <span className="text-[#526176]">
                  {beforeScore?.overall ?? 0}%
                </span>{" "}
                to{" "}
                <span className="text-[#087F6E]">
                  {afterScore?.overall ?? 0}%
                </span>
              </h1>
              {delta > 0 && (
                <span className="text-xs font-black px-3 py-1 rounded-full bg-[#E5F8F5] text-[#087F6E] border border-[#D4F3EF]">
                  +{delta} points
                </span>
              )}
            </div>
            {/* Actions — responsive on mobile: old clean layout with + Job Tracker, Start Over, History */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
              {/* Clear Saving Option for Optimized Resume */}
              <Button
                onClick={handleSaveToResumes}
                disabled={savingToResumes || isSavedToResumes}
                size="sm"
                className={`flex-1 sm:flex-none text-xs font-bold h-9 rounded-md px-3.5 shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  isSavedToResumes
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100"
                    : "bg-[#087F6E] hover:bg-[#065F53] text-white"
                }`}
              >
                {savingToResumes ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : isSavedToResumes ? (
                  <BookmarkCheck className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <BookmarkPlus className="h-3.5 w-3.5" />
                )}
                <span>{isSavedToResumes ? "Saved in Resumes" : "Save to My Resumes"}</span>
              </Button>

              <Button
                onClick={() => {
                  if (trackerAdded) {
                    router.push("/dashboard/job-tracker");
                  } else {
                    handleAddToTracker();
                  }
                }}
                size="sm"
                className="flex-1 sm:flex-none bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold h-9 rounded-md px-3.5 shadow-xs transition-all cursor-pointer flex items-center justify-center"
              >
                <span>{trackerAdded ? "In Tracker" : "Add to Tracker"}</span>
              </Button>

              <Button
                onClick={handleOptimizeAnother}
                size="sm"
                className="flex-1 sm:flex-none bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold h-9 rounded-md px-3.5 shadow-xs transition-all cursor-pointer flex items-center justify-center"
              >
                <span>Start Over</span>
              </Button>

              <Link href="/dashboard/history" className="flex-1 sm:flex-none">
                <Button
                  size="sm"
                  className="w-full bg-[#111827] hover:bg-slate-800 text-white text-xs font-semibold h-9 rounded-md px-3.5 shadow-xs flex items-center justify-center"
                >
                  History
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Header Title Block */
          <div className="text-center space-y-2.5 sm:space-y-3 mb-6 sm:mb-8 select-none">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-[#111827] tracking-tight leading-[1.2] sm:leading-[1.15]">
              Improve Your Resume{" "}
              <span className="bg-gradient-to-r from-[#087F6E] via-[#075E53] to-[#087F6E] bg-clip-text text-transparent">
                for Any Job
              </span>
            </h1>
            <p className="text-xs sm:text-base text-[#526176] max-w-xl mx-auto font-normal leading-relaxed px-2">
              Paste your resume and the job you want. We improve it to match
              &mdash; automatically. Get 2 free resumes per month.
            </p>
            <div>
              <Badge className="bg-[#E5F8F5] border border-[#D4F3EF] text-[#087F6E] hover:bg-[#E5F8F5] px-3 sm:px-3.5 py-1 sm:py-1.5 text-[11px] sm:text-xs rounded-full font-semibold select-none">
                +1 extra resume for each referral
              </Badge>
            </div>
          </div>
        )}

        {/* WORKSPACE CONTENT SECTION */}
        {showResults ? (
          /* RESULTS WORKSPACE ROW */
          <div ref={resultsRef} className="space-y-6">

            {/* ATS Optimization Complete banner */}
            <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-xl flex items-center gap-3 select-none shadow-sm">
              <div>
                <h2 className="text-sm font-black text-slate-900 tracking-tight">
                  ATS Optimization Complete
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  Your resume has been optimized with target keywords and
                  metrics.
                </p>
              </div>
            </div>

            {/* Top Row: Edit & review workspace split (Score gauges & PDF Preview) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start mb-6">
              {/* Left Column: ATS Score circle gauges and keywords */}
              <ScrollFadeIn
                direction="left"
                className="lg:col-span-5 space-y-4 sm:space-y-6"
              >
                {/* Score circular gauges (like in History DetailView) */}
                <Card className="border-slate-200 bg-white shadow-sm rounded-xl overflow-hidden">
                  <CardContent className="p-3.5 sm:p-6 space-y-4 sm:space-y-5">
                    <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider select-none">
                      ATS Match Score Comparison
                    </h3>

                    <div className="flex items-center justify-around gap-2 sm:gap-4 bg-slate-50 border border-slate-100 rounded-xl p-3 sm:p-5">
                      <CircleGauge
                        value={beforeScore?.overall || 0}
                        label="Original"
                        size={76}
                      />
                      <div className="flex flex-col items-center gap-1 shrink-0 select-none">
                        <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0d6e5a]">
                          <span className="text-[10px] font-black text-[#0d6e5a]">VS</span>
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-black text-[#0d6e5a]">
                          +{delta} pts
                        </span>
                      </div>
                      <CircleGauge
                        value={afterScore?.overall || 0}
                        label="Optimized"
                        size={76}
                      />
                    </div>

                    <p className="text-[10px] text-slate-500 leading-relaxed font-semibold bg-slate-50 p-2 sm:p-2.5 rounded-lg border border-slate-100 text-center select-none">
                      Industry Standard ATS Scorer Rubric. Overlap analysis
                      shows your keyword matching has been successfully
                      enhanced.
                    </p>
                  </CardContent>
                </Card>

                {/* Keywords Badges */}
                {afterScore && (
                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-5 shadow-sm select-none">
                    <KeywordBadges
                      added={optimizeResult?.keywordsAdded || []}
                      found={
                        optimizeResult?.alreadyInResume ||
                        beforeScore?.foundKeywords ||
                        afterScore?.foundKeywords ||
                        []
                      }
                    />
                  </div>
                )}

              </ScrollFadeIn>

              {/* Right Column: AI Optimized styled Preview */}
              <ScrollFadeIn
                direction="right"
                className="lg:col-span-7 space-y-4"
              >
                <ResumeViewer
                  text={optimizeResult.optimizedText}
                  originalText={originalResumeSnapshot || optimizeResult?.originalText || resumeText}
                  resumeId={optimizeResult.resumeId}
                  jobDescription={jobDescription}
                  userId={user?.id || ""}
                  userPlan={userPlan}
                  jobTitle={optimizeResult.jobTitle || ""}
                />
              </ScrollFadeIn>
            </div>

            {/* Interactive Bullet Point Improver (Hidden if all bullets pass and score is good, shown if low score or needs improvement) */}
            {shouldShowBulletImprover && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Interactive Bullet Point Improver
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Scan and optimize individual bullet points on your resume text. We identify missing action verbs and metrics.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 sm:p-5">
                  <BulletImprover
                    resumeText={optimizeResult?.optimizedText || resumeText}
                    jobDescription={jobDescription}
                    userId={user?.id || ""}
                    userPlan={userPlan}
                    onChange={(newText, wasImproved) => {
                      setOptimizeResult((prev: any) =>
                        prev ? { ...prev, optimizedText: newText } : prev,
                      );
                      let newCount = bulletImprovementsCount;
                      if (wasImproved) {
                        newCount += 1;
                        setBulletImprovementsCount(newCount);
                      }
                      handleReScoreBefore(newText, newCount);
                    }}
                  />
                </div>
              </div>
            )}

            {/* ─── NEXT STEP CAREER ACCELERATORS ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                href="/dashboard/cover-letter"
                className="bg-white hover:bg-teal-50/50 border border-slate-200 hover:border-teal-300 rounded-2xl p-4 transition-all shadow-xs group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="h-7 w-7 rounded-lg bg-teal-50 text-[#087F6E] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <FileText className="h-4 w-4" />
                  </div>
                  <span className="font-extrabold text-xs text-slate-900 group-hover:text-[#087F6E] transition-colors">
                    Cover Letter Studio
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Draft a personalized, high-converting letter tailored to this JD.
                </p>
              </Link>

              <Link
                href="/dashboard/mock-interview"
                onClick={(e: React.MouseEvent) => {
                  if (!isOwner && userPlan !== "promax") {
                    e.preventDefault();
                    useUpgradeModalStore.getState().openModal({
                      badge: "MAX",
                      title: "Unlock AI Mock Interview Coach",
                      description: "AI Mock Interview Coach is exclusively available for Pro Max members. Upgrade to Pro Max to simulate role-specific STAR questions and get instant AI feedback.",
                    });
                  }
                }}
                className={`relative rounded-2xl p-4 transition-all shadow-xs border ${
                  !isOwner && userPlan !== "promax"
                    ? "bg-slate-50/40 border-slate-200/50 opacity-50 cursor-pointer"
                    : "bg-white hover:bg-teal-50/50 border-slate-200 hover:border-teal-300 group cursor-pointer"
                }`}
              >
                {!isOwner && userPlan !== "promax" && (
                  <span className="absolute top-3.5 right-3.5 text-[10px] font-semibold text-black bg-[#f1f5f9] border border-slate-200/80 px-2 py-0.5 rounded-full tracking-normal">
                    MAX
                  </span>
                )}
                <div className="flex items-center gap-2.5 mb-1.5 pr-16">
                  <div className={`h-7 w-7 rounded-lg flex items-center justify-center transition-transform ${
                    !isOwner && userPlan !== "promax"
                      ? "bg-slate-100 text-slate-400"
                      : "bg-teal-50 text-[#087F6E] group-hover:scale-105"
                  }`}>
                    <Target className="h-4 w-4" />
                  </div>
                  <span className={`font-extrabold text-xs transition-colors ${
                    !isOwner && userPlan !== "promax"
                      ? "text-slate-700"
                      : "text-slate-900 group-hover:text-[#087F6E]"
                  }`}>
                    Mock Interview Simulator
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Practice role-specific STAR questions generated from this job.
                </p>
              </Link>

              <Link
                href="/dashboard/linkedin-optimizer"
                onClick={(e: React.MouseEvent) => {
                  if (!isOwner && userPlan !== "promax") {
                    e.preventDefault();
                    useUpgradeModalStore.getState().openModal({
                      badge: "MAX",
                      title: "Unlock LinkedIn Profile Optimizer",
                      description: "LinkedIn Profile Optimizer is exclusively available for Pro Max members. Upgrade to Pro Max to optimize your headline, bio, and recruiter search rankings.",
                    });
                  }
                }}
                className={`relative rounded-2xl p-4 transition-all shadow-xs border ${
                  !isOwner && userPlan !== "promax"
                    ? "bg-slate-50/40 border-slate-200/50 opacity-50 cursor-pointer"
                    : "bg-white hover:bg-teal-50/50 border-slate-200 hover:border-teal-300 group cursor-pointer"
                }`}
              >
                {!isOwner && userPlan !== "promax" && (
                  <span className="absolute top-3.5 right-3.5 text-[10px] font-semibold text-black bg-[#f1f5f9] border border-slate-200/80 px-2 py-0.5 rounded-full tracking-normal">
                    MAX
                  </span>
                )}
                <div className="flex items-center gap-2.5 mb-1.5 pr-16">
                  <div className={`h-7 w-7 rounded-lg flex items-center justify-center transition-transform ${
                    !isOwner && userPlan !== "promax"
                      ? "bg-slate-100 text-slate-400"
                      : "bg-teal-50 text-[#087F6E] group-hover:scale-105"
                  }`}>
                    <LinkedInIcon className="h-4 w-4" />
                  </div>
                  <span className={`font-extrabold text-xs transition-colors ${
                    !isOwner && userPlan !== "promax"
                      ? "text-slate-700"
                      : "text-slate-900 group-hover:text-[#087F6E]"
                  }`}>
                    LinkedIn Optimizer
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Rank #1 in recruiter searches with optimized headlines and bio.
                </p>
              </Link>
            </div>

            {/* ─── SKILL ROADMAP & COVER LETTER (Matching History Style) ─── */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              {/* Tabs Bar */}
              <div className="flex items-center gap-6 border-b border-slate-200 pb-px">
                <button
                  type="button"
                  onClick={() => setResultsSubTab("roadmap")}
                  className={`flex items-center gap-2 py-3 px-1 text-xs font-bold transition-all relative border-b-2 cursor-pointer ${
                    resultsSubTab === "roadmap"
                      ? "border-[#087F6E] text-[#087F6E]"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <span>Skills Learning Roadmap</span>
                </button>

                <button
                  type="button"
                  onClick={() => setResultsSubTab("cover_letter")}
                  className={`flex items-center gap-2 py-3 px-1 text-xs font-bold transition-all relative border-b-2 cursor-pointer ${
                    resultsSubTab === "cover_letter"
                      ? "border-[#087F6E] text-[#087F6E]"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <span>Tailored Cover Letter</span>
                </button>
              </div>

              {/* ─── TAB 1: SKILL LEARNING ROADMAP ─── */}
              {resultsSubTab === "roadmap" && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                        Skills Learning Roadmap
                        {userPlan === "free" && (
                          <span className="text-[10px] font-semibold text-black bg-[#f1f5f9] border border-slate-200/80 px-2 py-0.5 rounded-full tracking-normal inline-flex items-center">
                            PRO
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Select up to 3 skills to build a complete 90-day learning curriculum
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#0d6e5a] bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                      {selectedRoadmapSkills.length}/3 Selected
                    </span>
                  </div>

                  {/* Skill Chips */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Choose up to 3 target skills:
                    </span>
                    <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto pr-1">
                      {(availableSkills.length > 0
                        ? availableSkills
                        : ["Machine Learning", "Generative AI", "Python", "SQL", "Docker"]
                      ).map((skill, i) => {
                        const isSelected = selectedRoadmapSkills.includes(skill);
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => toggleRoadmapSkill(skill)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all border flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? "bg-[#0d6e5a] border-[#0d6e5a] text-white font-bold shadow-xs"
                                : "bg-white border-slate-200 text-slate-800 hover:text-slate-950 hover:border-slate-300"
                            }`}
                          >
                            {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                            {skill}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action Row */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
                    <span className="text-xs text-slate-500">
                      {selectedRoadmapSkills.length === 0
                        ? "Click 1 to 3 skills above to build your roadmap."
                        : `Selected: ${selectedRoadmapSkills.join(", ")}`}
                    </span>
                    <Button
                      onClick={handleGenerateRoadmap}
                      disabled={selectedRoadmapSkills.length === 0 || roadmapLoading}
                      className="bg-[#0d6e5a] hover:bg-[#094d3f] text-white font-bold text-xs h-9 px-4 rounded-md shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {roadmapLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Generate Complete Roadmap ({selectedRoadmapSkills.length}/3)
                    </Button>
                  </div>

                  {/* Loading state */}
                  {roadmapLoading && (
                    <div className="flex items-center gap-2.5 text-xs text-slate-600 py-8 justify-center bg-slate-50 border border-slate-200 rounded-xl">
                      <Loader2 className="h-4 w-4 animate-spin text-[#0d6e5a]" />
                      <span>Synthesizing tailored 90-day curriculum for {selectedRoadmapSkills.join(", ")}...</span>
                    </div>
                  )}

                  {/* Generated roadmap output */}
                  {roadmapContent && (
                    <div className="space-y-3">
                      <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl text-xs text-slate-900 leading-relaxed font-sans shadow-xs select-text">
                        <pre className="whitespace-pre-wrap font-sans text-slate-900 select-text">{roadmapContent}</pre>
                      </div>
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(roadmapContent);
                        }}
                        className="bg-white border border-slate-200 text-slate-800 hover:text-slate-950 hover:bg-slate-50 text-xs h-8 rounded-md shadow-xs cursor-pointer font-bold"
                      >
                        Copy Roadmap
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* ─── TAB 2: TAILORED COVER LETTER ─── */}
              {resultsSubTab === "cover_letter" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-black text-slate-900">Tailored Cover Letter Generator</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Generate a personalized cover letter aligned with this job specification
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    RoleFuse uses your optimized resume highlights and target job description to draft an executive-level cover letter.
                  </p>

                  {!coverLetterGenerated && !generatingLetter && (
                    <Button
                      onClick={handleGenerateCoverLetter}
                      className="bg-[#0d6e5a] hover:bg-[#094d3f] text-white font-bold text-xs h-9 px-5 rounded-md shadow-xs transition-colors cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      Generate Cover Letter
                    </Button>
                  )}

                  {generatingLetter && (
                    <div className="flex items-center gap-2.5 text-xs text-slate-600 py-8 justify-center bg-slate-50 border border-slate-200 rounded-xl">
                      <Loader2 className="h-4 w-4 animate-spin text-[#0d6e5a]" />
                      <span>Drafting tailored cover letter...</span>
                    </div>
                  )}

                  {coverLetterGenerated && (
                    <div className="space-y-3 select-text">
                      <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl text-xs text-slate-900 leading-relaxed font-serif shadow-xs select-text">
                        <pre className="whitespace-pre-wrap font-serif text-slate-900 select-text">{coverLetterGenerated}</pre>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          onClick={() => {
                            navigator.clipboard.writeText(coverLetterGenerated);
                          }}
                          className="bg-white border border-slate-200 text-slate-800 hover:text-slate-950 hover:bg-slate-50 text-xs h-8 rounded-md shadow-xs cursor-pointer font-bold"
                        >
                          Copy Cover Letter
                        </Button>
                        <Link href="/dashboard/cover-letter">
                          <Button
                            variant="outline"
                            className="text-xs h-8 rounded-md font-bold text-[#087F6E] border-teal-200 hover:bg-teal-50"
                          >
                            Open in Dedicated Studio &rarr;
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── INPUT WORKSPACE ──────────────────────────────────── */
          <div className="space-y-4 sm:space-y-5 max-w-5xl mx-auto select-none">
            {/* Split-panel: Resume | Job Description (Equal size and width, side-by-side) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-stretch w-full">
              {/* Resume Card */}
              <div className="group flex-1 flex flex-col bg-white border border-[#DCE7E9] hover:border-[#087F6E]/50 rounded-2xl p-4 sm:p-6 transition-colors duration-200 shadow-xs">
                <ResumeInput
                  value={resumeText}
                  onChange={setResumeText}
                  disabled={optimizing}
                  onOpenSavedResumes={() => setIsSavedResumesOpen(true)}
                />
              </div>

              {/* Job Description Card */}
              <div className="group flex-1 flex flex-col bg-white border border-[#DCE7E9] hover:border-[#087F6E]/50 rounded-2xl p-4 sm:p-6 transition-colors duration-200 shadow-xs">
                <JobDescriptionInput
                  value={jobDescription}
                  onChange={setJobDescription}
                  disabled={optimizing}
                />
              </div>
            </div>

            {/* Custom optimization instructions card */}
            <div className="bg-white border border-[#DCE7E9] rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4 shadow-xs">
              <div className="flex items-center gap-2">
                <h4 className="font-heading font-bold text-xs sm:text-sm text-[#111827]">
                  Custom Guidance{" "}
                  <span className="text-[#526176] font-normal">(Optional)</span>
                </h4>
              </div>
              <input
                type="text"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. 'Emphasize engineering scale' or 'Keep it concise' or 'Focus on leadership'"
                className="w-full h-10 bg-white text-[#111827] border border-[#DCE7E9] focus:border-[#087F6E] focus:ring-2 focus:ring-[#087F6E]/20 rounded-xl px-3.5 text-xs font-normal focus:outline-none"
              />
            </div>

            {/* Resume Length card */}
            <div className="bg-white border border-[#DCE7E9] rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4 shadow-xs">
              <div className="flex items-center gap-2">
                <h4 className="font-heading font-bold text-xs sm:text-sm text-[#111827]">
                  Resume Length
                </h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {[
                  {
                    value: "Auto-detect",
                    label: "Auto-detect",
                    sub: "Let AI decide",
                  },
                  {
                    value: "1 Page",
                    label: "1 Page",
                    sub: "Fresher / under 5 yrs",
                  },
                  {
                    value: "2 Pages",
                    label: "2 Pages",
                    sub: "5-10+ yrs experience",
                  },
                  {
                    value: "Academic CV",
                    label: "Academic CV",
                    sub: "PhD / research / academia",
                  },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setLengthOption(opt.value)}
                    className={`flex flex-col items-start gap-1 sm:gap-1.5 rounded-xl p-2.5 sm:p-3.5 border text-left transition-all duration-200 cursor-pointer ${
                      lengthOption === opt.value
                        ? "bg-[#E5F8F5] border-[#087F6E] shadow-xs"
                        : "bg-white border-[#DCE7E9] hover:border-[#087F6E]/40 hover:bg-[#F5FAFA]"
                    }`}
                  >
                    <div>
                      <span
                        className={`text-xs font-bold block ${
                          lengthOption === opt.value
                            ? "text-[#087F6E]"
                            : "text-[#111827]"
                        }`}
                      >
                        {opt.label}
                      </span>
                      <span className="text-[10px] text-[#526176] font-normal leading-tight block mt-0.5 sm:mt-1">
                        {opt.sub}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Inline Validation Message */}
            {validationMessage && (
              <div className="w-full max-w-lg mx-auto p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center animate-in fade-in duration-150">
                {validationMessage}
              </div>
            )}

            {/* CTA Button & Available Scans */}
            <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 pt-2">
              {/* Available Scans (Left Side - Kept exactly as earlier) */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 h-10 bg-slate-50/90 border border-slate-200/80 rounded-md text-xs font-medium text-slate-600 select-none">
                <span>
                  Available scans:{" "}
                  <strong className="font-semibold text-slate-900">
                    {isOwner
                      ? "∞"
                      : userPlan === "free"
                      ? (userCredits?.freeRemaining ?? 2)
                      : (userCredits?.paidCredits ?? userCredits?.freeRemaining ?? 0)}
                  </strong>
                </span>
                {!isOwner && (
                  <button
                    type="button"
                    onClick={() => {
                      useUpgradeModalStore.getState().openModal({
                        badge: userPlan === "free" ? "PRO" : "MAX",
                        title: userPlan === "free" ? "Upgrade to Premium Pro" : "Upgrade to Pro Max",
                        description: "Get more AI resume optimizations, unlimited downloads, and full access to RoleFuse career tools.",
                      });
                    }}
                    className="text-[#087F6E] hover:text-[#065F53] font-semibold no-underline hover:no-underline ml-1 cursor-pointer transition-colors"
                  >
                    Upgrade
                  </button>
                )}
              </div>

              {/* Optimize My Resume (Right Side - Matching Border & Corner Radius with Available Scans) */}
              <button
                onClick={handleOptimize}
                disabled={!resumeText?.trim() || !jobDescription?.trim() || optimizing || isPrechecking}
                title={
                  !resumeText?.trim() || !jobDescription?.trim()
                    ? "Enter both resume and job description to enable optimization"
                    : "Optimize My Resume"
                }
                className={`w-full sm:w-auto h-10 px-7 sm:px-8 py-2 rounded-md text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 ${
                  !resumeText?.trim() || !jobDescription?.trim()
                    ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60 shadow-none select-none"
                    : "bg-[#087F6E] hover:bg-[#065F53] active:scale-98 text-white border border-[#087F6E] shadow-xs hover:shadow cursor-pointer"
                }`}
              >
                {optimizing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-white" /> Optimizing Resume...
                  </>
                ) : isPrechecking ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-white" /> Analyzing Resume &amp; Missing Metrics...
                  </>
                ) : (
                  <>
                    <GeminiIcon className={`h-4 w-4 ${resumeText?.trim() && jobDescription?.trim() ? "text-white" : "text-slate-400"}`} />
                    <span>Optimize My Resume</span>
                  </>
                )}
              </button>
            </div>

            {/* ─── EXECUTIVE OVERVIEW SECTION (Latest Scan, LinkedIn, Job Tracker) ─── */}
            <div className="pt-4 sm:pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
                {/* 1. Latest Resume Scan */}
                <Link
                  href="/dashboard/history"
                  className="group relative bg-white border border-[#DCE7E9] hover:border-[#087F6E]/50 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
                >
                  <div className="space-y-3.5">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-teal-50 border border-teal-200/60 flex items-center justify-center text-[#087F6E]">
                          <FileCheck2 className="h-3.5 w-3.5" />
                        </div>
                        <h3 className="text-xs sm:text-sm font-bold text-[#111827]">
                          Latest Resume Scan
                        </h3>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#087F6E] group-hover:translate-x-0.5 transition-all" />
                    </div>

                    {/* Dial & Title */}
                    <div className="flex items-center gap-3 pt-0.5">
                      {/* Circular score dial with dynamic colors based on ATS score */}
                      {(() => {
                        const style = getScoreRingStyle(latestScanInfo.score);
                        return (
                          <div
                            className={`relative h-11 w-11 rounded-full p-[2px] bg-gradient-to-tr ${style.gradient} flex items-center justify-center shadow-xs shrink-0`}
                          >
                            <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                              <span className={`text-xs sm:text-sm font-black ${style.textColor}`}>
                                {latestScanInfo.score}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                      <div className="min-w-0">
                        <p className="text-[11px] text-slate-500 font-medium truncate">
                          {latestScanInfo.jobTitle}
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-[#111827] truncate">
                          {latestScanInfo.company}
                        </p>
                      </div>
                    </div>

                    {/* 5-item diagnostic checklist */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 pt-1 text-[10px] sm:text-[11px] font-medium text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">Searchability</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">Formatting</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <XCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">Skills Match</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">Cover Letter</span>
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">Recruiter Tips</span>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* 2. LinkedIn Report */}
                <div className={`relative rounded-2xl p-4 sm:p-5 shadow-xs transition-all flex flex-col justify-between border ${
                  !isOwner && userPlan !== "promax"
                    ? "bg-slate-50/40 border-slate-200/50 opacity-50 cursor-pointer"
                    : "bg-white border-[#DCE7E9] hover:border-[#0077B5]/50 group hover:shadow-md cursor-pointer"
                }`}>
                  <div className="space-y-3">
                    {/* Header with authentic LinkedIn Blue icon & top-right arrow for Pro Max */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-6 w-6 rounded flex items-center justify-center ${
                          !isOwner && userPlan !== "promax" ? "bg-slate-100 text-slate-400" : "text-[#0077B5]"
                        }`}>
                          <LinkedInIcon className="h-5 w-5" />
                        </div>
                        <h3 className="text-xs sm:text-sm font-bold text-[#111827]">
                          LinkedIn Report
                        </h3>
                      </div>
                      {!isOwner && userPlan !== "promax" ? (
                        <span className="text-[10px] font-semibold text-black bg-[#f1f5f9] border border-slate-200/80 px-2 py-0.5 rounded-full tracking-normal">
                          MAX
                        </span>
                      ) : (
                        <Link href="/dashboard/linkedin-optimizer">
                          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#0077B5] group-hover:translate-x-0.5 transition-all cursor-pointer" />
                        </Link>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      Optimize your LinkedIn profile to match your preferred job listings
                    </p>
                  </div>

                  {/* Action button in authentic style */}
                  <div className="pt-4">
                    <Link
                      href="/dashboard/linkedin-optimizer"
                      onClick={(e: React.MouseEvent) => {
                        if (!isOwner && userPlan !== "promax") {
                          e.preventDefault();
                          useUpgradeModalStore.getState().openModal({
                            badge: "MAX",
                            title: "Unlock LinkedIn Profile Optimizer",
                            description: "LinkedIn Profile Optimizer is exclusively available for Pro Max members. Upgrade to Pro Max to optimize your headline, bio, and recruiter search rankings.",
                          });
                        }
                      }}
                      className="inline-block"
                    >
                      <Button
                        variant="outline"
                        className="h-8 text-xs font-bold text-slate-800 border-slate-300 hover:border-[#0077B5] hover:text-[#0077B5] hover:bg-sky-50/40 rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        Optimize LinkedIn
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* 3. Job Tracker */}
                <Link
                  href="/dashboard/job-tracker"
                  className="group relative bg-white border border-[#DCE7E9] hover:border-[#087F6E]/50 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-teal-50 border border-teal-200/60 flex items-center justify-center text-[#087F6E]">
                          <Briefcase className="h-3.5 w-3.5" />
                        </div>
                        <h3 className="text-xs sm:text-sm font-bold text-[#111827]">
                          Job Tracker
                        </h3>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#087F6E] group-hover:translate-x-0.5 transition-all" />
                    </div>

                    {/* 4 Metric Boxes */}
                    <div className="grid grid-cols-4 gap-1.5 sm:gap-2 pt-0.5">
                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-1.5 sm:p-2 text-center min-w-0">
                        <span className="block text-sm sm:text-base font-black text-[#087F6E]">
                          {jobTrackerStats.total ?? jobTrackerStats.saved}
                        </span>
                        <span className="block text-[9px] sm:text-[10px] text-slate-500 font-semibold mt-0.5 truncate">
                          Tracked
                        </span>
                      </div>
                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-1.5 sm:p-2 text-center min-w-0">
                        <span className="block text-sm sm:text-base font-black text-slate-800">
                          {jobTrackerStats.applied}
                        </span>
                        <span className="block text-[9px] sm:text-[10px] text-slate-500 font-semibold mt-0.5 truncate">
                          Applied
                        </span>
                      </div>
                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-1.5 sm:p-2 text-center min-w-0">
                        <span className="block text-sm sm:text-base font-black text-slate-800">
                          {jobTrackerStats.interview}
                        </span>
                        <span className="block text-[9px] sm:text-[10px] text-slate-500 font-semibold mt-0.5 truncate">
                          Interview
                        </span>
                      </div>
                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-1.5 sm:p-2 text-center min-w-0">
                        <span className="block text-sm sm:text-base font-black text-slate-800">
                          {jobTrackerStats.offer}
                        </span>
                        <span className="block text-[9px] sm:text-[10px] text-slate-500 font-semibold mt-0.5 truncate">
                          Offers
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sub-footer: Next Interview */}
                  <div className="pt-3 border-t border-slate-100 mt-3 space-y-1">
                    <p className="text-[10px] sm:text-[11px] font-semibold text-slate-600">
                      Next Interview
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500">
                      <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{jobTrackerStats.nextInterview || "No upcoming interview"}</span>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Trust badges (Placed below overview boxes) */}
            <div className="flex flex-wrap justify-center items-center gap-x-6 sm:gap-x-8 gap-y-2.5 pt-6 text-[10px] sm:text-xs text-slate-500 font-medium select-none">
              <span>No data sold</span>
              <span className="text-slate-300">|</span>
              <span>Results in ~30s</span>
              <span className="text-slate-300">|</span>
              <span>ATS Tested</span>
              <span className="text-slate-300">|</span>
              <span>Score improvement guaranteed</span>
            </div>
          </div>
        )}
      </main>

      {/* Loading Overlay */}
      {/* LoadingOverlay removed per user request */}

      {/* Saved Resumes Modal */}
      <UseSavedResumeModal
        isOpen={isSavedResumesOpen}
        onClose={() => setIsSavedResumesOpen(false)}
        onSelectResume={(text) => setResumeText(text)}
      />

      {/* User Feedback Modal */}
      <FeedbackToast
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        userEmail={user?.email}
      />
    </div>
  );
}
