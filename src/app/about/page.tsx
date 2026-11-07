'use client';

import { motion } from 'framer-motion';
import AegisLogo from '@/components/ui/AegisLogo';

const TEAM = [
  { handle: 'Builder', role: 'Full-stack / Security Research' },
];

const TECH = [
  'Next.js 15 (App Router)',
  'TypeScript',
  'Tailwind CSS v4',
  'Framer Motion',
  'Recharts',
  'JetBrains Mono + Bricolage Grotesque',
  'Server-Sent Events for live streaming',
  'Node.js security check modules',
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-bg/95">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-3">
          <AegisLogo size="sm" />
          <span className="font-mono text-muted" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
            / ABOUT
          </span>
        </div>
      </header>

      <main className="pt-28 pb-24 px-6 max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12"
        >
          <span
            className="text-accent font-mono uppercase tracking-widest block mb-4"
            style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}
          >
            [HIDDEN PAGE] // FOR PROFESSORS
          </span>
          <h1
            className="font-display font-bold text-text mb-4"
            style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', letterSpacing: '-0.04em', lineHeight: '0.95' }}
          >
            HOW WE BUILT IT.
          </h1>
          <p className="text-muted font-mono" style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', lineHeight: '1.8' }}>
            AEGIS//AI is a college software engineering project demonstrating real-world web security assessment.
            Every check is passive and non-destructive. No attack payloads are ever sent.
          </p>
        </motion.div>

        {/* Tech stack */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-6">
            <span className="text-muted font-mono uppercase tracking-widest" style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
              TECH STACK
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <ul className="flex flex-col gap-2">
            {TECH.map((t) => (
              <li
                key={t}
                className="flex items-center gap-3 font-mono text-muted"
                style={{ fontSize: '13px', fontFamily: 'var(--font-mono)' }}
              >
                <span className="text-accent">▸</span> {t}
              </li>
            ))}
          </ul>
        </motion.section>

        {/* Design decisions */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mb-12 border border-border p-6 bg-panel"
        >
          <div className="flex items-center gap-4 mb-6">
            <span className="text-muted font-mono uppercase tracking-widest" style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
              DESIGN DECISIONS
            </span>
          </div>
          <div className="flex flex-col gap-4 font-mono text-muted" style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', lineHeight: '1.8' }}>
            <p><span className="text-text">Brutalist aesthetic:</span> Deliberately anti-template. Hard 1px borders, no rounded corners, no glassmorphism. Inspired by command-center dashboards and old-school terminal UIs.</p>
            <p><span className="text-text">Typography:</span> Bricolage Grotesque for display + JetBrains Mono for all technical data. Enforced through CSS custom properties and Tailwind v4 @theme.</p>
            <p><span className="text-text">Palette:</span> #070707 background (not pure black), #B6FF00 accent (acid green for secure/action states), #FF3B30 danger only for critical findings.</p>
            <p><span className="text-text">Animations:</span> Custom Framer Motion easing [0.16, 1, 0.3, 1] throughout. Glitch text resolves letter-by-letter. Radar sweep uses CSS keyframes. Film grain and scanlines via CSS pseudo-elements.</p>
            <p><span className="text-text">Security scope:</span> 17 checks across 6 modules. Strictly passive: HEAD/GET requests only. Open port scanning uses TCP connect with 2s timeout, 17 ports max. No exploit code, no brute-force.</p>
          </div>
        </motion.section>

        {/* Team */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <span className="text-muted font-mono uppercase tracking-widest" style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
              TEAM
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>
          {TEAM.map((m) => (
            <div key={m.handle} className="flex items-center gap-4 border border-border p-4 bg-panel">
              <div className="w-8 h-8 border border-accent flex items-center justify-center">
                <span className="text-accent font-mono font-bold" style={{ fontSize: '12px' }}>
                  {m.handle[0]}
                </span>
              </div>
              <div>
                <div className="text-text font-mono font-bold" style={{ fontSize: '13px', fontFamily: 'var(--font-mono)' }}>{m.handle}</div>
                <div className="text-muted font-mono" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{m.role}</div>
              </div>
            </div>
          ))}
        </motion.section>

        <div className="mt-16 pt-8 border-t border-border">
          <a
            href="/"
            className="font-mono text-accent border border-accent px-4 py-2 hover:bg-accent hover:text-bg transition-colors"
            style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}
          >
            ← BACK TO AEGIS//AI
          </a>
        </div>
      </main>
    </div>
  );
}
