"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, ArrowRight, FolderOpen, User } from "lucide-react";
import { toast } from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

interface SavedResume {
  id: string;
  jobTitle?: string;
  originalText?: string;
  optimizedText?: string;
  jobDescription?: string;
  createdAt: string;
}

interface UseSavedResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResume: (text: string, title?: string) => void;
}

function extractCandidateName(text?: string): string | null {
  if (!text) return null;
  const firstLine = text.trim().split("\n")[0]?.trim();
  if (!firstLine) return null;
  if (/^[A-Z\s]{4,}$/.test(firstLine) || firstLine.includes("http") || firstLine.includes("@")) {
    return null;
  }
  const cleanName = firstLine.replace(/^[#*_\-\s]+|[#*_\-\s]+$/g, "").trim();
  return cleanName.length > 1 && cleanName.length < 50 ? cleanName : null;
}

export function UseSavedResumeModal({
  isOpen,
  onClose,
  onSelectResume,
}: UseSavedResumeModalProps) {
  const [loading, setLoading] = useState(true);
  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      fetchSavedResumes();
    }
  }, [isOpen]);

  const fetchSavedResumes = async () => {
    setLoading(true);
    try {
      // 1. Fetch manual builder resumes from server
      const resumesRes = await fetch("/api/resumes");
      if (resumesRes.ok) {
        const data = await resumesRes.json();
        if (Array.isArray(data) && data.length > 0) {
          // Strictly manual builder resumes only (no optimization history)
          const manualOnly = data.filter(
            (r: SavedResume) => !r.jobDescription || r.jobDescription.trim() === ""
          );
          if (manualOnly.length > 0) {
            setResumes(manualOnly);
            setLoading(false);
            return;
          }
        }
      }

      // 2. Fallback to localStorage cache for current user if server returned empty
      if (typeof window !== "undefined") {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const cachedStr = localStorage.getItem(`fastHire_resumes_cache_${user.id}`);
          if (cachedStr) {
            const cached = JSON.parse(cachedStr);
            if (Array.isArray(cached) && cached.length > 0) {
              const manualOnly = cached.filter(
                (r: SavedResume) => !r.jobDescription || r.jobDescription.trim() === ""
              );
              if (manualOnly.length > 0) {
                setResumes(manualOnly);
                setLoading(false);
                return;
              }
            }
          }
        }
      }
      setResumes([]);
    } catch (e) {
      toast.error("Failed to load saved resumes.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (resume: SavedResume) => {
    const textToInsert =
      (resume.optimizedText && resume.optimizedText.trim())
        ? resume.optimizedText.trim()
        : (resume.originalText && resume.originalText.trim())
          ? resume.originalText.trim()
          : "";
    if (!textToInsert) {
      toast.error("Selected resume has no text content.");
      return;
    }

    const candidateName = extractCandidateName(textToInsert);
    const chosenTitle = (resume.jobTitle && resume.jobTitle !== "Untitled Resume")
      ? resume.jobTitle
      : (candidateName ? `${candidateName}'s Resume` : "Saved Resume");

    onSelectResume(textToInsert, chosenTitle);
    toast.success(`Loaded saved resume: ${chosenTitle}`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border-slate-200 bg-white text-slate-900 shadow-2xl rounded-2xl p-6 select-none">
        <DialogHeader className="space-y-1.5 text-left">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#087F6E]">
            <FolderOpen className="h-4 w-4" />
            <span>Saved Resumes Library</span>
          </div>
          <DialogTitle className="text-lg font-bold text-slate-900 tracking-tight">
            Use Saved Resume
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 font-medium">
            Select your manually created resume to auto-fill the editor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2 max-h-[340px] overflow-y-auto pr-1">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-xs text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-[#087F6E]" />
              <span>Fetching your saved resumes...</span>
            </div>
          ) : resumes.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 border border-slate-200 rounded-xl space-y-2 p-4">
              <FileText className="h-8 w-8 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-700">No saved resumes found</p>
              <p className="text-[10px] text-slate-500 max-w-xs mx-auto">
                Create and save a resume in My Resumes to use it here.
              </p>
            </div>
          ) : (
            resumes.map((r) => {
              const textContent = r.optimizedText || r.originalText || "";
              const candidateName = extractCandidateName(textContent);
              const displayTitle = (r.jobTitle && r.jobTitle !== "Untitled Resume")
                ? r.jobTitle
                : (candidateName ? `${candidateName}'s Resume` : "Saved Resume");

              return (
                <div
                  key={r.id}
                  onClick={() => handleSelect(r)}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#087F6E] hover:bg-slate-100/70 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0 text-[#087F6E] group-hover:scale-105 transition-transform">
                      {candidateName ? <User className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {displayTitle}
                      </p>
                      {candidateName && (
                        <p className="text-[10px] font-semibold text-[#087F6E] truncate">
                          Candidate: {candidateName}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 font-medium">
                        {new Date(r.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="h-8 text-xs font-bold bg-[#087F6E] hover:bg-[#075E53] text-white shadow-xs transition-all px-3.5 rounded-xl border-none cursor-pointer shrink-0"
                  >
                    Use This <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
