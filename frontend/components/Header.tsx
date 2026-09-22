import React from "react";
import { Search, MapPin, Bell } from "lucide-react";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  locationFilter: string;
  onLocationChange: (loc: string) => void;
  onSearchSubmit: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  locationFilter,
  onLocationChange,
  onSearchSubmit,
}) => {
  return (
    <header className="h-16 border-b border-[#1E2638] bg-[#0B0E14] px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 z-20">
      {/* Search Bar Group */}
      <div className="flex-1 max-w-2xl flex items-center gap-2">
        <div className="flex-1 flex items-center bg-[#111622] border border-[#1E2638] rounded-xl px-3 py-1.5 focus-within:border-indigo-500 transition-colors">
          <Search size={16} className="text-slate-400 shrink-0 mr-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearchSubmit()}
            placeholder="Search jobs, companies, or keywords..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />

          <div className="h-4 w-[1px] bg-[#1E2638] mx-2 shrink-0" />

          <div className="flex items-center gap-1.5 text-xs text-slate-300 shrink-0 cursor-pointer">
            <MapPin size={13} className="text-slate-400" />
            <select
              value={locationFilter}
              onChange={(e) => onLocationChange(e.target.value)}
              className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer pr-1"
            >
              <option value="Anywhere" className="bg-[#111622] text-white">Anywhere</option>
              <option value="Remote" className="bg-[#111622] text-white">Remote</option>
              <option value="India" className="bg-[#111622] text-white">India</option>
            </select>
          </div>
        </div>

        <button
          onClick={onSearchSubmit}
          className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shrink-0 cursor-pointer shadow-xs"
        >
          Search
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Notification Bell */}
        <button
          className="relative p-2 rounded-xl bg-[#111622] border border-[#1E2638] text-slate-300 hover:text-white hover:border-slate-600 transition-colors cursor-pointer"
          title="Notifications"
        >
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
        </button>

        {/* User Avatar Pill */}
        <div className="flex items-center gap-2.5 pl-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-500 text-white font-black text-xs flex items-center justify-center shadow-xs">
            SI
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-100">Sohel Islam</span>
            <span className="text-[10px] text-slate-400">Aspiring GenAI Engineer</span>
          </div>
        </div>
      </div>
    </header>
  );
};
