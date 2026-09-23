import React, { useState } from "react";
import {
  ExternalLink,
  Sparkles,
  MapPin,
  Clock,
  Globe2,
  CheckCircle2,
  ArrowLeft,
  Copy,
  Check,
  Building2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { CompanyLogo } from "./CompanyLogos";
import type { JobPostingItem } from "../lib/types";

interface JobDetailPaneProps {
  job: JobPostingItem;
  onTailorResume: (jobDescription: string) => void;
  onBack?: () => void;
  onToggleApply?: (jobId: string, isApplied: boolean) => void;
}

// Helper to structure raw scraped text into clean readable paragraphs & headings
function parseDescription(raw: string): Array<{ type: "heading" | "bullet" | "paragraph"; text: string }> {
  let text = raw
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  const sectionHeaders = [
    "ABOUT THE ROLE",
    "ABOUT US",
    "ABOUT THE COMPANY",
    "ABOUT COGNITION",
    "ABOUT COMPOSIO",
    "ABOUT SARVAM",
    "WHAT YOU'LL DO",
    "WHAT YOU WILL DO",
    "RESPONSIBILITIES",
    "KEY RESPONSIBILITIES",
    "REQUIREMENTS",
    "WHAT WE'RE LOOKING FOR",
    "WHAT WE ARE LOOKING FOR",
    "QUALIFICATIONS",
    "BASIC QUALIFICATIONS",
    "PREFERRED QUALIFICATIONS",
    "NICE TO HAVE",
    "BONUS POINTS",
    "WHAT WE OFFER",
    "BENEFITS",
    "PERKS",
    "HOW TO APPLY",
    "OUR TECH STACK",
  ];

  for (const h of sectionHeaders) {
    const regex = new RegExp(`(^|\\s)(${h})(:)?(\\s|$)`, "gi");
    text = text.replace(regex, `\n\n### $2\n\n`);
  }

  const rawLines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return rawLines.map((line) => {
    if (line.startsWith("### ")) {
      return { type: "heading", text: line.replace("### ", "") };
    }
    if (/^[•\-\*]\s*/.test(line)) {
      return { type: "bullet", text: line.replace(/^[•\-\*]\s*/, "") };
    }
    return { type: "paragraph", text: line };
  });
}

export const JobDetailPane: React.FC<JobDetailPaneProps> = ({
  job,
  onTailorResume,
  onBack,
  onToggleApply,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExpandedDesc, setIsExpandedDesc] = useState(false);

  // Circular stroke calculation for Donut Chart
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (job.matchScore / 100) * circumference;

  const isIndia =
    job.isIndia ||
    /india|bengaluru|bangalore|hyderabad|pune|delhi|mumbai|chennai/i.test(job.location);
  const isIntern =
    job.isInternship || job.isFresher || /intern|fresher|junior/i.test(job.title);

  const parsedSections = parseDescription(job.description);

  const handleCopy = () => {
    navigator.clipboard.writeText(`${job.title} at ${job.company}\n${job.url}\n\n${job.description}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full h-full min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 text-left bg-[#080F18]">
      {/* Mobile Back to Jobs Button */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="md:hidden flex items-center gap-2 px-3 py-2 rounded-xl bg-[#101828] border border-[#232B3B] text-xs font-bold text-[#AAB4C5] hover:text-[#F8F8F8] active:scale-95 transition-all cursor-pointer w-fit shadow-xs mb-1"
        >
          <ArrowLeft size={15} />
          <span>← Back to Jobs Feed</span>
        </button>
      )}

      {/* 1. Header Info Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0D1524] border border-[#1F293D] space-y-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5 flex-1 min-w-0">
            <CompanyLogo name={job.company} className="w-12 h-12 shrink-0 rounded-xl mt-0.5" />
            <div className="flex-1 min-w-0">
              <h2 className="font-black text-base sm:text-lg text-[#F8F8F8] leading-snug">
                {job.title}
              </h2>
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-xs text-[#AAB4C5] font-bold">{job.company}</span>
                {job.companyStage && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#6366F1]/20 text-[#A5B4FC] border border-[#6366F1]/40 shadow-xs">
                    🚀 {job.companyStage}
                  </span>
                )}
                {isIndia && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#F59E0B]/15 text-[#FBBF24] border border-[#F59E0B]/30 shadow-xs">
                    🇮🇳 India
                  </span>
                )}
                {isIntern && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30 shadow-xs">
                    🎓 Fresher / Intern
                  </span>
                )}
              </div>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-black tracking-tight bg-[#10B981]/15 border border-[#10B981]/40 text-[#34D399] shrink-0 shadow-xs">
            {job.matchScore}% Match
          </span>
        </div>

        {/* Real Metadata: Location, Date, Source Board */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-[#AAB4C5] pt-1 border-t border-[#1F293D]">
          <span className="flex items-center gap-1.5">
            <MapPin size={13} className="text-[#667085]" />
            <span>{job.location}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={13} className="text-[#667085]" />
            <span>{job.postedDate}</span>
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#141C2E] border border-[#232B3B] text-[10px] text-[#AAB4C5]">
            <Globe2 size={11} className="text-[#6366F1]" />
            <span>Via {job.source}</span>
          </span>
        </div>

        {/* Hero 1-Click Tailor Resume Button */}
        <button
          type="button"
          onClick={() => onTailorResume(job.description)}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#4F46E5] via-[#6366F1] to-[#7C3AED] hover:from-[#6366F1] hover:to-[#8B5CF6] text-white font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#4F46E5]/30 active:scale-[0.99]"
        >
          <Sparkles size={16} className="text-white" />
          <span>Tailor My Resume for this Role</span>
        </button>

        {/* Action Buttons Row */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Direct Posting External Link */}
          <a
            href={job.url}
            target="_blank"
            rel="noreferrer"
            className="py-2.5 px-3 rounded-xl bg-[#141C2E] hover:bg-[#1E293D] border border-[#232B3B] text-[#F8F8F8] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Open & Apply</span>
            <ExternalLink size={13} />
          </a>

          {/* Mark as Applied Toggle Button */}
          {onToggleApply && (
            <button
              type="button"
              onClick={() => onToggleApply(job.id, !job.isApplied)}
              className={`
                py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border
                ${
                  job.isApplied
                    ? "bg-[#10B981]/20 text-[#34D399] border-[#10B981]/50 hover:bg-[#EF4444]/20 hover:text-[#F87171] hover:border-[#EF4444]/50"
                    : "bg-[#141C2E] text-[#F8F8F8] border-[#232B3B] hover:border-[#10B981]/50 hover:text-[#34D399] hover:bg-[#10B981]/10"
                }
              `}
            >
              <CheckCircle2 size={14} className={job.isApplied ? "text-[#34D399]" : "text-[#667085]"} />
              <span>{job.isApplied ? "Applied ✓" : "Mark as Applied"}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. AI Match Analysis Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0D1524] border border-[#1F293D] space-y-3.5 shadow-sm">
        <div className="flex items-center gap-2 text-[#818CF8] font-black text-xs uppercase tracking-wider">
          <Sparkles size={15} />
          <span>AI Match Analysis</span>
        </div>

        {/* Circular Match Score & Real AI Reason */}
        <div className="flex items-center gap-4 pt-1">
          {/* Circular Donut Progress Ring */}
          <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="text-[#1F293D]"
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
              <span className="text-base font-black text-[#F8F8F8]">{job.matchScore}%</span>
              <span className="text-[8px] font-bold text-[#667085] uppercase tracking-tight">Match</span>
            </div>
          </div>

          {/* Real Match Reason */}
          <div className="flex-1 text-xs space-y-1.5 min-w-0">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-[#10B981] shrink-0" />
              <p className="text-[#F8F8F8] font-bold text-xs">
                Candidate Stack Alignment
              </p>
            </div>
            <p className="text-[#AAB4C5] text-[11px] leading-relaxed">
              {job.matchReason}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Extracted Required Tech Stack */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0D1524] border border-[#1F293D] space-y-3 shadow-sm">
        <h4 className="font-black text-xs text-[#F8F8F8] uppercase tracking-wider">Required Tech & Skills</h4>
        <div className="flex flex-wrap gap-1.5">
          {job.techStack.map((skill) => (
            <span
              key={skill}
              className="px-2.5 py-1 rounded-lg bg-[#141C2E] border border-[#232B3B] text-[#E2E8F0] text-xs font-semibold"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* 4. Structured Scraped Job Description */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0D1524] border border-[#1F293D] space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h4 className="font-black text-xs text-[#F8F8F8] uppercase tracking-wider">Job Description</h4>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#AAB4C5] hover:text-[#F8F8F8] transition-colors cursor-pointer"
          >
            {copied ? <Check size={12} className="text-[#10B981]" /> : <Copy size={12} />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>

        <div className="space-y-3 text-xs text-[#CBD5E1] leading-relaxed">
          {parsedSections.slice(0, isExpandedDesc ? parsedSections.length : 8).map((sec, idx) => {
            if (sec.type === "heading") {
              return (
                <h5
                  key={idx}
                  className="font-extrabold text-xs text-[#A5B4FC] uppercase tracking-wide pt-2.5 border-t border-[#1F293D]/60 first:border-none first:pt-0"
                >
                  {sec.text}
                </h5>
              );
            }
            if (sec.type === "bullet") {
              return (
                <div key={idx} className="flex items-start gap-2 pl-1">
                  <span className="text-[#6366F1] font-bold shrink-0 mt-0.5">•</span>
                  <p className="flex-1 leading-relaxed text-[#CBD5E1]">{sec.text}</p>
                </div>
              );
            }
            return (
              <p key={idx} className="leading-relaxed text-[#CBD5E1]">
                {sec.text}
              </p>
            );
          })}

          {parsedSections.length > 8 && (
            <button
              type="button"
              onClick={() => setIsExpandedDesc((prev) => !prev)}
              className="flex items-center gap-1 text-xs font-bold text-[#818CF8] hover:text-[#A5B4FC] pt-1 transition-colors cursor-pointer"
            >
              <span>{isExpandedDesc ? "Show Less" : `Show More (${parsedSections.length - 8} more sections)`}</span>
              {isExpandedDesc ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};



