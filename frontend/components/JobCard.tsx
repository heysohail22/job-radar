import React from "react";
import { MapPin, Clock, Globe2, CheckCircle2, Trash2 } from "lucide-react";
import { CompanyLogo } from "./CompanyLogos";
import type { JobPostingItem } from "../lib/types";

interface JobCardProps {
  job: JobPostingItem;
  isSelected: boolean;
  onSelect: () => void;
  onToggleApply?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  isSelected,
  onSelect,
  onToggleApply,
  onDelete,
}) => {
  const isIndia =
    job.isIndia ||
    /india|bengaluru|bangalore|hyderabad|pune|delhi|mumbai|chennai/i.test(job.location);
  const isIntern =
    job.isInternship ||
    job.isFresher ||
    /intern|fresher|junior/i.test(job.title);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`
        w-full h-full min-h-[300px] flex flex-col justify-between p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer text-left relative group active:scale-[0.99]
        ${
          isSelected
            ? "bg-[#101828] border-[#6366F1] shadow-xl shadow-[#6366F1]/20 ring-1 ring-[#6366F1]/50 magic-glow-border"
            : "bg-[#101828] border-[#232B3B] hover:border-[#6366F1]/60 hover:bg-[#141C2E] hover:shadow-lg hover:shadow-black/40"
        }
      `}
    >
      {/* Card Top: Logo + Stage + Match Score */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <CompanyLogo name={job.company} className="w-11 h-11 shrink-0 rounded-xl" />
            <div>
              <p className="text-xs text-[#AAB4C5] font-bold tracking-tight">{job.company}</p>
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                {job.companyStage && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#6366F1]/20 text-[#A5B4FC] border border-[#6366F1]/30">
                    🚀 {job.companyStage}
                  </span>
                )}
                {isIndia && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#F59E0B]/15 text-[#FBBF24] border border-[#F59E0B]/30">
                    🇮🇳 India
                  </span>
                )}
                {isIntern && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30">
                    🎓 Intern
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Match Score Badge */}
          <span className="px-2.5 py-1 rounded-full text-xs font-black tracking-tight bg-[#10B981]/15 border border-[#10B981]/40 text-[#34D399] flex items-center gap-1 shrink-0 shadow-xs">
            <span>🏆</span>
            <span>{job.matchScore}%</span>
          </span>
        </div>

        {/* Job Title */}
        <h3 className="font-extrabold text-sm sm:text-base text-[#F8F8F8] group-hover:text-[#6366F1] transition-colors line-clamp-2 leading-snug mb-2.5">
          {job.title}
        </h3>

        {/* Tech Stack Tags */}
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {job.techStack.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-md bg-[#181F30] text-[#AAB4C5] text-[10px] font-medium border border-[#232B3B]"
            >
              {tag}
            </span>
          ))}
          {job.techStack.length > 4 && (
            <span className="px-1.5 py-0.5 rounded-md bg-[#181F30]/60 text-[#667085] text-[10px] font-medium border border-[#232B3B]/60">
              +{job.techStack.length - 4}
            </span>
          )}
        </div>

        {/* Short Job Description snippet */}
        <p className="text-xs text-[#AAB4C5] leading-relaxed line-clamp-2 mb-3">
          {job.description}
        </p>
      </div>

      {/* Card Footer: Location, Date & Mark Applied Action */}
      <div className="pt-3 border-t border-[#232B3B] mt-auto flex flex-col gap-2">
        <div className="flex items-center justify-between text-[11px] text-[#AAB4C5]">
          <span className="flex items-center gap-1 truncate max-w-[170px]" title={job.location}>
            <MapPin size={11} className="text-[#667085] shrink-0" />
            <span className="truncate">{job.location}</span>
          </span>
          <span className="flex items-center gap-1 shrink-0">
            <Clock size={11} className="text-[#667085]" />
            <span>{job.postedDate}</span>
          </span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#181F30] border border-[#232B3B] text-[10px] text-[#AAB4C5]">
            <Globe2 size={10} className="text-[#6366F1]" />
            <span>{job.source}</span>
          </span>

          <div className="flex items-center gap-1.5">
            {onToggleApply && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleApply(e);
                }}
                title={
                  job.isApplied
                    ? "Marked as Applied (Click to move back to Radar)"
                    : "Mark as Applied (moves to Applied Jobs)"
                }
                className={`
                  flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all border
                  ${
                    job.isApplied
                      ? "bg-[#10B981]/20 text-[#34D399] border-[#10B981]/40 hover:bg-[#EF4444]/15 hover:text-[#F87171] hover:border-[#EF4444]/40"
                      : "bg-[#181F30] text-[#AAB4C5] border-[#232B3B] hover:text-[#34D399] hover:border-[#10B981]/50 hover:bg-[#10B981]/10"
                  }
                `}
              >
                <CheckCircle2 size={11} className={job.isApplied ? "text-[#34D399]" : "text-[#667085]"} />
                <span>{job.isApplied ? "Applied ✓" : "Mark Applied"}</span>
              </span>
            )}

            {job.isApplied && onDelete && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(e);
                }}
                title="Permanently delete from database"
                className="flex items-center justify-center p-1 rounded-lg text-[#64748B] hover:text-rose-400 bg-[#181F30] hover:bg-rose-500/20 border border-[#232B3B] hover:border-rose-500/40 cursor-pointer transition-all"
              >
                <Trash2 size={11} />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


