import React, { useState, useMemo, useEffect } from "react";
import {
  Sparkles,
  ChevronDown,
  Radar,
  Loader2,
  Flame,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Search,
  Filter,
  Wand2,
} from "lucide-react";
import { JobCard } from "./JobCard";
import type { JobPostingItem } from "../lib/types";

export interface FilterFacet {
  id: string;
  label: string;
  emoji: string;
  keywords?: string[];
  field?: string;
}

interface JobsFeedProps {
  jobs: JobPostingItem[];
  selectedJobId: string;
  onSelectJob: (job: JobPostingItem) => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onFetchJobs?: () => void;
  isFetching?: boolean;
  onScanLive?: () => void;
  onOpenFirecrawl?: () => void;
  isScanning?: boolean;
  onClearLocalJobs?: () => void;
  onToggleApply?: (jobId: string, isApplied: boolean) => void;
  activeFeedTab?: "radar" | "applied";
  onFeedTabChange?: (tab: "radar" | "applied") => void;
  onOpenGoogleJobs?: () => void;
  backendUrl?: string;
}

const CORE_FACETS: FilterFacet[] = [
  { id: "all", label: "All Opportunities", emoji: "⚡" },
  { id: "india", label: "India Roles", emoji: "🇮🇳" },
  { id: "internship", label: "Internships & Freshers", emoji: "🎓" },
  { id: "agents", label: "LangGraph & Agents", emoji: "🤖" },
  { id: "rag", label: "RAG & Vector DB", emoji: "🔍" },
  { id: "fastapi_python", label: "Python & FastAPI", emoji: "🐍" },
  { id: "startups", label: "Seed & YC Startups", emoji: "🚀" },
  { id: "remote", label: "Worldwide Remote", emoji: "🌐" },
];

