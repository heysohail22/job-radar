import React, { useState } from "react";
import { Sparkles, ChevronDown, Radar, Loader2, Flame, RefreshCw, Trash2, CheckCircle2, Search } from "lucide-react";
import { JobCard } from "./JobCard";
import type { JobPostingItem } from "../lib/types";

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
}

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
}) => {
  const [internalTab, setInternalTab] = useState<"radar" | "applied">("radar");
  const currentTab = controlledTab ?? internalTab;
  const setTab = onFeedTabChange ?? setInternalTab;

  // Split into active radar vs applied
  const activeJobs = jobs.filter((j) => !j.isApplied);
  const appliedJobs = jobs.filter((j) => !!j.isApplied);
  const baseJobs = currentTab === "applied" ? appliedJobs : activeJobs;

  const filterPills = [
    { id: "all", label: `All (${baseJobs.length})` },
    { id: "india", label: "🇮🇳 India Roles" },
    { id: "internship", label: "🎓 Internships & Freshers" },
    { id: "agents", label: "🤖 LangGraph & Agents" },
    { id: "rag", label: "🔍 RAG & Vector DB" },
    { id: "startups", label: "🚀 Seed & YC Startups" },
    { id: "remote", label: "🌐 Remote" },
  ];

  // Filter base jobs by pill
  const filteredJobs = baseJobs.filter((job) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "india") {
      return job.isIndia || /india|bengaluru|bangalore|hyderabad|pune|delhi|mumbai|chennai/i.test(job.location);
    }
    if (activeFilter === "internship") {
      return job.isInternship || job.isFresher || /intern|fresher|junior/i.test(job.title);
    }
    if (activeFilter === "agents") {
      return job.techStack.some((t) => /langgraph|agent|tool/i.test(t));
    }
    if (activeFilter === "rag") {
      return job.techStack.some((t) => /rag|vector|pgvector|supabase/i.test(t));
    }
    if (activeFilter === "startups") {
      return /seed|series a|yc/i.test(job.companyStage || "");
    }
    if (activeFilter === "remote") {
      return /remote|worldwide|anywhere/i.test(job.location);
    }
    return true;
  });

  return (
    <div className="w-full flex-1 min-h-0 h-full overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6 text-left bg-[#080F18]">
      {/* Feed Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#F8F8F8] tracking-tight">
            Jobs for{" "}
            <span className="bg-gradient-to-r from-[#6366F1] via-[#7C3AED] to-[#A855F7] bg-clip-text text-transparent">
              You
            </span>
          </h2>
          <p className="text-xs text-[#AAB4C5] font-medium pt-0.5 sm:pt-1">
            Verified GenAI roles filtered for India & Worldwide Remote.
          </p>
        </div>

        {/* Live Status & Scan Triggers */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Primary Backend Fetch Button */}
          {onFetchJobs && (
            <button
              onClick={onFetchJobs}
              disabled={isFetching || isScanning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#6366F1] hover:to-[#8B5CF6] border border-[#6366F1]/50 text-xs font-bold text-[#F8F8F8] transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-[#4F46E5]/25 active:scale-95"
              title="Fetch stored jobs from Supabase via backend"
            >
              {isFetching ? (
                <Loader2 size={13} className="animate-spin text-[#F8F8F8]" />
              ) : (
                <RefreshCw size={13} className="text-[#F8F8F8]" />
              )}
              <span>{isFetching ? "Fetching..." : "Fetch Jobs"}</span>
            </button>
          )}

          {/* Google Jobs Live Search Button */}
          {onOpenGoogleJobs && (
            <button
              onClick={onOpenGoogleJobs}
              disabled={isFetching || isScanning}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#4285F4]/20 via-[#EA4335]/15 to-[#34A853]/20 hover:from-[#4285F4]/30 hover:to-[#34A853]/30 border border-[#4285F4]/40 text-xs font-bold text-[#F8F8F8] transition-all cursor-pointer disabled:opacity-50 shadow-xs"
              title="Search and import live jobs from Google Jobs index"
            >
              <Search size={13} className="text-[#4285F4]" />
              <span>Google Jobs</span>
            </button>
          )}

          {/* Firecrawl Button */}
          {onOpenFirecrawl && (
            <button
              onClick={onOpenFirecrawl}
              disabled={isScanning || isFetching}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FF5722]/20 to-[#4F46E5]/20 hover:from-[#FF5722]/30 hover:to-[#4F46E5]/30 border border-[#FF5722]/40 text-xs font-bold text-[#F8F8F8] transition-all cursor-pointer disabled:opacity-50 shadow-xs"
              title="Scrape YC & Startup career portals using Firecrawl"
            >
              <Flame size={13} className="text-[#FF5722]" />
              <span>Firecrawl</span>
            </button>
          )}

          {/* Live ATS Scan Button */}
          {onScanLive && (
            <button
              onClick={onScanLive}
              disabled={isScanning || isFetching}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#101828] hover:bg-[#181F30] border border-[#232B3B] hover:border-[#6366F1]/50 text-xs font-bold text-[#F8F8F8] transition-all cursor-pointer disabled:opacity-50 shadow-xs"
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

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#101828] border border-[#232B3B] text-xs">
            <div className={`w-2 h-2 rounded-full ${jobs.length > 0 ? "bg-[#10B981] animate-pulse" : "bg-[#667085]"}`} />
            <span className="font-bold text-[#F8F8F8]">{jobs.length} local</span>
          </div>

          {jobs.length > 0 && onClearLocalJobs && (
            <button
              onClick={onClearLocalJobs}
              className="p-1.5 rounded-xl bg-[#101828] hover:bg-rose-500/20 text-[#667085] hover:text-rose-400 border border-[#232B3B] transition-colors cursor-pointer"
              title="Clear locally stored jobs"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Main Mode Toggle: Active Radar vs Applied Jobs */}
      <div className="flex items-center gap-2 p-1 rounded-2xl bg-[#101828] border border-[#232B3B] w-fit">
        <button
          type="button"
          onClick={() => setTab("radar")}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer
            ${
              currentTab === "radar"
                ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white shadow-md shadow-[#4F46E5]/30"
                : "text-[#AAB4C5] hover:text-[#F8F8F8] hover:bg-[#181F30]"
            }
          `}
        >
          <Radar size={14} className={currentTab === "radar" ? "text-white" : "text-[#6366F1]"} />
          <span>Active Radar</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${currentTab === "radar" ? "bg-white/20 text-white" : "bg-[#181F30] text-[#AAB4C5]"}`}>
            {activeJobs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTab("applied")}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer
            ${
              currentTab === "applied"
                ? "bg-[#10B981] text-white shadow-md shadow-[#10B981]/30 font-black"
                : "text-[#AAB4C5] hover:text-[#F8F8F8] hover:bg-[#181F30]"
            }
          `}
        >
          <CheckCircle2 size={14} className={currentTab === "applied" ? "text-white" : "text-[#10B981]"} />
          <span>Applied Jobs</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${currentTab === "applied" ? "bg-white/25 text-white" : "bg-[#181F30] text-[#AAB4C5]"}`}>
            {appliedJobs.length}
          </span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 sm:pb-0 scrollbar-none -mx-1 px-1">
          {filterPills.map((pill) => {
            const isActive = activeFilter === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => onFilterChange(pill.id)}
                className={`
                  px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0
                  ${isActive
                    ? "bg-[#4F46E5] text-[#F8F8F8] shadow-xs"
                    : "bg-[#101828] border border-[#232B3B] text-[#AAB4C5] hover:text-[#F8F8F8] hover:bg-[#181F30]"
                  }
                `}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 text-xs text-[#AAB4C5] shrink-0 font-semibold cursor-pointer self-end sm:self-auto pr-1">
          <span>Sort:</span>
          <span className="text-[#F8F8F8] font-bold flex items-center gap-0.5">
            Best Match <ChevronDown size={14} />
          </span>
        </div>
      </div>

      {/* Job Cards Square Grid / Empty States */}
      {currentTab === "applied" && appliedJobs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#101828] border border-[#232B3B] text-[#AAB4C5] text-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center text-[#10B981] mx-auto">
            <CheckCircle2 size={24} />
          </div>
          <p className="font-bold text-sm text-[#F8F8F8]">No applied jobs yet</p>
          <p className="text-[#667085] max-w-sm mx-auto">
            Whenever you apply to a role from your Radar Feed, click <span className="text-[#34D399] font-bold">&quot;Mark as Applied&quot;</span>. It will automatically move out of your main dashboard and appear here!
          </p>
          <button
            onClick={() => setTab("radar")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#181F30] hover:bg-[#232B3B] border border-[#232B3B] text-[#F8F8F8] font-bold text-xs transition-colors cursor-pointer"
          >
            <span>Back to Radar Feed</span>
          </button>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#101828] border border-[#232B3B] text-[#AAB4C5] text-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#181F30] border border-[#232B3B] flex items-center justify-center text-[#6366F1] mx-auto">
            <RefreshCw size={22} className={isFetching || isScanning ? "animate-spin" : ""} />
          </div>
          <p className="font-bold text-sm text-[#F8F8F8]">
            {jobs.length === 0 ? "No jobs in local storage yet" : "No jobs match this filter"}
          </p>
          <p className="text-[#667085] max-w-sm mx-auto">
            {jobs.length === 0
              ? "Click below to fetch verified India & Worldwide Remote opportunities from your database."
              : "Try selecting another filter pill above or switch back to All."}
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
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#181F30] hover:bg-[#232B3B] border border-[#232B3B] text-[#F8F8F8] font-bold text-xs transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isScanning ? <Loader2 size={14} className="animate-spin text-[#6366F1]" /> : <Sparkles size={14} className="text-[#6366F1]" />}
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


