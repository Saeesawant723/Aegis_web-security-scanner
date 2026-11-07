import dns from 'dns/promises';
import { Finding, ScanMetadata } from '@/types/scan';

function withDnsTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise.catch(() => fallback),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

function getApexDomain(hostname: string): string {
  const parts = hostname.toLowerCase().split('.');
  if (parts.length <= 2) return hostname;
  const secondLast = parts[parts.length - 2];
  const last = parts[parts.length - 1];
  const commonTwoPartTlds = ['co.in', 'edu.in', 'ac.in', 'org.in', 'net.in', 'gov.in', 'org.uk', 'co.uk', 'com.au', 'com.br'];
  const tldPair = `${secondLast}.${last}`;
  if (commonTwoPartTlds.includes(tldPair) && parts.length >= 3) {
    return parts.slice(-3).join('.');
  }
  return parts.slice(-2).join('.');
}

export async function checkDNS(
  target: string,
  onLog: (msg: string, level?: 'info' | 'warn' | 'crit') => void
): Promise<{ findings: Finding[]; dnsMeta?: ScanMetadata['dns']; ipAddress?: string }> {
  const findings: Finding[] = [];
  const apex = getApexDomain(target);
  onLog(`Querying DNS zones (SPF, DMARC, MX, NS) for ${target}${target !== apex ? ` (Apex: ${apex})` : ''}...`);

  let hasSpf = false;
  let spfRecord: string | undefined;
  let hasDmarc = false;
  let dmarcRecord: string | undefined;
  let mxCount = 0;
  let nsCount = 0;
  let ipAddress: string | undefined;

  // Resolve A record (IP) with 1500ms timeout
  try {
    const addresses = await withDnsTimeout(dns.resolve4(target), 1500, []);
    if (addresses && addresses.length > 0) {
      ipAddress = addresses[0];
      onLog(`Resolved primary IP: ${ipAddress}`, 'info');
    }
  } catch {
    try {
      const addresses6 = await withDnsTimeout(dns.resolve6(target), 1000, []);
      if (addresses6 && addresses6.length > 0) {
        ipAddress = addresses6[0];
      }
    } catch {
      // Ignore
    }
  }

  // 1. SPF Check (TXT on domain; fallback to apex per RFC 7208)
  try {
    let txtRecords = await withDnsTimeout(dns.resolveTxt(target), 1500, []);
    let flattened = txtRecords.map((r) => r.join(''));
    let spf = flattened.find((r) => r.toLowerCase().startsWith('v=spf1'));

    if (!spf && target !== apex) {
      const apexTxt = await withDnsTimeout(dns.resolveTxt(apex), 1500, []);
      flattened = apexTxt.map((r) => r.join(''));
      spf = flattened.find((r) => r.toLowerCase().startsWith('v=spf1'));
    }

    if (spf) {
      hasSpf = true;
      spfRecord = spf;
      onLog(`[OK] SPF record confirmed: ${spf.slice(0, 45)}...`, 'info');

      if (spf.includes('+all') || spf.includes('?all')) {
        findings.push({
          id: 'FIND-DNS-PERMISSIVE-SPF',
          title: 'Permissive SPF Policy (+all / ?all)',
          category: 'DNS',
          severity: 'HIGH',
          description:
            'The SPF record terminates with a permissive +all or neutral ?all mechanism. This allows unauthenticated external senders to send emails appearing from your domain.',
          affectedAsset: target,
          evidence: `SPF Record: ${spf}`,
          remediation: "Change the terminating mechanism of your SPF record to '-all' (hard fail) or '~all' (soft fail).",
          codeSnippet: `v=spf1 include:_spf.google.com ~all`,
          cwe: 'CWE-345',
          owasp: 'A05:2021 - Security Misconfiguration',
        });
      }
    }
  } catch (err: any) {
    onLog(`TXT lookup note: ${err.code || 'None found'}`, 'info');
  }

  if (!hasSpf) {
    findings.push({
      id: 'FIND-DNS-NO-SPF',
      title: 'Missing SPF (Sender Policy Framework) Record',
      category: 'DNS',
      severity: 'HIGH',
      description:
        `No SPF TXT record was discovered on ${target} or ${apex}. Mail servers cannot verify outbound authorization, facilitating domain spoofing.`,
      affectedAsset: target,
      remediation: "Publish a DNS TXT record defining valid mail sending servers for this domain.",
      codeSnippet: `${target}. IN TXT "v=spf1 include:_spf.mx.example.com -all"`,
      cwe: 'CWE-290',
      owasp: 'A05:2021 - Security Misconfiguration',
    });
  }

  // 2. DMARC Check (TXT on _dmarc.target; fallback to _dmarc.apex per RFC 7489)
  try {
    let dmarcRecords = await withDnsTimeout(dns.resolveTxt(`_dmarc.${target}`), 1500, []);
    let flattenedDmarc = dmarcRecords.map((r) => r.join(''));
    let dmarc = flattenedDmarc.find((r) => r.toLowerCase().startsWith('v=dmarc1'));

    if (!dmarc && target !== apex) {
      const apexDmarc = await withDnsTimeout(dns.resolveTxt(`_dmarc.${apex}`), 1500, []);
      flattenedDmarc = apexDmarc.map((r) => r.join(''));
      dmarc = flattenedDmarc.find((r) => r.toLowerCase().startsWith('v=dmarc1'));
    }

    if (dmarc) {
      hasDmarc = true;
      dmarcRecord = dmarc;
      onLog(`[OK] DMARC policy confirmed: ${dmarc.slice(0, 45)}...`, 'info');

      if (dmarc.includes('p=none')) {
        findings.push({
          id: 'FIND-DNS-DMARC-P-NONE',
          title: 'DMARC Policy in Monitoring-Only Mode (p=none)',
          category: 'DNS',
          severity: 'MEDIUM',
          description:
            "Your DMARC record specifies 'p=none'. While useful during initial deployment for telemetry, receiving mail providers will not quarantine or reject spoofed emails posing as your organization.",
          affectedAsset: `_dmarc.${target}`,
          evidence: `DMARC: ${dmarc}`,
          remediation: "Upgrade DMARC policy from 'p=none' to 'p=quarantine' or 'p=reject' once legitimate email streams are validated.",
          codeSnippet: `_dmarc.${target}. IN TXT "v=DMARC1; p=reject; rua=mailto:dmarc-reports@${target};"`,
          cwe: 'CWE-345',
          owasp: 'A05:2021 - Security Misconfiguration',
        });
      }
    }
  } catch (err: any) {
    onLog(`DMARC lookup note: ${err.code || 'None found'}`, 'info');
  }

  if (!hasDmarc) {
    findings.push({
      id: 'FIND-DNS-NO-DMARC',
      title: 'Missing DMARC (Domain-based Message Authentication) Policy',
      category: 'DNS',
      severity: 'HIGH',
      description:
        `No DMARC record exists at _dmarc.${target} or _dmarc.${apex}. Adversaries can forge emails using your brand domain without recipient mail servers enforcing quarantine or rejection policies.`,
      affectedAsset: `_dmarc.${target}`,
      remediation: 'Publish a DMARC policy record with reporting endpoints (rua/ruf).',
      codeSnippet: `_dmarc.${target}. IN TXT "v=DMARC1; p=quarantine; sp=quarantine; pct=100;"`,
      cwe: 'CWE-290',
      owasp: 'A05:2021 - Security Misconfiguration',
    });
  }

  // 3. MX & NS Records with 1000ms timeout
  try {
    let mx = await withDnsTimeout(dns.resolveMx(target), 1000, []);
    if ((!mx || mx.length === 0) && target !== apex) {
      mx = await withDnsTimeout(dns.resolveMx(apex), 1000, []);
    }
    mxCount = mx?.length || 0;
  } catch {
    mxCount = 0;
  }

  try {
    let ns = await withDnsTimeout(dns.resolveNs(target), 1000, []);
    if ((!ns || ns.length === 0) && target !== apex) {
      ns = await withDnsTimeout(dns.resolveNs(apex), 1000, []);
    }
    nsCount = ns?.length || 0;
  } catch {
    nsCount = 0;
  }

  return {
    findings,
    dnsMeta: {
      hasSpf,
      spfRecord,
      hasDmarc,
      dmarcRecord,
      mxCount,
      nsCount,
    },
    ipAddress,
  };
}
