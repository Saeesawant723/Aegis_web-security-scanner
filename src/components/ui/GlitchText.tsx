"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";

const CHARS = "!@#$%^&*()_+-=[]{}|;:<>?/0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

interface GlitchTextProps {
  text: string;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  onComplete?: () => void;
}

export default function GlitchText({
  text,
  as: Tag = "h1",
  className = "",
  style,
  delay = 0,
  onComplete,
}: GlitchTextProps) {
  // Always initialize with real text so headline is NEVER blank or missing
  const [displayText, setDisplayText] = useState(text);
  const [showCursor, setShowCursor] = useState(true);
  const [cursorVisible, setCursorVisible] = useState(true);
  const animationFinished = useRef(false);

  const randomChar = useCallback(() => {
    return CHARS[Math.floor(Math.random() * CHARS.length)];
  }, []);

  useEffect(() => {
    if (animationFinished.current) return;

    const chars = text.split("");
    const resolved = new Array(chars.length).fill(false);
    let currentDisplay = chars.map((c) => (c === " " ? " " : randomChar()));

    const delayTimer = setTimeout(() => {
      let resolvedIndex = 0;

      // Scramble unresolved characters
      const scrambleInterval = setInterval(() => {
        currentDisplay = currentDisplay.map((c, i) =>
          resolved[i] ? chars[i] : chars[i] === " " ? " " : randomChar()
        );
        setDisplayText(currentDisplay.join(""));
      }, 35);

      // Lock in characters one by one
      const resolveInterval = setInterval(() => {
        if (resolvedIndex >= chars.length) {
          clearInterval(resolveInterval);
          clearInterval(scrambleInterval);
          animationFinished.current = true;
          setDisplayText(text);
          setShowCursor(true);
          onComplete?.();
          setTimeout(() => setCursorVisible(false), 2500);
          return;
        }

        resolved[resolvedIndex] = true;
        currentDisplay[resolvedIndex] = chars[resolvedIndex];
        resolvedIndex++;
        setDisplayText(currentDisplay.join(""));
      }, 50);

      return () => {
        clearInterval(scrambleInterval);
        clearInterval(resolveInterval);
      };
    }, delay);

    return () => clearTimeout(delayTimer);
  }, [text, delay, randomChar, onComplete]);

  return React.createElement(
    Tag,
    {
      className: `${className}`,
      style: {
        fontFamily: "var(--font-bricolage), sans-serif",
        letterSpacing: "-0.03em",
        ...style,
      },
    },
    <>
      {displayText}
      {showCursor && cursorVisible && (
        <span
          className="inline-block ml-1 text-accent"
          style={{ animation: "blink-cursor 0.8s step-end infinite" }}
        >
          ▌
        </span>
      )}
    </>
  );
}
