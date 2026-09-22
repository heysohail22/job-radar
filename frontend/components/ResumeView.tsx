import React, { useState } from "react";
import {
  FileText,
  Eye,
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
  const [resume, setResume] = useState<ResumeDataType>(resumeData);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 max-w-4xl mx-auto space-y-6 text-left">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-100 tracking-tight">My Resume</h2>
        <p className="text-xs text-slate-400 font-medium pt-1">
          View, edit, and tailor your resume for better matches.
        </p>
      </div>

      {/* Resume File Card */}
      <div className="p-5 rounded-2xl bg-[#111622] border border-[#1E2638] space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center font-black text-xs">
              PDF
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-100">Sohel_Islam_Resume.pdf</h3>
              <p className="text-xs text-slate-400 font-medium">Last updated recently • 1-Page A4 ATS</p>
            </div>
          </div>

          <button
            onClick={() => window.print()}
            className="p-2.5 rounded-xl bg-[#182030] border border-[#232D42] text-slate-300 hover:text-white hover:bg-[#1E283E] transition-colors cursor-pointer"
            title="Preview Resume"
          >
            <Eye size={16} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => window.print()}
            className="py-2.5 px-4 rounded-xl bg-[#182030] border border-[#232D42] text-slate-200 hover:bg-[#1E283E] text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Download size={14} />
            <span>Download PDF</span>
          </button>

          <button
            onClick={() => setIsEditing((prev) => !prev)}
            className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <Edit3 size={14} />
            <span>{isEditing ? "Done Editing" : "Edit Resume"}</span>
          </button>
        </div>
      </div>

      {/* Tailor Resume for a Job Banner */}
      <div
        onClick={onGoToJobFinder}
        className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-[#131A2E] to-purple-950/60 border border-indigo-500/30 hover:border-indigo-500/60 flex items-center justify-between gap-4 cursor-pointer group transition-all"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Sparkles size={18} />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-100 group-hover:text-indigo-300 transition-colors">
              Tailor Resume for a Job
            </h4>
            <p className="text-xs text-slate-400 font-medium">
              Select a job from the radar and get an AI-optimized resume instantly.
            </p>
          </div>
        </div>
        <ChevronRight size={16} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
      </div>

      {/* Quick Tips Section */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-sm text-slate-100">Quick Tips</h3>
        <p className="text-xs text-slate-400">Improve your chances with AI suggestions.</p>

        <div className="space-y-2.5 pt-1">
          {/* Tip 1 */}
          <div className="p-3.5 rounded-2xl bg-[#111622] border border-[#1E2638] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-100">Highlight relevant skills</h4>
                <p className="text-[11px] text-slate-400">Showcase skills like Python, LLMs, and RAG based on the job role.</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-600" />
          </div>

          {/* Tip 2 */}
          <div className="p-3.5 rounded-2xl bg-[#111622] border border-[#1E2638] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                <TrendingUp size={16} />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-100">Use strong project descriptions</h4>
                <p className="text-[11px] text-slate-400">Quantify your impact, latency improvements, and concrete engineering results.</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-600" />
          </div>

          {/* Tip 3 */}
          <div className="p-3.5 rounded-2xl bg-[#111622] border border-[#1E2638] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                <Lightbulb size={16} />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-100">Tailor for each application</h4>
                <p className="text-[11px] text-slate-400">A tailored resume can increase your interview callback rate by up to 3x.</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-600" />
          </div>
        </div>
      </div>

      {/* Inline Resume Quick View */}
      <div className="p-6 rounded-2xl bg-[#111622] border border-[#1E2638] space-y-4">
        <div className="border-b border-[#1E2638] pb-3">
          <h3 className="text-lg font-black text-slate-100">{resume.name}</h3>
          <p className="text-xs text-indigo-400 font-bold">{resume.title}</p>
          <p className="text-[11px] text-slate-400 pt-1">{resume.contact.email} • {resume.contact.location}</p>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Summary</h4>
          <p className="text-xs text-slate-400 leading-relaxed">{resume.summary}</p>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Technical Skills</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {resume.skills.slice(0, 4).map((s, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-[#182030] border border-[#232D42] text-xs">
                <span className="font-bold text-slate-200">{s.category}: </span>
                <span className="text-slate-400">{s.items.join(", ")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
