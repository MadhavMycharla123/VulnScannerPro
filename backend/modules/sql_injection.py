import requests, re
from urllib.parse import urlparse, parse_qs, urlunparse, urlencode
requests.packages.urllib3.disable_warnings()

PAYLOADS = ["'", '"', "' OR '1'='1", "' OR 1=1--", "\" OR 1=1--",
            "1' ORDER BY 1--", "1 UNION SELECT NULL--"]

ERROR_PATTERNS = [
    r"sql syntax", r"mysql_fetch", r"ora-\d{5}", r"microsoft ole db",
    r"odbc sql server", r"sqlite_", r"pg_query", r"warning.*mysql",
    r"postgresql.*error", r"quoted string not properly terminated",
    r"unclosed quotation mark", r"syntax error.*sql",
]

def check_sql_injection(target: str) -> dict:
    result = {"module": "sqli", "status": "ok", "findings": [], "details": {},
              "vulnerable": False}
    vulnerable_params = []
    tested = []

    try:
        parsed = urlparse(target)
        params = parse_qs(parsed.query)
        base_url = urlunparse(parsed._replace(query=""))

        if not params:
            params = {"id": ["1"], "q": ["test"], "search": ["test"], "page": ["1"]}

        headers = {"User-Agent": "VulnScanner/2.0",
                   "Accept": "text/html,application/xhtml+xml"}

        for param, vals in list(params.items())[:5]:
            orig = vals[0] if vals else "1"
            tested.append(param)
            found = False

            for payload in PAYLOADS[:5]:
                try:
                    test_params = {k: v[0] if isinstance(v, list) else v
                                   for k, v in params.items()}
                    test_params[param] = orig + payload

                    resp = requests.get(base_url, params=test_params, headers=headers,
                                        timeout=8, verify=False, allow_redirects=True)
                    body = resp.text.lower()

                    for pattern in ERROR_PATTERNS:
                        if re.search(pattern, body):
                            found = True
                            vulnerable_params.append({"param": param, "payload": payload})
                            result["status"] = "critical"
                            result["vulnerable"] = True
                            result["findings"].append(
                                f"SQL INJECTION in param '{param}' with payload: {payload}")
                            break
                    if found:
                        break
                except Exception:
                    continue

            if not found:
                result["findings"].append(f"Param '{param}': No SQLi detected")

        result["details"]["tested_params"] = tested
        result["details"]["vulnerable_params"] = vulnerable_params
        result["details"]["total_vulnerable"] = len(vulnerable_params)

        if not vulnerable_params:
            if not tested:
                result["findings"].append("No URL parameters found to test")
                result["status"] = "info"
            else:
                result["findings"].append(f"No SQL injection found in {len(tested)} parameter(s)")

    except Exception as e:
        result["status"] = "error"
        result["findings"].append(f"SQLi check error: {str(e)}")

    return result
