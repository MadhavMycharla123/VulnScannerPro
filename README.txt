╔══════════════════════════════════════════════════════════════════════╗
║          VulnScanner Pro v2.0 — Web Vulnerability Scanner           ║
║   Student : MYCHARLA MADHAVKUMAR | Roll: 324227760022               ║
║   College : GITAM University | MCA Department | 2025-26             ║
╚══════════════════════════════════════════════════════════════════════╝

TECH STACK
──────────
Frontend  : Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui
Backend   : FastAPI (Python) + SQLite
AI Engine : Weighted risk scoring + actionable recommendations

SCAN MODULES (8 total)
──────────────────────
1. SSL Certificate  — Expiry, TLS version, self-signed detection
2. HTTP Headers     — 5 critical security headers checked
3. SQL Injection    — Error-based and blind SQLi detection
4. XSS Detection    — Reflected cross-site scripting
5. CSRF Protection  — Token and SameSite cookie checks
6. IP Geolocation   — Server location, ISP, timezone
7. WHOIS Lookup     — Domain registration info (optional)
8. Port Scan        — Open ports via Nmap/socket (optional)

QUICK START
───────────
Step 1 — Start the backend:
    cd backend
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000

Step 2 — Start the frontend (new terminal):
    cd frontend
    pnpm install        (or: npm install)
    pnpm dev            (or: npm run dev)

Step 3 — Open browser:
    http://localhost:3000

CHANGES IN v2.0
───────────────
• Fixed: Scan detail page now auto-polls every 5s until scan completes
• Fixed: Score breakdown bars now use correct max per category (SQLi=30, XSS=25, etc.)
• Fixed: Next.js 15 async params in dynamic API route
• Fixed: FastAPI deprecated @on_event replaced with lifespan context manager
• Fixed: CORS locked to localhost:3000/3001 (was wildcard *)
• Fixed: IP geolocation error handling and status validation
• Added: scoreCaps returned from backend so frontend bars are always accurate
• Added: DELETE handler in scan API route
• Added: Refresh button on scan detail page when scan is running
• Added: lxml parser in requirements for faster/safer HTML parsing

NOTES
─────
• nmap is optional — port scan falls back to socket scanning if nmap not installed
• PDF export opens browser print dialog — use "Save as PDF" in print dialog
• ip-api.com free tier uses HTTP (HTTPS requires paid plan) — this is expected

