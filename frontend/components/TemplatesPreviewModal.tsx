"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface TemplateItem {
  id: string;
  name: string;
  tagline: string;
  badge: string;
  atsScore: string;
  image: string;
}

export const RESUME_TEMPLATES: TemplateItem[] = [
  {
    id: "financial-analyst",
    name: "Financial Data Analyst",
    tagline: "Executive quantitative single-column ATS layout",
    badge: "99 ATS Score",
    atsScore: "99/100",
    image: "/templates/financial-analyst.png",
  },
  {
    id: "kickresume-black",
    name: "Modern Black ATS",
    tagline: "High-contrast clean tech format engineered for ATS parsers",
    badge: "Tech Standard",
    atsScore: "98/100",
    image: "/templates/kickresume-black.png",
  },
  {
    id: "classic-ats",
    name: "Classic Corporate ATS",
    tagline: "Traditional single-column format preferred by Fortune 500",
    badge: "Ivy Standard",
    atsScore: "98/100",
    image: "/templates/classic-ats.webp",
  },
  {
    id: "resumedone-clean",
    name: "Clean Minimalist ATS",
    tagline: "Streamlined modern structure with optimal OCR readability",
    badge: "High Impact",
    atsScore: "97/100",
    image: "/templates/resumedone-clean.png",
  },
];

interface TemplatesPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated?: boolean;
}

export default function TemplatesPreviewModal({
  isOpen,
  onClose,
  isAuthenticated = false,
}: TemplatesPreviewModalProps) {
  const router = useRouter();
  const [activeTemplateId, setActiveTemplateId] = useState<string>("financial-analyst");
  const selectedTemplate = RESUME_TEMPLATES.find((t) => t.id === activeTemplateId) || RESUME_TEMPLATES[0];

  if (!isOpen) return null;

  const handleUseTemplate = (templateId: string) => {
    onClose();
    if (isAuthenticated) {
      router.push(`/dashboard/resumes?template=${templateId}`);
    } else {
      router.push(`/auth/login?redirect=${encodeURIComponent(`/dashboard/resumes?template=${templateId}`)}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#087F6E]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-extrabold text-lg text-slate-900">
                  ATS-Friendly Resume Templates
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  100% Parser Safe
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Crafted to pass Workday, Taleo, Greenhouse, iCIMS, and Lever screening algorithms
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Template Selector Column */}
          <div className="md:col-span-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
              Select Template Format
            </h4>
            <div className="space-y-2.5">
              {RESUME_TEMPLATES.map((tmpl) => {
                const isSelected = tmpl.id === activeTemplateId;
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => setActiveTemplateId(tmpl.id)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "border-[#087F6E] bg-teal-50/50 shadow-xs ring-1 ring-[#087F6E]/30"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                        <img
                          src={tmpl.image}
                          alt={tmpl.name}
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="font-bold text-xs text-slate-900 truncate">{tmpl.name}</div>
                        <p className="text-[11px] text-slate-500 truncate">{tmpl.tagline}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {tmpl.atsScore}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Template Preview Details Column */}
          <div className="md:col-span-7 bg-slate-50/60 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              {/* Header Info */}
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                <div>
                  <h4 className="font-extrabold text-base text-slate-900">{selectedTemplate.name}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">{selectedTemplate.tagline}</p>
                </div>
                <div className="text-center px-3 py-1 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <div className="text-[10px] font-bold uppercase text-slate-400">ATS Rating</div>
                  <div className="text-sm font-extrabold text-[#087F6E]">{selectedTemplate.atsScore}</div>
                </div>
              </div>

              {/* Realistic Visual Resume Image Preview */}
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-2xs flex items-center justify-center p-2">
                <img
                  src={selectedTemplate.image}
                  alt={selectedTemplate.name}
                  className="max-h-[380px] w-full object-contain object-top rounded-lg select-none"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="h-10 px-4 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Close
              </Button>
              <Button
                onClick={() => handleUseTemplate(selectedTemplate.id)}
                className="h-10 px-6 bg-[#087F6E] hover:bg-[#065F53] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
              >
                Use This Template
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
