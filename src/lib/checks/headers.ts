import https from 'https';
import http from 'http';
import { Finding } from '@/types/scan';

export async function checkHeadersAndCookies(
  target: string,
  onLog: (msg: string, level?: 'info' | 'warn' | 'crit') => void
): Promise<Finding[]> {
  const findings: Finding[] = [];
  onLog(`Inspecting HTTP defensive directives & session tokens for ${target}...`);

  // Fetch headers following redirects to reach the canonical landing page
  const result = await fetchCanonicalHeaders(`https://${target}/`);

  if (!result || !result.headers) {
    onLog(`Could not retrieve HTTPS headers; attempting HTTP fallback...`, 'warn');
    const fallback = await fetchCanonicalHeaders(`http://${target}/`);
    if (!fallback || !fallback.headers) {
      onLog(`Failed to establish HTTP connection for header analysis.`, 'warn');
      return findings;
    }
    return analyzeHeaders(target, fallback.finalUrl, fallback.headers, onLog);
  }

  return analyzeHeaders(target, result.finalUrl, result.headers, onLog);
}

function analyzeHeaders(
  target: string,
  finalUrl: string,
  headers: http.IncomingHttpHeaders,
  onLog: (msg: string, level?: 'info' | 'warn' | 'crit') => void
): Finding[] {
  const findings: Finding[] = [];

  // 1. Content-Security-Policy (CSP) - check both enforced and report-only
  const csp = headers['content-security-policy'];
  const cspReport = headers['content-security-policy-report-only'];

  if (csp) {
    onLog(`[OK] Content-Security-Policy directive enforced`, 'info');
  } else if (cspReport) {
    onLog(`[OK] Content-Security-Policy deployed in Report-Only mode`, 'info');
    findings.push({
      id: 'FIND-HDR-CSP-REPORT-ONLY',
      title: 'Content-Security-Policy Deployed in Report-Only Mode',
      category: 'HEADERS',
      severity: 'LOW',
      description:
        'The host provides a Content-Security-Policy in Report-Only mode. While effective for monitoring violations without breaking legacy functionality, violation reports should be reviewed before transitioning to full enforcement.',
      affectedAsset: target,
      evidence: `CSP-Report-Only: ${String(cspReport).slice(0, 80)}...`,
      remediation: 'Transition policy to standard Content-Security-Policy once all inline and external assets are verified.',
      cwe: 'CWE-1021',
      owasp: 'A05:2021 - Security Misconfiguration',
    });
  } else {
    onLog(`[MISSING] Content-Security-Policy header`, 'warn');
    findings.push({
      id: 'FIND-HDR-NO-CSP',
      title: 'Missing Content-Security-Policy (CSP)',
      category: 'HEADERS',
      severity: 'MEDIUM',
      description:
        'The application does not declare a Content-Security-Policy header. CSP restricts unauthorized executable scripts, style sources, and mitigates Cross-Site Scripting (XSS) and data exfiltration.',
      affectedAsset: target,
      remediation:
        'Define a restrictive Content-Security-Policy header declaring allowed origins for scripts, styles, objects, and connect endpoints.',
      codeSnippet: `add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self';" always;`,
      cwe: 'CWE-1021',
      owasp: 'A05:2021 - Security Misconfiguration',
    });
  }

  // 2. Strict-Transport-Security (HSTS)
  const hsts = headers['strict-transport-security'];
  const hasHsts = !!hsts;
  if (!hsts) {
    onLog(`[MISSING] Strict-Transport-Security (HSTS) header`, 'warn');
    findings.push({
      id: 'FIND-HDR-NO-HSTS',
      title: 'Missing Strict-Transport-Security (HSTS) Header',
      category: 'HEADERS',
      severity: 'MEDIUM',
      description:
        'HSTS ensures that user browsers strictly connect to the application over encrypted TLS, mitigating SSL stripping and downgrade attacks.',
      affectedAsset: target,
      remediation:
        'Enable HSTS with a minimum max-age of 31536000 (1 year), includeSubDomains, and consider preload registration.',
      codeSnippet: `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;`,
      cwe: 'CWE-319',
      owasp: 'A02:2021 - Cryptographic Failures',
    });
  } else {
    onLog(`[OK] Strict-Transport-Security enforced: ${hsts}`, 'info');
  }

  // 3. X-Frame-Options (Clickjacking protection)
  const xfo = headers['x-frame-options'];
  const hasCspFrameAncestors = csp && csp.toString().includes('frame-ancestors');

  if (!xfo && !hasCspFrameAncestors) {
    onLog(`[MISSING] X-Frame-Options Clickjacking Defense`, 'warn');
    findings.push({
      id: 'FIND-HDR-NO-XFO',
      title: 'Missing X-Frame-Options Header (Clickjacking Risk)',
      category: 'HEADERS',
      severity: 'MEDIUM',
      description:
        'Without X-Frame-Options or CSP frame-ancestors, attackers can frame this website inside an invisible iframe on a malicious third-party site to induce unintentional user clicks.',
      affectedAsset: target,
      remediation: "Set X-Frame-Options to DENY or SAMEORIGIN on all user-facing endpoints.",
      codeSnippet: `add_header X-Frame-Options "SAMEORIGIN" always;`,
      cwe: 'CWE-1021',
      owasp: 'A05:2021 - Security Misconfiguration',
    });
  } else {
    onLog(`[OK] Frame protection verified (${xfo || 'CSP frame-ancestors'})`, 'info');
  }

  // 4. X-Content-Type-Options
  const xcto = headers['x-content-type-options'];
  if (!xcto || xcto.toString().toLowerCase() !== 'nosniff') {
    findings.push({
      id: 'FIND-HDR-NO-XCTO',
      title: 'Missing or Invalid X-Content-Type-Options',
      category: 'HEADERS',
      severity: 'LOW',
      description:
        "The 'X-Content-Type-Options: nosniff' header instructs web browsers to strictly adhere to declared MIME types rather than performing MIME sniffing.",
      affectedAsset: target,
      evidence: xcto ? `Current value: ${xcto}` : 'Header omitted',
      remediation: "Set 'X-Content-Type-Options: nosniff' on all HTTP responses.",
      codeSnippet: `add_header X-Content-Type-Options "nosniff" always;`,
      cwe: 'CWE-79',
      owasp: 'A05:2021 - Security Misconfiguration',
    });
  } else {
    onLog(`[OK] X-Content-Type-Options nosniff verified`, 'info');
  }

  // 5. Referrer-Policy
  const rp = headers['referrer-policy'];
  if (!rp) {
    findings.push({
      id: 'FIND-HDR-NO-REFERRER',
      title: 'Missing Referrer-Policy Header',
      category: 'HEADERS',
      severity: 'LOW',
      description:
        'When navigating away or loading external assets, the browser may leak request URL paths in the HTTP Referer header.',
      affectedAsset: target,
      remediation: "Set 'Referrer-Policy: strict-origin-when-cross-origin'.",
      codeSnippet: `add_header Referrer-Policy "strict-origin-when-cross-origin" always;`,
      cwe: 'CWE-200',
      owasp: 'A05:2021 - Security Misconfiguration',
    });
  }

  // 6. Permissions-Policy
  const pp = headers['permissions-policy'];
  if (!pp) {
    findings.push({
      id: 'FIND-HDR-NO-PERMISSIONS',
      title: 'Missing Permissions-Policy Directive',
      category: 'HEADERS',
      severity: 'INFO',
      description:
        'Permissions-Policy controls browser hardware APIs (microphone, geolocation, camera) available to the origin and embedded iframes.',
      affectedAsset: target,
      remediation: "Configure Permissions-Policy to disable unneeded browser hardware capabilities.",
      codeSnippet: `add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;`,
      cwe: 'CWE-16',
      owasp: 'A05:2021 - Security Misconfiguration',
    });
  }

  // 7. Cookies Auditing - SMART AGGREGATION
  // Only evaluate session/authentication cookies, or if HSTS is active, treat missing Secure on tracking as LOW
  const setCookie = headers['set-cookie'];
  if (setCookie) {
    const cookieList = Array.isArray(setCookie) ? setCookie : [setCookie];
    const insecureCookies: string[] = [];
    const scriptAccessibleAuthCookies: string[] = [];

    // Filter out common non-sensitive tracking/device/analytics cookies
    const nonSensitive = /^(flwssn|nfvdid|_ga|_gid|_gat|nid|search_samesite|optanon|cf_|datadome|attribution|visitor)/i;

    for (const rawCookie of cookieList) {
      const parts = rawCookie.split(';').map((p) => p.trim());
      const nameVal = parts[0] || 'cookie';
      const cookieName = nameVal.split('=')[0];

      const isSecure = parts.some((p) => p.toLowerCase() === 'secure');
      const isHttpOnly = parts.some((p) => p.toLowerCase() === 'httponly');

      const isAuthOrSession = /session|auth|token|jwt|id|key|user|login|phpsessid|jsessionid|aspsession/i.test(cookieName);

      if (!isSecure && !hasHsts) {
        if (isAuthOrSession) {
          insecureCookies.push(cookieName);
        }
      }

      if (!isHttpOnly && isAuthOrSession && !nonSensitive.test(cookieName)) {
        scriptAccessibleAuthCookies.push(cookieName);
      }
    }

    if (insecureCookies.length > 0) {
      findings.push({
        id: 'FIND-COOKIE-INSECURE-SESSION',
        title: `Session Cookies Missing 'Secure' Attribute (${insecureCookies.slice(0, 3).join(', ')})`,
        category: 'COOKIES',
        severity: 'MEDIUM',
        description: `Authentication/session cookies (${insecureCookies.join(', ')}) lack the 'Secure' attribute while the domain lacks strict HSTS. Browsers may transmit credentials over unencrypted HTTP.`,
        affectedAsset: insecureCookies.join(', '),
        remediation: "Append '; Secure' to all stateful authentication Set-Cookie directives.",
        codeSnippet: `Set-Cookie: session_id=<value>; Path=/; Secure; HttpOnly; SameSite=Lax`,
        cwe: 'CWE-614',
        owasp: 'A05:2021 - Security Misconfiguration',
      });
    }

    if (scriptAccessibleAuthCookies.length > 0) {
      findings.push({
        id: 'FIND-COOKIE-NO-HTTPONLY-AUTH',
        title: `Authentication Cookies Missing 'HttpOnly' Attribute (${scriptAccessibleAuthCookies.slice(0, 3).join(', ')})`,
        category: 'COOKIES',
        severity: 'MEDIUM',
        description: `Stateful session cookies (${scriptAccessibleAuthCookies.join(', ')}) lack the 'HttpOnly' flag, leaving them readable by client-side JavaScript in the event of an XSS flaw.`,
        affectedAsset: scriptAccessibleAuthCookies.join(', '),
        remediation: "Set the HttpOnly flag on all authentication and authorization session cookies.",
        codeSnippet: `Set-Cookie: session_id=<value>; Path=/; Secure; HttpOnly; SameSite=Lax`,
        cwe: 'CWE-1004',
        owasp: 'A05:2021 - Security Misconfiguration',
      });
    }
  }

  return findings;
}

