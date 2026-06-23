"""AI Recommendations Engine — generates actionable security fixes"""

def generate_recommendations(results: dict) -> list:
    recs = []

    if results.get("sqli", {}).get("vulnerable"):
        recs.append({
            "title": "Fix SQL Injection Vulnerabilities",
            "priority": "Critical",
            "fix": ("Replace raw SQL with parameterised statements or an ORM (SQLAlchemy, Django ORM). "
                    "Never concatenate user input into queries. Apply input validation and deploy a WAF."),
            "reference": "https://owasp.org/www-community/attacks/SQL_Injection",
        })

    if results.get("xss", {}).get("vulnerable"):
        recs.append({
            "title": "Implement XSS Protection",
            "priority": "High",
            "fix": ("Encode all user data before rendering using htmlspecialchars(). "
                    "Implement a strict Content-Security-Policy header. "
                    "Sanitise input using DOMPurify (JS) or bleach (Python)."),
            "reference": "https://owasp.org/www-community/attacks/xss/",
        })

    if results.get("csrf", {}).get("vulnerable"):
        recs.append({
            "title": "Add CSRF Protection",
            "priority": "Medium",
            "fix": ("Generate unique per-session CSRF tokens in all state-changing forms. "
                    "Validate server-side on every POST/PUT/DELETE. Set SameSite=Strict on cookies."),
            "reference": "https://owasp.org/www-community/attacks/csrf",
        })

    missing = results.get("headers", {}).get("details", {}).get("missing_headers", [])
    HEADER_FIXES = {
        "Content-Security-Policy": ("Implement CSP Header",
            "Add 'Content-Security-Policy: default-src \\'self\\'' to prevent XSS and injection attacks.",
            "https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP"),
        "Strict-Transport-Security": ("Enable HSTS",
            "Add 'Strict-Transport-Security: max-age=31536000; includeSubDomains' to force HTTPS.",
            "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security"),
        "X-Frame-Options": ("Block Clickjacking",
            "Add 'X-Frame-Options: DENY' to prevent your site being embedded in iframes.",
            "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options"),
        "X-Content-Type-Options": ("Prevent MIME Sniffing",
            "Add 'X-Content-Type-Options: nosniff' to prevent MIME type confusion attacks.",
            "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options"),
        "Referrer-Policy": ("Set Referrer Policy",
            "Add 'Referrer-Policy: no-referrer-when-downgrade' to control referrer leakage.",
            "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy"),
    }
    for h in missing:
        if h["name"] in HEADER_FIXES:
            title, fix, ref = HEADER_FIXES[h["name"]]
            recs.append({"title": title, "priority": "Medium",
                          "fix": fix, "reference": ref})

    ssl = results.get("ssl", {}).get("details", {})
    if ssl.get("daysLeft", 999) <= 30 or ssl.get("selfSigned"):
        recs.append({
            "title": "Fix SSL Certificate Issues",
            "priority": "High",
            "fix": ("Renew SSL certificate using Let's Encrypt (free). Replace self-signed certificates "
                    "with CA-issued ones. Upgrade to TLS 1.3 and disable TLS 1.0/1.1."),
            "reference": "https://letsencrypt.org/",
        })

    return recs
