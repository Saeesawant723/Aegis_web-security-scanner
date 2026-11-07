'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AegisLogo from '@/components/ui/AegisLogo';
import CornerBracketPanel from '@/components/ui/CornerBracketPanel';
import ReportView from '@/components/report/ReportView';
import { Finding, FindingCategory, PortCheckResult, ScanResult, ScanStreamEvent, Severity } from '@/types/scan';

interface ModuleState {
  id: FindingCategory;
  name: string;
  status: 'PENDING' | 'RUNNING' | 'DONE';
  findingsCount: number;
}

interface RadarBlip {
  id: string;
  angle: number;
  distance: number;
  severity: Severity;
}

const INITIAL_MODULES: ModuleState[] = [
  { id: 'PROTOCOL', name: 'Network Protocol & Redirection', status: 'PENDING', findingsCount: 0 },
  { id: 'HEADERS', name: 'Security Headers & Cookies', status: 'PENDING', findingsCount: 0 },
  { id: 'TLS', name: 'TLS & Certificate Handshake', status: 'PENDING', findingsCount: 0 },
  { id: 'DNS', name: 'DNS Zones (SPF / DMARC)', status: 'PENDING', findingsCount: 0 },
  { id: 'FILES', name: 'Sensitive Configuration Files', status: 'PENDING', findingsCount: 0 },
  { id: 'PORTS', name: 'Perimeter Port Verification', status: 'PENDING', findingsCount: 0 },
];

