import React from "react";

export function GeminiIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Google Gemini"
    >
      {/* Official Google Gemini 4-Point Curved Sparkle */}
      <path
        d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z"
        fill="currentColor"
      />
      {/* Secondary Companion Spark */}
      <path
        d="M19 1C19 2.657 17.657 4 16 4C17.657 4 19 5.343 19 7C19 5.343 20.343 4 22 4C20.343 4 19 2.657 19 1Z"
        fill="currentColor"
        opacity="0.8"
      />
    </svg>
  );
}

export function GeminiColorIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Google Gemini"
    >
      <defs>
        <linearGradient id="geminiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1BA1E3" />
          <stop offset="50%" stopColor="#5B7FFF" />
          <stop offset="100%" stopColor="#9C62FD" />
        </linearGradient>
      </defs>
      <path
        d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z"
        fill="url(#geminiGrad)"
      />
      <path
        d="M19 1C19 2.657 17.657 4 16 4C17.657 4 19 5.343 19 7C19 5.343 20.343 4 22 4C20.343 4 19 2.657 19 1Z"
        fill="url(#geminiGrad)"
        opacity="0.85"
      />
    </svg>
  );
}

