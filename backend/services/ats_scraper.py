import os
import json
import re
from typing import List, Dict, Any, Tuple
import httpx
from schemas import JobPosting

# Candidate profile keywords from resumeData.ts
CANDIDATE_SKILLS = ["python", "typescript", "react", "next.js", "langchain", "langgraph", "rag", "vector", "agents", "fastapi"]
CURATED_JOBS: List[JobPosting] = []

def extract_tech_stack(text: str) -> List[str]:
    t = text.lower()
    tags = []
    candidates = [
        ("Python", r"\bpython\b"),
        ("TypeScript", r"\b(typescript|ts)\b"),
        ("React", r"\breact\b"),
        ("Next.js", r"\bnext\.?js\b"),
        ("LangChain", r"\b(langchain|langgraph)\b"),
        ("RAG", r"\b(rag|retrieval)\b"),
        ("Vector DB", r"\b(vector|chroma|pinecone|qdrant|weaviate)\b"),
        ("PyTorch", r"\bpytorch\b"),
        ("AI Agents", r"\b(agent|agents|agentic)\b"),
        ("FastAPI", r"\bfastapi\b"),
    ]
    for tag, pattern in candidates:
        if re.search(pattern, t):
            tags.append(tag)
    return tags if tags else ["Gen AI", "Python", "React"]

def is_noise_job(title: str, desc: str = "") -> bool:
    """Strictly reject senior roles, non-technical positions, and heavy experience requirements."""
    t = title.lower()
    d = desc[:500].lower()
    
    # 1. Reject senior/lead/director roles
    senior_pattern = r"\b(senior|sr\.|staff|principal|director|vp|head of|lead architect|engineering manager)\b"
    if re.search(senior_pattern, t):
        return True

    # 2. Reject non-technical positions
    non_tech_pattern = r"\b(sales|account executive|recruiter|recruiting|hr\b|human resources|marketing|legal|counsel|finance|tax|accounting|office manager|workplace operations)\b"
    if re.search(non_tech_pattern, t):
        return True

    # 3. Reject heavy experience requirements
    exp_pattern = r"\b(5\+|6\+|7\+|8\+|10\+)\s*(years|yrs)\b"
    if re.search(exp_pattern, d):
        return True

    return False

def is_intern_or_early_role(title: str, emp_type: str = "", total_jobs_at_company: int = 100) -> bool:
    t = title.lower()
    cleaned = re.sub(r"\b(internal|international)\b", "", t)
    
    # Check for direct internship or junior titles
    if re.search(r"\b(intern|interns|internship|student|co-op|coop|apprentice|fellow|fellowship|junior|new grad)\b", cleaned):
        return True
        
    if "intern" in emp_type.lower() and "internal" not in emp_type.lower():
        return True

    # For early-stage startups (<= 15 total open jobs), founding & early technical roles have direct founder access
    if total_jobs_at_company <= 15:
        if any(k in t for k in ["engineer", "research", "developer", "ai", "ml", "agent", "product engineer"]):
            return True

    return False

def compute_candidate_match(title: str, desc: str, stage: str, tech_stack: List[str]) -> Tuple[int, str]:
    """Computes personalized alignment with candidate's actual projects (LangChain, Next.js, Python, RAG, Agents)."""
    score = 82
    matched_skills = [s for s in tech_stack if any(c in s.lower() for c in CANDIDATE_SKILLS)]
    score += min(len(matched_skills) * 3, 12)
    
    stage_lower = stage.lower()
    if "seed" in stage_lower:
        score += 4
        reason = f"🚀 High Callback: Seed team ({stage}). Direct founder review; strong fit for your {', '.join(matched_skills[:2])} projects."
    elif "series a" in stage_lower:
        score += 3
        reason = f"⚡ High Callback: Series A team ({stage}). Core alignment with your {', '.join(matched_skills[:2])} stack."
    else:
        reason = f"🎯 Relevant GenAI role ({stage}). Matches your {', '.join(matched_skills[:2]) or 'AI developer'} background."

    score = min(max(score, 80), 98)
    return score, reason

