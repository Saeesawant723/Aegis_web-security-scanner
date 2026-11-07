'use client';

const ITEMS: { label: string; color: string }[] = [
  { label: 'OPEN PORT 3306', color: '#FF3B30' },       // critical
  { label: 'MISSING HSTS', color: '#FF8A00' },         // high
  { label: 'EXPOSED .env', color: '#FF3B30' },         // critical
  { label: 'TLS 1.0 DETECTED', color: '#FF8A00' },    // high
  { label: 'NO CSP HEADER', color: '#FFD60A' },        // medium
  { label: 'WEAK CIPHER SUITE', color: '#FF8A00' },   // high
  { label: 'SERVER VERSION EXPOSED', color: '#FFD60A' }, // medium
  { label: 'MISSING DMARC', color: '#4DA3FF' },       // low
  { label: 'HTTP ONLY (NO TLS)', color: '#FF3B30' },  // critical
  { label: 'CORS MISCONFIGURED', color: '#FF8A00' },  // high
  { label: 'MISSING X-FRAME-OPTIONS', color: '#FFD60A' }, // medium
  { label: 'NO SRI ON SCRIPTS', color: '#4DA3FF' },   // low
];

const SEP = ' // ';

export default function MarqueeStrip() {
  // Duplicate for seamless loop
  const allItems = [...ITEMS, ...ITEMS];

  return (
    <div
      className="w-full overflow-hidden border-y border-border bg-panel"
      style={{ height: '38px' }}
      aria-hidden="true"
    >
      <div
        className="marquee-track h-full flex items-center"
        style={{ willChange: 'transform' }}
      >
        {allItems.map((item, i) => (
          <span
            key={i}
            className="flex items-center whitespace-nowrap flex-shrink-0"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}
          >
            <span style={{ color: item.color, letterSpacing: '0.1em' }}>
              {item.label}
            </span>
            <span style={{ color: '#444', margin: '0 4px' }}>{SEP}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
