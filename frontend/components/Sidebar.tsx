"use client";

import React from "react";
import {
  Sparkles,
  Home,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  Cpu,
  MapPin,
  Bot,
} from "lucide-react";

export type NavTab = "jobs" | "applied" | "resume";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  appliedCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  appliedCount = 0,
}) => {
  const navItems = [
    {
      id: "jobs" as NavTab,
      label: "Jobs Radar",
      badge: "LIVE",
      icon: Home,
      count: null,
      description: "Verified India & Remote roles",
    },
    {
      id: "applied" as NavTab,
      label: "Applied Jobs",
      badge: null,
      icon: CheckCircle2,
      count: appliedCount,
      description: "Tracked submissions",
    },
    {
      id: "resume" as NavTab,
      label: "My Resume",
      badge: "AI",
      icon: FileText,
      count: null,
      description: "Tailoring & live editor",
    },
  ];

  return (
    <>
      {/* 1. Mobile Drawer Overlay (Slide-over drawer with backdrop) */}
      <div
        className={`
          md:hidden fixed inset-0 z-50 transition-all duration-300
          ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      >
        {/* Backdrop blur */}
        <div
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        />

        {/* Slide-out drawer */}
        <aside
          className={`
            absolute top-0 left-0 h-full w-[280px] bg-[#0A101D] border-r border-[#1F293D] flex flex-col justify-between p-5 shadow-2xl transition-transform duration-300 ease-out z-10
            ${isOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          {/* Top Brand Header */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#4F46E5] to-[#7C3AED] flex items-center justify-center text-white shadow-md shadow-[#4F46E5]/30">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h1 className="font-black text-sm tracking-tight text-[#F8F8F8]">
                    JobMatch <span className="text-[#6366F1]">AI</span>
                  </h1>
                  <p className="text-[10px] text-[#667085] font-medium">Autonomous Radar</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg bg-[#141C2E] border border-[#232B3B] text-[#AAB4C5] hover:text-[#F8F8F8] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onTabChange(item.id);
                      onClose();
                    }}
                    className={`
                      w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-left
                      ${isActive
                        ? "bg-gradient-to-r from-[#4F46E5]/20 to-[#7C3AED]/10 border border-[#6366F1]/50 text-[#F8F8F8] shadow-sm"
                        : "text-[#AAB4C5] hover:text-[#F8F8F8] hover:bg-[#141C2E] border border-transparent"
                      }
                    `}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${isActive ? "bg-[#6366F1] text-white shadow-xs" : "bg-[#141C2E] text-[#667085]"
                        }`}
                    >
                      <Icon size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold">{item.label}</span>
                        {item.badge && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-[#10B981]/20 text-[#34D399]">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#667085] font-normal truncate">
                        {item.description}
                      </p>
                    </div>
                    {item.count !== null && item.count > 0 && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/30">
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* User Profile */}
          <div className="pt-4 border-t border-[#1F293D]">
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#141C2E] border border-[#232B3B]">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4F46E5] to-[#7C3AED] text-[#F8F8F8] font-black text-xs flex items-center justify-center shrink-0">
                  SI
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#10B981] border-2 border-[#141C2E]" />
              </div>
              <div className="text-left overflow-hidden">
                <div className="text-xs font-bold text-[#F8F8F8] truncate">Sohel Islam</div>
                <div className="text-[10px] text-[#667085] truncate">Aspiring GenAI Engineer</div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* 2. Desktop Sleek Sidebar (Smoothly Expands or Collapses to Icon Dock) */}
      <aside
        className={`
          hidden md:flex flex-col justify-between border-r border-[#1F293D] bg-[#0A101D] h-full shrink-0 z-30 transition-all duration-300 ease-in-out
          ${isOpen ? "w-[245px] p-4" : "w-[68px] p-3 items-center"}
        `}
      >
        {/* Top Header */}
        <div className="space-y-6 w-full">
          {isOpen ? (
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#4F46E5] to-[#7C3AED] flex items-center justify-center text-white shadow-md shadow-[#4F46E5]/30">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h1 className="font-black text-sm tracking-tight text-[#F8F8F8]">
                    JobMatch <span className="text-[#6366F1]">AI</span>
                  </h1>
                  <p className="text-[10px] text-[#667085] font-semibold">Autonomous Radar</p>
                </div>
              </div>

              {/* Collapse Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg bg-[#141C2E] border border-[#232B3B] text-[#AAB4C5] hover:text-[#F8F8F8] hover:border-[#4F46E5] transition-all cursor-pointer"
                title="Collapse sidebar"
              >
                <ChevronLeft size={15} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#4F46E5] to-[#7C3AED] flex items-center justify-center text-white shadow-md shadow-[#4F46E5]/30 cursor-pointer hover:scale-105 transition-transform"
                title="Expand sidebar"
              >
                <Sparkles size={18} />
              </button>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="space-y-2 w-full">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              if (!isOpen) {
                // Collapsed Icon Dock Mode
                return (
                  <div key={item.id} className="relative group flex justify-center">
                    <button
                      type="button"
                      onClick={() => onTabChange(item.id)}
                      className={`
                        w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer relative
                        ${isActive
                          ? "bg-[#4F46E5] text-white shadow-lg shadow-[#4F46E5]/40"
                          : "bg-[#141C2E] text-[#AAB4C5] hover:text-[#F8F8F8] hover:bg-[#1E293D] border border-[#232B3B]"
                        }
                      `}
                      title={item.label}
                    >
                      <Icon size={18} />
                      {item.count !== null && item.count > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#10B981] text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                          {item.count}
                        </span>
                      )}
                    </button>
                  </div>
                );
              }

              // Expanded Full Sidebar Mode
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-left
                    ${isActive
                      ? "bg-gradient-to-r from-[#4F46E5]/25 to-[#7C3AED]/15 border border-[#6366F1]/50 text-[#F8F8F8] shadow-sm"
                      : "text-[#AAB4C5] hover:text-[#F8F8F8] hover:bg-[#141C2E] border border-transparent"
                    }
                  `}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isActive ? "bg-[#6366F1] text-white shadow-xs" : "bg-[#141C2E] text-[#667085]"
                      }`}
                  >
                    <Icon size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-black ${item.badge === "LIVE"
                            ? "bg-[#10B981]/20 text-[#34D399]"
                            : "bg-[#6366F1]/20 text-[#A5B4FC]"
                            }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>
                  {item.count !== null && item.count > 0 && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/30 shrink-0">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile Section */}
        <div className="w-full pt-4 border-t border-[#1F293D]">
          {isOpen ? (
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#141C2E] border border-[#232B3B]">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4F46E5] to-[#7C3AED] text-[#F8F8F8] font-black text-xs flex items-center justify-center shrink-0">
                  SI
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#10B981] border-2 border-[#141C2E]" />
              </div>
              <div className="text-left overflow-hidden flex-1 min-w-0">
                <div className="text-xs font-bold text-[#F8F8F8] truncate">Sohel Islam</div>
                <div className="text-[10px] text-[#667085] truncate">Aspiring GenAI Engineer</div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#4F46E5] to-[#7C3AED] text-[#F8F8F8] font-black text-xs flex items-center justify-center cursor-pointer shadow-xs"
                title="Sohel Islam (Aspiring GenAI Engineer)"
              >
                SI
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-[#667085] hover:text-[#F8F8F8] transition-colors cursor-pointer"
                title="Expand sidebar"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

