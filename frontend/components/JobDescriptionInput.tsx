"use client";

import React, { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { countWords } from "@/lib/utils";
import { AlertTriangle, Link2, Loader2, Check } from "lucide-react";
import { toast } from "react-hot-toast";

interface JobDescriptionInputProps {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

export default function JobDescriptionInput({
  value,
  onChange,
  disabled,
}: JobDescriptionInputProps) {
  const [activeTab, setActiveTab] = useState<"paste" | "url">("paste");
  const wordCount = countWords(value);
  const charCount = (value || "").length;
  const isOverLimit = charCount > 5000;

  const [url, setUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchSuccess, setFetchSuccess] = useState(false);

  // Automatically switch to "paste" tab whenever job description text is loaded
  useEffect(() => {
    if (value && value.trim().length > 0) {
      setActiveTab("paste");
    }
  }, [value]);

  const handleFetchUrl = async () => {
    if (!url.trim()) return;
    setFetching(true);
    setFetchError(null);
    setFetchSuccess(false);

    try {
      const res = await fetch("/api/fetch-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.error) {
        throw new Error(
          data.error ||
            "Could not extract text from this URL. Please paste the job description manually."
        );
      }

      const text = (data.text || "").trim();
      if (!text || text.length < 80) {
        throw new Error(
          "Not enough text found at this URL. Please paste the job description manually."
        );
      }

      onChange(text.slice(0, 6000));
      setFetchSuccess(true);
      toast.success("Job description fetched successfully!");
      setActiveTab("paste");
      setTimeout(() => setFetchSuccess(false), 3000);
    } catch (err: any) {
      const errMsg = err.message || "Failed to fetch job description.";
      setFetchError(errMsg);
      toast.error(errMsg);
    } finally {
      setFetching(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between space-y-3.5 h-full">
      {/* Header with Title and Segmented Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
        <div>
          <h3 className="font-heading font-extrabold text-[#111827] text-base tracking-tight flex items-center gap-1.5">
            <span>2 · The job you want</span>
          </h3>
          <p className="text-xs text-[#526176] font-normal mt-0.5">
            Paste the posting, or give us its link and we'll read it.
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
            onClick={() => setActiveTab("url")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "url"
                ? "bg-white text-[#087F6E] shadow-xs"
                : "text-[#526176] hover:text-[#087F6E]"
            }`}
          >
            From URL
          </button>
        </div>
      </div>

      {/* Mode A: Fetch from URL */}
      {activeTab === "url" && (
        <div className="flex-1 flex flex-col justify-center min-h-[290px] p-6 bg-[#F9FBFC] border border-[#DCE7E9] rounded-2xl space-y-4">
          <div className="text-center space-y-1">
            <div className="h-12 w-12 rounded-2xl bg-[#E5F8F5] text-[#087F6E] flex items-center justify-center mx-auto mb-2 border border-[#D4F3EF]">
              <Link2 className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-[#111827]">Fetch Job from URL</h4>
            <p className="text-xs text-[#526176]">
              Paste any job posting link (LinkedIn, Indeed, or career pages)
            </p>
          </div>

          <div className="flex gap-2 max-w-md mx-auto w-full">
            <Input
              type="url"
              placeholder="https://linkedin.com/jobs/view/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={disabled || fetching}
              onKeyDown={(e) => e.key === "Enter" && handleFetchUrl()}
              className="h-10 text-xs border-[#DCE7E9] bg-white text-[#111827] placeholder:text-[#526176]/50 focus:border-[#087F6E] focus:ring-2 focus:ring-[#087F6E]/20 rounded-xl flex-1 shadow-xs"
            />
            <button
              type="button"
              onClick={handleFetchUrl}
              disabled={disabled || fetching || !url.trim()}
              className="h-10 px-4 text-xs font-bold rounded-xl shrink-0 bg-[#087F6E] hover:bg-[#075E53] text-white disabled:opacity-50 shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {fetching ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Fetching...</span>
                </>
              ) : fetchSuccess ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Fetched!</span>
                </>
              ) : (
                "Fetch"
              )}
            </button>
          </div>

          {fetchError && (
            <p className="text-xs text-rose-600 flex items-center justify-center gap-1.5 text-center">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>{fetchError}</span>
            </p>
          )}
        </div>
      )}

      {/* Mode B: Paste Text */}
      {activeTab === "paste" && (
        <div className="relative flex-1 flex flex-col min-h-[290px]">
          <Textarea
            placeholder="Paste the job posting description here... Include requirements, responsibilities, and qualifications."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={`flex-1 min-h-[290px] h-full overflow-y-auto font-sans text-xs sm:text-sm leading-relaxed bg-white text-[#111827] placeholder:text-[#526176]/50 rounded-xl resize-y p-3.5 pr-4 transition-colors ${
              isOverLimit
                ? "border-rose-400 focus:border-rose-500"
                : "border border-[#DCE7E9] focus:border-[#087F6E] focus:ring-2 focus:ring-[#087F6E]/20"
            }`}
          />

          <div className="flex items-center justify-between mt-2 text-[11px] text-[#526176]">
            <span>{charCount} characters</span>
            <span className="font-mono">{wordCount} words</span>
          </div>
        </div>
      )}

      {isOverLimit && (
        <div className="flex items-center gap-2 p-2.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>
            Warning: {charCount} characters — exceeds 5000 char limit and may be truncated.
          </span>
        </div>
      )}
    </div>
  );
}
