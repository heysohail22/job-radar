import os
import re
import json
import time
import httpx
import asyncio
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv
from firecrawl import FirecrawlApp

from config import settings
from schemas import JobPosting
from db import save_jobs_to_db
from services.ats_scraper import (
    is_eligible_candidate_location,
    is_candidate_skills_match,
    compute_candidate_match,
    extract_tech_stack,
    is_india_location,
    is_fresher_job,
)

load_dotenv()

def get_firecrawl_client() -> Optional[FirecrawlApp]:
    key = os.getenv("VITE_FIRECRAWL_API_KEY") or os.getenv("FIRECRAWL_API_KEY")
    if not key or not key.strip():
        return None
    try:
        return FirecrawlApp(api_key=key.strip())
    except Exception as e:
        print(f"Error initializing Firecrawl: {e}")
        return None

async def call_gemini_json_api(prompt: str) -> Optional[List[Dict[str, Any]]]:
    """Calls Gemini REST endpoint directly using settings.GEMINI_MODEL with native JSON schema output."""
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("VITE_GEMINI_API_KEY")
    if not gemini_key:
        return None

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={gemini_key}"
    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.1
        }
    }

    async with httpx.AsyncClient(timeout=45.0) as client:
        try:
            res = await client.post(url, json=payload)
            if res.status_code == 200:
                data = res.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                parsed = json.loads(text)
                if isinstance(parsed, dict) and "jobs" in parsed:
                    return parsed["jobs"]
                if isinstance(parsed, list):
                    return parsed
                return []
            else:
                print(f"Gemini API ({settings.GEMINI_MODEL}) returned status {res.status_code}: {res.text[:200]}")
        except Exception as e:
            print(f"Gemini REST error ({settings.GEMINI_MODEL}): {repr(e)}")

    return None

async def scrape_google_jobs(query: str = "Gen AI Intern India") -> List[JobPosting]:
    """
    Searches Google Jobs index (Indeed, LinkedIn, Shine, Glassdoor, Jobrapido, Lever)
    using Firecrawl web search and parses raw snippets into structured JobPosting objects using Gemini Flash.
    """
    app = get_firecrawl_client()
    if not app:
        print("Firecrawl API key is missing or invalid.")
        return []

    clean_query = query.strip() if query else "Gen AI Intern India"

    # Search queries capturing real Google Jobs index aggregations
    search_queries = [
        f"{clean_query} Indeed OR Shine OR LinkedIn",
        f"GenAI Product Builder Intern Bengaluru Epifi OR Indeed OR Lever",
    ]

    all_raw_snippets = []
    
    for sq in search_queries:
        try:
            res = await asyncio.to_thread(app.search, sq)
            web_results = getattr(res, "web", None) or getattr(res, "data", None) or []
            for item in web_results:
                title = getattr(item, "title", "")
                url = getattr(item, "url", "")
                desc = str(getattr(item, "description", ""))
                # Keep compact to ensure fast Gemini extraction
                if title and url:
                    all_raw_snippets.append(f"Title: {title}\nURL: {url}\nSummary: {desc[:600]}")
        except Exception as e:
            print(f"Error during Firecrawl search query '{sq}': {e}")
            continue

    if not all_raw_snippets:
        print("No raw search snippets retrieved from Google search.")
        return []

    combined_text = "\n---\n".join(all_raw_snippets[:10])

    prompt = f"""You are an expert technical recruiter analyzing real job search listings from Google Jobs (aggregating Indeed, LinkedIn, Shine, Glassdoor, Jobrapido, Lever).
Extract all distinct individual job opportunities mentioned in the text into a JSON array of objects.

Rules:
1. ONLY include jobs located in India (Bengaluru, Pune, Hyderabad, Mumbai, Delhi, Gurgaon, Chennai, etc.) OR Worldwide / Remote.
2. Filter for roles relevant to: GenAI, AI Interns, Machine Learning, Python, LLMs, Agents, RAG, Software Engineers.
3. For "url", use the EXACT direct link mentioned in the text (e.g. https://in.indeed.com/..., https://jobs.lever.co/..., https://in.linkedin.com/..., etc.).
4. For "source", identify the platform, e.g. "Google (via Indeed)", "Google (via Shine)", "Google (via Jobrapido)", "Google (via Lever)", "Google (via LinkedIn)".

Output JSON array format:
[
  {{
    "company": "Company Name",
    "title": "Exact Title",
    "location": "City, India or Remote (Worldwide)",
    "url": "Direct link",
    "description": "Short 2-3 sentence summary of the job responsibilities and stack",
    "source": "Google (via Indeed) or Google (via Shine) etc.",
    "tech_stack": ["Python", "LLMs", "FastAPI"],
    "is_internship": true,
    "is_india": true
  }}
]

Text:
{combined_text}
"""

    parsed_data = await call_gemini_json_api(prompt)
    if not parsed_data or not isinstance(parsed_data, list):
        print("No structured jobs extracted by Gemini.")
        return []

    jobs: List[JobPosting] = []
    seen_urls = set()
    
    for i, item in enumerate(parsed_data):
        title = item.get("title") or "Gen AI Engineer"
        comp = item.get("company") or "Tech Startup"
        loc = item.get("location") or "Bengaluru, India"
        url = item.get("url") or ""
        desc = item.get("description") or f"Exciting AI engineering role at {comp}."
        source = item.get("source") or "Google Jobs"
        
        if not url or url in seen_urls:
            continue
        seen_urls.add(url)
        
        # Location filter check
        if not is_eligible_candidate_location(loc, title, desc):
            continue
            
        raw_stack = item.get("tech_stack", [])
        stack_str = " ".join(raw_stack) if isinstance(raw_stack, list) else str(raw_stack)
        extracted_stack = extract_tech_stack(f"{title} {desc} {stack_str}")
        if not is_candidate_skills_match(title, desc, extracted_stack):
            continue
            
        is_ind = is_india_location(loc, title, desc)
        is_intern = bool(item.get("is_internship", False)) or is_fresher_job(title, desc, "")
        stage = "Discovered via Google Jobs"
        
        match_score, match_reason = compute_candidate_match(
            title=title,
            desc=desc,
            stage=stage,
            tech_stack=extracted_stack,
            is_india=is_ind,
            is_fresher=is_intern
        )
        import hashlib
        clean_key = f"{comp.strip().lower()}::{title.strip().lower()}"
        slug_hash = hashlib.md5(clean_key.encode()).hexdigest()[:10]
        clean_comp = re.sub(r'[^a-zA-Z0-9]', '', comp.lower())[:12]
        job_id = f"google-{clean_comp}-{slug_hash}"
        
        posting = JobPosting(
            id=job_id,
            company=comp,
            title=title,
            location=loc,
            url=url,
            description=desc,
            posted_date="Recently",
            source=source,
            tech_stack=extracted_stack,
            match_score=match_score,
            match_reason=match_reason,
            is_internship=is_intern,
            company_stage=stage,
            is_india=is_ind,
            is_fresher=is_intern
        )
        jobs.append(posting)

    if jobs:
        try:
            save_jobs_to_db(jobs)
            print(f"Successfully scraped and saved {len(jobs)} Google Jobs to database.")
        except Exception as e:
            print(f"Database save error for Google jobs: {e}")

    return jobs
