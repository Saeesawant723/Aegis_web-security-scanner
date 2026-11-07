"use client";

import React from "react";

interface AegisLogoProps {
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { svg: 28, text: "text-base" },
  md: { svg: 36, text: "text-xl" },
  lg: { svg: 48, text: "text-3xl" },
};

export default function AegisLogo({ size = "md" }: AegisLogoProps) {
  const s = sizes[size];

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Shield SVG */}
      <svg
        width={s.svg}
        height={s.svg}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Shield outline */}
        <path
          d="M24 4L6 14V26C6 36.5 14 44 24 46C34 44 42 36.5 42 26V14L24 4Z"
          stroke="#EDEDED"
          strokeWidth="2"
          fill="none"
        />
        {/* Inner shield */}
        <path
          d="M24 10L12 17V27C12 34 17 40 24 42C31 40 36 34 36 27V17L24 10Z"
          stroke="#333"
          strokeWidth="1"
          fill="none"
        />
        {/* Eye shape */}
        <ellipse cx="24" cy="26" rx="8" ry="5" stroke="#EDEDED" strokeWidth="1.5" fill="none" />
        {/* Pupil */}
        <circle cx="24" cy="26" r="2.5" fill="#B6FF00" />
        {/* Scan line */}
        <line
          x1="14"
          y1="26"
          x2="34"
          y2="26"
          stroke="#B6FF00"
          strokeWidth="1"
          opacity="0.6"
          className="animate-scanline"
        />
        <style>{`
          .animate-scanline {
            animation: logo-scan 2s ease-in-out infinite;
            transform-origin: center;
          }
          @keyframes logo-scan {
            0%, 100% { transform: translateY(-6px); opacity: 0.3; }
            50% { transform: translateY(6px); opacity: 0.8; }
          }
        `}</style>
      </svg>

      {/* Wordmark */}
      <span
        className={`${s.text} font-bold tracking-tight`}
        style={{ fontFamily: "var(--font-bricolage), sans-serif" }}
      >
        AEGIS
        <span style={{ color: "#B6FF00" }}>//</span>
        AI
      </span>
    </div>
  );
}
