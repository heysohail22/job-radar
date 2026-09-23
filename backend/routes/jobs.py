from fastapi import APIRouter, Query
from typing import List, Optional
from schemas import JobPosting, ScrapeRequest
from db import fetch_jobs_from_db, save_jobs_to_db
from graphs.job_radar_graph import job_radar_graph
from config import settings

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])

@router.get("", response_model=List[JobPosting])
async def get_jobs(
    search: Optional[str] = Query(None, description="Search query keyword"),
    min_score: int = Query(0, description="Minimum match score"),
    force_live: bool = Query(False, description="Fetch fresh live data from ATS feeds & Firecrawl")
):
    # Fetch from local DB first
    cached_jobs = fetch_jobs_from_db(search=search, min_score=min_score)
    
    # If DB is empty or force_live is True, run the LangGraph Agent Graph
    if not cached_jobs or force_live:
        graph_input = {
            "firecrawl_key": settings.FIRECRAWL_API_KEY,
            "search_query": search or "",
            "force_live": force_live,
            "jobs": []
        }
        graph_output = await job_radar_graph.ainvoke(graph_input)
        fetched_jobs = graph_output.get("jobs", [])
        
        if fetched_jobs:
            save_jobs_to_db(fetched_jobs)
            return fetch_jobs_from_db(search=search, min_score=min_score)

    return cached_jobs

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
