"use client";

import React from "react";
import { ATSScore } from "@/types";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getScoreColor, getScoreLabel } from "@/lib/utils";
import { ArrowRight, Sparkles, AlertCircle } from "lucide-react";

interface ScoreCardProps {
  before: ATSScore | null;
  after: ATSScore | null;
  loading?: boolean;
}

export default function ScoreCard({ before, after, loading = false }: ScoreCardProps) {
  // 1. Loading State Placeholder
  if (loading) {
    return (
      <Card className="border border-[#DCE7E9] bg-white rounded-2xl shadow-sm">
        <CardContent className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Left Column Skeleton */}
            <div className="space-y-4 flex flex-col items-center">
              <Skeleton className="h-3 w-20 bg-slate-100" />
              <Skeleton className="h-28 w-28 rounded-full bg-slate-100" />
              <Skeleton className="h-4 w-24 bg-slate-100" />
              <div className="w-full space-y-3 pt-2">
                <Skeleton className="h-5 w-full bg-slate-100" />
                <Skeleton className="h-5 w-full bg-slate-100" />
                <Skeleton className="h-5 w-full bg-slate-100" />
              </div>
            </div>
            {/* Right Column Skeleton */}
            <div className="space-y-4 flex flex-col items-center">
              <Skeleton className="h-3 w-20 bg-slate-100" />
              <Skeleton className="h-28 w-28 rounded-full bg-slate-100" />
              <Skeleton className="h-4 w-24 bg-slate-100" />
              <div className="w-full space-y-3 pt-2">
                <Skeleton className="h-5 w-full bg-slate-100" />
                <Skeleton className="h-5 w-full bg-slate-100" />
                <Skeleton className="h-5 w-full bg-slate-100" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!before) return null;

  // Calculate Delta
  const scoreBefore = before.overall;
  const scoreAfter = after ? after.overall : scoreBefore;
  const delta = scoreAfter - scoreBefore;

  // Render a Single Column Score Dashboard
  const renderScoreColumn = (scoreData: ATSScore, title: string) => {
    const score = scoreData.overall;
    const label = getScoreLabel(score);
    const colorType = getScoreColor(score);
    
    let ringColor = "";
    let textColor = "";
    let bgColor = "";

    if (colorType === "red") {
      ringColor = "border-red-500/30 ring-red-500/20";
      textColor = "text-red-500";
      bgColor = "bg-red-50";
    } else if (colorType === "amber") {
      ringColor = "border-amber-500/30 ring-amber-500/20";
      textColor = "text-amber-600";
      bgColor = "bg-amber-50";
    } else {
      ringColor = "border-[#087F6E]/30 ring-[#087F6E]/20";
      textColor = "text-[#087F6E]";
      bgColor = "bg-[#E5F8F5]";
    }

    return (
      <div className="flex flex-col items-center p-4 rounded-xl border border-[#DCE7E9] bg-[#F5FAFA]">
        <h4 className="text-xs font-bold tracking-wider text-[#526176] uppercase mb-4">{title}</h4>
        
        {/* Circular Gauge */}
        <div className={`relative flex items-center justify-center h-28 w-28 rounded-full border-4 ring-8 ${ringColor} ${bgColor} transition-all duration-500`}>
          <div className="text-center">
            <span className={`text-4xl font-extrabold tracking-tight ${textColor}`}>{score}</span>
            <span className="text-[10px] text-[#526176] block uppercase font-bold tracking-wider mt-0.5">ATS Score</span>
          </div>
        </div>

        {/* Level Indicator Label */}
        <span className={`text-sm font-bold tracking-wide uppercase mt-4 ${textColor}`}>
          {label} Rating
        </span>

        {/* Sub-score Progress Rows */}
        <div className="w-full space-y-3 mt-6">
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-[#526176] font-medium">Keyword Match</span>
              <span className="text-[#111827] font-bold">{scoreData.keywordMatch}%</span>
            </div>
            <Progress value={scoreData.keywordMatch} className="h-1.5 bg-[#DCE7E9] [&>div]:bg-[#087F6E]" />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-[#526176] font-medium">Semantic Match</span>
              <span className="text-[#111827] font-bold">{scoreData.semanticMatch}%</span>
            </div>
            <Progress value={scoreData.semanticMatch} className="h-1.5 bg-[#DCE7E9] [&>div]:bg-[#087F6E]" />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-[#526176] font-medium">Impact Bullets</span>
              <span className="text-[#111827] font-bold">{scoreData.impactBullets}%</span>
            </div>
            <Progress value={scoreData.impactBullets} className="h-1.5 bg-[#DCE7E9] [&>div]:bg-[#087F6E]" />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-[#526176] font-medium">ATS Formatting</span>
              <span className="text-[#111827] font-bold">{scoreData.formatting}%</span>
            </div>
            <Progress value={scoreData.formatting} className="h-1.5 bg-[#DCE7E9] [&>div]:bg-[#087F6E]" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="border border-[#DCE7E9] bg-white rounded-2xl shadow-sm overflow-hidden relative">
      <CardContent className="p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative">
          
          {/* Left: Score Before */}
          {renderScoreColumn(before, "Initial Resume")}

          {/* Right: Score After */}
          {after ? (
            renderScoreColumn(after, "AI Optimized Resume")
          ) : (
            <div className="flex flex-col items-center justify-center p-6 border border-dashed border-[#DCE7E9] bg-[#F5FAFA] rounded-xl min-h-[340px]">
              <Sparkles className="h-8 w-8 text-[#087F6E] animate-pulse mb-3" />
              <p className="text-sm font-bold text-[#111827]">Run optimization to view scores</p>
              <p className="text-xs text-[#526176] text-center max-w-[220px] mt-1">
                Your optimized resume will show dynamic ATS rating deltas right here
              </p>
            </div>
          )}

          {/* Middle Connector: Improvement Delta */}
          {after && delta > 0 && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-1.5 bg-[#E5F8F5] border border-[#D4F3EF] px-3 py-1.5 rounded-full shadow-md select-none z-10 animate-bounce">
              <span className="text-xs font-black text-[#087F6E]">+{delta} pts</span>
              <ArrowRight className="h-3 w-3 text-[#087F6E]" />
            </div>
          )}
        </div>
        {/* Missing Keywords Panel */}
        {before.missingKeywords && before.missingKeywords.length > 0 && (
          <div className="mt-6 pt-5 border-t border-[#DCE7E9]">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
              <h4 className="text-xs font-bold text-[#111827]">Missing Keywords from Your Resume</h4>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700">
                {before.missingKeywords.length} gaps
              </span>
            </div>
            <p className="text-[10px] text-[#526176] mb-3">These keywords appear in the job description but were not found in your resume. Add them to boost your ATS score.</p>
            <div className="flex flex-wrap gap-1.5">
              {before.missingKeywords.slice(0, 20).map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center px-2.5 py-1 rounded-md bg-amber-50/80 border border-amber-200 text-amber-800 text-[10px] font-semibold"
                >
                  ✗ {kw}
                </span>
              ))}
              {before.missingKeywords.length > 20 && (
                <span className="text-[10px] text-[#526176] font-medium self-center">
                  +{before.missingKeywords.length - 20} more
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
