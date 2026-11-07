'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import AegisLogo from '@/components/ui/AegisLogo';
import GlitchText from '@/components/ui/GlitchText';
import CornerBracketPanel from '@/components/ui/CornerBracketPanel';
import WorldMapCanvas from '@/components/landing/WorldMapCanvas';
import ScanInput from '@/components/landing/ScanInput';
import MarqueeStrip from '@/components/landing/MarqueeStrip';

// ─── Stat item with count-up animation ──────────────────────────────────────
function StatItem({ value, label }: { value: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-1 border-l border-border pl-6 first:border-l-0 first:pl-0"
    >
      <span
        className="text-accent font-display font-bold leading-none"
        style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', letterSpacing: '-0.03em' }}
      >
        {inView ? value : '—'}
      </span>
      <span
        className="text-muted uppercase tracking-widest"
        style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}
      >
        {label}
      </span>
    </motion.div>
  );
}

// ─── Feature panel ───────────────────────────────────────────────────────────
function FeaturePanel({
  number,
  title,
  description,
  tag,
  accent = false,
}: {
  number: string;
  title: string;
  description: string;
  tag?: string;
  accent?: boolean;
}) {
  return (
    <CornerBracketPanel className="flex flex-col gap-3 p-6 h-full">
      <div className="flex items-center justify-between">
        <span
          className="text-muted font-mono uppercase tracking-widest"
          style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}
        >
          [{number}]
        </span>
        {tag && (
          <span
            className={`font-mono uppercase tracking-widest px-2 py-0.5 border ${
              accent
                ? 'text-accent border-accent'
                : 'text-muted border-border'
            }`}
            style={{ fontSize: '9px', fontFamily: 'var(--font-mono)' }}
          >
            {tag}
          </span>
        )}
      </div>
      <h3
        className="font-display font-bold text-text leading-tight"
        style={{ fontSize: 'clamp(1.1rem, 2vw, 1.4rem)', letterSpacing: '-0.02em' }}
      >
        {title}
      </h3>
      <p
        className="text-muted leading-relaxed"
        style={{ fontSize: '13px', fontFamily: 'var(--font-mono)' }}
      >
        {description}
      </p>
    </CornerBracketPanel>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const featuresRef = useRef<HTMLElement>(null);

  return (
    <div className="min-h-screen flex flex-col bg-bg">

      {/* ── NAVBAR ─────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-bg/95 backdrop-blur-[2px]">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo (clean single instance) */}
          <div className="flex items-center gap-3">
            <AegisLogo size="sm" />
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6">
            {['DASHBOARD', 'SCAN HISTORY', 'REPORTS', 'ABOUT'].map((link) => (
              <a
                key={link}
                href={`/${link.toLowerCase().replace(' ', '-')}`}
                className="text-muted hover:text-text transition-colors font-mono uppercase tracking-widest text-[11px]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {link}
              </a>
            ))}
          </nav>

          {/* Tactical status pill & version sticker */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1 bg-black/60 border border-accent/40 text-accent font-mono text-[10px] uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
              RADAR ARMED // 17 VECTORS
            </span>

            <div
              className="hidden sm:block bg-panel border border-border px-2 py-1 text-muted font-mono"
              style={{
                fontSize: '9px',
                fontFamily: 'var(--font-mono)',
                transform: 'rotate(-1.5deg)',
                letterSpacing: '0.08em',
              }}
            >
              v0.1 student build
            </div>
          </div>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col justify-center pt-20 pb-16 overflow-hidden">
        {/* World map canvas background */}
        <WorldMapCanvas />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(182,255,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(182,255,0,0.03) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Registration marks */}
        <div className="absolute top-20 right-8 w-6 h-6 opacity-20 pointer-events-none">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-accent" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-accent" />
        </div>
        <div className="absolute bottom-20 left-8 w-6 h-6 opacity-20 pointer-events-none">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-accent" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-accent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Heading, Subtitle, Scan Input */}
            <div className="lg:col-span-7">
              {/* Section label */}
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-5 flex items-center gap-3"
              >
                <span
                  className="text-accent font-mono uppercase tracking-widest border border-accent/80 bg-accent/5 px-2.5 py-1 text-[10px] inline-flex items-center gap-2"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  AEGIS//AI ▸ MISSION CONTROL // PERIMETER AUDITING
                </span>
                <span className="hidden sm:inline text-muted font-mono text-[10px] tracking-wider">
                  RFC 9116 / PASSIVE
                </span>
              </motion.div>

              {/* Bold Headline (Always completely visible, with neon accent) */}
              <div className="mb-6">
                <h1
                  className="font-display font-extrabold text-text block tracking-tight leading-[0.93]"
                  style={{
                    fontSize: 'clamp(2.6rem, 5.2vw, 5.2rem)',
                    letterSpacing: '-0.04em',
                  }}
                >
                  FIND THE HOLES{' '}
                  <span className="text-accent underline decoration-accent/40 underline-offset-8">
                    BEFORE THEY DO.
                  </span>
                </h1>
              </div>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="text-muted mb-8 max-w-xl font-mono text-sm leading-relaxed"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                17 passive, non-destructive perimeter checks. Audits any target live across HTTP redirects, TLS cryptography, DNS spoofing zones, and TCP ports in seconds.
              </motion.p>

              {/* Scan input with tactical brackets */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="w-full max-w-2xl mb-6"
              >
                <ScanInput />
              </motion.div>

              {/* Feature validation pills */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="flex flex-wrap items-center gap-4 text-muted font-mono text-[11px] pt-2"
              >
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <span className="text-accent">✓</span> 100% Non-destructive
                </span>
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <span className="text-accent">✓</span> Real TCP & TLS Sockets
                </span>
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <span className="text-accent">✓</span> Sub-5s Real-Time Stream
                </span>
              </motion.div>
            </div>

            {/* Right Column: Mission Control Tactical Radar HUD */}
            <div className="lg:col-span-5 hidden lg:block">
              <CornerBracketPanel className="p-6 bg-panel/90 border border-border shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-sm">
                <div className="flex items-center justify-between border-b border-border pb-3 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                    <span className="font-mono text-[11px] font-bold text-accent uppercase tracking-widest">
                      PERIMETER TELEMETRY HUD
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-muted uppercase">SYS_ACTIVE</span>
                </div>

                {/* Tactical Radar Display */}
                <div className="relative w-full aspect-square max-w-[260px] mx-auto my-3 border border-border rounded-full flex items-center justify-center bg-black/60 overflow-hidden">
                  {/* Concentric rings */}
                  <div className="absolute inset-4 border border-zinc-800 rounded-full" />
                  <div className="absolute inset-12 border border-zinc-800/80 rounded-full" />
                  <div className="absolute inset-20 border border-zinc-800/60 rounded-full" />
                  {/* Crosshairs */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-px bg-zinc-800" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-full w-px bg-zinc-800" />
                  </div>
                  {/* Sweep beam */}
                  <div
                    className="absolute inset-0 origin-center"
                    style={{
                      background: 'conic-gradient(from 0deg, rgba(182,255,0,0.25) 0deg, rgba(182,255,0,0.05) 45deg, transparent 90deg)',
                      animation: 'radar-sweep 4s linear infinite',
                    }}
                  />
                  {/* Blip dots */}
                  <span className="absolute top-1/3 left-1/4 w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_#B6FF00] animate-pulse" />
                  <span className="absolute bottom-1/3 right-1/4 w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_6px_#B6FF00]" />
                  <span className="absolute top-1/2 right-1/3 w-1.5 h-1.5 rounded-full bg-accent/80" />

                  <div className="relative z-10 text-center pointer-events-none">
                    <div className="font-mono text-[10px] text-accent tracking-widest uppercase font-bold">17 CHECKS</div>
                    <div className="font-mono text-[8px] text-muted">ONLINE</div>
                  </div>
                </div>

                {/* Audit Vectors Specs */}
                <div className="space-y-2 mt-4 pt-3 border-t border-border font-mono text-[11px]">
                  <div className="flex justify-between text-muted">
                    <span>TLS / CRYPTOGRAPHY</span>
                    <span className="text-text">X.509 / TLS 1.3</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>SECURITY HEADERS</span>
                    <span className="text-text">CSP, HSTS, XFO</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>DNS SPOOFING RESILIENCE</span>
                    <span className="text-text">RFC 7489 DMARC / SPF</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>PERIMETER PORTS</span>
                    <span className="text-accent font-bold">17 TCP HANDSHAKES</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-dashed border-border flex items-center justify-between text-[10px] font-mono text-muted">
                  <span>STREAM PROTOCOL: <span className="text-accent">SSE</span></span>
                  <span>AVG AUDIT: <span className="text-text">~4.2s</span></span>
                </div>
              </CornerBracketPanel>
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE STRIP ─────────────────────────────────────────────── */}
      <MarqueeStrip />

      {/* ── CAPABILITIES ──────────────────────────────────────────────── */}
      <section ref={featuresRef} className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <div className="flex items-center gap-4 mb-12">
            <span
              className="text-muted font-mono uppercase tracking-widest"
              style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}
            >
              CAPABILITIES
            </span>
            <div className="flex-1 h-px bg-border" />
            <span
              className="text-muted font-mono"
              style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}
            >
              17 CHECKS / 6 MODULES
            </span>
          </div>

          {/* Asymmetric grid */}
          <div
            className="grid gap-px"
            style={{
              gridTemplateColumns: 'repeat(3, 1fr)',
              gridTemplateRows: 'auto auto',
            }}
          >
            {/* [01] RECON — spans 2 cols */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{ gridColumn: 'span 2' }}
            >
              <FeaturePanel
                number="01"
                title="RECON"
                description="Protocol detection, HTTP security headers, cookie flags, server version disclosure, robots.txt exposure. Everything a passive attacker sees in the first 10 seconds."
                tag="BEGINNER"
              />
            </motion.div>

            {/* [02] TLS & CERTS */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <FeaturePanel
                number="02"
                title="TLS & CERTS"
                description="Certificate validity, days-to-expiry, issuer, TLS 1.0/1.1 detection, weak ciphers."
                tag="INTERMEDIATE"
              />
            </motion.div>

            {/* [03] DNS */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <FeaturePanel
                number="03"
                title="DNS & EMAIL"
                description="SPF, DMARC, DKIM, DNSSEC, nameservers. Email spoofing risk scored from policy gaps."
                tag="INTERMEDIATE"
              />
            </motion.div>

            {/* [04] OPEN PORTS */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <FeaturePanel
                number="04"
                title="OPEN PORTS"
                description="TCP connect checks on 17 high-risk ports. Low concurrency, short timeouts. No banner exploitation."
                tag="ADVANCED"
                accent
              />
            </motion.div>

            {/* [05] ANALYSIS — full width */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
              style={{ gridColumn: 'span 3' }}
              className="border-t border-border"
            >
              <CornerBracketPanel className="flex flex-col md:flex-row gap-6 p-6">
                <div className="flex flex-col gap-3 md:w-1/3">
                  <span
                    className="text-muted font-mono uppercase tracking-widest"
                    style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}
                  >
                    [05] AI BRIEFING
                  </span>
                  <h3
                    className="font-display font-bold text-text"
                    style={{ fontSize: '1.4rem', letterSpacing: '-0.02em' }}
                  >
                    Not just a list of CVEs.
                  </h3>
                </div>
                <div className="md:w-2/3 flex flex-col gap-4">
                  <p className="text-muted" style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', lineHeight: '1.7' }}>
                    Every scan result goes through an LLM that writes a plain-English executive summary, ranks your top 3 fixes, and generates copy-paste remediation snippets for nginx and Apache. There&apos;s also a chat box so you can ask follow-up questions about your specific report.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {['EXECUTIVE SUMMARY', 'TOP 3 FIXES', 'REMEDIATION ROADMAP', 'ASK AEGIS CHAT'].map((feat) => (
                      <span
                        key={feat}
                        className="border border-border text-muted font-mono uppercase px-2 py-1"
                        style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}
                      >
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              </CornerBracketPanel>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ──────────────────────────────────────────────── */}
      <section className="border-y border-border py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-10 md:gap-0 md:justify-between">
            <StatItem value="17" label="SECURITY CHECKS" />
            <StatItem value="5" label="SEVERITY LEVELS" />
            <StatItem value="<30s" label="AVERAGE SCAN TIME" />
            <StatItem value="AI" label="POWERED ANALYSIS" />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-12">
            <span
              className="text-muted font-mono uppercase tracking-widest"
              style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}
            >
              PROCESS
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-px border border-border">
            {[
              { step: '01', title: 'ENTER TARGET', desc: 'Type a domain. We normalize and validate it before anything touches the wire.' },
              { step: '02', title: 'CONSENT CHECK', desc: 'Confirm you own the site or have written permission. We log timestamp, target, and IP.' },
              { step: '03', title: 'LIVE SCAN', desc: 'Watch findings appear in real-time on a radar view. Each check streams progress via SSE.' },
              { step: '04', title: 'AI REPORT', desc: 'Get a severity-graded report with AI briefing, remediation steps, and an export button.' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex flex-col gap-4 p-6 border-r border-border last:border-r-0 bg-panel"
              >
                <span
                  className="text-accent font-mono font-bold"
                  style={{ fontSize: '2rem', fontFamily: 'var(--font-mono)', opacity: 0.3 }}
                >
                  {item.step}
                </span>
                <h4
                  className="text-text font-display font-bold"
                  style={{ fontSize: '1rem', letterSpacing: '-0.01em' }}
                >
                  {item.title}
                </h4>
                <p
                  className="text-muted"
                  style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', lineHeight: '1.7' }}
                >
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-border px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Changelog-style left */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <AegisLogo size="sm" />
              <span
                className="font-mono text-muted"
                style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}
              >
                AEGIS//AI — Student Build
              </span>
            </div>
            <div
              className="text-muted font-mono"
              style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', paddingLeft: '24px' }}
            >
              CHANGELOG: v0.1.0 — Landing page + scan engine + AI briefing
            </div>
          </div>

          {/* Divider */}
          <div className="hidden md:block h-8 w-px bg-border" />

          {/* Team + scope */}
          <div
            className="text-muted font-mono"
            style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', lineHeight: '1.8' }}
          >
            <div>TEAM: Built with intent. College security project.</div>
            <div>SCOPE: Passive, non-destructive checks only. No payloads.</div>
          </div>

          {/* Right: links */}
          <div className="flex flex-col gap-1 items-start md:items-end">
            <a
              href="/about"
              className="text-muted hover:text-accent font-mono uppercase tracking-widest transition-colors"
              style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}
            >
              /about — how we built it
            </a>
            <span
              className="text-muted font-mono"
              style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', opacity: 0.4 }}
            >
              Non-destructive. Ethical. Educational.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
