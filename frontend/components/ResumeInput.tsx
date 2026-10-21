"use client";

import React, { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Textarea } from "@/components/ui/textarea";
import { countWords } from "@/lib/utils";
import { FileText, Loader2, UploadCloud, X, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";

interface ResumeInputProps {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  onOpenSavedResumes?: () => void;
}

export default function ResumeInput({
  value,
  onChange,
  disabled,
  onOpenSavedResumes,
}: ResumeInputProps) {
  const [activeTab, setActiveTab] = useState<"paste" | "upload">("paste");
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Automatically switch to "paste" tab whenever resume text is loaded or changed
  useEffect(() => {
    if (value && value.trim().length > 0) {
      setActiveTab("paste");
    }
  }, [value]);

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError(null);

      if (rejectedFiles.length > 0) {
        const rejections = rejectedFiles[0];
        const errorType = rejections.errors[0]?.code;
        if (errorType === "file-too-large") {
          setError("File too large. Maximum size is 5MB.");
          toast.error("File is too large (Max 5MB).");
        } else {
          setError("Invalid file type. Only PDF, DOCX, and DOC formats are supported.");
          toast.error("Only PDF, DOCX, and DOC files allowed.");
        }
        return;
      }

      if (acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];
      setFileName(file.name);
      setLoading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/parse-pdf", {
          method: "POST",
          body: formData,
        }).catch(() => {
          throw new Error("Network issue during document upload. You can paste your resume text manually.");
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Could not read text from document. Try pasting text directly or using a DOCX file.");
        }

        const data = await res.json();
        if (data.text) {
          onChange(data.text);
          setActiveTab("paste");
        } else {
          throw new Error("No readable text found in file. Please paste your text below.");
        }
      } catch (err: any) {
        const errMsg = err.message || "Failed to extract text from resume.";
        setError(errMsg);
        toast.error(errMsg);
      } finally {
        setLoading(false);
      }
    },
    [onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: disabled || loading,
    maxSize: 5 * 1024 * 1024,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/msword": [".doc"],
    },
    multiple: false,
  });

  const handleClearFile = () => {
    setFileName(null);
    onChange("");
    setError(null);
  };

  const wordCount = countWords(value);
  const charCount = (value || "").length;

  return (
    <div className="flex-1 flex flex-col justify-between space-y-3.5 h-full">
      {/* Header with Title and Segmented Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
        <div>
          <h3 className="font-heading font-extrabold text-[#111827] text-base tracking-tight flex items-center gap-1.5">
            <span>1 · Your resume</span>
          </h3>
          <p className="text-xs text-[#526176] font-normal mt-0.5">
            Paste the text, or upload the PDF you already send out.
          </p>
        </div>

        {/* Segmented Tab Control */}
        <div className="bg-[#F1F5F7] p-1 rounded-xl flex items-center gap-1 shrink-0 self-start sm:self-auto border border-slate-200/60 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab("paste")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "paste"
                ? "bg-white text-[#087F6E] shadow-xs"
                : "text-[#526176] hover:text-[#087F6E]"
            }`}
          >
            Paste text
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "upload"
                ? "bg-white text-[#087F6E] shadow-xs"
                : "text-[#526176] hover:text-[#087F6E]"
            }`}
          >
            Upload file
          </button>
          <button
            type="button"
            onClick={() => onOpenSavedResumes?.()}
            className="px-3 py-1.5 text-xs font-bold rounded-lg text-[#526176] hover:text-[#087F6E] transition-all cursor-pointer whitespace-nowrap"
          >
            Saved resumes
          </button>
        </div>
      </div>

      {/* Error Output */}
      {error && (
        <div className="flex items-center gap-2 p-2.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Mode A: Upload File Zone */}
      {activeTab === "upload" && (
        <div className="flex-1 flex flex-col justify-center">
          {loading ? (
            <div className="border-2 border-dashed border-[#DCE7E9] rounded-2xl p-8 text-center bg-[#F9FBFC] min-h-[290px] flex flex-col items-center justify-center animate-pulse">
              <Loader2 className="h-8 w-8 text-[#087F6E] animate-spin mb-2.5" />
              <p className="text-sm font-bold text-[#111827]">Extracting resume text...</p>
              <p className="text-xs text-[#526176] mt-1">This will only take a moment</p>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 min-h-[290px] flex flex-col items-center justify-center ${
                isDragActive
                  ? "border-[#087F6E] bg-[#E5F8F5] shadow-sm"
                  : "border-[#DCE7E9] bg-[#F9FBFC] hover:border-[#087F6E]/60 hover:bg-[#F5FAFA]"
              }`}
            >
              <input {...getInputProps()} />
              <div className="h-12 w-12 rounded-2xl bg-[#E5F8F5] text-[#087F6E] border border-[#D4F3EF] flex items-center justify-center mb-3">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-[#111827]">
                {isDragActive ? "Drop the resume here..." : "Drag & drop your resume file"}
              </p>
              <p className="text-xs text-[#526176] mt-1">Supports PDF, DOCX, or DOC (Max 5MB)</p>
              <button
                type="button"
                className="mt-4 px-4 py-2 bg-white border border-[#DCE7E9] hover:border-[#087F6E] text-[#087F6E] text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                Browse file
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mode B: Paste Text Editor */}
      {activeTab === "paste" && (
        <div className="relative flex-1 flex flex-col min-h-[290px]">
          {/* File Details Tag if previously uploaded */}
          {fileName && !loading && (
            <div className="flex items-center justify-between p-2 px-3 rounded-lg bg-[#E5F8F5] border border-[#D4F3EF] mb-2">
              <div className="flex items-center gap-2 text-xs text-[#111827] min-w-0">
                <FileText className="h-3.5 w-3.5 text-[#087F6E] shrink-0" />
                <span className="truncate font-semibold">{fileName}</span>
                <span className="text-[10px] text-[#087F6E] font-medium bg-white px-2 py-0.5 rounded-full border border-teal-200">
                  Parsed
                </span>
              </div>
              <button
                onClick={handleClearFile}
                className="p-1 rounded-md hover:bg-white text-[#526176] hover:text-rose-600 transition-colors"
                title="Clear file and text"
                type="button"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <Textarea
            placeholder="Paste your resume text here... Include your work experience, education, skills, and any other relevant sections."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled || loading}
            className="flex-1 min-h-[290px] h-full overflow-y-auto font-sans text-xs sm:text-sm leading-relaxed border border-[#DCE7E9] bg-white text-[#111827] placeholder:text-[#526176]/50 focus:border-[#087F6E] focus:ring-2 focus:ring-[#087F6E]/20 rounded-xl resize-y p-3.5 pr-4 transition-colors"
          />

          <div className="flex items-center justify-between mt-2 text-[11px] text-[#526176]">
            <span>{charCount} characters</span>
            <span className="font-mono">{wordCount} words</span>
          </div>
        </div>
      )}
    </div>
  );
}
