"use client";

import React from "react";

interface CornerBracketPanelProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  number?: string;
  hoverable?: boolean;
}

export default function CornerBracketPanel({
  children,
  className = "",
  title,
  number,
  hoverable = true,
}: CornerBracketPanelProps) {
  return (
    <div
      className={`corner-bracket relative bg-panel border border-border p-6 ${
        hoverable ? "group" : ""
      } ${className}`}
    >
      {/* Corner brackets */}
      <span className="cb-tl" />
      <span className="cb-tr" />
      <span className="cb-bl" />
      <span className="cb-br" />

      {/* Title bar */}
      {title && (
        <div className="label-caps mb-4 flex items-center gap-2">
          {number && (
            <span className="text-accent">[{number}]</span>
          )}
          <span>{title}</span>
        </div>
      )}

      {children}
    </div>
  );
}
