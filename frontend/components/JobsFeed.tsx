import React from "react";
import { Sparkles, ChevronDown, Radar, Loader2 } from "lucide-react";
import { JobCard } from "./JobCard";
import type { JobPostingItem } from "../lib/mockJobs";

interface JobsFeedProps {
  jobs: JobPostingItem[];
  selectedJobId: string;
  onSelectJob: (job: JobPostingItem) => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onScanLive?: () => void;
  isScanning?: boolean;
}

export const JobsFeed: React.FC<JobsFeedProps> = ({
  jobs,
  selectedJobId,
  onSelectJob,
  activeFilter,
  onFilterChange,
  onScanLive,
  isScanning = false,
}) => {
  const filterPills = [
    { id: "all", label: `All Jobs (${jobs.length})` },
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

        {/* Live Status & Scan Trigger */}
        <div className="flex items-center gap-2">
          {onScanLive && (
            <button
              onClick={onScanLive}
              disabled={isScanning}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#101828] hover:bg-[#181F30] border border-[#232B3B] hover:border-[#6366F1]/50 text-xs font-bold text-[#F8F8F8] transition-all cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {isScanning ? (
                <Loader2 size={13} className="animate-spin text-[#6366F1]" />
              ) : (
                <Radar size={13} className="text-[#6366F1]" />
              )}
              <span>{isScanning ? "Scanning ATS..." : "Scan Live ATS"}</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#101828] border border-[#232B3B] text-xs">
            <div className={`w-2 h-2 rounded-full ${jobs.length > 0 ? "bg-[#10B981] animate-pulse" : "bg-[#667085]"}`} />
            <span className="font-bold text-[#F8F8F8]">{jobs.length} live jobs</span>
          </div>
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
                  ${
                    isActive
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
              <Radar size={22} className={isScanning ? "animate-spin" : ""} />
            </div>
            <p className="font-bold text-sm text-[#F8F8F8]">No jobs currently stored</p>
            <p className="text-[#667085] max-w-sm mx-auto">
              All manually created jobs have been deleted. Click below to scrape live openings directly from Greenhouse, Lever, and Ashby.
            </p>
            {onScanLive && (
              <button
                onClick={onScanLive}
                disabled={isScanning}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4F46E5] hover:bg-[#6366F1] text-white font-bold text-xs transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isScanning ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                <span>{isScanning ? "Scraping Live ATS Feeds..." : "Scan Live ATS Boards Now"}</span>
              </button>
            )}
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
