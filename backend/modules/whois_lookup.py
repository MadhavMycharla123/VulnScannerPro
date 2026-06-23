import socket
from urllib.parse import urlparse
from datetime import datetime

def check_whois(target: str) -> dict:
    result = {"module": "whois", "status": "ok", "findings": [], "details": {}}
    try:
        parsed = urlparse(target)
        hostname = parsed.hostname or target

        try:
            ip = socket.gethostbyname(hostname)
            result["details"]["ip_address"] = ip
            result["findings"].append(f"Resolved IP: {ip}")
        except Exception:
            result["details"]["ip_address"] = "Could not resolve"

        try:
            import whois
            w = whois.whois(hostname)
            if w:
                result["details"]["registrar"] = str(w.registrar or "Unknown")
                result["details"]["domain_name"] = str(w.domain_name or hostname)

                cd = w.creation_date
                if isinstance(cd, list): cd = cd[0]
                if cd:
                    result["details"]["created"] = str(cd)
                    result["findings"].append(f"Domain created: {cd}")

                ed = w.expiration_date
                if isinstance(ed, list): ed = ed[0]
                if ed:
                    result["details"]["expires"] = str(ed)
                    if isinstance(ed, datetime):
                        days = (ed - datetime.utcnow()).days
                        if days < 30:
                            result["status"] = "warning"
                            result["findings"].append(f"Domain expires in {days} days!")
                        else:
                            result["findings"].append(f"Domain expires in {days} days")

                result["details"]["name_servers"] = [str(ns) for ns in (w.name_servers or [])]
                result["findings"].append(f"Registrar: {w.registrar or 'Unknown'}")
        except ImportError:
            result["findings"].append("python-whois not installed — IP resolved only")
        except Exception as e:
            result["findings"].append(f"WHOIS lookup partial: {str(e)}")

    except Exception as e:
        result["status"] = "error"
        result["findings"].append(f"WHOIS error: {str(e)}")

    return result
