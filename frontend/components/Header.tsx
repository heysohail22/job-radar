import React from "react";
import { PanelLeft } from "lucide-react";

interface HeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isSidebarOpen, onToggleSidebar }) => {
  return (
    <header className="h-14 border-b border-[#232B3B] bg-[#080F18] px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 z-20">
      {/* Left: Sidebar Toggle Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl bg-[#101828] border border-[#232B3B] text-[#AAB4C5] hover:text-[#F8F8F8] hover:border-[#4F46E5] transition-all cursor-pointer shadow-xs flex items-center gap-2"
          title={isSidebarOpen ? "Collapse Sidebar" : "Open Sidebar"}
        >
          <PanelLeft size={16} />
          <span className="text-xs font-semibold hidden sm:inline">
            {isSidebarOpen ? "Collapse" : "Menu"}
          </span>
        </button>

        {/* Live Status Indicator */}
        <div className="flex items-center gap-2 text-xs text-[#AAB4C5] font-medium pl-1">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span className="font-semibold text-[#F8F8F8]">AI Job Radar</span>
        </div>
      </div>

      {/* Right: User Profile Pill */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4F46E5] to-[#7C3AED] text-[#F8F8F8] font-black text-xs flex items-center justify-center shadow-xs">
          SI
        </div>
        <div className="hidden sm:flex flex-col text-left">
          <span className="text-xs font-bold text-[#F8F8F8]">Sohel Islam</span>
          <span className="text-[10px] text-[#667085]">Aspiring GenAI Engineer</span>
        </div>
      </div>
    </header>
  );
};
