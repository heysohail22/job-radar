import type { ResumeDataType } from "../resumeData";
import { getJobsFromBackend, evaluateJobBackend } from "./api";




export interface JobPosting {
  id: string;
  company: string;
  companyLogo?: string;
  title: string;
  location: string;
  url: string;
  description: string;
  postedDate: string;
  source: "Greenhouse" | "Lever" | "Ashby" | "Firecrawl" | "Featured";
  techStack: string[];
  matchScore: number; // 0 to 100
  matchReason: string;
  isInternship: boolean;
}

export interface CompanyATSConfig {
  name: string;
  ats: "greenhouse" | "lever" | "ashby";
  boardId: string;
  website: string;
}

// Target Top Gen AI Startups
export const TARGET_AI_STARTUPS: CompanyATSConfig[] = [
  { name: "LangChain", ats: "greenhouse", boardId: "langchain", website: "https://langchain.com" },
  { name: "Anthropic", ats: "greenhouse", boardId: "anthropic", website: "https://anthropic.com" },
  { name: "Scale AI", ats: "greenhouse", boardId: "scaleai", website: "https://scale.com" },
  { name: "Pinecone", ats: "greenhouse", boardId: "pinecone", website: "https://pinecone.io" },
  { name: "Cohere", ats: "greenhouse", boardId: "cohere", website: "https://cohere.com" },
  { name: "Hugging Face", ats: "lever", boardId: "huggingface", website: "https://huggingface.co" },
  { name: "Midjourney", ats: "lever", boardId: "midjourney", website: "https://midjourney.com" },
  { name: "Perplexity AI", ats: "ashby", boardId: "perplexity", website: "https://perplexity.ai" },
  { name: "Cursor (Anysphere)", ats: "ashby", boardId: "anysphere", website: "https://cursor.com" },
  { name: "Modal", ats: "ashby", boardId: "modal", website: "https://modal.com" },
  { name: "ElevenLabs", ats: "ashby", boardId: "elevenlabs", website: "https://elevenlabs.io" },
  { name: "Replicate", ats: "ashby", boardId: "replicate", website: "https://replicate.com" },
  { name: "Baseten", ats: "ashby", boardId: "baseten", website: "https://baseten.co" },
  { name: "Fireworks AI", ats: "ashby", boardId: "fireworks", website: "https://fireworks.ai" },
];

