"use client";

import React, { useEffect, useState, useRef } from "react";
import { Check } from "lucide-react";

const STEPS = [
  { id: 1, label: "Reading your resume" },
  { id: 2, label: "Parsing the job description" },
  { id: 3, label: "Finding your strongest stories" },
  { id: 4, label: "Rewriting your experience section" },
  { id: 5, label: "Aligning to ATS keywords" },
  { id: 6, label: "Polishing the output" },
  { id: 7, label: "Almost ready" },
];

const FUN_FACTS = [
  "Did you know: recruiters spend about 7 seconds on the first pass of a resume",
  "Did you know: over 75% of resumes are rejected by ATS before a human reads them",
  "Did you know: resumes with quantified metrics are 40% more likely to get callbacks",
  "Did you know: aligning keywords with the job description boosts interview match by 60%",
  "Did you know: single-column resumes parse 3x more accurately in enterprise ATS systems",
];

interface MissingQuestion {
  field: string;
  section?: string;
  question: string;
  hint?: string;
  originalBullet?: string;
}

interface OptimizingProgressProps {
  onComplete: (result: any) => void;
  onError?: (error: string) => void;
  resumeText: string;
  jobDescription: string;
  instructions?: string;
}

const STEP_CEILINGS: Record<number, number> = {
  1: 18,
  2: 34,
  3: 48,
  4: 80,
  5: 89,
  6: 96,
  7: 99,
};

const STEP_FLOORS: Record<number, number> = {
  1: 8,
  2: 20,
  3: 36,
  4: 52,
  5: 82,
  6: 92,
  7: 98,
};

