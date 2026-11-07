import http from 'http';
import https from 'https';
import { Finding, ScanMetadata } from '@/types/scan';

export async function checkRecon(
  target: string,
  onLog: (msg: string, level?: 'info' | 'warn' | 'crit') => void
): Promise<{ findings: Finding[]; meta: Partial<ScanMetadata> }> {
  const findings: Finding[] = [];
  const redirectChain: Array<{ status: number; url: string }> = [];

  onLog(`Probing network perimeter and transport redirection for ${target}...`);

  // 1. Follow HTTP -> HTTPS Redirection Check
  let enforcesHttps = false;
  let currentUrl = `http://${target}/`;
  let hops = 0;
  const maxHops = 6;
  let serverBanner: string | undefined;
  let poweredBy: string | undefined;

  try {
    while (hops < maxHops) {
      hops++;
      const isHttps = currentUrl.startsWith('https://');
      const client = isHttps ? https : http;

      const res = await new Promise<{
        statusCode?: number;
        headers: http.IncomingHttpHeaders;
      }>((resolve, reject) => {
        const req = client.request(
          currentUrl,
          {
            method: 'GET',
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
            timeout: 6000,
          },
          (r) => {
            resolve({ statusCode: r.statusCode, headers: r.headers });
            r.resume(); // Discard body
          }
        );

        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Connection timeout during protocol inspection'));
        });
        req.on('error', (err) => reject(err));
        req.end();
      });

      const statusCode = res.statusCode || 200;
      redirectChain.push({ status: statusCode, url: currentUrl });

      if (res.headers['server']) {
        serverBanner = Array.isArray(res.headers['server'])
          ? res.headers['server'].join(', ')
          : res.headers['server'];
      }
      if (res.headers['x-powered-by']) {
        poweredBy = Array.isArray(res.headers['x-powered-by'])
          ? res.headers['x-powered-by'].join(', ')
          : res.headers['x-powered-by'];
      }

      if ([301, 302, 303, 307, 308].includes(statusCode) && res.headers.location) {
        let nextLocation = res.headers.location;
        try {
          nextLocation = new URL(nextLocation, currentUrl).href;
        } catch {
          if (nextLocation.startsWith('/')) {
            const origin = new URL(currentUrl).origin;
            nextLocation = `${origin}${nextLocation}`;
          }
        }
        onLog(`[HTTP ${statusCode}] Redirecting to ${nextLocation}`, 'info');
        currentUrl = nextLocation;
        if (nextLocation.startsWith('https://')) {
          enforcesHttps = true;
          break;
        }
      } else {
        if (currentUrl.startsWith('https://')) {
          enforcesHttps = true;
        }
        break;
      }
    }
  } catch (err: any) {
    onLog(`Protocol check note: ${err.message || 'Host uncontactable via HTTP port 80'}`, 'warn');
  }

  // Double check if HTTPS works directly on port 443
  const httpsAvailable = await checkHttpsDirect(target);

  if (!enforcesHttps) {
    if (!httpsAvailable) {
      findings.push({
        id: 'FIND-RECON-NO-HTTPS-TOTAL',
        title: 'HTTPS Unenforced & Unavailable (Critical Plaintext Transit)',
        category: 'PROTOCOL',
        severity: 'CRITICAL',
        description:
          'The application does not support or enforce HTTPS. All communications, credentials, and user data are transmitted in plaintext without cryptographic encryption.',
        affectedAsset: `http://${target}`,
        remediation: 'Deploy an SSL/TLS certificate and enforce port 443 HTTPS on all web endpoints.',
        cwe: 'CWE-319',
        owasp: 'A02:2021 - Cryptographic Failures',
      });
    } else {
      onLog(`Note: HTTPS is operational on port 443, but plain HTTP requests are not automatically redirected.`, 'warn');
      findings.push({
        id: 'FIND-RECON-HTTP-FALLBACK',
        title: 'Plaintext HTTP Serves Content Without Auto-HTTPS Upgrade',
        category: 'PROTOCOL',
        severity: 'LOW',
        description:
          'The server is reachable over secure HTTPS, but plain unencrypted HTTP requests on port 80 continue to serve content without issuing an immediate HTTP 301 upgrade to HTTPS.',
        affectedAsset: `http://${target}`,
        evidence: `Initial request to http://${target} reached final URL: ${currentUrl}`,
        remediation:
          'Configure your webserver/reverse proxy (Nginx/Apache/Cloudflare) to issue an automatic HTTP 301 Permanent Redirect from port 80 to https://$host$request_uri.',
        codeSnippet: `server {\n    listen 80;\n    server_name ${target};\n    return 301 https://$host$request_uri;\n}`,
        cwe: 'CWE-319',
        owasp: 'A02:2021 - Cryptographic Failures',
      });
    }
  } else {
    onLog(`HTTPS enforcement verified: Inbound HTTP traffic automatically upgraded to HTTPS.`, 'info');
  }

  // 2. Server Banner & Technology Leakage
  if (serverBanner) {
    const hasDetailedVersion = /\d+\.\d+/.test(serverBanner);
    if (hasDetailedVersion) {
      findings.push({
        id: 'FIND-RECON-SERVER-HEADER',
        title: 'Server Version Disclosure',
        category: 'HEADERS',
        severity: 'MEDIUM',
        description: `The HTTP server returned a 'Server' header identifying exact software version (${serverBanner}). Precise version disclosures allow threat actors to query CVE databases for known unpatched exploits.`,
        affectedAsset: target,
        evidence: `Server: ${serverBanner}`,
        remediation: 'Disable exact server tokens in your webserver configuration to mask software details.',
        codeSnippet: `# Nginx\nserver_tokens off;\n\n# Apache httpd.conf\nServerTokens Prod\nServerSignature Off`,
        cwe: 'CWE-200',
        owasp: 'A05:2021 - Security Misconfiguration',
      });
    }
  }

  if (poweredBy) {
    findings.push({
      id: 'FIND-RECON-POWERED-BY',
      title: 'X-Powered-By Framework Fingerprint Disclosed',
      category: 'HEADERS',
      severity: 'LOW',
      description: `The application returned an 'X-Powered-By' header (${poweredBy}), broadcasting underlying application runtime or framework details.`,
      affectedAsset: target,
      evidence: `X-Powered-By: ${poweredBy}`,
      remediation: 'Disable header emission in application frameworks (e.g. app.disable("x-powered-by") in Express).',
      codeSnippet: `// Express.js\napp.disable('x-powered-by');\n\n// PHP php.ini\nexpose_php = Off`,
      cwe: 'CWE-200',
      owasp: 'A05:2021 - Security Misconfiguration',
    });
  }

  return {
    findings,
    meta: {
      protocol: httpsAvailable ? 'HTTPS' : enforcesHttps ? 'HTTPS' : 'HTTP',
      redirectChain,
      serverBanner,
      poweredBy,
    },
  };
}

function checkHttpsDirect(host: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const req = https.request(
        `https://${host}/`,
        { method: 'HEAD', timeout: 5000, rejectUnauthorized: false },
        (res) => {
          resolve(!!res.statusCode);
        }
      );
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
      req.on('error', () => resolve(false));
      req.end();
    } catch {
      resolve(false);
    }
  });
}
