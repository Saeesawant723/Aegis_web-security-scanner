import net from 'net';
import { Finding, PortCheckResult, Severity } from '@/types/scan';

interface PortDef {
  port: number;
  service: string;
  defaultRisk: Severity;
  description: string;
}

const TARGET_PORTS: PortDef[] = [
  { port: 21, service: 'FTP', defaultRisk: 'MEDIUM', description: 'File Transfer Protocol. Often used for administrative web uploads.' },
  { port: 22, service: 'SSH', defaultRisk: 'LOW', description: 'Secure Shell remote terminal access.' },
  { port: 23, service: 'Telnet', defaultRisk: 'CRITICAL', description: 'Unencrypted legacy remote access. Highly vulnerable to sniffers.' },
  { port: 25, service: 'SMTP', defaultRisk: 'LOW', description: 'Simple Mail Transfer Protocol relay service.' },
  { port: 53, service: 'DNS', defaultRisk: 'LOW', description: 'Domain Name System resolver port.' },
  { port: 80, service: 'HTTP', defaultRisk: 'INFO', description: 'Standard unencrypted web server port.' },
  { port: 110, service: 'POP3', defaultRisk: 'LOW', description: 'Post Office Protocol for email downloads.' },
  { port: 143, service: 'IMAP', defaultRisk: 'LOW', description: 'Internet Message Access Protocol.' },
  { port: 443, service: 'HTTPS', defaultRisk: 'INFO', description: 'Standard encrypted web server port.' },
  { port: 445, service: 'SMB', defaultRisk: 'CRITICAL', description: 'Server Message Block / Windows file sharing. Frequent ransomware vector.' },
  { port: 3306, service: 'MySQL', defaultRisk: 'HIGH', description: 'MySQL Database service listening on public network interface.' },
  { port: 3389, service: 'RDP', defaultRisk: 'HIGH', description: 'Remote Desktop Protocol. Target for external brute-force attacks.' },
  { port: 5432, service: 'PostgreSQL', defaultRisk: 'HIGH', description: 'PostgreSQL Database engine exposed to external network.' },
  { port: 6379, service: 'Redis', defaultRisk: 'HIGH', description: 'Redis memory cache. Often configured without authentication by default.' },
  { port: 8080, service: 'HTTP-Alt', defaultRisk: 'LOW', description: 'Secondary web server or development proxy listener.' },
  { port: 8443, service: 'HTTPS-Alt', defaultRisk: 'INFO', description: 'Secondary encrypted web administration portal.' },
  { port: 27017, service: 'MongoDB', defaultRisk: 'HIGH', description: 'MongoDB NoSQL database engine exposed to public network.' },
];

export async function checkOpenPorts(
  target: string,
  onPortResult: (result: PortCheckResult) => void,
  onLog: (msg: string, level?: 'info' | 'warn' | 'crit') => void
): Promise<{ ports: PortCheckResult[]; findings: Finding[] }> {
  const ports: PortCheckResult[] = [];
  const findings: Finding[] = [];

  onLog(`Commencing parallel TCP connect probes across 17 perimeter ports...`);

  // Run all 17 ports in parallel with 1200ms timeout for ultra-fast response
  const results = await Promise.all(TARGET_PORTS.map((p) => probePort(target, p)));

  for (const res of results) {
    ports.push(res);
    onPortResult(res);

    if (res.status === 'OPEN') {
      const isWarn = ['CRITICAL', 'HIGH'].includes(res.risk);
      onLog(`[PORT ${res.port}] OPEN: ${res.service} (${res.risk} Risk)`, isWarn ? 'warn' : 'info');

      // Only add to findings if it represents an unnecessary exposure
      if (['CRITICAL', 'HIGH', 'MEDIUM'].includes(res.risk)) {
        findings.push({
          id: `FIND-PORT-${res.port}`,
          title: `Public Service Port Exposure: ${res.port}/${res.service}`,
          category: 'PORTS',
          severity: res.risk,
          description: `TCP port ${res.port} (${res.service}) is reachable and open to external hosts. ${res.description}`,
          affectedAsset: `${target}:${res.port}`,
          evidence: `TCP Handshake successfully completed on port ${res.port}`,
          remediation:
            'Bind the service to localhost (127.0.0.1) or restrict network ingress via cloud firewall / security groups to authorized VPN IP addresses.',
          codeSnippet: `# Linux UFW Firewall\nsudo ufw deny ${res.port}/tcp\nsudo ufw reload`,
          cwe: 'CWE-284',
          owasp: 'A05:2021 - Security Misconfiguration',
        });
      }
    }
  }

  return { ports, findings };
}

function probePort(host: string, def: PortDef): Promise<PortCheckResult> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const finalize = (status: 'OPEN' | 'CLOSED' | 'TIMEOUT') => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve({
        port: def.port,
        service: def.service,
        status,
        risk: status === 'OPEN' ? def.defaultRisk : 'INFO',
        description: def.description,
      });
    };

    socket.setTimeout(1200);

    socket.on('connect', () => {
      finalize('OPEN');
    });

    socket.on('timeout', () => {
      finalize('TIMEOUT');
    });

    socket.on('error', () => {
      finalize('CLOSED');
    });

    try {
      socket.connect(def.port, host);
    } catch {
      finalize('CLOSED');
    }
  });
}