function fetchCanonicalHeaders(
  startUrl: string,
  maxHops: number = 6
): Promise<{ finalUrl: string; headers: http.IncomingHttpHeaders } | null> {
  return new Promise((resolve) => {
    let currentUrl = startUrl;
    let hops = 0;
    let settled = false;

    function finish(res: { finalUrl: string; headers: http.IncomingHttpHeaders } | null) {
      if (settled) return;
      settled = true;
      resolve(res);
    }

    function step() {
      if (hops >= maxHops) {
        finish(null);
        return;
      }
      hops++;

      try {
        const u = new URL(currentUrl);
        const client = u.protocol === 'https:' ? https : http;

        const req = client.request(
          currentUrl,
          {
            method: 'GET',
            timeout: 5000,
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              Accept:
                'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            },
          },
          (res) => {
            const code = res.statusCode || 200;
            if ([301, 302, 303, 307, 308].includes(code) && res.headers.location) {
              let nextLoc = res.headers.location;
              try {
                nextLoc = new URL(nextLoc, currentUrl).href;
              } catch {
                if (nextLoc.startsWith('/')) {
                  nextLoc = `${u.origin}${nextLoc}`;
                }
              }
              currentUrl = nextLoc;
              res.resume();
              req.destroy();
              step();
            } else {
              const headers = res.headers;
              res.resume();
              req.destroy();
              finish({ finalUrl: currentUrl, headers });
            }
          }
        );

        req.on('timeout', () => {
          req.destroy();
          finish(null);
        });
        req.on('error', () => {
          req.destroy();
          finish(null);
        });
        req.end();
      } catch {
        finish(null);
      }
    }

    step();
  });
}
