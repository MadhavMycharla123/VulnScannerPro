import requests
from bs4 import BeautifulSoup
requests.packages.urllib3.disable_warnings()

CSRF_NAMES = ["csrf_token", "_token", "authenticity_token",
              "csrfmiddlewaretoken", "__RequestVerificationToken"]

def check_csrf(target: str) -> dict:
    result = {"module": "csrf", "status": "ok", "findings": [], "details": {},
              "vulnerable": False}
    try:
        resp = requests.get(target, timeout=8, verify=False,
                            headers={"User-Agent": "VulnScanner/2.0"})
        soup = BeautifulSoup(resp.text, "html.parser")
        forms = soup.find_all("form")

        token_found = False
        for form in forms:
            for name in CSRF_NAMES:
                if form.find("input", {"name": name}):
                    token_found = True
                    break

        samesite_ok = any(
            getattr(c, "_rest", {}).get("SameSite") for c in resp.cookies
        )
        xfo = resp.headers.get("X-Frame-Options", "")
        vulnerable = len(forms) > 0 and not token_found

        result["vulnerable"] = vulnerable
        result["details"]["forms_checked"] = len(forms)
        result["details"]["token_found"] = token_found
        result["details"]["samesite_ok"] = samesite_ok
        result["details"]["x_frame_options"] = xfo

        if vulnerable:
            result["status"] = "warning"
            result["findings"].append(
                f"CSRF risk: {len(forms)} form(s) found without CSRF tokens")
            if not samesite_ok:
                result["findings"].append("Session cookies missing SameSite attribute")
        else:
            result["findings"].append(f"CSRF tokens present in {len(forms)} form(s)")
            if samesite_ok:
                result["findings"].append("SameSite cookie attribute is set")

        if not xfo:
            result["findings"].append("X-Frame-Options header missing — clickjacking risk")
        else:
            result["findings"].append(f"X-Frame-Options: {xfo}")

        if not forms:
            result["findings"].append("No HTML forms found on the page")

    except Exception as e:
        result["status"] = "error"
        result["findings"].append(f"CSRF check error: {str(e)}")

    return result