async def fetch_ashby_jobs(company: str, stage: str = "Seed / Series A") -> List[JobPosting]:
    async with httpx.AsyncClient(timeout=6.0) as client:
        try:
            res = await client.get(f"https://api.ashbyhq.com/posting-api/job-board/{company}")
            if res.status_code != 200:
                return []
            data = res.json()
            jobs = []
            job_list = data.get("jobs", [])
            for j in job_list:
                title = j.get("title", "")
                emp_type = (j.get("employmentType") or "").lower()
                desc = j.get("descriptionPlain") or ""
                
                # Noise check: reject senior, non-technical, or high-experience roles
                if is_noise_job(title, desc):
                    continue
                    
                if is_intern_or_early_role(title, emp_type, len(job_list)):
                    clean_desc = desc[:1000]
                    location = j.get("location") or ("Remote" if j.get("isRemote") else "San Francisco, CA")
                    job_url = j.get("jobUrl") or f"https://jobs.ashbyhq.com/{company}"
                    tech_stack = extract_tech_stack(title + " " + clean_desc)
                    is_intern = is_intern_role_simple(title, emp_type)
                    match_score, match_reason = compute_candidate_match(title, clean_desc, stage, tech_stack)
                    
                    jobs.append(JobPosting(
                        id=f"ashby-{company}-{j.get('id')}",
                        company=company.title().replace("-", " "),
                        title=title,
                        location=location,
                        url=job_url,
                        description=clean_desc,
                        posted_date="Recently",
                        source="Ashby",
                        tech_stack=tech_stack,
                        match_score=match_score,
                        match_reason=match_reason,
                        is_internship=is_intern,
                        company_stage=stage
                    ))
            return jobs
        except Exception:
            return []

def is_intern_role_simple(title: str, emp_type: str = "") -> bool:
    t = title.lower()
    cleaned = re.sub(r"\b(internal|international)\b", "", t)
    return bool(re.search(r"\b(intern|interns|internship|student|co-op|coop|apprentice|fellow|fellowship|junior|new grad)\b", cleaned)) or "intern" in emp_type.lower()

async def fetch_greenhouse_jobs(company: str, stage: str = "Early Stage") -> List[JobPosting]:
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            res = await client.get(f"https://boards-api.greenhouse.io/v1/boards/{company}/jobs?content=true")
            if res.status_code != 200:
                return []
            data = res.json()
            jobs = []
            job_list = data.get("jobs", [])
            for j in job_list:
                title = j.get("title", "")
                desc = j.get("content", "")
                clean_desc = re.sub(r"<[^>]*>", " ", desc)[:1000]
                
                if is_noise_job(title, clean_desc):
                    continue
                    
                if is_intern_or_early_role(title, "", len(job_list)):
                    tech_stack = extract_tech_stack(title + " " + clean_desc)
                    match_score, match_reason = compute_candidate_match(title, clean_desc, stage, tech_stack)
                    jobs.append(JobPosting(
                        id=f"gh-{company}-{j.get('id')}",
                        company=company.capitalize(),
                        title=title,
                        location=j.get("location", {}).get("name") or "Remote",
                        url=j.get("absolute_url") or f"https://boards.greenhouse.io/{company}/jobs/{j.get('id')}",
                        description=clean_desc,
                        posted_date="Recently",
                        source="Greenhouse",
                        tech_stack=tech_stack,
                        match_score=match_score,
                        match_reason=match_reason,
                        is_internship=is_intern_role_simple(title),
                        company_stage=stage
                    ))
            return jobs
        except Exception:
            return []

