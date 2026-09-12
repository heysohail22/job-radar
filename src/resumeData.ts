export interface ProjectItem {
  name: string;
  subtitle: string;
  demoUrl?: string;
  videoUrl?: string;
  docUrl?: string;
  tech: string[];
  bullets: string[];
}

export interface SkillCategory {
  category: string;
  items: string[];
}

export interface ContactInfo {
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
}

export interface EducationInfo {
  degree: string;
  institution: string;
  duration: string;
  location: string;
  cgpa: string;
}

export interface ResumeDataType {
  name: string;
  title: string;
  contact: ContactInfo;
  summary: string;
  skills: SkillCategory[];
  projects: ProjectItem[];
  education: EducationInfo;
}

export const resumeData: ResumeDataType = {
  name: "Sohal Islam",
  title: "AI Engineer | Agentic Systems & LLMs",
  contact: {
    email: "sohelsilamblg01@gmail.com",
    phone: "+91 70733 67227",
    location: "West Bengal, India",
    linkedin: "https://www.linkedin.com/in/heysohail22",
    github: "https://github.com/heysohail22",
  },
  summary:
    "AI Engineer focused on solving business problems through production-grade agentic architectures and reliable RAG pipelines. Skilled at turning complex workflows into deterministic, guardrailed systems that cut operational costs and deliver fast, trustworthy AI solutions.",
  skills: [
    {
      category: "Languages & Core",
      items: [
        "Python (Asyncio)",
        "SQL (PostgreSQL)",
        "JavaScript",
        "TypeScript",
      ],
    },
    {
      category: "Agentic AI & Orchestration",
      items: [
        "LangGraph (StateGraph)",
        "LangChain",
        "Multi-Agent Workflows",
        "Autonomous Tool Calling",
        "Postgres Checkpointing",
        "Context Engineering",
      ],
    },
    {
      category: "RAG, Evals & Guardrails",
      items: [
        "Corrective RAG (CRAG)",
        "pgvector (Supabase)",
        "Ragas",
        "DeepEval",
        "LangSmith (Tracing & Evals)",
        "Pydantic Guardrails",
        "gpt-oss-safeguard"
      ],
    },
    {
      category: "Model Optimization & Fine-Tuning",
      items: [
        "Hugging Face (PEFT, SFT)",
        "QLoRA & LoRA",
        "4-bit/8-bit Quantization",
        "PyTorch",
        "Groq LPUs",
        "Prompt Caching",
        "GPT-OSS & Qwen 3.6",
      ],
    },
    {
      category: "Backend, Cloud & Web",
      items: [
        "FastAPI (REST APIs, SSE)",
        "Next.js",
        "React",
        "AWS (EC2, S3, ECR, ECS, RDS, CloudWatch)",
        "Docker",
        "CI/CD Pipelines (GitHub Actions)",
        "Git",
      ],
    },
  ],
  projects: [
    {
      name: "DataPilot",
      subtitle: "Autonomous Text-to-SQL & Business Data Intelligence Platform",
      demoUrl: "https://datapilot.duckdns.org",
      videoUrl: "https://lnkd.in/p/dgYMyS9t",
      tech: [
        "LangGraph StateGraph",
        "FastAPI",
        "PostgreSQL",
        "Self-Healing SQL",
        "DeepEval",
        "LangSmith",
        "Groq LPUs",
        "Next.js",
      ],
      bullets: [
        "Engineered an autonomous agent empowering small businesses to extract revenue trends, inventory anomalies, and customer insights via plain English to SQL with self-healing query correction in 1.3s.",
        "Cut end-to-end query token consumption by 85% using relational schema pruning, dynamic context window sizing, and sub-millisecond zero-token deterministic security guardrails.",
        "Benchmarked across 210 test scenarios using automated LLM-as-a-Judge, achieving 99.6% data faithfulness and integrating Human-in-the-Loop (HITL) approval gates for critical actions.",
      ],
    },
    {
      name: "Cortex",
      subtitle: "Multi-Agent Corrective RAG (CRAG) & Evaluation Guardrails Platform",
      demoUrl: "https://cortex-ai.duckdns.org",
      tech: [
        "LangGraph",
        "Corrective RAG (CRAG)",
        "pgvector",
        "Groq LPUs",
        "Ragas & DeepEval",
        "Tavily Search",
        "PII Redaction",
        "Security Guardrails",
      ],
      bullets: [
        "Architected an adaptive Corrective RAG (CRAG) state machine dynamically routing queries across pgvector vector search, Tavily web search, and direct LLM generation with 100% route accuracy across 27 evaluation benchmarks.",
        "Engineered automated guardrails and evaluation suite achieving 100% safety & prompt injection blocking (0ms overhead), automated PII redaction, 87.0% faithfulness (groundedness), and 88.9% answer relevance.",
        "Integrated dual-model routing (gemini 3.5 flash lite routing validator + GPT-OSS-120B synthesizer) on Groq LPUs with prompt caching, slashing inference token costs by 74% and eliminating hallucinations.",
      ],
    },
    {
      name: "VaaniBook",
      subtitle: "Real-Time Multilingual Voice AI Agent for Autonomous Restaurant Reservations",
      demoUrl: "https://vaanibook.duckdns.org",
      tech: [
        "Sarvam Voice Agent",
        "LangGraph",
        "FastAPI",
        "WebSockets",
        "PostgreSQL",
        "LLM-as-a-Judge Evals",
        "Pydantic Guardrails",
        "Docker",
      ],
      bullets: [
        "Integrated and tuned Sarvam Voice Agent to autonomously handle restaurant reservations in code-mixed Hindi & English, achieving a 95%+ successful booking completion rate across multi-turn voice calls.",
        "Built a high-performance FastAPI backend with custom webhook tools for real-time table availability lookups, keeping tool execution latency under 200ms to preserve natural conversation flow.",
        "Engineered idempotent PostgreSQL reservation transactions with strict Pydantic validation, eliminating 100% of double-booking collisions and reducing average call duration to <45 seconds.",
      ],
    },
  ],
  education: {
    degree: "Bachelor of Computer Applications (BCA)",
    institution: "DR. C.V. Raman University",
    duration: "2022 - 2025",
    location: "Balurghat, West Bengal",
    cgpa: "CGPA: 8.5",
  },
};
