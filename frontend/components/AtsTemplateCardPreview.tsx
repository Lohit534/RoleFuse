"use client";

import React from "react";
import { AtsTemplateProfile } from "@/lib/ats-templates-data";
import { Eye, CheckCircle2 } from "lucide-react";

interface AtsTemplateCardPreviewProps {
  template: AtsTemplateProfile;
  onClickPreview: () => void;
}

export default function AtsTemplateCardPreview({
  template,
  onClickPreview,
}: AtsTemplateCardPreviewProps) {
  const { candidate, styleVariant, atsScore, name } = template;
  const isSerif = template.fontFamily === "serif";

  // Distinctive styling accents based on template type
  const isTechBlack = styleVariant === "tech";
  const isFinance = styleVariant === "finance";
  const isExecutive = styleVariant === "executive";
  const isMinimal = styleVariant === "minimal";

  return (
    <div
      onClick={onClickPreview}
      className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white aspect-[3/4] w-full group cursor-pointer shadow-xs hover:border-[#087F6E] hover:shadow-md transition-all select-none p-3.5 flex flex-col justify-between"
      style={{
        fontFamily: isSerif
          ? 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'
          : 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Top ATS Score Tag */}
      <div className="absolute top-2.5 right-2.5 z-10">
        <span className="text-[9px] font-bold text-[#087F6E] bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-full border border-teal-200 shadow-2xs">
          {atsScore} ATS
        </span>
      </div>

      {/* Miniature Resume Document Structure */}
      <div className="space-y-1.5 overflow-hidden text-slate-800 leading-tight">
        {/* Header: Candidate Name & Title */}
        <div className={`space-y-0.5 ${isExecutive ? "text-center" : "text-left"}`}>
          <div
            className={`font-black tracking-tight text-slate-900 ${
              isTechBlack
                ? "text-[11.5px] uppercase tracking-wider text-slate-950"
                : isFinance
                ? "text-[11px] text-slate-900 tracking-wide"
                : isExecutive
                ? "text-[11px] tracking-widest uppercase text-slate-900"
                : "text-[11px] font-extrabold text-slate-900"
            }`}
          >
            {candidate.fullName}
          </div>
          <div className="text-[8px] font-bold text-[#087F6E]">
            {candidate.title}
          </div>
          <div className="text-[6.5px] text-slate-500 flex flex-wrap gap-x-1.5 items-center">
            <span>{candidate.location}</span>
            <span>•</span>
            <span className="truncate">{candidate.email}</span>
            <span>•</span>
            <span>{candidate.phone}</span>
          </div>
        </div>

        {/* Section Divider Line */}
        <div
          className={`w-full ${
            isTechBlack
              ? "h-[1.5px] bg-slate-900"
              : isFinance
              ? "h-[1px] bg-teal-700/80"
              : isExecutive
              ? "h-[1px] bg-slate-800"
              : "h-[1px] bg-slate-300"
          }`}
        />

        {/* Summary Snippet */}
        <div className="space-y-0.5">
          <div className="text-[7px] font-black uppercase text-slate-900 tracking-wider">
            {isTechBlack ? "PROFESSIONAL PROFILE" : "SUMMARY"}
          </div>
          <p className="text-[6.5px] text-slate-600 line-clamp-2 leading-relaxed">
            {candidate.summary}
          </p>
        </div>

        {/* Core Skills Section */}
        <div className="space-y-0.5 pt-0.5">
          <div className="text-[7px] font-black uppercase text-slate-900 tracking-wider">
            {isTechBlack ? "TECHNICAL EXPERTISE" : "CORE COMPETENCIES"}
          </div>
          <div className="space-y-0.5 text-[6.5px] text-slate-600">
            <div className="line-clamp-1">
              <span className="font-bold text-slate-800">
                {candidate.skills[0]?.label}:{" "}
              </span>
              <span>{candidate.skills[0]?.items}</span>
            </div>
            {candidate.skills[1] && (
              <div className="line-clamp-1">
                <span className="font-bold text-slate-800">
                  {candidate.skills[1]?.label}:{" "}
                </span>
                <span>{candidate.skills[1]?.items}</span>
              </div>
            )}
          </div>
        </div>

        {/* Experience Section */}
        <div className="space-y-1 pt-0.5">
          <div className="text-[7px] font-black uppercase text-slate-900 tracking-wider">
            WORK EXPERIENCE
          </div>

          {candidate.experience.slice(0, 2).map((exp, idx) => (
            <div key={idx} className="space-y-0.5">
              <div className="flex justify-between items-baseline text-[7px]">
                <span className="font-bold text-slate-900 truncate max-w-[65%]">
                  {exp.role}
                </span>
                <span className="text-[6px] text-slate-400 font-medium">
                  {exp.dates}
                </span>
              </div>
              <div className="text-[6.5px] font-semibold text-[#087F6E]">
                {exp.company} — {exp.location}
              </div>
              <div className="text-[6px] text-slate-600 line-clamp-2 space-y-0.5 pl-1.5 border-l border-slate-200">
                <div>• {exp.bullets[0]}</div>
                {exp.bullets[1] && <div>• {exp.bullets[1]}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Education Section */}
        <div className="space-y-0.5 pt-0.5">
          <div className="text-[7px] font-black uppercase text-slate-900 tracking-wider">
            EDUCATION
          </div>
          <div className="flex justify-between items-baseline text-[6.5px]">
            <span className="font-bold text-slate-900 truncate">
              {candidate.education[0]?.degree}
            </span>
            <span className="text-[6px] text-slate-400">
              {candidate.education[0]?.dates}
            </span>
          </div>
          <div className="text-[6px] text-slate-500">
            {candidate.education[0]?.school}
          </div>
        </div>
      </div>

      {/* Subtle Bottom ATS Guaranteed Badge */}
      <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[6.5px] text-slate-500">
        <span className="flex items-center gap-1 font-semibold text-slate-700">
          <CheckCircle2 className="h-2.5 w-2.5 text-[#087F6E]" />
          Single-Column OCR Safe
        </span>
        <span className="text-slate-400 font-mono">100% Parsed</span>
      </div>

      {/* Hover Overlay with Preview CTA */}
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center justify-center gap-2 p-4 text-white z-20">
        <div className="h-9 w-9 rounded-full bg-[#087F6E] flex items-center justify-center text-white shadow-md">
          <Eye className="h-4 w-4" />
        </div>
        <div className="text-center space-y-0.5">
          <span className="text-xs font-bold block">Preview Template</span>
          <span className="text-[10px] text-slate-300">
            Click to view full-size A4 resume
          </span>
        </div>
      </div>
    </div>
  );
}
