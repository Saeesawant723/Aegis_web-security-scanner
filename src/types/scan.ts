export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type FindingCategory =
  | 'PROTOCOL'
  | 'HEADERS'
  | 'COOKIES'
  | 'TLS'
  | 'DNS'
  | 'FILES'
  | 'PORTS';

export interface Finding {
  id: string;
  title: string;
  category: FindingCategory;
  severity: Severity;
  description: string;
  affectedAsset: string;
  evidence?: string;
  remediation: string;
  codeSnippet?: string;
  cwe?: string;
  owasp?: string;
}

export interface PortCheckResult {
  port: number;
  service: string;
  status: 'OPEN' | 'CLOSED' | 'TIMEOUT';
  risk: Severity;
  description: string;
}

export interface ScanSummary {
  target: string;
  scanDate: string;
  durationMs: number;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  counts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    total: number;
  };
}

export interface ScanMetadata {
  protocol: string;
  ipAddress?: string;
  redirectChain: Array<{ status: number; url: string }>;
  serverBanner?: string;
  poweredBy?: string;
  tls?: {
    valid: boolean;
    authorized: boolean;
    issuer?: string;
    subject?: string;
    validTo?: string;
    daysRemaining?: number;
    protocol?: string;
    cipher?: string;
  };
  dns?: {
    hasSpf: boolean;
    spfRecord?: string;
    hasDmarc: boolean;
    dmarcRecord?: string;
    mxCount: number;
    nsCount: number;
  };
}

export interface ScanResult {
  id: string;
  target: string;
  scanUrl: string;
  timestamp: string;
  summary: ScanSummary;
  findings: Finding[];
  ports: PortCheckResult[];
  meta: ScanMetadata;
  aiBriefing?: {
    executiveSummary: string;
    topPriorities: string[];
    threatLevel: 'CRITICAL RISK' | 'ELEVATED RISK' | 'MODERATE RISK' | 'LOW RISK';
    remediationRoadmap: Array<{ step: string; urgency: string; description: string }>;
  };
}

export type ScanStreamEvent =
  | { type: 'INIT'; payload: { target: string; timestamp: string } }
  | { type: 'LOG'; payload: { timestamp: string; message: string; level?: 'info' | 'warn' | 'crit' } }
  | { type: 'MODULE_START'; payload: { module: FindingCategory; name: string } }
  | { type: 'FINDING'; payload: Finding }
  | { type: 'PORT_RESULT'; payload: PortCheckResult }
  | { type: 'MODULE_END'; payload: { module: FindingCategory; findingsCount: number } }
  | { type: 'COMPLETE'; payload: ScanResult }
  | { type: 'ERROR'; payload: { message: string } };
