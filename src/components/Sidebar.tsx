import React from "react";
import type { ResumeDataType } from "../resumeData";
import { SparklesIcon, Edit3Icon, ChevronLeftIcon, TargetIcon } from "../icons";
import { AiTailorPanel } from "./AiTailorPanel";
import { ResumeEditorPanel } from "../ResumeEditorPanel";
import { JobRadarPanel } from "./JobRadarPanel";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: "ai" | "edit" | "jobs";
  onChangeTab: (tab: "ai" | "edit" | "jobs") => void;
  // AI Tailor Props
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  userGroqKey: string;
  onSaveGroqKey: (key: string) => void;
  userGeminiKey: string;
  onSaveGeminiKey: (key: string) => void;
  userFirecrawlKey: string;
  onSaveFirecrawlKey: (key: string) => void;
  hasEnvGroq: boolean;
  hasEnvGemini: boolean;
  jobDescription: string;
  onChangeJobDescription: (jd: string) => void;
  isLoading: boolean;
  isTailored: boolean;
  tailoredRole: string;
  errorMsg: string | null;
  onRunAiTailor: () => void;
  onResetResume: () => void;
  // Editor Props
  resume: ResumeDataType;
  onChangeResume: (updatedResume: ResumeDataType) => void;
  // Job Radar Props
  onSelectJobForTailoring: (jd: string) => void;
  savedBookmarkIds: string[];
  onToggleBookmark: (jobId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onChangeTab,
  selectedModel,
  onSelectModel,
  userGroqKey,
  onSaveGroqKey,
  userGeminiKey,
  onSaveGeminiKey,
  userFirecrawlKey,
  onSaveFirecrawlKey,
  hasEnvGroq,
  hasEnvGemini,
  jobDescription,
  onChangeJobDescription,
  isLoading,
  isTailored,
  tailoredRole,
  errorMsg,
  onRunAiTailor,
  onResetResume,
  resume,
  onChangeResume,
  onSelectJobForTailoring,
  savedBookmarkIds,
  onToggleBookmark,
}) => {
  return (
    <>
      {/* Mobile / Tablet Drawer Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs z-40 xl:hidden print:hidden"
        />
      )}

      {/* Toggleable Sidebar (Desktop Docked or Slide-Out + Mobile Off-Canvas Drawer) */}
      <aside
        className={`
          fixed xl:sticky top-0 xl:top-[68px] left-0 z-50 xl:z-20 h-full xl:h-[calc(100vh-88px)]
          bg-white border-r xl:border border-zinc-200 xl:rounded-2xl shadow-2xl xl:shadow-lg
          transition-all duration-300 ease-in-out shrink-0 print:hidden flex flex-col overflow-hidden
          ${
            isOpen
              ? "w-[92vw] sm:w-[480px] xl:w-[480px] translate-x-0 opacity-100"
              : "w-0 -translate-x-full xl:translate-x-0 xl:w-0 xl:p-0 xl:border-0 opacity-0 pointer-events-none"
          }
        `}
      >
        {/* Sidebar Header */}
        <div className="bg-zinc-950 text-white p-3.5 flex items-center justify-between border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <SparklesIcon size={16} className="text-zinc-200" />
            <h2 className="font-extrabold text-sm tracking-tight text-zinc-100">
              Resume & Job Control Center
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Collapse Sidebar"
          >
            <ChevronLeftIcon size={16} />
          </button>
        </div>

        {/* 3-Way Tab Switcher */}
        <div className="p-2.5 border-b border-zinc-200 bg-zinc-100/60 shrink-0">
          <div className="grid grid-cols-3 p-1 bg-zinc-200/80 rounded-lg text-xs font-semibold gap-1">
            <button
              onClick={() => onChangeTab("jobs")}
              className={`py-1.5 px-2 flex items-center justify-center gap-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === "jobs"
                  ? "bg-emerald-600 text-white shadow-xs font-bold"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <TargetIcon size={13} />
              <span className="truncate">Job Radar</span>
            </button>
            <button
              onClick={() => onChangeTab("ai")}
              className={`py-1.5 px-2 flex items-center justify-center gap-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === "ai"
                  ? "bg-white text-zinc-900 shadow-xs font-bold"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <SparklesIcon size={13} />
              <span className="truncate">AI Tailor</span>
            </button>
            <button
              onClick={() => onChangeTab("edit")}
              className={`py-1.5 px-2 flex items-center justify-center gap-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === "edit"
                  ? "bg-white text-zinc-900 shadow-xs font-bold"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Edit3Icon size={13} />
              <span className="truncate">UI Editor</span>
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-hidden flex flex-col bg-white">
          {activeTab === "jobs" ? (
            <JobRadarPanel
              userFirecrawlKey={userFirecrawlKey}
              onSaveFirecrawlKey={onSaveFirecrawlKey}
              userGeminiKey={userGeminiKey}
              userGroqKey={userGroqKey}
              resume={resume}
              onSelectJobForTailoring={onSelectJobForTailoring}
              savedBookmarkIds={savedBookmarkIds}
              onToggleBookmark={onToggleBookmark}
            />
          ) : activeTab === "ai" ? (
            <AiTailorPanel
              selectedModel={selectedModel}
              onSelectModel={onSelectModel}
              userGroqKey={userGroqKey}
              onSaveGroqKey={onSaveGroqKey}
              userGeminiKey={userGeminiKey}
              onSaveGeminiKey={onSaveGeminiKey}
              hasEnvGroq={hasEnvGroq}
              hasEnvGemini={hasEnvGemini}
              jobDescription={jobDescription}
              onChangeJobDescription={onChangeJobDescription}
              isLoading={isLoading}
              isTailored={isTailored}
              tailoredRole={tailoredRole}
              errorMsg={errorMsg}
              onRunAiTailor={onRunAiTailor}
              onResetResume={onResetResume}
            />
          ) : (
            <ResumeEditorPanel
              resume={resume}
              onChange={onChangeResume}
              onReset={onResetResume}
            />
          )}
        </div>
      </aside>
    </>
  );
};

