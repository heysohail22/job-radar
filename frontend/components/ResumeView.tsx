import React, { useState, useEffect } from "react";
import {
  Download,
  Edit3,
  Sparkles,
  RefreshCw,
  Target,
  ChevronDown,
  ChevronUp,
  FileCheck,
} from "lucide-react";
import { resumeData, type ResumeDataType } from "../lib/resumeData";
import { ResumeDocument } from "./ResumeDocument";
import { JDKeywordMatcher } from "./JDKeywordMatcher";
import { ResumeEditorModal } from "./ResumeEditorModal";
import type { JobPostingItem } from "../lib/types";

interface ResumeViewProps {
  onGoToJobFinder: () => void;
  targetJobDescription?: string;
  availableJobs?: JobPostingItem[];
  backendUrl: string;
}

export const ResumeView: React.FC<ResumeViewProps> = ({
  onGoToJobFinder,
  targetJobDescription = "",
  availableJobs = [],
  backendUrl,
}) => {
  const [resume, setResume] = useState<ResumeDataType>(resumeData);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [showJDMatcher, setShowJDMatcher] = useState<boolean>(true);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Clear any legacy localStorage keys
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("jobmatch_custom_resume");
      }
    } catch {}
  }, []);

  // Update resume in memory
  const handleUpdateResume = (updated: ResumeDataType) => {
    setResume(updated);
    setSaveToast("Changes applied");
    setTimeout(() => setSaveToast(null), 2500);
  };

  // Reset to original default resume
  const handleResetResume = () => {
    setResume(resumeData);
    setSaveToast("Reset to default resume");
    setTimeout(() => setSaveToast(null), 2500);
  };

  // Handle direct inline click-to-edit blur events
  const handleInlineBlur = (fieldPath: string, newValue: string) => {
    const trimmed = newValue.trim();
    const updated = JSON.parse(JSON.stringify(resume)) as ResumeDataType;

    if (fieldPath === "name") updated.name = trimmed;
    else if (fieldPath === "title") updated.title = trimmed;
    else if (fieldPath === "summary") updated.summary = trimmed;
    else if (fieldPath === "contact.phone") updated.contact.phone = trimmed;
    else if (fieldPath === "contact.email") updated.contact.email = trimmed;
    else if (fieldPath === "contact.location") updated.contact.location = trimmed;
    else if (fieldPath.startsWith("skillCat.")) {
      const idx = parseInt(fieldPath.split(".")[1], 10);
      if (updated.skills[idx]) updated.skills[idx].category = trimmed;
    } else if (fieldPath.startsWith("skillItems.")) {
      const idx = parseInt(fieldPath.split(".")[1], 10);
      if (updated.skills[idx]) {
        updated.skills[idx].items = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
      }
    } else if (fieldPath.startsWith("projName.")) {
      const idx = parseInt(fieldPath.split(".")[1], 10);
      if (updated.projects[idx]) updated.projects[idx].name = trimmed;
    } else if (fieldPath.startsWith("projSubtitle.")) {
      const idx = parseInt(fieldPath.split(".")[1], 10);
      if (updated.projects[idx]) updated.projects[idx].subtitle = trimmed;
    } else if (fieldPath.startsWith("projBullet.")) {
      const parts = fieldPath.split(".");
      const pIdx = parseInt(parts[1], 10);
      const bIdx = parseInt(parts[2], 10);
      if (updated.projects[pIdx]?.bullets[bIdx] !== undefined) {
        updated.projects[pIdx].bullets[bIdx] = trimmed;
      }
    } else if (fieldPath === "edu.degree") updated.education.degree = trimmed;
    else if (fieldPath === "edu.institution") updated.education.institution = trimmed;
    else if (fieldPath === "edu.duration") updated.education.duration = trimmed;
    else if (fieldPath === "edu.location") updated.education.location = trimmed;
    else if (fieldPath === "edu.cgpa") updated.education.cgpa = trimmed;

    handleUpdateResume(updated);
  };

  return (
    <div className="w-full flex-1 min-h-0 h-full overflow-y-auto p-3.5 sm:p-6 space-y-5 text-left bg-[#080F18]">
      {/* Workspace Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#101828] border border-[#232B3B] shadow-xs print-hide">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-[#F8F8F8] tracking-tight">
              My Engineering Resume
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30">
              1-Page ATS Standard
            </span>
          </div>
          <p className="text-xs text-[#AAB4C5] font-medium pt-0.5">
            Click any text directly on the resume to edit, or match keywords from target JDs below.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle JD Keyword Matcher */}
          <button
            type="button"
            onClick={() => setShowJDMatcher((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#181F30] hover:bg-[#232B3B] border border-[#232B3B] text-xs font-bold text-[#F8F8F8] transition-colors cursor-pointer"
          >
            <Target size={14} className="text-[#6366F1]" />
            <span>Target JD & Keywords</span>
            {showJDMatcher ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {/* Structured Editor Button */}
          <button
            type="button"
            onClick={() => setIsEditorOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#181F30] hover:bg-[#232B3B] border border-[#232B3B] text-xs font-bold text-[#F8F8F8] transition-colors cursor-pointer"
          >
            <Edit3 size={14} className="text-[#AAB4C5]" />
            <span>Edit Form</span>
          </button>

          {/* Download PDF Button */}
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#6366F1] hover:to-[#8B5CF6] text-white text-xs font-bold shadow-md shadow-[#4F46E5]/25 transition-all cursor-pointer active:scale-95"
          >
            <Download size={14} />
            <span>Download PDF</span>
          </button>

          {/* Reset Button */}
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Reset all resume edits back to default?")) {
                handleResetResume();
              }
            }}
            className="p-2 rounded-xl bg-[#181F30] hover:bg-rose-500/20 text-[#667085] hover:text-rose-400 border border-[#232B3B] transition-colors cursor-pointer"
            title="Reset to default resume"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Target JD Keyword Matcher & Alignment Panel */}
      {showJDMatcher && (
        <div className="print-hide">
          <JDKeywordMatcher
            resume={resume}
            onUpdateResume={handleUpdateResume}
            targetJobDescription={targetJobDescription}
            availableJobs={availableJobs}
            backendUrl={backendUrl}
          />
        </div>
      )}

      {/* Save Notification Toast */}
      {saveToast && (
        <div className="fixed bottom-5 left-5 z-50 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#10B981]/20 border border-[#10B981]/50 text-[#34D399] text-xs font-bold shadow-lg backdrop-blur-md animate-in fade-in">
          <FileCheck size={14} />
          <span>{saveToast}</span>
        </div>
      )}

      {/* 1-Page A4 Paper Resume Document */}
      <div className="flex justify-center w-full py-2">
        <ResumeDocument
          resume={resume}
          onEditableBlur={handleInlineBlur}
          isEditable={true}
        />
      </div>

      {/* Structured Resume Editor Modal */}
      <ResumeEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        resume={resume}
        onSave={handleUpdateResume}
        onReset={handleResetResume}
      />
    </div>
  );
};
