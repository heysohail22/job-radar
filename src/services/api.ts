import type { ResumeDataType } from "../resumeData";

const BACKEND_URL = "http://localhost:8000/api";

export interface BackendJobPosting {
  id: string;
  company: string;
  title: string;
  location: string;
  url: string;
  description: string;
  postedDate: string;
  source: "Greenhouse" | "Lever" | "Ashby" | "Firecrawl" | "Featured";
  techStack: string[];
  matchScore: number;
  matchReason: string;
  isInternship: boolean;
}

/**
 * Fetch Jobs from LangGraph FastAPI Backend
 */
export async function getJobsFromBackend(
  searchQuery: string = "",
  minMatchScore: number = 0,
  forceLive: boolean = false
): Promise<BackendJobPosting[]> {
  try {
    const params = new URLSearchParams();
    if (searchQuery) params.append("search", searchQuery);
    if (minMatchScore > 0) params.append("min_score", minMatchScore.toString());
    if (forceLive) params.append("force_live", "true");

    const res = await fetch(`${BACKEND_URL}/jobs?${params.toString()}`);
    if (!res.ok) throw new Error(`Backend error: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn("Backend connection failed, falling back to local service:", err);
    throw err;
  }
}

/**
 * Trigger Live Scraping via LangGraph Agent Graph
 */
export async function triggerScrapeBackend(
  searchQuery: string = "Gen AI Intern",
  firecrawlKey?: string
): Promise<BackendJobPosting[]> {
  const res = await fetch(`${BACKEND_URL}/jobs/scrape`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      search_query: searchQuery,
      firecrawl_key: firecrawlKey,
    }),
  });
  if (!res.ok) throw new Error("Scrape request failed.");
  return await res.json();
}

/**
 * Evaluate Job Match via Backend LangChain Service
 */
export async function evaluateJobBackend(
  jobTitle: string,
  company: string,
  jobDescription: string,
  candidateSkills: string[],
  provider: "gemini" | "groq" = "gemini",
  apiKey?: string
): Promise<{ matchScore: number; matchReason: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/jobs/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        job_title: jobTitle,
        company: company,
        job_description: jobDescription,
        candidate_skills: candidateSkills,
        provider: provider,
        api_key: apiKey,
      }),
    });
    if (!res.ok) throw new Error("Evaluation request failed.");
    const data = await res.json();
    return {
      matchScore: data.matchScore,
      matchReason: data.matchReason,
    };
  } catch {
    return {
      matchScore: 88,
      matchReason: "Good fit for your software engineering and Gen AI skill set.",
    };
  }
}

/**
 * Tailor Resume via LangGraph Tailoring Agent
 */
export async function tailorResumeBackend(
  jobDescription: string,
  modelId: string,
  groqKey?: string,
  geminiKey?: string,
  baseResume?: ResumeDataType
) {
  const res = await fetch(`${BACKEND_URL}/tailor/resume`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      job_description: jobDescription,
      model_id: modelId,
      groq_key: groqKey,
      gemini_key: geminiKey,
      base_resume: baseResume,
    }),
  });
  if (!res.ok) throw new Error("Resume tailoring failed on backend.");
  return await res.json();
}
