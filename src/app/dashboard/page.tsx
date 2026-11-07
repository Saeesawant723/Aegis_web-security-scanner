'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AegisLogo from '@/components/ui/AegisLogo';
import CornerBracketPanel from '@/components/ui/CornerBracketPanel';
import { ScanResult } from '@/types/scan';

const GRADE_COLORS: Record<string, string> = {
  A: '#B6FF00',
  B: '#4DA3FF',
  C: '#FFD60A',
  D: '#FF8A00',
  F: '#FF3B30',
};

export default function DashboardPage() {
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickTarget, setQuickTarget] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/scans')
      .then((r) => r.json())
      .then((d) => setScans(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleQuickScan = (e: React.FormEvent) => {
    e.preventDefault();
    let target = quickTarget.trim().toLowerCase();
    if (!target) return;
    target = target.replace(/^https?:\/\//i, '').split('/')[0].split('?')[0].split('#')[0].split(':')[0].replace(/^\.+|\.+$/g, '');
    if (target && !target.includes('.') && target !== 'localhost') {
      target = `${target}.com`;
    }
    router.push(`/scan?target=${encodeURIComponent(target)}`);
  };

  const totalAudits = scans.length;
  const avgScore =
    totalAudits > 0
      ? Math.round(scans.reduce((a, s) => a + (s.summary.score || 0), 0) / totalAudits)
      : 100;
  const criticalCount = scans.reduce((a, s) => a + (s.summary.counts?.critical || 0), 0);
  const highCount = scans.reduce((a, s) => a + (s.summary.counts?.high || 0), 0);
  const secureTargets = scans.filter((s) => ['A', 'B'].includes(s.summary.grade)).length;

  return (
    <div className="min-h-screen bg-bg text-text pt-14 pb-20 px-4 sm:px-8">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-bg/95 backdrop-blur-[2px]">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <AegisLogo size="sm" />
          </Link>
          <nav className="hidden md:flex items-center gap-6 font-mono text-[11px] uppercase tracking-widest text-muted">
            <Link href="/dashboard" className="text-accent border-b border-accent pb-0.5">DASHBOARD</Link>
            <Link href="/scan-history" className="hover:text-text transition-colors">SCAN HISTORY</Link>
            <Link href="/reports" className="hover:text-text transition-colors">REPORTS</Link>
            <Link href="/about" className="hover:text-text transition-colors">ABOUT</Link>
          </nav>
          <button
            onClick={() => router.push('/')}
            className="px-3.5 py-1.5 bg-accent text-bg font-mono text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0_rgba(0,0,0,0.8)] hover:brightness-110"
          >
            + NEW SCAN
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-8 mt-6">
        {/* Title & Quick Scan row */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-border pb-6">
          <div>
            <span className="label-caps text-accent block mb-2">[OPS] // MISSION CONTROL DASHBOARD</span>
            <h1 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-text">
              ORGANIZATIONAL SECURITY POSTURE
            </h1>
            <p className="font-mono text-xs text-muted mt-1">
              Aggregated defensive telemetry across audited perimeters, services, and web assets.
            </p>
          </div>

          {/* Quick Scan Widget */}
          <form onSubmit={handleQuickScan} className="flex items-center border border-border bg-panel">
            <span className="px-3 text-accent font-mono text-xs select-none">&gt;_ https://</span>
            <input
              type="text"
              placeholder="target domain..."
              value={quickTarget}
              onChange={(e) => setQuickTarget(e.target.value)}
              className="bg-transparent border-none outline-none font-mono text-xs text-text py-2.5 w-44 sm:w-56"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-accent text-bg font-mono text-xs font-bold uppercase hover:brightness-110"
            >
              SCAN
            </button>
          </form>
        </div>

        {/* Big Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px border border-border bg-panel">
          <div className="p-6 border-r border-border">
            <div className="label-caps mb-2">FLEET POSTURE SCORE</div>
            <div className="flex items-baseline gap-2">
              <span className="font-display font-black text-5xl text-accent">{avgScore}</span>
              <span className="font-mono text-xs text-muted">/100</span>
            </div>
            <div className="font-mono text-[10px] text-muted mt-2">
              {secureTargets} of {totalAudits} targets meet grade B+
            </div>
          </div>

          <div className="p-6 border-r border-border">
            <div className="label-caps mb-2">CRITICAL EXPOSURES</div>
            <div className="font-display font-black text-5xl text-[#FF3B30]">{criticalCount}</div>
            <div className="font-mono text-[10px] text-[#FF3B30] mt-2">
              Requires immediate patching
            </div>
          </div>

          <div className="p-6 border-r border-border">
            <div className="label-caps mb-2">HIGH SEVERITY RISKS</div>
            <div className="font-display font-black text-5xl text-[#FF8A00]">{highCount}</div>
            <div className="font-mono text-[10px] text-muted mt-2">
              72h remediation SLA
            </div>
          </div>

          <div className="p-6">
            <div className="label-caps mb-2">TARGETS MONITORED</div>
            <div className="font-display font-black text-5xl text-text">{totalAudits}</div>
            <div className="font-mono text-[10px] text-muted mt-2">
              Passive non-destructive logs
            </div>
          </div>
        </div>

        {/* Two Column Layout: Recent Scans + Common Issues */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Recent Scans (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="label-caps">[01] RECENT SECURITY AUDITS</span>
              <Link href="/scan-history" className="font-mono text-xs text-accent hover:underline">
                VIEW ALL ({totalAudits}) →
              </Link>
            </div>

            {loading ? (
              <div className="border border-border p-8 text-center font-mono text-xs text-muted">
                FETCHING TELEMETRY...
              </div>
            ) : scans.length === 0 ? (
              <div className="border border-border p-8 text-center font-mono text-xs text-muted">
                No scans recorded yet. Enter a target above to start.
              </div>
            ) : (
              <div className="space-y-2">
                {scans.slice(0, 5).map((scan) => {
                  const gradeColor = GRADE_COLORS[scan.summary.grade] || '#EDEDED';
                  return (
                    <div
                      key={scan.id}
                      onClick={() => router.push(`/reports?id=${scan.id}`)}
                      className="p-4 border border-border bg-panel flex items-center justify-between hover:border-accent cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-10 h-10 border flex items-center justify-center font-display font-black text-lg"
                          style={{
                            borderColor: gradeColor,
                            color: gradeColor,
                            backgroundColor: `${gradeColor}10`,
                          }}
                        >
                          {scan.summary.grade}
                        </div>
                        <div>
                          <div className="font-display font-bold text-sm text-text">
                            {scan.target}
                          </div>
                          <div className="font-mono text-[10px] text-muted">
                            {scan.timestamp.slice(0, 16).replace('T', ' ')} UTC • SCORE: {scan.summary.score}/100
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="text-[#FF3B30] font-bold">
                          {scan.summary.counts?.critical || 0}C
                        </span>
                        <span className="text-[#FF8A00] font-bold">
                          {scan.summary.counts?.high || 0}H
                        </span>
                        <span className="text-muted">
                          {scan.summary.counts?.total || 0} total
                        </span>
                        <span className="text-accent ml-2">→</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Vulnerability Vector Analysis (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="label-caps">[02] COMMON DEFICIENCY VECTORS</span>
              <span className="font-mono text-xs text-muted">ORGANIZATIONAL IMPACT</span>
            </div>

            <div className="border border-border bg-panel p-5 space-y-4">
              {[
                { vector: 'Missing Strict-Transport-Security (HSTS)', risk: 'HIGH', prevalence: '85%' },
                { vector: 'Missing Content-Security-Policy (CSP)', risk: 'HIGH', prevalence: '78%' },
                { vector: 'DMARC Policy in Monitoring Mode (p=none)', risk: 'MEDIUM', prevalence: '62%' },
                { vector: 'Server Version / Powered-By Banner Disclosure', risk: 'MEDIUM', prevalence: '54%' },
                { vector: 'Cookies Missing Secure / HttpOnly Flags', risk: 'HIGH', prevalence: '41%' },
                { vector: 'Exposed Management Ports (SSH/MySQL/RDP)', risk: 'CRITICAL', prevalence: '18%' },
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-text font-bold">{item.vector}</span>
                    <span
                      className={`text-[10px] font-bold ${
                        item.risk === 'CRITICAL'
                          ? 'text-[#FF3B30]'
                          : item.risk === 'HIGH'
                          ? 'text-[#FF8A00]'
                          : 'text-[#FFD60A]'
                      }`}
                    >
                      {item.risk}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-black/60 border border-border overflow-hidden">
                    <div
                      className={`h-full ${
                        item.risk === 'CRITICAL'
                          ? 'bg-[#FF3B30]'
                          : item.risk === 'HIGH'
                          ? 'bg-[#FF8A00]'
                          : 'bg-[#FFD60A]'
                      }`}
                      style={{ width: item.prevalence }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
