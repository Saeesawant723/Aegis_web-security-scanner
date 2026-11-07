import https from 'https';
import http from 'http';
import { Finding } from '@/types/scan';

interface SensitiveFileCheck {
  path: string;
  name: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  signature?: RegExp;
  cwe: string;
  remediation: string;
}

const CHECKS: SensitiveFileCheck[] = [
  {
    path: '/.env',
    name: 'Exposed Environment (.env) Configuration File',
    severity: 'CRITICAL',
    signature: /(DB_PASSWORD|SECRET|API_KEY|DATABASE_URL|APP_KEY|AWS_)/i,
    cwe: 'CWE-552',
    remediation: 'Immediately block public HTTP access to hidden dot-files and revoke disclosed credentials.',
  },
  {
    path: '/.git/HEAD',
    name: 'Exposed Git Repository (.git/HEAD)',
    severity: 'CRITICAL',
    signature: /^ref:\s*refs\//,
    cwe: 'CWE-527',
    remediation: 'Deny web server access to .git directories and purge git history from public doc roots.',
  },
  {
    path: '/.DS_Store',
    name: 'Exposed macOS Finder Metadata (.DS_Store)',
    severity: 'LOW',
    signature: /\x00\x00\x00\x01Bud1/,
    cwe: 'CWE-200',
    remediation: 'Remove .DS_Store files and block them in server configuration.',
  },
  {
    path: '/.well-known/security.txt',
    name: 'Missing Vulnerability Disclosure Policy (security.txt)',
    severity: 'INFO',
    cwe: 'CWE-16',
    remediation: 'Publish a security.txt file under /.well-known/security.txt outlining vulnerability reporting procedures (RFC 9116).',
  },
];

export async function checkSensitiveFiles(
  target: string,
  onLog: (msg: string, level?: 'info' | 'warn' | 'crit') => void
): Promise<Finding[]> {
  const findings: Finding[] = [];
  onLog(`Auditing public webroot for sensitive configuration leaks...`);

  // Run in parallel for high speed
  const results = await Promise.all(
    CHECKS.map(async (check) => {
      try {
        const url = `https://${target}${check.path}`;
        const result = await probeFile(url);
        return { check, result };
      } catch {
        return null;
      }
    })
  );

  for (const item of results) {
    if (!item) continue;
    const { check, result } = item;

    if (check.path.includes('security.txt')) {
      if (result.status === 404 || result.status === 0) {
        findings.push({
          id: 'FIND-FILE-NO-SECURITY-TXT',
          title: check.name,
          category: 'FILES',
          severity: 'INFO',
          description:
            'No RFC 9116 security.txt contact file found. Ethical security researchers lack a designated channel to securely disclose identified vulnerabilities.',
          affectedAsset: `https://${target}/.well-known/security.txt`,
          remediation: check.remediation,
          cwe: check.cwe,
          owasp: 'A05:2021 - Security Misconfiguration',
        });
      }
      continue;
    }

    if (result.status === 200 && result.body) {
      let isMatch = true;
      if (check.signature) {
        isMatch = check.signature.test(result.body);
      }

      // Avoid false positives from custom 404 pages returning HTML
      const isHtml = /<!DOCTYPE html|<html/i.test(result.body);
      if (isHtml && !check.path.endsWith('.html')) {
        isMatch = false;
      }

      if (isMatch) {
        onLog(`[EXPOSURE] ${check.path} is publicly accessible (HTTP 200)!`, 'crit');
        findings.push({
          id: `FIND-FILE-EXPOSED-${check.path.replace(/[^a-zA-Z0-9]/g, '_')}`,
          title: check.name,
          category: 'FILES',
          severity: check.severity,
          description: `The sensitive resource at '${check.path}' responded with HTTP 200 and matches file signatures. Threat actors can download credentials, secrets, or source control trees directly.`,
          affectedAsset: `https://${target}${check.path}`,
          evidence: `HTTP Status: 200 OK | Sample content snippet: ${result.body.slice(0, 100)}...`,
          remediation: check.remediation,
          codeSnippet: `# Nginx: Block hidden dot-files\nlocation ~ /\\.(?!well-known).* {\n    deny all;\n    access_log off;\n    log_not_found off;\n}`,
          cwe: check.cwe,
          owasp: 'A05:2021 - Security Misconfiguration',
        });
      }
    }
  }

  return findings;
}

function probeFile(urlStr: string): Promise<{ status: number; body?: string }> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (res: { status: number; body?: string }) => {
      if (settled) return;
      settled = true;
      resolve(res);
    };

    try {
      const u = new URL(urlStr);
      const client = u.protocol === 'https:' ? https : http;

      const req = client.get(
        urlStr,
        {
          timeout: 2500,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AEGIS-Security-Audit/1.0',
            Accept: '*/*',
          },
        },
        (res) => {
          const status = res.statusCode || 0;
          if (status !== 200) {
            res.resume();
            req.destroy();
            finish({ status, body: '' });
            return;
          }
          let body = '';
          res.on('data', (chunk) => {
            body += chunk;
            if (body.length > 20000) {
              res.destroy();
              finish({ status, body });
            }
          });
          res.on('end', () => finish({ status, body }));
          res.on('error', () => finish({ status, body }));
          res.on('close', () => finish({ status, body }));
        }
      );

      req.on('timeout', () => {
        req.destroy();
        finish({ status: 0 });
      });
      req.on('error', () => {
        req.destroy();
        finish({ status: 0 });
      });
      req.on('close', () => finish({ status: 0 }));
    } catch {
      finish({ status: 0 });
    }
  });
}