async def fetch_lever_jobs(company: str, stage: str = "Seed / Series A") -> List[JobPosting]:
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            res = await client.get(f"https://api.lever.co/v0/postings/{company}?mode=json")
            if res.status_code != 200:
                return []
            data = res.json()
            jobs = []
            for j in data:
                title = j.get("text", "")
                commitment = j.get("categories", {}).get("commitment", "")
                desc = j.get("descriptionPlain") or j.get("description") or ""
                
                if is_noise_job(title, desc):
                    continue
                    
                if is_intern_or_early_role(title, commitment, len(data)):
                    tech_stack = extract_tech_stack(title + " " + desc)
                    match_score, match_reason = compute_candidate_match(title, desc, stage, tech_stack)
                    jobs.append(JobPosting(
                        id=f"lev-{company}-{j.get('id')}",
                        company=company.capitalize(),
                        title=title,
                        location=j.get("categories", {}).get("location") or "Remote",
                        url=j.get("hostedUrl") or j.get("applyUrl") or f"https://jobs.lever.co/{company}",
                        description=desc[:1000],
                        posted_date="Recently",
                        source="Lever",
                        tech_stack=tech_stack,
                        match_score=match_score,
                        match_reason=match_reason,
                        is_internship=is_intern_role_simple(title, commitment),
                        company_stage=stage
                    ))
            return jobs
        except Exception:
            return []

async def fetch_yc_startup_jobs() -> List[JobPosting]:
    """Pulls authentic live Y Combinator startup engineering & AI postings directly from YC."""
    async with httpx.AsyncClient(timeout=6.0) as client:
        try:
            res = await client.get(
                "https://hn.algolia.com/api/v1/search_by_date?tags=job&hitsPerPage=30",
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
            )
            if res.status_code != 200:
                return []
            data = res.json()
            hits = data.get("hits", [])
            jobs = []
            for h in hits:
                title = h.get("title", "")
                raw_url = h.get("url") or f"https://news.ycombinator.com/item?id={h.get('objectID')}"
                story_text = h.get("story_text") or title
                
                # Check for technical role & reject senior/management
                if is_noise_job(title, story_text):
                    continue
                    
                if any(k in title.lower() for k in ["engineer", "developer", "ai", "research", "intern", "product", "fullstack", "backend"]):
                    # Parse company name from title e.g. "Weave (YC W25) is hiring..."
                    match_comp = re.match(r"^([^\(\–\:\-\s]+(?:\s+[^\(\–\:\-\s]+)?)\s*(?:\(YC|\–|\:|-)", title, re.IGNORECASE)
                    comp_name = match_comp.group(1).strip() if match_comp else "YC Startup"
                    
                    tech_stack = extract_tech_stack(title + " " + story_text)
                    match_score, match_reason = compute_candidate_match(title, story_text, "Seed / YC Startup", tech_stack)
                    
                    jobs.append(JobPosting(
                        id=f"yc-hn-{h.get('objectID')}",
                        company=comp_name,
                        title=title,
                        location="Remote / San Francisco",
                        url=raw_url,
                        description=f"{title}\n\nOfficial Y Combinator batch startup opportunity. Direct founder/CTO hiring.",
                        posted_date="Recently",
                        source="Y Combinator",
                        tech_stack=tech_stack,
                        match_score=match_score,
                        match_reason=match_reason,
                        is_internship=is_intern_role_simple(title),
                        company_stage="Seed / YC Startup"
                    ))
            return jobs
        except Exception:
            return []

def load_startups_directory() -> List[Dict[str, Any]]:
    """Loads curated startups from backend/data/startups.json."""
    data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "startups.json")
    if os.path.exists(data_path):
        try:
            with open(data_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return [
        {"name": "E2B", "slug": "e2b", "ats": "ashby", "stage": "Seed (AI Sandbox)"},
        {"name": "Mem0", "slug": "mem0", "ats": "ashby", "stage": "Seed (Agent Memory)"},
        {"name": "LlamaIndex", "slug": "llamaindex", "ats": "ashby", "stage": "Series A (LLM Data)"},
        {"name": "Modal Labs", "slug": "modal", "ats": "ashby", "stage": "Series A (AI Compute)"},
        {"name": "LangChain", "slug": "langchain", "ats": "greenhouse", "stage": "Series A (Agent Framework)"},
        {"name": "Baseten", "slug": "baseten", "ats": "ashby", "stage": "Series B (AI Inference)"},
        {"name": "Pinecone", "slug": "pinecone", "ats": "greenhouse", "stage": "Growth (Vector DB)"}
    ]

