import asyncio
from typing import List, Dict, Any, TypedDict
from langgraph.graph import StateGraph, END
from schemas import JobPosting
from services.ats_scraper import CURATED_JOBS, fetch_greenhouse_jobs, fetch_lever_jobs
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
        
    query = state.get("search_query") or "Gen AI Intern"
    key = state.get("firecrawl_key") or ""
    
    # Run ATS fetches in parallel
    gh_task1 = fetch_greenhouse_jobs("langchain")
    gh_task2 = fetch_greenhouse_jobs("anthropic")
    gh_task3 = fetch_greenhouse_jobs("pinecone")
    lev_task = fetch_lever_jobs("huggingface")
    
    results = await asyncio.gather(gh_task1, gh_task2, gh_task3, lev_task, return_exceptions=True)
    
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
            
    return {"jobs": combined}

def filter_node(state: JobRadarState) -> Dict[str, Any]:
    query = (state.get("search_query") or "").lower().strip()
    jobs = state.get("jobs", [])
    
    if not query:
        return {"jobs": jobs}
        
    filtered = [
        j for j in jobs
        if query in j.title.lower()
        or query in j.company.lower()
        or query in j.description.lower()
        or any(query in t.lower() for t in j.tech_stack)
    ]
    return {"jobs": filtered}

# Build LangGraph State Machine
builder = StateGraph(JobRadarState)
builder.add_node("load_curated", load_curated_node)
builder.add_node("fetch_live", fetch_live_node)
builder.add_node("filter_jobs", filter_node)

builder.set_entry_point("load_curated")
builder.add_edge("load_curated", "fetch_live")
builder.add_edge("fetch_live", "filter_jobs")
builder.add_edge("filter_jobs", END)

job_radar_graph = builder.compile()
