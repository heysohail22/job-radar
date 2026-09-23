import sqlite3
import json
from typing import List, Optional
from config import settings
from schemas import JobPosting

def get_db_connection():
    conn = sqlite3.connect(settings.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create jobs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        company TEXT NOT NULL,
        title TEXT NOT NULL,
        location TEXT,
        url TEXT,
        description TEXT,
        posted_date TEXT,
        source TEXT,
        tech_stack TEXT,
        match_score INTEGER,
        match_reason TEXT,
        is_internship INTEGER,
        company_stage TEXT DEFAULT 'Seed / Series A',
        is_india INTEGER DEFAULT 0,
        is_fresher INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Safely migrate existing tables if columns do not exist
    for col, col_type in [
        ("company_stage", "TEXT DEFAULT 'Seed / Series A'"),
        ("is_india", "INTEGER DEFAULT 0"),
        ("is_fresher", "INTEGER DEFAULT 1")
    ]:
        try:
            cursor.execute(f"ALTER TABLE jobs ADD COLUMN {col} {col_type}")
        except sqlite3.OperationalError:
            pass
        
    conn.commit()
    conn.close()

def save_jobs_to_db(jobs: List[JobPosting]):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    for job in jobs:
        cursor.execute("""
        INSERT OR REPLACE INTO jobs 
        (id, company, title, location, url, description, posted_date, source, tech_stack, match_score, match_reason, is_internship, company_stage, is_india, is_fresher)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            job.id,
            job.company,
            job.title,
            job.location,
            job.url,
            job.description,
            job.posted_date,
            job.source,
            json.dumps(job.tech_stack),
            job.match_score,
            job.match_reason,
            1 if job.is_internship else 0,
            job.company_stage or "Seed / Series A",
            1 if job.is_india else 0,
            1 if job.is_fresher else 0
        ))
        
    conn.commit()
    conn.close()

def fetch_jobs_from_db(search: Optional[str] = None, min_score: int = 0) -> List[JobPosting]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM jobs WHERE match_score >= ?"
    params = [min_score]
    
    if search and search.strip():
        q = f"%{search.strip().lower()}%"
        query += " AND (LOWER(title) LIKE ? OR LOWER(company) LIKE ? OR LOWER(description) LIKE ?)"
        params.extend([q, q, q])
        
    query += " ORDER BY match_score DESC, created_at DESC"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    jobs = []
    for r in rows:
        tech_list = json.loads(r["tech_stack"]) if r["tech_stack"] else []
        col_names = r.keys()
        stage_val = r["company_stage"] if "company_stage" in col_names and r["company_stage"] else "Seed / Series A"
        india_val = bool(r["is_india"]) if "is_india" in col_names else False
        fresher_val = bool(r["is_fresher"]) if "is_fresher" in col_names else True
        jobs.append(JobPosting(
            id=r["id"],
            company=r["company"],
            title=r["title"],
            location=r["location"] or "Remote",
            url=r["url"] or "",
            description=r["description"] or "",
            posted_date=r["posted_date"] or "Recently",
            source=r["source"] or "Greenhouse",
            tech_stack=tech_list,
            match_score=r["match_score"] or 80,
            match_reason=r["match_reason"] or "Matching position.",
            is_internship=bool(r["is_internship"]),
            company_stage=stage_val,
            is_india=india_val,
            is_fresher=fresher_val
        ))
        
    return jobs