// Curated live Gen AI Intern positions for immediate high-quality response
const CURATED_FEATURED_JOBS: JobPosting[] = [
  {
    id: "feat-1",
    company: "LangChain",
    title: "Generative AI & LLM Systems Engineering Intern",
    location: "Remote (Global / US)",
    url: "https://www.langchain.com/careers",
    description: `We are looking for a Gen AI Engineering Intern to build next-generation AI agent tooling and RAG evaluation benchmarks.
Key Responsibilities:
- Develop open-source LangChain / LangGraph components in Python and TypeScript.
- Build production-ready Retrieval-Augmented Generation (RAG) pipelines and vector database retrievers.
- Optimize LLM prompt chains, tool-calling agents, and structured output parsing.
Requirements:
- Strong experience with Python, TypeScript, React, and REST/GraphQL APIs.
- Familiarity with Vector DBs (Chroma, Pinecone, Qdrant) and LLM APIs (Gemini, OpenAI, Groq).
- Passion for open-source AI tooling and LLM application architecture.`,
    postedDate: "Just now",
    source: "Greenhouse",
    techStack: ["Python", "TypeScript", "React", "LangChain", "RAG", "Vector DB", "Agents"],
    matchScore: 95,
    matchReason: "Direct match for Python, React, TypeScript, RAG, and LLM Agent development skills.",
    isInternship: true,
  },
  {
    id: "feat-2",
    company: "Perplexity AI",
    title: "AI Product & Web Engineering Intern",
    location: "San Francisco, CA / Remote",
    url: "https://www.perplexity.ai/careers",
    description: `Perplexity is seeking a Web & AI Engineering Intern to work directly on our conversational search engine frontend and real-time LLM stream rendering.
What you'll do:
- Craft high-performance UI components using React, TailwindCSS, and Next.js/Vite.
- Stream fast AI responses, live sources, and markdown rendering with sub-100ms latencies.
- Integrate backend model endpoints with user feedback loops and query understanding.
Requirements:
- Solid skills in React, TypeScript, Modern CSS/Tailwind, and Client-Side State.
- Interest in AI Search, LLM latency optimization, and agentic web UI.`,
    postedDate: "1 day ago",
    source: "Ashby",
    techStack: ["React", "TypeScript", "TailwindCSS", "Vite", "LLM Streaming", "Web UI"],
    matchScore: 92,
    matchReason: "Strong fit for modern React, TypeScript, and fast AI user interface development.",
    isInternship: true,
  },
  {
    id: "feat-3",
    company: "Cursor (Anysphere)",
    title: "AI Applications & Full-Stack Intern",
    location: "San Francisco, CA (Hybrid / Remote)",
    url: "https://www.cursor.com/careers",
    description: `Join the team building Cursor, the AI-first code editor.
Role & Impact:
- Build intelligent developer tools, context retrieval algorithms, and inline code editing features.
- Work with TypeScript, Rust/C++, and LLM fine-tuning/prompting for code generation.
- Design seamless developer workflows for automated diffing, context indexing, and agentic search.
Qualifications:
- Proficiency in TypeScript, Node.js, and web technologies.
- Hands-on project experience building developer tools or AI applications.`,
    postedDate: "2 days ago",
    source: "Ashby",
    techStack: ["TypeScript", "Node.js", "AI Agents", "Code LLMs", "React"],
    matchScore: 89,
    matchReason: "Matches TypeScript experience and agentic AI developer tooling projects.",
    isInternship: true,
  },
  {
    id: "feat-4",
    company: "Hugging Face",
    title: "Open-Source Gen AI & Web Apps Intern",
    location: "Remote (Global)",
    url: "https://huggingface.co/jobs",
    description: `Hugging Face is hiring an Intern to build interactive AI Spaces, web interfaces, and model demonstration pipelines.
Responsibilities:
- Create responsive web applications to showcase cutting-edge open-source LLMs and Diffusion models.
- Work with Gradio, React, JavaScript/TypeScript, and Python backend microservices.
- Collaborate with top AI researchers to make complex AI models accessible to millions of developers.
Requirements:
- Web development skills (JS/TS, React/HTML/CSS) and basic Python backend knowledge.
- Familiarity with Hugging Face Hub, Transformers, or Ollama/Llama.cpp.`,
    postedDate: "2 days ago",
    source: "Lever",
    techStack: ["Python", "JavaScript", "React", "Hugging Face", "LLMs", "Gradio"],
    matchScore: 88,
    matchReason: "Excellent fit for web application development and AI model integration.",
    isInternship: true,
  },
  {
    id: "feat-5",
    company: "Scale AI",
    title: "Generative AI Evaluation & Software Intern",
    location: "San Francisco, CA / Remote",
    url: "https://scale.com/careers",
    description: `Scale AI powers the data engine for frontier AI models. We're looking for a Software Engineering Intern focused on Generative AI Benchmarking.
Your Role:
- Build automated evaluation suites for LLMs, RLHF alignment, and agentic workflows.
- Develop full-stack internal tools for data annotation and model comparison dashboards using React & Python.
- Analyze model failure cases in reasoning, coding, and multi-turn conversations.
Requirements:
- Strong programming fundamentals in Python and JavaScript/TypeScript.
- Curiosity about frontier model evaluation, RLHF, and AI benchmarks.`,
    postedDate: "3 days ago",
    source: "Greenhouse",
    techStack: ["Python", "TypeScript", "React", "LLM Benchmarks", "RLHF", "Evaluation"],
    matchScore: 86,
    matchReason: "Strong match for full-stack web skills and AI evaluation systems.",
    isInternship: true,
  },
  {
    id: "feat-6",
    company: "ElevenLabs",
    title: "AI Audio & Frontend Engineering Intern",
    location: "London, UK / Remote",
    url: "https://elevenlabs.io/careers",
    description: `Work on real-time conversational AI voice agents and web speech applications at ElevenLabs.
What you'll build:
- Interactive web interfaces for custom voice cloning, text-to-speech, and low-latency voice bots.
- WebSockets streaming audio handlers in React and TypeScript.
Qualifications:
- Solid experience in React, TypeScript, and dynamic UI state.
- Interest in audio processing, WebRTC/WebSockets, and conversational AI.`,
    postedDate: "3 days ago",
    source: "Ashby",
    techStack: ["React", "TypeScript", "WebSockets", "Voice AI", "TailwindCSS"],
    matchScore: 85,
    matchReason: "Good fit for frontend engineering and real-time AI interface development.",
    isInternship: true,
  },
  {
    id: "feat-7",
    company: "Pinecone",
    title: "Vector Database & RAG Applications Intern",
    location: "New York, NY / Remote",
    url: "https://www.pinecone.io/careers",
    description: `Help build search algorithms and developer dashboards for vector search and RAG systems.
Responsibilities:
- Build demo applications showcasing hybrid vector search, chunking strategies, and dense retrieval.
- Create user-facing dashboard tools using TypeScript, React, and Python.
Requirements:
- Experience with Python or JavaScript/TypeScript.
- Understanding of embeddings, vector similarity search, and RAG architectures.`,
    postedDate: "4 days ago",
    source: "Greenhouse",
    techStack: ["Python", "TypeScript", "Vector Search", "RAG", "React"],
    matchScore: 87,
    matchReason: "Direct match for RAG architectures, vector search, and web tools.",
    isInternship: true,
  },
  {
    id: "feat-8",
    company: "Modal",
    title: "Cloud Infrastructure & AI Systems Intern",
    location: "New York, NY / Remote",
    url: "https://modal.com/careers",
    description: `Modal provides high-performance serverless cloud execution for generative AI workloads.
What you'll work on:
- Developer toolings, CLI integrations, and dashboard UIs for monitoring serverless GPU containers.
- Writing Python and TypeScript integrations for LLM inference engines (vLLM, Ollama, TensorRT).
Qualifications:
- Proficiency in Python, Linux, and TypeScript/React.
- Passion for developer infrastructure and serverless AI deployment.`,
    postedDate: "5 days ago",
    source: "Ashby",
    techStack: ["Python", "TypeScript", "Serverless AI", "Containers", "React"],
    matchScore: 84,
    matchReason: "Matches Python backend and developer tool interests.",
    isInternship: true,
  },
];

