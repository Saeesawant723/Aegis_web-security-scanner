'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AegisLogo from '@/components/ui/AegisLogo';
import CornerBracketPanel from '@/components/ui/CornerBracketPanel';
import { ScanResult, Severity } from '@/types/scan';

const GRADE_COLORS: Record<string, string> = {
  A: '#B6FF00',
  B: '#4DA3FF',
  C: '#FFD60A',
  D: '#FF8A00',
  F: '#FF3B30',
};

export default function ScanHistoryPage() {
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const router = useRouter();

  useEffect(() => {
    fetchScans();
  }, []);

  const fetchScans = async () => {
    try {
      const res = await fetch('/api/scans');
      if (res.ok) {
        const data = await res.json();
        setScans(data);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove this scan record?')) return;
    try {
      const res = await fetch(`/api/scans?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setScans((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const filteredScans = scans.filter((s) => {
    if (gradeFilter !== 'ALL' && s.summary.grade !== gradeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return s.target.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
    }
    return true;
  });

  const totalScans = scans.length;
  const avgScore =
    totalScans > 0
      ? Math.round(scans.reduce((acc, s) => acc + (s.summary.score || 0), 0) / totalScans)
      : 0;
  const totalCriticals = scans.reduce((acc, s) => acc + (s.summary.counts?.critical || 0), 0);
  const totalHighs = scans.reduce((acc, s) => acc + (s.summary.counts?.high || 0), 0);

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
            <Link href="/scan-history" className="text-accent border-b border-accent pb-0.5">SCAN HISTORY</Link>
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
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <span className="label-caps text-accent block mb-2">[DATABASE] // AUDIT HISTORY</span>
            <h1 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-text">
              SECURITY AUDIT ARCHIVE
            </h1>
            <p className="font-mono text-xs text-muted mt-1">
              Historical ledger of passive vulnerability assessments, posture trends, and risk scores.
            </p>
          </div>

          <div className="font-mono text-xs text-muted border border-border p-2 bg-panel">
            LOGGED ASSESSMENTS: <span className="text-accent font-bold">{totalScans}</span> RECORDS
          </div>
        </div>

        {/* Global Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px border border-border bg-panel">
          <div className="p-5 border-r border-border">
            <div className="label-caps mb-1">TOTAL AUDITS</div>
            <div className="font-display font-bold text-3xl text-text">{totalScans}</div>
          </div>
          <div className="p-5 border-r border-border">
            <div className="label-caps mb-1">AVERAGE SCORE</div>
            <div className="font-display font-bold text-3xl text-accent">{avgScore}<span className="text-muted text-sm font-normal">/100</span></div>
          </div>
          <div className="p-5 border-r border-border">
            <div className="label-caps mb-1">CRITICAL FINDINGS</div>
            <div className="font-display font-bold text-3xl text-[#FF3B30]">{totalCriticals}</div>
          </div>
          <div className="p-5">
            <div className="label-caps mb-1">HIGH FINDINGS</div>
            <div className="font-display font-bold text-3xl text-[#FF8A00]">{totalHighs}</div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-border p-4 bg-panel">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-muted mr-2">GRADE FILTER:</span>
            {['ALL', 'A', 'B', 'C', 'D', 'F'].map((g) => (
              <button
                key={g}
                onClick={() => setGradeFilter(g)}
                className={`px-3 py-1 font-mono text-xs uppercase tracking-wider border transition-colors ${
                  gradeFilter === g
                    ? 'border-accent text-accent bg-accent/10 font-bold'
                    : 'border-border text-muted hover:text-text'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="search target or scan ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-black border border-border px-3 py-1.5 font-mono text-xs text-text outline-none focus:border-accent w-full sm:w-64"
            />
          </div>
        </div>

        {/* Scan Records Table */}
        {loading ? (
          <div className="border border-border p-12 text-center font-mono text-xs text-muted">
            RETRIEVING AUDIT ARCHIVE...
          </div>
        ) : filteredScans.length === 0 ? (
          <div className="border border-border p-12 text-center space-y-4 bg-panel">
            <div className="font-mono text-xs text-muted">No scan records matching the query.</div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-accent text-bg font-mono text-xs font-bold uppercase tracking-wider"
            >
              LAUNCH NEW AUDIT
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredScans.map((scan) => {
              const gradeColor = GRADE_COLORS[scan.summary.grade] || '#EDEDED';
              return (
                <CornerBracketPanel
                  key={scan.id}
                  hoverable={true}
                  className="p-5 bg-panel border border-border transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Grade + Target Details */}
                    <div className="flex items-start sm:items-center gap-5">
                      <div
                        className="w-14 h-14 flex-shrink-0 flex items-center justify-center border font-display font-black text-2xl select-none"
                        style={{
                          borderColor: gradeColor,
                          color: gradeColor,
                          backgroundColor: `${gradeColor}10`,
                          boxShadow: `0 0 12px ${gradeColor}20`,
                        }}
                      >
                        {scan.summary.grade}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-display font-bold text-lg text-text">
                            {scan.target}
                          </span>
                          <span className="font-mono text-[10px] text-muted border border-border px-1.5 py-0.5">
                            {scan.id}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted">
                          <span>SCORE: <strong className="text-text">{scan.summary.score}/100</strong></span>
                          <span>TIME: {scan.timestamp.slice(0, 16).replace('T', ' ')} UTC</span>
                          <span>DURATION: {(scan.summary.durationMs / 1000).toFixed(1)}s</span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Severity Counters */}
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="border border-[#FF3B30] text-[#FF3B30] bg-[#FF3B3010] px-2 py-0.5 text-[11px] font-bold">
                        {scan.summary.counts?.critical || 0} CRIT
                      </span>
                      <span className="border border-[#FF8A00] text-[#FF8A00] bg-[#FF8A0010] px-2 py-0.5 text-[11px] font-bold">
                        {scan.summary.counts?.high || 0} HIGH
                      </span>
                      <span className="border border-[#FFD60A] text-[#FFD60A] bg-[#FFD60A10] px-2 py-0.5 text-[11px]">
                        {scan.summary.counts?.medium || 0} MED
                      </span>
                      <span className="border border-[#4DA3FF] text-[#4DA3FF] bg-[#4DA3FF10] px-2 py-0.5 text-[11px]">
                        {scan.summary.counts?.low || 0} LOW
                      </span>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 font-mono text-xs flex-shrink-0">
                      <Link
                        href={`/reports?id=${scan.id}`}
                        className="px-3.5 py-2 bg-accent text-bg font-bold uppercase tracking-wider hover:brightness-110 shadow-[2px_2px_0_rgba(0,0,0,0.8)]"
                      >
                        VIEW REPORT →
                      </Link>
                      <button
                        onClick={() => router.push(`/scan?target=${scan.target}`)}
                        className="px-3 py-2 border border-border text-muted hover:text-text hover:border-text uppercase"
                      >
                        RE-SCAN
                      </button>
                      <button
                        onClick={(e) => handleDelete(scan.id, e)}
                        className="px-2 py-2 border border-border text-muted hover:text-[#FF3B30] hover:border-[#FF3B30]"
                        title="Delete scan"
                      >
                        ✕
                      </button>
                    </div>
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
