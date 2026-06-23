"""AI Risk Scoring Engine — weighted vulnerability scoring"""

# Maximum points each category can contribute (used by frontend for bar widths)
CAPS = {
    "sqlInjection": 30,
    "xss":          25,
    "csrf":         15,
    "headers":      20,
    "ssl":          15,
    "ports":        10,
}

def calculate_risk(results: dict) -> dict:
    score = 0
    breakdown = {k: 0 for k in CAPS}

    # SQL Injection — 30 pts
    if results.get("sqli", {}).get("vulnerable"):
        breakdown["sqlInjection"] = 30
        score += 30

    # XSS — 25 pts
    if results.get("xss", {}).get("vulnerable"):
        breakdown["xss"] = 25
        score += 25

    # CSRF — 15 pts
    if results.get("csrf", {}).get("vulnerable"):
        breakdown["csrf"] = 15
        score += 15

    # Missing security headers — up to 20 pts (4 pts each, max 5 headers)
    headers_result = results.get("headers", {})
    missing = headers_result.get("details", {}).get("missing_headers", [])
    header_pts = min(len(missing) * 4, 20)
    breakdown["headers"] = header_pts
    score += header_pts

    # SSL issues — up to 15 pts
    ssl = results.get("ssl", {})
    ssl_pts = 0
    if ssl.get("details", {}).get("daysLeft", 999) <= 0:
        ssl_pts += 10
    if ssl.get("details", {}).get("selfSigned"):
        ssl_pts += 5
    if ssl.get("status") == "warning" and ssl_pts == 0:
        ssl_pts = 5
    breakdown["ssl"] = min(ssl_pts, 15)
    score += breakdown["ssl"]

    # Open risky ports — up to 10 pts
    nmap = results.get("nmap", {})
    risky_ports = [p for p in nmap.get("details", {}).get("open_ports", [])
                   if p["port"] in [21, 23, 3306, 3389, 5432, 6379, 27017]]
    port_pts = min(len(risky_ports) * 5, 10)
    breakdown["ports"] = port_pts
    score += port_pts

    score = min(score, 100)

    if score >= 75:
        level, color = "CRITICAL", "#dc2626"
    elif score >= 50:
        level, color = "HIGH",     "#ea580c"
    elif score >= 25:
        level, color = "MEDIUM",   "#d97706"
    else:
        level, color = "LOW",      "#16a34a"

    return {
        "score":     score,
        "level":     level,
        "color":     color,
        "breakdown": breakdown,
        "caps":      CAPS,          # sent to frontend so bars use correct max per category
    }