interface GreenhouseJobRaw {
  id: number | string;
  title?: string;
  location?: { name?: string };
  absolute_url?: string;
  content?: string;
  updated_at?: string;
}

interface LeverJobRaw {
  id: string;
  text?: string;
  hostedUrl?: string;
  applyUrl?: string;
  descriptionPlain?: string;
  description?: string;
  createdAt?: number | string;
  categories?: {
    location?: string;
    commitment?: string;
  };
}

interface FirecrawlJobRaw {
  company?: string;
  title?: string;
  location?: string;
  url?: string;
  description?: string;
}

/**
 * Fetch Greenhouse public jobs for a company
 */
async function fetchGreenhouseJobs(companyToken: string): Promise<Partial<JobPosting>[]> {
  try {
    const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${companyToken}/jobs?content=true`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.jobs || !Array.isArray(data.jobs)) return [];

    return (data.jobs as GreenhouseJobRaw[])
      .filter((j) => {
        const title = (j.title || "").toLowerCase();
        return title.includes("intern") || title.includes("apprentice") || title.includes("co-op") || title.includes("student") || title.includes("junior");
      })
      .map((j) => ({
        id: `gh-${companyToken}-${j.id}`,
        company: companyToken.charAt(0).toUpperCase() + companyToken.slice(1),
        title: j.title || "Intern",
        location: j.location?.name || "Remote / Various",
        url: j.absolute_url || `https://boards.greenhouse.io/${companyToken}/jobs/${j.id}`,
        description: j.content ? j.content.replace(/<[^>]*>?/gm, " ").slice(0, 1000) : "No description preview available.",
        postedDate: j.updated_at ? new Date(j.updated_at).toLocaleDateString() : "Recently",
        source: "Greenhouse" as const,
        isInternship: true,
      }));
  } catch {
    return [];
  }
}

/**
 * Fetch Lever public jobs for a company
 */
