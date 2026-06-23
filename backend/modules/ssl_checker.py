import ssl, socket
from datetime import datetime
from urllib.parse import urlparse

def check_ssl(target: str) -> dict:
    result = {"module": "ssl", "status": "ok", "findings": [], "details": {}}
    try:
        parsed = urlparse(target)
        hostname = parsed.hostname
        port = parsed.port or 443

        if parsed.scheme != "https":
            result["status"] = "warning"
            result["findings"].append("Site does not use HTTPS — traffic is unencrypted")
            result["details"]["https"] = False
            result["details"]["daysLeft"] = 999
            result["details"]["selfSigned"] = False
            return result

        ctx = ssl.create_default_context()
        with socket.create_connection((hostname, port), timeout=10) as sock:
            with ctx.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()
                cipher = ssock.cipher()

        expire_str = cert.get("notAfter", "")
        days_left = 999
        if expire_str:
            expire_dt = datetime.strptime(expire_str, "%b %d %H:%M:%S %Y %Z")
            days_left = (expire_dt - datetime.utcnow()).days
            result["details"]["expires_on"] = expire_str
            result["details"]["days_until_expiry"] = days_left
            result["details"]["daysLeft"] = days_left
            if days_left < 0:
                result["status"] = "critical"
                result["findings"].append(f"SSL certificate EXPIRED {abs(days_left)} days ago!")
            elif days_left < 30:
                result["status"] = "warning"
                result["findings"].append(f"SSL certificate expires in {days_left} days — renew soon")
            else:
                result["findings"].append(f"SSL certificate valid for {days_left} more days")

        issuer = dict(x[0] for x in cert.get("issuer", []))
        subject = dict(x[0] for x in cert.get("subject", []))
        org = issuer.get("organizationName", "Unknown")
        self_signed = (issuer == subject)

        result["details"]["issuer"] = org
        result["details"]["subject"] = subject.get("commonName", hostname)
        result["details"]["selfSigned"] = self_signed
        result["details"]["https"] = True
        result["details"]["cipher"] = cipher[0] if cipher else "Unknown"
        result["details"]["tls_version"] = cipher[1] if cipher else "Unknown"

        if self_signed:
            result["status"] = "warning"
            result["findings"].append("Self-signed certificate detected — not trusted by browsers")

        tls = cipher[1] if cipher else ""
        if "TLSv1.0" in tls or "TLSv1.1" in tls:
            result["status"] = "warning"
            result["findings"].append(f"Outdated TLS version: {tls} — upgrade to TLS 1.3")
        else:
            result["findings"].append(f"TLS version: {tls}")

        result["findings"].append(f"Issuer: {org}")

    except ssl.SSLCertVerificationError as e:
        result["status"] = "critical"
        result["findings"].append(f"SSL verification failed: {str(e)}")
        result["details"]["selfSigned"] = True
        result["details"]["daysLeft"] = 999
    except Exception as e:
        result["status"] = "error"
        result["findings"].append(f"SSL check error: {str(e)}")
        result["details"]["daysLeft"] = 999
        result["details"]["selfSigned"] = False

    return result
