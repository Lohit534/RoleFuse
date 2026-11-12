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
  const isLegalPage = pathname === "/privacy" || pathname === "/terms";

  if (isLegalPage) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-50 overflow-hidden select-none bg-white"
    >
      {/* ── The Signature Sweeping Organic Curved Light Teal Shape ── */}
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
    </div>
  );
}
