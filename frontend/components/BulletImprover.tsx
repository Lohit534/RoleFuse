"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { hasQuantifiedMetric } from "@/lib/ats/scorer";
import { extractScorableBullets, hasStrongActionVerb, cleanBulletText, isContactOrHeaderLine } from "@/lib/ats/bullets";
import {
  Sparkles,
  CheckCircle2,
  Check,
  X,
  Loader2,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useUpgradeModalStore } from "@/store/useUpgradeModalStore";

interface BulletImproverProps {
  resumeText: string;
  jobDescription: string;
  userId: string;
  userPlan: string;
  onChange: (updatedText: string, wasImproved?: boolean) => void;
}

interface ImprovementResult {
  improvedBullet: string;
  actionVerbUsed: string;
  metricsAdded: string;
  keywordsInjected: string[];
  explanation: string;
}

function getAutoImproveLimit(plan: string): number {
  if (plan === "promax" || plan === "owner") return Infinity;
  if (plan === "premium") return 10;
  return 2; // free
}

function getMonthKey() {
  return new Date().toISOString().slice(0, 7); // "YYYY-MM"
}

export default function BulletImprover({
  resumeText,
  jobDescription,
  userId,
  userPlan,
  onChange,
}: BulletImproverProps) {
  const [loadingMap, setLoadingMap] = useState<Record<number, boolean>>({});
  const [improvements, setImprovements] = useState<
    Record<number, ImprovementResult | null>
  >({});
  const [usedThisSession, setUsedThisSession] = useState(0);

  const limit = getAutoImproveLimit(userPlan);
  const storageKey = `fastHire_autoImprove_count_${userId}_${getMonthKey()}`;
  const storedCount = parseInt(
    typeof window !== "undefined"
      ? localStorage.getItem(storageKey) || "0"
      : "0",
    10,
  );
  const totalUsed = storedCount;
  const remaining =
    limit === Infinity ? Infinity : Math.max(0, limit - totalUsed);

  // 1. Section-aware extraction (Experience / Internships / Projects only).
  // Shared with the ATS scorer so the "Missing Metrics" box lists the same bullets.
  const bulletItems = extractScorableBullets(resumeText).map((b) => ({
    line: b.rawLine,
    index: b.index,
    trimmed: b.rawLine.trim(),
    isBullet: true,
  }));

  // 2. Review checks for a single bullet text (identical rules to the scorer)
  const checkBullet = (text: string) => {
    const cleanText = cleanBulletText(text);
    const hasVerb = hasStrongActionVerb(cleanText);
    const hasMetric = hasQuantifiedMetric(cleanText);
    return { hasVerb, hasMetric, verbsDetected: [] as string[], cleanText };
  };

  // 3. Request auto-improvement with plan limit check
  const handleAutoImprove = async (bulletIdx: number, rawLine: string) => {
    // Plan-based limit check
    if (remaining <= 0) {
      useUpgradeModalStore.getState().openModal({
        badge: "PRO",
        title: "Bullet Improver Limit Reached",
        description:
          userPlan === "free"
            ? "You've used all 2 free auto-improves this month. Upgrade to Premium Pro (10/month) or Pro Max (unlimited) to rewrite bullet points with AI."
            : "You've used all Premium auto-improves this month. Upgrade to Pro Max for unlimited auto-improves.",
      });
      return;
    }

    const { cleanText } = checkBullet(rawLine);
    setLoadingMap((prev) => ({ ...prev, [bulletIdx]: true }));

    try {
      const response = await fetch("/api/improve-bullet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bullet: cleanText, jobDescription }),
      });

      if (!response.ok) throw new Error("Failed to optimize bullet.");

      const data = await response.json();
      setImprovements((prev) => ({ ...prev, [bulletIdx]: data }));

      // Increment usage counter in localStorage
      if (limit !== Infinity && userId) {
        localStorage.setItem(storageKey, (totalUsed + 1).toString());
      }
      setUsedThisSession((n) => n + 1);
      toast.success("Bullet optimized!");
    } catch (err: any) {
      toast.error(err.message || "Could not improve bullet.");
    } finally {
      setLoadingMap((prev) => ({ ...prev, [bulletIdx]: false }));
    }
  };

  // 4. Accept rewrite and apply back to resume text
  const handleAccept = (
    bulletIdx: number,
    rawLine: string,
    improvedText: string,
  ) => {
    const markerMatch = rawLine.match(/^(\s*([-*•+]|(\d+\.))\s*)/);
    const marker = markerMatch ? markerMatch[1] : "• ";

    // Clean any residual prefixes or markers
    const cleanNewBullet =
      improvedText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .find((l) => l.length > 0) || "";

    const finalBullet = cleanNewBullet
      .replace(/^\s*([-*•+]|(\d+\.))\s+/, "")
      // Only strip label prefixes like "Improved:" — never the real action verb ("Optimized MySQL…")
      .replace(/^(?:Optimized|Improved|Rewritten|Enhanced|Revised|Updated|Bullet)\s*(?:bullet)?\s*[:–\-]\s+/i, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!finalBullet) {
      toast.error("The suggested bullet was empty. Nothing was changed.");
      return;
    }

    const currentLines = resumeText.split(/\r?\n/);
    const targetLine = currentLines[bulletIdx] || "";
    if (/@|https?:|linkedin\.com|github\.com|\b(?:phone|mobile|tel|email)\b|\+91|\b\d{10}\b/i.test(targetLine) || isContactOrHeaderLine(targetLine)) {
      toast.error("Contact details cannot be overwritten by a bullet rewrite.");
      return;
    }

    currentLines[bulletIdx] = `• ${finalBullet}`;
    const updatedResume = currentLines.join("\n");
    onChange(updatedResume, true);

    setImprovements((prev) => {
      const next = { ...prev };
      delete next[bulletIdx];
      return next;
    });
    toast.success("Applied to resume! ATS score updated.");
  };

  // 5. Dismiss improvements card
  const handleReject = (bulletIdx: number) => {
    setImprovements((prev) => {
      const next = { ...prev };
      delete next[bulletIdx];
      return next;
    });
  };

  if (bulletItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-dashed border-gray-200 bg-gray-50/50 rounded-2xl min-h-[300px] text-center">
        <AlertCircle className="h-9 w-9 text-slate-400 mb-3" />
        <h4 className="font-bold text-slate-700 text-sm">
          No Bullet Points Detected
        </h4>
        <p className="text-sm text-slate-500 max-w-xs mt-1 leading-relaxed">
          Ensure your resume includes list items starting with dashes (-) or
          bullet points (•) to activate individual line optimizations.
        </p>
      </div>
    );
  }

  const [filterMode, setFilterMode] = useState<"needs-improvement" | "all">("needs-improvement");

  const stats = bulletItems.reduce(
    (acc, curr) => {
      const check = checkBullet(curr.line);
      if (check.hasVerb) acc.verbs++;
      if (check.hasMetric) acc.metrics++;
      return acc;
    },
    { verbs: 0, metrics: 0 },
  );

  const missingVerbsCount = Math.max(0, bulletItems.length - stats.verbs);
  const missingMetricsCount = Math.max(0, bulletItems.length - stats.metrics);
  const bulletsNeedingImprovement = bulletItems.filter(({ line }) => {
    const c = checkBullet(line);
    return !c.hasVerb || !c.hasMetric;
  });

  const displayedBullets = filterMode === "needs-improvement" ? bulletsNeedingImprovement : bulletItems;

  return (
    <div className="space-y-6">
      {/* Overview stats panel — focus on missing items */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900 text-slate-100 p-4 rounded-2xl border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20">
            <X className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">
              Action Verbs
            </div>
            <div className="text-base font-black text-white">
              {missingVerbsCount > 0 ? (
                <span className="text-red-400">{missingVerbsCount} Missing</span>
              ) : (
                <span className="text-emerald-400">All Passed</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20">
            <AlertCircle className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">
              Metrics
            </div>
            <div className="text-base font-black text-white">
              {missingMetricsCount > 0 ? (
                <span className="text-amber-400">{missingMetricsCount} Missing</span>
              ) : (
                <span className="text-emerald-400">All Passed</span>
              )}
            </div>
          </div>
        </div>

        {/* Auto-improve usage counter */}
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center border ${remaining === 0 ? "bg-red-500/10 border-red-500/20" : "bg-teal-500/10 border-teal-500/20"}`}
          >
            <Sparkles
              className={`h-5 w-5 ${remaining === 0 ? "text-red-400" : "text-teal-400"}`}
            />
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">
              Auto-Improve
            </div>
            <div
              className={`text-base font-black ${remaining === 0 ? "text-red-400" : "text-white"}`}
            >
              {limit === Infinity
                ? "Unlimited"
                : `${remaining} left / ${limit}`}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterMode("needs-improvement")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterMode === "needs-improvement"
                ? "bg-[#0d6e5a] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Needs Improvement ({bulletsNeedingImprovement.length})
          </button>
          <button
            onClick={() => setFilterMode("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterMode === "all"
                ? "bg-[#0d6e5a] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Bullets ({bulletItems.length})
          </button>
        </div>
        <span className="text-[11px] text-slate-500 font-medium">
          Showing {displayedBullets.length} of {bulletItems.length} total bullets scanned
        </span>
      </div>

      {/* Empty state for filtered list */}
      {displayedBullets.length === 0 && (
        <div className="flex flex-col items-center justify-center p-8 border border-emerald-200 bg-emerald-50/50 rounded-2xl min-h-[220px] text-center space-y-2">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          <h4 className="font-extrabold text-slate-800 text-sm">
            All Bullets Have Passed!
          </h4>
          <p className="text-xs text-slate-600 max-w-sm leading-relaxed">
            Every bullet across your work experience and projects already contains strong action verbs and quantified impact.
          </p>
          <button
            onClick={() => setFilterMode("all")}
            className="text-xs text-[#0d6e5a] font-bold hover:underline pt-2 cursor-pointer"
          >
            View all {bulletItems.length} bullets &rarr;
          </button>
        </div>
      )}

      {/* List of bullets */}
      <div className="space-y-4">
        {displayedBullets.map(({ line, index, trimmed }) => {
          const { hasVerb, hasMetric } = checkBullet(line);
          const isImproving = loadingMap[index];
          const suggestion = improvements[index];
          const canImprove = limit === Infinity || remaining > 0;

          return (
            <Card
              key={index}
              className="border-gray-200 bg-white hover:shadow-md transition-all rounded-2xl overflow-hidden"
            >
              <CardContent className="p-5 space-y-4">
                {/* Bullet Display */}
                <div className="flex items-start gap-3">
                  <div className="mt-1 font-bold text-[#0d6e5a] shrink-0 select-none">
                    •
                  </div>
                  <p className="text-sm text-slate-800 leading-relaxed font-medium flex-1">
                    {trimmed.replace(/^[-*•+\s]+/, "")}
                  </p>
                </div>

                {/* Score indicators & Action items — ONLY MISSING action verbs & metrics are shown */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    {!hasVerb && (
                      <Badge
                        variant="outline"
                        className="bg-red-50 text-red-700 border-red-200 text-xs font-semibold rounded-md py-0.5"
                      >
                        <X className="h-3 w-3 mr-1 shrink-0 text-red-500" />
                        Action Verb: Missing
                      </Badge>
                    )}
                    {!hasMetric && (
                      <Badge
                        variant="outline"
                        className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-semibold rounded-md py-0.5"
                      >
                        <AlertCircle className="h-3 w-3 mr-1 shrink-0 text-amber-500" />
                        Metric: Missing
                      </Badge>
                    )}
                  </div>

                  {!suggestion && (
                    <Button
                      size="sm"
                      onClick={() =>
                        canImprove
                          ? handleAutoImprove(index, line)
                          : useUpgradeModalStore.getState().openModal({
                              badge: "PRO",
                              title: "Bullet Improver Limit Reached",
                              description:
                                userPlan === "free"
                                  ? "You've used all 2 free auto-improves this month. Upgrade to Premium Pro (10/month) or Pro Max (unlimited) to rewrite bullet points with AI."
                                  : "You've used all Premium auto-improves this month. Upgrade to Pro Max for unlimited auto-improves.",
                            })
                      }
                      disabled={isImproving}
                      className={`font-bold rounded-lg text-sm cursor-pointer ${canImprove ? "bg-[#0d6e5a] hover:bg-[#0b5c4b] text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"}`}
                    >
                      {isImproving ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          Improving...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                          {canImprove ? "Auto-Improve" : "Limit Reached"}
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* AI suggestion card */}
                {suggestion && (
                  <div className="mt-4 bg-indigo-50/40 border border-indigo-100 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-indigo-700">
                      <Sparkles className="h-4 w-4" />
                      Suggested Optimization Rewrite
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Before
                      </div>
                      <p className="text-sm text-slate-500 line-through">
                        {trimmed.replace(/^[-*•+\s]+/, "")}
                      </p>
                      <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider pt-1">
                        After
                      </div>
                      <p className="text-sm font-bold text-slate-900 bg-white p-2.5 rounded-lg border border-indigo-100 shadow-sm leading-relaxed">
                        {suggestion.improvedBullet}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-sm">
                      <div>
                        <span className="font-bold text-slate-600 block">
                          Explanation:
                        </span>
                        <span className="text-slate-500">
                          {suggestion.explanation}
                        </span>
                      </div>
                      <div className="flex gap-1.5 flex-wrap items-start">
                        <Badge className="bg-slate-900 text-slate-100 text-xs hover:bg-slate-900">
                          Verb: {suggestion.actionVerbUsed}
                        </Badge>
                        {suggestion.metricsAdded && (
                          <Badge className="bg-emerald-600 text-emerald-50 text-xs hover:bg-emerald-600">
                            Metric: {suggestion.metricsAdded}
                          </Badge>
                        )}
                        {suggestion.keywordsInjected.map((kw, i) => (
                          <Badge
                            key={i}
                            className="bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs hover:bg-indigo-100"
                          >
                            +{kw}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleReject(index)}
                        className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-sm"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleAccept(index, line, suggestion.improvedBullet)
                        }
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm"
                      >
                        Accept & Apply
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
