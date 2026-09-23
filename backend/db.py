import json
from typing import List, Optional
from supabase import create_client, Client
from config import settings
from schemas import JobPosting

_supabase_client: Optional[Client] = None

def get_supabase_client() -> Client:
    global _supabase_client
    if _supabase_client is None:
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
            raise ValueError(
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured in backend/.env"
            )
        _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    return _supabase_client

def init_db():
    """Verify Supabase connection and jobs table accessibility at startup."""
    try:
        client = get_supabase_client()
        client.table("jobs").select("id").limit(1).execute()
        print("✓ Connected to Supabase 'jobs' table successfully.")
    except Exception as e:
        print(f"Warning: Supabase table initialization check failed: {e}")

def save_jobs_to_db(jobs: List[JobPosting]):
    """Upsert jobs into Supabase 'jobs' table with intelligent deduplication by company, title, and url."""
    if not jobs:
        return
    client = get_supabase_client()
    
    # Retrieve existing job identifiers to prevent duplicates across multiple fetches
    existing_key_to_id = {}
    try:
        res = client.table("jobs").select("id, company, title, url").execute()
        for row in (res.data or []):
            cid = row.get("id")
            c = (row.get("company") or "").strip().lower()
            t = (row.get("title") or "").strip().lower()
            u = (row.get("url") or "").strip().lower()
            if c and t:
                existing_key_to_id[f"{c}::{t}"] = cid
            if u:
                existing_key_to_id[f"url::{u}"] = cid
    except Exception as e:
        print(f"Note: existing jobs lookup skipped: {e}")

    records = []
    seen_in_batch = set()

    for job in jobs:
        c = (job.company or "").strip().lower()
        t = (job.title or "").strip().lower()
        u = (job.url or "").strip().lower()
        key = f"{c}::{t}"
        url_key = f"url::{u}" if u else None

        # Prevent duplicate entries within the current batch
        if key in seen_in_batch:
            continue
        seen_in_batch.add(key)
        if url_key:
            seen_in_batch.add(url_key)

        # Reuse existing DB id if job was already fetched previously
        target_id = existing_key_to_id.get(key) or (existing_key_to_id.get(url_key) if url_key else None) or job.id

        records.append({
            "id": target_id,
            "company": job.company,
            "title": job.title,
            "location": job.location or "Remote",
            "url": job.url or "",
            "description": job.description or "",
            "posted_date": job.posted_date or "Recently",
            "source": job.source or "Greenhouse",
            "tech_stack": job.tech_stack or [],
            "match_score": job.match_score if job.match_score is not None else 80,
            "match_reason": job.match_reason or "Matching position.",
            "is_internship": bool(job.is_internship),
            "company_stage": job.company_stage or "Seed / Series A",
            "is_india": bool(job.is_india),
            "is_fresher": bool(job.is_fresher)
        })
    
    if records:
        try:
            client.table("jobs").upsert(records, on_conflict="id").execute()
        except Exception as e:
            print(f"Error upserting jobs to Supabase: {e}")

def toggle_job_applied_in_db(job_id: str, is_applied: bool, job_data: Optional[dict] = None) -> bool:
    """Updates the applied status in Supabase (supporting both jobs table columns and dedicated applied_jobs table)."""
    client = get_supabase_client()
    from datetime import datetime, timezone
    now_str = datetime.now(timezone.utc).isoformat() if is_applied else None

    # 1. Update jobs table if is_applied column exists
    try:
        client.table("jobs").update({
            "is_applied": is_applied,
            "applied_at": now_str
        }).eq("id", job_id).execute()
    except Exception as e:
        pass

    # 2. Insert or remove from dedicated applied_jobs table if it exists
    try:
        if is_applied:
            record = {
                "job_id": job_id,
                "applied_at": now_str,
                "status": "Applied"
            }
            if job_data:
                record.update({
                    "company": job_data.get("company", ""),
                    "title": job_data.get("title", ""),
                    "location": job_data.get("location", ""),
                    "url": job_data.get("url", ""),
                    "source": job_data.get("source", "")
                })
            client.table("applied_jobs").upsert(record, on_conflict="job_id").execute()
        else:
            client.table("applied_jobs").delete().eq("job_id", job_id).execute()
    except Exception as e:
        pass

    return True

def get_applied_jobs_from_db() -> List[dict]:
    """Fetches all applied jobs recorded in Supabase."""
    client = get_supabase_client()
    # 1. Try dedicated applied_jobs table first
    try:
        res = client.table("applied_jobs").select("*").execute()
        if res.data:
            return res.data
    except Exception:
        pass

    # 2. Fall back to jobs table where is_applied is true
    try:
        res = client.table("jobs").select("*").eq("is_applied", True).execute()
        if res.data:
            return res.data
    except Exception:
        pass

    return []

def fetch_jobs_from_db(
    search: Optional[str] = None, 
    min_score: int = 0,
    applied: Optional[bool] = None
) -> List[JobPosting]:
    """Fetch jobs from Supabase with search query, minimum score, and applied status filters."""
    client = get_supabase_client()
    query = client.table("jobs").select("*").gte("match_score", min_score)
    
    if search and search.strip():
        q = search.strip()
        query = query.or_(f"title.ilike.%{q}%,company.ilike.%{q}%,description.ilike.%{q}%")
        
    if applied is True:
        try:
            query = query.eq("is_applied", True)
        except Exception:
            pass
    elif applied is False:
        try:
            query = query.or_("is_applied.eq.false,is_applied.is.null")
        except Exception:
            pass
            
    query = query.order("match_score", desc=True).order("created_at", desc=True)
    
    try:
        response = query.execute()
        rows = response.data or []
    except Exception as e:
        # Fallback if is_applied column is not yet migrated in Supabase
        if "is_applied" in str(e):
            try:
                fallback_query = client.table("jobs").select("*").gte("match_score", min_score)
                if search and search.strip():
                    fallback_query = fallback_query.or_(f"title.ilike.%{search.strip()}%,company.ilike.%{search.strip()}%,description.ilike.%{search.strip()}%")
                fallback_query = fallback_query.order("match_score", desc=True).order("created_at", desc=True)
                rows = fallback_query.execute().data or []
            except Exception as inner_err:
                print(f"Error fetching jobs from Supabase: {inner_err}")
                return []
        else:
            print(f"Error fetching jobs from Supabase: {e}")
            return []
    
    jobs = []
    for r in rows:
        tech_list = r.get("tech_stack") or []
        if isinstance(tech_list, str):
            try:
                tech_list = json.loads(tech_list)
            except Exception:
                tech_list = [tech_list]
                
        is_app = bool(r.get("is_applied", False)) if "is_applied" in r else False
        app_at = r.get("applied_at") if "applied_at" in r else None
        
        # In-memory filter fallback if DB column didn't exist
        if applied is True and not is_app:
            continue
        if applied is False and is_app:
            continue
            
        jobs.append(JobPosting(
            id=r["id"],
            company=r["company"],
            title=r["title"],
            location=r.get("location") or "Remote",
            url=r.get("url") or "",
            description=r.get("description") or "",
            posted_date=r.get("posted_date") or "Recently",
            source=r.get("source") or "Greenhouse",
            tech_stack=tech_list,
            match_score=r.get("match_score") or 80,
            match_reason=r.get("match_reason") or "Matching position.",
            is_internship=bool(r.get("is_internship", True)),
            company_stage=r.get("company_stage") or "Seed / Series A",
            is_india=bool(r.get("is_india", False)),
            is_fresher=bool(r.get("is_fresher", True)),
            is_applied=is_app,
            applied_at=app_at
        ))
        
    return jobs


