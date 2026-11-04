"use client";

import React, { useState } from "react";
import {
  X,
  Sparkles,
  UploadCloud,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

interface StructuredResume {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  website: string;
  summary: string;
  experience: { id: string; company: string; title: string; date: string; bullets: string[] }[];
  education: { id: string; school: string; degree: string; field: string; date: string; gpa: string; description: string }[];
  projects: { id: string; name: string; techStack: string; link: string; date: string; bullets: string[] }[];
  skills: { id: string; category: string; list: string[] }[];
  certifications: string[];
  languages: string[];
  achievements: string[];
}

interface ImportViaAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (data: StructuredResume, jobTitle?: string) => void;
  activePlan: string;
}

export default function ImportViaAiModal({
  isOpen,
  onClose,
  onImportSuccess,
  activePlan,
}: ImportViaAiModalProps) {
  const [activeTab, setActiveTab] = useState<"text" | "file">("text");
  const [pastedText, setPastedText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.toLowerCase();
      if (!ext.endsWith(".pdf") && !ext.endsWith(".docx") && !ext.endsWith(".txt")) {
        toast.error("Please select a PDF, DOCX, or TXT file.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleImport = async () => {
    let textToParse = pastedText.trim();

    setIsLoading(true);
    setStatusMessage("Preparing resume content...");

    try {
      // If user uploaded a file, extract its text first using /api/parse-pdf
      if (activeTab === "file" && selectedFile) {
        setStatusMessage("Extracting text from uploaded document...");
        const formData = new FormData();
        formData.append("file", selectedFile);

        const parseFileRes = await fetch("/api/parse-pdf", {
          method: "POST",
          body: formData,
        });

        if (!parseFileRes.ok) {
          const errData = await parseFileRes.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to parse uploaded document.");
        }

        const parseFileData = await parseFileRes.json();
        textToParse = parseFileData.text || "";
      }

      if (!textToParse || textToParse.length < 30) {
        throw new Error("Please provide or upload resume text with your experience and qualifications.");
      }

      // Call /api/resumes/parse-ai
      setStatusMessage("AI is analyzing and organizing sections into ATS format...");
      const aiRes = await fetch("/api/resumes/parse-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToParse }),
      });

      if (!aiRes.ok) {
        const errBody = await aiRes.json().catch(() => ({}));
        throw new Error(errBody.error || "AI parsing failed. Please try again.");
      }

      const aiData = await aiRes.json();
      if (!aiData.data) {
        throw new Error("Invalid response received from AI parser.");
      }

      const parsed: StructuredResume = aiData.data;
      const detectedTitle =
        parsed.experience?.[0]?.title ||
        (parsed.skills?.[0]?.list?.[0] ? `${parsed.skills[0].list[0]} Developer` : "Imported Resume");

      toast.success("Resume imported successfully via AI!");
      onImportSuccess(parsed, detectedTitle);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to import resume with AI.");
    } finally {
      setIsLoading(false);
      setStatusMessage("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 select-none">
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#087F6E]">
              <Sparkles className="h-5 w-5 text-[#087F6E]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-extrabold text-base text-slate-900">
                  Import Resume via AI
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-teal-50 text-[#087F6E] border border-teal-200">
                  PRO &amp; PRO MAX
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Paste raw text or upload a file. AI extracts every field into structured ATS format.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-5 pt-3 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-4 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("text")}
              disabled={isLoading}
              className={`pb-2.5 transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === "text"
                  ? "border-[#087F6E] text-[#087F6E]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Paste Text / LinkedIn</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("file")}
              disabled={isLoading}
              className={`pb-2.5 transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === "file"
                  ? "border-[#087F6E] text-[#087F6E]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span>Upload PDF / DOCX</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {activeTab === "text" ? (
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Paste Resume, CV, or LinkedIn Experience Text:
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                disabled={isLoading}
                placeholder="Paste your resume content, job titles, education, skills, and projects here..."
                rows={9}
                className="w-full text-xs p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:border-[#087F6E] focus:ring-1 focus:ring-[#087F6E] outline-none transition-all resize-none font-mono"
              />
              <span className="text-[10px] text-slate-400 block">
                {pastedText.length} characters entered. AI will automatically separate education, experience, and skills.
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Select Your Existing Resume File:
              </label>
              <label className="border-2 border-dashed border-slate-200 hover:border-[#087F6E] rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center gap-3 bg-slate-50 hover:bg-teal-50/20 transition-all cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={handleFileChange}
                  disabled={isLoading}
                  className="hidden"
                />
                <div className="h-12 w-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#087F6E]">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div className="text-center space-y-1">
                  <span className="text-xs font-bold text-slate-800 block">
                    {selectedFile ? selectedFile.name : "Click to select or drag and drop your file"}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Supports PDF, DOCX, DOC, or TXT up to 10MB
                  </span>
                </div>
              </label>
              {selectedFile && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                  <span className="font-semibold truncate max-w-[260px]">{selectedFile.name}</span>
                  <span className="text-[10px] font-bold text-emerald-600">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Loading status callout */}
          {isLoading && (
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-2.5 text-xs text-[#087F6E] animate-pulse">
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              <span>{statusMessage || "Processing with AI..."}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className="text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleImport}
            disabled={isLoading || (activeTab === "text" ? pastedText.trim().length < 30 : !selectedFile)}
            className="bg-[#087F6E] hover:bg-[#065F53] text-white font-bold text-xs rounded-xl px-5 h-9 shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Importing...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>Parse &amp; Import with AI</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

