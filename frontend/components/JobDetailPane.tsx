import React, { useState } from "react";
import {
  ExternalLink,
  Bookmark,
  CheckCircle2,
  Sparkles,
  MapPin,
  Clock,
  DollarSign,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { CompanyLogo } from "./CompanyLogos";
import type { JobMatchItem } from "../lib/mockJobs";

interface JobDetailPaneProps {
  job: JobMatchItem;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onTailorResume: (jobDescription: string) => void;
}

export const JobDetailPane: React.FC<JobDetailPaneProps> = ({
  job,
  isBookmarked,
  onToggleBookmark,
  onTailorResume,
}) => {
  const [showFullDesc, setShowFullDesc] = useState<boolean>(false);

  // Circular stroke calculation for Donut Chart
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (job.matchScore / 100) * circumference;

  return (
    <div className="w-[420px] border-l border-[#1E2638] bg-[#0B0E14] h-full overflow-y-auto p-5 space-y-5 text-left shrink-0">
      {/* Header Info */}
      <div className="p-4 rounded-2xl bg-[#111622] border border-[#1E2638] space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <CompanyLogo name={job.company} className="w-12 h-12" />
            <div>
              <h2 className="font-extrabold text-base text-slate-100">{job.role}</h2>
              <p className="text-xs text-slate-400 font-semibold">{job.company}</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-black tracking-tight bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
            {job.matchScore}% Match
          </span>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
          <span className="flex items-center gap-1">
            <MapPin size={13} className="text-slate-500" />
            {job.location}
          </span>
          <span className="flex items-center gap-1 text-slate-300 font-semibold">
            <DollarSign size={13} className="text-slate-500" />
            {job.salary}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={13} className="text-slate-500" />
            {job.postedDate}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <a
            href={job.applyUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <span>Apply Now</span>
            <ExternalLink size={13} />
          </a>

          <button
            onClick={onToggleBookmark}
            className={`py-2.5 px-3.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isBookmarked
                ? "bg-indigo-600/15 border-indigo-500 text-indigo-300 font-bold"
                : "bg-[#182030] border-[#242E44] text-slate-300 hover:bg-[#1E283E]"
            }`}
          >
            <Bookmark size={14} fill={isBookmarked ? "currentColor" : "none"} />
            <span>{isBookmarked ? "Saved" : "Save Job"}</span>
          </button>
        </div>

        {/* 1-Click Tailor Resume Button */}
        <button
          onClick={() => onTailorResume(job.description)}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-indigo-950/50"
        >
          <Sparkles size={14} className="text-purple-200" />
          <span>Tailor My Resume for this Role</span>
        </button>
      </div>

      {/* "Why this matches you?" Card */}
      <div className="p-4 rounded-2xl bg-[#111622] border border-[#1E2638] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
            <Sparkles size={16} />
            <span>Why this matches you?</span>
          </div>
        </div>

        {/* Circular Match Score & Checklist */}
        <div className="flex items-center gap-4 pt-1">
          {/* Circular Donut Progress Ring */}
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background Circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="text-slate-800"
                strokeWidth="7"
                stroke="currentColor"
                fill="transparent"
              />
              {/* Animated Progress Circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="text-emerald-400 transition-all duration-1000 ease-out"
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-black text-slate-100">{job.matchScore}%</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Match</span>
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-2 text-xs flex-1">
            {job.whyMatches.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-slate-300 leading-tight font-medium text-[11px]">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Skills */}
      <div className="p-4 rounded-2xl bg-[#111622] border border-[#1E2638] space-y-2.5">
        <h4 className="font-bold text-xs text-slate-200 uppercase tracking-wider">Key Skills</h4>
        <div className="flex flex-wrap gap-1.5">
          {job.keySkills.map((skill) => (
            <span
              key={skill}
              className="px-2.5 py-1 rounded-lg bg-[#182030] border border-[#232D42] text-slate-200 text-xs font-semibold"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Job Description */}
      <div className="p-4 rounded-2xl bg-[#111622] border border-[#1E2638] space-y-2.5">
        <h4 className="font-bold text-xs text-slate-200 uppercase tracking-wider">Job Description</h4>
        <div className="text-xs text-slate-400 leading-relaxed space-y-2 font-normal">
          <p>{job.description}</p>
          {showFullDesc && (
            <div className="space-y-2 pt-2 border-t border-[#1C2436] animate-in fade-in duration-200">
              <p className="font-semibold text-slate-300">Key Responsibilities:</p>
              <ul className="list-disc pl-4 space-y-1 text-slate-400">
                <li>Collaborate directly with researchers on frontier GenAI architectures and agentic workflows.</li>
                <li>Design, prototype, and benchmark retrieval-augmented systems and context memory modules.</li>
                <li>Write robust, scalable Python & TypeScript code with full unit testing and evaluation guardrails.</li>
              </ul>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowFullDesc((prev) => !prev)}
          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 pt-1 cursor-pointer"
        >
          <span>{showFullDesc ? "Show less" : "Show more"}</span>
          {showFullDesc ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>
    </div>
  );
};
