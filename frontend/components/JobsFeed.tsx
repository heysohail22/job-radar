import React from "react";
import { Sparkles, SlidersHorizontal, ChevronDown } from "lucide-react";
import { JobCard } from "./JobCard";
import type { JobMatchItem } from "../lib/mockJobs";

interface JobsFeedProps {
  jobs: JobMatchItem[];
  selectedJobId: string;
  onSelectJob: (job: JobMatchItem) => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  bookmarkedJobIds: string[];
  onToggleBookmark: (jobId: string) => void;
}

export const JobsFeed: React.FC<JobsFeedProps> = ({
  jobs,
  selectedJobId,
  onSelectJob,
  activeFilter,
  onFilterChange,
  bookmarkedJobIds,
  onToggleBookmark,
}) => {
  const filterPills = [
    { id: "all", label: `All Jobs (${jobs.length})` },
    { id: "internship", label: "Internships" },
    { id: "genai", label: "GenAI" },
    { id: "remote", label: "Remote" },
    { id: "india", label: "India" },
  ];

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 space-y-6 text-left">
      {/* Feed Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-100 tracking-tight">
            Jobs for{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              You
            </span>
          </h2>
          <p className="text-xs text-slate-400 font-medium pt-1">
            AI finds and ranks the most relevant opportunities based on your profile, skills, and interests.
          </p>
        </div>

        {/* Stats Pill / Preferences */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#111622] border border-[#1E2638] text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-slate-200">{jobs.length} jobs found</span>
            <span className="text-[10px] text-slate-500">• Updated recently</span>
          </div>

          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111622] border border-[#1E2638] hover:border-slate-600 text-xs font-semibold text-slate-300 transition-colors cursor-pointer">
            <SlidersHorizontal size={13} />
            <span>Customize</span>
          </button>
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
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-[#111622] border border-[#1E2638] text-slate-400 hover:text-slate-200 hover:bg-[#151C2C]"
                  }
                `}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 text-xs text-slate-400 shrink-0 font-semibold cursor-pointer pr-1">
          <span>Sort by:</span>
          <span className="text-slate-200 font-bold flex items-center gap-0.5">
            Best Match <ChevronDown size={14} />
          </span>
        </div>
      </div>

      {/* Vertical Job Cards Stack */}
      <div className="space-y-3.5">
        {jobs.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#111622] border border-[#1E2638] text-slate-400 text-xs space-y-2">
            <Sparkles size={24} className="mx-auto text-slate-500 mb-2" />
            <p className="font-bold text-slate-200">No matching jobs found</p>
            <p>Try clearing your search query or selecting a different filter.</p>
          </div>
        ) : (
          jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isSelected={job.id === selectedJobId}
              onSelect={() => onSelectJob(job)}
              isBookmarked={bookmarkedJobIds.includes(job.id)}
              onToggleBookmark={(e) => {
                e.stopPropagation();
                onToggleBookmark(job.id);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
};