function ScanInterface() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawTarget = searchParams.get('target') || '';
  let target = rawTarget.trim().toLowerCase();
  target = target.replace(/^https?:\/\//i, '').split('/')[0].split('?')[0].split('#')[0].split(':')[0].replace(/^\.+|\.+$/g, '');
  if (target && !target.includes('.') && target !== 'localhost') {
    target = `${target}.com`;
  }

  // Consent & Scan lifecycle
  const [hasConsent, setHasConsent] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  // Live telemetry state
  const [modules, setModules] = useState<ModuleState[]>(INITIAL_MODULES);
  const [logs, setLogs] = useState<Array<{ timestamp: string; message: string; level?: string }>>([]);
  const [recentFinding, setRecentFinding] = useState<Finding | null>(null);
  const [radarBlips, setRadarBlips] = useState<RadarBlip[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const playBlipSound = (severity: Severity) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const freq = severity === 'CRITICAL' ? 880 : severity === 'HIGH' ? 660 : 440;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // AudioContext suppressed
    }
  };

  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Execute scan when consent is given
  useEffect(() => {
    if (!hasConsent || !target || scanResult) return;

    setScanning(true);
    setModules(INITIAL_MODULES);
    setLogs([]);
    setRadarBlips([]);
    setErrorMsg(null);

    const eventSource = new EventSource(`/api/scan?target=${encodeURIComponent(target)}&consent=1`);

    eventSource.onmessage = (event) => {
      try {
        const streamEvent: ScanStreamEvent = JSON.parse(event.data);

        switch (streamEvent.type) {
          case 'LOG':
            setLogs((prev) => [...prev, streamEvent.payload]);
            break;

          case 'MODULE_START':
            setModules((prev) =>
              prev.map((m) => (m.id === streamEvent.payload.module ? { ...m, status: 'RUNNING' } : m))
            );
            break;

          case 'FINDING': {
            const f = streamEvent.payload;
            setRecentFinding(f);
            playBlipSound(f.severity);
            setRadarBlips((prev) => [
              ...prev,
              {
                id: f.id,
                angle: Math.random() * 360,
                distance: 30 + Math.random() * 55,
                severity: f.severity,
              },
            ]);
            setTimeout(() => setRecentFinding((curr) => (curr?.id === f.id ? null : curr)), 2500);
            break;
          }

          case 'MODULE_END':
            setModules((prev) =>
              prev.map((m) =>
                m.id === streamEvent.payload.module
                  ? { ...m, status: 'DONE', findingsCount: streamEvent.payload.findingsCount }
                  : m
              )
            );
            break;

          case 'COMPLETE':
            setScanResult(streamEvent.payload);
            setScanning(false);
            eventSource.close();
            break;

          case 'ERROR':
            setErrorMsg(streamEvent.payload.message);
            setScanning(false);
            eventSource.close();
            break;
        }
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };

    eventSource.onerror = () => {
      setErrorMsg('Connection to scan engine lost or timed out.');
      setScanning(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [hasConsent, target, scanResult]);

  if (!target) {
    return (
      <div className="min-h-screen bg-bg text-text flex flex-col items-center justify-center p-6">
        <h1 className="font-display font-bold text-2xl mb-4">No Target Specified</h1>
        <p className="font-mono text-muted text-xs mb-6">Enter a target hostname to begin security assessment.</p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-accent text-bg font-mono text-xs font-bold uppercase tracking-wider"
        >
          Return Home
        </button>
      </div>
    );
  }

  // 1. Consent Authorization Gate
  if (!hasConsent && !scanResult) {
    return (
      <div className="min-h-screen bg-bg text-text flex flex-col items-center justify-center p-6 relative">
        <div className="w-full max-w-lg border border-border bg-panel p-8 relative">
          <span className="cb-tl" />
          <span className="cb-tr" />
          <span className="cb-bl" />
          <span className="cb-br" />

          <div className="flex items-center gap-3 mb-6">
            <AegisLogo size="sm" />
            <span className="font-mono text-xs uppercase tracking-widest text-accent font-bold">
              ENGAGEMENT AUTHORIZATION
            </span>
          </div>

          <p className="font-mono text-xs text-muted leading-relaxed mb-6">
            You are initiating a real-world passive network & web security assessment against:
            <br />
            <span className="text-text font-bold text-sm block mt-1">{target}</span>
          </p>

          <div className="border border-border p-4 bg-black/60 mb-6 space-y-2">
            <div className="font-mono text-[10px] text-muted uppercase tracking-wider">
              SCOPE & RULES OF ENGAGEMENT:
            </div>
            <ul className="font-mono text-xs text-muted space-y-1 list-disc list-inside">
              <li>Non-destructive passive audit only (GET / HEAD probes).</li>
              <li>Fixed 17-port TCP handshake check (no payload injection).</li>
              <li>TLS certificate, DNS, and header configuration evaluation.</li>
            </ul>
          </div>

          <label className="flex items-start gap-3 cursor-pointer select-none mb-6">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              className="mt-1 accent-[#B6FF00] w-4 h-4 cursor-pointer"
            />
            <span className="font-mono text-xs text-text leading-tight">
              I affirm that I own this target or possess written authorization to execute defensive assessments
              against it.
            </span>
          </label>

          <button
            disabled={!consentChecked}
            onClick={() => setHasConsent(true)}
            className={`w-full py-3.5 font-mono text-xs font-bold uppercase tracking-widest transition-all ${
              consentChecked
                ? 'bg-accent text-bg shadow-[4px_4px_0_rgba(0,0,0,0.8)] hover:brightness-110 active:translate-x-0.5 active:translate-y-0.5'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-border'
            }`}
          >
            ENGAGE SECURITY AUDIT
          </button>
        </div>
      </div>
    );
  }

  // 2. Render Final Report
  if (scanResult) {
    return (
      <ReportView
        result={scanResult}
        onRescan={() => {
          setScanResult(null);
          setHasConsent(false);
          setConsentChecked(false);
          router.push('/');
        }}
      />
    );
  }

  // 3. Live Brutalist Scan Cockpit
  const completedModules = modules.filter((m) => m.status === 'DONE').length;
  const progressPercent = Math.round((completedModules / modules.length) * 100);

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col justify-between pt-14 pb-8 px-4 sm:px-6 relative overflow-hidden">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-bg/95">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AegisLogo size="sm" />
            <span className="font-mono text-muted text-xs">
              / LIVE AUDIT // <span className="text-accent">{target}</span>
            </span>
          </div>
          <div className="flex items-center gap-4 font-mono text-xs">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="border border-border px-2 py-0.5 text-muted hover:text-text font-mono text-[10px] tracking-wider transition-colors"
              title="Toggle finding audio telemetry"
            >
              AUDIO: <span className={soundEnabled ? 'text-accent' : 'text-muted'}>{soundEnabled ? 'ON' : 'MUTED'}</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
              <span className="text-accent uppercase tracking-widest text-[10px]">RADAR ACTIVE</span>
            </div>
            <span className="text-muted text-[11px]">{progressPercent}% COMPLETE</span>
          </div>
        </div>
      </header>

      {/* Main Grid: Left Modules | Center Radar | Right Live Log */}
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 my-auto pt-6">
        {/* Left: Module Status */}
        <div className="lg:col-span-3 space-y-2">
          <div className="label-caps mb-3">[01] AUDIT MODULES</div>
          {modules.map((m) => (
            <div
              key={m.id}
              className={`p-3 border font-mono text-xs transition-colors ${
                m.status === 'RUNNING'
                  ? 'border-accent bg-accent/5'
                  : m.status === 'DONE'
                  ? 'border-border bg-panel text-text'
                  : 'border-border/50 bg-black/40 text-muted'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold">{m.id}</span>
                <span
                  className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 border ${
                    m.status === 'RUNNING'
                      ? 'border-accent text-accent animate-pulse'
                      : m.status === 'DONE'
                      ? 'border-border text-muted'
                      : 'border-border/30 text-zinc-600'
                  }`}
                >
                  {m.status}
                </span>
              </div>
              <div className="text-[11px] text-muted truncate">{m.name}</div>
              {m.status === 'DONE' && (
                <div className="text-[10px] text-accent mt-1">
                  {m.findingsCount} findings recorded
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Center: Interactive Radar View */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 relative">
          <div
            className="relative border border-accent/40 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(182,255,0,0.15)]"
            style={{ width: '320px', height: '320px', background: 'radial-gradient(circle, #0e1a05 0%, #070707 70%)' }}
          >
            {/* Range rings */}
            <div className="absolute inset-8 border border-accent/20 rounded-full" />
            <div className="absolute inset-20 border border-accent/20 rounded-full" />
            <div className="absolute inset-32 border border-accent/20 rounded-full" />

            {/* Crosshairs */}
            <div className="absolute inset-x-0 top-1/2 h-px bg-accent/30" />
            <div className="absolute inset-y-0 left-1/2 w-px bg-accent/30" />

            {/* Rotating radar sweep */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(182,255,0,0.35) 360deg)',
                animation: 'radar-sweep 2.8s linear infinite',
              }}
            />

            {/* Target Core */}
            <div className="relative z-10 text-center font-mono select-none">
              <div className="w-3 h-3 bg-accent rounded-full mx-auto mb-1 animate-ping" />
              <div className="text-xs font-bold text-text bg-black/80 px-2 py-0.5 border border-border">
                {target}
              </div>
            </div>

            {/* Dynamic Radar Blips */}
            {radarBlips.map((blip) => {
              const rad = (blip.angle * Math.PI) / 180;
              const x = 160 + blip.distance * Math.cos(rad);
              const y = 160 + blip.distance * Math.sin(rad);
              const color =
                blip.severity === 'CRITICAL'
                  ? '#FF3B30'
                  : blip.severity === 'HIGH'
                  ? '#FF8A00'
                  : blip.severity === 'MEDIUM'
                  ? '#FFD60A'
                  : '#4DA3FF';

              return (
                <div
                  key={blip.id}
                  className="absolute w-2.5 h-2.5 rounded-full -translate-x-1/2 -translate-y-1/2 animate-ping"
                  style={{
                    left: `${x}px`,
                    top: `${y}px`,
                    backgroundColor: color,
                    boxShadow: `0 0 10px ${color}`,
                  }}
                />
              );
            })}
          </div>

          {/* Finding Alert Stamp */}
          {recentFinding && (
            <div
              className="mt-6 border border-[#FF3B30] bg-[#FF3B3015] p-3 text-center font-mono max-w-sm animate-pulse"
              style={{ animation: 'stamp-in 0.25s ease-out' }}
            >
              <div className="text-[10px] text-[#FF3B30] uppercase tracking-widest font-bold">
                [!] DETECTED: {recentFinding.severity}
              </div>
              <div className="text-xs font-bold text-text truncate mt-0.5">{recentFinding.title}</div>
            </div>
          )}
        </div>

        {/* Right: Live Terminal Log */}
        <div className="lg:col-span-4 flex flex-col h-[380px] border border-border bg-panel">
          <div className="px-4 py-2 border-b border-border bg-black/60 flex items-center justify-between">
            <span className="label-caps">[02] REAL-TIME TELEMETRY STREAM</span>
            <span className="font-mono text-[9px] text-accent">SSE CONNECTED</span>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-1.5 font-mono text-[11px] select-text">
            {logs.length === 0 && (
              <div className="text-muted text-xs">Awaiting probe telemetry...</div>
            )}
            {logs.map((l, i) => (
              <div key={i} className="leading-snug">
                <span className="text-muted mr-1.5">{l.timestamp}</span>
                <span
                  className={
                    l.level === 'crit'
                      ? 'text-[#FF3B30] font-bold'
                      : l.level === 'warn'
                      ? 'text-[#FFD60A]'
                      : 'text-text'
                  }
                >
                  {l.message}
                </span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>

      {/* Stepped Progress Bar at Bottom */}
      <div className="max-w-7xl mx-auto w-full mt-6">
        <div className="flex items-center justify-between font-mono text-[10px] text-muted mb-2">
          <span>PROGRESSION SEQUENCE: 6 MODULES</span>
          <span>{completedModules}/6 STAGES COMPLETE</span>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {modules.map((m, idx) => (
            <div
              key={m.id}
              className={`h-2 border transition-all ${
                m.status === 'DONE'
                  ? 'bg-accent border-accent'
                  : m.status === 'RUNNING'
                  ? 'bg-accent/40 border-accent animate-pulse'
                  : 'bg-black/60 border-border'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black border border-[#FF3B30] text-[#FF3B30] font-mono text-xs px-6 py-3 shadow-xl">
          [!] AUDIT EXCEPTION: {errorMsg}
        </div>
      )}
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg text-text flex items-center justify-center font-mono text-xs">
          INITIALIZING AEGIS SCANNER...
        </div>
      }
    >
      <ScanInterface />
    </Suspense>
  );
}
