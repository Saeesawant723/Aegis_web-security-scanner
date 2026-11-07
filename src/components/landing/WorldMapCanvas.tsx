"use client";

import React, { useEffect, useRef, useCallback } from "react";

// Simplified continent dot coordinates (normalized 0-1)
// These create recognizable landmass silhouettes
const CONTINENTS: [number, number][] = [
  // North America
  ...[
    [0.12,0.18],[0.13,0.19],[0.14,0.18],[0.15,0.17],[0.11,0.20],[0.12,0.21],[0.13,0.22],
    [0.14,0.21],[0.15,0.20],[0.16,0.19],[0.10,0.22],[0.11,0.23],[0.12,0.24],[0.13,0.25],
    [0.14,0.24],[0.15,0.23],[0.16,0.22],[0.17,0.21],[0.18,0.20],[0.12,0.26],[0.13,0.27],
    [0.14,0.26],[0.15,0.25],[0.16,0.25],[0.17,0.24],[0.18,0.23],[0.19,0.22],[0.14,0.28],
    [0.15,0.27],[0.16,0.27],[0.17,0.26],[0.18,0.25],[0.19,0.24],[0.20,0.23],[0.15,0.29],
    [0.16,0.29],[0.17,0.28],[0.18,0.27],[0.19,0.26],[0.20,0.25],[0.21,0.24],[0.16,0.30],
    [0.17,0.30],[0.18,0.29],[0.19,0.28],[0.20,0.27],[0.21,0.26],[0.18,0.31],[0.19,0.30],
    [0.20,0.29],[0.21,0.28],[0.19,0.32],[0.20,0.31],[0.21,0.30],[0.22,0.29],
  ] as [number, number][],
  // Central America
  ...[
    [0.20,0.33],[0.21,0.34],[0.22,0.35],[0.21,0.36],[0.22,0.37],[0.23,0.38],
  ] as [number, number][],
  // South America
  ...[
    [0.25,0.40],[0.26,0.41],[0.27,0.40],[0.28,0.41],[0.24,0.42],[0.25,0.43],[0.26,0.44],
    [0.27,0.43],[0.28,0.42],[0.29,0.42],[0.30,0.41],[0.24,0.45],[0.25,0.46],[0.26,0.47],
    [0.27,0.46],[0.28,0.45],[0.29,0.44],[0.25,0.48],[0.26,0.49],[0.27,0.48],[0.28,0.47],
    [0.25,0.50],[0.26,0.51],[0.27,0.50],[0.28,0.49],[0.26,0.52],[0.27,0.53],[0.26,0.54],
    [0.27,0.55],[0.26,0.56],[0.27,0.57],[0.26,0.58],[0.27,0.59],[0.27,0.61],[0.28,0.62],
    [0.27,0.63],[0.28,0.65],[0.29,0.67],
  ] as [number, number][],
  // Europe
  ...[
    [0.47,0.15],[0.48,0.16],[0.49,0.15],[0.50,0.16],[0.51,0.15],[0.46,0.17],[0.47,0.18],
    [0.48,0.19],[0.49,0.18],[0.50,0.17],[0.51,0.18],[0.52,0.17],[0.47,0.20],[0.48,0.21],
    [0.49,0.20],[0.50,0.19],[0.51,0.20],[0.48,0.22],[0.49,0.23],[0.50,0.22],[0.51,0.21],
    [0.52,0.20],[0.49,0.24],[0.50,0.25],[0.51,0.24],[0.52,0.23],[0.50,0.26],[0.51,0.26],
    [0.52,0.25],[0.53,0.24],[0.54,0.23],
  ] as [number, number][],
  // Africa
  ...[
    [0.48,0.32],[0.49,0.33],[0.50,0.32],[0.51,0.33],[0.52,0.32],[0.53,0.33],[0.54,0.32],
    [0.48,0.34],[0.49,0.35],[0.50,0.34],[0.51,0.35],[0.52,0.34],[0.53,0.35],[0.54,0.34],
    [0.49,0.36],[0.50,0.37],[0.51,0.36],[0.52,0.37],[0.53,0.36],[0.54,0.37],[0.49,0.38],
    [0.50,0.39],[0.51,0.38],[0.52,0.39],[0.53,0.38],[0.54,0.39],[0.50,0.40],[0.51,0.41],
    [0.52,0.40],[0.53,0.41],[0.54,0.40],[0.50,0.42],[0.51,0.43],[0.52,0.42],[0.53,0.43],
    [0.51,0.44],[0.52,0.45],[0.53,0.44],[0.51,0.46],[0.52,0.47],[0.53,0.46],[0.52,0.48],
    [0.53,0.49],[0.52,0.50],[0.53,0.51],[0.52,0.52],[0.53,0.53],[0.54,0.55],
  ] as [number, number][],
  // Asia
  ...[
    [0.55,0.14],[0.56,0.15],[0.57,0.14],[0.58,0.15],[0.59,0.14],[0.60,0.15],[0.61,0.14],
    [0.62,0.15],[0.63,0.14],[0.64,0.15],[0.55,0.16],[0.56,0.17],[0.57,0.16],[0.58,0.17],
    [0.59,0.16],[0.60,0.17],[0.61,0.16],[0.62,0.17],[0.63,0.16],[0.64,0.17],[0.65,0.16],
    [0.56,0.18],[0.57,0.19],[0.58,0.18],[0.59,0.19],[0.60,0.18],[0.61,0.19],[0.62,0.18],
    [0.63,0.19],[0.64,0.18],[0.65,0.19],[0.66,0.18],[0.57,0.20],[0.58,0.21],[0.59,0.20],
    [0.60,0.21],[0.61,0.20],[0.62,0.21],[0.63,0.20],[0.64,0.21],[0.65,0.20],[0.66,0.21],
    [0.67,0.20],[0.58,0.22],[0.59,0.23],[0.60,0.22],[0.61,0.23],[0.62,0.22],[0.63,0.23],
    [0.64,0.22],[0.65,0.23],[0.66,0.22],[0.67,0.23],[0.59,0.24],[0.60,0.25],[0.61,0.24],
    [0.62,0.25],[0.63,0.24],[0.64,0.25],[0.65,0.24],[0.66,0.25],[0.67,0.24],[0.60,0.26],
    [0.61,0.27],[0.62,0.26],[0.63,0.27],[0.64,0.26],[0.65,0.27],[0.66,0.26],[0.61,0.28],
    [0.62,0.29],[0.63,0.28],[0.64,0.29],[0.65,0.28],[0.62,0.30],[0.63,0.31],[0.64,0.30],
    [0.72,0.22],[0.73,0.23],[0.74,0.22],[0.75,0.23],[0.76,0.22],[0.73,0.24],[0.74,0.25],
    [0.75,0.24],[0.76,0.25],[0.74,0.26],[0.75,0.27],[0.76,0.26],[0.75,0.28],[0.76,0.29],
    [0.77,0.28],[0.78,0.27],[0.79,0.26],[0.80,0.27],[0.81,0.26],
  ] as [number, number][],
  // India
  ...[
    [0.65,0.30],[0.66,0.31],[0.67,0.30],[0.66,0.32],[0.67,0.33],[0.66,0.34],[0.67,0.35],
    [0.66,0.36],[0.67,0.37],[0.67,0.38],
  ] as [number, number][],
  // Australia
  ...[
    [0.78,0.50],[0.79,0.49],[0.80,0.50],[0.81,0.49],[0.82,0.50],[0.83,0.49],[0.84,0.50],
    [0.78,0.52],[0.79,0.51],[0.80,0.52],[0.81,0.51],[0.82,0.52],[0.83,0.51],[0.84,0.52],
    [0.79,0.53],[0.80,0.54],[0.81,0.53],[0.82,0.54],[0.83,0.53],[0.80,0.55],[0.81,0.56],
    [0.82,0.55],[0.83,0.56],[0.81,0.57],[0.82,0.58],
  ] as [number, number][],
  // Japan / East Asia islands
  ...[
    [0.82,0.22],[0.83,0.23],[0.82,0.24],[0.83,0.25],[0.84,0.24],[0.83,0.26],[0.84,0.27],
  ] as [number, number][],
];