export const JobsFeed: React.FC<JobsFeedProps> = ({
  jobs,
  selectedJobId,
  onSelectJob,
  activeFilter,
  onFilterChange,
  onFetchJobs,
  isFetching = false,
  onScanLive,
  onOpenFirecrawl,
  isScanning = false,
  onClearLocalJobs,
  onToggleApply,
  activeFeedTab: controlledTab,
  onFeedTabChange,
  onOpenGoogleJobs,
  backendUrl = "http://localhost:8000",
}) => {
  const [internalTab, setInternalTab] = useState<"radar" | "applied">("radar");
  const currentTab = controlledTab ?? internalTab;
  const setTab = onFeedTabChange ?? setInternalTab;

  const [sortBy, setSortBy] = useState<"match" | "fresher" | "newest">("match");
  const [isSortOpen, setIsSortOpen] = useState<boolean>(false);
  const [aiFacets, setAiFacets] = useState<FilterFacet[]>([]);
  const [isGeneratingAiFilters, setIsGeneratingAiFilters] = useState<boolean>(false);
  const [aiSuccessBadge, setAiSuccessBadge] = useState<string | null>(null);

  // Split into active radar vs applied
  const activeJobs = useMemo(() => jobs.filter((j) => !j.isApplied), [jobs]);
  const appliedJobs = useMemo(() => jobs.filter((j) => !!j.isApplied), [jobs]);
  const baseJobs = currentTab === "applied" ? appliedJobs : activeJobs;

  // Function to evaluate whether a job matches a facet
  const matchesFacet = (job: JobPostingItem, facetId: string, facet?: FilterFacet): boolean => {
    if (facetId === "all") return true;
    if (facetId === "india") {
      return Boolean(
        job.isIndia ||
          /india|bengaluru|bangalore|hyderabad|pune|delhi|mumbai|chennai|noida|gurgaon/i.test(
            job.location
          )
      );
    }
    if (facetId === "internship") {
      return Boolean(
        job.isInternship ||
          job.isFresher ||
          /intern|fresher|junior|trainee|associate/i.test(job.title)
      );
    }
    if (facetId === "agents") {
      return (
        job.techStack.some((t) => /langgraph|agent|tool|multi-agent/i.test(t)) ||
        /langgraph|multi-agent|agentic|tool calling/i.test(job.description || "")
      );
    }
    if (facetId === "rag") {
      return (
        job.techStack.some((t) => /rag|vector|pgvector|supabase|pinecone|qdrant/i.test(t)) ||
        /rag|vector|embeddings/i.test(job.description || "")
      );
    }
    if (facetId === "fastapi_python") {
      return (
        job.techStack.some((t) => /python|fastapi|django|flask/i.test(t)) ||
        /python|fastapi/i.test(job.description || "")
      );
    }
    if (facetId === "startups") {
      return /seed|series a|yc|y combinator|early stage/i.test(job.companyStage || "");
    }
    if (facetId === "remote") {
      return /remote|worldwide|anywhere|global/i.test(job.location);
    }

    // Dynamic AI facet matching keywords
    if (facet && facet.keywords && facet.keywords.length > 0) {
      const kwRegex = new RegExp(
        facet.keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
        "i"
      );
      const inTitle = kwRegex.test(job.title);
      const inStack = job.techStack.some((t) => kwRegex.test(t));
      const inLoc = kwRegex.test(job.location);
      const inComp = kwRegex.test(job.company);
      const inStage = kwRegex.test(job.companyStage || "");
      const inDesc = kwRegex.test((job.description || "").slice(0, 350));
      return inTitle || inStack || inLoc || inComp || inStage || inDesc;
    }

    return true;
  };

  // Combine Core Facets with AI Facets (deduplicating by id)
  const allFacets = useMemo(() => {
    const existingIds = new Set(CORE_FACETS.map((c) => c.id));
    const extraAi = aiFacets.filter((f) => !existingIds.has(f.id));
    return [...CORE_FACETS, ...extraAi];
  }, [aiFacets]);

  // Compute live match count for every single facet
  const facetCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const facet of allFacets) {
      counts[facet.id] = baseJobs.filter((job) => matchesFacet(job, facet.id, facet)).length;
    }
    return counts;
  }, [allFacets, baseJobs]);

  // Current active facet object
  const currentFacetObj = allFacets.find((f) => f.id === activeFilter);

  // Filter base jobs by active pill
  const filteredJobs = useMemo(() => {
    const matched = baseJobs.filter((job) => matchesFacet(job, activeFilter, currentFacetObj));

    return [...matched].sort((a, b) => {
      if (sortBy === "match") {
        return (b.matchScore || 0) - (a.matchScore || 0);
      }
      if (sortBy === "fresher") {
        const aFresh = a.isInternship || a.isFresher ? 1 : 0;
        const bFresh = b.isInternship || b.isFresher ? 1 : 0;
        if (bFresh !== aFresh) return bFresh - aFresh;
        return (b.matchScore || 0) - (a.matchScore || 0);
      }
      if (sortBy === "newest") {
        return b.id.localeCompare(a.id);
      }
      return 0;
    });
  }, [baseJobs, activeFilter, currentFacetObj, sortBy]);

  // Handle AI dynamic filter generation
  const handleGenerateAiFilters = async () => {
    setIsGeneratingAiFilters(true);
    setAiSuccessBadge(null);
    try {
      const res = await fetch(`${backendUrl}/api/jobs/generate-filters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.facets) && data.facets.length > 0) {
          setAiFacets(data.facets);
          setAiSuccessBadge(`+${data.facets.length} AI Filters`);
          setTimeout(() => setAiSuccessBadge(null), 4000);
        }
      }
    } catch (err) {
      console.warn("AI filter generation request failed:", err);
    } finally {
      setIsGeneratingAiFilters(false);
    }
  };

  return (
    <div className="w-full flex-1 min-h-0 h-full overflow-y-auto p-3.5 sm:p-5 space-y-4 text-left bg-[#080F18]">
      {/* 1. Feed Header & Primary Action Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-1 border-b border-[#1A2333]">
        {/* Title Area */}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-[#F8F8F8] tracking-tight">
              Jobs for{" "}
              <span className="bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#A855F7] bg-clip-text text-transparent">
                You
              </span>
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#6366F1]/15 text-[#A5B4FC] border border-[#6366F1]/30">
              India & Remote
            </span>
          </div>
          <p className="text-xs text-[#8E9EB5] font-medium pt-0.5">
            Real-time opportunities with live ATS keyword alignment & resume match.
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap self-start lg:self-auto">
          {/* Fetch Jobs (Primary Backend Sync) */}
          {onFetchJobs && (
            <button
              onClick={onFetchJobs}
              disabled={isFetching || isScanning}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#6366F1] hover:to-[#8B5CF6] text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-[#4F46E5]/25 disabled:opacity-50 active:scale-95"
              title="Sync stored opportunities from Supabase database"
            >
              {isFetching ? (
                <Loader2 size={13} className="animate-spin text-white" />
              ) : (
                <RefreshCw size={13} className="text-white" />
              )}
              <span>{isFetching ? "Syncing..." : "Fetch Jobs"}</span>
            </button>
          )}

          {/* Google Jobs Live Search Button */}
          {onOpenGoogleJobs && (
            <button
              onClick={onOpenGoogleJobs}
              disabled={isFetching || isScanning}
              className="flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-xl bg-[#101828] hover:bg-[#182338] border border-[#38BDF8]/40 hover:border-[#38BDF8]/70 text-xs font-bold text-[#E0F2FE] transition-all cursor-pointer disabled:opacity-50 shadow-xs"
              title="Search Google Jobs index (Indeed, LinkedIn, Shine, Lever, Jobrapido)"
            >
              <Search size={13} className="text-[#38BDF8]" />
              <span>Google Jobs</span>
            </button>
          )}

          {/* Firecrawl Deep Portal Scraper */}
          {onOpenFirecrawl && (
            <button
              onClick={onOpenFirecrawl}
              disabled={isScanning || isFetching}
              className="flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-xl bg-[#101828] hover:bg-[#1C1F2E] border border-[#FF5722]/35 hover:border-[#FF5722]/60 text-xs font-bold text-[#FFD7C9] transition-all cursor-pointer disabled:opacity-50 shadow-xs"
              title="Scrape Y Combinator & Startup career portals with Firecrawl"
            >
              <Flame size={13} className="text-[#FF5722]" />
              <span>Firecrawl</span>
            </button>
          )}

          {/* Live ATS Scan Trigger */}
          {onScanLive && (
            <button
              onClick={onScanLive}
              disabled={isScanning || isFetching}
              className="flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-xl bg-[#101828] hover:bg-[#182338] border border-[#232B3B] hover:border-[#6366F1]/50 text-xs font-bold text-[#F8F8F8] transition-all cursor-pointer disabled:opacity-50 shadow-xs"
              title="Scan live ATS boards (Ashby, Greenhouse, Lever)"
            >
              {isScanning ? (
                <Loader2 size={13} className="animate-spin text-[#6366F1]" />
              ) : (
                <Radar size={13} className="text-[#6366F1]" />
              )}
              <span>{isScanning ? "Scanning..." : "Scan ATS"}</span>
            </button>
          )}

          {/* Live Count Pill & Reset */}
          <div className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl bg-[#101828] border border-[#232B3B] text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                jobs.length > 0 ? "bg-[#10B981] animate-pulse" : "bg-[#667085]"
              }`}
            />
            <span className="font-bold text-[#F8F8F8]">{jobs.length} in radar</span>
          </div>

          {jobs.length > 0 && onClearLocalJobs && (
            <button
              onClick={onClearLocalJobs}
              className="h-8 w-8 flex items-center justify-center rounded-xl bg-[#101828] hover:bg-rose-500/20 text-[#667085] hover:text-rose-400 border border-[#232B3B] transition-colors cursor-pointer"
              title="Clear stored jobs cache"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Mode Segmented Switcher & AI Generator Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
        {/* Mode Switcher: Active Radar vs Applied Jobs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#0D1524] border border-[#1F293D] w-fit shadow-inner">
          <button
            type="button"
            onClick={() => setTab("radar")}
            className={`
              flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer
              ${
                currentTab === "radar"
                  ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white shadow-md shadow-[#4F46E5]/30"
                  : "text-[#8E9EB5] hover:text-[#F8F8F8] hover:bg-[#182338]"
              }
            `}
          >
            <Radar size={13} className={currentTab === "radar" ? "text-white" : "text-[#6366F1]"} />
            <span>Active Radar</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                currentTab === "radar"
                  ? "bg-white/20 text-white"
                  : "bg-[#182338] text-[#8E9EB5]"
              }`}
            >
              {activeJobs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTab("applied")}
            className={`
              flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer
              ${
                currentTab === "applied"
                  ? "bg-gradient-to-r from-[#10B981] to-[#059669] text-white shadow-md shadow-[#10B981]/30"
                  : "text-[#8E9EB5] hover:text-[#F8F8F8] hover:bg-[#182338]"
              }
            `}
          >
            <CheckCircle2
              size={13}
              className={currentTab === "applied" ? "text-white" : "text-[#10B981]"}
            />
            <span>Applied Jobs</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                currentTab === "applied"
                  ? "bg-white/25 text-white"
                  : "bg-[#182338] text-[#8E9EB5]"
              }`}
            >
              {appliedJobs.length}
            </span>
          </button>
        </div>

        {/* Right Utility: AI Smart Filters Generator & Sorting */}
        <div className="flex items-center gap-2">
          {/* AI Filter Generator Button */}
          <button
            type="button"
            onClick={handleGenerateAiFilters}
            disabled={isGeneratingAiFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#312E81]/80 via-[#4C1D95]/80 to-[#1E1B4B]/80 hover:from-[#3730A3] hover:to-[#5B21B6] border border-[#818CF8]/40 hover:border-[#818CF8]/70 text-[#E0E7FF] text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-60"
            title="Cluster live dataset and generate smart filter facets using Gemini"
          >
            {isGeneratingAiFilters ? (
              <Loader2 size={13} className="animate-spin text-[#A5B4FC]" />
            ) : (
              <Wand2 size={13} className="text-[#A5B4FC]" />
            )}
            <span>{isGeneratingAiFilters ? "AI Analyzing..." : "✨ AI Filters"}</span>
            {aiSuccessBadge && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#10B981]/25 text-[#34D399] font-extrabold border border-[#10B981]/30">
                {aiSuccessBadge}
              </span>
            )}
          </button>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsSortOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#101828] border border-[#232B3B] hover:border-[#334155] text-xs font-bold text-[#AAB4C5] hover:text-[#F8F8F8] transition-colors cursor-pointer"
            >
              <span className="text-[#64748B]">Sort:</span>
              <span className="text-[#F8F8F8]">
                {sortBy === "match" ? "Best Match" : sortBy === "fresher" ? "Fresher First" : "Newest"}
              </span>
              <ChevronDown size={13} className="text-[#64748B]" />
            </button>

            {isSortOpen && (
              <div className="absolute right-0 mt-1.5 w-36 rounded-xl bg-[#101828] border border-[#232B3B] shadow-2xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setSortBy("match");
                    setIsSortOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${
                    sortBy === "match"
                      ? "bg-[#182338] text-[#818CF8]"
                      : "text-[#AAB4C5] hover:bg-[#182338] hover:text-[#F8F8F8]"
                  }`}
                >
                  Best Match
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSortBy("fresher");
                    setIsSortOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${
                    sortBy === "fresher"
                      ? "bg-[#182338] text-[#818CF8]"
                      : "text-[#AAB4C5] hover:bg-[#182338] hover:text-[#F8F8F8]"
                  }`}
                >
                  Fresher First
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSortBy("newest");
                    setIsSortOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${
                    sortBy === "newest"
                      ? "bg-[#182338] text-[#818CF8]"
                      : "text-[#AAB4C5] hover:bg-[#182338] hover:text-[#F8F8F8]"
                  }`}
                >
                  Newest
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Dynamic Filter Pills Bar with Universal Live Counts */}
      <div className="pt-0.5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none -mx-1 px-1">
          {allFacets.map((facet) => {
            const isActive = activeFilter === facet.id;
            const count = facetCounts[facet.id] ?? 0;

            return (
              <button
                key={facet.id}
                type="button"
                onClick={() => onFilterChange(facet.id)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 border
                  ${
                    isActive
                      ? "bg-gradient-to-r from-[#4F46E5] to-[#6366F1] border-[#818CF8] text-white shadow-md shadow-[#4F46E5]/30 ring-1 ring-[#818CF8]/50"
                      : "bg-[#0D1524] border-[#1F293D] text-[#94A3B8] hover:text-[#F8F8F8] hover:bg-[#141F33] hover:border-[#334155]"
                  }
                `}
              >
                <span>{facet.emoji}</span>
                <span>{facet.label}</span>
                <span
                  className={`
                    px-1.5 py-0.5 rounded-full text-[10px] font-black transition-colors
                    ${
                      isActive
                        ? "bg-white/25 text-white"
                        : count > 0
                        ? "bg-[#1A2538] text-[#CBD5E1]"
                        : "bg-[#151D2C] text-[#64748B]"
                    }
                  `}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Job Cards Square Grid / Empty States */}
      {currentTab === "applied" && appliedJobs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0D1524] border border-[#1F293D] text-[#AAB4C5] text-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center text-[#10B981] mx-auto">
            <CheckCircle2 size={24} />
          </div>
          <p className="font-bold text-sm text-[#F8F8F8]">No applied jobs yet</p>
          <p className="text-[#667085] max-w-sm mx-auto">
            Whenever you apply to a role from your Radar Feed, click{" "}
            <span className="text-[#34D399] font-bold">&quot;Mark as Applied&quot;</span>. It will
            automatically move out of your main dashboard and appear here!
          </p>
          <button
            onClick={() => setTab("radar")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#182338] hover:bg-[#232B3B] border border-[#232B3B] text-[#F8F8F8] font-bold text-xs transition-colors cursor-pointer"
          >
            <span>Back to Radar Feed</span>
          </button>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0D1524] border border-[#1F293D] text-[#AAB4C5] text-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#182338] border border-[#232B3B] flex items-center justify-center text-[#6366F1] mx-auto">
            <RefreshCw size={22} className={isFetching || isScanning ? "animate-spin" : ""} />
          </div>
          <p className="font-bold text-sm text-[#F8F8F8]">
            {jobs.length === 0 ? "No jobs in local storage yet" : "No jobs match this filter"}
          </p>
          <p className="text-[#667085] max-w-sm mx-auto">
            {jobs.length === 0
              ? "Click below to fetch verified India & Worldwide Remote opportunities from your database."
              : "Try selecting another filter pill above or switch back to All Opportunities."}
          </p>
          {jobs.length === 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              {onFetchJobs && (
                <button
                  onClick={onFetchJobs}
                  disabled={isFetching || isScanning}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] via-[#6366F1] to-[#7C3AED] hover:from-[#6366F1] hover:to-[#8B5CF6] text-white font-bold text-xs transition-all cursor-pointer shadow-lg shadow-[#4F46E5]/30 disabled:opacity-50 active:scale-95"
                >
                  {isFetching ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                  <span>{isFetching ? "Fetching from Backend..." : "Fetch Jobs from Backend"}</span>
                </button>
              )}
              {onScanLive && (
                <button
                  onClick={onScanLive}
                  disabled={isScanning || isFetching}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#182338] hover:bg-[#232B3B] border border-[#232B3B] text-[#F8F8F8] font-bold text-xs transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isScanning ? (
                    <Loader2 size={14} className="animate-spin text-[#6366F1]" />
                  ) : (
                    <Sparkles size={14} className="text-[#6366F1]" />
                  )}
                  <span>{isScanning ? "Scanning Live ATS..." : "Scan Live ATS Boards"}</span>
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isSelected={job.id === selectedJobId}
              onSelect={() => onSelectJob(job)}
              onToggleApply={onToggleApply ? () => onToggleApply(job.id, !job.isApplied) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};
