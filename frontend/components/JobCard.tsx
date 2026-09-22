import React from "react";
import { MapPin, Clock, ChevronRight, Globe2 } from "lucide-react";
import { CompanyLogo } from "./CompanyLogos";
import type { JobPostingItem } from "../lib/types";

interface JobCardProps {
  job: JobPostingItem;
  isSelected: boolean;
  onSelect: () => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  isSelected,
  onSelect,
}) => {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`
        w-full p-4 rounded-2xl border transition-all duration-150 cursor-pointer text-left relative group active:scale-[0.99]
        ${
          isSelected
            ? "bg-[#101828] border-[#6366F1] shadow-lg shadow-[#6366F1]/15 ring-1 ring-[#6366F1]/40 magic-glow-border"
            : "bg-[#101828] border-[#232B3B] hover:border-[#6366F1]/50 hover:bg-[#181F30]"
        }
      `}
    >
      {/* Top Header: Logo + Title + Match Score */}
      <div className="flex items-start justify-between gap-2.5 mb-2.5">
        <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
          <CompanyLogo name={job.company} className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-extrabold text-sm text-[#F8F8F8] flex items-center gap-1 group-hover:text-[#6366F1] transition-colors">
              <span className="truncate">{job.title}</span>
              <ChevronRight size={14} className="text-[#667085] shrink-0" />
            </h3>
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <p className="text-xs text-[#AAB4C5] font-semibold">{job.company}</p>
              {job.companyStage && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#6366F1]/20 text-[#A5B4FC] border border-[#6366F1]/40 shadow-xs">
                  🚀 {job.companyStage}
                </span>
              )}
              {(job.isIndia || /india|bengaluru|bangalore|hyderabad|pune|delhi|mumbai|chennai/i.test(job.location)) && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#F59E0B]/15 text-[#FBBF24] border border-[#F59E0B]/30 shadow-xs">
                  🇮🇳 India
                </span>
              )}
              {(job.isInternship || job.isFresher || /intern|fresher|junior/i.test(job.title)) && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30 shadow-xs">
                  🎓 Fresher / Intern
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Match Score Badge with Emerald Glow */}
        <div className="shrink-0">
          <span className="px-2 sm:px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-black tracking-tight bg-[#10B981]/15 border border-[#10B981]/40 text-[#34D399] flex items-center gap-1 shadow-xs whitespace-nowrap">
            <span>🏆</span>
            <span>{job.matchScore}%</span>
          </span>
        </div>
      </div>

      {/* Real Extracted Tech Stack Tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {job.techStack.map((tag) => (
          <span
            key={tag}
            className="px-2.5 py-0.5 rounded-lg bg-[#181F30] text-[#AAB4C5] text-[11px] font-medium border border-[#232B3B]"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Real Description Snippet */}
      <p className="text-xs text-[#AAB4C5] leading-relaxed line-clamp-2 mb-3">
        {job.description}
      </p>

      {/* Metadata Row: Location, Posted Date, and Authentic ATS Source (NO FAKE SALARY) */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-[#AAB4C5] font-medium pt-2 border-t border-[#232B3B]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <MapPin size={12} className="text-[#667085]" />
            <span>{job.location}</span>
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} className="text-[#667085]" />
            <span>{job.postedDate}</span>
          </span>
        </div>

        {/* Authentic Source Badge */}
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#181F30] border border-[#232B3B] text-[10px] text-[#AAB4C5]">
          <Globe2 size={10} className="text-[#6366F1]" />
          <span>{job.source}</span>
        </span>
      </div>
    </button>
  );
};


