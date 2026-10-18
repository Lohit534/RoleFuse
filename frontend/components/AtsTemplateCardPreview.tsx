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
  const { candidate, layoutType, atsScore, hasPhoto, photoUrl } = template;

  return (
    <div
      onClick={onClickPreview}
      className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white aspect-[3/4] w-full group cursor-pointer shadow-xs hover:border-[#087F6E] hover:shadow-md transition-all select-none p-3 sm:p-3.5 flex flex-col justify-between"
    >
      {/* Top ATS Score Tag */}
      <div className="absolute top-2.5 right-2.5 z-10">
        <span className="text-[8.5px] font-bold text-[#087F6E] bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-full border border-teal-200 shadow-2xs">
          {atsScore} ATS
        </span>
      </div>

      {/* ── LAYOUT 1: Classic Academic / Data Analyst (Image 1 Style) ── */}
      {layoutType === "image1-academic" && (
        <div
          className="space-y-1.5 overflow-hidden text-slate-800 leading-tight text-[6px]"
          style={{ fontFamily: 'Times-Roman, "Times New Roman", Times, Georgia, serif' }}
        >
          {/* Header */}
          <div className="text-center space-y-0.5 pb-1">
            <h4 className="text-[11px] font-black tracking-wider text-slate-900 uppercase">
              {candidate.fullName}
            </h4>
            <div className="text-[6.5px] text-slate-600">
              {candidate.location} — {candidate.phone} — {candidate.email}
            </div>
            <div className="text-[6px] text-slate-500">
              LinkedIn — GitHub
            </div>
          </div>

          {/* Section: Professional Summary */}
          <div className="space-y-0.5">
            <div className="font-bold text-[7.5px] text-slate-900">
              Professional Summary
            </div>
            <p className="line-clamp-2 text-slate-600 leading-snug">
              {candidate.summary}
            </p>
          </div>

          {/* Section: Technical Skills with Underline Rule */}
          <div className="space-y-0.5 pt-0.5">
            <div className="font-bold text-[7.5px] text-slate-900 border-b border-black pb-0.5">
              Technical Skills
            </div>
            <div className="space-y-0.5 text-slate-700">
              <div className="line-clamp-1">
                <span className="font-bold text-slate-900">Programming Languages: </span>
                {candidate.skills[0]?.items}
              </div>
              <div className="line-clamp-1">
                <span className="font-bold text-slate-900">Data Analysis: </span>
                {candidate.skills[1]?.items}
              </div>
              <div className="line-clamp-1">
                <span className="font-bold text-slate-900">Visualization: </span>
                {candidate.skills[2]?.items}
              </div>
            </div>
          </div>

          {/* Section: Projects with Underline Rule */}
          <div className="space-y-0.5 pt-0.5">
            <div className="font-bold text-[7.5px] text-slate-900 border-b border-black pb-0.5">
              Projects
            </div>
            {candidate.projects?.slice(0, 1).map((proj, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-baseline font-bold text-slate-900">
                  <span>{proj.title}</span>
                  {proj.tech && <span className="italic font-normal text-slate-600">{proj.tech}</span>}
                </div>
                <div className="line-clamp-2 text-slate-600 pl-1.5 border-l border-slate-300">
                  • {proj.bullets[0]}
                </div>
              </div>
            ))}
          </div>

          {/* Section: Education with Underline Rule */}
          <div className="space-y-0.5 pt-0.5">
            <div className="font-bold text-[7.5px] text-slate-900 border-b border-black pb-0.5">
              Education
            </div>
            <div className="flex justify-between font-bold text-slate-900">
              <span className="truncate max-w-[65%]">{candidate.education[0]?.degree}</span>
              <span>{candidate.education[0]?.dates}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span className="truncate max-w-[65%]">{candidate.education[0]?.school}</span>
              <span className="font-semibold text-slate-800">{candidate.education[0]?.score}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── LAYOUT 2: Modern Java Backend Developer (Image 2 Style) ── */}
      {layoutType === "image2-backend" && (
        <div
          className="space-y-1.5 overflow-hidden text-slate-800 leading-tight text-[6px]"
          style={{ fontFamily: 'Times-Roman, "Times New Roman", Times, Georgia, serif' }}
        >
          {/* Header */}
          <div className="text-center space-y-0.5 pb-1">
            <h4 className="text-[11.5px] font-black tracking-widest text-slate-950 uppercase">
              {candidate.fullName}
            </h4>
            <div className="text-[7.5px] font-bold text-slate-800">
              {candidate.title}
            </div>
            <div className="text-[5.5px] text-slate-500 flex flex-wrap justify-center gap-x-1 items-center">
              <span>{candidate.phone}</span>
              <span>•</span>
              <span>{candidate.email}</span>
              <span>•</span>
              <span>{candidate.linkedin}</span>
            </div>
          </div>

          {/* Section: Summary */}
          <div className="space-y-0.5">
            <div className="font-bold text-[7.5px] text-slate-900">
              Summary
            </div>
            <p className="line-clamp-2 text-slate-600 leading-snug">
              {candidate.summary}
            </p>
          </div>

          {/* Section: Skills with Rule */}
          <div className="space-y-0.5 pt-0.5">
            <div className="font-bold text-[7.5px] text-slate-900 border-b border-slate-700 pb-0.5">
              Skills
            </div>
            <div className="space-y-0.5 text-slate-700">
              <div className="line-clamp-1">
                <span className="font-bold text-slate-900">Programming Languages: </span>
                {candidate.skills[0]?.items}
              </div>
              <div className="line-clamp-1">
                <span className="font-bold text-slate-900">Frameworks: </span>
                {candidate.skills[1]?.items}
              </div>
              <div className="line-clamp-1">
                <span className="font-bold text-slate-900">Databases: </span>
                {candidate.skills[2]?.items}
              </div>
            </div>
          </div>

          {/* Section: Experience with Rule */}
          <div className="space-y-0.5 pt-0.5">
            <div className="font-bold text-[7.5px] text-slate-900 border-b border-slate-700 pb-0.5">
              Experience
            </div>
            {candidate.experience.map((exp, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-baseline font-bold text-slate-950">
                  <span>{exp.role}</span>
                  <span className="text-[5.5px] text-slate-600 font-semibold">{exp.dates}</span>
                </div>
                <div className="flex justify-between text-slate-600 italic">
                  <span>{exp.company}</span>
                  <span>{exp.tech}</span>
                </div>
                <div className="line-clamp-2 text-slate-600 pl-1.5 border-l border-slate-300">
                  • {exp.bullets[0]}
                </div>
              </div>
            ))}
          </div>

          {/* Section: Projects with Rule */}
          <div className="space-y-0.5 pt-0.5">
            <div className="font-bold text-[7.5px] text-slate-900 border-b border-slate-700 pb-0.5">
              Projects
            </div>
            {candidate.projects?.slice(0, 1).map((proj, idx) => (
              <div key={idx} className="flex justify-between font-bold text-slate-900 truncate">
                <span className="truncate">{proj.title}</span>
                <span className="text-slate-500 font-normal pl-1">{proj.year}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── LAYOUT 3: High-Contrast Tech ATS (Image 3 Style) ── */}
      {layoutType === "image3-boldtech" && (
        <div
          className="space-y-1.5 overflow-hidden text-slate-800 leading-tight text-[6px] border border-slate-900 p-2 rounded-xs"
          style={{ fontFamily: 'Times-Roman, "Times New Roman", Times, Georgia, serif' }}
        >
          {/* Header */}
          <div className="text-center space-y-0.5 pb-0.5 border-b border-black">
            <h4 className="text-[12px] font-black tracking-widest text-black uppercase">
              {candidate.fullName}
            </h4>
            <div className="text-[6px] font-medium text-slate-700">
              {candidate.location} — {candidate.phone} — {candidate.email}
            </div>
            <div className="text-[5.5px] text-slate-500">
              LinkedIn — GitHub
            </div>
          </div>

          {/* Career Objective */}
          <div className="space-y-0.5">
            <div className="font-black text-[7.5px] text-black uppercase">
              Career Objective:
            </div>
            <p className="line-clamp-2 text-slate-700 leading-snug">
              {candidate.summary}
            </p>
          </div>

          {/* Technical Skills with bold dark divider */}
          <div className="space-y-0.5 pt-0.5">
            <div className="font-black text-[7.5px] text-black uppercase border-b-2 border-black pb-0.5">
              Technical Skills
            </div>
            <div className="space-y-0.5 text-slate-800">
              <div className="line-clamp-1">
                <span className="font-bold">Languages: </span>
                {candidate.skills[0]?.items}
              </div>
              <div className="line-clamp-1">
                <span className="font-bold">Frontend: </span>
                {candidate.skills[1]?.items}
              </div>
              <div className="line-clamp-1">
                <span className="font-bold">Backend: </span>
                {candidate.skills[2]?.items}
              </div>
            </div>
          </div>

          {/* Projects with bold dark divider */}
          <div className="space-y-0.5 pt-0.5">
            <div className="font-black text-[7.5px] text-black uppercase border-b-2 border-black pb-0.5">
              Projects
            </div>
            <div className="font-bold text-black flex justify-between">
              <span className="truncate max-w-[65%]">{candidate.projects?.[0]?.title}</span>
              <span className="italic font-normal text-slate-600">{candidate.projects?.[0]?.tech}</span>
            </div>
            <div className="line-clamp-1 text-slate-700 pl-1">
              • {candidate.projects?.[0]?.bullets[0]}
            </div>
          </div>

          {/* Achievements */}
          <div className="space-y-0.5 pt-0.5">
            <div className="font-black text-[7.5px] text-black uppercase border-b-2 border-black pb-0.5">
              Achievements
            </div>
            <div className="line-clamp-1 text-slate-800">
              • {candidate.achievements?.[0]}
            </div>
          </div>
        </div>
      )}

      {/* ── LAYOUT 4: Modern Executive with Photo (Photo Avatar Header) ── */}
      {layoutType === "image4-photo" && (
        <div
          className="space-y-2 overflow-hidden text-slate-800 leading-tight text-[6.5px]"
          style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
        >
          {/* Header with Professional Photo Avatar */}
          <div className="flex items-center gap-2.5 pb-2 border-b border-teal-200">
            <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-[#087F6E] shadow-2xs shrink-0 bg-slate-100">
              <img
                src={photoUrl || "/avatars/user-1.jpg"}
                alt={candidate.fullName}
                className="w-full h-full object-cover select-none"
              />
            </div>
            <div className="space-y-0.5 min-w-0 flex-1">
              <h4 className="text-[11px] font-extrabold text-slate-900 tracking-tight truncate">
                {candidate.fullName}
              </h4>
              <div className="text-[7.5px] font-bold text-[#087F6E] truncate">
                {candidate.title}
              </div>
              <div className="text-[6px] text-slate-500 truncate">
                {candidate.location} • {candidate.email}
              </div>
            </div>
          </div>

          {/* Section: Executive Profile */}
          <div className="space-y-0.5">
            <div className="font-bold text-[7.5px] text-slate-900 uppercase tracking-wide flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#087F6E]" />
              Executive Profile
            </div>
            <p className="line-clamp-2 text-slate-600 leading-snug">
              {candidate.summary}
            </p>
          </div>

          {/* Section: Core Competencies */}
          <div className="space-y-0.5 pt-0.5">
            <div className="font-bold text-[7.5px] text-slate-900 uppercase tracking-wide flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#087F6E]" />
              Core Competencies
            </div>
            <div className="flex flex-wrap gap-1 pt-0.5">
              <span className="bg-teal-50 text-[#087F6E] border border-teal-200 px-1 py-0.2 rounded font-semibold text-[6px]">
                Product Strategy
              </span>
              <span className="bg-teal-50 text-[#087F6E] border border-teal-200 px-1 py-0.2 rounded font-semibold text-[6px]">
                GTM Operations
              </span>
              <span className="bg-teal-50 text-[#087F6E] border border-teal-200 px-1 py-0.2 rounded font-semibold text-[6px]">
                SQL & Analytics
              </span>
            </div>
          </div>

          {/* Section: Experience */}
          <div className="space-y-0.5 pt-0.5">
            <div className="font-bold text-[7.5px] text-slate-900 uppercase tracking-wide flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#087F6E]" />
              Experience
            </div>
            {candidate.experience.slice(0, 1).map((exp, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-baseline font-bold text-slate-900">
                  <span className="truncate max-w-[65%]">{exp.role}</span>
                  <span className="text-[5.5px] text-slate-500 font-semibold">{exp.dates}</span>
                </div>
                <div className="text-[6px] font-semibold text-[#087F6E]">
                  {exp.company} — {exp.location}
                </div>
                <div className="line-clamp-2 text-slate-600 pl-1.5 border-l border-teal-300">
                  • {exp.bullets[0]}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtle Bottom ATS Guaranteed Badge */}
      <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[6.5px] text-slate-500">
        <span className="flex items-center gap-1 font-semibold text-slate-700">
          <CheckCircle2 className="h-2.5 w-2.5 text-[#087F6E]" />
          {hasPhoto ? "Photo Header • Clean ATS" : "Single-Column OCR Safe"}
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
