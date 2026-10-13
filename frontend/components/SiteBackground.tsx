"use client";

import React from "react";

/**
 * SiteBackground
 * 
 * Recreates the signature visual background seen across all panels of the FasthireAI reference image:
 * - A clean, very light off-white base (#F5FAFA)
 * - Soft mint (#E5F8F5), light teal (#D4F3EF), and soft cyan-teal (#EAF9F8) abstract organic shapes
 *   flowing around the page edges and behind key content areas
 * - Zero interference with interactions (pointer-events: none)
 * - Hardware accelerated, responsive, and lightweight (SVG + CSS gradients)
 */
export default function SiteBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-50 overflow-hidden select-none"
      style={{ backgroundColor: "#F5FAFA" }}
    >
      {/* ── 1. Top-Right Organic Mint & Teal Flow (Frames Headers & Hero Previews) ── */}
      <div
        className="absolute -top-24 -right-24 sm:-top-32 sm:-right-32 w-[650px] sm:w-[850px] lg:w-[1050px] h-[550px] sm:h-[700px] lg:h-[850px] rounded-full pointer-events-none opacity-85"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 60% 40%, rgba(212, 243, 239, 0.75) 0%, rgba(229, 248, 245, 0.6) 45%, rgba(234, 249, 248, 0.3) 70%, transparent 100%)",
          filter: "blur(40px)",
        }}
      />

      {/* SVG Wave Shape on Top-Right for crisp organic contour (matches Panel 1 & 2) */}
      <svg
        className="absolute top-0 right-0 w-[500px] sm:w-[650px] lg:w-[800px] h-[400px] sm:h-[500px] lg:h-[650px] opacity-45 pointer-events-none"
        viewBox="0 0 800 650"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M800 0H350C420 80 500 120 480 220C450 340 320 310 360 450C400 580 580 620 800 650V0Z"
          fill="url(#mint_top_right_grad)"
        />
        <defs>
          <linearGradient id="mint_top_right_grad" x1="800" y1="0" x2="350" y2="500" gradientUnits="userSpaceOnUse">
            <stop stopColor="#D4F3EF" stopOpacity="0.8" />
            <stop offset="0.5" stopColor="#E5F8F5" stopOpacity="0.5" />
            <stop offset="1" stopColor="#F5FAFA" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* ── 2. Middle-Left Soft Mint Wave (Enters from Left Edge) ── */}
      <div
        className="absolute top-1/4 -left-32 sm:-left-44 w-[500px] sm:w-[700px] lg:w-[850px] h-[500px] sm:h-[650px] lg:h-[750px] rounded-full pointer-events-none opacity-70"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 30% 50%, rgba(229, 248, 245, 0.8) 0%, rgba(234, 249, 248, 0.5) 45%, rgba(245, 250, 250, 0.2) 75%, transparent 100%)",
          filter: "blur(50px)",
        }}
      />

      <svg
        className="absolute top-[22%] left-0 w-[400px] sm:w-[550px] lg:w-[700px] h-[450px] sm:h-[550px] opacity-35 pointer-events-none"
        viewBox="0 0 700 550"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 100C120 80 220 180 200 280C180 380 80 420 120 520C130 540 80 550 0 550V100Z"
          fill="url(#mint_left_grad)"
        />
        <defs>
          <linearGradient id="mint_left_grad" x1="0" y1="200" x2="250" y2="400" gradientUnits="userSpaceOnUse">
            <stop stopColor="#D4F3EF" stopOpacity="0.7" />
            <stop offset="0.6" stopColor="#E5F8F5" stopOpacity="0.4" />
            <stop offset="1" stopColor="#F5FAFA" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* ── 3. Right-Middle Ambient Shape (Behind Content Cards) ── */}
      <div
        className="absolute top-[55%] -right-24 sm:-right-36 w-[450px] sm:w-[600px] lg:w-[750px] h-[450px] sm:h-[600px] rounded-full pointer-events-none opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 55% 55% at 70% 50%, rgba(212, 243, 239, 0.6) 0%, rgba(229, 248, 245, 0.45) 50%, transparent 100%)",
          filter: "blur(45px)",
        }}
      />

      {/* ── 4. Bottom-Left & Bottom-Right Framing Accents ── */}
      <div
        className="absolute -bottom-24 -left-20 w-[450px] sm:w-[600px] h-[450px] sm:h-[600px] rounded-full pointer-events-none opacity-50"
        style={{
          background:
            "radial-gradient(circle, rgba(234, 249, 248, 0.8) 0%, rgba(229, 248, 245, 0.5) 50%, transparent 75%)",
          filter: "blur(50px)",
        }}
      />

      <div
        className="absolute -bottom-32 -right-24 w-[500px] sm:w-[700px] h-[500px] sm:h-[700px] rounded-full pointer-events-none opacity-55"
        style={{
          background:
            "radial-gradient(circle, rgba(212, 243, 239, 0.65) 0%, rgba(229, 248, 245, 0.4) 50%, transparent 80%)",
          filter: "blur(55px)",
        }}
      />

      {/* Subtle organic light contour lines connecting the atmosphere */}
      <div
        className="absolute inset-0 opacity-[0.25] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(8, 127, 110, 0.04) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
    </div>
  );
}
