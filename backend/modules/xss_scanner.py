import requests, re
from urllib.parse import urlparse, parse_qs, urlunparse
requests.packages.urllib3.disable_warnings()

PAYLOADS = [
    "<script>alert('xss')</script>",
    "<img src=x onerror=alert(1)>",
    "'\"><script>alert(1)</script>",
    "<svg/onload=alert(1)>",
    "javascript:alert(1)",
]
REFLECTED = [r"<script>alert", r"onerror=alert", r"onload=alert",
             r"javascript:alert", r"<svg/onload"]

def check_xss(target: str) -> dict:
    result = {"module": "xss", "status": "ok", "findings": [], "details": {},
              "vulnerable": False, "reflected_payload": ""}
    vulnerable_params = []
    tested = []

    try:
        parsed = urlparse(target)
        params = parse_qs(parsed.query)
        base_url = urlunparse(parsed._replace(query=""))

        if not params:
            params = {"q": ["test"], "search": ["test"],
                      "s": ["test"], "query": ["test"]}

        headers = {"User-Agent": "VulnScanner/2.0",
                   "Accept": "text/html,application/xhtml+xml"}

        # Check CSP
        try:
            head = requests.head(target, headers=headers, timeout=5, verify=False)
            has_csp = "content-security-policy" in {k.lower() for k in head.headers}
            result["details"]["has_csp"] = has_csp
            if has_csp:
                result["findings"].append("CSP header detected — mitigates XSS risk")
        except Exception:
            result["details"]["has_csp"] = False

        for param, vals in list(params.items())[:5]:
            tested.append(param)
            found = False

            for payload in PAYLOADS:
                try:
                    test_params = {k: v[0] if isinstance(v, list) else v
                                   for k, v in params.items()}
                    test_params[param] = payload

                    resp = requests.get(base_url, params=test_params, headers=headers,
                                        timeout=8, verify=False, allow_redirects=True)
                    body = resp.text.lower()

                    for pattern in REFLECTED:
                        if re.search(pattern, body):
                            found = True
                            vulnerable_params.append({"param": param, "payload": payload})
                            result["status"] = "critical"
                            result["vulnerable"] = True
                            result["reflected_payload"] = payload
                            result["findings"].append(
                                f"XSS REFLECTED in param '{param}': {payload[:40]}")
                            break
                    if found:
                        break
                except Exception:
                    continue

            if not found:
                result["findings"].append(f"Param '{param}': No XSS detected")

        result["details"]["tested_params"] = tested
        result["details"]["vulnerable_params"] = vulnerable_params
        result["details"]["total_vulnerable"] = len(vulnerable_params)

        if not vulnerable_params:
            if not tested:
                result["findings"].append("No URL parameters found to test for XSS")
                result["status"] = "info"
            else:
                result["findings"].append(f"No XSS found in {len(tested)} parameter(s)")

    except Exception as e:
        result["status"] = "error"
        result["findings"].append(f"XSS check error: {str(e)}")

    return result
