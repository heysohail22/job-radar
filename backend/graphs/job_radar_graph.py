import asyncio
from typing import List, Dict, Any, TypedDict
from langgraph.graph import StateGraph, END
from schemas import JobPosting
from services.ats_scraper import (
    CURATED_JOBS,
    fetch_greenhouse_jobs,
    fetch_lever_jobs,
    fetch_ashby_jobs,
    fetch_yc_startup_jobs,
    load_startups_directory,
)
from services.firecrawl_service import fetch_firecrawl_yc_jobs

class JobRadarState(TypedDict):
    firecrawl_key: str
    search_query: str
    force_live: bool
    jobs: List[JobPosting]

def load_curated_node(state: JobRadarState) -> Dict[str, Any]:
    return {"jobs": list(CURATED_JOBS)}

async def fetch_live_node(state: JobRadarState) -> Dict[str, Any]:
    if not state.get("force_live"):
        return {"jobs": state.get("jobs", [])}
        
    query = state.get("search_query") or ""
    key = state.get("firecrawl_key") or ""
    
    # Load curated startup catalog
    startups = load_startups_directory()
    tasks = []
    
    # Always include live Y Combinator batch startups
    tasks.append(fetch_yc_startup_jobs())
    
    for s in startups:
        ats = (s.get("ats") or "ashby").lower()
        slug = s.get("slug")
        stage = s.get("stage", "Seed / Series A")
        if not slug:
            continue
        if ats == "ashby":
            tasks.append(fetch_ashby_jobs(slug, stage))
        elif ats == "greenhouse":
            tasks.append(fetch_greenhouse_jobs(slug, stage))
        elif ats == "lever":
            tasks.append(fetch_lever_jobs(slug, stage))

    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    live_jobs: List[JobPosting] = []
    for r in results:
        if isinstance(r, list):
            live_jobs.extend(r)
            
    if key and key.strip():
        fc_jobs = fetch_firecrawl_yc_jobs(key, query)
        live_jobs.extend(fc_jobs)
        
    combined = list(state.get("jobs", []))
    for job in live_jobs:
        if not any(existing.title.lower() == job.title.lower() and existing.company.lower() == job.company.lower() for existing in combined):
            combined.insert(0, job)
            
    # Sort by callback probability (Seed > Series A > others) and then match score descending
    def callback_sort_key(j: JobPosting):
        stage = (j.company_stage or "").lower()
        if "seed" in stage:
            tier = 0
        elif "series a" in stage:
            tier = 1
        elif "series b" in stage:
            tier = 2
        else:
            tier = 3
        return (tier, -j.match_score)

    combined.sort(key=callback_sort_key)
    return {"jobs": combined}

def filter_node(state: JobRadarState) -> Dict[str, Any]:
    query = (state.get("search_query") or "").lower().strip()
    jobs = state.get("jobs", [])
    
    if not query:
        return {"jobs": jobs}
        
    words = [w for w in query.split() if len(w) > 1]
    if not words:
        return {"jobs": jobs}
        
    filtered = []
    for j in jobs:
        haystack = f"{j.title} {j.company} {j.description} {' '.join(j.tech_stack)}".lower()
        if any(w in haystack for w in words):
            filtered.append(j)
    return {"jobs": filtered}

# Build LangGraph State Machine
builder = StateGraph(JobRadarState)
builder.add_node("fetch_live", fetch_live_node)
builder.add_node("filter_jobs", filter_node)

builder.set_entry_point("fetch_live")
builder.add_edge("fetch_live", "filter_jobs")
builder.add_edge("filter_jobs", END)

job_radar_graph = builder.compile()

