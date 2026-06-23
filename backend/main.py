"""
VulnScanner Pro - FastAPI Backend
Student : MYCHARLA MADHAVKUMAR | Roll: 324227760022
College : GITAM University | MCA Department
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uuid, json
from datetime import datetime
from db.database import init_db, get_conn

from modules.ssl_checker    import check_ssl
from modules.header_checker import check_headers
from modules.sql_injection  import check_sql_injection
from modules.xss_scanner    import check_xss
from modules.csrf_checker   import check_csrf
from modules.whois_lookup   import check_whois
from modules.ip_geolocation import check_ip_geo
from modules.nmap_check     import check_nmap
from ai_engine.risk_scorer      import calculate_risk
from ai_engine.recommendations  import generate_recommendations


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="VulnScanner Pro API", version="2.0.0", lifespan=lifespan)

# CORS — allows localhost:3000 (Next.js dev) and localhost:3001.
# In production, replace with your actual deployed frontend domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://vuln-scanner-pro.vercel.app",    
    ],
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.get("/")
def root():
    return {"status": "VulnScanner Pro API running", "version": "2.0.0"}


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "2.0.0", "student": "MYCHARLA MADHAVKUMAR"}


class ScanRequest(BaseModel):
    target: str
    email: Optional[str] = None
    consent: bool
    consent_text: str
    run_whois: bool = True
    run_nmap: bool = False


def run_scan(scan_id: str, target: str, run_whois: bool, run_nmap: bool):
    conn = get_conn()
    try:
        conn.execute("UPDATE scans SET status='running' WHERE id=?", (scan_id,))
        conn.commit()

        results = {}

        # Core modules — always run
        for key, fn in [
            ("ssl",     lambda: check_ssl(target)),
            ("headers", lambda: check_headers(target)),
            ("sqli",    lambda: check_sql_injection(target)),
            ("xss",     lambda: check_xss(target)),
            ("csrf",    lambda: check_csrf(target)),
            ("ipGeo",   lambda: check_ip_geo(target)),
        ]:
            try:
                results[key] = fn()
            except Exception as e:
                results[key] = {"module": key, "status": "error",
                                "findings": [str(e)], "details": {}}

        # Optional modules
        if run_whois:
            try:
                results["whois"] = check_whois(target)
            except Exception as e:
                results["whois"] = {"module": "whois", "status": "error",
                                    "findings": [str(e)], "details": {}}

        if run_nmap:
            try:
                results["nmap"] = check_nmap(target)
            except Exception as e:
                results["nmap"] = {"module": "nmap", "status": "error",
                                   "findings": [str(e)], "details": {}}

        # AI scoring
        risk = calculate_risk(results)
        recs = generate_recommendations(results)

        final = {
            "modules":        results,
            "riskScore":      risk["score"],
            "riskLevel":      risk["level"],
            "riskColor":      risk["color"],
            "scoreBreakdown": risk["breakdown"],
            "scoreCaps":      risk["caps"],
            "recommendations": recs,
        }

        conn.execute(
            "UPDATE scans SET status='done', finished_at=?, results=? WHERE id=?",
            (datetime.utcnow().isoformat(), json.dumps(final), scan_id)
        )
        conn.commit()
    except Exception as e:
        conn.execute(
            "UPDATE scans SET status='failed', finished_at=? WHERE id=?",
            (datetime.utcnow().isoformat(), scan_id)
        )
        conn.commit()
    finally:
        conn.close()


@app.post("/api/scan", status_code=201)
def create_scan(req: ScanRequest, background_tasks: BackgroundTasks):
    if not req.consent:
        raise HTTPException(400, "Consent required")
    if not req.target.startswith(("http://", "https://")):
        raise HTTPException(400, "URL must start with http:// or https://")

    scan_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    conn = get_conn()
    conn.execute(
        """INSERT INTO scans (id,target,user_email,status,consent,consent_text,
           run_whois,run_nmap,created_at) VALUES (?,?,?,?,?,?,?,?,?)""",
        (scan_id, req.target, req.email, "queued", 1,
         req.consent_text, int(req.run_whois), int(req.run_nmap), now)
    )
    conn.commit()
    conn.close()

    background_tasks.add_task(
        run_scan, scan_id, req.target, req.run_whois, req.run_nmap
    )
    return {"scan_id": scan_id}


@app.get("/api/scan/{scan_id}")
def get_scan(scan_id: str):
    conn = get_conn()
    row = conn.execute("SELECT * FROM scans WHERE id=?", (scan_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(404, "Scan not found")
    s = dict(row)
    if s.get("results"):
        s["results"] = json.loads(s["results"])
    return s


@app.get("/api/history")
def get_history():
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM scans ORDER BY created_at DESC LIMIT 50"
    ).fetchall()
    conn.close()
    scans = []
    for row in rows:
        s = dict(row)
        if s.get("results"):
            s["results"] = json.loads(s["results"])
        scans.append(s)
    return scans


@app.delete("/api/scan/{scan_id}")
def delete_scan(scan_id: str):
    conn = get_conn()
    conn.execute("DELETE FROM scans WHERE id=?", (scan_id,))
    conn.commit()
    conn.close()
    return {"deleted": scan_id}
