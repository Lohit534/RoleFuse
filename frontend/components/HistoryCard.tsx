"use client";

import React, { useState } from "react";
import { ResumeRecord } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { FileDown, Calendar, Building, ArrowUpRight, Loader2 } from "lucide-react";
import { saveAs } from "file-saver";
import { toast } from "react-hot-toast";
import { useUpgradeModalStore } from "@/store/useUpgradeModalStore";

const LinkedInIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

const GitHubIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
  </svg>
);

interface HistoryCardProps {
  resume: ResumeRecord;
  userPlan?: string;
  onSelect?: (resume: ResumeRecord) => void;
}

export default function HistoryCard({ resume, userPlan = "free", onSelect }: HistoryCardProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card select click

    if (userPlan === "free") {
      useUpgradeModalStore.getState().openModal({
        badge: "DOWNLOAD BLOCKED",
        title: "Your 2 free optimizations are used up",
        description: "Your optimized resume is saved and stays in your history. Free includes the ATS score and live preview; downloading is on a paid plan.",
      });
      return;
    }

    setDownloading(true);

    try {
      const response = await fetch("/api/export/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resumeId: resume.id })
      });

      if (!response.ok) {
        throw new Error("Failed to export PDF file.");
      }

      const blob = await response.blob();
      saveAs(blob, `${resume.jobTitle?.replace(/\s+/g, "-") || "resume"}-optimized.pdf`);
      toast.success("PDF downloaded successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to download PDF.");
    } finally {
      setDownloading(false);
    }
  };

  const delta = resume.scoreAfter - resume.scoreBefore;
  const formattedDate = formatDate(resume.createdAt);

  // Extract LinkedIn & GitHub links from resume text
  const extractUrls = (text?: string) => {
    if (!text) return { linkedin: null, github: null };
    const li = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w\-\.%]+\/?/i);
    const gh = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[\w\-\.%]+(?:\/[\w\-\.%]+)?\/?/i);
    return {
      linkedin: li ? (li[0].startsWith("http") ? li[0] : "https://" + li[0]) : null,
      github: gh ? (gh[0].startsWith("http") ? gh[0] : "https://" + gh[0]) : null,
    };
  };

  const { linkedin, github } = extractUrls(resume.optimizedText || resume.originalText);

  return (
    <Card
      onClick={() => onSelect && onSelect(resume)}
      className="group relative border-slate-800 bg-slate-950/40 backdrop-blur-sm hover:border-indigo-500/50 cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5"
    >
      <CardContent className="p-5 flex flex-col justify-between h-full min-h-[160px]">
        {/* Top Info */}
        <div className="space-y-2">
          <div className="flex justify-between items-start gap-4">
            <h3 className="font-bold text-base text-slate-100 truncate group-hover:text-indigo-400 transition-colors">
              {resume.jobTitle || "Optimized Resume"}
            </h3>
            {/* Score Delta Badge */}
            {delta > 0 && (
              <Badge className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 select-none font-bold shrink-0">
                +{delta} pts
              </Badge>
            )}
          </div>

          {/* Company Name */}
          {resume.company && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Building className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <span className="truncate">{resume.company}</span>
            </div>
          )}

          {/* Date Created */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>{formattedDate}</span>
          </div>

          {/* LinkedIn & GitHub Links */}
          {(linkedin || github) && (
            <div className="flex items-center gap-3 pt-1" onClick={(e) => e.stopPropagation()}>
              {linkedin && (
                <a
                  href={linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                  title="LinkedIn Profile"
                >
                  <LinkedInIcon className="h-3 w-3 shrink-0" />
                  <span>LinkedIn</span>
                </a>
              )}
              {github && (
                <a
                  href={github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-slate-300 hover:text-white hover:underline transition-colors"
                  title="GitHub Profile"
                >
                  <GitHubIcon className="h-3 w-3 shrink-0" />
                  <span>GitHub</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Bottom Details & Download Button */}
        <div className="flex items-center justify-between border-t border-slate-900 pt-4 mt-4">
          <div className="flex gap-4 text-xs font-semibold">
            <div>
              <span className="text-slate-500">Before:</span>{" "}
              <span className="text-slate-300">{resume.scoreBefore}</span>
            </div>
            <div>
              <span className="text-slate-500">After:</span>{" "}
              <span className="text-indigo-400 font-black">{resume.scoreAfter}</span>
            </div>
          </div>

          <Button
            onClick={handleDownload}
            disabled={downloading}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full hover:bg-slate-900 text-slate-400 hover:text-white"
            title="Download PDF"
            type="button"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
            ) : (
              <FileDown className="h-4.5 w-4.5" />
            )}
          </Button>
        </div>

        {/* Hover Details Overlay */}
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <span>View Details</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
