"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Copy,
  Check,
  FileText,
  ShieldCheck,
  Maximize2,
  Minimize2,
  BookmarkPlus,
  BookmarkCheck,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  parseResumeIntoBlocks,
  stripMarkdownAsterisks,
  getCleanExportFilename,
  toSectionTitle,
  splitCertText,
  isRoleOrTitle,
} from "@/lib/export/pdf-document";
import { useUpgradeModalStore } from "@/store/useUpgradeModalStore";
import { generateUUID } from "@/lib/utils";

function getPdfDownloadLimit(plan: string): number {
  if (plan === "promax" || plan === "owner") return 30;
  if (plan === "premium") return 15;
  return 1;
}

function getMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

function getReadableLinkLabel(url: string, fallback?: string): string {
  if (!url) return fallback || url;
  const lower = url.toLowerCase();
  if (lower.includes("linkedin.com")) return "LinkedIn";
  if (lower.includes("github.com")) return "GitHub";
  return fallback || url;
}

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

interface ResumeViewerProps {
  text: string;
  originalText?: string;
  resumeId: string;
  jobDescription: string;
  userId?: string;
  userPlan?: string;
  jobTitle?: string;
  onSavedToLibrary?: () => void;
}

export default function ResumeViewer({
  text,
  originalText,
  resumeId,
  jobDescription,
  userId = "",
  userPlan = "free",
  jobTitle = "",
  onSavedToLibrary,
}: ResumeViewerProps) {
  const [copied, setCopied] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [docxLoading, setDocxLoading] = useState(false);
  const [savingLibrary, setSavingLibrary] = useState(false);
  const [isSavedInLibrary, setIsSavedInLibrary] = useState(false);

  // Layout & Template State
  const [isFullLength, setIsFullLength] = useState(false);
  const [templateStyle, setTemplateStyle] = useState<"academic" | "modern" | "clean">("academic");

  // Parse blocks for rendering
  const blocks = parseResumeIntoBlocks(text);

  // Set up original words Set for diff highlighting
  const originalClean = (originalText || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const originalWordsSet = new Set(originalClean.split(/\s+/).filter(Boolean));

  // Word-by-word diff highlighter helper
  const renderHighlightedText = (lineText: string) => {
    const cleanLineText = stripMarkdownAsterisks(lineText);
    if (!originalText || originalWordsSet.size === 0) {
      return <span>{cleanLineText}</span>;
    }
    const parts = cleanLineText.split(/(\s+)/);
    return parts.map((part, idx) => {
      if (/^\s+$/.test(part)) {
        return <span key={idx}>{part}</span>;
      }
      const clean = part.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (clean && !originalWordsSet.has(clean)) {
        return (
          <span
            key={idx}
            className="bg-[#D1FAE5] text-emerald-900 px-0.5 rounded font-normal dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            {part}
          </span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  const handleCopy = async () => {
    const cleanText = text.split("\n").map((l) => stripMarkdownAsterisks(l)).join("\n");
    await navigator.clipboard.writeText(cleanText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Explicit Save Option: Saves optimized resume directly into the user's My Resumes library
  const handleSaveToLibrary = async () => {
    if (!userId) {
      toast.error("Please sign in to save resumes to your library.");
      return;
    }

    setSavingLibrary(true);
    try {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: generateUUID(),
          originalText: originalText || text,
          optimizedText: text,
          jobDescription: "", // Empty JD marks it as a standalone user resume in the library
          jobTitle: jobTitle ? `${jobTitle} (Optimized)` : "Optimized Resume",
          company: "General Application",
          scoreBefore: 70,
          scoreAfter: 90,
          keywordsBefore: 0,
          keywordsAfter: 10,
          impactBefore: 0,
          impactAfter: 10,
          keywordsAdded: [],
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save resume to library.");
      }

      setIsSavedInLibrary(true);
      if (onSavedToLibrary) onSavedToLibrary();
    } catch (err: any) {
      toast.error(err.message || "Failed to save to Resumes library.");
    } finally {
      setSavingLibrary(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (userPlan === "free") {
      useUpgradeModalStore.getState().openModal({
        badge: "DOWNLOAD BLOCKED",
        title: "Your 2 free optimizations are used up",
        description:
          "Your optimized resume is saved and stays in your history. Free includes the ATS score and live preview; downloading is on a paid plan.",
      });
      return;
    }

    const pdfLimit = getPdfDownloadLimit(userPlan);
    if (userId && pdfLimit !== Infinity) {
      const storageKey = `fastHire_pdfDownloads_${userId}_${getMonthKey()}`;
      const usedCount = parseInt(localStorage.getItem(storageKey) || "0", 10);
      if (usedCount >= pdfLimit) {
        toast.error(`You've reached your ${pdfLimit} PDF downloads for this month. Upgrade to Pro Max for 30/month.`);
        return;
      }
      localStorage.setItem(storageKey, (usedCount + 1).toString());
    }

    setPdfLoading(true);
    try {
      const response = await fetch("/api/export/pdf/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error("PDF download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = getCleanExportFilename(text, ".pdf", jobTitle);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err.message || "Failed to download PDF.");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDownloadDOCX = async () => {
    if (userPlan === "free") {
      useUpgradeModalStore.getState().openModal({
        badge: "DOWNLOAD BLOCKED",
        title: "Your 2 free optimizations are used up",
        description:
          "Your optimized resume is saved and stays in your history. Free includes the ATS score and live preview; downloading is on a paid plan.",
      });
      return;
    }

    setDocxLoading(true);
    try {
      const response = await fetch("/api/export/docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, text }),
      });

      if (!response.ok) throw new Error("DOCX download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = getCleanExportFilename(text, ".docx", jobTitle);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err.message || "Failed to download DOCX.");
    } finally {
      setDocxLoading(false);
    }
  };

  // Font family and layout accents per template style
  const getStyleConfig = () => {
    switch (templateStyle) {
      case "modern":
        return {
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          headerBorder: "border-b-2 border-slate-900",
          headerCase: "font-black tracking-tight",
          nameStyle: "font-extrabold tracking-tight",
          sectionSpacing: "mt-4 mb-1.5",
          bodySize: "text-[10.5px] sm:text-[11px]",
          nameSize: "text-[22px] sm:text-[27px]",
          contactSize: "text-[10px] sm:text-[11px]",
          sectionSize: "text-[11px] sm:text-[12.5px]",
        };
      case "clean":
        return {
          fontFamily: "Arial, Helvetica, sans-serif",
          headerBorder: "border-b border-slate-500",
          headerCase: "font-bold tracking-widest uppercase",
          nameStyle: "font-bold tracking-normal",
          sectionSpacing: "mt-4 mb-1.5",
          bodySize: "text-[10.5px] sm:text-[11px]",
          nameSize: "text-[21px] sm:text-[26px]",
          contactSize: "text-[10px] sm:text-[11px]",
          sectionSize: "text-[11px] sm:text-[12.5px]",
        };
      case "academic":
      default:
        return {
          fontFamily: "'Times New Roman', Times, 'Liberation Serif', serif",
          headerBorder: "border-b border-black",
          headerCase: "font-bold tracking-normal",
          nameStyle: "font-bold tracking-normal",
          sectionSpacing: "mt-3.5 mb-1",
          bodySize: "text-[10px] sm:text-[10.5px]",
          nameSize: "text-2xl sm:text-[27px]",
          contactSize: "text-[9.5px] sm:text-[10px]",
          sectionSize: "text-xs sm:text-[12.5px]",
        };
    }
  };

  const styleConfig = getStyleConfig();

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
      {/* Top Header Panel: Title & Primary Actions */}
      <div className="bg-gradient-to-r from-slate-50 to-white px-3 sm:px-5 py-3 border-b border-slate-200 flex flex-col sm:flex-row gap-2.5 sm:gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#0d6e5a] shrink-0" />
          <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm tracking-tight">
            Optimized Resume Preview
          </h3>
          <span className="hidden sm:inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[9px] font-bold text-emerald-700 uppercase tracking-wider">
            ATS Ready
          </span>
        </div>

        {/* Action Downloads / Saving / Copy */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {/* Save to Library Button */}
          <Button
            onClick={handleSaveToLibrary}
            disabled={savingLibrary || isSavedInLibrary}
            size="sm"
            className={`flex-1 sm:flex-initial text-xs h-8 rounded-lg flex items-center justify-center gap-1.5 px-3 cursor-pointer font-semibold transition-all ${
              isSavedInLibrary
                ? "bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100"
                : "bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 shadow-sm"
            }`}
          >
            {savingLibrary ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0d6e5a]" />
            ) : isSavedInLibrary ? (
              <BookmarkCheck className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <BookmarkPlus className="h-3.5 w-3.5 text-[#0d6e5a]" />
            )}
            <span>{isSavedInLibrary ? "Saved" : "Save"}</span>
          </Button>

          <button
            onClick={handleCopy}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all text-slate-600 hover:text-slate-900 border border-slate-200 bg-white h-8 shadow-sm hover:bg-slate-50"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Copied!" : "Copy"}</span>
          </button>

          <Button
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
            className={`flex-1 sm:flex-initial text-xs h-8 rounded-lg flex items-center justify-center gap-1.5 px-3 sm:px-4 cursor-pointer font-semibold shadow-sm transition-all ${
              userPlan === "free"
                ? "bg-slate-100 text-slate-400 hover:bg-slate-200 border border-slate-200"
                : "bg-[#0d6e5a] hover:bg-[#0a5a49] text-white"
            }`}
          >
            {pdfLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
            <span>PDF</span>
            {userPlan === "free" && (
              <span className="bg-slate-300/70 text-slate-500 text-[8px] font-black uppercase px-1 py-px rounded">
                PRO
              </span>
            )}
          </Button>

          <Button
            onClick={handleDownloadDOCX}
            disabled={docxLoading}
            variant={userPlan === "free" ? "ghost" : "outline"}
            className={`flex-1 sm:flex-initial text-xs h-8 rounded-lg flex items-center justify-center gap-1.5 px-3 sm:px-4 cursor-pointer font-semibold transition-all ${
              userPlan === "free"
                ? "bg-slate-100 text-slate-400 hover:bg-slate-200 border border-slate-200"
                : "border-slate-200 text-slate-600 hover:bg-slate-50 bg-transparent shadow-sm"
            }`}
          >
            {docxLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
            <span>DOCX</span>
            {userPlan === "free" && (
              <span className="bg-slate-300/70 text-slate-500 text-[8px] font-black uppercase px-1 py-px rounded">
                PRO
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Secondary Controls Bar: Template Style & Full Length Toggle */}
      <div className="bg-slate-50 px-3 sm:px-5 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Template Style Selector */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
            Template
          </span>
          <button
            type="button"
            onClick={() => setTemplateStyle("academic")}
            className={`px-2.5 py-1 rounded-md text-[10.5px] font-semibold transition-all cursor-pointer ${
              templateStyle === "academic"
                ? "bg-[#0d6e5a] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            Academic
          </button>
          <button
            type="button"
            onClick={() => setTemplateStyle("modern")}
            className={`px-2.5 py-1 rounded-md text-[10.5px] font-semibold transition-all cursor-pointer ${
              templateStyle === "modern"
                ? "bg-[#0d6e5a] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            Modern
          </button>
          <button
            type="button"
            onClick={() => setTemplateStyle("clean")}
            className={`px-2.5 py-1 rounded-md text-[10.5px] font-semibold transition-all cursor-pointer ${
              templateStyle === "clean"
                ? "bg-[#0d6e5a] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            Minimal
          </button>
        </div>

        {/* Full Length / Scrollable View Toggle */}
        <button
          type="button"
          onClick={() => setIsFullLength(!isFullLength)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] font-semibold bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100 transition-all cursor-pointer ml-auto"
        >
          {isFullLength ? (
            <>
              <Minimize2 className="h-3 w-3 text-[#0d6e5a]" />
              <span>Compact</span>
            </>
          ) : (
            <>
              <Maximize2 className="h-3 w-3 text-[#0d6e5a]" />
              <span>Full Page</span>
            </>
          )}
        </button>
      </div>

      {/* Resume Display Area */}
      <div
        className={`flex-1 p-2 sm:p-5 md:p-8 bg-slate-100/60 select-text transition-all ${
          isFullLength ? "overflow-visible min-h-[800px]" : "overflow-y-auto max-h-[720px] sm:max-h-[840px] overscroll-contain"
        }`}
      >
        {/* Paper-like resume card */}
        <div
          className="w-full max-w-3xl mx-auto bg-white text-black rounded-sm sm:rounded-md p-5 sm:p-8 md:p-11 shadow-lg sm:shadow-2xl ring-1 ring-black/5 select-text relative break-words transition-all font-serif"
          style={{ fontFamily: styleConfig.fontFamily, lineHeight: "1.35" }}
        >
          {blocks.map((block, idx) => {
            switch (block.type) {
              case "name":
                return (
                  <h1
                    key={idx}
                    className={`${styleConfig.nameSize} text-center text-black mb-0 leading-tight select-text ${styleConfig.nameStyle}`}
                    style={{
                      fontFamily: styleConfig.fontFamily,
                      fontVariant: templateStyle === "academic" ? "small-caps" : undefined,
                      letterSpacing: templateStyle === "academic" ? "0.04em" : undefined,
                    }}
                  >
                    {block.text}
                  </h1>
                );
              case "subtitle":
                return (
                  <div
                    key={idx}
                    className="text-center font-bold text-black text-xs sm:text-[13px] mt-0.5 mb-1.5 tracking-tight select-text"
                    style={{ fontFamily: styleConfig.fontFamily }}
                  >
                    {block.text}
                  </div>
                );
              case "contact": {
                const rawSegments = block.segments.filter((seg) => !isRoleOrTitle(seg.text));
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
                  <div
                    key={idx}
                    className={`flex justify-center items-center flex-wrap gap-x-3.5 sm:gap-x-4 gap-y-1 mt-0.5 mb-2 leading-normal select-text ${styleConfig.contactSize}`}
                    style={{ fontFamily: styleConfig.fontFamily }}
                  >
                    {cleanSegments.map((seg, sIdx) => {
                      const lower = (seg.text || "").toLowerCase() + " " + (seg.url || "").toLowerCase();
                      let iconType: "phone" | "email" | "linkedin" | "github" | "globe" = "globe";
                      if (seg.text.includes("@") || lower.includes("@")) iconType = "email";
                      else if (/\+?\d[\d\s\-\(\)]{7,}/.test(seg.text)) iconType = "phone";
                      else if (lower.includes("linkedin")) iconType = "linkedin";
                      else if (lower.includes("github")) iconType = "github";

                      let cleanHandle = seg.text
                        .replace(/^https?:\/\/(www\.)?/i, "")
                        .replace(/^(?:linkedin profile|github profile|portfolio|linkedin|github|email|phone|mobile|tel|cell|location|address)\b\s*[:\-]?\s*/i, "")
                        .replace(/\/$/, "")
                        .replace(/^mailto:/, "")
                        .replace(/^tel:/, "")
                        .trim();
                      if (!cleanHandle) {
                        cleanHandle = iconType === "linkedin" ? "LinkedIn" : (iconType === "github" ? "GitHub" : (seg.url || "Link"));
                      }

                      const isActualUrl = (s?: string) => Boolean(s && (s.includes(".com") || s.includes("/") || s.startsWith("http")));
                      const linkHref = seg.url && isActualUrl(seg.url)
                        ? seg.url
                        : (isActualUrl(seg.text)
                          ? (seg.text.startsWith("http") ? seg.text : `https://${seg.text.replace(/^(?:linkedin|github):?\s*/i, "")}`)
                          : null);

                      const el =
                        seg.isLink && linkHref ? (
                          <a
                            href={linkHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline text-black"
                          >
                            {cleanHandle}
                          </a>
                        ) : (
                          <span className="text-black">{cleanHandle}</span>
                        );

                      return (
                        <span key={sIdx} className="inline-flex items-center">
                          {renderContactIcon(iconType)}
                          {el}
                        </span>
                      );
                    })}
                  </div>
                );
              }
              case "section":
                return (
                  <h2
                    key={idx}
                    className={`${styleConfig.sectionSize} text-black pb-0.5 leading-snug select-text ${styleConfig.sectionSpacing} ${styleConfig.headerBorder} ${styleConfig.headerCase}`}
                  >
                    {toSectionTitle(block.text)}
                  </h2>
                );
              case "summary": {
                const cleanText = block.text.trim();
                return (
                  <p
                    key={idx}
                    className={`${styleConfig.bodySize} mb-1.5 mt-1 text-black leading-relaxed select-text`}
                    style={{ textAlign: "justify", textJustify: "inter-word", hyphens: "none" }}
                  >
                    {renderHighlightedText(cleanText)}
                  </p>
                );
              }
              case "skillLine":
                return (
                  <div key={idx} className={`${styleConfig.bodySize} mb-0.5 leading-snug select-text`}>
                    <span className="font-bold text-black">{block.label}: </span>
                    <span className="text-black" style={{ hyphens: "none" }}>
                      {renderHighlightedText(block.value)}
                    </span>
                  </div>
                );
              case "project":
                return (
                  <div key={idx} className="mb-2">
                    <div className={`flex flex-row flex-wrap justify-between items-baseline gap-x-2 ${styleConfig.bodySize} font-bold text-black mt-1.5 mb-0.5 leading-snug select-text`}>
                      <div className="flex items-baseline gap-1.5 flex-wrap flex-1 min-w-0">
                        <span>{block.name}</span>
                        {block.tech && (
                          <span className="font-semibold text-black">&nbsp;—&nbsp;{renderHighlightedText(block.tech)}</span>
                        )}
                        {block.projectUrl && (
                          <a
                            href={block.projectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[9px] text-blue-700 underline font-normal break-all"
                          >
                            {getReadableLinkLabel(block.projectUrl, block.name)}
                          </a>
                        )}
                      </div>
                      {(block as any).dates ? (
                        <span className="font-semibold text-black shrink-0 ml-auto">{(block as any).dates}</span>
                      ) : null}
                    </div>
                    {block.bullets.map((bullet, bIdx) => {
                      const cleanBullet = bullet
                        .replace(/^\s*([•\-\*–—+•\u2022\u25cf\u2043▸►→]|\d+\.)\s*/, "")
                        .trim();
                      return (
                        <div
                          key={bIdx}
                          className={`flex items-start ${styleConfig.bodySize} mb-px pl-3 leading-relaxed select-text`}
                        >
                          <span className="w-3 shrink-0 select-none text-black mt-px">•</span>
                          <span className="flex-1 min-w-0 text-black" style={{ textAlign: "justify", textJustify: "inter-word" }}>
                            {renderHighlightedText(cleanBullet)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );

              case "job":
                return (
                  <div key={idx} className="mb-2">
                    <div className={`flex flex-row flex-wrap justify-between items-baseline gap-x-2 ${styleConfig.bodySize} font-bold text-black mt-1.5 leading-snug select-text`}>
                      <span className="flex-1 min-w-0">{renderHighlightedText(block.title)}</span>
                      <span className="font-semibold text-black shrink-0 ml-auto">{renderHighlightedText(block.dates)}</span>
                    </div>
                    {block.company || (block as any).tech ? (
                      <div className={`flex flex-row flex-wrap justify-between items-baseline gap-x-2 ${styleConfig.bodySize} italic text-black mb-0.5 leading-snug select-text`}>
                        <span className="min-w-0">{renderHighlightedText(block.company || "")}</span>
                        {(block as any).tech ? (
                          <span className="ml-auto not-italic font-normal">{renderHighlightedText((block as any).tech)}</span>
                        ) : null}
                      </div>
                    ) : null}
                    {block.bullets.map((bullet, bIdx) => {
                      const cleanBullet = bullet
                        .replace(/^\s*([•\-\*–—+•\u2022\u25cf\u2043▸►→]|\d+\.)\s*/, "")
                        .trim();
                      return (
                        <div
                          key={bIdx}
                          className={`flex items-start ${styleConfig.bodySize} mb-px pl-3 leading-relaxed select-text`}
                        >
                          <span className="w-3 shrink-0 select-none text-black mt-px">•</span>
                          <span className="flex-1 min-w-0 text-black" style={{ textAlign: "justify", textJustify: "inter-word" }}>
                            {renderHighlightedText(cleanBullet)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              case "education":
                return (
                  <div key={idx} className="mb-1.5">
                    <div className={`flex flex-row flex-wrap justify-between items-baseline gap-x-2 ${styleConfig.bodySize} font-bold text-black leading-snug select-text`}>
                      <span className="min-w-0">{renderHighlightedText(block.degree)}</span>
                      <span className="font-semibold text-black ml-auto">{renderHighlightedText(block.dates)}</span>
                    </div>
                    <div className={`flex flex-wrap justify-between items-baseline gap-x-2 ${styleConfig.bodySize} italic text-black leading-snug select-text`}>
                      <span className="min-w-0">{renderHighlightedText(block.school)}</span>
                      <span className="ml-auto not-italic">{renderHighlightedText(block.gpa)}</span>
                    </div>
                  </div>
                );
              case "bullet":
                return (
                  <div key={idx} className={`flex items-start ${styleConfig.bodySize} mb-px pl-3 leading-relaxed select-text`}>
                    <span className="w-3 shrink-0 select-none text-black mt-px">•</span>
                    <span className="flex-1 min-w-0 text-black">{renderHighlightedText(block.text)}</span>
                  </div>
                );
              case "cert": {
                const { title, rest } = splitCertText(block.text);
                return (
                  <div key={idx} className={`flex items-start ${styleConfig.bodySize} mb-px pl-3 leading-relaxed`}>
                    <span className="w-3 shrink-0 select-none text-black mt-px">•</span>
                    <span className="flex-1 min-w-0 text-black" style={{ textAlign: "justify", textJustify: "inter-word" }}>
                      {title ? <span className="font-bold">{title}</span> : null}
                      {renderHighlightedText(rest)}
                    </span>
                  </div>
                );
              }
              case "link":
                return (
                  <a
                    key={idx}
                    href={block.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styleConfig.bodySize} text-blue-600 underline mb-0.5 block leading-normal select-text`}
                  >
                    {block.label}
                  </a>
                );
              case "spacer":
                return <div key={idx} className="h-1.5" />;
              default:
                return null;
            }
          })}
        </div>
      </div>
    </div>
  );
}
