from pydantic import BaseModel, Field
from typing import List, Optional

class JobPosting(BaseModel):
    id: str
    company: str
    title: str
    location: str
    url: str
    description: str
    posted_date: str = Field(alias="postedDate", default="Recently")
    source: str = "Greenhouse"
    tech_stack: List[str] = Field(alias="techStack", default_factory=list)
    match_score: int = Field(alias="matchScore", default=80)
    match_reason: str = Field(alias="matchReason", default="Matching role.")
    is_internship: bool = Field(alias="isInternship", default=True)
    company_stage: Optional[str] = Field(alias="companyStage", default="Seed / Series A")
    is_india: bool = Field(alias="isIndia", default=False)
    is_fresher: bool = Field(alias="isFresher", default=True)

    class Config:
        populate_by_name = True

class ScrapeRequest(BaseModel):
    search_query: Optional[str] = "Gen AI Intern"
    firecrawl_key: Optional[str] = None

class EvaluateRequest(BaseModel):
    job_title: str
    company: str
    job_description: str
    candidate_title: Optional[str] = "Full Stack AI Developer"
    candidate_summary: Optional[str] = ""
    candidate_skills: List[str] = Field(default_factory=list)
    provider: Optional[str] = "gemini" # gemini or groq
    api_key: Optional[str] = None

class EvaluateResponse(BaseModel):
    match_score: int = Field(alias="matchScore")
    match_reason: str = Field(alias="matchReason")
    missing_skills: List[str] = Field(alias="missingSkills", default_factory=list)

class TailorSkillCategory(BaseModel):
    category: str
    items: List[str]

class TailorProject(BaseModel):
    name: str
    subtitle: str
    tech: List[str]
    bullets: List[str]

class TailorRequest(BaseModel):
    job_description: str
    model_id: str = "gemini-2.5-flash"
    groq_key: Optional[str] = None
    gemini_key: Optional[str] = None
    base_resume: Optional[dict] = None

class TailorResponse(BaseModel):
    target_role: Optional[str] = Field(alias="targetRole", default=None)
    title: str
    summary: str
    skills: List[TailorSkillCategory]
    projects: List[TailorProject]