interface PulseDot {
  x: number;
  y: number;
  phase: number;
  active: boolean;
}

interface Arc {
  from: [number, number];
  to: [number, number];
  progress: number;
  opacity: number;
}

export default function WorldMapCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const pulseDotsRef = useRef<PulseDot[]>([]);
  const arcsRef = useRef<Arc[]>([]);
  const lastPulseRef = useRef(0);

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
    ctx.clearRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = "rgba(34, 34, 34, 0.3)";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < w; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Registration marks at corners
    const markSize = 12;
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 1;
    const corners = [[20, 20], [w - 20, 20], [20, h - 20], [w - 20, h - 20]];
    corners.forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.moveTo(cx - markSize, cy);
      ctx.lineTo(cx + markSize, cy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy - markSize);
      ctx.lineTo(cx, cy + markSize);
      ctx.stroke();
    });

    // Continent dots
    CONTINENTS.forEach(([nx, ny]) => {
      const x = nx * w;
      const y = ny * h;
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = "#222";
      ctx.fill();
    });

    // Select new pulse dots every 3 seconds
    if (time - lastPulseRef.current > 3000) {
      lastPulseRef.current = time;
      const count = 5 + Math.floor(Math.random() * 4);
      const indices = new Set<number>();
      while (indices.size < count && indices.size < CONTINENTS.length) {
        indices.add(Math.floor(Math.random() * CONTINENTS.length));
      }
      pulseDotsRef.current = Array.from(indices).map((i) => ({
        x: CONTINENTS[i][0] * w,
        y: CONTINENTS[i][1] * h,
        phase: 0,
        active: true,
      }));

      // Create arcs between random pairs of pulse dots
      const pDots = pulseDotsRef.current;
      if (pDots.length >= 2) {
        arcsRef.current = [];
        for (let a = 0; a < Math.min(3, pDots.length - 1); a++) {
          const fromIdx = a;
          const toIdx = a + 1;
          arcsRef.current.push({
            from: [pDots[fromIdx].x, pDots[fromIdx].y],
            to: [pDots[toIdx].x, pDots[toIdx].y],
            progress: 0,
            opacity: 0.15,
          });
        }
      }
    }

    // Draw pulse dots
    pulseDotsRef.current.forEach((dot) => {
      dot.phase += 0.02;
      if (dot.phase > 1) dot.active = false;
      if (!dot.active) return;

      const scale = 1 + Math.sin(dot.phase * Math.PI) * 3;
      const alpha = Math.sin(dot.phase * Math.PI);

      ctx.beginPath();
      ctx.arc(dot.x, dot.y, 1.5 * scale, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(182, 255, 0, ${alpha * 0.6})`;
      ctx.fill();

      // Glow ring
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, 1.5 * scale * 2, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(182, 255, 0, ${alpha * 0.2})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    });

    // Draw arcs
    arcsRef.current.forEach((arc) => {
      arc.progress = Math.min(arc.progress + 0.008, 1);
      const fade = arc.progress > 0.7 ? (1 - arc.progress) / 0.3 : 1;

      const mx = (arc.from[0] + arc.to[0]) / 2;
      const my = Math.min(arc.from[1], arc.to[1]) - 40;

      ctx.beginPath();
      ctx.moveTo(arc.from[0], arc.from[1]);
      ctx.quadraticCurveTo(mx, my, arc.to[0], arc.to[1]);
      ctx.strokeStyle = `rgba(182, 255, 0, ${0.12 * fade})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    const loop = (time: number) => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        draw(ctx, rect.width, rect.height, time);
      }
      animationRef.current = requestAnimationFrame(loop);
    };
    animationRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0"
      style={{ opacity: 0.6 }}
    />
  );
}
