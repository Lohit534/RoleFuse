"use client";

import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { countWords } from "@/lib/utils";
import { AlertTriangle, Link2, Loader2, Check } from "lucide-react";

interface JobDescriptionInputProps {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

export default function JobDescriptionInput({ value, onChange, disabled }: JobDescriptionInputProps) {
  const wordCount = countWords(value);
  const charCount = value.length;
  const isOverLimit = charCount > 5000;

  const [url, setUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchSuccess, setFetchSuccess] = useState(false);

  const handleFetchUrl = async () => {
    if (!url.trim()) return;
    setFetching(true);
    setFetchError(null);
    setFetchSuccess(false);

    try {
      // Server-side fetch — bypasses CORS and works for most job boards
      const res = await fetch("/api/fetch-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.error) {
        throw new Error(data.error || "Could not extract text from this URL. Please paste the job description manually.");
      }

      const text = (data.text || "").trim();
      if (!text || text.length < 80) {
        throw new Error("Not enough text found at this URL. Please paste the job description manually.");
      }

      onChange(text.slice(0, 6000));
      setFetchSuccess(true);
      setTimeout(() => setFetchSuccess(false), 3000);
    } catch (err: any) {
      setFetchError(err.message || "Failed to fetch job description.");
    } finally {
      setFetching(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between space-y-3 h-full">
      {/* URL Fetch Row */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase text-[#526176] tracking-widest flex items-center gap-1.5">
          <Link2 className="h-3 w-3 text-[#087F6E]" />
          Fetch from Job URL
        </label>
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://linkedin.com/jobs/view/... or any job posting URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={disabled || fetching}
            onKeyDown={(e) => e.key === "Enter" && handleFetchUrl()}
            className="h-9 text-xs border-[#DCE7E9] bg-white text-[#111827] placeholder:text-[#526176]/50 focus:border-[#087F6E] focus:ring-2 focus:ring-[#087F6E]/20 rounded-xl flex-1 font-sans shadow-xs"
          />
          <button
            type="button"
            onClick={handleFetchUrl}
            disabled={disabled || fetching || !url.trim()}
            className="h-9 px-3.5 text-xs font-semibold rounded-xl shrink-0 bg-white border border-[#DCE7E9] text-[#111827] hover:bg-[#E5F8F5] hover:text-[#087F6E] shadow-xs transition-colors cursor-pointer"
          >
            {fetching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#087F6E]" />
            ) : fetchSuccess ? (
              <Check className="h-3.5 w-3.5 text-[#087F6E]" />
            ) : (
              "Fetch"
            )}
          </button>
        </div>
        {fetchError && (
          <p className="text-[10px] font-mono text-rose-600 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            {fetchError}
          </p>
        )}
        {fetchSuccess && (
          <p className="text-[10px] font-mono text-[#087F6E] flex items-center gap-1">
            <Check className="h-3 w-3 shrink-0" />
            Job description fetched successfully!
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="relative flex items-center gap-2">
        <div className="flex-1 border-t border-[#DCE7E9]" />
        <span className="text-[9px] font-mono font-semibold uppercase text-[#526176] tracking-widest">or paste below</span>
        <div className="flex-1 border-t border-[#DCE7E9]" />
      </div>

      {/* Textarea */}
      <div className="relative flex-1 flex flex-col min-h-[280px]">
        <Textarea
          placeholder="Paste the full job description here..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`flex-1 min-h-[280px] h-full overflow-y-auto font-sans text-sm leading-relaxed bg-white text-[#111827] placeholder:text-[#526176]/50 rounded-xl resize-y p-3.5 pr-4 transition-colors ${
            isOverLimit
              ? "border-rose-400 focus:border-rose-500"
              : "border border-[#DCE7E9] focus:border-[#087F6E] focus:ring-2 focus:ring-[#087F6E]/20"
          }`}
        />
        <div className="absolute bottom-3 right-3 bg-white border border-[#DCE7E9] font-mono text-[10px] text-[#526176] px-2 py-0.5 rounded-full select-none shadow-xs">
          {wordCount} words
        </div>
      </div>

      {isOverLimit && (
        <div className="flex items-center gap-2 p-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>
            Warning: {charCount} characters — exceeds 5000 char limit and may be truncated.
          </span>
        </div>
      )}
    </div>
  );
}
