"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles, Lightbulb, MessageSquare, Bug, Send, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface FeedbackToastProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string | null;
}

type FeedbackType = "bug" | "feature" | "improvement" | "general";

const PLACEHOLDERS: Record<FeedbackType, string> = {
  bug: "Describe the bug you encountered — steps to reproduce, what happened, expected behaviour...",
  feature: "Describe the feature you'd like us to build...",
  improvement: "Tell us what could be smoother or better...",
  general: "Share your thoughts, ideas, or questions with the team...",
};

const TYPE_OPTIONS: { id: FeedbackType; label: string; icon: React.ReactNode }[] = [
  { id: "bug", label: "Bug", icon: <Bug className="h-3.5 w-3.5 text-red-400" /> },
  { id: "feature", label: "Feature", icon: <Sparkles className="h-3.5 w-3.5 text-amber-400" /> },
  { id: "improvement", label: "Improve", icon: <Lightbulb className="h-3.5 w-3.5 text-yellow-400" /> },
  { id: "general", label: "General", icon: <MessageSquare className="h-3.5 w-3.5 text-blue-400" /> },
];

export default function FeedbackToast({ isOpen, onClose, userEmail }: FeedbackToastProps) {
  const [type, setType] = useState<FeedbackType>("general");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Close other popups when feedback opens, and listen to close if another opens
  useEffect(() => {
    if (isOpen) {
      setSent(false);
      setMessage("");
      setType("general");
      window.dispatchEvent(new CustomEvent("rolefuse_close_popups", { detail: { source: "feedback" } }));
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClose = (e: any) => {
      if (e.detail?.source !== "feedback") {
        onClose();
      }
    };
    window.addEventListener("rolefuse_close_popups", handleClose);
    return () => window.removeEventListener("rolefuse_close_popups", handleClose);
  }, [onClose]);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, message, email: userEmail || "" }),
      });

      if (res.ok) {
        setSent(true);
        // Dismiss the top banner prompt across pages
        sessionStorage.setItem("fastHire_feedbackBannerDismissed", "true");
        window.dispatchEvent(new CustomEvent("fastHire_feedbackSubmitted"));

        toast.custom(
          (t) => (
            <div
              className={`flex items-start gap-3 bg-white border border-slate-200 shadow-xl rounded-2xl px-5 py-4 max-w-sm transition-all ${
                t.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              }`}
            >
              <CheckCircle2 className="h-5 w-5 text-[#0d6e5a] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-slate-900">Feedback received!</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thanks — we read every message and prioritise based on what you share.
                </p>
              </div>
            </div>
          ),
          { duration: 4000, position: "top-center" }
        );
        setTimeout(onClose, 1200);
      } else {
        toast.error("Failed to send. Please try again.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Clear transparent backdrop — no dark blur, click outside to close */}
      <div
        className="fixed inset-0 z-[90] bg-transparent"
        onClick={onClose}
      />

      {/* Below Right Corner modal wrapper — placed above bottom nav on mobile */}
      <div className="fixed bottom-[max(76px,calc(env(safe-area-inset-bottom)+68px))] right-3 sm:bottom-6 sm:right-6 z-[100] pointer-events-none flex justify-end items-end">
        <div
          className="w-[calc(100vw-24px)] max-w-[285px] sm:max-w-[340px] bg-white border border-slate-200 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-150 pointer-events-auto select-none"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Compact Header ── */}
          <div className="flex items-center justify-between px-3 py-2 sm:px-3.5 sm:py-2.5 border-b border-slate-100">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#087F6E]" />
              <p className="text-[11px] sm:text-xs font-bold text-slate-900 leading-none">Share Feedback</p>
            </div>
            <button
              onClick={onClose}
              className="h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close feedback"
            >
              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>

          {/* ── Compact Body ── */}
          <div className="p-2.5 sm:p-3.5 space-y-2 sm:space-y-3">
            {/* Category chips with balanced padding matching submit */}
            <div className="flex gap-1 sm:gap-1.5 flex-wrap">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setType(opt.id)}
                  className={`flex items-center gap-1 text-[10px] sm:text-xs font-medium px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg border transition-all cursor-pointer ${
                    type === opt.id
                      ? "bg-[#087F6E] border-[#087F6E] text-white shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300"
                  }`}
                >
                  <span className="scale-90 sm:scale-100">{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>

            {/* Message textarea with dynamic placeholder based on category select */}
            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={PLACEHOLDERS[type]}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[11px] sm:text-xs rounded-lg px-2.5 py-2 sm:px-3 sm:py-2.5 focus:outline-none focus:border-[#087F6E] focus:bg-white resize-none placeholder:text-slate-400 leading-relaxed transition-colors sm:rows-3"
            />

            {/* Bottom Row: Note on left + Black Submit button on right */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <p className="text-[9px] sm:text-[10px] leading-tight text-slate-500 font-normal select-none">
                We don&apos;t respond to submissions,<br />but we read all of them carefully
              </p>
              <button
                onClick={handleSend}
                disabled={!message.trim() || sending || sent}
                className="h-7 sm:h-8 px-2.5 sm:px-3.5 bg-black hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] sm:text-xs font-semibold rounded-md sm:rounded-lg transition-colors cursor-pointer shrink-0 shadow-xs flex items-center justify-center gap-1"
              >
                {sending ? (
                  <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </span>
                ) : sent ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    Submitted!
                  </span>
                ) : (
                  <span>Submit</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
