"use client";

import React from "react";
import { Sparkles, Home, FileText, ChevronLeft, X } from "lucide-react";

export type NavTab = "jobs" | "resume";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
}) => {
  const navItems = [
    { id: "jobs" as NavTab, label: "Jobs Radar", icon: Home },
    { id: "resume" as NavTab, label: "My Resume", icon: FileText },
  ];

  const renderContent = (isMobileView: boolean) => (
    <>
      {/* Brand Header */}
      <div className="space-y-6 w-full">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#4F46E5] to-[#7C3AED] flex items-center justify-center text-white shadow-xs">
              <Sparkles size={18} />
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight text-[#F8F8F8]">
                JobMatch <span className="text-[#6366F1]">AI</span>
              </h1>
              <p className="text-[10px] text-[#667085]">Opportunities. Faster.</p>
            </div>
          </div>

          {/* Close Button on sidebar header */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#101828] border border-[#232B3B] text-[#AAB4C5] hover:text-[#F8F8F8] transition-colors cursor-pointer"
            title="Close Sidebar"
          >
            {isMobileView ? <X size={16} /> : <ChevronLeft size={15} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  if (isMobileView) onClose();
                }}
                className={`
                  w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer
                  ${
                    isActive
                      ? "bg-[#101828] border border-[#6366F1]/50 text-[#F8F8F8] font-bold shadow-xs"
                      : "text-[#AAB4C5] hover:text-[#F8F8F8] hover:bg-[#101828]/60"
                  }
                `}
              >
                <Icon size={16} className={isActive ? "text-[#6366F1]" : "text-[#667085]"} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Card */}
      <div className="pt-4 border-t border-[#232B3B] w-full">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#101828] border border-[#232B3B]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4F46E5] to-[#7C3AED] text-[#F8F8F8] font-black text-xs flex items-center justify-center shrink-0">
            SI
          </div>
          <div className="text-left overflow-hidden">
            <div className="text-xs font-bold text-[#F8F8F8] truncate">Sohel Islam</div>
            <div className="text-[10px] text-[#667085] truncate">Aspiring GenAI Engineer</div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* 1. Mobile Drawer (< 768px) */}
      <div className="md:hidden">
        {isOpen && (
          <>
            {/* Mobile Backdrop */}
            <div
              onClick={onClose}
              className="fixed inset-0 bg-black/75 backdrop-blur-xs z-40 cursor-pointer animate-in fade-in duration-150"
            />
            {/* Mobile Drawer Panel */}
            <aside
              className="fixed inset-y-0 left-0 z-50 w-[260px] bg-[#080820] border-r border-[#232B3B] flex flex-col justify-between p-4 shadow-2xl animate-in slide-in-from-left duration-200"
            >
              {renderContent(true)}
            </aside>
          </>
        )}
      </div>

      {/* 2. Desktop Sidebar (>= 768px) */}
      {isOpen && (
        <aside className="hidden md:flex w-[240px] border-r border-[#232B3B] bg-[#080820] flex-col justify-between p-4 shrink-0 h-full overflow-hidden z-30">
          {renderContent(false)}
        </aside>
      )}
    </>
  );
};
