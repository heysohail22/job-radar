import type { ResumeDataType } from "./resumeData";

export interface TailorResponse {
  title: string;
  summary: string;
  targetRole?: string;
  skills: { category: string; items: string[] }[];
  projects: {
    name: string;
    subtitle: string;
    demoUrl?: string;
    tech: string[];
    bullets: string[];
  }[];
}

export interface AIModelOption {
  id: string;
  name: string;
  provider: "groq" | "gemini";
}

export const ALL_AI_MODELS: AIModelOption[] = [
  // Groq Models
  { id: "openai/gpt-oss-120b", name: "Groq: openai/gpt-oss-120b (120B Open-Source)", provider: "groq" },
  { id: "openai/gpt-oss-20b", name: "Groq: openai/gpt-oss-20b (20B Open-Source)", provider: "groq" },
  { id: "llama-3.3-70b-versatile", name: "Groq: llama-3.3-70b-versatile (Llama 70B)", provider: "groq" },
  { id: "qwen/qwen3.6-27b", name: "Groq: qwen/qwen3.6-27b (Qwen 27B)", provider: "groq" },

  // Google Gemini Models
  { id: "gemini-3.5-flash-lite", name: "Google: Gemini 3.5 Flash Lite (Ultra Fast)", provider: "gemini" },
  { id: "gemini-2.5-flash", name: "Google: Gemini 2.5 Flash (Fast)", provider: "gemini" }
];

const SYSTEM_PROMPT = `
You are an ethical ATS Resume Optimization Specialist & Senior Technical AI Recruiter.
Your objective is to optimize the candidate's authentic resume data to match the target Job Description (JD) with 100% honesty and zero fabrication.

CRITICAL ETHICAL CONSTRAINTS & RULES:
1. ABSOLUTE HONESTY & ZERO FABRICATION: You MUST NOT invent fake experiences, fake employers, fake degrees, or fake metrics. Furthermore, DO NOT add technologies, languages, or tools to the resume if they are not part of the candidate's actual background (Sohail Islam, BCA 2022-2025, Python, LangGraph, LangChain, Local Hugging Face LLMs, LoRA Fine-Tuning, FastAPI, REST APIs, Asyncio, PostgreSQL, Supabase, Vector Search/pgvector, Sarvam AI, WebSockets, AWS, Docker, CI/CD, Prompt Engineering, LangSmith, Ragas).
2. AUTHENTIC KEYWORD OPTIMIZATION: Re-phrase, emphasize, and prioritize the candidate's REAL tools, project architectures, and methodologies using phrasing and terminology from the target JD.
3. PRESERVE REAL QUANTIFIABLE METRICS: Retain and incorporate all real performance metrics (e.g., 99.4% intent routing accuracy, 95%+ groundedness, 60% latency reduction, 75% token cost savings, <800ms API response time).
4. TITLE ALIGNMENT: Adapt the candidate's title string (e.g., "Agentic AI Engineer", "AI Agent Implementation Specialist", "Python & AI Engineer") to reflect the target role while remaining true to their core background.
5. SUMMARY OPTIMIZATION: Write a compelling 3-4 sentence summary showcasing how the candidate's authentic multi-agent, RAG, and FastAPI background directly aligns with the target job requirements.
6. SKILLS CATEGORIZATION: Group the candidate's REAL technical skills into 4-5 relevant categories that match the JD's focus areas.
7. PROJECT BULLETS: Rephrase the 3 project entries ("DataPilot", "Cortex", "VaaniBook") to highlight the specific technical capabilities requested in the JD without adding unperformed tasks.
8. STRICT JSON SCHEMA: Return ONLY valid JSON matching this exact structure:

{
  "title": "string",
  "summary": "string",
  "skills": [
    { "category": "string", "items": ["string"] }
  ],
  "projects": [
    {
      "name": "string",
      "subtitle": "string",
      "demoUrl": "string",
      "tech": ["string"],
      "bullets": ["string"]
    }
  ]
}
`;

export async function tailorResumeWithAI(
  jobDescription: string,
  modelId: string = "openai/gpt-oss-120b",
  userGroqKey?: string,
  userGeminiKey?: string,
  baseResume?: ResumeDataType
): Promise<TailorResponse> {
  if (!jobDescription || !jobDescription.trim()) {
    throw new Error("Please paste a target Job Description (JD).");
  }

  const selectedOption = ALL_AI_MODELS.find((m) => m.id === modelId) || ALL_AI_MODELS[0];

  const envGroqKey = import.meta.env.VITE_GROQ_API_KEY || "";
  const envGeminiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

  if (selectedOption.provider === "gemini") {
    const finalGeminiKey = (userGeminiKey && userGeminiKey.trim()) || envGeminiKey;
    if (!finalGeminiKey) {
      throw new Error("Missing Gemini API Key. Please provide it in .env or UI.");
    }
    return callGeminiApi(jobDescription, finalGeminiKey, selectedOption.id, baseResume);
  } else {
    const finalGroqKey = (userGroqKey && userGroqKey.trim()) || envGroqKey;
    if (!finalGroqKey) {
      throw new Error("Missing Groq API Key. Please provide it in .env or UI.");
    }
    return callGroqApi(jobDescription, finalGroqKey, selectedOption.id, baseResume);
  }
}

export async function callGroqApi(
  jobDescription: string,
  apiKey: string,
  modelId: string,
  baseResume?: ResumeDataType
): Promise<TailorResponse> {
  const endpoint = "https://api.groq.com/openai/v1/chat/completions";

  const userPrompt = `
TARGET JOB DESCRIPTION:
${jobDescription}

CANDIDATE BASE RESUME DATA:
${baseResume ? JSON.stringify(baseResume, null, 2) : ""}
`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey.trim()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      response_format: { type: "json_object" },
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const msg = errorData.error?.message || `Groq API Error (Status ${response.status})`;
    throw new Error(msg);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content;

  if (!rawContent) throw new Error("Received empty response from Groq model.");
  return JSON.parse(rawContent);
}

export async function callGeminiApi(
  jobDescription: string,
  apiKey: string,
  modelId: string,
  baseResume?: ResumeDataType
): Promise<TailorResponse> {

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey.trim()}`;

  const fullPrompt = `${SYSTEM_PROMPT}

TARGET JOB DESCRIPTION:
${jobDescription}

CANDIDATE BASE RESUME DATA:
${JSON.stringify(baseResume, null, 2)}
`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const msg = errorData.error?.message || `Gemini API Error (Status ${response.status})`;
    throw new Error(msg);
  }

  const data = await response.json();
  const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawContent) throw new Error("Received empty response from Gemini model.");
  return JSON.parse(rawContent);
}
