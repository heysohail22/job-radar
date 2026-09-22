import httpx
import re
from typing import List
from schemas import JobPosting

# No hardcoded jobs - all data is scraped directly from live ATS feeds
CURATED_JOBS: List[JobPosting] = []


def extract_tech_stack(text: str) -> List[str]:
    t = text.lower()
    tags = []
    candidates = [
        ("Python", r"python"),
        ("TypeScript", r"typescript|ts"),
        ("React", r"react"),
        ("LangChain", r"langchain|langgraph"),
        ("RAG", r"\brag\b|retrieval"),
        ("Vector DB", r"vector|chroma|pinecone|qdrant"),
        ("PyTorch", r"pytorch"),
        ("AI Agents", r"agent"),
    ]
    for tag, pattern in candidates:
        if re.search(pattern, t):
            tags.append(tag)
    return tags if tags else ["Gen AI", "Python", "React"]

async def fetch_greenhouse_jobs(company: str) -> List[JobPosting]:

    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            res = await client.get(f"https://boards-api.greenhouse.io/v1/boards/{company}/jobs?content=true")
            if res.status_code != 200:
                return []
            data = res.json()
            jobs = []
            for j in data.get("jobs", []):
                title = j.get("title", "")
                if any(k in title.lower() for k in ["intern", "student", "co-op", "apprentice", "junior"]):
                    desc = j.get("content", "")
                    clean_desc = re.sub(r"<[^>]*>", " ", desc)[:1000]
                    jobs.append(JobPosting(
                        id=f"gh-{company}-{j.get('id')}",
                        company=company.capitalize(),
                        title=title,
                        location=j.get("location", {}).get("name") or "Remote",
                        url=j.get("absolute_url") or f"https://boards.greenhouse.io/{company}/jobs/{j.get('id')}",
                        description=clean_desc,
                        posted_date="Recently",
                        source="Greenhouse",
                        tech_stack=extract_tech_stack(title + " " + clean_desc),
                        match_score=85,
                        match_reason="Relevant Gen AI internship opening.",
                        is_internship=True
                    ))
            return jobs
        except Exception:
            return []

async def fetch_lever_jobs(company: str) -> List[JobPosting]:
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            res = await client.get(f"https://api.lever.co/v0/postings/{company}?mode=json")
            if res.status_code != 200:
                return []
            data = res.json()
            jobs = []
            for j in data:
                title = j.get("text", "")
                commitment = j.get("categories", {}).get("commitment", "").lower()
                if "intern" in title.lower() or "intern" in commitment:
                    desc = j.get("descriptionPlain") or j.get("description") or ""
                    jobs.append(JobPosting(
                        id=f"lev-{company}-{j.get('id')}",
                        company=company.capitalize(),
                        title=title,
                        location=j.get("categories", {}).get("location") or "Remote",
                        url=j.get("hostedUrl") or j.get("applyUrl") or f"https://jobs.lever.co/{company}",
                        description=desc[:1000],
                        posted_date="Recently",
                        source="Lever",
                        tech_stack=extract_tech_stack(title + " " + desc),
                        match_score=84,
                        match_reason="Relevant Gen AI internship opening.",
                        is_internship=True
                    ))
            return jobs
        except Exception:
            return []
