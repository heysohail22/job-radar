import httpx
import re
from typing import List
from schemas import JobPosting

# Curated High-Value Gen AI Intern Postings
CURATED_JOBS: List[JobPosting] = [
    JobPosting(
        id="feat-1",
        company="LangChain",
        title="Generative AI & LLM Systems Engineering Intern",
        location="Remote (Global)",
        url="https://www.langchain.com/careers",
        description="Develop open-source LangChain / LangGraph components in Python and TypeScript. Build production-ready RAG pipelines and vector DB retrievers.",
        posted_date="Just now",
        source="Greenhouse",
        tech_stack=["Python", "TypeScript", "React", "LangChain", "RAG", "Vector DB", "Agents"],
        match_score=95,
        match_reason="Direct match for Python, React, TypeScript, RAG, and LLM Agent development skills.",
        is_internship=True
    ),
    JobPosting(
        id="feat-2",
        company="Perplexity AI",
        title="AI Product & Web Engineering Intern",
        location="San Francisco, CA / Remote",
        url="https://www.perplexity.ai/careers",
        description="Work on conversational search engine frontend and real-time LLM stream rendering using React, TailwindCSS, and modern TypeScript.",
        posted_date="1 day ago",
        source="Ashby",
        tech_stack=["React", "TypeScript", "TailwindCSS", "Vite", "LLM Streaming", "Web UI"],
        match_score=92,
        match_reason="Strong fit for modern React, TypeScript, and fast AI user interface development.",
        is_internship=True
    ),
    JobPosting(
        id="feat-3",
        company="Cursor (Anysphere)",
        title="AI Applications & Full-Stack Intern",
        location="San Francisco, CA / Remote",
        url="https://www.cursor.com/careers",
        description="Build intelligent developer tools, context retrieval algorithms, and inline code editing features using TypeScript and AI agents.",
        posted_date="2 days ago",
        source="Ashby",
        tech_stack=["TypeScript", "Node.js", "AI Agents", "Code LLMs", "React"],
        match_score=89,
        match_reason="Matches TypeScript experience and agentic AI developer tooling projects.",
        is_internship=True
    ),
    JobPosting(
        id="feat-4",
        company="Hugging Face",
        title="Open-Source Gen AI & Web Apps Intern",
        location="Remote (Global)",
        url="https://huggingface.co/jobs",
        description="Create responsive web applications to showcase cutting-edge open-source LLMs and Diffusion models using Gradio, React, and Python.",
        posted_date="2 days ago",
        source="Lever",
        tech_stack=["Python", "JavaScript", "React", "Hugging Face", "LLMs", "Gradio"],
        match_score=88,
        match_reason="Excellent fit for web application development and AI model integration.",
        is_internship=True
    ),
    JobPosting(
        id="feat-5",
        company="Scale AI",
        title="Generative AI Evaluation & Software Intern",
        location="San Francisco, CA / Remote",
        url="https://scale.com/careers",
        description="Build automated evaluation suites for LLMs, RLHF alignment, and agentic workflows using Python and React.",
        posted_date="3 days ago",
        source="Greenhouse",
        tech_stack=["Python", "TypeScript", "React", "LLM Benchmarks", "RLHF"],
        match_score=86,
        match_reason="Strong match for full-stack web skills and AI evaluation systems.",
        is_internship=True
    )
]

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
