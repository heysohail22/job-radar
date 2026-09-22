"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Sidebar, type NavTab } from "../components/Sidebar";
import { Header } from "../components/Header";
import { JobsFeed } from "../components/JobsFeed";
import { JobDetailPane } from "../components/JobDetailPane";
import { ResumeView } from "../components/ResumeView";
import { Sparkles } from "lucide-react";
import type { JobPostingItem } from "../lib/mockJobs";

export default function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>("jobs");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [activePillFilter, setActivePillFilter] = useState<string>("all");
  const [jobs, setJobs] = useState<JobPostingItem[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobPostingItem | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Attempt live sync with backend FastAPI (/api/jobs) on load
  const loadJobsFromBackend = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/jobs");
      if (res.ok) {
        const liveData = await res.json();
        if (Array.isArray(liveData) && liveData.length > 0) {
          setJobs(liveData);
          setSelectedJob((prev) => prev || liveData[0]);
        }
      }
    } catch {
      // Backend offline or local dev
    }
  };

  useEffect(() => {
    loadJobsFromBackend();
  }, []);

  // Trigger live ATS scraper
  const handleScanLive = async () => {
    setIsScanning(true);
    try {
      const res = await fetch("http://localhost:8000/api/jobs?force_live=true");
      if (res.ok) {
        const liveData = await res.json();
        if (Array.isArray(liveData) && liveData.length > 0) {
          setJobs(liveData);
          setSelectedJob(liveData[0]);
        }
      }
    } catch (err) {
      console.error("Live scan failed:", err);
    } finally {
      setIsScanning(false);
    }
  };

  // Filter Jobs based on actual ATS fields (title, location, techStack)
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (activePillFilter === "internship" && !job.isInternship && !job.title.toLowerCase().includes("intern")) {
        return false;
      }
      if (
        activePillFilter === "genai" &&
        !job.title.toLowerCase().includes("ai") &&
        !job.techStack.some((t) => t.toLowerCase().includes("ai") || t.toLowerCase().includes("llm"))
      ) {
        return false;
      }
      if (activePillFilter === "remote" && !job.location.toLowerCase().includes("remote")) {
        return false;
      }
      if (activePillFilter === "india" && !job.location.toLowerCase().includes("india")) {
        return false;
      }
      return true;
    });
  }, [jobs, activePillFilter]);

  const handleTailorResume = (_jobDesc: string) => {
    setActiveTab("resume");
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#080F18] text-[#F8F8F8] font-sans antialiased select-none">
      {/* 1. Left Collapsible Sidebar with close button */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Top Header with Sidebar Toggle Button */}
        <Header
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        />

        {/* Dynamic Body Pane */}
        <main className="flex-1 flex h-[calc(100vh-56px)] overflow-hidden">
          {activeTab === "resume" ? (
            <ResumeView onGoToJobFinder={() => setActiveTab("jobs")} />
          ) : (
            <>
              {/* Center Feed */}
              <JobsFeed
                jobs={filteredJobs}
                selectedJobId={selectedJob?.id || ""}
                onSelectJob={setSelectedJob}
                activeFilter={activePillFilter}
                onFilterChange={setActivePillFilter}
                onScanLive={handleScanLive}
                isScanning={isScanning}
              />

              {/* Right Detail Pane */}
              {selectedJob ? (
                <JobDetailPane
                  job={selectedJob}
                  onTailorResume={handleTailorResume}
                />
              ) : (
                <div className="w-[420px] border-l border-[#232B3B] bg-[#080F18] h-full flex flex-col items-center justify-center p-8 text-center text-[#AAB4C5] space-y-3 shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-[#101828] border border-[#232B3B] flex items-center justify-center text-[#6366F1]">
                    <Sparkles size={20} />
                  </div>
                  <h3 className="font-extrabold text-sm text-[#F8F8F8]">No Job Selected</h3>
                  <p className="text-xs text-[#667085] leading-relaxed max-w-[260px]">
                    Scan or select an opportunity from the radar to view AI match breakdown and tailor your resume.
                  </p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

