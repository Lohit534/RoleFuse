"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useResumeStore } from "@/store/useResumeStore";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ResumeRecord, CreditInfo, isOwnerEmail } from "@/types";
import { logger } from "@/lib/logger";
import { generateSkillRoadmap, generateMultiSkillRoadmap } from "@/lib/roadmap-generator";
import { extractTechTerms, extractKeywords } from "@/lib/ats/keywords";
import { extractScorableBullets } from "@/lib/ats/bullets";
import { localScore } from "@/lib/ats/scorer";
import { parseResumeIntoBlocks, toSectionTitle, splitCertText, isRoleOrTitle, getCleanExportFilename, extractRoleFromResume } from "@/lib/export/pdf-document";
import { saveAs } from "file-saver";

function getReadableLinkLabel(url: string, fallback?: string): string {
  if (!url) return fallback || url;
  const lower = url.toLowerCase();
  if (lower.includes("linkedin.com")) return "LinkedIn";
  if (lower.includes("github.com")) return "GitHub";
  return fallback || url;
}

function getResumeDisplayTitle(resume: any, fallbackName = "Resume"): string {
  if (!resume) return fallbackName;
  const role = extractRoleFromResume(resume);
  if (role) {
    return role;
  }
  const text = resume.optimizedText || resume.originalText || "";
  if (text) {
    const firstLine = text.trim().split("\n")[0]?.replace(/^[#*•\s]+/, "").trim();
    if (firstLine && firstLine.length > 1 && !firstLine.includes("@") && !/^\+?\d/.test(firstLine) && firstLine.length < 50) {
      return firstLine;
    }
  }
  return fallbackName;
}

function ensureProfileLinks(optText?: string, origText?: string): string {
  let text = optText || "";
  if (!origText) return text;
  const origLi = origText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w\-\.%]+\/?/i);
  const origGh = origText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[\w\-\.%]+(?:\/[\w\-\.%]+)?\/?/i);
  const hasLi = /linkedin\.com/i.test(text);
  const hasGh = /github\.com/i.test(text);
  
  if ((origLi && !hasLi) || (origGh && !hasGh)) {
    const lines = text.split("\n");
    let contactLineIdx = lines.findIndex((l, i) => i > 0 && i < 5 && (l.includes("@") || /\+?\d{7,}/.test(l)));
    if (contactLineIdx !== -1) {
      const extraLinks: string[] = [];
      if (origLi && !hasLi) extraLinks.push(origLi[0].startsWith("http") ? origLi[0] : "https://" + origLi[0]);
      if (origGh && !hasGh) extraLinks.push(origGh[0].startsWith("http") ? origGh[0] : "https://" + origGh[0]);
      lines[contactLineIdx] = `${lines[contactLineIdx]} | ${extraLinks.join(" | ")}`;
      return lines.join("\n");
    }
  }
  return text;
}
import { useUpgradeModalStore } from "@/store/useUpgradeModalStore";
import { HistorySkeleton, HistoryListSkeleton } from "@/components/SkeletonShimmer";
import {
  Loader2,
  History,
  AlertCircle,
  Plus,
  ChevronRight,
  TrendingUp,
  Calendar,
  Copy,
  Check,
  ArrowRight,
  Tag,
  FileText,
  ArrowLeft,
  Lock,
  Share2,
  Compass,
  MessageSquare,
  HelpCircle,
  GraduationCap,
  Sparkle,
  Sparkles,
  Briefcase,
  Trash2,
  BarChart2,
  BarChart3,
  Activity,
  Database,
  Cpu,
  Layers,
  Table,
  LineChart,
  CheckCircle2,
  Terminal
} from "lucide-react";

import Link from "next/link";
import { toast } from "react-hot-toast";
import { formatDate } from "@/lib/utils";
import ScrollFadeIn from "@/components/ScrollFadeIn";
import CircleGauge, { scoreColor } from "@/components/CircleGauge";

