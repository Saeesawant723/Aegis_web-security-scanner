Build a complete web security assessment platform called "AEGIS//AI". The user enters a website URL, the platform runs safe, non-destructive security checks (beginner to advanced, including open ports) against the REAL target, and then shows an animated report with severity-rated findings plus an AI-written summary. This is a Software Engineering college project and must be extremely visually impressive to professors, while looking hand-crafted by a talented student, NOT like a generic AI-generated SaaS template.

══════════ 1. DESIGN IDENTITY ══════════
Style: brutalist mission-control / command-center. Black theme with a strong point of view.

ANTI-TEMPLATE RULES (strict):
- NO purple/blue gradients, NO glassmorphism or blur cards, NO gradient-text headlines, NO centered "hero with two buttons", NO emoji icons, NO Inter/Poppins, NO identical rounded card grids, NO stock illustrations, NO default shadcn styling (restyle every component).
- Copy must be short, blunt and slightly witty, in the voice of a security analyst (e.g., "Your site has 7 problems. Let's talk about them."). No marketing filler.

PALETTE (only these): background #070707, panels #0E0E0E, borders #222 (hard 1px), text #EDEDED, muted #777, ONE accent acid green #B6FF00 (actions and secure states), danger red #FF3B30 (critical only). Severity: Critical #FF3B30, High #FF8A00, Medium #FFD60A, Low #4DA3FF, Info #777.

TYPOGRAPHY: headlines in "Bricolage Grotesque" (or Syne/Unbounded), very large with tight tracking. Technical data in "JetBrains Mono". Tiny uppercase letter-spaced labels (10-11px) for a blueprint feel.

LAYOUT LANGUAGE: sharp corners (0-4px radius), hard borders, visible grid lines, corner brackets on panels (they expand on hover), crosshair/registration marks, numbered sections like "[01] RECON". Asymmetric, left-aligned layouts. Subtle film-grain overlay and faint scanlines site-wide. A few deliberate human touches: a slightly rotated "v0.1 student build" sticker, slightly offset elements, a changelog-style footer with team names.

══════════ 2. SCREENS & SIGNATURE MOTION ══════════
LANDING PAGE:
- Giant left-aligned headline that glitch-resolves letter by letter: "FIND THE HOLES BEFORE THEY DO."
- Full-width terminal-style URL input (">_ https://" with blinking cursor) and a hard-offset-shadow "SCAN" button that shifts on press.
- Background: custom canvas dot-matrix world map with pulsing dots and thin arcs.
- Scrolling marquee strip: "OPEN PORT 3306 // MISSING HSTS // EXPOSED .env // TLS 1.0 DETECTED //"
- Sections [01] RECON, [02] ANALYSIS, [03] AI BRIEFING in corner-bracket panels.
- Quick-pick links for the safe demo targets under the input.

LIVE SCAN SCREEN:
1. Validate and normalize the URL with instant inline feedback. If the user typed http:// (not https://), remember it: the protocol check must report it.
2. Consent step: checkbox "I own this site or have written permission to test it." Log consent (timestamp, target, IP, user) in the database. The scan cannot start without it.
3. Full-screen custom SVG/canvas radar with rotating sweep line, target domain at center, and each check appearing as a blip (colored by severity) when it completes.
4. Right: live log panel with timestamps streaming REAL progress via Server-Sent Events ("[00:03] Checking HSTS... MISSING"). Left: module status list (pending / running / done, with finding count).
5. Each finding "stamps" in with a short screen shake and severity color flash (optional mutable sound).
6. Stepped (not smooth) progress bar at the bottom, one segment per module.
7. On completion, horizontal wipe transition to the report.

REPORT PAGE:
- Giant security grade letter (A-F) that flickers like a CRT before settling, a 0-100 risk score that counts up, severity counts as stat blocks with stepped-fill bars.
- Charts (Recharts, restyled to match): severity breakdown, category radar, score trend per target over time.
- Findings grouped by category as expandable panels: severity badge, description, affected asset, evidence (raw monospace request/response snippet), remediation steps with copy-paste fix, OWASP/CWE links.
- Open-ports table with risk indicators.
- Filters by severity/category and search.
- Export branded PDF and JSON.
- Scan history per target with re-scan and comparison view.

OTHER MOTION/POLISH: hover states that invert colors or expand corner brackets, brutalist hard-offset button shadows, custom Framer Motion easing (never default fade-up), custom cursor, custom scrollbar and selection color, keyboard shortcut overlay on "?", custom 404 ("This page was not found. Unlike your vulnerabilities."), hidden /about page with team names and "how we built it" for the professors. 60fps, respect prefers-reduced-motion, responsive down to mobile, no layout shift.

LOGO: simple geometric shield/eye SVG with a scan-line animation, wordmark "AEGIS//AI".

══════════ 3. APP STRUCTURE ══════════
- Collapsible left sidebar: Dashboard, New Scan, Scan History, Reports, Settings.
- Dashboard: overall posture score, recent scans, vulnerability trend chart, most common issues.
- Simple auth (email/password or OAuth) so scan history is per user.

