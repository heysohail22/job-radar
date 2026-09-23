import os
import json
import logging
import httpx
from typing import List, Dict, Any
from config import settings
from db import fetch_jobs_from_db

logger = logging.getLogger(__name__)

DEFAULT_FILTER_FACETS = [
    {
        "id": "india",
        "label": "India Roles",
        "emoji": "🇮🇳",
        "keywords": ["india", "bengaluru", "bangalore", "hyderabad", "pune", "mumbai", "delhi", "gurgaon", "noida", "chennai"],
        "field": "location_or_flag"
    },
    {
        "id": "internship",
        "label": "Internships & Freshers",
        "emoji": "🎓",
        "keywords": ["intern", "internship", "fresher", "junior", "trainee", "associate"],
        "field": "title_or_flag"
    },
    {
        "id": "agents",
        "label": "LangGraph & Agents",
        "emoji": "🤖",
        "keywords": ["langgraph", "agent", "multi-agent", "crewai", "autogen", "tool calling"],
        "field": "tech_or_desc"
    },
    {
        "id": "rag",
        "label": "RAG & Vector DB",
        "emoji": "🔍",
        "keywords": ["rag", "vector", "pgvector", "pinecone", "chroma", "embeddings", "qdrant"],
        "field": "tech_or_desc"
    },
    {
        "id": "fastapi_python",
        "label": "Python & FastAPI",
        "emoji": "🐍",
        "keywords": ["python", "fastapi", "django", "flask", "backend"],
        "field": "tech_or_desc"
    },
    {
        "id": "google_jobs",
        "label": "Google Jobs Index",
        "emoji": "🔎",
        "keywords": ["google", "indeed", "linkedin", "shine", "glassdoor"],
        "field": "source"
    },
    {
        "id": "startups",
        "label": "Seed & YC Startups",
        "emoji": "🚀",
        "keywords": ["seed", "series a", "yc", "y combinator", "early stage"],
        "field": "company_or_stage"
    },
    {
        "id": "remote",
        "label": "Worldwide Remote",
        "emoji": "🌐",
        "keywords": ["remote", "worldwide", "anywhere", "global"],
        "field": "location"
    }
]

async def generate_ai_filter_facets(jobs_summary: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Analyzes current job listings and uses Gemini 2.5 Flash to produce 6-8 smart,
    high-yield filter facets tailored specifically to the dataset.
    """
    if not jobs_summary:
        raw_jobs = fetch_jobs_from_db(min_score=0)
        jobs_summary = [
            {
                "title": j.title,
                "company": j.company,
                "location": j.location,
                "techStack": j.tech_stack,
                "source": j.source,
                "stage": j.company_stage
            }
            for j in raw_jobs[:60]
        ]

    if not jobs_summary or len(jobs_summary) < 3:
        return DEFAULT_FILTER_FACETS

    api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        logger.warning("No GEMINI_API_KEY found, returning curated default facets.")
        return DEFAULT_FILTER_FACETS

    # Sample up to 35 jobs for compact prompt
    sample_text = "\n".join([
        f"- {j.get('title')} at {j.get('company')} ({j.get('location')}) | Stack: {', '.join(j.get('techStack', [])[:5])} | Source: {j.get('source')}"
        for j in jobs_summary[:35]
    ])

    prompt = f"""
You are an expert AI job radar analyzer.
Below is a sample of current live GenAI job postings:

{sample_text}

Analyze the actual distribution of roles, tech stacks, locations, and hiring companies.
Generate 6 to 8 compelling, high-yield, smart filter categories that group these jobs effectively for an applicant specializing in LangGraph, Multi-Agent Systems, RAG, Python, and FastAPI seeking India roles or Worldwide Remote positions.

Return a valid JSON array of objects with the exact schema:
[
  {{
    "id": "short_unique_slug_lowercase",
    "label": "Concise Category Name",
    "emoji": "Relevant Emoji",
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "field": "tech_or_desc" | "location_or_flag" | "title_or_flag" | "source" | "company_or_stage"
  }}
]

Make sure every filter category is practical and matches multiple jobs from the provided list.
Do not include empty markdown or commentary, output ONLY the raw JSON array.
"""

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={api_key}"
            resp = await client.post(
                url,
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "temperature": 0.2,
                        "responseMimeType": "application/json"
                    }
                }
            )
            
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                facets = json.loads(text)
                if isinstance(facets, list) and len(facets) >= 4:
                    return facets
            else:
                logger.error(f"Gemini API ({settings.GEMINI_MODEL}) returned {resp.status_code}: {resp.text}")
    except Exception as e:
        logger.error(f"Failed to generate AI filter facets: {e}", exc_info=True)

    return DEFAULT_FILTER_FACETS
