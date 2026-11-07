'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Finding, PortCheckResult, ScanResult, Severity } from '@/types/scan';
import CornerBracketPanel from '@/components/ui/CornerBracketPanel';
import AegisLogo from '@/components/ui/AegisLogo';

interface ReportViewProps {
  result: ScanResult;
  onRescan: () => void;
}

const SEVERITY_COLORS: Record<Severity, { bg: string; text: string; border: string }> = {
  CRITICAL: { bg: '#FF3B3015', text: '#FF3B30', border: '#FF3B30' },
  HIGH: { bg: '#FF8A0015', text: '#FF8A00', border: '#FF8A00' },
  MEDIUM: { bg: '#FFD60A15', text: '#FFD60A', border: '#FFD60A' },
  LOW: { bg: '#4DA3FF15', text: '#4DA3FF', border: '#4DA3FF' },
  INFO: { bg: '#77777715', text: '#888888', border: '#444444' },
};

export default function ReportView({ result, onRescan }: ReportViewProps) {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedFindings, setExpandedFindings] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleFinding = (id: string) => {
    setExpandedFindings((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `aegis-report-${result.target}-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredFindings = result.findings.filter((f) => {
    if (selectedSeverity !== 'ALL' && f.severity !== selectedSeverity) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        f.title.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        f.affectedAsset.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const gradeColor =
    result.summary.grade === 'A'
      ? '#B6FF00'
      : result.summary.grade === 'B'
      ? '#4DA3FF'
      : result.summary.grade === 'C'
      ? '#FFD60A'
      : '#FF3B30';

  return (
    <div className="w-full min-h-screen bg-bg text-text pt-16 pb-24 px-4 sm:px-8">
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-bg/95 backdrop-blur-[2px]">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AegisLogo size="sm" />
            <span className="font-mono text-muted text-xs">
              / ASSESSMENT // <span className="text-accent">{result.target}</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 border border-border text-muted hover:text-text hover:border-text font-mono text-xs uppercase tracking-wider transition-colors"
            >
              EXPORT JSON
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 border border-border text-muted hover:text-text hover:border-text font-mono text-xs uppercase tracking-wider transition-colors"
            >
              PRINT / PDF
            </button>
            <button
              onClick={onRescan}
              className="px-4 py-1.5 bg-accent text-bg font-mono text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all shadow-[2px_2px_0_rgba(0,0,0,0.8)]"
            >
              NEW SCAN
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-8 mt-4">
        {/* Hero Grade & Metrics Banner */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-px border border-border bg-panel">
          {/* Grade Pillar */}
          <div className="lg:col-span-4 p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-border relative overflow-hidden">
            <div className="label-caps mb-4 flex items-center justify-between">
              <span>[01] POSTURE GRADE</span>
              <span className="text-muted">{result.id}</span>
            </div>

            <div className="flex items-baseline gap-6 my-4">
              <span
                className="font-display font-extrabold text-8xl leading-none tracking-tighter"
                style={{
                  color: gradeColor,
                  textShadow: `0 0 24px ${gradeColor}40`,
                }}
              >
                {result.summary.grade}
              </span>
              <div className="flex flex-col">
                <span className="font-display text-4xl font-bold leading-tight">
                  {result.summary.score}
                  <span className="text-muted text-lg">/100</span>
                </span>
                <span className="font-mono text-xs text-muted uppercase tracking-widest">
                  Risk Metric Score
                </span>
              </div>
            </div>

            <div className="space-y-1 font-mono text-xs text-muted pt-4 border-t border-border">
              <div>HOST: <span className="text-text">{result.target}</span></div>
              <div>IP: <span className="text-text">{result.meta.ipAddress || 'Resolving...'}</span></div>
              <div>TIME: <span className="text-text">{(result.summary.durationMs / 1000).toFixed(1)}s</span></div>
              <div>TIMESTAMP: <span className="text-text">{result.timestamp.slice(0, 19).replace('T', ' ')} UTC</span></div>
            </div>
          </div>

          {/* Severity Breakdown Stats */}
          <div className="lg:col-span-8 p-8 flex flex-col justify-between">
            <div className="label-caps mb-6 flex items-center justify-between">
              <span>[02] SEVERITY DISTRIBUTION & FINDINGS</span>
              <span className="text-text font-bold">{result.summary.counts.total} TOTAL FINDINGS</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: 'CRITICAL', count: result.summary.counts.critical, sev: 'CRITICAL' as Severity },
                { label: 'HIGH', count: result.summary.counts.high, sev: 'HIGH' as Severity },
                { label: 'MEDIUM', count: result.summary.counts.medium, sev: 'MEDIUM' as Severity },
                { label: 'LOW', count: result.summary.counts.low, sev: 'LOW' as Severity },
                { label: 'INFO', count: result.summary.counts.info, sev: 'INFO' as Severity },
              ].map((item) => {
                const conf = SEVERITY_COLORS[item.sev];
                return (
                  <div
                    key={item.label}
                    onClick={() => setSelectedSeverity(selectedSeverity === item.label ? 'ALL' : item.label)}
                    className={`p-4 border cursor-pointer transition-all ${
                      selectedSeverity === item.label
                        ? 'border-text bg-zinc-900'
                        : 'border-border bg-black/40 hover:border-muted'
                    }`}
                  >
                    <div className="font-mono text-[10px] tracking-widest uppercase text-muted mb-2">
                      {item.label}
                    </div>
                    <div
                      className="font-display text-3xl font-bold"
                      style={{ color: conf.text }}
                    >
                      {item.count}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stepped meter */}
            <div className="mt-8 pt-6 border-t border-border">
              <div className="flex h-2 w-full gap-1 overflow-hidden bg-black/80">
                <div
                  style={{ width: `${(result.summary.counts.critical / (result.summary.counts.total || 1)) * 100}%` }}
                  className="bg-[#FF3B30]"
                />
                <div
                  style={{ width: `${(result.summary.counts.high / (result.summary.counts.total || 1)) * 100}%` }}
                  className="bg-[#FF8A00]"
                />
                <div
                  style={{ width: `${(result.summary.counts.medium / (result.summary.counts.total || 1)) * 100}%` }}
                  className="bg-[#FFD60A]"
                />
                <div
                  style={{ width: `${(result.summary.counts.low / (result.summary.counts.total || 1)) * 100}%` }}
                  className="bg-[#4DA3FF]"
                />
                <div
                  style={{ width: `${(result.summary.counts.info / (result.summary.counts.total || 1)) * 100}%` }}
                  className="bg-[#777777]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* AI Briefing Intelligence Panel */}
        {result.aiBriefing && (
          <section className="border border-border bg-panel p-6 sm:p-8 relative">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 bg-accent animate-pulse" />
                <span className="font-mono text-xs uppercase tracking-widest text-accent font-bold">
                  AEGIS // ANALYST BRIEFING
                </span>
                <span className="border border-border px-2 py-0.5 font-mono text-[10px] text-muted">
                  CLASSIFIED
                </span>
              </div>
              <span
                className="font-mono text-xs font-bold tracking-widest px-3 py-1 border"
                style={{
                  color:
                    result.aiBriefing.threatLevel === 'CRITICAL RISK'
                      ? '#FF3B30'
                      : result.aiBriefing.threatLevel === 'ELEVATED RISK'
                      ? '#FF8A00'
                      : '#B6FF00',
                  borderColor:
                    result.aiBriefing.threatLevel === 'CRITICAL RISK'
                      ? '#FF3B30'
                      : result.aiBriefing.threatLevel === 'ELEVATED RISK'
                      ? '#FF8A00'
                      : '#B6FF00',
                }}
              >
                {result.aiBriefing.threatLevel}
              </span>
            </div>

            <p className="font-mono text-sm leading-relaxed text-text mb-6">
              {result.aiBriefing.executiveSummary}
            </p>

            {/* Top Priorities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
              <div className="border border-border p-4 bg-black/40">
                <div className="label-caps mb-3 text-accent">TOP PRIORITY DIRECTIVES</div>
                <ul className="space-y-2">
                  {result.aiBriefing.topPriorities.map((p, i) => (
                    <li key={i} className="font-mono text-xs text-muted flex items-start gap-2">
                      <span className="text-accent font-bold">[{i + 1}]</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border border-border p-4 bg-black/40">
                <div className="label-caps mb-3 text-accent">REMEDIATION ROADMAP</div>
                <div className="space-y-3">
                  {result.aiBriefing.remediationRoadmap.map((r, i) => (
                    <div key={i} className="font-mono text-xs">
                      <div className="flex justify-between text-text font-bold">
                        <span>{r.step}</span>
                        <span className="text-[10px] text-muted">{r.urgency}</span>
                      </div>
                      <p className="text-muted text-[11px] mt-0.5">{r.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Open Ports Audit Panel */}
        <section className="border border-border bg-panel p-6">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
            <span className="label-caps">[03] TCP PERIMETER PORT SCAN (17 PORTS)</span>
            <span className="font-mono text-xs text-muted">
              {result.ports.filter((p) => p.status === 'OPEN').length} OPEN / {result.ports.length} TESTED
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {result.ports.map((p) => {
              const isOpen = p.status === 'OPEN';
              const isCrit = ['CRITICAL', 'HIGH'].includes(p.risk);
              return (
                <div
                  key={p.port}
                  className={`p-3 border font-mono text-xs transition-colors ${
                    isOpen
                      ? isCrit
                        ? 'border-[#FF3B30] bg-[#FF3B3010]'
                        : 'border-accent bg-accent/10'
                      : 'border-border bg-black/20 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-text">:{p.port}</span>
                    <span
                      className={`text-[9px] px-1 font-bold ${
                        isOpen ? (isCrit ? 'text-[#FF3B30]' : 'text-accent') : 'text-muted'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted">{p.service}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Detailed Findings & Filter Controls */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="label-caps">[04] VULNERABILITY FINDINGS</span>
              <span className="text-muted font-mono text-xs">({filteredFindings.length})</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filter pills */}
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSeverity(s)}
                  className={`px-2.5 py-1 font-mono text-[10px] tracking-wider uppercase border transition-colors ${
                    selectedSeverity === s
                      ? 'border-accent text-accent bg-accent/10'
                      : 'border-border text-muted hover:text-text'
                  }`}
                >
                  {s}
                </button>
              ))}

              {/* Text filter */}
              <input
                type="text"
                placeholder="filter findings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-black border border-border px-3 py-1 text-xs font-mono text-text outline-none focus:border-accent w-40"
              />
            </div>
          </div>

          {/* Finding Cards */}
          {filteredFindings.length === 0 ? (
            <div className="border border-border p-12 text-center text-muted font-mono text-xs">
              No findings matched the selected criteria.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFindings.map((finding) => {
                const isExpanded = !!expandedFindings[finding.id];
                const conf = SEVERITY_COLORS[finding.severity];

                return (
                  <CornerBracketPanel
                    key={finding.id}
                    hoverable={false}
                    className="p-5 bg-panel border border-border"
                  >
                    <div
                      className="cursor-pointer select-none"
                      onClick={() => toggleFinding(finding.id)}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-3">
                          <span
                            className="font-mono text-[10px] font-bold px-2 py-0.5 border"
                            style={{
                              color: conf.text,
                              borderColor: conf.border,
                              backgroundColor: conf.bg,
                            }}
                          >
                            {finding.severity}
                          </span>
                          <span className="font-mono text-[10px] text-muted tracking-widest uppercase">
                            [{finding.category}]
                          </span>
                          <span className="font-mono text-[10px] text-muted">
                            {finding.affectedAsset}
                          </span>
                        </div>
                        <span className="font-mono text-xs text-muted hover:text-accent">
                          {isExpanded ? '[-] COLLAPSE' : '[+] DETAILS'}
                        </span>
                      </div>

                      <h3 className="font-display font-bold text-lg text-text hover:text-accent transition-colors">
                        {finding.title}
                      </h3>
                      <p className="font-mono text-xs text-muted mt-1 leading-relaxed line-clamp-2">
                        {finding.description}
                      </p>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-6 pt-4 border-t border-border space-y-4"
                      >
                        {finding.evidence && (
                          <div>
                            <div className="label-caps mb-1.5">TELEMETRY EVIDENCE</div>
                            <pre className="p-3 bg-black border border-border font-mono text-xs text-text overflow-x-auto whitespace-pre-wrap">
                              {finding.evidence}
                            </pre>
                          </div>
                        )}

                        <div>
                          <div className="label-caps mb-1.5 text-accent">REMEDIATION STRATEGY</div>
                          <p className="font-mono text-xs text-text leading-relaxed">
                            {finding.remediation}
                          </p>
                        </div>

                        {finding.codeSnippet && (
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="label-caps">CONFIG FIX SNIPPET</span>
                              <button
                                onClick={() => handleCopyCode(finding.id, finding.codeSnippet!)}
                                className="font-mono text-[10px] text-accent hover:underline"
                              >
                                {copiedId === finding.id ? 'COPIED!' : 'COPY CODE'}
                              </button>
                            </div>
                            <pre className="p-3 bg-black border border-border font-mono text-xs text-accent overflow-x-auto">
                              <code>{finding.codeSnippet}</code>
                            </pre>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-4 pt-2 font-mono text-[11px] text-muted">
                          {finding.cwe && <span>{finding.cwe}</span>}
                          {finding.owasp && <span>{finding.owasp}</span>}
                        </div>
                      </motion.div>
                    )}
                  </CornerBracketPanel>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
