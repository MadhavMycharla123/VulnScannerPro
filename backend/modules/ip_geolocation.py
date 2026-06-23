import socket, requests
from urllib.parse import urlparse

def check_ip_geo(target: str) -> dict:
    result = {"module": "ipGeo", "status": "ok", "findings": [], "details": {}}
    try:
        parsed = urlparse(target)
        host = (parsed.hostname or target).replace("www.", "")

        ip = socket.gethostbyname(host)

        # ip-api.com free tier requires HTTP; we use verify=False and suppress warnings
        requests.packages.urllib3.disable_warnings()
        r = requests.get(
            f"http://ip-api.com/json/{ip}?fields=status,message,country,regionName,city,isp,org,lat,lon,timezone,query",
            timeout=8,
        )
        d = r.json()

        if d.get("status") == "fail":
            raise ValueError(d.get("message", "ip-api lookup failed"))

        result["details"] = {
            "ip":       d.get("query", ip),
            "country":  d.get("country", "N/A"),
            "region":   d.get("regionName", "N/A"),
            "city":     d.get("city", "N/A"),
            "isp":      d.get("isp", "N/A"),
            "org":      d.get("org", "N/A"),
            "lat":      d.get("lat", 0),
            "lon":      d.get("lon", 0),
            "timezone": d.get("timezone", "N/A"),
        }

        result["findings"].append(f"IP: {d.get('query', ip)}")
        result["findings"].append(f"Location: {d.get('city', '?')}, {d.get('country', '?')}")
        result["findings"].append(f"ISP: {d.get('isp', '?')}")
        result["findings"].append(f"Timezone: {d.get('timezone', '?')}")

    except Exception as e:
        result["status"] = "error"
        result["findings"].append(f"IP geo error: {str(e)}")
        result["details"] = {"ip": "N/A", "country": "N/A", "city": "N/A", "isp": "N/A", "lat": 0, "lon": 0}

    return result