export default function OptimizingProgress({
  onComplete,
  onError,
  resumeText,
  jobDescription,
  instructions = "",
}: OptimizingProgressProps) {
  const [steps, setSteps] = useState<
    { id: number; status: "pending" | "running" | "done"; duration?: string }[]
  >(STEPS.map((s, idx) => ({ id: s.id, status: idx === 0 ? "running" : "pending" })));
  const [currentStepId, setCurrentStepId] = useState(1);
  const [progress, setProgress] = useState(8);
  const [funFact, setFunFact] = useState(FUN_FACTS[0]);

  // Interactive Q&A state (styled matching user Image 2 card modal)
  const [awaitingInput, setAwaitingInput] = useState(false);
  const awaitingInputRef = useRef(false);
  const [missingQuestions, setMissingQuestions] = useState<MissingQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isApplying, setIsApplying] = useState(false);

  const isMountedRef = useRef(true);
  const currentStepRef = useRef<number>(1);
  const backendResultRef = useRef<any>(null);
  const backendStepDoneRef = useRef<Record<number, boolean>>({});

  // 1. Continuous smooth loading: smooth micro-ticker & fun facts rotation
  useEffect(() => {
    isMountedRef.current = true;
    let factIndex = 0;
    const factInterval = setInterval(() => {
      factIndex = (factIndex + 1) % FUN_FACTS.length;
      setFunFact(FUN_FACTS[factIndex]);
    }, 5000);

    // Slowly and smoothly increments progress without skipping or jumping
    const smoothProgressInterval = setInterval(() => {
      if (awaitingInputRef.current) return;
      const activeStep = currentStepRef.current;
      const ceiling = STEP_CEILINGS[activeStep] ?? 98;
      setProgress((prev) => {
        if (prev < ceiling) {
          return prev + 1;
        }
        return prev;
      });
    }, 500);

    return () => {
      isMountedRef.current = false;
      clearInterval(factInterval);
      clearInterval(smoothProgressInterval);
    };
  }, []);

  // 2. Continuous Step Progression: Paces each step smoothly so no step is ever skipped
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const advanceToNext = (fromStep: number) => {
      if (!isMountedRef.current || awaitingInputRef.current) return;

      const next = fromStep + 1;
      if (next > 7) {
        if (backendResultRef.current) {
          setProgress(100);
          setSteps((prev) =>
            prev.map((s) => ({ ...s, status: "done", duration: s.duration || "2.4s" }))
          );
          setTimeout(() => {
            if (isMountedRef.current) onComplete(backendResultRef.current);
          }, 400);
        }
        return;
      }

      // Mark fromStep as done with realistic display duration
      const durationStr = `${(1.8 + (fromStep * 0.4)).toFixed(1)}s`;
      setSteps((prev) =>
        prev.map((s) => {
          if (s.id === fromStep) return { ...s, status: "done", duration: durationStr };
          if (s.id === next) return { ...s, status: "running" };
          return s;
        })
      );

      currentStepRef.current = next;
      setCurrentStepId(next);
      setProgress((prev) => Math.max(prev, STEP_FLOORS[next]));

      // Pace for next step
      let delay = 2400;
      if (next === 4) {
        // Step 4 is the AI rewrite call: hold until backend step 4 completes
        const checkBackendStep4 = setInterval(() => {
          if (backendStepDoneRef.current[4] || backendResultRef.current) {
            clearInterval(checkBackendStep4);
            advanceToNext(4);
          }
        }, 300);
        return;
      } else if (next === 5) {
        delay = 2200;
      } else if (next === 6) {
        delay = 2000;
      } else if (next === 7) {
        delay = 1800;
      }

      timer = setTimeout(() => {
        advanceToNext(next);
      }, delay);
    };

    // Start Step 1 running for 2.4s, then advance to Step 2
    timer = setTimeout(() => {
      advanceToNext(1);
    }, 2400);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // ── PHASE 1: Detection pass ───────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const startPipeline = async () => {
      try {
        const res = await fetch("/api/optimize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resumeText,
            jobDescription,
            instructions,
          }),
        });

        if (!res.body) throw new Error("No response body from optimization service.");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!isMountedRef.current || cancelled) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const jsonStart = line.indexOf("{");
              if (jsonStart === -1) continue;
              const data = JSON.parse(line.slice(jsonStart));

              if (data.error) {
                if (onError) onError(data.error);
                return;
              }

              // Missing metrics / details detected -> show Question Box styled like Image 2
              if (data.needsInput && Array.isArray(data.questions) && data.questions.length > 0) {
                setMissingQuestions(data.questions);
                setCurrentQuestionIndex(0);
                awaitingInputRef.current = true;
                setAwaitingInput(true);
                return;
              }

              if (data.step) {
                if (data.status === "done") {
                  backendStepDoneRef.current[data.step] = true;
                }
              }

              if (data.result) {
                backendResultRef.current = data.result;
                // If UI has already reached step 7, complete immediately
                if (currentStepRef.current >= 7) {
                  setProgress(100);
                  setSteps((prev) =>
                    prev.map((s) => ({ ...s, status: "done", duration: s.duration || "2.1s" }))
                  );
                  setTimeout(() => {
                    if (isMountedRef.current) onComplete(data.result);
                  }, 400);
                }
              }
            } catch (e) {
              // Ignore incomplete chunks
            }
          }
        }
      } catch (err: any) {
        if (onError) onError(err?.message || "Failed to start optimization.");
      }
    };

    startPipeline();

    return () => {
      cancelled = true;
    };
  }, [resumeText, jobDescription]);

  // ── PHASE 2: Optimization with collected answers ─────────────────────────────
  const proceedToOptimization = async (collectedAnswers: Record<string, string>) => {
    setIsApplying(true);
    awaitingInputRef.current = false;
    setAwaitingInput(false);

    // Smoothly resume at Step 4
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id <= 3) return { ...s, status: "done", duration: s.duration || "2.2s" };
        if (s.id === 4) return { ...s, status: "running" };
        return s;
      })
    );
    currentStepRef.current = 4;
    setCurrentStepId(4);
    setProgress(52);

    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          jobDescription,
          instructions,
          userAnswers: collectedAnswers,
          skipDetection: true,
        }),
      });

      if (!res.body) throw new Error("No response body from optimization service.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!isMountedRef.current) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const jsonStart = line.indexOf("{");
            if (jsonStart === -1) continue;
            const data = JSON.parse(line.slice(jsonStart));

            if (data.error) {
              if (onError) onError(data.error);
              return;
            }

            if (data.step && data.status === "done") {
              backendStepDoneRef.current[data.step] = true;
            }

            if (data.result) {
              backendResultRef.current = data.result;
              setProgress(100);
              setSteps((prev) =>
                prev.map((s) => ({ ...s, status: "done", duration: s.duration || "2.1s" }))
              );
              setTimeout(() => {
                if (isMountedRef.current) onComplete(data.result);
              }, 400);
            }
          } catch (e) {
            // Ignore incomplete chunks
          }
        }
      }
    } catch (err: any) {
      if (onError) onError(err?.message || "Failed to complete resume optimization.");
    } finally {
      setIsApplying(false);
    }
  };

  const handleApplyAnswers = (skipMode = false) => {
    const answersToSend = skipMode ? {} : userAnswers;
    proceedToOptimization(answersToSend);
  };

  const currentQ = missingQuestions[currentQuestionIndex] || missingQuestions[0];
  const isLast = currentQuestionIndex === missingQuestions.length - 1;

  // ── RENDER AI QUESTION BOX (STRICTLY STYLED MATCHING IMAGE 2 CARD MODAL) ──
  if (awaitingInput && missingQuestions.length > 0 && currentQ) {
    return (
      <div className="w-full max-w-lg mx-auto bg-white rounded-3xl p-6 sm:p-9 shadow-2xl border border-slate-100 select-none animate-in fade-in zoom-in-95 duration-200">
        {/* Top Icon Badge matching Image 2 circular pill */}
        <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-[#0d6e5a] mx-auto mb-5 shadow-2xs">
          <Check className="w-6 h-6 stroke-[2.5]" />
        </div>

        {/* Headline */}
        <h2 className="text-2xl sm:text-[28px] font-black text-slate-900 tracking-tight text-center mb-2 leading-tight">
          Missing Details Detected
        </h2>

        {/* Clean explanatory description */}
        <p className="text-slate-500 text-xs sm:text-sm font-normal text-center mb-6 leading-relaxed max-w-sm mx-auto">
          We found a few missing values in your resume. Answering them helps tailor your resume and maximize your ATS match score.
        </p>

        {/* Question & Target Context Box */}
        <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 sm:p-5 mb-5 text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-50 text-[#0d6e5a] border border-teal-200">
              {currentQ.section || "DETAILS"}
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              Question {currentQuestionIndex + 1} of {missingQuestions.length}
            </span>
          </div>

          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            {currentQ.field}
          </div>

          <div className="text-base sm:text-lg font-bold text-slate-900 mb-2 leading-snug">
            {currentQ.question}
          </div>

          {currentQ.originalBullet && (
            <div className="text-xs text-slate-700 italic bg-white border border-slate-200 rounded-xl p-3 mt-2">
              <span className="font-bold text-slate-400 block mb-1 uppercase tracking-wider text-[9px] not-italic">
                Target Resume Bullet:
              </span>
              "{currentQ.originalBullet}"
            </div>
          )}
        </div>

        {/* Input Field */}
        <div className="mb-6 text-left">
          <input
            autoFocus
            type="text"
            value={userAnswers[currentQ.field] || ""}
            onChange={(e) =>
              setUserAnswers((prev) => ({
                ...prev,
                [currentQ.field]: e.target.value,
              }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (!isLast) {
                  setCurrentQuestionIndex((prev) => prev + 1);
                } else {
                  handleApplyAnswers(false);
                }
              }
            }}
            placeholder={currentQ.hint || `Type your answer for ${currentQ.field}...`}
            className="w-full h-12 px-4 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d6e5a] focus:border-transparent transition-all shadow-xs"
          />
          <p className="text-[11px] text-slate-400 mt-1.5 ml-1">
            Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono">Enter ↵</kbd> to save and proceed.
          </p>
        </div>

        {/* Dual Action Buttons matching Image 2 Layout */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (!isLast) {
                setCurrentQuestionIndex((prev) => prev + 1);
              } else {
                handleApplyAnswers(false);
              }
            }}
            disabled={isApplying}
            className="w-full sm:flex-1 h-12 rounded-xl bg-[#0d6e5a] hover:bg-[#087F6E] active:scale-95 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <span>{isLast ? "Finish & Optimize" : "Save & Next"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!isLast) {
                setCurrentQuestionIndex((prev) => prev + 1);
              } else {
                handleApplyAnswers(true);
              }
            }}
            className="w-full sm:flex-1 h-12 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold flex items-center justify-center transition-all cursor-pointer"
          >
            <span>{isLast ? "Skip All & Optimize" : "Skip this question"}</span>
          </button>
        </div>
      </div>
    );
  }

  // ── RENDER STATIC PROGRESS PAGE (MATCHING USER IMAGE 1) ──
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto select-none">
      {/* Circular progress ring in Teal (#0d6e5a) with light teal track (#ccfbf1) */}
      <div className="relative w-36 h-36 mb-6 flex-shrink-0">
        <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="#ccfbf1"
            strokeWidth="8"
          />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="#0d6e5a"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 52}`}
            strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress / 100)}`}
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
          <span className="text-3xl font-black text-slate-900 tracking-tight">{progress}%</span>
          <span className="text-xs text-slate-500 font-medium mt-0.5">
            {progress >= 100 ? "complete" : `~${Math.max(1, Math.round((100 - progress) * 0.22))}s left`}
          </span>
        </div>
      </div>

      {/* Fixed-height Header slot so text length never causes vertical shifting */}
      <div className="h-16 flex flex-col items-center justify-center text-center w-full max-w-md px-2 select-none mb-4">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight line-clamp-1">
          {STEPS.find((s) => s.id === currentStepId)?.label ?? "Parsing the job description"}
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm mt-1 font-normal line-clamp-2">
          Stay on this tab — we'll ask you a couple of things if we need them.
        </p>
      </div>

      {/* Steps checklist — strictly fixed row heights (h-[52px]) to prevent layout jumping */}
      <div className="w-full max-w-lg space-y-2.5 flex-shrink-0">
        {STEPS.map((step) => {
          const s = steps.find((x) => x.id === step.id);
          const status = s?.status ?? "pending";

          return (
            <div
              key={step.id}
              className={`
                h-[52px] flex items-center justify-between
                px-4 sm:px-5 rounded-2xl
                transition-colors duration-200
                ${
                  status === "done"
                    ? "bg-white border border-slate-200/80 shadow-2xs"
                    : status === "running"
                      ? "bg-teal-50/70 border border-teal-200/90 shadow-xs"
                      : "bg-white/60 border border-slate-100 opacity-60"
                }
              `}
            >
              <div className="flex items-center gap-3.5">
                {status === "done" ? (
                  <div className="w-5 h-5 rounded-full bg-[#0d6e5a] flex items-center justify-center flex-shrink-0 text-white shadow-2xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : status === "running" ? (
                  <div className="w-4 h-4 rounded-full border-2 border-[#0d6e5a] border-t-transparent animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0" />
                )}

                <span
                  className={`text-xs sm:text-sm ${
                    status === "done"
                      ? "text-slate-800 font-semibold"
                      : status === "running"
                        ? "text-[#0d6e5a] font-bold"
                        : "text-slate-400 font-medium"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {status === "done" ? (
                <span className="text-[11px] text-slate-400 font-medium">
                  {s?.duration || "2.1s"}
                </span>
              ) : status === "running" ? (
                <span className="text-xs text-[#0d6e5a] font-semibold lowercase">
                  running
                </span>
              ) : (
                <span className="w-8" />
              )}
            </div>
          );
        })}
      </div>

      {/* Rotating trivia with fixed height container so it never shifts layout */}
      <div className="h-10 flex items-center justify-center text-center mt-6 w-full max-w-md px-2 select-none">
        <p className="text-xs text-slate-400 font-normal leading-relaxed line-clamp-2">
          {funFact}
        </p>
      </div>
    </div>
  );
}
