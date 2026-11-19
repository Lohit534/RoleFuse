"use client";

import React from "react";
import { ResumeData, isResumeData } from "@/types/resume";
import { parseResume } from "@/lib/parser/resume-parser";

interface ResumePreviewProps {
  data: ResumeData | string;
  originalText?: string;
  className?: string;
}

export function ResumePreview({
  data,
  originalText,
  className = "",
}: ResumePreviewProps) {
  // Directly consume structured ResumeData, or parse if string was provided
  const resume: ResumeData = isResumeData(data)
    ? data
    : typeof data === "string"
    ? parseResume(data, originalText)
    : (data as any);

  if (!resume || !resume.name) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        No resume content available to preview.
      </div>
    );
  }

  const { contact } = resume;
  const contactParts: Array<{ text: string; url?: string }> = [];

  if (contact?.phone) contactParts.push({ text: contact.phone });
  if (contact?.email) contactParts.push({ text: contact.email, url: `mailto:${contact.email}` });
  if (contact?.linkedin) {
    const raw = contact.linkedin;
    const url = raw.startsWith("http") ? raw : `https://${raw}`;
    contactParts.push({ text: "LinkedIn", url });
  }
  if (contact?.github) {
    const raw = contact.github;
    const url = raw.startsWith("http") ? raw : `https://${raw}`;
    contactParts.push({ text: "GitHub", url });
  }
  if (contact?.portfolio) {
    const raw = contact.portfolio;
    const url = raw.startsWith("http") ? raw : `https://${raw}`;
    contactParts.push({ text: "Portfolio", url });
  }
  if (contact?.location) contactParts.push({ text: contact.location });

  return (
    <div
      className={`w-full max-w-3xl mx-auto bg-white text-black p-6 sm:p-10 rounded-xl shadow-sm border border-slate-200 select-text ${className}`}
      style={{ fontFamily: "Times-Roman, 'Times New Roman', Times, serif", lineHeight: "1.35" }}
    >
      {/* 1. Header: Name & Role */}
      <div className="text-center mb-1">
        <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-black mb-0.5">
          {resume.name}
        </h1>
        {resume.role && (
          <div className="text-xs sm:text-[13px] font-semibold text-slate-800 tracking-tight mb-1">
            {resume.role}
          </div>
        )}

        {/* Contact line */}
        {contactParts.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-x-2 text-[11px] sm:text-xs text-slate-700">
            {contactParts.map((item, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-slate-400 select-none">|</span>}
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#087F6E] hover:underline"
                  >
                    {item.text}
                  </a>
                ) : (
                  <span>{item.text}</span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      <div className="border-b-[0.75px] border-black my-2" />

      {/* 2. Professional Summary */}
      {resume.summary && resume.summary.trim().length > 0 && (
        <div className="mb-3.5">
          <h2 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-[0.75px] border-black pb-0.5 mb-1.5 text-black">
            Professional Summary
          </h2>
          <p className="text-[11px] sm:text-[12px] text-justify text-slate-900 leading-relaxed">
            {resume.summary}
          </p>
        </div>
      )}

      {/* 3. Technical Skills */}
      {resume.skills && resume.skills.length > 0 && (
        <div className="mb-3.5">
          <h2 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-[0.75px] border-black pb-0.5 mb-1.5 text-black">
            Technical Skills
          </h2>
          <div className="space-y-1 text-[11px] sm:text-[12px]">
            {resume.skills.map((skillGroup, idx) => (
              <div key={idx} className="flex flex-wrap items-baseline gap-1">
                <span className="font-bold text-black">{skillGroup.label}:</span>
                <span className="text-slate-900">{skillGroup.items.join(", ")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Professional Experience */}
      {resume.experience && resume.experience.length > 0 && (
        <div className="mb-3.5">
          <h2 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-[0.75px] border-black pb-0.5 mb-1.5 text-black">
            Professional Experience
          </h2>
          <div className="space-y-3">
            {resume.experience.map((exp, idx) => {
              const dates = [exp.start, exp.end].filter(Boolean).join(" – ");
              return (
                <div key={idx} className="text-[11px] sm:text-[12px]">
                  {/* Title & Company Left, Dates Right (space-between) */}
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-bold text-black">
                      {exp.title} <span className="font-semibold text-slate-700">| {exp.company}</span>
                    </span>
                    {dates && (
                      <span className="text-[10.5px] sm:text-[11px] text-slate-600 font-medium shrink-0 tabular-nums">
                        {dates}
                      </span>
                    )}
                  </div>

                  {/* Tags line: italic gray */}
                  {exp.tags && exp.tags.length > 0 && (
                    <div className="text-[10px] sm:text-[11px] italic text-slate-500 my-0.5">
                      {exp.tags.join(", ")}
                    </div>
                  )}

                  {/* Bullets with hanging indent */}
                  {exp.bullets && exp.bullets.length > 0 && (
                    <ul className="mt-1 space-y-1">
                      {exp.bullets.map((b, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-2 leading-relaxed text-slate-900">
                          <span className="font-bold text-black select-none shrink-0">•</span>
                          <span className="flex-1">{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Projects */}
      {resume.projects && resume.projects.length > 0 && (
        <div className="mb-3.5">
          <h2 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-[0.75px] border-black pb-0.5 mb-1.5 text-black">
            Projects
          </h2>
          <div className="space-y-3">
            {resume.projects.map((proj, idx) => (
              <div key={idx} className="text-[11px] sm:text-[12px]">
                {/* Project Name Left, Year/Link Right (space-between) */}
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-bold text-black">{proj.name}</span>
                  <div className="flex items-center gap-2 text-[10.5px] sm:text-[11px] text-slate-600 shrink-0">
                    {proj.link && (
                      <a
                        href={proj.link.startsWith("http") ? proj.link : `https://${proj.link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#087F6E] hover:underline"
                      >
                        Link
                      </a>
                    )}
                    {proj.year && <span className="tabular-nums font-medium">{proj.year}</span>}
                  </div>
                </div>

                {/* Tags line: italic gray */}
                {proj.tags && proj.tags.length > 0 && (
                  <div className="text-[10px] sm:text-[11px] italic text-slate-500 my-0.5">
                    {proj.tags.join(", ")}
                  </div>
                )}

                {/* Bullets with hanging indent */}
                {proj.bullets && proj.bullets.length > 0 && (
                  <ul className="mt-1 space-y-1">
                    {proj.bullets.map((b, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-2 leading-relaxed text-slate-900">
                        <span className="font-bold text-black select-none shrink-0">•</span>
                        <span className="flex-1">{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Awards & Certifications */}
      {((resume.certifications && resume.certifications.length > 0) ||
        (resume.achievements && resume.achievements.length > 0)) && (
        <div className="mb-3.5">
          <h2 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-[0.75px] border-black pb-0.5 mb-1.5 text-black">
            Awards &amp; Certifications
          </h2>
          <ul className="space-y-1 text-[11px] sm:text-[12px]">
            {(resume.certifications || []).map((cert, idx) => (
              <li key={`cert-${idx}`} className="flex items-start gap-2 leading-relaxed text-slate-900">
                <span className="font-bold text-black select-none shrink-0">•</span>
                <span className="flex-1">
                  <strong className="font-bold text-black">{cert.title}</strong>
                  {cert.issuer && ` – ${cert.issuer}`}
                  {cert.year && ` (${cert.year})`}
                </span>
              </li>
            ))}
            {(resume.achievements || []).map((ach, idx) => (
              <li key={`ach-${idx}`} className="flex items-start gap-2 leading-relaxed text-slate-900">
                <span className="font-bold text-black select-none shrink-0">•</span>
                <span className="flex-1">{ach}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 7. Education */}
      {resume.education && resume.education.length > 0 && (
        <div className="mb-3.5">
          <h2 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-[0.75px] border-black pb-0.5 mb-1.5 text-black">
            Education
          </h2>
          <div className="space-y-2.5">
            {resume.education.map((edu, idx) => {
              const dates = [edu.start, edu.end].filter(Boolean).join(" – ");
              return (
                <div key={idx} className="text-[11px] sm:text-[12px]">
                  {/* Degree Left, Dates Right (space-between) */}
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-bold text-black">{edu.degree}</span>
                    {dates && (
                      <span className="text-[10.5px] sm:text-[11px] text-slate-600 font-medium shrink-0 tabular-nums">
                        {dates}
                      </span>
                    )}
                  </div>
                  {/* Institution Left, Score Right-aligned */}
                  <div className="flex items-baseline justify-between gap-2 text-slate-700">
                    <span>{edu.institution}</span>
                    {edu.score && (
                      <span className="italic font-medium text-slate-600 shrink-0 text-[10.5px] sm:text-[11px]">
                        {edu.score}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 8. Languages */}
      {resume.languages && resume.languages.length > 0 && (
        <div className="mb-2">
          <h2 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-[0.75px] border-black pb-0.5 mb-1.5 text-black">
            Languages
          </h2>
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] sm:text-[12px] text-slate-900">
            {resume.languages.map((lang, idx) => (
              <li key={idx} className="flex items-center gap-1.5">
                <span className="font-bold text-black select-none">•</span>
                <span>{lang}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ResumePreview;
