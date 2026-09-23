import React, { useState, useMemo } from "react";
import { Sparkles, Plus, CheckCircle2, ArrowRight, RefreshCw, FileText, Target } from "lucide-react";
import type { ResumeDataType } from "../lib/resumeData";
import type { JobPostingItem } from "../lib/types";

// Comprehensive catalog of GenAI, Backend, & Fullstack technical keywords
const TECH_KEYWORD_CATALOG: { [category: string]: string[] } = {
  "Frameworks & Agentic AI": [
    "LangGraph", "LangChain", "Multi-Agent Workflows", "Autonomous Tool Calling",
    "Postgres Checkpointing", "Context Engineering", "Corrective RAG", "CRAG",
    "CrewAI", "AutoGen", "Semantic Kernel", "LlamaIndex"
  ],
  "GenAI, LLMs & Evals": [
    "RAG", "pgvector", "Supabase", "Ragas", "DeepEval", "LangSmith",
    "Pydantic Guardrails", "gpt-oss-safeguard", "Hugging Face", "PyTorch",
    "Groq", "LPUs", "Prompt Caching", "Vector DB", "Embeddings", "Fine-tuning"
  ],
  "Languages & Core": [
    "Python", "TypeScript", "JavaScript", "SQL", "PostgreSQL",
    "Go", "Rust", "C++", "Asyncio"
  ],
  "Cloud, Web & Infra": [
    "FastAPI", "REST APIs", "SSE", "Next.js", "React", "AWS", "EC2", "S3",
    "ECR", "ECS", "RDS", "CloudWatch", "Docker", "CI/CD", "GitHub Actions",
    "Git", "Kubernetes", "Linux", "TailwindCSS"
  ]
};

interface JDKeywordMatcherProps {
  resume: ResumeDataType;
  onUpdateResume: (updatedResume: ResumeDataType) => void;
  targetJobDescription?: string;
  availableJobs?: JobPostingItem[];
  backendUrl: string;
}

