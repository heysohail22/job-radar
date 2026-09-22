import React from "react";
import { Sparkles, ChevronDown, Radar, Loader2, Flame, RefreshCw, Trash2 } from "lucide-react";
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
}) => {
  const filterPills = [
    { id: "all", label: `All Jobs (${jobs.length})` },
    { id: "startups", label: "🚀 Small Startups (High Callback)" },
    { id: "internship", label: "Internships" },
    { id: "genai", label: "GenAI" },
    { id: "remote", label: "Remote" },
    { id: "india", label: "India" },
  ];

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 space-y-6 text-left bg-[#080F18]">
      {/* Feed Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#F8F8F8] tracking-tight">
            Jobs for{" "}
            <span className="bg-gradient-to-r from-[#6366F1] via-[#7C3AED] to-[#A855F7] bg-clip-text text-transparent">
              You
            </span>
          </h2>
          <p className="text-xs text-[#AAB4C5] font-medium pt-1">
            Real GenAI roles scraped directly from live ATS feeds.
          </p>
        </div>

        {/* Live Status & Scan Triggers */}
        <div className="flex items-center gap-2">
          {/* Primary Backend Fetch Button */}
          {onFetchJobs && (
            <button
              onClick={onFetchJobs}
              disabled={isFetching || isScanning}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#6366F1] hover:to-[#8B5CF6] border border-[#6366F1]/50 text-xs font-bold text-[#F8F8F8] transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-[#4F46E5]/25 active:scale-95"
              title="Fetch latest jobs from FastAPI backend and save to local storage"
            >
              {isFetching ? (
                <Loader2 size={13} className="animate-spin text-[#F8F8F8]" />
              ) : (
                <RefreshCw size={13} className="text-[#F8F8F8]" />
              )}
              <span>{isFetching ? "Fetching..." : "Fetch New Jobs"}</span>
            </button>
          )}

          {/* Firecrawl Button */}
          {onOpenFirecrawl && (
            <button
              onClick={onOpenFirecrawl}
              disabled={isScanning || isFetching}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FF5722]/20 to-[#4F46E5]/20 hover:from-[#FF5722]/30 hover:to-[#4F46E5]/30 border border-[#FF5722]/40 text-xs font-bold text-[#F8F8F8] transition-all cursor-pointer disabled:opacity-50 shadow-xs"
              title="Scrape YC & Startup career portals using Firecrawl"
            >
              <Flame size={13} className="text-[#FF5722]" />
              <span className="hidden sm:inline">Fetch with Firecrawl</span>
            </button>
          )}

          {/* Live ATS Scan Button */}
          {onScanLive && (
            <button
              onClick={onScanLive}
              disabled={isScanning || isFetching}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#101828] hover:bg-[#181F30] border border-[#232B3B] hover:border-[#6366F1]/50 text-xs font-bold text-[#F8F8F8] transition-all cursor-pointer disabled:opacity-50 shadow-xs"
              title="Scan Greenhouse, Lever, and Ashby"
            >
              {isScanning ? (
                <Loader2 size={13} className="animate-spin text-[#6366F1]" />
              ) : (
                <Radar size={13} className="text-[#6366F1]" />
              )}
              <span className="hidden sm:inline">{isScanning ? "Scanning..." : "Scan ATS"}</span>
            </button>
          )}

          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#101828] border border-[#232B3B] text-xs">
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

      {/* Filter Row */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto scrollbar-none pt-1">
        <div className="flex items-center gap-2">
          {filterPills.map((pill) => {
            const isActive = activeFilter === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => onFilterChange(pill.id)}
                className={`
                  px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer
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

        <div className="flex items-center gap-1 text-xs text-[#AAB4C5] shrink-0 font-semibold cursor-pointer pr-1">
          <span>Sort by:</span>
          <span className="text-[#F8F8F8] font-bold flex items-center gap-0.5">
            Best Match <ChevronDown size={14} />
          </span>
        </div>
      </div>

      {/* Vertical Job Cards Stack */}
      <div className="space-y-3.5">
        {jobs.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#101828] border border-[#232B3B] text-[#AAB4C5] text-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#181F30] border border-[#232B3B] flex items-center justify-center text-[#6366F1] mx-auto">
              <RefreshCw size={22} className={isFetching || isScanning ? "animate-spin" : ""} />
            </div>
            <p className="font-bold text-sm text-[#F8F8F8]">No jobs in local storage yet</p>
            <p className="text-[#667085] max-w-sm mx-auto">
              Click below to fetch live opportunities from your FastAPI backend and store them locally.
            </p>
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
              {onOpenFirecrawl && (
                <button
                  onClick={onOpenFirecrawl}
                  disabled={isScanning || isFetching}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5722] to-[#4F46E5] hover:from-[#FF7043] hover:to-[#6366F1] text-white font-bold text-xs transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Flame size={14} />
                  <span>Fetch with Firecrawl</span>
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
          </div>
        ) : (
          jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isSelected={job.id === selectedJobId}
              onSelect={() => onSelectJob(job)}
            />
          ))
        )}
      </div>
    </div>
  );
};

