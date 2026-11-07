import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg text-text flex flex-col items-center justify-center px-6">
      <div
        className="border border-border bg-panel p-12 max-w-md w-full relative"
        style={{ maxWidth: '480px' }}
      >
        {/* Corner marks */}
        <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-accent" style={{ top: '-1px', left: '-1px' }} />
        <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-accent" style={{ top: '-1px', right: '-1px' }} />
        <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-accent" style={{ bottom: '-1px', left: '-1px' }} />
        <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-accent" style={{ bottom: '-1px', right: '-1px' }} />

        <p
          className="text-muted font-mono uppercase tracking-widest mb-4"
          style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}
        >
          [ERROR] 404 // PAGE NOT FOUND
        </p>
        <h1
          className="font-display font-bold text-text mb-4"
          style={{ fontSize: '3rem', letterSpacing: '-0.04em', lineHeight: '0.95' }}
        >
          404.
        </h1>
        <p
          className="text-muted font-mono mb-8"
          style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', lineHeight: '1.7' }}
        >
          This page was not found.
          <br />
          Unlike your vulnerabilities.
        </p>
        <Link
          href="/"
          className="font-mono text-accent border border-accent px-4 py-2 hover:bg-accent hover:text-bg transition-colors inline-block"
          style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}
        >
          ← RETURN TO SCAN
        </Link>
      </div>
    </div>
  );
}