══════════ 4. SECURITY CHECKS (safe, non-destructive only) ══════════
Beginner:
- Protocol: request http://host and record whether it redirects to https:// (status codes, hop count, final URL). Flag "HTTPS not enforced" as Critical if plain HTTP is served without redirecting, or if the user supplied an http:// URL that stays on HTTP.
- HTTP security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- Mixed content
- Cookie flags (Secure, HttpOnly, SameSite)
- Server / X-Powered-By version disclosure
- robots.txt and sitemap.xml exposure of sensitive paths
Intermediate:
- TLS/SSL: certificate validity, expiry (days remaining), issuer, protocol versions (flag TLS 1.0/1.1), weak ciphers
- Exposed sensitive files (GET only, status/content check): /.env, /.git/config, /.DS_Store, backup/config files
- Outdated JS libraries fingerprinted from script tags and checked against the retire.js dataset
- CORS misconfiguration (response headers only)
- DNS: SPF, DMARC, DKIM, nameservers, DNSSEC
- Technology/CMS fingerprinting
Advanced (still non-intrusive):
- Open port detection: TCP connect check on a SMALL fixed list of common ports only (21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 3306, 3389, 5432, 6379, 8080, 8443, 27017) with short timeouts and low concurrency. Report open ports, likely service, and exposure risk. No banner exploitation, no full-range scans.
- Subresource Integrity on third-party scripts
- security.txt presence and clickjacking protection
- Email-spoofing risk derived from SPF/DMARC

SCORING: start at 100 and subtract per finding (Critical 25, High 12, Medium 6, Low 2, Info 0), floor 0. Grade: A >= 90, B >= 80, C >= 65, D >= 50, else F.

OUT OF SCOPE, do NOT implement: SQL injection/XSS/command injection payloads, directory or login brute-forcing, exploit code, denial-of-service, full port-range scans, or anything that sends attack payloads. Findings are reported, never exploited.

══════════ 5. AI SUMMARY LAYER ══════════
- After the scan, send the structured findings JSON to an LLM API (Claude or Gemini). Keep the API key server-side in environment variables, never in the browser.
- Generate: (a) a plain-English executive summary, (b) top 3 priority fixes, (c) a prioritized remediation roadmap, (d) per-finding "explain like I'm a beginner" text with copy-paste fix snippets (nginx/Apache header configs, etc.).
- Display it in an "Analyst Terminal" panel styled as an intelligence briefing: header "REPORT // CONFIDENTIAL", typed-out streaming text, stamped risk level (e.g., CRITICAL RISK / ELEVATED RISK / LOW RISK).
- Add an "Ask AEGIS" chat box for follow-up questions about the report (the model sees only that report's data).
- The LLM must only give defensive remediation advice and never produce exploit instructions.

══════════ 6. TECH STACK ══════════
- Frontend: Next.js (App Router) + TypeScript + Tailwind + Framer Motion + Recharts + canvas/SVG for custom animations.
- Backend: Node.js (Next.js API routes or Express) or Python FastAPI, with a job queue and SSE/WebSocket for live progress.
- Database: PostgreSQL (or SQLite for demo) via Prisma: users, targets, scans, findings, consent_logs.
- Clean architecture: each check is its own module implementing a common interface (name, category, run(target) returns findings[]). Include unit tests for checks and a README with an architecture diagram, setup steps and an ethics/legal notice.

══════════ 7. SAFETY & ABUSE PREVENTION (must implement) ══════════
- Mandatory logged consent checkbox.
- Block private/internal IP ranges, localhost and cloud metadata endpoints (e.g., 169.254.169.254) to prevent SSRF. Resolve DNS and re-check the IP before connecting, and again on every redirect hop.
- Rate limiting per user/IP, request timeouts, concurrency limits, max-redirect limit.
- Domain ownership verification (DNS TXT record or verification file) required before the port check runs on any non-demo target.
- "Demo Mode" with safe targets that explicitly allow testing (scanme.nmap.org, testphp.vulnweb.com, example.com).
- "Mock Data" fallback so the entire UI and report can be demoed offline if the network fails during the presentation.

══════════ 8. REAL RESULTS (NO FAKE DATA IN REAL SCANS) ══════════
- Every finding must come from a real network check run server-side. The browser cannot do this (CORS), so all checks run in Node/FastAPI.
- Protocol: request http://host first, record redirect behaviour, then request https://host and record status, response time and all raw response headers.
- Headers: read headers from the real HTTPS response and report each missing or weak one with the actual value (or "absent") as evidence.
- TLS: use Node tls.connect (or Python ssl) to read the real certificate (issuer, valid_from/to, days to expiry), the negotiated protocol, and test whether TLS 1.0/1.1 are accepted.
- DNS: real TXT/MX/NS lookups for SPF, DMARC (_dmarc.host), common DKIM selectors, DNSSEC.
- Files: GET-only requests to /.env, /.git/config, /robots.txt, /.well-known/security.txt. Flag a sensitive file only on HTTP 200 plus a content match, never on soft-404 pages.
- Ports: real TCP connect on the fixed list, 1.5s timeout, concurrency 3.
- Evidence: store the raw request/response snippet with every finding and show it in the report.
- If a check fails or times out, show "UNABLE TO VERIFY" for that module. Never guess or invent a result.
- Mock Data mode must be clearly labelled "SIMULATED" in the UI and must never be mixed with real results.

══════════ 9. DELIVERY ORDER ══════════
Step 1: Landing page + design system + animations (mock data).
Step 2: Consent flow + radar live-scan screen (mock data).
Step 3: Report page, charts, grade animation.
Step 4: Backend with real checks (protocol/redirect, headers, TLS, cookies, exposed files, DNS) and SSE progress.
Step 5: Open-port check, remaining modules, safety layer.
Step 6: AI summary + chat, PDF export, auth, history, README.
Build step by step and make sure each step runs and looks right before moving on. After each step, show me the result so I can send feedback. Do Step 1 only first.
