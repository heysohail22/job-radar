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
  Sliders,
  Maximize2,
} from "lucide-react";
import { resumeData, type ResumeDataType } from "../lib/resumeData";
import { ResumeDocument, type SpacingConfig } from "./ResumeDocument";
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
  const [showSpacingControls, setShowSpacingControls] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Spacing & Typography state for ATS 1-page tuning
  const [spacing, setSpacing] = useState<SpacingConfig>({
    fontSize: 12,
    lineHeight: 1.45,
    sectionGap: 8,
    projectGap: 6,
    summarySkillsGap: 8,
    skillsProjectsGap: 8,
    bulletGap: 2,
    paddingX: 36,
    paddingY: 28,
  });

  // Presets for quick fitting
  const applyPreset = (preset: "compact" | "normal" | "spacious") => {
    if (preset === "compact") {
      setSpacing({
        fontSize: 11.5,
        lineHeight: 1.35,
        sectionGap: 5,
        projectGap: 4,
        summarySkillsGap: 5,
        skillsProjectsGap: 5,
        bulletGap: 1,
        paddingX: 28,
        paddingY: 20,
      });
      setSaveToast("Applied Compact (1-Page Fit) spacing");
    } else if (preset === "normal") {
      setSpacing({
        fontSize: 12,
        lineHeight: 1.45,
        sectionGap: 8,
        projectGap: 6,
        summarySkillsGap: 8,
        skillsProjectsGap: 8,
        bulletGap: 2,
        paddingX: 36,
        paddingY: 28,
      });
      setSaveToast("Applied Balanced spacing");
    } else if (preset === "spacious") {
      setSpacing({
        fontSize: 12.5,
        lineHeight: 1.55,
        sectionGap: 12,
        projectGap: 8,
        summarySkillsGap: 12,
        skillsProjectsGap: 12,
        bulletGap: 4,
        paddingX: 42,
        paddingY: 34,
      });
      setSaveToast("Applied Spacious layout");
    }
    setTimeout(() => setSaveToast(null), 2500);
  };

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
            Click any text directly on the resume to edit, or customize padding and gaps below.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Spacing & Layout Customizer Toggle */}
          <button
            type="button"
            onClick={() => setShowSpacingControls((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              showSpacingControls
                ? "bg-[#6366F1]/20 border-[#6366F1] text-[#A5B4FC]"
                : "bg-[#181F30] hover:bg-[#232B3B] border-[#232B3B] text-[#F8F8F8]"
            }`}
          >
            <Sliders size={14} className={showSpacingControls ? "text-[#818CF8]" : "text-[#AAB4C5]"} />
            <span>Layout & Spacing</span>
            {showSpacingControls ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

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
              if (window.confirm("Reset all resume edits and spacing back to default?")) {
                handleResetResume();
                applyPreset("normal");
              }
            }}
            className="p-2 rounded-xl bg-[#181F30] hover:bg-rose-500/20 text-[#667085] hover:text-rose-400 border border-[#232B3B] transition-colors cursor-pointer"
            title="Reset to default resume"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Granular Spacing & Layout Customizer Panel */}
      {showSpacingControls && (
        <div className="p-4 rounded-2xl bg-[#0D1524] border border-[#1F293D] text-left space-y-4 shadow-xl print-hide animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1A2538] pb-3">
            <div className="flex items-center gap-2">
              <Sliders size={16} className="text-[#818CF8]" />
              <h3 className="text-sm font-bold text-[#F8F8F8]">
                Resume Layout, Padding & Line Height Customizer
              </h3>
            </div>
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[#64748B] font-semibold mr-1">Presets:</span>
              <button
                type="button"
                onClick={() => applyPreset("compact")}
                className="px-2.5 py-1 rounded-lg bg-[#182338] hover:bg-[#202E45] border border-[#232B3B] text-[11px] font-bold text-[#CBD5E1] transition-colors cursor-pointer"
              >
                Compact (Fit 1 Page)
              </button>
              <button
                type="button"
                onClick={() => applyPreset("normal")}
                className="px-2.5 py-1 rounded-lg bg-[#182338] hover:bg-[#202E45] border border-[#232B3B] text-[11px] font-bold text-[#818CF8] transition-colors cursor-pointer"
              >
                Balanced
              </button>
              <button
                type="button"
                onClick={() => applyPreset("spacious")}
                className="px-2.5 py-1 rounded-lg bg-[#182338] hover:bg-[#202E45] border border-[#232B3B] text-[11px] font-bold text-[#CBD5E1] transition-colors cursor-pointer"
              >
                Spacious
              </button>
            </div>
          </div>

          {/* Granular Sliders Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Page Padding X (Horizontal) */}
            <div className="space-y-1.5 bg-[#121B2D] p-3 rounded-xl border border-[#1A2538]">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-[#CBD5E1]">Page Horizontal Margin (Padding X)</span>
                <span className="font-mono text-[#818CF8] font-bold">{spacing.paddingX}px</span>
              </div>
              <input
                type="range"
                min="16"
                max="56"
                step="2"
                value={spacing.paddingX}
                onChange={(e) => setSpacing((prev) => ({ ...prev, paddingX: Number(e.target.value) }))}
                className="w-full accent-[#6366F1] cursor-pointer"
              />
            </div>

            {/* 2. Page Padding Y (Vertical Top & Bottom) */}
            <div className="space-y-1.5 bg-[#121B2D] p-3 rounded-xl border border-[#1A2538]">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-[#CBD5E1]">Page Top/Bottom Margin (Padding Y)</span>
                <span className="font-mono text-[#818CF8] font-bold">{spacing.paddingY}px</span>
              </div>
              <input
                type="range"
                min="12"
                max="48"
                step="2"
                value={spacing.paddingY}
                onChange={(e) => setSpacing((prev) => ({ ...prev, paddingY: Number(e.target.value) }))}
                className="w-full accent-[#6366F1] cursor-pointer"
              />
            </div>

            {/* 3. Line Height */}
            <div className="space-y-1.5 bg-[#121B2D] p-3 rounded-xl border border-[#1A2538]">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-[#CBD5E1]">Line Height / Leading</span>
                <span className="font-mono text-[#818CF8] font-bold">{spacing.lineHeight.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="1.2"
                max="1.7"
                step="0.05"
                value={spacing.lineHeight}
                onChange={(e) => setSpacing((prev) => ({ ...prev, lineHeight: Number(e.target.value) }))}
                className="w-full accent-[#6366F1] cursor-pointer"
              />
            </div>

            {/* 4. Gap: Professional Summary -> Technical Skills */}
            <div className="space-y-1.5 bg-[#121B2D] p-3 rounded-xl border border-[#1A2538]">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-[#CBD5E1]">Summary → Skills Gap</span>
                <span className="font-mono text-[#818CF8] font-bold">{spacing.summarySkillsGap ?? spacing.sectionGap}px</span>
              </div>
              <input
                type="range"
                min="2"
                max="24"
                step="1"
                value={spacing.summarySkillsGap ?? spacing.sectionGap}
                onChange={(e) => setSpacing((prev) => ({ ...prev, summarySkillsGap: Number(e.target.value) }))}
                className="w-full accent-[#6366F1] cursor-pointer"
              />
            </div>

            {/* 5. Gap: Technical Skills -> Projects */}
            <div className="space-y-1.5 bg-[#121B2D] p-3 rounded-xl border border-[#1A2538]">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-[#CBD5E1]">Skills → Projects Gap</span>
                <span className="font-mono text-[#818CF8] font-bold">{spacing.skillsProjectsGap ?? spacing.sectionGap}px</span>
              </div>
              <input
                type="range"
                min="2"
                max="24"
                step="1"
                value={spacing.skillsProjectsGap ?? spacing.sectionGap}
                onChange={(e) => setSpacing((prev) => ({ ...prev, skillsProjectsGap: Number(e.target.value) }))}
                className="w-full accent-[#6366F1] cursor-pointer"
              />
            </div>

            {/* 6. Gap Between Individual Projects */}
            <div className="space-y-1.5 bg-[#121B2D] p-3 rounded-xl border border-[#1A2538]">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-[#CBD5E1]">Between Projects Gap</span>
                <span className="font-mono text-[#818CF8] font-bold">{spacing.projectGap}px</span>
              </div>
              <input
                type="range"
                min="2"
                max="20"
                step="1"
                value={spacing.projectGap}
                onChange={(e) => setSpacing((prev) => ({ ...prev, projectGap: Number(e.target.value) }))}
                className="w-full accent-[#6366F1] cursor-pointer"
              />
            </div>

            {/* 7. Bullet Points Spacing */}
            <div className="space-y-1.5 bg-[#121B2D] p-3 rounded-xl border border-[#1A2538]">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-[#CBD5E1]">Project Bullet Points Gap</span>
                <span className="font-mono text-[#818CF8] font-bold">{spacing.bulletGap ?? 2}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                step="1"
                value={spacing.bulletGap ?? 2}
                onChange={(e) => setSpacing((prev) => ({ ...prev, bulletGap: Number(e.target.value) }))}
                className="w-full accent-[#6366F1] cursor-pointer"
              />
            </div>

            {/* 8. Font Size */}
            <div className="space-y-1.5 bg-[#121B2D] p-3 rounded-xl border border-[#1A2538]">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-[#CBD5E1]">Base Typography Size</span>
                <span className="font-mono text-[#818CF8] font-bold">{spacing.fontSize}px</span>
              </div>
              <input
                type="range"
                min="10.5"
                max="14"
                step="0.25"
                value={spacing.fontSize}
                onChange={(e) => setSpacing((prev) => ({ ...prev, fontSize: Number(e.target.value) }))}
                className="w-full accent-[#6366F1] cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

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
          spacing={spacing}
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