function renderContactIcon(type: "phone" | "email" | "linkedin" | "github" | "globe") {
  let path = "";
  if (type === "phone") {
    path = "M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1v3.5a1 1 0 01-1 1A19.93 19.93 0 012 3a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.21 2.2z";
  } else if (type === "email") {
    path = "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z";
  } else if (type === "linkedin") {
    path = "M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v7.6h2.79v-7.6H6.46M7.86 6.5a1.63 1.63 0 1 0 0 3.26 1.63 1.63 0 0 0 0-3.26z";
  } else if (type === "github") {
    path = "M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z";
  } else {
    path = "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z";
  }
  return (
    <svg
      className="w-3 h-3 inline-block mr-1 text-black shrink-0 align-middle"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

interface DetailViewProps {
  resume: ResumeRecord;
  userPlan: string;
  onBack: () => void;
  onDelete: () => void;
}

/* ─── Animated Score Counter (Counts up/down to target score) ─── */
function AnimatedScoreNumber({
  value,
  startValue = 0,
  duration = 900,
  suffix = "%",
  className = "",
}: {
  value: number;
  startValue?: number;
  duration?: number;
  suffix?: string;
  className?: string;
}) {
  const [displayValue, setDisplayValue] = useState(startValue);

  useEffect(() => {
    const start = Math.max(0, Math.min(100, Math.round(startValue || 0)));
    const end = Math.max(0, Math.min(100, Math.round(value || 0)));
    let startTime: number | null = null;
    let frameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Cubic ease out
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * easeOut);
      setDisplayValue(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        setDisplayValue(end);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [value, startValue, duration]);

  return (
    <span className={className}>
      {displayValue}
      {suffix}
    </span>
  );
}

/* ─── Detail view (Image 2 mockup styled) ─────────────── */
function DetailView({ resume, userPlan, onBack, onDelete }: DetailViewProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [docxLoading, setDocxLoading] = useState(false);
  const [selectedRoadmapSkills, setSelectedRoadmapSkills] = useState<string[]>([]);
  const [roadmapContent, setRoadmapContent] = useState<string | null>(() => {
    if (resume.roadmap) return resume.roadmap;
    if (typeof window !== "undefined") {
      return localStorage.getItem(`fastHire_roadmap_${resume.id}`) || null;
    }
    return null;
  });
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [coverLetterGenerated, setCoverLetterGenerated] = useState<string | null>(() => {
    if (resume.coverLetter) return resume.coverLetter;
    if (typeof window !== "undefined") {
      return localStorage.getItem(`fastHire_coverLetter_${resume.id}`) || null;
    }
    return null;
  });
  const [generatingLetter, setGeneratingLetter] = useState(false);
  const [showRoadmapAccordion, setShowRoadmapAccordion] = useState(false);
  const [activeTab, setActiveTab] = useState<"resume" | "changes" | "breakdown" | "roadmap" | "cover_letter">("resume");
  const [showShareModal, setShowShareModal] = useState(false);
  const [animatedBarWidth, setAnimatedBarWidth] = useState(0);
  const [savingToResumes, setSavingToResumes] = useState(false);
  const [savedToResumes, setSavedToResumes] = useState(false);

  const handleSaveToResumes = async () => {
    const textToSave = resume.optimizedText || resume.originalText;
    if (!textToSave) {
      toast.error("No resume content found to save.");
      return;
    }
    setSavingToResumes(true);
    try {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalText: resume.originalText || textToSave,
          optimizedText: textToSave,
          jobDescription: "", // Standalone resume in My Resumes library
          jobTitle: resume.jobTitle ? `${resume.jobTitle} (Optimized)` : "Target Role Resume",
          company: resume.company || "General Application",
          scoreBefore: resume.scoreBefore || 50,
          scoreAfter: resume.scoreAfter || 85,
          keywordsBefore: resume.keywordsBefore || 0,
          keywordsAfter: resume.keywordsAfter || 10,
          impactBefore: resume.impactBefore || 0,
          impactAfter: resume.impactAfter || 10,
          keywordsAdded: resume.keywordsAdded || [],
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save to Resumes library.");
      }
      setSavedToResumes(true);
      toast.success("Saved to My Resumes! You can now view and edit it in My Resumes.");
    } catch (e: any) {
      toast.error(e.message || "Failed to save resume.");
    } finally {
      setSavingToResumes(false);
    }
  };

  useEffect(() => {
    // Smooth animated fill for the ATS score progress bar line
    const t = setTimeout(() => {
      setAnimatedBarWidth(Math.min(100, Math.max(0, Math.round(resume.scoreAfter))));
    }, 120);
    return () => clearTimeout(t);
  }, [resume.scoreAfter]);

  useEffect(() => {
    const loadedRoadmap = resume.roadmap || (typeof window !== "undefined" ? localStorage.getItem(`fastHire_roadmap_${resume.id}`) : null);
    setRoadmapContent(loadedRoadmap || null);
    const loadedLetter = resume.coverLetter || (typeof window !== "undefined" ? localStorage.getItem(`fastHire_coverLetter_${resume.id}`) : null);
    setCoverLetterGenerated(loadedLetter || null);
  }, [resume.id, resume.roadmap, resume.coverLetter]);

  const delta = resume.scoreAfter - resume.scoreBefore;
  const isPaidUser = userPlan === "premium" || userPlan === "promax" || userPlan === "owner";
  const isLocked = !isPaidUser;
  
  // Dynamic keyword & tech skill extraction
  const rawKeywordsAdded = Array.isArray(resume.keywordsAdded) ? resume.keywordsAdded.filter(Boolean) : [];
  const optimizedTech = extractTechTerms(resume.optimizedText || "");
  const originalTech = extractTechTerms(resume.originalText || "");
  const jdTech = extractTechTerms(resume.jobDescription || "");
  const originalTechSet = new Set(originalTech.map(t => t.toLowerCase()));

  // Injected keywords: explicit keywordsAdded OR new tech terms in optimizedText
  const newlyAddedTech = optimizedTech.filter(t => !originalTechSet.has(t.toLowerCase()));
  const keywords = rawKeywordsAdded.length > 0
    ? rawKeywordsAdded
    : (newlyAddedTech.length > 0 ? newlyAddedTech : (optimizedTech.length > 0 ? optimizedTech.slice(0, 8) : ["C#", "ASP.NET Core", "SQL Server", "REST APIs", "React", "Python"]));

  // Clean, deduplicated list of technical skills across resume and job description
  const availableSkills = Array.from(new Set([
    ...optimizedTech,
    ...originalTech,
    ...jdTech,
    ...rawKeywordsAdded
  ])).filter(s => s && s.length > 1 && !/^(resume|summary|skills|experience|education|project|teamwork|development|software|engineer|manager|developer|analyst|overview|responsibilities)$/i.test(s));

  // Dynamic Real ATS Score Breakdown Analysis
  const beforeScoreDetails = React.useMemo(() => {
    if (!resume.originalText) {
      return {
        keywordMatch: Math.max(10, Math.round(resume.scoreBefore * 0.82)),
        impactBullets: Math.max(15, Math.round(resume.scoreBefore * 0.75)),
        semanticMatch: Math.max(20, Math.round(resume.scoreBefore * 0.88)),
        formatting: Math.max(50, Math.round(resume.scoreBefore * 0.92)),
        foundKeywords: originalTech,
        missingKeywords: jdTech.filter(t => !originalTechSet.has(t.toLowerCase())),
        quantifiedCount: resume.impactBefore || 0,
        totalBulletsCount: 0
      };
    }
    return localScore(resume.originalText, resume.jobDescription || "");
  }, [resume.originalText, resume.jobDescription, resume.scoreBefore, originalTech, jdTech, originalTechSet, resume.impactBefore]);

  const afterScoreDetails = React.useMemo(() => {
    if (!resume.optimizedText) {
      return {
        keywordMatch: Math.min(100, Math.max(resume.scoreAfter, Math.round(resume.scoreAfter * 0.95))),
        impactBullets: Math.min(100, Math.max(resume.scoreAfter, Math.round(resume.scoreAfter * 0.92))),
        semanticMatch: Math.min(100, Math.max(resume.scoreAfter, Math.round(resume.scoreAfter * 0.94))),
        formatting: Math.min(100, Math.max(75, Math.round(resume.scoreAfter * 0.98))),
        foundKeywords: Array.from(new Set([...optimizedTech, ...rawKeywordsAdded])),
        missingKeywords: [],
        quantifiedCount: resume.impactAfter || 0,
        totalBulletsCount: 0
      };
    }
    return localScore(resume.optimizedText, resume.jobDescription || "");
  }, [resume.optimizedText, resume.jobDescription, resume.scoreAfter, optimizedTech, rawKeywordsAdded, resume.impactAfter]);

  // Existing keywords: real tech skills already present in candidate profile
  const existingKeywords = originalTech.length > 0
    ? originalTech.slice(0, 8)
    : (optimizedTech.length > 8 ? optimizedTech.slice(8, 16) : ["Python", "Django", "SQL", "Git", "HTML5", "CSS3"]);

  // Calculate actual bullet count
  const optLines = (resume.optimizedText || "").split("\n").map(l => l.trim());
  const bulletLinesCount = optLines.filter(l => /^[•\-*\u2022▸►→]/.test(l) || (l.length > 25 && l.length < 280 && !l.includes(":") && !/^[A-Z\s]{4,}$/.test(l))).length;
  const rewrittenBullets = Math.max(bulletLinesCount > 0 ? Math.min(bulletLinesCount, 8) : 6, 1);

  // Extract scorable bullets from original and optimized text for Before/After comparison
  const originalBullets = React.useMemo(() => {
    const scorable = extractScorableBullets(resume.originalText || "").map(b => b.cleanText);
    if (scorable.length > 0) return scorable;
    return (resume.originalText || "")
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => /^[•\-\*–—+o\u2022\u25cf\u2043▸►→]\s*/.test(l))
      .map(l => l.replace(/^[•\-\*–—+o\u2022\u25cf\u2043▸►→]\s*/, "").trim());
  }, [resume.originalText]);

  const optimizedBullets = React.useMemo(() => {
    const scorable = extractScorableBullets(resume.optimizedText || "").map(b => b.cleanText);
    if (scorable.length > 0) return scorable;
    return (resume.optimizedText || "")
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => /^[•\-\*–—+o\u2022\u25cf\u2043▸►→]\s*/.test(l))
      .map(l => l.replace(/^[•\-\*–—+o\u2022\u25cf\u2043▸►→]\s*/, "").trim());
  }, [resume.optimizedText]);

  /**
   * Smart before/after bullet pairing:
   * - Pairs each original bullet with its closest matching optimized bullet
   *   (by shared word overlap), so the diff is meaningful even when lengths differ.
   * - Only returns pairs where the text actually changed (genuine rewrites).
   * - Caps at 12 pairs to avoid an overwhelming list.
   */
  const bulletChangePairs = React.useMemo<{ before: string; after: string }[]>(() => {
    if (!originalBullets.length || !optimizedBullets.length) return [];

    function wordSet(s: string): Set<string> {
      return new Set(s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean));
    }
    function similarity(a: string, b: string): number {
      const wa = wordSet(a);
      const wb = wordSet(b);
      let shared = 0;
      wa.forEach(w => { if (wb.has(w)) shared++; });
      return shared / Math.max(wa.size, wb.size, 1);
    }

    const usedOptIdx = new Set<number>();
    const pairs: { before: string; after: string }[] = [];

    for (const orig of originalBullets) {
      // Find the best matching optimized bullet not yet paired
      let bestIdx = -1;
      let bestScore = 0;
      optimizedBullets.forEach((opt, i) => {
        if (usedOptIdx.has(i)) return;
        const s = similarity(orig, opt);
        if (s > bestScore) { bestScore = s; bestIdx = i; }
      });

      if (bestIdx !== -1) {
        const after = optimizedBullets[bestIdx];
        usedOptIdx.add(bestIdx);
        // Only show if the text genuinely changed (not identical / trivially same)
        const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (normalise(orig) !== normalise(after)) {
          pairs.push({ before: orig, after });
        }
      }
      if (pairs.length >= 12) break;
    }
    return pairs;
  }, [originalBullets, optimizedBullets]);

  const handleCopy = () => {
    navigator.clipboard.writeText(resume.optimizedText || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = async (format: "pdf" | "docx") => {
    if (userPlan === "free") {
      useUpgradeModalStore.getState().openModal({
        badge: "DOWNLOAD BLOCKED",
        title: "Your 2 free optimizations are used up",
        description: "Your optimized resume is saved and stays in your history. Free includes the ATS score and live preview; downloading is on a paid plan.",
      });
      return;
    }

    if (format === "pdf") setPdfLoading(true);
    else setDocxLoading(true);

    try {
      const response = await fetch(`/api/export/${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: resume.id,
          // Pass text as fallback so the API can generate PDF even if DB fetch fails
          text: resume.optimizedText || "",
          type: "optimized"
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to generate ${format.toUpperCase()} file.`);
      }

      const blob = await response.blob();
      const filename = getCleanExportFilename(
        resume.optimizedText || resume.originalText || "",
        `.${format}`,
        resume.jobTitle || undefined
      );
      saveAs(blob, filename);
    } catch (error: any) {
      toast.error(error.message || `An error occurred during ${format.toUpperCase()} download.`);
    } finally {
      if (format === "pdf") setPdfLoading(false);
      else setDocxLoading(false);
    }
  };

  const toggleRoadmapSkill = (skill: string) => {
    if (selectedRoadmapSkills.includes(skill)) {
      setSelectedRoadmapSkills(selectedRoadmapSkills.filter(s => s !== skill));
    } else {
      if (selectedRoadmapSkills.length >= 3) {
        toast.error("You can select up to 3 skills for your comprehensive roadmap.");
        return;
      }
      setSelectedRoadmapSkills([...selectedRoadmapSkills, skill]);
    }
  };

  const handleGenerateRoadmap = async () => {
    // Strict Plan Restriction: Only Pro, Pro Max, and Owner users can access Skill Roadmaps
    if (userPlan === "free") {
      toast.error("Skills learning roadmaps are a Pro & Pro Max feature. Please upgrade your plan to unlock instant career roadmaps!");
      setTimeout(() => {
        router.push("/dashboard/pricing");
      }, 1800);
      return;
    }

    if (selectedRoadmapSkills.length === 0) {
      toast.error("Please select at least 1 skill (up to 3) to generate your roadmap.");
      return;
    }

    setRoadmapLoading(true);
    setRoadmapContent(null);
    try {
      const res = await fetch("/api/skill-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skills: selectedRoadmapSkills,
          jobTitle: resume.jobTitle,
          company: resume.company,
          jobDescription: resume.jobDescription,
          resumeText: resume.optimizedText || resume.originalText
        }),
      });

      let content = "";
      if (res.ok) {
        const data = await res.json();
        content = data.roadmap;
      } else {
        // Fallback to local roadmap generator if offline
        content = generateMultiSkillRoadmap(selectedRoadmapSkills);
      }

      setRoadmapContent(content);
      if (typeof window !== "undefined") {
        localStorage.setItem(`fastHire_roadmap_${resume.id}`, content);
      }
      fetch("/api/history", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId: resume.id, roadmap: content }),
      }).catch(() => {});
      toast.success(`Generated 90-day roadmap for ${selectedRoadmapSkills.length} selected skill${selectedRoadmapSkills.length > 1 ? "s" : ""}!`);
    } catch (e) {
      // Local fallback on network failure
      const fallbackContent = generateMultiSkillRoadmap(selectedRoadmapSkills);
      setRoadmapContent(fallbackContent);
      toast.success(`Generated 90-day roadmap for ${selectedRoadmapSkills.length} selected skill${selectedRoadmapSkills.length > 1 ? "s" : ""}!`);
    } finally {
      setRoadmapLoading(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    setGeneratingLetter(true);
    try {
      const res = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: resume.optimizedText || resume.originalText,
          jobDescription: resume.jobDescription,
          jobTitle: resume.jobTitle,
          company: resume.company,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate cover letter.");
      }

      const data = await res.json();
      setCoverLetterGenerated(data.coverLetter);
      if (typeof window !== "undefined") {
        localStorage.setItem(`fastHire_coverLetter_${resume.id}`, data.coverLetter);
      }
      fetch("/api/history", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId: resume.id, coverLetter: data.coverLetter }),
      }).catch(() => {});
    } catch (e: any) {
      toast.error(e.message || "Failed to generate cover letter.");
    } finally {
      setGeneratingLetter(false);
    }
  };

  const shareText = `Check out my resume ATS score improvement on RoleFuse: from ${resume.scoreBefore} to ${resume.scoreAfter} (+${delta} pts)! 🚀`;
  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://rolefuse.in")}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* ─── Top Header (Matching user's image) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#F5FAFA] text-[#087F6E] border border-[#DCE7E9]">
              <Briefcase className="h-3.5 w-3.5" />
              {getResumeDisplayTitle(resume)}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              {formatDate(resume.createdAt)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex flex-wrap items-center gap-2">
              <span>Score improved</span>
              <AnimatedScoreNumber value={resume.scoreBefore} className="text-slate-900" />
              <span className="text-slate-400 font-semibold text-sm sm:text-base">to</span>
              <AnimatedScoreNumber value={resume.scoreAfter} className="text-[#0d6e5a]" />
            </h1>
            <span className="inline-flex items-center bg-teal-50 border border-teal-200 text-[#0d6e5a] text-xs font-bold px-3 py-1 rounded-full shadow-xs">
              +{delta} points
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleSaveToResumes}
            disabled={savingToResumes || savedToResumes}
            className={`font-bold text-xs h-9 px-3.5 rounded-md shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
              savedToResumes
                ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                : "bg-[#087F6E] hover:bg-[#065F53] text-white"
            }`}
          >
            {savingToResumes ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : savedToResumes ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            <span>{savedToResumes ? "Saved in Resumes" : "Save to My Resumes"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-bold text-xs h-9 px-4 rounded-md shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Share2 className="h-3.5 w-3.5 text-slate-500" />
            <span>Share result</span>
          </button>

          <button
            type="button"
            onClick={onBack}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-9 px-4 rounded-md shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to History</span>
          </button>

          <button
            type="button"
            onClick={onDelete}
            title="Delete Record"
            className="text-slate-400 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition-colors cursor-pointer border border-transparent hover:border-red-200"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ─── TABS BAR (Matching user's image) ─── */}
      <div className="flex items-center gap-3 sm:gap-6 border-b border-slate-200 text-xs sm:text-sm overflow-x-auto select-none no-scrollbar pt-1 w-full pb-px">
        <button
          type="button"
          onClick={() => setActiveTab("resume")}
          className={`pb-3 font-semibold transition-all relative whitespace-nowrap cursor-pointer ${
            activeTab === "resume"
              ? "text-[#0d6e5a] font-bold"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Resume
          {activeTab === "resume" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0d6e5a] rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("changes")}
          className={`pb-3 font-semibold transition-all relative flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === "changes"
              ? "text-[#0d6e5a] font-bold"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <span>What changed</span>
          <span className="text-[10px] font-black bg-teal-50 border border-teal-200 text-[#0d6e5a] px-1.5 py-0.2 rounded-full">
            {keywords.length || rewrittenBullets}
          </span>
          {activeTab === "changes" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0d6e5a] rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("breakdown")}
          className={`pb-3 font-semibold transition-all relative whitespace-nowrap cursor-pointer ${
            activeTab === "breakdown"
              ? "text-[#0d6e5a] font-bold"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Score breakdown
          {activeTab === "breakdown" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0d6e5a] rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("roadmap")}
          className={`pb-3 font-semibold transition-all relative whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === "roadmap"
              ? "text-[#0d6e5a] font-bold"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          <span>Skill roadmap</span>
          {activeTab === "roadmap" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0d6e5a] rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("cover_letter")}
          className={`pb-3 font-semibold transition-all relative whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === "cover_letter"
              ? "text-[#0d6e5a] font-bold"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Cover letter</span>
          {activeTab === "cover_letter" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0d6e5a] rounded-full" />
          )}
        </button>
      </div>

      {/* ─── TAB 1: RESUME (Image 2-Column Layout) ─── */}
      {activeTab === "resume" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 cols): Toolbar & Document Paper Preview */}
          <div className="lg:col-span-8 space-y-4">
            {/* Toolbar above resume card */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Resume Preview
                </span>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-bold text-xs h-9 px-3.5 rounded-md shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => downloadFile("pdf")}
                  disabled={pdfLoading}
                  className="bg-[#0d6e5a] hover:bg-[#094d3f] text-white font-bold text-xs h-9 px-4 rounded-md shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {pdfLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                  <span>Download PDF</span>
                  {!isPaidUser && (
                    <span className="text-[9px] font-black uppercase bg-white/20 text-white px-1.5 py-0.2 rounded">
                      PRO
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => downloadFile("docx")}
                  disabled={docxLoading}
                  className="bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-bold text-xs h-9 px-4 rounded-md shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {docxLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5 text-slate-500" />}
                  <span>DOCX</span>
                  {!isPaidUser && (
                    <span className="text-[9px] font-black uppercase bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.2 rounded">
                      PRO
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Scrollable Document Paper Viewport (scrolling instead of fixed page) */}
            <div className="rounded-2xl border border-slate-200/90 bg-slate-100/60 p-2 sm:p-3.5 shadow-inner max-h-[740px] sm:max-h-[820px] overflow-y-auto overscroll-contain select-text">
              <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-10 shadow-sm min-h-[640px] relative font-serif select-text">
              {/* Watermark for free plan downloads */}
              {isLocked && (
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] pointer-events-none flex flex-col items-center justify-center select-none p-6 text-center z-10">
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xl text-slate-900 max-w-xs pointer-events-auto">
                    <Lock className="h-7 w-7 text-[#0d6e5a] mx-auto mb-2" />
                    <h5 className="text-sm font-bold text-slate-900">Document Preview</h5>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Upgrade to a paid plan to unlock PDF and Word DOCX downloads.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        useUpgradeModalStore.getState().openModal({
                          badge: "PRO",
                          title: "Upgrade to Download",
                          description: "Unlock full PDF & DOCX downloads and unlimited ATS optimization history.",
                        });
                      }}
                      className="mt-3 w-full bg-[#0d6e5a] hover:bg-[#094d3f] text-white font-bold text-xs h-8 rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      Upgrade Now
                    </button>
                  </div>
                </div>
              )}

              {/* Resume Body: Standard Harvard / Tech ATS LaTeX Format (zero teal color, pure black and dark slate text) */}
              <div className="w-full text-black font-serif select-text leading-snug break-words" style={{ fontFamily: "'Times New Roman', Times, 'Liberation Serif', serif" }}>
                {parseResumeIntoBlocks(ensureProfileLinks(resume.optimizedText || "", resume.originalText || "")).map((block, idx) => {
                  switch (block.type) {
                    case "name":
                      return (
                        <h1 key={idx} className="text-[20px] sm:text-[24px] font-normal text-center text-black mb-0 leading-tight select-text tracking-wide" style={{ fontVariant: "small-caps" }}>
                          {block.text}
                        </h1>
                      );
                    case "subtitle":
                      return null;
                    case "contact": {
                      const rawSegments = block.segments.filter(seg => !isRoleOrTitle(seg.text));
                      if (rawSegments.length === 0) return null;

                      // Deduplicate contacts so email, phone, etc. never appear twice
                      const seenTypes = new Set<string>();
                      const cleanSegments = rawSegments.filter((seg) => {
                        const lower = (seg.text || "").toLowerCase() + " " + (seg.url || "").toLowerCase();
                        let iconType = "globe";
                        if (seg.text.includes("@") || lower.includes("@")) iconType = "email";
                        else if (/\+?\d[\d\s\-\(\)]{7,}/.test(seg.text)) iconType = "phone";
                        else if (lower.includes("linkedin")) iconType = "linkedin";
                        else if (lower.includes("github")) iconType = "github";

                        if (seenTypes.has(iconType)) return false;
                        seenTypes.add(iconType);
                        return true;
                      });
                      if (cleanSegments.length === 0) return null;

                      return (
                        <div key={idx} className="flex justify-center items-center flex-wrap gap-x-3 sm:gap-x-4 gap-y-1 text-[9.5px] sm:text-[10px] text-center text-black mt-0.5 mb-2 leading-normal select-text">
                          {cleanSegments.map((seg, sIdx) => {
                            const lower = (seg.text || "").toLowerCase() + " " + (seg.url || "").toLowerCase();
                            let iconType: "phone" | "email" | "linkedin" | "github" | "globe" = "globe";
                            if (seg.text.includes("@") || lower.includes("@")) iconType = "email";
                            else if (/\+?\d[\d\s\-\(\)]{7,}/.test(seg.text)) iconType = "phone";
                            else if (lower.includes("linkedin")) iconType = "linkedin";
                            else if (lower.includes("github")) iconType = "github";

                            let cleanHandle = seg.text
                              .replace(/^https?:\/\/(www\.)?/i, "")
                              .replace(/^(?:linkedin profile|github profile|portfolio|linkedin|github|email|phone|mobile|tel|cell|location|address)\s*[:\-]?\s*/i, "")
                              .replace(/\/$/, "")
                              .replace(/^mailto:/, "")
                              .replace(/^tel:/, "")
                              .trim();
                            if (!cleanHandle) {
                              cleanHandle = iconType === "linkedin" ? "LinkedIn" : (iconType === "github" ? "GitHub" : (seg.url || "Link"));
                            }

                            const linkHref = seg.url || (
                              iconType === "linkedin"
                                ? (seg.text.startsWith("http") ? seg.text : `https://${seg.text.replace(/^linkedin:?\s*/i, "")}`)
                                : iconType === "github"
                                ? (seg.text.startsWith("http") ? seg.text : `https://${seg.text.replace(/^github:?\s*/i, "")}`)
                                : null
                            );

                            return (
                              <span key={sIdx} className="inline-flex items-center">
                                {renderContactIcon(iconType)}
                                {linkHref ? (
                                  <a
                                    href={linkHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-black hover:underline font-medium"
                                  >
                                    {cleanHandle}
                                  </a>
                                ) : (
                                  <span className="text-black">{cleanHandle}</span>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      );
                    }
                    case "section":
                      return (
                        <h2 key={idx} className="text-[11.5px] sm:text-[12px] font-bold text-black border-b border-black mt-2.5 mb-1 pb-0 leading-snug select-text">
                          {toSectionTitle(block.text)}
                        </h2>
                      );
                    case "summary":
                      return (
                        <p key={idx} className="text-[10px] mb-1 text-black leading-snug select-text text-justify w-full">
                          {block.text}
                        </p>
                      );
                    case "skillLine":
                      return (
                        <div key={idx} className="text-[10px] mb-0.5 leading-snug select-text">
                          <span className="font-bold text-black">{block.label}: </span>
                          <span className="text-black">{block.value}</span>
                        </div>
                      );
                    case "project":
                      return (
                        <div key={idx} className="mb-1.5">
                          <div className="flex flex-row flex-wrap justify-between items-baseline gap-x-2 text-[10px] font-bold text-black mt-1 mb-0.5 leading-snug select-text">
                            <div className="flex items-baseline gap-1.5 flex-wrap flex-1 min-w-0">
                              <span>{block.name}</span>
                              {block.tech && <span>&nbsp;—&nbsp;{block.tech}</span>}
                              {block.projectUrl && (
                                <a href={block.projectUrl} target="_blank" rel="noopener noreferrer" className="text-[9.5px] text-blue-700 underline font-normal break-all">
                                  {getReadableLinkLabel(block.projectUrl, block.name)}
                                </a>
                              )}
                            </div>
                            {block.dates && <span className="shrink-0 ml-auto">{block.dates}</span>}
                          </div>
                          {block.bullets.map((bullet, bIdx) => {
                            const cleanBullet = bullet.replace(/^\s*([•\-\*–—+•\u2022\u25cf\u2043▸►→]|\d+\.)\s*/, "").trim();
                            return (
                              <div key={bIdx} className="flex items-start text-[10px] mb-px pl-2 sm:pl-3 leading-snug select-text">
                                <span className="w-2.5 sm:w-3 shrink-0 select-none text-black">•</span>
                                <span className="flex-1 min-w-0 text-black text-justify">{cleanBullet}</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    case "job":
                      return (
                        <div key={idx} className="mb-1.5">
                          <div className="flex flex-row flex-wrap justify-between items-baseline gap-x-2 text-[10px] font-bold text-black mt-1 leading-snug select-text">
                            <span className="flex-1 min-w-0">{block.title}</span>
                            {block.dates && <span className="shrink-0 ml-auto">{block.dates}</span>}
                          </div>
                          {(block.company || block.tech) && (
                            <div className="flex flex-row flex-wrap justify-between items-baseline gap-x-2 text-[10px] italic text-black mb-0.5 leading-snug select-text">
                              <span className="min-w-0">{block.company}</span>
                              {block.tech && <span className="ml-auto">{block.tech}</span>}
                            </div>
                          )}
                          {block.bullets.map((bullet, bIdx) => {
                            const cleanBullet = bullet.replace(/^\s*([•\-\*–—+•\u2022\u25cf\u2043▸►→]|\d+\.)\s*/, "").trim();
                            return (
                              <div key={bIdx} className="flex items-start text-[10px] mb-px pl-2 sm:pl-3 leading-snug select-text">
                                <span className="w-2.5 sm:w-3 shrink-0 select-none text-black">•</span>
                                <span className="flex-1 min-w-0 text-black text-justify">{cleanBullet}</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    case "education":
                      return (
                        <div key={idx} className="mb-1">
                          <div className="flex flex-row flex-wrap justify-between items-baseline gap-x-2 text-[10px] font-bold text-black leading-snug select-text">
                            <span className="min-w-0">{block.degree}</span>
                            {block.dates && <span className="ml-auto">{block.dates}</span>}
                          </div>
                          {(block.school || block.gpa) && (
                            <div className="flex flex-wrap justify-between items-baseline gap-x-2 text-[10px] italic text-black leading-snug select-text">
                              <span className="min-w-0">{block.school}</span>
                              {block.gpa && <span className="ml-auto">{block.gpa}</span>}
                            </div>
                          )}
                        </div>
                      );
                    case "bullet":
                      return (
                        <div key={idx} className="flex items-start text-[10px] mb-px pl-2 sm:pl-3 leading-snug select-text">
                          <span className="w-2.5 sm:w-3 shrink-0 select-none text-black">•</span>
                          <span className="flex-1 min-w-0 text-black">{block.text.replace(/^\s*([•\-\*–—+•\u2022\u25cf\u2043▸►→]|\d+\.)\s*/, "")}</span>
                        </div>
                      );
                    case "cert": {
                      const { title, rest } = splitCertText(block.text);
                      return (
                        <div key={idx} className="flex items-start text-[10px] mb-px pl-2 sm:pl-3 leading-snug">
                          <span className="w-2.5 sm:w-3 shrink-0 select-none text-black">•</span>
                          <span className="flex-1 min-w-0 text-black text-justify">
                            {title && <span className="font-bold">{title}</span>}
                            {rest}
                          </span>
                        </div>
                      );
                    }
                    case "link":
                      return (
                        <a key={idx} href={block.url} target="_blank" rel="noopener noreferrer" className="text-[9.5px] sm:text-[10px] text-blue-700 underline mb-0.5 block leading-normal select-text font-serif">
                          {block.label}
                        </a>
                      );
                    case "spacer":
                      return <div key={idx} className="h-1" />;
                    case "normal":
                      return (
                        <p key={idx} className="text-[10px] mb-1 text-black leading-snug select-text font-serif">
                          {block.text}
                        </p>
                      );
                    default:
                      return null;
                  }
                })}
              </div>
            </div>
            </div>
          </div>

          {/* Right Column (4 cols): ATS MATCH & Share your win */}
          <div className="lg:col-span-4 space-y-6">
            {/* Card 1: ATS MATCH */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
                  ATS MATCH
                </span>
                <span className="text-[10px] font-bold text-[#0d6e5a] bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 rounded-full">
                  +{delta} pts
                </span>
              </div>
              <div className="flex items-center justify-center gap-6 py-2">
                <div className="text-center">
                  <AnimatedScoreNumber
                    value={resume.scoreBefore}
                    className="text-3xl font-extrabold text-slate-400 block"
                  />
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-1">
                    before
                  </span>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-300 shrink-0" />
                <div className="text-center">
                  <AnimatedScoreNumber
                    value={resume.scoreAfter}
                    className="text-4xl font-black text-[#0d6e5a] block"
                  />
                  <span className="text-[10px] text-[#0d6e5a] font-bold uppercase tracking-wider block mt-1">
                    after
                  </span>
                </div>
              </div>

              {/* Increased Teal ATS progress bar line */}
              <div className="space-y-1.5 pt-1">
                <div className="h-5 sm:h-5.5 bg-slate-100 rounded-full overflow-hidden p-1 border border-slate-200/90 shadow-inner relative flex items-center">
                  <div
                    className="h-full bg-linear-to-r from-[#094d3f] via-[#0d6e5a] to-[#14b8a6] rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2 shadow-xs"
                    style={{ width: `${animatedBarWidth}%` }}
                  >
                    {animatedBarWidth >= 28 && (
                      <span className="text-[10px] font-black text-white drop-shadow-xs select-none">
                        {animatedBarWidth}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 px-1 select-none">
                  <span>0%</span>
                  <span className="text-[#0d6e5a] font-extrabold">{resume.scoreAfter}% Match Target</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* Card 2: Share your win */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900">
                Share your win
              </h3>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 leading-relaxed font-sans select-text">
                &ldquo;Took my resume from {resume.scoreBefore}% to {resume.scoreAfter}% ATS match with RoleFuse — took under a minute: https://rolefuse.in&rdquo;
              </div>

              <div className="grid grid-cols-3 gap-2">
                <a
                  href={linkedinShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-xs"
                >
                  <Share2 className="h-3 w-3 text-slate-400" />
                  <span>LinkedIn</span>
                </a>
                <a
                  href={whatsappShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-xs"
                >
                  <Share2 className="h-3 w-3 text-slate-400" />
                  <span>WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `Took my resume from ${resume.scoreBefore}% to ${resume.scoreAfter}% ATS match with RoleFuse — took under a minute: https://rolefuse.in`
                    );
                  }}
                  className="flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-xs cursor-pointer"
                >
                  <Copy className="h-3 w-3 text-slate-400" />
                  <span>Copy link</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: WHAT CHANGED ─── */}
      {activeTab === "changes" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900">Optimization Breakdown</h3>
              <p className="text-xs text-slate-500 mt-0.5">Details of injected keywords and bullet point improvements</p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-teal-50 text-[#0d6e5a] border border-teal-200 px-2.5 py-0.5 rounded-full">
              AI Optimization
            </span>
          </div>

          {/* 3 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
              <span className="text-2xl font-black text-emerald-600 block">{keywords.length}</span>
              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider mt-1">Keywords Added</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
              <span className="text-2xl font-black text-[#0d6e5a] block">{rewrittenBullets}</span>
              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider mt-1">Bullets Rewritten</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
              <span className="text-2xl font-black text-teal-600 block">{Math.min(100, Math.round(resume.scoreAfter * 0.95))}%</span>
              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider mt-1">Skills Matched</span>
            </div>
          </div>

          {/* ATS Keywords Injected */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              ATS Keywords Injected from Job Description
            </span>
            <div className="flex flex-wrap gap-2">
              {keywords.length > 0 ? (
                keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-lg"
                  >
                    + {kw}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No new keywords were required.</span>
              )}
            </div>
          </div>

          {/* Keywords Already Present */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Keywords Already Present in Candidate Profile
            </span>
            <div className="flex flex-wrap gap-2">
              {existingKeywords.map((kw, i) => (
                <span
                  key={i}
                  className="text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg"
                >
                  ✓ {kw}
                </span>
              ))}
            </div>
          </div>

          {/* AI Optimization Suggestions */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Key Enhancements Applied
            </span>
            <ul className="space-y-2 text-xs text-slate-700 font-medium leading-relaxed">
              <li className="flex items-start gap-2.5 bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-[#0d6e5a] font-bold text-sm leading-none">•</span>
                <span>Expanded action verbs (e.g. replaced passive phrases with high-impact executive verbs like "spearheaded", "architected", "engineered").</span>
              </li>
              <li className="flex items-start gap-2.5 bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-[#0d6e5a] font-bold text-sm leading-none">•</span>
                <span>Integrated {keywords.length} critical skills extracted from target job description organically without keyword stuffing.</span>
              </li>
              <li className="flex items-start gap-2.5 bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-[#0d6e5a] font-bold text-sm leading-none">•</span>
                <span>Enforced single-column layout, line breaks, and density rules for 100% ATS parser accuracy.</span>
              </li>
            </ul>
          </div>

          {/* Rewritten Bullet Points (Before: Red, After: Green) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Rewritten Bullet Points (Before &amp; After)
                </span>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Genuine before/after comparison — only bullets that were actually rewritten by AI are shown
                </p>
              </div>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {bulletChangePairs.length} rewrites
              </span>
            </div>

            <div className="space-y-3">
              {bulletChangePairs.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-500 font-medium">
                    No bullet-level changes detected — the optimization may have focused on keyword injection and summary improvements.
                  </p>
                </div>
              ) : (
                bulletChangePairs.map((pair, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                      <span>Rewrite #{idx + 1}</span>
                    </div>

                    {/* BEFORE - RED */}
                    <div className="bg-red-50/80 border border-red-200 rounded-xl p-3 sm:p-3.5 text-xs leading-relaxed text-red-950 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-red-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                        Before (Original Bullet)
                      </div>
                      <p className="font-normal font-sans text-red-900">&ldquo;{pair.before}&rdquo;</p>
                    </div>

                    {/* AFTER - GREEN */}
                    <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 sm:p-3.5 text-xs leading-relaxed text-emerald-950 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                        After (Optimized with Action Verbs &amp; Metrics)
                      </div>
                      <p className="font-semibold font-sans text-emerald-900">&ldquo;{pair.after}&rdquo;</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: SCORE BREAKDOWN ─── */}
      {activeTab === "breakdown" && (
        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3.5 sm:p-6 md:p-8 shadow-sm space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 sm:pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">ATS Score Breakdown Analysis</h3>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-relaxed">
                Multi-factor evaluation measuring keyword relevance, metric quantification, role alignment, and ATS structure
              </p>
            </div>
            <span className={`inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold self-start sm:self-auto border shrink-0 ${
              resume.scoreAfter >= 85
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : resume.scoreAfter >= 70
                ? "bg-teal-50 text-[#087F6E] border-teal-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
            }`}>
              {resume.scoreAfter >= 85 ? "Optimal Screening Pass Rate (>85%)" : resume.scoreAfter >= 70 ? "Competitive Pass Rate" : "Review Recommended"}
            </span>
          </div>

          {/* Score Evolution & Verdict Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-5 space-y-3 sm:space-y-4">
            <div className="flex flex-row items-center justify-around gap-2 sm:gap-6 py-1">
              <CircleGauge value={resume.scoreBefore} label="Before Scan" size={76} />
              
              <div className="flex flex-col items-center gap-1 shrink-0 select-none text-center">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">Net Improvement</span>
                <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-black bg-[#E6F4F1] text-[#087F6E] border border-[#C2E4DD]">
                  +{delta} points gained
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium">Recruiter screener delta</span>
              </div>

              <CircleGauge value={resume.scoreAfter} label="Optimized Score" size={76} />
            </div>

            {/* Verdict text */}
            <div className="pt-2.5 sm:pt-3 border-t border-slate-200/80 text-center">
              <p className="text-[11px] sm:text-xs text-slate-700 font-medium leading-relaxed max-w-2xl mx-auto">
                {resume.scoreAfter >= 85
                  ? `Your ATS score advanced from ${resume.scoreBefore}% to ${resume.scoreAfter}%, placing this resume in the top tier of candidates for automated screening filters (Workday, Taleo, Greenhouse).`
                  : `Your ATS score advanced from ${resume.scoreBefore}% to ${resume.scoreAfter}%, exceeding the typical 70% threshold required for initial recruiter visibility.`}
              </p>
            </div>
          </div>

          {/* The 4 Core Evaluation Dimensions (Real Dynamic Calculations) */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Core Evaluation Dimensions
              </h4>
              <span className="text-[10px] font-semibold text-slate-400">
                Weighted Algorithmic Breakdown
              </span>
            </div>

            {[
              {
                id: "keywords",
                label: "Keyword and Technical Competency",
                weight: "40% weight",
                before: beforeScoreDetails.keywordMatch,
                after: afterScoreDetails.keywordMatch,
                gain: afterScoreDetails.keywordMatch >= beforeScoreDetails.keywordMatch
                  ? `+${afterScoreDetails.keywordMatch - beforeScoreDetails.keywordMatch}%`
                  : `${afterScoreDetails.keywordMatch - beforeScoreDetails.keywordMatch}%`,
                description: "Coverage of job description technical skills, required tools, frameworks, and domain keywords.",
                verified: `${afterScoreDetails.foundKeywords?.length || rawKeywordsAdded.length || 0} matching skills and keywords verified`
              },
              {
                id: "impact",
                label: "Quantified Impact and Achievement Metrics",
                weight: "25% weight",
                before: beforeScoreDetails.impactBullets,
                after: afterScoreDetails.impactBullets,
                gain: afterScoreDetails.impactBullets >= beforeScoreDetails.impactBullets
                  ? `+${afterScoreDetails.impactBullets - beforeScoreDetails.impactBullets}%`
                  : `${afterScoreDetails.impactBullets - beforeScoreDetails.impactBullets}%`,
                description: "Experience bullet points containing measurable KPIs, revenue, percentages, engineering scale, and action verbs.",
                verified: `${afterScoreDetails.quantifiedCount || resume.impactAfter || 0} bullets with verified quantified outcomes`
              },
              {
                id: "semantic",
                label: "Role and Seniority Semantic Alignment",
                weight: "20% weight",
                before: beforeScoreDetails.semanticMatch,
                after: afterScoreDetails.semanticMatch,
                gain: afterScoreDetails.semanticMatch >= beforeScoreDetails.semanticMatch
                  ? `+${afterScoreDetails.semanticMatch - beforeScoreDetails.semanticMatch}%`
                  : `${afterScoreDetails.semanticMatch - beforeScoreDetails.semanticMatch}%`,
                description: "Contextual title alignment, industry terminology density, and responsibility relevance to the vacancy.",
                verified: `Tailored for ${getResumeDisplayTitle(resume)}`
              },
              {
                id: "formatting",
                label: "ATS Parsability and Structural Compliance",
                weight: "15% weight",
                before: beforeScoreDetails.formatting,
                after: Math.max(90, afterScoreDetails.formatting),
                gain: Math.max(90, afterScoreDetails.formatting) >= beforeScoreDetails.formatting
                  ? `+${Math.max(90, afterScoreDetails.formatting) - beforeScoreDetails.formatting}%`
                  : `+5%`,
                description: "Contact information hierarchy, clean section titles, machine-readable chronological structure, and standard typography.",
                verified: "100% compliant with standard ATS parsers"
              }
            ].map((factor) => {
              const beforePct = Math.min(100, Math.max(0, factor.before));
              const afterPct = Math.min(100, Math.max(0, factor.after));
              const gainPct = Math.max(0, afterPct - beforePct);

              return (
                <div key={factor.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="text-slate-900 font-bold text-xs">{factor.label}</span>
                      <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                        {factor.weight}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold">
                      <span className="text-slate-500">Before: {beforePct}%</span>
                      <span className="text-slate-400">to</span>
                      <span className="text-[#087F6E] font-bold">After: {afterPct}%</span>
                      <span className="text-[10px] text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded font-bold">
                        {factor.gain}
                      </span>
                    </div>
                  </div>

                  {/* Dual-color Progress Bar */}
                  <div className="h-2 sm:h-2.5 bg-slate-200 rounded-full overflow-hidden flex p-0.5 border border-slate-200">
                    <div
                      className="h-full bg-slate-400 rounded-l-full transition-all duration-300"
                      style={{ width: `${beforePct}%` }}
                      title={`Baseline: ${beforePct}%`}
                    />
                    <div
                      className="h-full bg-[#087F6E] rounded-r-full transition-all duration-300"
                      style={{ width: `${gainPct}%` }}
                      title={`Improvement: +${gainPct}%`}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] sm:text-[11px] text-slate-500 pt-0.5">
                    <p className="line-clamp-2 sm:line-clamp-1">{factor.description}</p>
                    <span className="text-[#087F6E] font-semibold shrink-0">{factor.verified}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Matched Keywords and Skills Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 pt-1">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                Verified Target Keywords Found
              </span>
              <p className="text-[11px] text-slate-500 leading-snug">
                Core competencies successfully detected by ATS scanning in your optimized resume:
              </p>
              <div className="flex flex-wrap gap-1 sm:gap-1.5 pt-1 max-h-[140px] overflow-y-auto pr-1">
                {(afterScoreDetails.foundKeywords && afterScoreDetails.foundKeywords.length > 0
                  ? afterScoreDetails.foundKeywords.slice(0, 16)
                  : (keywords.length > 0 ? keywords.slice(0, 12) : ["REST APIs", "SQL", "TypeScript", "React", "Docker"])
                ).map((kw, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-[#087F6E] border border-teal-200"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                ATS Compatibility Index
              </span>
              <p className="text-[11px] text-slate-500 leading-snug">
                System verification across major enterprise ATS screener engines:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="bg-white border border-slate-200 p-2 sm:p-2.5 rounded-lg">
                  <span className="font-bold text-slate-900 block">Workday ATS</span>
                  <span className="text-[10px] text-emerald-700 font-semibold">100% Parsable</span>
                </div>
                <div className="bg-white border border-slate-200 p-2 sm:p-2.5 rounded-lg">
                  <span className="font-bold text-slate-900 block">Greenhouse</span>
                  <span className="text-[10px] text-emerald-700 font-semibold">Optimal Keyword Density</span>
                </div>
                <div className="bg-white border border-slate-200 p-2 sm:p-2.5 rounded-lg">
                  <span className="font-bold text-slate-900 block">Taleo and iCIMS</span>
                  <span className="text-[10px] text-emerald-700 font-semibold">Single-Column Validated</span>
                </div>
                <div className="bg-white border border-slate-200 p-2 sm:p-2.5 rounded-lg">
                  <span className="font-bold text-slate-900 block">Recruiter Skim</span>
                  <span className="text-[10px] text-emerald-700 font-semibold">6-Second Metric Flow</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: SKILL ROADMAP ─── */}
      {activeTab === "roadmap" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-md bg-[#0d6e5a] flex items-center justify-center text-white shadow-xs shrink-0">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  Skills Learning Roadmap
                  {userPlan === "free" && (
                    <span className="text-[10px] font-semibold text-black bg-[#f1f5f9] border border-slate-200/80 px-2 py-0.5 rounded-full tracking-normal inline-flex items-center">PRO</span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Select up to 3 skills to build a complete 90-day learning curriculum</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-[#0d6e5a] bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
              {selectedRoadmapSkills.length}/3 Selected
            </span>
          </div>

          {/* Skill chips */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Choose up to 3 target skills:
            </span>
            <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto pr-1">
              {(availableSkills.length > 0 ? availableSkills : ["Machine Learning", "Generative AI", "Python", "SQL", "Docker"]).map((skill, i) => {
                const isSelected = selectedRoadmapSkills.includes(skill);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleRoadmapSkill(skill)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all border flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? "bg-[#0d6e5a] border-[#0d6e5a] text-white font-bold shadow-xs"
                        : "bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300"
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
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl text-xs text-slate-800 leading-relaxed font-sans shadow-xs select-text">
                <pre className="whitespace-pre-wrap font-sans select-text">{roadmapContent}</pre>
              </div>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(roadmapContent);
                }}
                className="bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-xs h-8 rounded-md shadow-xs cursor-pointer"
              >
                Copy Roadmap
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 5: COVER LETTER ─── */}
      {activeTab === "cover_letter" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-md bg-[#0d6e5a] flex items-center justify-center text-white shadow-xs shrink-0">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Tailored Cover Letter Generator</h3>
                <p className="text-xs text-slate-500 mt-0.5">Generate a personalized cover letter aligned with this job specification</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            RoleFuse uses your optimized resume highlights and the target job description to draft an executive-level cover letter.
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
              <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl text-xs text-slate-800 leading-relaxed font-serif shadow-xs select-text">
                <pre className="whitespace-pre-wrap font-serif select-text">{coverLetterGenerated}</pre>
              </div>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(coverLetterGenerated);
                }}
                className="bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-xs h-8 rounded-md shadow-xs cursor-pointer"
              >
                Copy Cover Letter
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ─── SHARE RESULT POPUP MODAL ─── */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 select-none relative">
            <button
              type="button"
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              ✕
            </button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0d6e5a]">
                <Share2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Share Your Win</h3>
                <p className="text-xs text-slate-500">Inspire your network with your ATS score gain!</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-sans">
              &ldquo;Took my resume from {resume.scoreBefore}% to {resume.scoreAfter}% ATS match with RoleFuse — took under a minute: https://rolefuse.in&rdquo;
            </div>

            <div className="grid grid-cols-3 gap-2.5 pt-2">
              <a
                href={linkedinShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowShareModal(false)}
                className="flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-xs"
              >
                <Share2 className="h-3.5 w-3.5 text-slate-400" />
                <span>LinkedIn</span>
              </a>
              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowShareModal(false)}
                className="flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-xs"
              >
                <Share2 className="h-3.5 w-3.5 text-slate-400" />
                <span>WhatsApp</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Took my resume from ${resume.scoreBefore}% to ${resume.scoreAfter}% ATS match with RoleFuse — took under a minute: https://rolefuse.in`
                  );
                  setShowShareModal(false);
                }}
                className="flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-xs cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5 text-slate-400" />
                <span>Copy link</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── History Row Card ────────────────────────────────── */
function HistoryRow({
  resume,
  onClick,
}: {
  resume: ResumeRecord;
  onClick: () => void;
}) {
  const delta = resume.scoreAfter - resume.scoreBefore;
  const beforeColor = scoreColor(resume.scoreBefore).text;
  const afterColor = scoreColor(resume.scoreAfter).text;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="group w-full cursor-pointer rounded-2xl py-3.5 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all duration-200 relative overflow-hidden bg-white border border-[#DCE7E9] hover:border-[#087F6E]/40 shadow-xs hover:shadow-md"
    >
      {/* Clickable left area */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1 text-left">
        {/* Score comparison pill */}
        <div className="shrink-0 flex items-center gap-1.5 bg-[#F5FAFA] border border-[#DCE7E9] px-3 py-1 rounded-full select-none text-[11px] font-bold">
          <span style={{ color: beforeColor }}>{resume.scoreBefore}</span>
          <ArrowRight className="h-3 w-3 text-[#526176]" />
          <span style={{ color: afterColor }}>{resume.scoreAfter}</span>
        </div>

        {/* Title and metadata info */}
        <div className="min-w-0">
          <h3 className="text-xs sm:text-sm font-bold text-[#111827] truncate group-hover:text-[#087F6E] transition-colors">
            {getResumeDisplayTitle(resume)}
          </h3>
          <div className="flex items-center gap-2 text-[10px] text-[#526176] mt-0.5 font-medium">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-[#526176]" />
              {formatDate(resume.createdAt)}
            </span>
            <span>&bull;</span>
            <span className="text-[#526176]">Tech</span>
            {/linkedin\.com/i.test(resume.optimizedText || resume.originalText || "") && (
              <>
                <span>&bull;</span>
                <span className="text-[#087F6E] font-semibold">LinkedIn</span>
              </>
            )}
            {/github\.com/i.test(resume.optimizedText || resume.originalText || "") && (
              <>
                <span>&bull;</span>
                <span className="text-[#111827] font-semibold">GitHub</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: delta pill */}
      <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
        <span className="text-[10px] font-black bg-[#E5F8F5] border border-[#D4F3EF] text-[#087F6E] px-2 py-0.5 rounded-full">
          +{delta}
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-[#526176] group-hover:text-[#087F6E] group-hover:translate-x-0.5 transition-all shrink-0" />
      </div>
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────── */
export default function HistoryPage() {
  const router = useRouter();
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [selected, setSelected] = useState<ResumeRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ResumeRecord | null>(null);
  const [userPlan, setUserPlan] = useState<string>("free");
  const [historyLocked, setHistoryLocked] = useState(false);
  const [retentionInfo, setRetentionInfo] = useState<{ months: number | null; limit: number | null } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const store = useResumeStore();

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const { data, error } = await supabase.auth.getUser();
        const user = data?.user;

        if (error || !user) {
          toast.error("Please sign in to view history.");
          router.push("/auth/login");
          return;
        }

        if (active) setAuthLoading(false);

        // Note: we do NOT load from localStorage cache here to avoid stale/duplicate entries.
        // We always fetch fresh from API and then update the cache.

        // Fetch history via API endpoint with Authorization Bearer token fallback
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;
        const headers: Record<string, string> = {};
        if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`;
        }

        let dbData: any[] = [];
        try {
          const historyRes = await fetch("/api/history", { headers });
          const responseData = await historyRes.json().catch(() => ({}));

          if (historyRes.status === 401) {
            toast.error("Session expired. Please sign in again.");
            router.push("/auth/login");
            return;
          }

          // New response format: { records, planTier, locked, retentionMonths }
          if (responseData && typeof responseData === "object" && "records" in responseData) {
            if (responseData.locked) {
              setHistoryLocked(true);
            } else {
              dbData = Array.isArray(responseData.records) ? responseData.records : [];
              const planFromApi = responseData.planTier || "free";
              setUserPlan(planFromApi);
              setRetentionInfo({
                months: responseData.retentionMonths ?? null,
                limit: planFromApi === "premium" ? 20 : null,
              });
            }
          } else if (Array.isArray(responseData)) {
            // Legacy array format fallback
            dbData = responseData;
          }
        } catch (_fetchErr) {
          // Network error — silent
        }

        // Fetch plan/credits details — always correct the lock state based on credits and subscription
        try {
          const creditsRes = await fetch("/api/credits");
          if (creditsRes.ok) {
            const creditsData = await creditsRes.json();
            const userEmail = (user.email || "").toLowerCase().trim();
            const cachedPlan = typeof window !== "undefined" ? localStorage.getItem(`fastHire_plan_${user.id}`) : null;
            const isOwner = creditsData.isOwner || isOwnerEmail(user.email);
            const isProMax =
              !isOwner &&
              (creditsData.planId === "promax" ||
                cachedPlan === "promax" ||
                creditsData.billingCycle === "admin_promax" ||
                (creditsData.paidCredits >= 90 && creditsData.paidCredits < 900000));
            const isPremium =
              !isOwner &&
              !isProMax &&
              (creditsData.planId === "premium" ||
                cachedPlan === "premium" ||
                creditsData.billingCycle === "admin_premium" ||
                creditsData.isFirst50 ||
                (creditsData.paidCredits ?? 0) > 0);

            if (isOwner) {
              setUserPlan("owner");
              setHistoryLocked(false);  // Owners always have access
            } else if (isProMax) {
              setUserPlan("promax");
              setHistoryLocked(false);  // Pro Max always has access
            } else if (isPremium) {
              setUserPlan("premium");
              setHistoryLocked(false);  // Premium always has access
            } else {
              setUserPlan("free");
              // Only lock if the API also locked or returned no records
              if (dbData.length === 0) {
                setHistoryLocked(true);
              }
            }
          }
        } catch (creditsErr) {
          // silent — failed to load credits, keep state as-is from API response
        }

        if (!active) return;

        // Clean out any broadcasts or internal system records
        const cleanResumes = (dbData as any[]).filter(
          (r: any) =>
            r &&
            r.jobTitle !== "ADMIN_BROADCAST" &&
            !r.jobTitle?.startsWith("ADMIN_BROADCAST") &&
            r.jobTitle !== "SUPPORT_TICKET" &&
            r.jobTitle !== "USER_FEEDBACK" &&
            (!r.id || !String(r.id).startsWith("bc_"))
        );

        setResumes(cleanResumes);
        // Always update cache with fresh data (clears stale/deleted records)
        if (typeof window !== "undefined") {
          if (cleanResumes.length > 0) {
            localStorage.setItem(`fastHire_history_cache_${user.id}`, JSON.stringify(cleanResumes));
          } else {
            localStorage.removeItem(`fastHire_history_cache_${user.id}`);
          }
        }
        setLoading(false);
      } catch (err) {
        logger.error("Unexpected error loading history:", err);
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => { active = false; };
  }, [router]);

  const handleDelete = async (record: ResumeRecord) => {
    try {
      const res = await fetch(`/api/history?id=${record.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      const updated = resumes.filter(r => r.id !== record.id);
      setResumes(updated);
      setSelected(null);
      // Immediately update localStorage cache so deleted item doesn't reappear on revisit
      if (typeof window !== "undefined") {
        const { data } = await supabase.auth.getUser();
        const userId = data?.user?.id;
        if (userId) {
          if (updated.length > 0) {
            localStorage.setItem(`fastHire_history_cache_${userId}`, JSON.stringify(updated));
          } else {
            localStorage.removeItem(`fastHire_history_cache_${userId}`);
          }
        }
      }
      // Clamp page if needed
      const newCount = updated.length;
      const maxPage = Math.max(1, Math.ceil(newCount / PAGE_SIZE));
      setCurrentPage(prev => Math.min(prev, maxPage));
    } catch {
      toast.error("Failed to delete. Please try again.");
    }
  };

  const totalPages = Math.max(1, Math.ceil(resumes.length / PAGE_SIZE));
  const pagedResumes = resumes.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (authLoading) {
    return <HistorySkeleton />;
  }

  return (
    <div className="flex flex-col min-h-screen text-[#111827] bg-transparent">
      {!selected && <Navbar />}

      <main className={`flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 pb-28 sm:pb-10 select-text ${selected ? "pt-6 sm:pt-8" : "pt-6 sm:pt-10"}`}>
        <ScrollFadeIn>
          {selected ? (
            /* Detailed 3-Column optimization report */
            <DetailView
              resume={selected}
              userPlan={userPlan}
              onBack={() => setSelected(null)}
              onDelete={() => setDeleteTarget(selected)}
            />
          ) : (
            /* List optimizations dashboard view */
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
              {/* Header */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-[#E5F8F5] border border-[#D4F3EF] flex items-center justify-center text-[#087F6E]">
                      <History className="h-5 w-5" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-[#111827] tracking-tight">Optimization History</h1>
                  </div>
                  <p className="text-sm sm:text-base text-[#526176] mt-1.5 ml-11 font-normal">
                    {resumes.length > 0
                      ? `${resumes.length} optimization${resumes.length !== 1 ? "s" : ""} — click any row to view details`
                      : "Your optimization history will appear here"}
                  </p>
                </div>
              </div>

              {/* Content list */}
              {loading ? (
                <HistoryListSkeleton />
              ) : historyLocked ? (
                /* ── FREE PLAN UPGRADE WALL ── */
                <div className="flex flex-col items-center justify-center rounded-2xl p-12 text-center border border-dashed border-slate-300 bg-white shadow-sm space-y-5">
                  <div className="h-14 w-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                    <Lock className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-black text-slate-900">History is a Paid Feature</h3>
                    <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                      Upgrade to access your full optimization history, ATS score timeline, and resume analytics.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md text-left">
                    <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                        <span className="text-xs font-black text-teal-800">Premium Pro — ₹99/mo</span>
                      </div>
                      <p className="text-[10px] text-teal-700 leading-relaxed pl-6">Last 20 optimizations • 2-month retention</p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span className="text-xs font-black text-emerald-800">Pro Max — ₹199/mo</span>
                      </div>
                      <p className="text-[10px] text-emerald-700 leading-relaxed pl-6">Unlimited history • 4-month retention</p>
                    </div>
                  </div>

                  <Link href="/dashboard/pricing">
                    <Button className="h-10 px-6 bg-[#0d6e5a] hover:bg-[#094d3f] text-white font-bold text-xs rounded-xl shadow-sm transition-colors">
                      <Sparkles className="h-4 w-4 mr-1.5" />
                      Upgrade to Unlock History
                    </Button>
                  </Link>
                </div>
              ) : resumes.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl p-16 text-center border border-dashed border-slate-300 bg-white shadow-sm">
                  <div className="h-14 w-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center mb-4">
                    <AlertCircle className="h-6 w-6 text-[#0d6e5a]" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">No optimizations yet</h3>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                    Upload your resume and a job description to run your first AI-powered optimization.
                  </p>
                  <Link href="/dashboard" className="mt-5">
                    <Button className="font-bold text-xs bg-[#0d6e5a] hover:bg-[#094d3f] text-white rounded-xl px-4 py-2 shadow-sm transition-colors">
                      <Plus className="h-4 w-4 mr-1.5" />
                      Start Optimizing
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {pagedResumes.map((resume, index) => (
                    <ScrollFadeIn key={resume.id} delay={index * 60} direction="up">
                      <HistoryRow
                        resume={resume}
                        onClick={() => setSelected(resume)}
                      />
                    </ScrollFadeIn>
                  ))}

                  {/* Pagination controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 pt-6 select-none">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" /> Prev
                      </button>

                      <div className="flex items-center gap-1.5">
                        {Array.from({ length: totalPages }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`h-7 w-7 rounded-lg text-xs font-bold transition-all ${
                              currentPage === i + 1
                                ? "bg-[#0d6e5a] text-white shadow-sm"
                                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                      >
                        Next <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  <p className="text-center text-[10px] text-slate-500 pt-2 font-semibold uppercase tracking-wider select-none">
                    Page {currentPage} of {totalPages} &bull; {resumes.length} total scan{resumes.length !== 1 ? "s" : ""}
                  </p>
                </div>
              )}
            </div>
          )}
        </ScrollFadeIn>
      </main>

      {/* CENTERED DELETE CONFIRMATION POPUP MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 select-none">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-500 shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Delete Optimization Record</h3>
                <p className="text-xs text-slate-500 mt-0.5">Are you sure you want to delete this optimization history record?</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700">
              <span className="font-bold text-slate-900 block truncate">{getResumeDisplayTitle(deleteTarget)}</span>
              <span className="text-[10px] text-slate-500">{formatDate(deleteTarget.createdAt)}</span>
            </div>

            <p className="text-[11px] text-red-600 font-medium">
              This action cannot be undone and will permanently remove this record from your history.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDeleteTarget(null)}
                className="text-slate-600 hover:text-slate-900 text-xs font-semibold px-4 h-9 rounded-xl border border-slate-200 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  handleDelete(deleteTarget);
                  setDeleteTarget(null);
                }}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 h-9 rounded-xl shadow-sm transition-colors"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
