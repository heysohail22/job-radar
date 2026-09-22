import React, { useState } from "react";
import {
  Download,
  Edit3,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Lightbulb,
  CheckCircle2,
} from "lucide-react";
import { resumeData, type ResumeDataType } from "../lib/resumeData";

interface ResumeViewProps {
  onGoToJobFinder: () => void;
}

export const ResumeView: React.FC<ResumeViewProps> = ({ onGoToJobFinder }) => {
  const [resume] = useState<ResumeDataType>(resumeData);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 max-w-4xl mx-auto space-y-6 text-left bg-[#080F18]">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-[#F8F8F8] tracking-tight">My Resume</h2>
        <p className="text-xs text-[#AAB4C5] font-medium pt-1">
          Review, benchmark, and tailor your resume for maximum GenAI interview callback rates.
        </p>
      </div>

      {/* Resume File Card */}
      <div className="p-5 rounded-2xl bg-[#101828] border border-[#232B3B] space-y-4 shadow-xs">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center font-black text-xs">
              PDF
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#F8F8F8]">Sohel_Islam_Resume.pdf</h3>
              <p className="text-xs text-[#AAB4C5] font-medium">1-Page ATS Standard • Live Sync</p>
            </div>
          </div>

          <button
            onClick={() => window.print()}
            className="py-2 px-3.5 rounded-xl bg-[#181F30] border border-[#232B3B] text-[#AAB4C5] hover:text-[#F8F8F8] hover:bg-[#232B3B] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download size={14} />
            <span>Export PDF</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => window.print()}
            className="py-2.5 px-4 rounded-xl bg-[#181F30] border border-[#232B3B] text-[#AAB4C5] hover:text-[#F8F8F8] hover:bg-[#232B3B] text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Download size={14} />
            <span>Download Clean PDF</span>
          </button>

          <button
            onClick={() => setIsEditing((prev) => !prev)}
            className="py-2.5 px-4 rounded-xl bg-[#4F46E5] hover:bg-[#6366F1] text-[#F8F8F8] text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <Edit3 size={14} />
            <span>{isEditing ? "Done Editing" : "Edit Resume"}</span>
          </button>
        </div>
      </div>

      {/* Tailor Resume for a Job Banner */}
      <div
        onClick={onGoToJobFinder}
        className="p-4 rounded-2xl bg-gradient-to-r from-[#101828] via-[#181F30] to-[#101828] border border-[#6366F1]/40 hover:border-[#6366F1] flex items-center justify-between gap-4 cursor-pointer group transition-all magic-glow-border"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#6366F1]/20 text-[#6366F1] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Sparkles size={18} />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-[#F8F8F8] group-hover:text-[#6366F1] transition-colors">
              Tailor Resume for a Job
            </h4>
            <p className="text-xs text-[#AAB4C5] font-medium">
              Pick any role on the Job Radar and re-align keywords and project bullets with 1 click.
            </p>
          </div>
        </div>
        <ChevronRight size={16} className="text-[#667085] group-hover:text-[#6366F1] transition-colors" />
      </div>

      {/* Quick Tips Section */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-sm text-[#F8F8F8]">Quick Optimization Tips</h3>
        <p className="text-xs text-[#AAB4C5]">Actionable insights to increase your interview callback rate.</p>

        <div className="space-y-2.5 pt-1">
          {/* Tip 1 */}
          <div className="p-3.5 rounded-2xl bg-[#101828] border border-[#232B3B] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#10B981]/15 text-[#10B981] flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} />
              </div>
              <div>
                <h4 className="font-bold text-xs text-[#F8F8F8]">Highlight relevant GenAI skills</h4>
                <p className="text-[11px] text-[#AAB4C5]">Showcase skills like PyTorch, LangChain, and Agentic RAG directly in bullets.</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-[#667085]" />
          </div>

          {/* Tip 2 */}
          <div className="p-3.5 rounded-2xl bg-[#101828] border border-[#232B3B] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#7C3AED]/20 text-[#7C3AED] flex items-center justify-center shrink-0">
                <TrendingUp size={16} />
              </div>
              <div>
                <h4 className="font-bold text-xs text-[#F8F8F8]">Quantify engineering impact</h4>
                <p className="text-[11px] text-[#AAB4C5]">Mention latency reductions (e.g. -42%), token savings, and throughput numbers.</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-[#667085]" />
          </div>

          {/* Tip 3 */}
          <div className="p-3.5 rounded-2xl bg-[#101828] border border-[#232B3B] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                <Lightbulb size={16} />
              </div>
              <div>
                <h4 className="font-bold text-xs text-[#F8F8F8]">Tailor for each application</h4>
                <p className="text-[11px] text-[#AAB4C5]">ATS matching rates above 85% get 3x more recruiter phone screens.</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-[#667085]" />
          </div>
        </div>
      </div>

      {/* Inline Resume Quick View */}
      <div className="p-6 rounded-2xl bg-[#101828] border border-[#232B3B] space-y-4 shadow-xs">
        <div className="border-b border-[#232B3B] pb-3">
          <h3 className="text-lg font-black text-[#F8F8F8]">{resume.name}</h3>
          <p className="text-xs text-[#6366F1] font-bold">{resume.title}</p>
          <p className="text-[11px] text-[#AAB4C5] pt-1">{resume.contact.email} • {resume.contact.location}</p>
        </div>

        <div>
          <h4 className="text-xs font-bold text-[#F8F8F8] uppercase tracking-wider mb-1">Summary</h4>
          <p className="text-xs text-[#AAB4C5] leading-relaxed">{resume.summary}</p>
        </div>

        <div>
          <h4 className="text-xs font-bold text-[#F8F8F8] uppercase tracking-wider mb-2">Technical Skills</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {resume.skills.slice(0, 4).map((s, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-[#181F30] border border-[#232B3B] text-xs">
                <span className="font-bold text-[#F8F8F8]">{s.category}: </span>
                <span className="text-[#AAB4C5]">{s.items.join(", ")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

