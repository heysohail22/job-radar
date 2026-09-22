"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Home, FileText, ChevronLeft } from "lucide-react";

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
    { id: "jobs" as NavTab, label: "Jobs", icon: Home },
    { id: "resume" as NavTab, label: "Resume", icon: FileText },
  ];

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 240, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="border-r border-[#232B3B] bg-[#080820] flex flex-col justify-between p-4 shrink-0 h-full overflow-hidden z-30"
        >
          {/* Brand Header */}
          <div className="space-y-6 w-[208px]">
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
                <ChevronLeft size={15} />
              </button>
            </div>

            {/* Navigation (Only Jobs and Resume) */}
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
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
          <div className="pt-4 border-t border-[#232B3B] w-[208px]">
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
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