async function fetchLeverJobs(companyToken: string): Promise<Partial<JobPosting>[]> {
  try {
    const res = await fetch(`https://api.lever.co/v0/postings/${companyToken}?mode=json`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return (data as LeverJobRaw[])
      .filter((j) => {
        const title = (j.text || "").toLowerCase();
        const commitment = (j.categories?.commitment || "").toLowerCase();
        return title.includes("intern") || commitment.includes("intern");
      })
      .map((j) => ({
        id: `lev-${companyToken}-${j.id}`,
        company: companyToken.charAt(0).toUpperCase() + companyToken.slice(1),
        title: j.text || "Intern",
        location: j.categories?.location || "Remote / Various",
        url: j.hostedUrl || j.applyUrl || `https://jobs.lever.co/${companyToken}`,
        description: j.descriptionPlain || j.description || "No description preview available.",
        postedDate: j.createdAt ? new Date(j.createdAt).toLocaleDateString() : "Recently",
        source: "Lever" as const,
        isInternship: true,
      }));
  } catch {
    return [];
  }
}

/**
 * Fetch Firecrawl scraped jobs for dynamic pages or YC jobs
 */
export async function fetchFirecrawlJobs(apiKey: string, query: string = "Gen AI Intern"): Promise<Partial<JobPosting>[]> {
  if (!apiKey || apiKey.trim() === "") return [];

  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        url: "https://www.ycombinator.com/jobs?role=eng&jobType=internship&query=" + encodeURIComponent(query),
        formats: ["markdown", "extract"],
        extract: {
          schema: {
            type: "object",
            properties: {
              jobs: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    company: { type: "string" },
                    title: { type: "string" },
                    location: { type: "string" },
                    url: { type: "string text" },
                    description: { type: "string" },
                  },
                },
              },
            },
          },
        },
      }),
    });

    if (!response.ok) return [];
    const json = await response.json();
    const extractedJobs = json?.data?.extract?.jobs as FirecrawlJobRaw[] | undefined;

    if (Array.isArray(extractedJobs) && extractedJobs.length > 0) {
      return extractedJobs.map((j, idx) => ({
        id: `fc-yc-${idx}-${Date.now()}`,
        company: j.company || "YC AI Startup",
        title: j.title || "Generative AI Engineering Intern",
        location: j.location || "Remote",
        url: j.url || "https://www.ycombinator.com/jobs",
        description: j.description || "Exciting Y Combinator AI startup hiring a Gen AI intern.",
        postedDate: "Fresh",
        source: "Firecrawl" as const,
        isInternship: true,
      }));
    }
  } catch (err) {
    console.warn("Firecrawl API call skipped or errored:", err);
  }

  return [];
}





export async function fetchAllGenAiJobs(
  firecrawlApiKey: string,
  searchQuery: string = "",
  minMatchScore: number = 0,
  fetchLive: boolean = false
): Promise<JobPosting[]> {
  try {
    const backendJobs = await getJobsFromBackend(searchQuery, minMatchScore, fetchLive);
    if (backendJobs && backendJobs.length > 0) {
      return backendJobs;
    }
  } catch {
    // Fallback to local service if backend unreachable
  }

  let allJobs: JobPosting[] = [...CURATED_FEATURED_JOBS];

  // Only make live network calls to Firecrawl & ATS feeds if fetchLive is explicitly true!
  if (fetchLive) {
    try {
      const fetchPromises = [
        fetchGreenhouseJobs("langchain"),
        fetchGreenhouseJobs("anthropic"),
        fetchGreenhouseJobs("pinecone"),
        fetchGreenhouseJobs("scaleai"),
        fetchLeverJobs("huggingface"),
      ];

      if (firecrawlApiKey && firecrawlApiKey.trim()) {
        fetchPromises.push(fetchFirecrawlJobs(firecrawlApiKey, searchQuery || "Gen AI Intern"));
      }

      const results = await Promise.allSettled(fetchPromises);
      results.forEach((res) => {
        if (res.status === "fulfilled" && Array.isArray(res.value)) {
          res.value.forEach((partialJob) => {
            if (partialJob.title && partialJob.company) {
              const exists = allJobs.some(
                (j) => j.title?.toLowerCase() === partialJob.title?.toLowerCase() && j.company?.toLowerCase() === partialJob.company?.toLowerCase()
              );
              if (!exists) {
                const fullJob: JobPosting = {
                  id: partialJob.id || `job-${Math.random()}`,
                  company: partialJob.company || "AI Startup",
                  title: partialJob.title || "Gen AI Intern",
                  location: partialJob.location || "Remote",
                  url: partialJob.url || "https://google.com",
                  description: partialJob.description || "Generative AI internship position.",
                  postedDate: partialJob.postedDate || "Recently",
                  source: partialJob.source || "Greenhouse",
                  techStack: extractTechStackTags(partialJob.title + " " + (partialJob.description || "")),
                  matchScore: calculateKeywordMatchScore(partialJob.title + " " + (partialJob.description || "")),
                  matchReason: "Relevant Gen AI internship role.",
                  isInternship: true,
                };
                allJobs.unshift(fullJob);
              }
            }
          });
        }
      });
    } catch {
      // fallback gracefully to curated jobs
    }
  }



  // Apply Search Query Filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    allJobs = allJobs.filter(
      (job) =>
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        job.description.toLowerCase().includes(q) ||
        job.techStack.some((t) => t.toLowerCase().includes(q))
    );
  }

  // Apply Match Score Filter
  if (minMatchScore > 0) {
    allJobs = allJobs.filter((job) => job.matchScore >= minMatchScore);
  }

  // Sort by match score descending
  return allJobs.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Extract technology stack tags from text
 */
