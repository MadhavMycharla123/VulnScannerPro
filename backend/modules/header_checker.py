import requests
requests.packages.urllib3.disable_warnings()

SECURITY_HEADERS = [
    {"name": "Strict-Transport-Security", "desc": "Forces HTTPS (HSTS)", "severity": "high"},
    {"name": "Content-Security-Policy",   "desc": "Prevents XSS/injection", "severity": "high"},
    {"name": "X-Frame-Options",           "desc": "Prevents clickjacking", "severity": "high"},
    {"name": "X-Content-Type-Options",    "desc": "Prevents MIME sniffing", "severity": "medium"},
    {"name": "Referrer-Policy",           "desc": "Controls referrer info", "severity": "medium"},
    {"name": "Permissions-Policy",        "desc": "Controls browser APIs", "severity": "medium"},
    {"name": "X-XSS-Protection",         "desc": "Browser XSS filter", "severity": "low"},
]
LEAKY = ["Server", "X-Powered-By", "X-AspNet-Version", "X-Generator"]

def check_headers(target: str) -> dict:
    result = {"module": "headers", "status": "ok", "findings": [], "details": {}}
    try:
        resp = requests.get(target, timeout=10, allow_redirects=True,
                            headers={"User-Agent": "VulnScanner/2.0"},
                            verify=False)
        headers = {k.lower(): v for k, v in resp.headers.items()}

        present, missing = [], []
        for h in SECURITY_HEADERS:
            if h["name"].lower() in headers:
                present.append({"name": h["name"], "value": headers[h["name"].lower()],
                                 "desc": h["desc"], "present": True})
            else:
                missing.append({"name": h["name"], "desc": h["desc"],
                                 "severity": h["severity"], "present": False})

        result["details"]["present_headers"] = present
        result["details"]["missing_headers"] = missing
        result["details"]["security_score"] = f"{len(present)}/{len(SECURITY_HEADERS)}"
        result["details"]["status_code"] = resp.status_code
        result["details"]["final_url"] = resp.url

        high_missing = [m for m in missing if m["severity"] == "high"]
        if high_missing:
            result["status"] = "critical"
            for m in high_missing:
                result["findings"].append(f"MISSING critical header: {m['name']} — {m['desc']}")
        elif missing:
            result["status"] = "warning"

        for m in missing:
            if m["severity"] != "high":
                result["findings"].append(f"Missing: {m['name']} — {m['desc']}")

        leaky = []
        for lh in LEAKY:
            val = resp.headers.get(lh)
            if val:
                leaky.append(f"{lh}: {val}")
                result["findings"].append(f"Info disclosure: {lh} = {val}")
        result["details"]["leaky_headers"] = leaky

        result["findings"].append(f"Security score: {len(present)}/{len(SECURITY_HEADERS)}")

        if not missing:
            result["findings"].insert(0, "All critical security headers are present!")

    except Exception as e:
        result["status"] = "error"
        result["findings"].append(f"Headers check error: {str(e)}")

    return result
