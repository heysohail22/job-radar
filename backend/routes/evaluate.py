import json
from fastapi import APIRouter, HTTPException
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from schemas import EvaluateRequest, EvaluateResponse
from config import settings

router = APIRouter(prefix="/api/jobs", tags=["Evaluation"])

@router.post("/evaluate", response_model=EvaluateResponse)
async def evaluate_job_match(req: EvaluateRequest):
    api_key = req.api_key or (settings.GEMINI_API_KEY if req.provider == "gemini" else settings.GROQ_API_KEY)
    
    if not api_key:
        # Fast fallback evaluation if no LLM key provided
        return EvaluateResponse(
            matchScore=88,
            matchReason=f"Good fit for candidate's background in {', '.join(req.candidate_skills[:3]) if req.candidate_skills else 'Gen AI and Web Engineering'}.",
            missingSkills=[]
        )
        
    prompt = f"""Evaluate candidate match for this job posting:
Candidate Title: {req.candidate_title}
Candidate Summary: {req.candidate_summary}
Candidate Skills: {', '.join(req.candidate_skills)}

Job Title: {req.job_title} at {req.company}
Job Description: {req.job_description[:1000]}

Return ONLY JSON:
{{
  "matchScore": 92,
  "matchReason": "1-2 sentences on why candidate fits this specific job",
  "missingSkills": ["skill1", "skill2"]
}}
"""

    try:
        if req.provider == "groq":
            llm = ChatGroq(
                model="llama-3.3-70b-versatile",
                groq_api_key=api_key,
                temperature=0.2,
                model_kwargs={"response_format": {"type": "json_object"}}
            )
        else:
            llm = ChatGoogleGenerativeAI(
                model="gemini-2.5-flash",
                google_api_key=api_key,
                temperature=0.2,
                response_mime_type="application/json"
            )
            
        res = await llm.ainvoke(prompt)
        parsed = json.loads(res.content)
        
        return EvaluateResponse(
            matchScore=min(max(int(parsed.get("matchScore", 85)), 50), 99),
            matchReason=str(parsed.get("matchReason", "Relevant position for candidate's skill set.")),
            missingSkills=list(parsed.get("missingSkills", []))
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")
