"use client";

import React, { useState, useEffect, useRef } from "react";
import { PROCESS_SLIDES } from "@/lib/process-slides";

const CAROUSEL_BADGES = [
  "Real-time parser active",
  "Semantic keyword matching active",
  "Real-time rewrite active",
  "ATS-compliant export active",
];

export default function HeroProcessShowcase() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [mounted, setMounted] = useState(false);
  const startXRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const goTo = (n: number) => {
    setIndex((n + PROCESS_SLIDES.length) % PROCESS_SLIDES.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    setPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setPaused(false);
    if (startXRef.current !== null) {
      const diff = e.changedTouches[0].clientX - startXRef.current;
      if (Math.abs(diff) > 40) {
        goTo(index + (diff < 0 ? 1 : -1));
      }
      startXRef.current = null;
    }
  };

  const offsetPercent = index === 0 ? "0%" : `-${index * 100}%`;

  return (
    <div className="relative w-full max-w-[440px] sm:max-w-[480px] lg:max-w-[520px] 2xl:max-w-[540px]" suppressHydrationWarning>
      {/* Main Process Card */}
      <div
        className="relative bg-white border border-[#DCE7E9] rounded-2xl shadow-[0_14px_40px_-14px_rgba(8,127,110,0.16)] overflow-hidden transition-all duration-300"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Track Slider Container */}
        <div
          className="flex transition-transform duration-600 ease-[cubic-bezier(0.22,0.8,0.24,1)]"
          style={{ transform: `translateX(${offsetPercent})` }}
          suppressHydrationWarning
        >
          {PROCESS_SLIDES.map((slide, i) => (
            <div key={i} className="flex-none w-full p-4 sm:p-5 flex flex-col justify-between">
              {/* Slide Text Header */}
              <div className="flex items-start gap-2.5 mb-2.5">
                <span className="font-heading font-extrabold text-lg sm:text-xl text-[#087F6E] leading-none shrink-0 pt-0.5">
                  {slide.step}
                </span>
                <div className="space-y-0.5">
                  <h3 className="font-heading font-bold text-sm sm:text-[15px] text-[#111827] leading-tight">
                    {slide.title}
                  </h3>
                  <p className="text-[11.5px] sm:text-xs text-[#526176] leading-relaxed">
                    {slide.text}
                  </p>
                </div>
              </div>

              {/* Slide SVG Image */}
              <div className="w-full overflow-hidden rounded-xl border border-[#DCE7E9] bg-[#F8FAFC] shadow-2xs">
                <img
                  src={slide.img}
                  alt={slide.title}
                  className="w-full h-auto block select-none"
                  draggable={false}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ZOMATO-STYLE MOVING DOTS ("one by one moving right") ─────────────── */}
      <div className="mt-3.5 flex justify-center">
        <div
          className="flex items-center justify-center gap-1.5 p-1.5 rounded-full bg-white border border-[#DCE7E9] shadow-xs"
          role="tablist"
        >
          {PROCESS_SLIDES.map((_, k) => {
            const isActive = k === index;
            return (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Go to step ${k + 1}`}
                onClick={() => goTo(k)}
                className={`relative h-2 rounded-full overflow-hidden transition-all duration-300 ease-out cursor-pointer ${
                  isActive ? "w-8 bg-[#DCE7E9]" : "w-2 bg-[#DCE7E9] hover:bg-slate-300"
                }`}
              >
                {isActive && mounted && (
                  <span
                    key={`fill-${index}`}
                    className={`fill-bar ${paused ? "fill-bar-paused" : ""}`}
                    onAnimationEnd={() => goTo(index + 1)}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Down carousel: dynamic active step text (only text, not box) */}
      <div className="mt-2.5 text-center">
        <span className="text-[12px] font-medium text-slate-500 tracking-wide transition-all duration-300">
          {CAROUSEL_BADGES[index]}
        </span>
      </div>
    </div>
  );
}
