"use client";

import React, { useMemo } from "react";
import { CheckCircle2, Sparkles, AlertCircle, Code2, Cloud, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RequirementGapChecklistProps {
  foundKeywords: string[];
  missingKeywords?: string[];
  addedKeywords?: string[];
}

const CORE_TECH_RE = /\b(python|javascript|typescript|java|c\+\+|golang|go|rust|ruby|php|c#|\.net|react|react\.js|angular|vue|svelte|node|node\.js|express|django|flask|fastapi|spring|springboot|sql|postgresql|postgres|mysql|mongodb|redis|sqlite|oracle|dynamodb|html|css|tailwind)\b/i;

const TOOLS_CLOUD_RE = /\b(docker|kubernetes|k8s|aws|azure|gcp|git|github|gitlab|ci\/cd|cicd|terraform|ansible|jenkins|linux|bash|jest|pytest|cypress|selenium|kafka|rabbitmq|nginx|webpack|vite|helm|cloud|devops)\b/i;

export function RequirementGapChecklist({
  foundKeywords = [],
  missingKeywords = [],
  addedKeywords = [],
}: RequirementGapChecklistProps) {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

  const { tier1, tier2, tier3 } = useMemo(() => {
    const addedSet = new Set(addedKeywords.map(norm));
    const allFound = Array.from(new Set([...foundKeywords, ...addedKeywords]));

    const categorize = (list: string[]) => {
      const t1: Array<{ name: string; isAdded: boolean }> = [];
      const t2: Array<{ name: string; isAdded: boolean }> = [];
      const t3: Array<{ name: string; isAdded: boolean }> = [];

      for (const item of list) {
        const clean = item.trim();
        if (!clean) continue;
        const entry = { name: clean, isAdded: addedSet.has(norm(clean)) };

        if (CORE_TECH_RE.test(clean)) {
          t1.push(entry);
        } else if (TOOLS_CLOUD_RE.test(clean)) {
          t2.push(entry);
        } else {
          t3.push(entry);
        }
      }
      return { t1, t2, t3 };
    };

    const categorizedFound = categorize(allFound);
    const categorizedMissing = categorize(missingKeywords);

    return {
      tier1: {
        matched: categorizedFound.t1,
        missing: categorizedMissing.t1,
      },
      tier2: {
        matched: categorizedFound.t2,
        missing: categorizedMissing.t2,
      },
      tier3: {
        matched: categorizedFound.t3,
        missing: categorizedMissing.t3,
      },
    };
  }, [foundKeywords, missingKeywords, addedKeywords]);

  const renderTier = (
    title: string,
    icon: React.ReactNode,
    data: { matched: Array<{ name: string; isAdded: boolean }>; missing: Array<{ name: string; isAdded: boolean }> }
  ) => {
    const total = data.matched.length + data.missing.length;
    if (total === 0) return null;

    const matchRate = total > 0 ? Math.round((data.matched.length / total) * 100) : 100;

    return (
      <div className="space-y-2 p-3 sm:p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/70">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            {icon}
            <span>{title}</span>
          </div>
          <span
            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
              matchRate >= 80
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : matchRate >= 50
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}
          >
            {matchRate}% Match ({data.matched.length}/{total})
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {data.matched.map((item, idx) => (
            <span
              key={`match-${idx}`}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold border ${
                item.isAdded
                  ? "bg-teal-50/90 text-[#0d6e5a] border-teal-200"
                  : "bg-white text-slate-700 border-slate-200"
              }`}
            >
              {item.isAdded ? (
                <Sparkles className="w-3 h-3 text-[#0d6e5a] shrink-0" />
              ) : (
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              )}
              <span>{item.name}</span>
              {item.isAdded && (
                <span className="text-[9px] font-bold text-[#0d6e5a] uppercase tracking-wider ml-0.5">
                  Added
                </span>
              )}
            </span>
          ))}

          {data.missing.map((item, idx) => (
            <span
              key={`miss-${idx}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-white text-slate-400 border border-dashed border-slate-300"
              title="Not yet evidenced in resume"
            >
              <AlertCircle className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{item.name}</span>
            </span>
          ))}
        </div>
      </div>
    );
  };

  const hasAnyData =
    tier1.matched.length + tier1.missing.length > 0 ||
    tier2.matched.length + tier2.missing.length > 0 ||
    tier3.matched.length + tier3.missing.length > 0;

  if (!hasAnyData) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm space-y-3.5 select-none">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#087F6E]" />
          <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight">
            Target Job Requirement Matrix
          </h3>
        </div>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider">
          3-Tier Gap Analysis
        </span>
      </div>

      <div className="space-y-2.5">
        {renderTier(
          "Core Technical Match",
          <Code2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />,
          tier1
        )}
        {renderTier(
          "Secondary Tools & Cloud",
          <Cloud className="w-3.5 h-3.5 text-purple-600 shrink-0" />,
          tier2
        )}
        {renderTier(
          "Domain & Engineering Practices",
          <Layers className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
          tier3
        )}
      </div>
    </div>
  );
}
