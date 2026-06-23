import sqlite3, os

DB_PATH = os.path.join(os.path.dirname(__file__), "scans.db")

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_conn()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS scans (
            id TEXT PRIMARY KEY,
            target TEXT NOT NULL,
            user_email TEXT,
            status TEXT NOT NULL DEFAULT 'queued',
            consent INTEGER NOT NULL DEFAULT 0,
            consent_text TEXT,
            run_whois INTEGER NOT NULL DEFAULT 0,
            run_nmap INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            finished_at TEXT,
            results TEXT
        )
    """)
    conn.commit()
    conn.close()
