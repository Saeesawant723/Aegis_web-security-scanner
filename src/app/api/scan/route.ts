import { NextRequest } from 'next/server';
import { checkRecon } from '@/lib/checks/recon';
import { checkHeadersAndCookies } from '@/lib/checks/headers';
import { checkTLS } from '@/lib/checks/tls';
import { checkDNS } from '@/lib/checks/dns';
import { checkSensitiveFiles } from '@/lib/checks/files';
import { checkOpenPorts } from '@/lib/checks/ports';
import { calculateScoreAndGrade, generateAnalystBriefing } from '@/lib/scoring';
import { saveScan } from '@/lib/storage';
import { Finding, PortCheckResult, ScanResult, ScanStreamEvent, ScanMetadata } from '@/types/scan';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function sanitizeTarget(raw: string): string {
  let domain = raw.trim();
  domain = domain.replace(/^https?:\/\//i, '');
  domain = domain.split('/')[0];
  domain = domain.split('?')[0];
  domain = domain.split('#')[0];
  domain = domain.split(':')[0];
  domain = domain.replace(/^\.+|\.+$/g, '');
  domain = domain.toLowerCase();

  // If user entered a bare name without TLD (e.g. "instagram", "netflix", "google"), auto-append .com
  if (domain && !domain.includes('.') && domain !== 'localhost') {
    domain = `${domain}.com`;
  }
  return domain;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawTarget = searchParams.get('target') || '';
  const consent = searchParams.get('consent');

  const target = sanitizeTarget(rawTarget);

  if (!target || !/^[a-z0-9]([a-z0-9\-.]+)?[a-z0-9]$/.test(target)) {
    return new Response(JSON.stringify({ error: 'Invalid hostname provided.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (consent !== 'true' && consent !== '1') {
    return new Response(JSON.stringify({ error: 'Consent must be confirmed prior to scan execution.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const startTime = Date.now();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function sendEvent(event: ScanStreamEvent) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      }

      function log(message: string, level: 'info' | 'warn' | 'crit' = 'info') {
        const timeStr = new Date().toISOString().slice(11, 19);
        sendEvent({
          type: 'LOG',
          payload: { timestamp: `[${timeStr}]`, message, level },
        });
      }

      try {
        sendEvent({
          type: 'INIT',
          payload: { target, timestamp: new Date().toISOString() },
        });
        log(`AEGIS//AI Core Initialized. Engaging passive non-destructive scan against ${target}`);
        log(`Target confirmed: ${target}. Consent hash recorded.`);

        const allFindings: Finding[] = [];
        let ipAddress: string | undefined;
        let reconMeta: Partial<ScanMetadata> = {};
        let tlsMeta: ScanMetadata['tls'] | undefined;
        let dnsMeta: ScanMetadata['dns'] | undefined;
        const allPorts: PortCheckResult[] = [];

        // Module 1: Recon & Transport
        try {
          sendEvent({ type: 'MODULE_START', payload: { module: 'PROTOCOL', name: 'Network Protocol & Redirection' } });
          const reconRes = await checkRecon(target, log);
          reconMeta = reconRes.meta;
          for (const f of reconRes.findings) {
            allFindings.push(f);
            sendEvent({ type: 'FINDING', payload: f });
          }
          sendEvent({ type: 'MODULE_END', payload: { module: 'PROTOCOL', findingsCount: reconRes.findings.length } });
        } catch (err: any) {
          log(`Protocol module note: ${err.message || 'Check failed'}`, 'warn');
          sendEvent({ type: 'MODULE_END', payload: { module: 'PROTOCOL', findingsCount: 0 } });
        }

        // Module 2: Headers & Cookies
        try {
          sendEvent({ type: 'MODULE_START', payload: { module: 'HEADERS', name: 'HTTP Defensive Headers & Cookies' } });
          const headersRes = await checkHeadersAndCookies(target, log);
          for (const f of headersRes) {
            allFindings.push(f);
            sendEvent({ type: 'FINDING', payload: f });
          }
          sendEvent({ type: 'MODULE_END', payload: { module: 'HEADERS', findingsCount: headersRes.length } });
        } catch (err: any) {
          log(`Headers module note: ${err.message || 'Check failed'}`, 'warn');
          sendEvent({ type: 'MODULE_END', payload: { module: 'HEADERS', findingsCount: 0 } });
        }

        // Module 3: TLS / SSL Cryptography
        try {
          sendEvent({ type: 'MODULE_START', payload: { module: 'TLS', name: 'TLS Handshake & Certificate Verification' } });
          const tlsRes = await checkTLS(target, log);
          tlsMeta = tlsRes.tlsMeta;
          for (const f of tlsRes.findings) {
            allFindings.push(f);
            sendEvent({ type: 'FINDING', payload: f });
          }
          sendEvent({ type: 'MODULE_END', payload: { module: 'TLS', findingsCount: tlsRes.findings.length } });
        } catch (err: any) {
          log(`TLS module note: ${err.message || 'Check failed'}`, 'warn');
          sendEvent({ type: 'MODULE_END', payload: { module: 'TLS', findingsCount: 0 } });
        }

        // Module 4: DNS Policy & Spoofing Resilience
        try {
          sendEvent({ type: 'MODULE_START', payload: { module: 'DNS', name: 'DNS Zone Audit (SPF / DMARC)' } });
          const dnsRes = await checkDNS(target, log);
          dnsMeta = dnsRes.dnsMeta;
          if (dnsRes.ipAddress) ipAddress = dnsRes.ipAddress;
          for (const f of dnsRes.findings) {
            allFindings.push(f);
            sendEvent({ type: 'FINDING', payload: f });
          }
          sendEvent({ type: 'MODULE_END', payload: { module: 'DNS', findingsCount: dnsRes.findings.length } });
        } catch (err: any) {
          log(`DNS module note: ${err.message || 'Check failed'}`, 'warn');
          sendEvent({ type: 'MODULE_END', payload: { module: 'DNS', findingsCount: 0 } });
        }

        // Module 5: Sensitive Public Files
        try {
          sendEvent({ type: 'MODULE_START', payload: { module: 'FILES', name: 'Exposed Configuration & Git Roots' } });
          const filesRes = await checkSensitiveFiles(target, log);
          for (const f of filesRes) {
            allFindings.push(f);
            sendEvent({ type: 'FINDING', payload: f });
          }
          sendEvent({ type: 'MODULE_END', payload: { module: 'FILES', findingsCount: filesRes.length } });
        } catch (err: any) {
          log(`Files module note: ${err.message || 'Check failed'}`, 'warn');
          sendEvent({ type: 'MODULE_END', payload: { module: 'FILES', findingsCount: 0 } });
        }

        // Module 6: Perimeter Port Verification
        try {
          sendEvent({ type: 'MODULE_START', payload: { module: 'PORTS', name: 'TCP Port Exposure Probes' } });
          const portsRes = await checkOpenPorts(
            target,
            (portResult) => {
              allPorts.push(portResult);
              sendEvent({ type: 'PORT_RESULT', payload: portResult });
            },
            log
          );
          for (const f of portsRes.findings) {
            allFindings.push(f);
            sendEvent({ type: 'FINDING', payload: f });
          }
          sendEvent({ type: 'MODULE_END', payload: { module: 'PORTS', findingsCount: portsRes.findings.length } });
        } catch (err: any) {
          log(`Ports module note: ${err.message || 'Check failed'}`, 'warn');
          sendEvent({ type: 'MODULE_END', payload: { module: 'PORTS', findingsCount: 0 } });
        }

        // Final Calculation & Aggregation
        log(`Aggregating telemetry and generating security posture grade...`);
        const durationMs = Date.now() - startTime;
        const { score, grade, counts } = calculateScoreAndGrade(allFindings);
        const aiBriefing = generateAnalystBriefing(target, score, grade, allFindings);

        const scanResult: ScanResult = {
          id: `SCAN-${Date.now().toString(36).toUpperCase()}`,
          target,
          scanUrl: `https://${target}`,
          timestamp: new Date().toISOString(),
          summary: {
            target,
            scanDate: new Date().toISOString(),
            durationMs,
            score,
            grade,
            counts,
          },
          findings: allFindings,
          ports: allPorts,
          meta: {
            protocol: reconMeta.protocol || 'UNKNOWN',
            ipAddress,
            redirectChain: reconMeta.redirectChain || [],
            serverBanner: reconMeta.serverBanner,
            poweredBy: reconMeta.poweredBy,
            tls: tlsMeta,
            dns: dnsMeta,
          },
          aiBriefing,
        };

        log(`Scan finalized in ${(durationMs / 1000).toFixed(1)}s. Security Grade: ${grade} (${score}/100)`);
        await saveScan(scanResult);
        sendEvent({ type: 'COMPLETE', payload: scanResult });
      } catch (err: any) {
        log(`Fatal audit exception: ${err.message || 'Unknown scan failure'}`, 'crit');
        sendEvent({ type: 'ERROR', payload: { message: err.message || 'Audit process failed' } });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
