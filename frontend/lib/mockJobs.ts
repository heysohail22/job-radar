export interface JobMatchItem {
  id: string;
  company: string;
  logo: string;
  role: string;
  matchScore: number;
  salary: string;
  location: string;
  postedDate: string;
  isRemote: boolean;
  tags: string[];
  description: string;
  whyMatches: string[];
  keySkills: string[];
  applyUrl: string;
}

export const MOCK_JOBS: JobMatchItem[] = [
  {
    id: "job-1",
    company: "OpenAI",
    logo: "openai",
    role: "GenAI Research Intern",
    matchScore: 96,
    salary: "₹80K – ₹1.2L / month",
    location: "Remote (Global)",
    postedDate: "Posted 2 days ago",
    isRemote: true,
    tags: ["Internship", "Remote", "LLMs", "Python"],
    description: "Join OpenAI's research team as a GenAI intern. You'll work on building next-generation AI models and tools, contribute to real-world applications of LLMs, and collaborate with world-class researchers and engineers.",
    whyMatches: [
      "Your skills (Python, LLMs, RAG) match the requirements",
      "You've worked on similar projects (Agentic Systems, Context Engineering)",
      "This role aligns with your interest in Generative AI",
      "Good fit for internship level",
    ],
    keySkills: ["Python", "Generative AI", "LLMs", "RAG", "Machine Learning"],
    applyUrl: "https://openai.com/careers",
  },
  {
    id: "job-2",
    company: "Anthropic",
    logo: "anthropic",
    role: "Applied AI Intern",
    matchScore: 92,
    salary: "₹70K – ₹1L / month",
    location: "Bengaluru, India",
    postedDate: "Posted 3 days ago",
    isRemote: false,
    tags: ["Internship", "On-site", "Safety", "Evaluation"],
    description: "Join our applied AI team to work on model evaluation, red-teaming, and building safe AI systems for real-world enterprise use.",
    whyMatches: [
      "Experience with AI evaluation frameworks (LangSmith, DeepEval)",
      "Knowledge of guardrails & alignment architectures",
      "Strong coding foundation in Python & TypeScript",
      "Interest in safety-critical model deployment",
    ],
    keySkills: ["Python", "Model Evaluation", "RLHF", "Guardrails", "AI Safety"],
    applyUrl: "https://anthropic.com/careers",
  },
  {
    id: "job-3",
    company: "Google",
    logo: "google",
    role: "Generative AI Intern",
    matchScore: 89,
    salary: "₹60K – ₹90K / month",
    location: "Remote",
    postedDate: "Posted 5 days ago",
    isRemote: true,
    tags: ["Internship", "Remote", "LLMs", "MLOps"],
    description: "Work on cutting-edge AI products. Collaborate with engineers and researchers to build impactful solutions using generative AI and foundational models.",
    whyMatches: [
      "Understanding of deep learning and transformer architectures",
      "Hands-on experience with API orchestration and cloud pipelines",
      "Demonstrated ability to build complete prototype applications",
    ],
    keySkills: ["Machine Learning", "Cloud Platform", "Google Research", "Python"],
    applyUrl: "https://careers.google.com",
  },
  {
    id: "job-4",
    company: "Microsoft",
    logo: "microsoft",
    role: "AI Engineer Intern",
    matchScore: 87,
    salary: "₹70K – ₹1L / month",
    location: "Hyderabad, India",
    postedDate: "Posted 4 days ago",
    isRemote: false,
    tags: ["Internship", "Hybrid", "Azure", "LLMs"],
    description: "Build and deploy GenAI solutions on Azure. Work with a global team on real customer problems spanning retrieval-augmented generation and autonomous assistants.",
    whyMatches: [
      "Familiarity with cloud hosting and vector embeddings",
      "Strong background in full-stack web and backend integration",
      "Excellent communication and collaborative problem solving",
    ],
    keySkills: ["Azure AI", "Python", "TypeScript", "Vector Search"],
    applyUrl: "https://careers.microsoft.com",
  },
  {
    id: "job-5",
    company: "LangChain",
    logo: "langchain",
    role: "Agentic Systems & Open Source Intern",
    matchScore: 95,
    salary: "₹85K – ₹1.3L / month",
    location: "Remote (Global)",
    postedDate: "Posted 1 day ago",
    isRemote: true,
    tags: ["Internship", "Remote", "LangGraph", "Agents"],
    description: "Contribute to LangChain and LangGraph open source ecosystems. Help build multi-agent benchmarks, context memory engines, and stateful agent graph workflows.",
    whyMatches: [
      "Direct hands-on experience with LangGraph & StateGraph architectures",
      "Strong open-source Python and TypeScript contributions",
      "Deep understanding of tool calling and persistent checkpointing",
    ],
    keySkills: ["LangGraph", "LangChain", "Python", "RAG", "Autonomous Agents"],
    applyUrl: "https://langchain.com/careers",
  },
];
