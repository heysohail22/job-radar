"use client";

import React, { useState, useMemo } from "react";
import { Sidebar, type NavTab } from "../components/Sidebar";
import { Header } from "../components/Header";
import { JobsFeed } from "../components/JobsFeed";
import { JobDetailPane } from "../components/JobDetailPane";
import { ResumeView } from "../components/ResumeView";
import { MOCK_JOBS, type JobMatchItem } from "../lib/mockJobs";

export default function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>("jobs");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [locationFilter, setLocationFilter] = useState<string>("Anywhere");
  const [activePillFilter, setActivePillFilter] = useState<string>("all");
  const [selectedJob, setSelectedJob] = useState<JobMatchItem>(MOCK_JOBS[0]);
  const [bookmarkedJobIds, setBookmarkedJobIds] = useState<string[]>(["job-1"]);

  // Filter Jobs
  const filteredJobs = useMemo(() => {
    return MOCK_JOBS.filter((job) => {
      // Tab filter
      if (activeTab === "saved" && !bookmarkedJobIds.includes(job.id)) {
        return false;
      }

      // Pill filter
      if (activePillFilter === "internship" && !job.tags.some((t) => t.toLowerCase().includes("intern"))) {
        return false;
      }
      if (activePillFilter === "genai" && !job.role.toLowerCase().includes("genai") && !job.tags.some((t) => t.toLowerCase().includes("ai") || t.toLowerCase().includes("llm"))) {
        return false;
      }
      if (activePillFilter === "remote" && !job.isRemote) {
        return false;
      }
      if (activePillFilter === "india" && !job.location.toLowerCase().includes("india")) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = job.role.toLowerCase().includes(q);
        const matchComp = job.company.toLowerCase().includes(q);
        const matchDesc = job.description.toLowerCase().includes(q);
        const matchTag = job.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchComp && !matchDesc && !matchTag) return false;
      }

      // Location Filter
      if (locationFilter !== "Anywhere") {
        if (locationFilter === "Remote" && !job.isRemote) return false;
        if (locationFilter === "India" && !job.location.toLowerCase().includes("india")) return false;
      }

      return true;
    });
  }, [activeTab, activePillFilter, searchQuery, locationFilter, bookmarkedJobIds]);

  const handleToggleBookmark = (jobId: string) => {
    setBookmarkedJobIds((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );
  };

  const handleTailorResume = (_jobDesc: string) => {
    setActiveTab("resume");
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0B0E14] text-slate-100 font-sans antialiased">
      {/* 1. Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        savedCount={bookmarkedJobIds.length}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          locationFilter={locationFilter}
          onLocationChange={setLocationFilter}
          onSearchSubmit={() => {}}
        />

        {/* Dynamic Body Pane */}
        <main className="flex-1 flex h-[calc(100vh-64px)] overflow-hidden">
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
                bookmarkedJobIds={bookmarkedJobIds}
                onToggleBookmark={handleToggleBookmark}
              />

              {/* Right Detail Pane */}
              {selectedJob && (
                <JobDetailPane
                  job={selectedJob}
                  isBookmarked={bookmarkedJobIds.includes(selectedJob.id)}
                  onToggleBookmark={() => handleToggleBookmark(selectedJob.id)}
                  onTailorResume={handleTailorResume}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