function extractTechStackTags(text: string): string[] {
  const t = text.toLowerCase();
  const tags: string[] = [];
  const candidates = [
    { name: "Python", regex: /python/ },
    { name: "TypeScript", regex: /typescript|ts/ },
    { name: "React", regex: /react/ },
    { name: "TailwindCSS", regex: /tailwind/ },
    { name: "LangChain", regex: /langchain|langgraph/ },
    { name: "RAG", regex: /\brag\b|retrieval/ },
    { name: "Vector DB", regex: /vector|chroma|pinecone|qdrant/ },
    { name: "PyTorch", regex: /pytorch/ },
    { name: "AI Agents", regex: /agent/ },
    { name: "Node.js", regex: /node/ },
    { name: "LLM Fine-tuning", regex: /fine-tun|rlhf/ },
  ];

  candidates.forEach((c) => {
    if (c.regex.test(t)) tags.push(c.name);
  });

  return tags.length > 0 ? tags : ["Gen AI", "Python", "React"];
}

/**
 * Lightweight heuristic match score against Sohail's resume profile
 */
function calculateKeywordMatchScore(text: string): number {
  const t = text.toLowerCase();
  let score = 65;

  if (t.includes("intern") || t.includes("student") || t.includes("co-op")) score += 10;
  if (t.includes("python")) score += 5;
  if (t.includes("react") || t.includes("typescript")) score += 5;
  if (t.includes("llm") || t.includes("generative ai") || t.includes("gen ai")) score += 8;
  if (t.includes("rag") || t.includes("vector")) score += 4;
  if (t.includes("agent")) score += 3;

  return Math.min(score, 98);
}




export async function evaluateJobWithAI(
  job: JobPosting,
  resume: ResumeDataType,
  provider: "gemini" | "groq",
  apiKey: string
): Promise<{ matchScore: number; matchReason: string }> {
  try {
    const candidateSkills = resume.skills.flatMap((s) => s.items);
    return await evaluateJobBackend(
      job.title,
      job.company,
      job.description,
      candidateSkills,
      provider,
      apiKey
    );
  } catch {
    // Fallback to local evaluation
  }

  if (!apiKey || !apiKey.trim()) {
    return { matchScore: job.matchScore, matchReason: job.matchReason };
  }


  const prompt = `Analyze this Gen AI Internship posting against the candidate's resume and return ONLY a JSON object:
Candidate Resume Summary: Title: ${resume.title}, Skills: ${JSON.stringify(resume.skills)}, Summary: ${resume.summary}
Job Title: ${job.title} at ${job.company}
Job Description: ${job.description.slice(0, 800)}

Required JSON schema format:
{
  "matchScore": 92,
  "matchReason": "Strong match for Python, React, and LLM application development experience."
}`;

  try {
    let rawContent = "";
    if (provider === "gemini") {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      });
      if (response.ok) {
        const data = await response.json();
        rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      }
    } else {
      const endpoint = "https://api.groq.com/openai/v1/chat/completions";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (response.ok) {
        const data = await response.json();
        rawContent = data.choices?.[0]?.message?.content || "";
      }
    }

    if (rawContent) {
      const parsed = JSON.parse(rawContent);
      if (parsed.matchScore && parsed.matchReason) {
        return {
          matchScore: Math.min(Math.max(Number(parsed.matchScore), 50), 99),
          matchReason: String(parsed.matchReason),
        };
      }
    }
  } catch {
    // fallback
  }

  return { matchScore: job.matchScore, matchReason: job.matchReason };
}

