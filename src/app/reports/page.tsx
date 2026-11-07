'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AegisLogo from '@/components/ui/AegisLogo';
import CornerBracketPanel from '@/components/ui/CornerBracketPanel';
import ReportView from '@/components/report/ReportView';
import { ScanResult } from '@/types/scan';

const GRADE_COLORS: Record<string, string> = {
  A: '#B6FF00',
  B: '#4DA3FF',
  C: '#FFD60A',
  D: '#FF8A00',
  F: '#FF3B30',
};

function ReportsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const scanId = searchParams.get('id');

  const [scans, setScans] = useState<ScanResult[]>([]);
  const [activeScan, setActiveScan] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    fetchScans();
  }, [scanId]);

  const fetchScans = async () => {
    setLoading(true);
    try {
      if (scanId) {
        const res = await fetch(`/api/scans?id=${scanId}`);
        if (res.ok) {
          const data = await res.json();
          setActiveScan(data);
          setLoading(false);
          return;
        }
      }

      // If no ID or ID not found, load all reports
      const res = await fetch('/api/scans');
      if (res.ok) {
        const data = await res.json();
        setScans(data);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  // If a specific report is selected, render full ReportView
  if (activeScan) {
    return (
      <div>
        <div className="fixed top-2 left-6 z-[60]">
          <button
            onClick={() => {
              setActiveScan(null);
              router.push('/reports');
            }}
            className="px-3 py-1 bg-black border border-border text-accent font-mono text-xs uppercase hover:border-accent transition-colors"
          >
            ← ALL REPORTS
          </button>
        </div>
        <ReportView
          result={activeScan}
          onRescan={() => router.push(`/scan?target=${activeScan.target}`)}
        />
      </div>
    );
  }

  const filteredScans = scans.filter((s) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return s.target.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-bg text-text pt-14 pb-20 px-4 sm:px-8">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-bg/95 backdrop-blur-[2px]">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <AegisLogo size="sm" />
          </Link>
          <nav className="hidden md:flex items-center gap-6 font-mono text-[11px] uppercase tracking-widest text-muted">
            <Link href="/dashboard" className="hover:text-text transition-colors">DASHBOARD</Link>
            <Link href="/scan-history" className="hover:text-text transition-colors">SCAN HISTORY</Link>
            <Link href="/reports" className="text-accent border-b border-accent pb-0.5">REPORTS</Link>
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
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <span className="label-caps text-accent block mb-2">[INTELLIGENCE] // GENERATED DOSSIERS</span>
            <h1 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-text">
              SECURITY ASSESSMENT REPORTS
            </h1>
            <p className="font-mono text-xs text-muted mt-1">
              Select an intelligence briefing to view full vulnerability telemetry, remediation roadmap, and exportable findings.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="filter dossiers by target..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="bg-black border border-border px-3 py-1.5 font-mono text-xs text-text outline-none focus:border-accent w-full sm:w-64"
            />
          </div>
        </div>

        {/* Dossiers Grid */}
        {loading ? (
          <div className="border border-border p-12 text-center font-mono text-xs text-muted">
            LOADING INTELLIGENCE REPORTS...
          </div>
        ) : filteredScans.length === 0 ? (
          <div className="border border-border p-12 text-center space-y-4 bg-panel">
            <div className="font-mono text-xs text-muted">No assessment dossiers available.</div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-accent text-bg font-mono text-xs font-bold uppercase tracking-wider"
            >
              LAUNCH NEW AUDIT
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredScans.map((scan) => {
              const gradeColor = GRADE_COLORS[scan.summary.grade] || '#EDEDED';
              return (
                <CornerBracketPanel
                  key={scan.id}
                  hoverable={true}
                  className="p-6 bg-panel border border-border flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="label-caps block mb-1">AUDIT REF: {scan.id}</span>
                        <h2 className="font-display font-bold text-2xl text-text hover:text-accent transition-colors">
                          {scan.target}
                        </h2>
                        <div className="font-mono text-xs text-muted mt-0.5">
                          {scan.timestamp.slice(0, 19).replace('T', ' ')} UTC
                        </div>
                      </div>

                      <div
                        className="w-12 h-12 flex items-center justify-center border font-display font-black text-2xl select-none"
                        style={{
                          borderColor: gradeColor,
                          color: gradeColor,
                          backgroundColor: `${gradeColor}10`,
                          boxShadow: `0 0 10px ${gradeColor}20`,
                        }}
                      >
                        {scan.summary.grade}
                      </div>
                    </div>

                    {/* Executive Summary */}
                    {scan.aiBriefing && (
                      <p className="font-mono text-xs text-muted leading-relaxed line-clamp-3 border-l-2 border-accent/40 pl-3">
                        {scan.aiBriefing.executiveSummary}
                      </p>
                    )}

                    {/* Stats Pill */}
                    <div className="flex flex-wrap items-center gap-2 font-mono text-xs pt-2">
                      <span className="border border-border px-2 py-0.5 text-muted">
                        SCORE: <strong className="text-text">{scan.summary.score}/100</strong>
                      </span>
                      <span className="border border-[#FF3B30] text-[#FF3B30] bg-[#FF3B3010] px-2 py-0.5 font-bold">
                        {scan.summary.counts?.critical || 0} CRIT
                      </span>
                      <span className="border border-[#FF8A00] text-[#FF8A00] bg-[#FF8A0010] px-2 py-0.5 font-bold">
                        {scan.summary.counts?.high || 0} HIGH
                      </span>
                      <span className="border border-border px-2 py-0.5 text-muted">
                        {scan.summary.counts?.total || 0} TOTAL FINDINGS
                      </span>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center justify-between pt-6 mt-6 border-t border-border font-mono text-xs">
                    <span className="text-[10px] text-muted">
                      PERIMETER: {scan.meta?.protocol || 'HTTPS'} / {scan.ports?.filter((p) => p.status === 'OPEN').length || 0} PORTS OPEN
                    </span>

                    <button
                      onClick={() => {
                        setActiveScan(scan);
                        router.push(`/reports?id=${scan.id}`);
                      }}
                      className="px-4 py-2 bg-accent text-bg font-bold uppercase tracking-wider hover:brightness-110 shadow-[2px_2px_0_rgba(0,0,0,0.8)]"
                    >
                      OPEN REPORT →
                    </button>
                  </div>
                </CornerBracketPanel>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg text-text flex items-center justify-center font-mono text-xs">
          LOADING REPORTS DOSSIER...
        </div>
      }
    >
      <ReportsContent />
    </Suspense>
  );
}
