import fs from 'fs';
import path from 'path';
import { ScanResult } from '@/types/scan';

const DATA_DIR = path.join(process.cwd(), 'data');
const SCANS_FILE = path.join(DATA_DIR, 'scans.json');

const INITIAL_DEMO_SCANS: ScanResult[] = [
  {
    id: 'SCAN-DEMO-01',
    target: 'scanme.nmap.org',
    scanUrl: 'https://scanme.nmap.org',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    summary: {
      target: 'scanme.nmap.org',
      scanDate: new Date(Date.now() - 3600000 * 4).toISOString(),
      durationMs: 7200,
      score: 72,
      grade: 'C',
      counts: { critical: 0, high: 2, medium: 1, low: 2, info: 1, total: 6 },
    },
    findings: [
      {
        id: 'DEMO-1',
        title: 'Missing Strict-Transport-Security (HSTS) Header',
        category: 'HEADERS',
        severity: 'HIGH',
        description: 'No HSTS header declared on port 443 response. Transport susceptible to SSL stripping attacks.',
        affectedAsset: 'scanme.nmap.org',
        remediation: 'Configure HSTS with max-age=31536000 and includeSubDomains.',
        codeSnippet: 'add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;',
        cwe: 'CWE-319',
        owasp: 'A02:2021',
      },
      {
        id: 'DEMO-2',
        title: 'Missing Content-Security-Policy (CSP)',
        category: 'HEADERS',
        severity: 'HIGH',
        description: 'Absence of CSP directives permits execution of unauthorized inline scripts and style origins.',
        affectedAsset: 'scanme.nmap.org',
        remediation: 'Implement a restrictive CSP header with script-src self.',
        codeSnippet: "add_header Content-Security-Policy \"default-src 'self';\" always;",
        cwe: 'CWE-1021',
        owasp: 'A05:2021',
      },
      {
        id: 'DEMO-3',
        title: 'Exposed High-Risk Service Port: 22/SSH',
        category: 'PORTS',
        severity: 'MEDIUM',
        description: 'TCP port 22 (SSH) is reachable directly on the public interface.',
        affectedAsset: 'scanme.nmap.org:22',
        remediation: 'Restrict SSH ingress via security group or VPN firewall whitelist.',
        codeSnippet: 'sudo ufw allow from <TRUSTED_IP> to any port 22',
        cwe: 'CWE-284',
        owasp: 'A05:2021',
      },
    ],
    ports: [
      { port: 22, service: 'SSH', status: 'OPEN', risk: 'LOW', description: 'Secure Shell remote terminal access.' },
      { port: 80, service: 'HTTP', status: 'OPEN', risk: 'INFO', description: 'Standard unencrypted web server port.' },
      { port: 443, service: 'HTTPS', status: 'OPEN', risk: 'INFO', description: 'Standard encrypted web server port.' },
      { port: 21, service: 'FTP', status: 'CLOSED', risk: 'INFO', description: 'Plaintext File Transfer Protocol.' },
      { port: 23, service: 'Telnet', status: 'CLOSED', risk: 'INFO', description: 'Unencrypted remote access.' },
      { port: 3306, service: 'MySQL', status: 'CLOSED', risk: 'INFO', description: 'MySQL Database service.' },
    ],
    meta: {
      protocol: 'HTTPS',
      ipAddress: '45.33.32.156',
      redirectChain: [{ status: 200, url: 'http://scanme.nmap.org' }],
      serverBanner: 'Apache/2.4.7 (Ubuntu)',
      dns: { hasSpf: true, hasDmarc: false, mxCount: 1, nsCount: 2 },
    },
    aiBriefing: {
      executiveSummary: 'Security posture evaluation for scanme.nmap.org revealed missing defensive headers and publicly exposed SSH port listener. Transport encryption requires HSTS enforcement.',
      topPriorities: [
        'Enforce Strict-Transport-Security (HSTS) on webserver',
        'Implement Content-Security-Policy (CSP) headers',
        'Restrict SSH port 22 ingress to authorized admin IPs',
      ],
      threatLevel: 'MODERATE RISK',
      remediationRoadmap: [
        { step: '01. Perimeter Containment', urgency: 'ROUTINE', description: 'Restrict port 22 ingress via iptables/UFW.' },
        { step: '02. Defense Hardening', urgency: 'HIGH - 72H', description: 'Deploy strict CSP and HSTS.' },
      ],
    },
  },
  {
    id: 'SCAN-DEMO-02',
    target: 'example.com',
    scanUrl: 'https://example.com',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    summary: {
      target: 'example.com',
      scanDate: new Date(Date.now() - 3600000 * 24).toISOString(),
      durationMs: 4100,
      score: 86,
      grade: 'B',
      counts: { critical: 0, high: 1, medium: 1, low: 1, info: 0, total: 3 },
    },
    findings: [
      {
        id: 'DEMO-EX-1',
        title: 'Missing Content-Security-Policy (CSP)',
        category: 'HEADERS',
        severity: 'HIGH',
        description: 'The response does not enforce a declared Content-Security-Policy.',
        affectedAsset: 'example.com',
        remediation: 'Deploy strict CSP directives.',
        codeSnippet: "add_header Content-Security-Policy \"default-src 'self';\" always;",
        cwe: 'CWE-1021',
        owasp: 'A05:2021',
      },
    ],
    ports: [
      { port: 80, service: 'HTTP', status: 'OPEN', risk: 'INFO', description: 'Standard HTTP' },
      { port: 443, service: 'HTTPS', status: 'OPEN', risk: 'INFO', description: 'Standard HTTPS' },
    ],
    meta: {
      protocol: 'HTTPS',
      ipAddress: '93.184.215.14',
      redirectChain: [{ status: 301, url: 'http://example.com' }, { status: 200, url: 'https://example.com' }],
    },
    aiBriefing: {
      executiveSummary: 'Perimeter evaluation of example.com shows solid transport protection with minor HTTP header gaps.',
      topPriorities: ['Deploy CSP header'],
      threatLevel: 'LOW RISK',
      remediationRoadmap: [{ step: '01. Headers', urgency: 'ROUTINE', description: 'Add security headers.' }],
    },
  },
];

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(SCANS_FILE)) {
    fs.writeFileSync(SCANS_FILE, JSON.stringify(INITIAL_DEMO_SCANS, null, 2), 'utf-8');
  }
}

export async function getScans(): Promise<ScanResult[]> {
  try {
    ensureDataFile();
    const data = fs.readFileSync(SCANS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read scans:', err);
    return [];
  }
}

export async function getScanById(id: string): Promise<ScanResult | null> {
  const scans = await getScans();
  return scans.find((s) => s.id === id) || null;
}

export async function saveScan(scan: ScanResult): Promise<void> {
  try {
    ensureDataFile();
    const scans = await getScans();
    // Prepend new scan to top of list, prevent duplicate ID
    const updated = [scan, ...scans.filter((s) => s.id !== scan.id)];
    // Keep max 50 scans
    const trimmed = updated.slice(0, 50);
    fs.writeFileSync(SCANS_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save scan:', err);
  }
}

export async function deleteScan(id: string): Promise<boolean> {
  try {
    ensureDataFile();
    const scans = await getScans();
    const filtered = scans.filter((s) => s.id !== id);
    fs.writeFileSync(SCANS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
    return true;
  } catch {
    return false;
  }
}
