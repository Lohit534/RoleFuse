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

// Stage floors & ceilings for strictly accurate step-anchored loading
const STEP_FLOORS: Record<number, number> = {
  1: 8,
  2: 20,
  3: 36,
  4: 52,
  5: 82,
  6: 92,
  7: 98,
};

const STEP_CEILINGS: Record<number, number> = {
  1: 18,
  2: 34,
  3: 48,
  4: 80,
  5: 89,
  6: 96,
  7: 99,
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
  >(STEPS.map((s) => ({ id: s.id, status: "pending" })));
  const [progress, setProgress] = useState(8);
  const [funFact, setFunFact] = useState(FUN_FACTS[0]);
  const startRef = useRef<number>(Date.now());

  // Interactive Q&A state (for missing metrics, values, etc.)
  const [awaitingInput, setAwaitingInput] = useState(false);
  const awaitingInputRef = useRef(false);
  const [missingQuestions, setMissingQuestions] = useState<MissingQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isApplying, setIsApplying] = useState(false);

  const stepStartTimes = useRef<Record<number, number>>({});
  const isMountedRef = useRef(true);
  const currentStepRef = useRef<number>(1);

  // Micro-ticker calibrated to active step ceiling — never races ahead
  useEffect(() => {
    isMountedRef.current = true;
    startRef.current = Date.now();
    let factIndex = 0;
    const factInterval = setInterval(() => {
      factIndex = (factIndex + 1) % FUN_FACTS.length;
      setFunFact(FUN_FACTS[factIndex]);
    }, 5000);

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
    }, 600);

    return () => {
      isMountedRef.current = false;
      clearInterval(factInterval);
      clearInterval(smoothProgressInterval);
    };
  }, []);

  // Process SSE stream events (strictly monotonic, step-bounded)
  const processStreamChunk = (data: any) => {
    if (data.step && data.step >= 1) {
      if (data.status === "running") {
        currentStepRef.current = data.step;
        stepStartTimes.current[data.step] = Date.now();
        setSteps((prev) =>
          prev.map((s) =>
            s.id === data.step ? { ...s, status: "running" } : s
          )
        );
        const floor = STEP_FLOORS[data.step] || Math.round(((data.step - 1) / 7) * 100);
        setProgress((prev) => Math.max(prev, floor));
      }

      if (data.status === "done") {
        const dur =
          (
            (Date.now() -
              (stepStartTimes.current[data.step] || Date.now())) /
            1000
          ).toFixed(1) + "s";

        const nextStep = Math.min(7, data.step + 1);
        currentStepRef.current = nextStep;

        setSteps((prev) =>
          prev.map((s) => {
            if (s.id === data.step) {
              return { ...s, status: "done", duration: dur };
            }
            if (data.step === 6 && s.id === 7 && s.status === "pending") {
              stepStartTimes.current[7] = Date.now();
              return { ...s, status: "running" };
            }
            return s;
          })
        );

        const nextFloor = STEP_FLOORS[nextStep] || 98;
        setProgress((prev) => Math.max(prev, nextFloor));

        if (data.result) {
          currentStepRef.current = 7;
          setSteps((prev) =>
            prev.map((s) =>
              s.id === 7 ? { ...s, status: "done", duration: "0.8s" } : s
            )
          );
          setProgress(100);
          setTimeout(() => {
            if (isMountedRef.current) onComplete(data.result);
          }, 350);
        }
      }
    }
  };

  // ── PHASE 1: Detection pass ───────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const startPipeline = async () => {
      currentStepRef.current = 1;
      stepStartTimes.current[1] = Date.now();
      setSteps((prev) =>
        prev.map((s) => (s.id === 1 ? { ...s, status: "running" } : s))
      );
      setProgress(STEP_FLOORS[1]);

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

              // Missing metrics / values detected — show Q&A
              if (data.needsInput && Array.isArray(data.questions) && data.questions.length > 0) {
                setMissingQuestions(data.questions);
                setCurrentQuestionIndex(0);
                awaitingInputRef.current = true;
                setAwaitingInput(true);
                return;
              }

              processStreamChunk(data);
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

    // Mark step 3 done
    const dur3 = ((Date.now() - (stepStartTimes.current[3] || Date.now())) / 1000).toFixed(1) + "s";
    setSteps((prev) =>
      prev.map((s) => (s.id === 3 ? { ...s, status: "done", duration: dur3 } : s))
    );

    // Mark step 4 running immediately
    currentStepRef.current = 4;
    stepStartTimes.current[4] = Date.now();
    setSteps((prev) =>
      prev.map((s) => (s.id === 4 ? { ...s, status: "running" } : s))
    );
    setProgress((prev) => Math.max(prev, STEP_FLOORS[4]));

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

            processStreamChunk(data);
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
          {awaitingInput
            ? "Missing Details Detected"
            : STEPS.find((s) => steps.find((st) => st.id === s.id && st.status === "running"))?.label ??
              "Polishing the output"}
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm mt-1 font-normal line-clamp-2">
          {awaitingInput
            ? "Answer each question below to fill in missing values and maximize your ATS score."
            : "Stay on this tab — we're fine-tuning your keywords and impact metrics."}
        </p>
      </div>

      {/* ── INTERACTIVE Q&A PANEL (shown during awaitingInput) ── */}
      {awaitingInput && missingQuestions.length > 0 && currentQ ? (
        <div className="w-full bg-white border border-teal-200/90 shadow-xl rounded-2xl p-5 sm:p-6 space-y-4 mb-2 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-[#0d6e5a] text-[10px] font-bold uppercase tracking-wider">
                {currentQ.section || "DETAILS"}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Question {currentQuestionIndex + 1} of {missingQuestions.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {missingQuestions.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentQuestionIndex
                      ? "w-6 bg-[#0d6e5a]"
                      : i < currentQuestionIndex
                      ? "w-2.5 bg-teal-400"
                      : "w-2.5 bg-slate-200"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-bold text-[#0d6e5a] uppercase tracking-wider">
              {currentQ.field}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {currentQ.question}
            </h3>
            {currentQ.originalBullet && (
              <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 text-xs text-slate-700">
                <span className="font-bold text-slate-500 block mb-1 uppercase tracking-wider text-[10px]">
                  Target Bullet From Your Resume:
                </span>
                <span className="italic text-slate-800 font-medium">"{currentQ.originalBullet}"</span>
              </div>
            )}
            <div className="relative">
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
                className="w-full h-11 px-3.5 text-sm bg-slate-50/80 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d6e5a] focus:bg-white focus:border-transparent transition-all shadow-xs"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Press{" "}
              <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono">
                Enter ↵
              </kbd>{" "}
              to save and move to the next question.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {currentQuestionIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all cursor-pointer"
                >
                  ← Back
                </button>
              )}
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
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[#0d6e5a] hover:bg-[#087F6E] active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{isLast ? "Finish & Optimize Resume ✨" : "Next Question →"}</span>
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs">
              {!isLast && (
                <button
                  type="button"
                  onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                  className="text-slate-500 hover:text-slate-800 font-medium transition-colors cursor-pointer"
                >
                  Skip this question
                </button>
              )}
              <button
                type="button"
                onClick={() => handleApplyAnswers(true)}
                className="text-slate-400 hover:text-slate-600 text-[11px] transition-colors cursor-pointer"
              >
                Skip All &amp; Optimize
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Steps checklist — strictly fixed row heights (h-[52px]) to prevent layout jumping */
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
      )}

      {/* Rotating trivia with fixed height container so it never shifts layout */}
      <div className="h-10 flex items-center justify-center text-center mt-6 w-full max-w-md px-2 select-none">
        <p className="text-xs text-slate-400 font-normal leading-relaxed line-clamp-2">
          {funFact}
        </p>
      </div>
    </div>
  );
}