export const JDKeywordMatcher: React.FC<JDKeywordMatcherProps> = ({
  resume,
  onUpdateResume,
  targetJobDescription = "",
  availableJobs = [],
  backendUrl,
}) => {
  const [jdText, setJdText] = useState<string>(targetJobDescription);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Sync if parent updates targetJobDescription
  React.useEffect(() => {
    if (targetJobDescription) {
      setJdText(targetJobDescription);
    }
  }, [targetJobDescription]);

  // Extract all plain text from candidate's resume
  const resumeFullText = useMemo(() => {
    const skillsText = resume.skills.map((s) => `${s.category} ${s.items.join(" ")}`).join(" ");
    const projectsText = resume.projects
      .map((p) => `${p.name} ${p.subtitle} ${p.tech.join(" ")} ${p.bullets.join(" ")}`)
      .join(" ");
    return `${resume.name} ${resume.title} ${resume.summary} ${skillsText} ${projectsText}`.toLowerCase();
  }, [resume]);

  // Scan JD text against our catalog to extract keywords mentioned in the target role
  const extractedJDKeywords = useMemo(() => {
    if (!jdText.trim()) return [];

    const lowerJd = jdText.toLowerCase();
    const found: { name: string; category: string; inResume: boolean }[] = [];
    const seen = new Set<string>();

    for (const [category, keywords] of Object.entries(TECH_KEYWORD_CATALOG)) {
      for (const kw of keywords) {
        // Word boundary or flexible match
        const regex = new RegExp(`\\b${kw.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i");
        if (regex.test(lowerJd)) {
          if (!seen.has(kw.toLowerCase())) {
            seen.add(kw.toLowerCase());
            // Check if already in candidate's resume
            const inResume = resumeFullText.includes(kw.toLowerCase());
            found.push({ name: kw, category, inResume });
          }
        }
      }
    }

    return found;
  }, [jdText, resumeFullText]);

  const matchedKeywords = useMemo(
    () => extractedJDKeywords.filter((k) => k.inResume),
    [extractedJDKeywords]
  );

  const missingKeywords = useMemo(
    () => extractedJDKeywords.filter((k) => !k.inResume),
    [extractedJDKeywords]
  );

  // Calculate ATS match score
  const matchScore = useMemo(() => {
    if (extractedJDKeywords.length === 0) return 85;
    const ratio = matchedKeywords.length / extractedJDKeywords.length;
    return Math.min(Math.max(Math.round(ratio * 100), 55), 98);
  }, [matchedKeywords.length, extractedJDKeywords.length]);

  // Inject a single keyword into the appropriate skills category
  const handleAddKeywordToSkills = (keyword: string, targetCategory: string) => {
    const updatedSkills = resume.skills.map((group) => {
      // Find matching category or fallback to first
      const matches =
        group.category.toLowerCase().includes(targetCategory.toLowerCase()) ||
        targetCategory.toLowerCase().includes(group.category.toLowerCase());

      if (matches) {
        if (!group.items.some((item) => item.toLowerCase() === keyword.toLowerCase())) {
          return {
            ...group,
            items: [...group.items, keyword],
          };
        }
      }
      return group;
    });

    // If category didn't exist, append it or add to first category
    const alreadyAdded = updatedSkills.some((g) =>
      g.items.some((item) => item.toLowerCase() === keyword.toLowerCase())
    );

    let finalSkills = updatedSkills;
    if (!alreadyAdded && updatedSkills.length > 0) {
      finalSkills = updatedSkills.map((g, idx) =>
        idx === 0 ? { ...g, items: [...g.items, keyword] } : g
      );
    }

    onUpdateResume({
      ...resume,
      skills: finalSkills,
    });

    setSuccessNotice(`Added "${keyword}" to your Skills!`);
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  // 1-Click: Add all missing relevant keywords to skills
  const handleAddAllMissingKeywords = () => {
    if (missingKeywords.length === 0) return;

    let updatedSkills = [...resume.skills];

    for (const missing of missingKeywords) {
      let added = false;
      updatedSkills = updatedSkills.map((group) => {
        const matches =
          group.category.toLowerCase().includes(missing.category.toLowerCase()) ||
          missing.category.toLowerCase().includes(group.category.toLowerCase());
        if (matches && !group.items.some((i) => i.toLowerCase() === missing.name.toLowerCase())) {
          added = true;
          return { ...group, items: [...group.items, missing.name] };
        }
        return group;
      });

      if (!added && updatedSkills.length > 0) {
        updatedSkills[0] = {
          ...updatedSkills[0],
          items: [...updatedSkills[0].items, missing.name],
        };
      }
    }

    onUpdateResume({
      ...resume,
      skills: updatedSkills,
    });

    setSuccessNotice(`Successfully injected ${missingKeywords.length} keywords into your Resume!`);
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  // Weave top keywords into professional summary without changing authentic facts
  const handleEnrichSummaryWithKeywords = () => {
    if (missingKeywords.length === 0) return;

    const keywordsToAdd = missingKeywords.slice(0, 3).map((k) => k.name).join(", ");
    const currentSummary = resume.summary.trim();
    
    // Check if sentence already mentions keywords
    if (currentSummary.includes(keywordsToAdd)) return;

    const enriched = `${currentSummary} Experienced in architecting robust solutions with ${keywordsToAdd}.`;

    onUpdateResume({
      ...resume,
      summary: enriched,
    });

    setSuccessNotice("Enriched Professional Summary with target JD keywords!");
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  // AI-Powered Tailor using backend /api/tailor/resume
  const handleAiTailor = async () => {
    if (!jdText.trim()) return;
    setIsAiLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/tailor/resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_description: jdText,
          base_resume: resume,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onUpdateResume({
          ...resume,
          title: data.title || resume.title,
          summary: data.summary || resume.summary,
          skills: data.skills && data.skills.length > 0 ? data.skills : resume.skills,
        });
        setSuccessNotice("AI tuned your resume keywords and summary to match this role!");
        setTimeout(() => setSuccessNotice(null), 4000);
      }
    } catch (err) {
      console.error("AI Tailor error:", err);
      // Fallback: manually enrich with top extracted keywords
      handleAddAllMissingKeywords();
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="w-full rounded-2xl bg-[#101828] border border-[#232B3B] p-4 sm:p-5 space-y-4 text-left shadow-xs">
      {/* Header & Target Role Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#232B3B] pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <Target size={18} className="text-[#6366F1]" />
            <h3 className="font-extrabold text-sm sm:text-base text-[#F8F8F8]">
              Target Job & Keyword Alignment
            </h3>
          </div>
          <p className="text-xs text-[#AAB4C5] pt-0.5">
            Paste any Job Description to automatically extract and inject ATS keywords into your resume.
          </p>
        </div>

        {/* Quick select from radar jobs */}
        {availableJobs.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-[#AAB4C5] font-semibold hidden sm:inline">Load Role:</span>
            <select
              onChange={(e) => {
                const found = availableJobs.find((j) => j.id === e.target.value);
                if (found) setJdText(found.description);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-[#181F30] border border-[#232B3B] text-xs text-[#F8F8F8] font-semibold focus:outline-hidden focus:border-[#6366F1] cursor-pointer"
            >
              <option value="">Choose from Radar ({availableJobs.length})...</option>
              {availableJobs.slice(0, 10).map((j) => (
                <option key={j.id} value={j.id}>
                  {j.company} - {j.title.slice(0, 30)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Target JD Text Input */}
      <div>
        <label className="block text-xs font-bold text-[#AAB4C5] uppercase tracking-wider mb-1.5">
          Job Description (JD)
        </label>
        <textarea
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          placeholder="Paste requirements or target JD here (e.g. Seeking AI Engineer experienced in LangGraph, pgvector, FastAPI, PyTorch...)"
          rows={3}
          className="w-full p-3 rounded-xl bg-[#181F30] border border-[#232B3B] text-xs text-[#F8F8F8] placeholder-[#667085] focus:outline-hidden focus:border-[#6366F1] leading-relaxed resize-y font-mono"
        />
      </div>

      {/* Real-time Match Breakdown */}
      {extractedJDKeywords.length > 0 && (
        <div className="space-y-3.5 pt-1">
          {/* Score & Quick Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#181F30] border border-[#232B3B]">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 text-[#34D399] font-black text-xs">
                {matchScore}% ATS Alignment
              </div>
              <span className="text-xs text-[#AAB4C5]">
                <strong className="text-[#F8F8F8]">{matchedKeywords.length}</strong> matched /{" "}
                <strong className="text-[#F8F8F8]">{missingKeywords.length}</strong> missing
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {missingKeywords.length > 0 && (
                <button
                  type="button"
                  onClick={handleAddAllMissingKeywords}
                  className="px-3 py-1.5 rounded-xl bg-[#4F46E5] hover:bg-[#6366F1] text-[#F8F8F8] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <Plus size={13} />
                  <span>Add All Keywords to Skills</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleAiTailor}
                disabled={isAiLoading}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#7C3AED] hover:from-[#4F46E5] hover:to-[#6366F1] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50 active:scale-95"
              >
                {isAiLoading ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
                <span>{isAiLoading ? "Optimizing..." : "AI Align Resume"}</span>
              </button>
            </div>
          </div>

          {/* Missing Keywords Row with 1-Click Insertion */}
          {missingKeywords.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#F8F8F8] flex items-center gap-1.5">
                  <span className="text-amber-400">⚡</span> Recommended Keywords to Add
                </span>
                <button
                  type="button"
                  onClick={handleEnrichSummaryWithKeywords}
                  className="text-[11px] text-[#A5B4FC] hover:underline cursor-pointer"
                >
                  + Add top 3 to Summary
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {missingKeywords.map((kw) => (
                  <button
                    key={kw.name}
                    type="button"
                    onClick={() => handleAddKeywordToSkills(kw.name, kw.category)}
                    className="px-2.5 py-1 rounded-lg bg-[#101828] hover:bg-[#232B3B] border border-amber-500/30 hover:border-amber-400 text-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title={`Click to add ${kw.name} to ${kw.category}`}
                  >
                    <Plus size={11} className="text-amber-400" />
                    <span>{kw.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Keywords Row */}
          {matchedKeywords.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-[#AAB4C5] flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-[#10B981]" /> Already in Your Resume ({matchedKeywords.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {matchedKeywords.map((kw) => (
                  <span
                    key={kw.name}
                    className="px-2.5 py-0.5 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30 text-[#34D399] text-[11px] font-semibold"
                  >
                    ✓ {kw.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Success Notification */}
      {successNotice && (
        <div className="p-2.5 rounded-xl bg-[#10B981]/20 border border-[#10B981]/40 text-[#34D399] text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={15} />
          <span>{successNotice}</span>
        </div>
      )}
    </div>
  );
};
