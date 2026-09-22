import React, { useState, useEffect, useCallback } from "react";
import type { ResumeDataType } from "../resumeData";
import {
  fetchAllGenAiJobs,
  evaluateJobWithAI,
  type JobPosting,
} from "../services/jobRadarService";
import {
  TargetIcon,
  FlameIcon,
  SearchIcon,
  ExternalLinkIcon,
  SparklesIcon,
  BookmarkIcon,
  RefreshCwIcon,
  KeyIcon,
  MapPinIcon,
  ClockIcon,
  BuildingIcon,
  ZapIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "../icons";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface JobRadarPanelProps {
  userFirecrawlKey: string;
  onSaveFirecrawlKey: (key: string) => void;
  userGeminiKey: string;
  userGroqKey: string;
  resume: ResumeDataType;
  onSelectJobForTailoring: (jobDescription: string) => void;
  savedBookmarkIds: string[];
  onToggleBookmark: (jobId: string) => void;
}

export const JobRadarPanel: React.FC<JobRadarPanelProps> = ({
  userFirecrawlKey,
  onSaveFirecrawlKey,
  userGeminiKey,
  userGroqKey,
  resume,
  onSelectJobForTailoring,
  savedBookmarkIds,
  onToggleBookmark,
}) => {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [isLiveMode, setIsLiveMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [minMatchFilter, setMinMatchFilter] = useState<number>(0);
  const [onlyBookmarks, setOnlyBookmarks] = useState<boolean>(false);
  const [isKeyDrawerOpen, setIsKeyDrawerOpen] = useState<boolean>(false);
  const [firecrawlKeyInput, setFirecrawlKeyInput] = useState<string>(userFirecrawlKey);
  const [savedKeySuccess, setSavedKeySuccess] = useState<boolean>(false);
  const [evaluatingJobId, setEvaluatingJobId] = useState<string | null>(null);

  // Fetch Jobs Effect (Local by default to save API credits & tokens)
  useEffect(() => {
    let isCancelled = false;

    queueMicrotask(() => {
      if (!isCancelled) setIsLoading(true);
    });

    fetchAllGenAiJobs(userFirecrawlKey, searchQuery, minMatchFilter, isLiveMode)
      .then((fetched) => {
        if (!isCancelled) setJobs(fetched);
      })
      .catch((err) => {
        console.error("Error loading jobs:", err);
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [userFirecrawlKey, searchQuery, minMatchFilter, isLiveMode]);

  const loadJobs = useCallback(async (forceLive: boolean = false) => {
    setIsLoading(true);
    try {
      const fetched = await fetchAllGenAiJobs(userFirecrawlKey, searchQuery, minMatchFilter, forceLive || isLiveMode);
      setJobs(fetched);
    } catch (err) {
      console.error("Error loading jobs:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userFirecrawlKey, searchQuery, minMatchFilter, isLiveMode]);



  const handleSaveFirecrawlKey = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveFirecrawlKey(firecrawlKeyInput.trim());
    setSavedKeySuccess(true);
    setTimeout(() => setSavedKeySuccess(false), 2000);
  };

  // Deep AI Re-evaluation using Gemini or Groq
  const handleDeepEvaluate = async (job: JobPosting) => {
    const apiKey = userGeminiKey || userGroqKey;
    const provider = userGeminiKey ? "gemini" : "groq";

    if (!apiKey) {
      alert("Please add a Gemini or Groq API Key in the AI Tailor tab settings to run deep evaluation!");
      return;
    }

    setEvaluatingJobId(job.id);
    try {
      const evalRes = await evaluateJobWithAI(job, resume, provider, apiKey);
      setJobs((prev) =>
        prev.map((j) =>
          j.id === job.id
            ? { ...j, matchScore: evalRes.matchScore, matchReason: evalRes.matchReason }
            : j
        )
      );
    } catch {
      // fallback
    } finally {
      setEvaluatingJobId(null);
    }
  };

  const displayedJobs = jobs.filter((job) => {
    if (onlyBookmarks) return savedBookmarkIds.includes(job.id);
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-50/50">
      {/* Top Banner Header */}
      <div className="p-3.5 bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 text-white shrink-0 border-b border-zinc-800">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <TargetIcon size={16} />
            </span>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight text-zinc-100 flex items-center gap-1.5">
                <span>Gen AI Intern Radar</span>
                <Badge
                  variant="secondary"
                  className={`border-0 text-[10px] px-2 py-0.5 font-bold flex items-center gap-1 ${
                    isLiveMode
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  }`}
                >
                  {isLiveMode ? "⚡ Live API Mode" : "🟢 Local Mode (0 Tokens / 0 Credits)"}
                </Badge>
              </h3>
              <p className="text-[11px] text-zinc-400">
                Targeting Gen AI & LLM Internships at high-growth startups
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const nextMode = !isLiveMode;
                setIsLiveMode(nextMode);
                loadJobs(nextMode);
              }}
              className={`text-xs gap-1 px-2.5 h-8 border font-semibold cursor-pointer ${
                isLiveMode
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20"
                  : "bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700"
              }`}
              title="Toggle between instant Local Mode and Live Firecrawl/ATS Fetching"
            >
              <span>{isLiveMode ? "Switch to Local" : "Sync Live APIs"}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsKeyDrawerOpen((prev) => !prev)}
              className="text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs gap-1.5 px-2.5 h-8 border border-zinc-800"
              title="Configure Firecrawl API Key"
            >
              <KeyIcon size={13} className={userFirecrawlKey ? "text-emerald-400" : "text-zinc-400"} />
              <span className="hidden sm:inline">Firecrawl Key</span>
              {isKeyDrawerOpen ? <ChevronDownIcon size={13} /> : <ChevronRightIcon size={13} />}
            </Button>
          </div>
        </div>


        {/* Collapsible Key Drawer */}
        {isKeyDrawerOpen && (
          <div className="mt-2.5 p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <FlameIcon size={14} className="text-orange-400" />
                Firecrawl API Integration
              </span>
              <a
                href="https://www.firecrawl.dev"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline text-[11px] flex items-center gap-1"
              >
                Get API Key <ExternalLinkIcon size={10} />
              </a>
            </div>
            <form onSubmit={handleSaveFirecrawlKey} className="flex gap-2">
              <input
                type="password"
                value={firecrawlKeyInput}
                onChange={(e) => setFirecrawlKeyInput(e.target.value)}
                placeholder="fc-f4adcf4a4f..."
                className="flex-1 px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-zinc-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
              <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white h-auto py-1 px-3 text-xs cursor-pointer">
                {savedKeySuccess ? "Saved!" : "Save Key"}
              </Button>
            </form>
            <p className="text-[10px] text-zinc-400">
              Powers dynamic scraping of Y Combinator AI startup listings & custom company career pages.
            </p>
          </div>
        )}
      </div>

      {/* Search & Filter Controls */}
      <div className="p-3 bg-white border-b border-zinc-200 shrink-0 space-y-2.5 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search e.g. LangChain, RAG, PyTorch, Agent..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-100/80 border border-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:bg-white transition-all"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadJobs()}

            disabled={isLoading}
            className="h-8 px-2.5 text-xs gap-1.5 shrink-0 border-zinc-200 cursor-pointer"
            title="Refresh job listings"
          >
            <RefreshCwIcon size={13} className={isLoading ? "animate-spin text-emerald-600" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>

        {/* Filter Badges & Toggle */}
        <div className="flex items-center justify-between text-xs gap-2 pt-0.5">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <button
              onClick={() => setMinMatchFilter(0)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                minMatchFilter === 0 ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              All Roles ({jobs.length})
            </button>
            <button
              onClick={() => setMinMatchFilter(85)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                minMatchFilter === 85 ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
              }`}
            >
              <ZapIcon size={11} /> 85%+ Match
            </button>
            <button
              onClick={() => setOnlyBookmarks((prev) => !prev)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                onlyBookmarks ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
              }`}
            >
              <BookmarkIcon size={11} /> Saved ({savedBookmarkIds.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Jobs Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <RefreshCwIcon size={24} className="animate-spin text-emerald-600" />
            <p className="text-xs font-semibold text-zinc-600">Scanning Greenhouse, Lever, Ashby & YC Startups...</p>
          </div>
        ) : displayedJobs.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-2xl border border-zinc-200 p-6 space-y-2">
            <BuildingIcon size={28} className="mx-auto text-zinc-400" />
            <h4 className="font-bold text-zinc-800 text-sm">No Jobs Found</h4>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto">
              Try adjusting your search query or minimum match score filter.
            </p>
            <Button variant="outline" size="sm" onClick={() => { setSearchQuery(""); setMinMatchFilter(0); setOnlyBookmarks(false); }}>
              Reset Filters
            </Button>
          </div>
        ) : (
          displayedJobs.map((job) => {
            const isBookmarked = savedBookmarkIds.includes(job.id);
            const isHighMatch = job.matchScore >= 90;

            return (
              <div
                key={job.id}
                className={`
                  bg-white rounded-2xl border transition-all duration-200 p-4 shadow-xs hover:shadow-md relative group
                  ${isHighMatch ? "border-emerald-200 ring-1 ring-emerald-500/20" : "border-zinc-200"}
                `}
              >
                {/* Header: Company & Source Badge */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-extrabold text-xs tracking-tight text-zinc-900 uppercase flex items-center gap-1">
                        <BuildingIcon size={12} className="text-zinc-500" />
                        {job.company}
                      </span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-zinc-500 border-zinc-200">
                        {job.source}
                      </Badge>
                    </div>
                    <h4 className="font-extrabold text-sm text-zinc-900 leading-snug group-hover:text-emerald-700 transition-colors">
                      {job.title}
                    </h4>
                  </div>

                  {/* Match Score Badge */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className={`
                        px-2.5 py-1 rounded-full text-xs font-black tracking-tight flex items-center gap-1 shadow-2xs
                        ${
                          job.matchScore >= 90
                            ? "bg-emerald-500 text-white"
                            : job.matchScore >= 80
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-zinc-100 text-zinc-700"
                        }
                      `}
                    >
                      <ZapIcon size={12} />
                      {job.matchScore}% Match
                    </span>
                    <button
                      onClick={() => onToggleBookmark(job.id)}
                      className={`p-1 text-zinc-400 hover:text-amber-500 transition-colors cursor-pointer ${
                        isBookmarked ? "text-amber-500" : ""
                      }`}
                      title={isBookmarked ? "Remove Bookmark" : "Save Job"}
                    >
                      <BookmarkIcon size={16} fill={isBookmarked ? "currentColor" : "none"} />
                    </button>
                  </div>
                </div>

                {/* Sub details: Location & Posted */}
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500 font-medium mb-3">
                  <span className="flex items-center gap-1">
                    <MapPinIcon size={12} className="text-zinc-400" />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <ClockIcon size={12} className="text-zinc-400" />
                    {job.postedDate}
                  </span>
                </div>

                {/* Tech Stack Pills */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {job.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 font-mono text-[10px] font-semibold border border-zinc-200/60"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {/* AI Match Reason Box */}
                <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80 mb-3.5 text-xs text-zinc-700 flex items-start gap-2">
                  <CheckCircleIcon size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                  <p className="leading-snug text-[11px] font-medium text-zinc-800">
                    <span className="font-bold text-zinc-900">Why fit: </span>
                    {job.matchReason}
                  </p>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-zinc-100">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onSelectJobForTailoring(job.description)}
                    className="flex-1 bg-zinc-900 hover:bg-emerald-600 text-white text-xs gap-1.5 h-8 font-semibold cursor-pointer shadow-xs transition-colors"
                  >
                    <SparklesIcon size={13} />
                    <span>Tailor Resume</span>
                  </Button>

                  <a
                    href={job.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold border border-zinc-200 transition-colors"
                  >
                    <span>Apply</span>
                    <ExternalLinkIcon size={12} />
                  </a>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeepEvaluate(job)}
                    disabled={evaluatingJobId === job.id}
                    className="h-8 px-2 text-zinc-500 hover:text-zinc-900 text-[11px] cursor-pointer"
                    title="Re-evaluate score using AI"
                  >
                    {evaluatingJobId === job.id ? (
                      <RefreshCwIcon size={13} className="animate-spin text-emerald-600" />
                    ) : (
                      <ZapIcon size={13} />
                    )}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
