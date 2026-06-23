import socket, subprocess
from urllib.parse import urlparse

COMMON_PORTS = [21,22,23,25,53,80,110,143,443,445,3306,3389,5432,6379,8080,8443,27017]
RISKY = {
    21: "FTP — often unencrypted",
    23: "Telnet — INSECURE plaintext protocol",
    3306: "MySQL exposed to internet — HIGH RISK",
    3389: "RDP — common brute-force target",
    5432: "PostgreSQL exposed — HIGH RISK",
    6379: "Redis exposed — HIGH RISK",
    27017: "MongoDB exposed — HIGH RISK",
}

def check_nmap(target: str) -> dict:
    result = {"module": "nmap", "status": "ok", "findings": [], "details": {}}
    try:
        parsed = urlparse(target)
        hostname = parsed.hostname or target
        ip = socket.gethostbyname(hostname)
        result["details"]["ip"] = ip

        open_ports = []
        try:
            proc = subprocess.run(
                ["nmap", "--version"], capture_output=True, timeout=5)
            if proc.returncode == 0:
                port_str = ",".join(map(str, COMMON_PORTS))
                proc2 = subprocess.run(
                    ["nmap", "-T4", "--open", "-p", port_str, "-oG", "-", ip],
                    capture_output=True, text=True, timeout=60)
                for line in proc2.stdout.split("\n"):
                    if "Ports:" in line:
                        for pi in line.split("Ports:")[1].strip().split(","):
                            pi = pi.strip()
                            if "/open/" in pi:
                                pn = int(pi.split("/")[0])
                                svc = pi.split("/")[4] if len(pi.split("/")) > 4 else "unknown"
                                open_ports.append({"port": pn, "service": svc, "state": "open"})
                result["details"]["scanner"] = "nmap"
            else:
                raise Exception("nmap not found")
        except Exception:
            result["details"]["scanner"] = "socket"
            for port in COMMON_PORTS:
                try:
                    with socket.create_connection((ip, port), timeout=1):
                        try: svc = socket.getservbyport(port)
                        except: svc = "unknown"
                        open_ports.append({"port": port, "service": svc, "state": "open"})
                except Exception:
                    pass

        result["details"]["open_ports"] = open_ports
        result["details"]["total_open"] = len(open_ports)

        if not open_ports:
            result["findings"].append("No common risky ports found open")
        else:
            for p in open_ports:
                pn = p["port"]
                if pn in RISKY:
                    result["status"] = "critical"
                    result["findings"].append(f"RISKY port {pn} ({p['service']}): {RISKY[pn]}")
                else:
                    result["findings"].append(f"Port {pn} open ({p['service']})")
                    if result["status"] == "ok":
                        result["status"] = "warning"

    except Exception as e:
        result["status"] = "error"
        result["findings"].append(f"Port scan error: {str(e)}")

    return result
