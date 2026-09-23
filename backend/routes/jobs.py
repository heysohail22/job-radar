from fastapi import APIRouter, Query
from typing import List, Optional
from schemas import JobPosting, ScrapeRequest, ApplyRequest
from db import fetch_jobs_from_db, save_jobs_to_db, toggle_job_applied_in_db
from graphs.job_radar_graph import job_radar_graph
from config import settings

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])

@router.get("", response_model=List[JobPosting])
async def get_jobs(
    search: Optional[str] = Query(None, description="Search query keyword"),
    min_score: int = Query(0, description="Minimum match score"),
    force_live: bool = Query(False, description="Fetch fresh live data from ATS feeds & Firecrawl"),
    applied: Optional[bool] = Query(None, description="Filter by applied status (True/False)")
):
    # Only scrape when explicitly requested by user via force_live=True
    if force_live:
        graph_input = {
            "firecrawl_key": settings.FIRECRAWL_API_KEY,
            "search_query": search or "",
            "force_live": True,
            "jobs": []
        }
        graph_output = await job_radar_graph.ainvoke(graph_input)
        fetched_jobs = graph_output.get("jobs", [])
        
        if fetched_jobs:
            save_jobs_to_db(fetched_jobs)

    # Return cached jobs from database (returns empty list if none, without auto-scraping)
    return fetch_jobs_from_db(search=search, min_score=min_score, applied=applied)

@router.post("/{job_id}/apply", response_model=dict)
async def toggle_apply(job_id: str, req: ApplyRequest):
    """Mark or unmark a job as applied."""
    success = toggle_job_applied_in_db(job_id, req.is_applied)
    return {
        "success": success,
        "jobId": job_id,
        "isApplied": req.is_applied
    }


@router.post("/scrape", response_model=List[JobPosting])
async def trigger_scrape(req: ScrapeRequest):
    key = req.firecrawl_key or settings.FIRECRAWL_API_KEY
    graph_input = {
        "firecrawl_key": key,
        "search_query": req.search_query or "Gen AI Intern",
        "force_live": True,
        "jobs": []
    }
    graph_output = await job_radar_graph.ainvoke(graph_input)
    fetched_jobs = graph_output.get("jobs", [])
    if fetched_jobs:
        save_jobs_to_db(fetched_jobs)
    return fetched_jobs
