import React from "react";
import { Bookmark, MapPin, Clock, DollarSign, ChevronRight } from "lucide-react";
import { CompanyLogo } from "./CompanyLogos";
import type { JobMatchItem } from "../lib/mockJobs";

interface JobCardProps {
  job: JobMatchItem;
  isSelected: boolean;
  onSelect: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (e: React.MouseEvent) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  isSelected,
  onSelect,
  isBookmarked,
  onToggleBookmark,
}) => {
  return (
    <div
      onClick={onSelect}
      className={`
        p-4 rounded-2xl border transition-all duration-200 cursor-pointer text-left relative group
        ${
          isSelected
            ? "bg-[#141A28] border-indigo-500/70 shadow-lg shadow-indigo-950/40 ring-1 ring-indigo-500/30"
            : "bg-[#111622] border-[#1E2638] hover:border-slate-600 hover:bg-[#151C2C]"
        }
      `}
    >
      {/* Top Header: Logo + Title + Match Score */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-3">
          <CompanyLogo name={job.company} className="w-11 h-11" />
          <div>
            <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-1 group-hover:text-indigo-300 transition-colors">
              <span>{job.role}</span>
              <ChevronRight size={14} className="text-slate-500" />
            </h3>
            <p className="text-xs text-slate-400 font-medium">{job.company}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Match Score Badge */}
          <span className="px-2.5 py-1 rounded-full text-xs font-black tracking-tight bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
            <span>🏆</span>
            <span>{job.matchScore}% Match</span>
          </span>

          {/* Bookmark Button */}
          <button
            onClick={onToggleBookmark}
            className={`p-1 text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer ${
              isBookmarked ? "text-indigo-400" : ""
            }`}
            title={isBookmarked ? "Remove Bookmark" : "Save Job"}
          >
            <Bookmark size={16} fill={isBookmarked ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      {/* Tech Stack Pills */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {job.tags.map((tag) => (
          <span
            key={tag}
            className="px-2.5 py-0.5 rounded-lg bg-[#182030] text-slate-300 text-[11px] font-medium border border-[#232D42]"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Description Snippet */}
      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-3">
        {job.description}
      </p>

      {/* Metadata Row: Salary, Location, Date */}
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 font-medium pt-2 border-t border-[#1C2436]">
        <span className="flex items-center gap-1 text-slate-300">
          <DollarSign size={12} className="text-slate-400" />
          <span>{job.salary}</span>
        </span>
        <span className="flex items-center gap-1">
          <MapPin size={12} className="text-slate-400" />
          <span>{job.location}</span>
        </span>
        <span className="flex items-center gap-1">
          <Clock size={12} className="text-slate-400" />
          <span>{job.postedDate}</span>
        </span>
      </div>
    </div>
  );
};
