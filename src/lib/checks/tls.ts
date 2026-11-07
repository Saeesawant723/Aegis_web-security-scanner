import tls from 'tls';
import { Finding, ScanMetadata } from '@/types/scan';

export async function checkTLS(
  target: string,
  onLog: (msg: string, level?: 'info' | 'warn' | 'crit') => void
): Promise<{ findings: Finding[]; tlsMeta?: ScanMetadata['tls'] }> {
  const findings: Finding[] = [];
  onLog(`Handshaking TLS session on ${target}:443...`);

  return new Promise((resolve) => {
    let resolved = false;

    const socket = tls.connect(
      {
        host: target,
        port: 443,
        servername: target,
        rejectUnauthorized: false, // We check authorization status manually to report exact cert errors
        timeout: 6000,
      },
      () => {
        if (resolved) return;
        resolved = true;

        const cert = socket.getPeerCertificate();
        const protocol = socket.getProtocol();
        const cipher = socket.getCipher();
        const authorized = socket.authorized;
        const authError = socket.authorizationError;

        socket.end();

        if (!cert || Object.keys(cert).length === 0) {
          onLog(`No peer TLS certificate presented by ${target}`, 'crit');
          findings.push({
            id: 'FIND-TLS-NO-CERT',
            title: 'No Valid TLS Certificate Presented',
            category: 'TLS',
            severity: 'CRITICAL',
            description: 'The server accepts port 443 connections but failed to present an X.509 certificate.',
            affectedAsset: `${target}:443`,
            remediation: 'Install a trusted SSL/TLS certificate (e.g. via Let’s Encrypt / Certbot).',
            cwe: 'CWE-295: Improper Certificate Validation',
            owasp: 'A02:2021 - Cryptographic Failures',
          });
          resolve({ findings });
          return;
        }

        const validTo = new Date(cert.valid_to);
        const now = new Date();
        const diffMs = validTo.getTime() - now.getTime();
        const daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const rawIssuer = cert.issuer ? (cert.issuer.O || cert.issuer.CN || 'Unknown') : 'Unknown';
        const rawSubject = cert.subject ? (cert.subject.CN || 'Unknown') : 'Unknown';
        const issuer = Array.isArray(rawIssuer) ? rawIssuer.join(', ') : String(rawIssuer);
        const subject = Array.isArray(rawSubject) ? rawSubject.join(', ') : String(rawSubject);

        onLog(`TLS established: ${protocol || 'TLS'} / ${cipher?.name || 'Cipher'} | Cert valid for ${daysRemaining} days`, 'info');

        // Check 1: Expiration
        if (daysRemaining < 0) {
          findings.push({
            id: 'FIND-TLS-EXPIRED',
            title: 'Expired SSL/TLS Certificate',
            category: 'TLS',
            severity: 'CRITICAL',
            description: `The SSL/TLS certificate for ${target} expired ${Math.abs(daysRemaining)} days ago on ${validTo.toISOString().slice(0, 10)}. Browsers will actively block user traffic with security warning screens.`,
            affectedAsset: `${target}:443`,
            evidence: `Valid To: ${cert.valid_to} | Issuer: ${issuer}`,
            remediation: 'Renew the SSL/TLS certificate immediately using your certificate authority or certbot.',
            codeSnippet: `sudo certbot renew --force-renewal`,
            cwe: 'CWE-298: Improper Validation of Certificate Expiration',
            owasp: 'A02:2021 - Cryptographic Failures',
          });
        } else if (daysRemaining <= 7) {
          findings.push({
            id: 'FIND-TLS-EXPIRING-CRITICAL-WINDOW',
            title: 'SSL/TLS Certificate Expiring Imminently (< 7 Days)',
            category: 'TLS',
            severity: 'HIGH',
            description: `The SSL certificate expires in ${daysRemaining} days (${validTo.toISOString().slice(0, 10)}). Immediate renewal required to prevent traffic interruption.`,
            affectedAsset: `${target}:443`,
            evidence: `Days remaining: ${daysRemaining}`,
            remediation: 'Trigger automated certificate renewal immediately.',
            cwe: 'CWE-298: Certificate Expiration',
            owasp: 'A02:2021 - Cryptographic Failures',
          });
        } else if (daysRemaining <= 21) {
          findings.push({
            id: 'FIND-TLS-EXPIRING-WINDOW',
            title: 'SSL/TLS Certificate in Standard Renewal Window',
            category: 'TLS',
            severity: 'LOW',
            description: `The SSL certificate expires in ${daysRemaining} days (${validTo.toISOString().slice(0, 10)}). Typical enterprise ACME/Let's Encrypt rotation occurs in this window.`,
            affectedAsset: `${target}:443`,
            evidence: `Days remaining: ${daysRemaining}`,
            remediation: 'Verify automated ACME rotation cron or certificate manager.',
            cwe: 'CWE-298: Certificate Expiration',
            owasp: 'A02:2021 - Cryptographic Failures',
          });
        }

        // Check 2: Authority validation
        if (!authorized) {
          findings.push({
            id: 'FIND-TLS-UNTRUSTED',
            title: 'Untrusted or Self-Signed Certificate',
            category: 'TLS',
            severity: 'HIGH',
            description: `The certificate is not trusted by public root certificate authorities. Details: ${authError || 'Self-signed or invalid root chain'}.`,
            affectedAsset: `${target}:443`,
            evidence: `Authorization Error: ${authError} | Issuer: ${issuer}`,
            remediation: 'Replace self-signed or invalid certificates with certificates issued by a publicly recognized CA.',
            cwe: 'CWE-295: Improper Certificate Validation',
            owasp: 'A02:2021 - Cryptographic Failures',
          });
        }

        // Check 3: Deprecated protocols (TLS 1.0 or 1.1)
        if (protocol && (protocol === 'TLSv1' || protocol === 'TLSv1.1')) {
          findings.push({
            id: 'FIND-TLS-DEPRECATED-VERSION',
            title: `Deprecated Transport Protocol Enforced (${protocol})`,
            category: 'TLS',
            severity: 'HIGH',
            description: `${protocol} contains known cryptographic vulnerabilities (e.g. BEAST, POODLE) and has been deprecated by major browser vendors and PCI-DSS standards.`,
            affectedAsset: `${target}:443`,
            evidence: `Negotiated Protocol: ${protocol}`,
            remediation: 'Disable TLS 1.0 and TLS 1.1 in your web server configuration; enforce TLSv1.2 and TLSv1.3.',
            codeSnippet: `# Nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;`,
            cwe: 'CWE-326: Inadequate Encryption Strength',
            owasp: 'A02:2021 - Cryptographic Failures',
          });
        }

        resolve({
          findings,
          tlsMeta: {
            valid: daysRemaining > 0,
            authorized: !!authorized,
            issuer,
            subject,
            validTo: cert.valid_to,
            daysRemaining,
            protocol: protocol || undefined,
            cipher: cipher?.name,
          },
        });
      }
    );

    socket.on('timeout', () => {
      if (resolved) return;
      resolved = true;
      socket.destroy();
      onLog(`TLS handshake timed out on port 443`, 'warn');
      resolve({ findings });
    });

    socket.on('error', (err: any) => {
      if (resolved) return;
      resolved = true;
      onLog(`TLS connection error: ${err.message || 'Handshake failed'}`, 'warn');
      resolve({ findings });
    });
  });
}
