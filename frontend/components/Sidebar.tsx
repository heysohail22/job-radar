import React from "react";
import {
  Sparkles,
  Home,
  Search,
  Bookmark,
  CheckSquare,
  FileText,
  Settings,
  ChevronRight,
} from "lucide-react";

export type NavTab = "home" | "jobs" | "saved" | "applied" | "resume" | "settings";

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  savedCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  savedCount = 0,
}) => {
  const navItems = [
    { id: "home" as NavTab, label: "Home", icon: Home },
    { id: "jobs" as NavTab, label: "Find Jobs", icon: Search },
    { id: "saved" as NavTab, label: "Saved Jobs", icon: Bookmark, badge: savedCount },
    { id: "applied" as NavTab, label: "Applied", icon: CheckSquare },
    { id: "resume" as NavTab, label: "Resume", icon: FileText },
    { id: "settings" as NavTab, label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-60 border-r border-[#1E2638] bg-[#0B0E14] flex flex-col justify-between p-4 shrink-0 h-full overflow-y-auto">
      {/* Brand Header */}
      <div className="space-y-6">
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles size={18} />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1">
              JobMatch <span className="text-indigo-400">AI</span>
            </h1>
            <p className="text-[10px] text-slate-400">Find the right opportunities. Faster.</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`
                  w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer
                  ${
                    isActive
                      ? "bg-indigo-600/15 border border-indigo-500/30 text-indigo-300 font-bold shadow-xs"
                      : "text-slate-400 hover:text-slate-100 hover:bg-[#111622]"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} className={isActive ? "text-indigo-400" : "text-slate-400"} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile & Promo Card */}
      <div className="space-y-3 pt-4 border-t border-[#1E2638]">
        {/* User Card */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#111622] border border-[#1E2638] hover:border-slate-600 transition-colors cursor-pointer">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-500 text-white font-black text-xs flex items-center justify-center">
              SI
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-100">Sohel Islam</div>
              <div className="text-[10px] text-slate-400">Aspiring GenAI Engineer</div>
            </div>
          </div>
          <ChevronRight size={14} className="text-slate-500" />
        </div>

        {/* Promo Card */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-950/70 to-[#0F1420] border border-indigo-500/20 text-left space-y-1 relative overflow-hidden">
          <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-bold">
            <Sparkles size={13} />
            <span>AI Matching</span>
          </div>
          <p className="text-[11px] text-slate-300 font-medium leading-snug">
            Better opportunities are closer than you think.
          </p>
        </div>
      </div>
    </aside>
  );
};
