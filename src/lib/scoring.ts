import { Finding, FindingCategory, ScanSummary, Severity } from '@/types/scan';

const DEDUCTIONS: Record<Severity, number> = {
  CRITICAL: 18,
  HIGH: 8,
  MEDIUM: 3,
  LOW: 1,
  INFO: 0,
};

// Maximum deduction allowed per category to prevent over-penalization
const MAX_CATEGORY_DEDUCTION: Record<FindingCategory, number> = {
  PROTOCOL: 18,
  HEADERS: 12,
  COOKIES: 8,
  TLS: 18,
  DNS: 12,
  FILES: 18,
  PORTS: 12,
};

export function calculateScoreAndGrade(findings: Finding[]): {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  counts: ScanSummary['counts'];
} {
  const counts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
    total: findings.length,
  };

  const categoryDeductions: Record<FindingCategory, number> = {
    PROTOCOL: 0,
    HEADERS: 0,
    COOKIES: 0,
    TLS: 0,
    DNS: 0,
    FILES: 0,
    PORTS: 0,
  };

  for (const f of findings) {
    switch (f.severity) {
      case 'CRITICAL':
        counts.critical++;
        break;
      case 'HIGH':
        counts.high++;
        break;
      case 'MEDIUM':
        counts.medium++;
        break;
      case 'LOW':
        counts.low++;
        break;
      case 'INFO':
        counts.info++;
        break;
    }

    const deduction = DEDUCTIONS[f.severity] || 0;
    categoryDeductions[f.category] = (categoryDeductions[f.category] || 0) + deduction;
  }

  // Apply category caps
  let totalDeduction = 0;
  for (const cat of Object.keys(categoryDeductions) as FindingCategory[]) {
    const raw = categoryDeductions[cat] || 0;
    const cap = MAX_CATEGORY_DEDUCTION[cat] ?? 15;
    totalDeduction += Math.min(raw, cap);
  }

  const score = Math.max(0, 100 - totalDeduction);

  let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
  if (score >= 85) grade = 'A';
  else if (score >= 70) grade = 'B';
  else if (score >= 55) grade = 'C';
  else if (score >= 40) grade = 'D';

  return { score, grade, counts };
}

export function generateAnalystBriefing(
  target: string,
  score: number,
  grade: string,
  findings: Finding[]
) {
  const criticals = findings.filter((f) => f.severity === 'CRITICAL');
  const highs = findings.filter((f) => f.severity === 'HIGH');
  const mediums = findings.filter((f) => f.severity === 'MEDIUM');

  let threatLevel: 'CRITICAL RISK' | 'ELEVATED RISK' | 'MODERATE RISK' | 'LOW RISK' = 'LOW RISK';
  if (criticals.length > 0 || score < 50) {
    threatLevel = 'CRITICAL RISK';
  } else if (highs.length > 0 || score < 75) {
    threatLevel = 'ELEVATED RISK';
  } else if (mediums.length > 0 || score < 85) {
    threatLevel = 'MODERATE RISK';
  }

  const topPriorities: string[] = [];
  const topIssues = [...criticals, ...highs, ...mediums].slice(0, 3);
  for (const issue of topIssues) {
    topPriorities.push(`${issue.title}: ${issue.remediation}`);
  }

  if (topPriorities.length === 0) {
    topPriorities.push('Maintain strict cipher suites and keep defensive headers actively configured.');
    topPriorities.push('Audit external assets and monitor DNS records periodically.');
  }

  const roadmap = [
    {
      step: '01. Immediate Containment',
      urgency: criticals.length > 0 ? 'CRITICAL - 24 HOURS' : 'ROUTINE',
      description:
        criticals.length > 0
          ? `Patch exposed critical endpoints (${criticals.map((c) => c.title).join(', ')}). Restrict ingress access immediately.`
          : 'Enforce standard HTTPS redirects and verify no secret files are hosted in public web roots.',
    },
    {
      step: '02. Defense-in-Depth Hardening',
      urgency: highs.length > 0 ? 'HIGH - 72 HOURS' : 'SCHEDULED',
      description:
        'Deploy strict Content-Security-Policy (CSP) headers, HSTS with preload, and set X-Frame-Options: SAMEORIGIN on sensitive endpoints.',
    },
    {
      step: '03. Perimeter Verification',
      urgency: 'MONITORING',
      description:
        'Verify DNS spoofing resilience (enforce strict DMARC p=reject with valid SPF/DKIM) and close any non-essential open service ports.',
    },
  ];

  const executiveSummary =
    findings.length === 0
      ? `Perimeter security review for ${target} discovered zero high-risk exposure points. The host maintains solid transport protection and appropriate HTTP defenses.`
      : `Security audit completed for ${target}. The host achieved an authentic Security Rating of ${grade} (${score}/100) with ${findings.length} observations noted. Perimeter posture indicates ${threatLevel.toLowerCase()}.`;

  return {
    executiveSummary,
    topPriorities,
    threatLevel,
    remediationRoadmap: roadmap,
  };
}
