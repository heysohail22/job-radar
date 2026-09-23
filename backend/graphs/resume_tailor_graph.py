import json
import asyncio
import re
import ast
from typing import Dict, Any, TypedDict
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from schemas import TailorRequest, TailorResponse
from config import settings

SYSTEM_PROMPT = """You are an expert AI Resume Strategist & Recruiter specializing in Generative AI, LLMs, and Software Engineering roles.
Your mission is to re-align an engineer's existing resume to fit a target job description HONESTLY, precisely aligning keywords without fabricating facts.

You MUST respond ONLY with valid JSON adhering to this exact schema:
{
  "targetRole": "Tailored Target Job Title",
  "title": "Optimized Resume Professional Header Title",
  "summary": "Impactful 2-3 sentence summary aligned with target keywords",
  "skills": [
    { "category": "Technical Category", "items": ["Skill1", "Skill2"] }
  ],
  "projects": [
    {
      "name": "Project Name",
      "subtitle": "Project Subtitle / Stack",
      "tech": ["Python", "TypeScript"],
      "bullets": ["Bullet 1", "Bullet 2"]
    }
  ]
}
"""

class TailorState(TypedDict):
    request: TailorRequest
    result: Dict[str, Any]

async def run_llm_tailor_node(state: TailorState) -> Dict[str, Any]:
    req = state["request"]
    jd = req.job_description
    model_id = req.model_id or settings.GEMINI_MODEL
    base_resume = req.base_resume or {}

    gemini_key = req.gemini_key or settings.GEMINI_API_KEY
    groq_key = req.groq_key or settings.GROQ_API_KEY

    prompt_content = f"""TARGET JOB DESCRIPTION:
{jd}

CANDIDATE BASE RESUME DATA:
{json.dumps(base_resume, indent=2)}
"""

    if "gemini" in model_id.lower():
        if not gemini_key:
            raise ValueError("Gemini API Key missing.")
        # Default to settings.GEMINI_MODEL for Gemini requests
        gem_model = settings.GEMINI_MODEL if model_id in ["gemini", "gemini-2.5-flash", "gemini-3.8-flash"] else model_id
        llm = ChatGoogleGenerativeAI(
            model=gem_model,
            google_api_key=gemini_key,
            temperature=0.2
        )
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt_content}
        ]
        res = await asyncio.to_thread(llm.invoke, messages)
        raw_text = res.content if isinstance(res.content, str) else str(res.content)
        json_match = re.search(r"\{.*\}", raw_text, re.DOTALL)
        content_to_parse = json_match.group(0) if json_match else raw_text
        try:
            parsed = json.loads(content_to_parse)
        except Exception:
            parsed = ast.literal_eval(content_to_parse)
    else:
        if not groq_key:
            raise ValueError("Groq API Key missing.")
        llm = ChatGroq(
            model=model_id,
            groq_api_key=groq_key,
            temperature=0.2,
            model_kwargs={"response_format": {"type": "json_object"}}
        )
        res = await llm.ainvoke([
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt_content}
        ])
        parsed = json.loads(res.content)

    return {"result": parsed}

builder = StateGraph(TailorState)
builder.add_node("tailor_resume", run_llm_tailor_node)
builder.set_entry_point("tailor_resume")
builder.add_edge("tailor_resume", END)

resume_tailor_graph = builder.compile()
