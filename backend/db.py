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
    """Upsert jobs directly into Supabase 'jobs' table."""
    if not jobs:
        return
    client = get_supabase_client()
    records = []
    for job in jobs:
        records.append({
            "id": job.id,
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
    
    try:
        client.table("jobs").upsert(records, on_conflict="id").execute()
    except Exception as e:
        print(f"Error upserting jobs to Supabase: {e}")

def fetch_jobs_from_db(search: Optional[str] = None, min_score: int = 0) -> List[JobPosting]:
    """Fetch jobs from Supabase with search query and minimum score filters."""
    client = get_supabase_client()
    query = client.table("jobs").select("*").gte("match_score", min_score)
    
    if search and search.strip():
        q = search.strip()
        query = query.or_(f"title.ilike.%{q}%,company.ilike.%{q}%,description.ilike.%{q}%")
        
    query = query.order("match_score", desc=True).order("created_at", desc=True)
    
    try:
        response = query.execute()
        rows = response.data or []
    except Exception as e:
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
            is_fresher=bool(r.get("is_fresher", True))
        ))
        
    return jobs

