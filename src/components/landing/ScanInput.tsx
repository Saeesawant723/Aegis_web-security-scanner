'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

const DEMO_TARGETS = [
  { label: 'tcetmumbai.in', url: 'tcetmumbai.in' },
  { label: 'google.com', url: 'google.com' },
  { label: 'instagram.com', url: 'instagram.com' },
  { label: 'netflix.com', url: 'netflix.com' },
  { label: 'scanme.nmap.org', url: 'scanme.nmap.org' },
];

export default function ScanInput() {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function normalizeDomain(raw: string): string {
    let v = raw.trim().toLowerCase();
    if (!v) return '';
    // Strip protocol
    v = v.replace(/^https?:\/\//i, '');
    // Strip path, query params, hash
    v = v.split('/')[0];
    v = v.split('?')[0];
    v = v.split('#')[0];
    // Strip port if present
    v = v.split(':')[0];
    // Strip leading/trailing dots
    v = v.replace(/^\.+|\.+$/g, '');

    // Auto-append .com if user types a bare domain name (e.g. "instagram", "netflix", "google")
    if (v && !v.includes('.') && v !== 'localhost') {
      v = `${v}.com`;
    }
    return v;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const domain = normalizeDomain(value);
    if (!domain) {
      setError('Enter a domain to scan.');
      inputRef.current?.focus();
      return;
    }
    // Domain shape check
    if (!/^[a-z0-9]([a-z0-9\-.]+)?[a-z0-9]$/.test(domain)) {
      setError('That doesn\'t look like a valid domain. Try: example.com');
      return;
    }
    setError('');
    // Navigate to scan page
    router.push(`/scan?target=${encodeURIComponent(domain)}`);
  }

  function handleQuickPick(url: string) {
    setValue(url);
    setError('');
    inputRef.current?.focus();
  }

  const showCursor = !focused && value === '';

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} autoComplete="off" noValidate>
        {/* Terminal input row */}
        <div
          className={`relative flex items-center border bg-panel transition-all duration-150 ${
            focused
              ? 'border-accent shadow-[0_0_20px_rgba(182,255,0,0.18)]'
              : error
              ? 'border-danger'
              : 'border-border hover:border-zinc-700'
          }`}
          style={{ minHeight: '62px' }}
          onClick={() => inputRef.current?.focus()}
        >
          {/* Corner brackets */}
          <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-accent pointer-events-none" />
          <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-accent pointer-events-none" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-accent pointer-events-none" />
          <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-accent pointer-events-none" />

          {/* Terminal prefix */}
          <span
            className="px-4 text-accent font-mono text-base select-none whitespace-nowrap flex-shrink-0"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '15px' }}
          >
            &gt;_ https://
          </span>

          {/* Input field */}
          <div className="relative flex-1 flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => { setValue(e.target.value); setError(''); }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={focused ? 'enter target domain or IP...' : 'enter domain (e.g. tcetmumbai.in, google.com)'}
              spellCheck={false}
              className="w-full bg-transparent text-text outline-none border-none placeholder:text-muted/60"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '15px',
                caretColor: '#B6FF00',
                padding: '0',
              }}
              aria-label="Target domain"
            />
            {/* Blinking cursor when empty and unfocused */}
            {showCursor && (
              <span
                className="absolute left-0 top-1/2 -translate-y-1/2 w-[9px] h-[18px] bg-accent"
                style={{ animation: 'blink-cursor 1s step-end infinite' }}
                aria-hidden="true"
              />
            )}
          </div>

          {/* SCAN button */}
          <motion.button
            type="submit"
            className="relative m-2 px-7 py-3 bg-accent text-bg font-mono font-bold tracking-widest uppercase text-sm select-none flex-shrink-0 hover:shadow-[0_0_20px_rgba(182,255,0,0.4)]"
            style={{
              fontFamily: 'var(--font-mono)',
              boxShadow: '4px 4px 0 rgba(0,0,0,0.7)',
              letterSpacing: '0.12em',
            }}
            whileHover={{
              y: -2,
              boxShadow: '6px 6px 0 rgba(0,0,0,0.8)',
            }}
            whileTap={{
              y: 2,
              boxShadow: '1px 1px 0 rgba(0,0,0,0.5)',
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            SCAN
          </motion.button>
        </div>

        {/* Error line */}
        {error && (
          <p
            className="mt-2 text-danger font-mono text-xs tracking-wider"
            role="alert"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            !! {error}
          </p>
        )}
      </form>

      {/* Quick-pick targets */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span
          className="text-muted font-mono uppercase tracking-widest mr-1"
          style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}
        >
          TARGET BENCHMARKS:
        </span>
        {DEMO_TARGETS.map((t) => (
          <button
            key={t.url}
            type="button"
            onClick={() => handleQuickPick(t.url)}
            className="px-2.5 py-1 bg-black/60 border border-border text-muted hover:text-accent hover:border-accent font-mono text-xs transition-colors flex items-center gap-1.5 hover:bg-accent/5"
            style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}
          >
            <span className="text-accent text-[9px]">▸</span>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
