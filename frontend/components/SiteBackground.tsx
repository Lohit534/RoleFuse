"use client";

import React from "react";
import { usePathname } from "next/navigation";

/**
 * SiteBackground
 * 
 * Recreates the exact signature backdrop from the user's reference image:
 * - Crisp, clean pure white page ground (#FFFFFF)
 * - Large, elegant organic fluid curved backdrop shape in soft light teal
 * - Playful, floating micro-accent chips
 * - Strictly displayed ONLY on landing page and auth (login/signup) pages;
 *   completely removed after login on /dashboard (optimization, resumes, job tracker, pricing, billing, etc.)
 */
export default function SiteBackground() {
  const pathname = usePathname();

  // Hide on all logged-in dashboard tools (optimization, resumes, job-tracker, pricing, billing, history)
  if (!pathname || pathname.startsWith("/dashboard")) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-50 overflow-hidden select-none bg-white"
    >
      {/* ── 1. The Signature Sweeping Organic Curved Light Teal Shape (Matches Reference Image) ── */}
      <svg
        className="absolute top-0 left-0 w-full h-[620px] sm:h-[750px] lg:h-[900px] pointer-events-none opacity-90 transition-opacity duration-500"
        viewBox="0 0 1440 900"
        fill="none"
        preserveAspectRatio="xMidYMin slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Soft atmospheric gradient wash behind the curve */}
        <path
          d="M-100 -50 H1540 V500 C1300 650 1100 620 950 560 C750 480 600 680 350 720 C150 750 -50 680 -100 650 Z"
          fill="url(#light_teal_ambient_wash)"
          opacity="0.65"
        />

        {/* Primary organic sweeping curve hugging and framing the central card */}
        <path
          d="M-80 -40 C 220 20 480 140 680 110 C 920 70 1140 220 1280 320 C 1400 400 1480 500 1520 620 V -40 Z"
          fill="url(#light_teal_curve_grad)"
          opacity="0.85"
        />

        {/* Secondary gentle lower wave contour for depth and dimension */}
        <path
          d="M-50 420 C 180 380 380 520 580 480 C 820 440 1060 620 1260 560 C 1380 520 1480 580 1520 600 V 780 C 1360 840 1100 810 880 730 C 640 640 420 780 200 790 C 80 795 -20 760 -50 720 Z"
          fill="url(#light_teal_subtle_contour)"
          opacity="0.45"
        />

        <defs>
          {/* Main light teal fluid curve gradient */}
          <linearGradient
            id="light_teal_curve_grad"
            x1="120"
            y1="-20"
            x2="1350"
            y2="750"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#D4F3EF" stopOpacity="0.85" />
            <stop offset="0.35" stopColor="#E5F8F5" stopOpacity="0.7" />
            <stop offset="0.7" stopColor="#EDFAF8" stopOpacity="0.5" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Ambient wash gradient */}
          <radialGradient
            id="light_teal_ambient_wash"
            cx="650"
            cy="280"
            r="750"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#E6F7F5" stopOpacity="0.7" />
            <stop offset="0.5" stopColor="#F0FDF4" stopOpacity="0.4" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>

          {/* Secondary lower contour gradient */}
          <linearGradient
            id="light_teal_subtle_contour"
            x1="0"
            y1="400"
            x2="1440"
            y2="800"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#D4F3EF" stopOpacity="0.5" />
            <stop offset="0.6" stopColor="#E6F7F5" stopOpacity="0.3" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* ── 2. Playful Floating Micro-Accent Shapes (Identical to Reference Image) ── */}
      
      {/* Amber/Gold Rounded Square Chip (Left Side) */}
      <div
        className="absolute left-[6%] sm:left-[10%] lg:left-[14%] top-[40%] sm:top-[42%] w-3 sm:w-3.5 h-3 sm:h-3.5 rounded-[4px] bg-[#F59E0B] shadow-[0_2px_8px_rgba(245,158,11,0.28)] transform -rotate-12 transition-transform duration-700 pointer-events-none"
        style={{
          animation: "floatingChip 6s ease-in-out infinite",
        }}
      />

      {/* Soft Purple/Violet Rounded Square Chip (Right Side) */}
      <div
        className="absolute right-[5%] sm:right-[8%] lg:right-[11%] top-[36%] sm:top-[38%] w-3 sm:w-3.5 h-3 sm:h-3.5 rounded-[4px] bg-[#8B5CF6] shadow-[0_2px_8px_rgba(139,92,246,0.28)] transform rotate-12 transition-transform duration-700 pointer-events-none"
        style={{
          animation: "floatingChipReverse 7s ease-in-out infinite",
        }}
      />

      {/* Soft Rose/Pink Circular Dot (Bottom Left) */}
      <div
        className="absolute left-[16%] sm:left-[20%] lg:left-[24%] bottom-[12%] sm:bottom-[15%] w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#F43F5E] shadow-[0_2px_6px_rgba(244,63,94,0.3)] opacity-85 pointer-events-none"
        style={{
          animation: "floatingChip 8s ease-in-out infinite 1s",
        }}
      />

      {/* Soft Teal Diamond Chip (Top-Right Area) */}
      <div
        className="absolute right-[20%] sm:right-[24%] top-[14%] sm:top-[16%] w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-[3px] bg-[#087F6E]/45 shadow-[0_2px_6px_rgba(8,127,110,0.2)] transform rotate-45 pointer-events-none"
        style={{
          animation: "floatingChipReverse 6.5s ease-in-out infinite 0.5s",
        }}
      />

    </div>
  );
}
