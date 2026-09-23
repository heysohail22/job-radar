import React from "react";
import {
  ExternalLink,
  Sparkles,
  MapPin,
  Clock,
  Globe2,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { CompanyLogo } from "./CompanyLogos";
import type { JobPostingItem } from "../lib/types";

interface JobDetailPaneProps {
  job: JobPostingItem;
  onTailorResume: (jobDescription: string) => void;
  onBack?: () => void;
}

export const JobDetailPane: React.FC<JobDetailPaneProps> = ({
  job,
  onTailorResume,
  onBack,
}) => {
  // Circular stroke calculation for Donut Chart
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (job.matchScore / 100) * circumference;

  return (
    <div className="w-full flex-1 md:w-[380px] lg:w-[420px] xl:w-[460px] md:border-l border-[#232B3B] bg-[#080F18] h-full min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 text-left md:shrink-0">
      {/* Mobile Back to Jobs Button */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="md:hidden flex items-center gap-2 px-3 py-2 rounded-xl bg-[#101828] border border-[#232B3B] text-xs font-bold text-[#AAB4C5] hover:text-[#F8F8F8] active:scale-95 transition-all cursor-pointer w-fit shadow-xs"
        >
          <ArrowLeft size={15} />
          <span>← Back to Jobs</span>
        </button>
      )}
      {/* Header Info Card */}
      <div className="p-4 rounded-2xl bg-[#101828] border border-[#232B3B] space-y-3.5 shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <CompanyLogo name={job.company} className="w-12 h-12" />
            <div>
              <h2 className="font-extrabold text-base text-[#F8F8F8]">{job.title}</h2>
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
          <span className="px-2.5 py-1 rounded-full text-xs font-black tracking-tight bg-[#10B981]/15 border border-[#10B981]/40 text-[#34D399] shrink-0">
            {job.matchScore}% Match
          </span>
        </div>

        {/* Real Metadata: Location, Date, Source Board */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-[#AAB4C5] pt-1">
          <span className="flex items-center gap-1">
            <MapPin size={13} className="text-[#667085]" />
            {job.location}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={13} className="text-[#667085]" />
            {job.postedDate}
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#181F30] border border-[#232B3B] text-[10px] text-[#AAB4C5]">
            <Globe2 size={11} className="text-[#6366F1]" />
            <span>Via {job.source}</span>
          </span>
        </div>

        {/* Hero 1-Click Tailor Resume Button */}
        <button
          type="button"
          onClick={() => onTailorResume(job.description)}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#4F46E5] via-[#6366F1] to-[#7C3AED] hover:from-[#6366F1] hover:to-[#7C3AED] text-[#F8F8F8] font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#4F46E5]/30 magic-purple-glow active:scale-[0.99]"
        >
          <Sparkles size={15} className="text-[#F8F8F8]" />
          <span>Tailor My Resume for this Role</span>
        </button>

        {/* Official Posting External Link */}
        <a
          href={job.url}
          target="_blank"
          rel="noreferrer"
          className="w-full py-2.5 px-4 rounded-xl bg-[#181F30] hover:bg-[#232B3B] border border-[#232B3B] text-[#AAB4C5] hover:text-[#F8F8F8] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>Open on {job.source}</span>
          <ExternalLink size={13} />
        </a>
      </div>

      {/* Real AI Match Analysis Card */}
      <div className="p-4 rounded-2xl bg-[#101828] border border-[#232B3B] space-y-3.5 shadow-xs">
        <div className="flex items-center gap-2 text-[#6366F1] font-bold text-sm">
          <Sparkles size={16} />
          <span>AI Match Analysis</span>
        </div>

        {/* Circular Match Score & Real AI Reason */}
        <div className="flex items-center gap-4 pt-1">
          {/* Circular Donut Progress Ring */}
          <div className="relative w-22 h-22 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="text-[#232B3B]"
                strokeWidth="7"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="text-[#34D399] transition-all duration-1000 ease-out"
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-black text-[#F8F8F8]">{job.matchScore}%</span>
              <span className="text-[9px] font-bold text-[#667085] uppercase tracking-tight">Match</span>
            </div>
          </div>

          {/* Real Match Reason */}
          <div className="flex-1 text-xs space-y-1.5">
            <div className="flex items-start gap-1.5">
              <CheckCircle2 size={15} className="text-[#10B981] shrink-0 mt-0.5" />
              <p className="text-[#F8F8F8] font-semibold text-xs leading-snug">
                Alignment Breakdown
              </p>
            </div>
            <p className="text-[#AAB4C5] text-[11px] leading-relaxed pl-5">
              {job.matchReason}
            </p>
          </div>
        </div>
      </div>

      {/* Extracted Required Tech Stack */}
      <div className="p-4 rounded-2xl bg-[#101828] border border-[#232B3B] space-y-2.5 shadow-xs">
        <h4 className="font-bold text-xs text-[#F8F8F8] uppercase tracking-wider">Required Tech & Skills</h4>
        <div className="flex flex-wrap gap-1.5">
          {job.techStack.map((skill) => (
            <span
              key={skill}
              className="px-2.5 py-1 rounded-lg bg-[#181F30] border border-[#232B3B] text-[#F8F8F8] text-xs font-semibold"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Authentic Scraped Job Description */}
      <div className="p-4 rounded-2xl bg-[#101828] border border-[#232B3B] space-y-2.5 shadow-xs">
        <h4 className="font-bold text-xs text-[#F8F8F8] uppercase tracking-wider">Job Description</h4>
        <div className="text-xs text-[#AAB4C5] leading-relaxed space-y-2.5 font-normal">
          <p className="whitespace-pre-line leading-relaxed">
            {job.description
              .replace(/<[^>]*>/g, " ")
              .replace(/&amp;/g, "&")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/&nbsp;/g, " ")
              .replace(/\s+/g, " ")
              .trim()}
          </p>
        </div>
      </div>
    </div>
  );
};



