"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Sidebar, type NavTab } from "../components/Sidebar";
import { Header } from "../components/Header";
import { JobsFeed } from "../components/JobsFeed";
import { JobDetailPane } from "../components/JobDetailPane";
import { ResumeView } from "../components/ResumeView";
import { Sparkles, Flame, X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import type { JobPostingItem } from "../lib/types";

const STORAGE_KEY = "jobmatch_radar_jobs";

export default function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>("jobs");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [activePillFilter, setActivePillFilter] = useState<string>("all");
  const [jobs, setJobs] = useState<JobPostingItem[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobPostingItem | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isFetchingBackend, setIsFetchingBackend] = useState<boolean>(false);
  const [statusFeedback, setStatusFeedback] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Firecrawl modal state
  const [isFirecrawlOpen, setIsFirecrawlOpen] = useState<boolean>(false);
  const [firecrawlKey, setFirecrawlKey] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("Gen AI Intern YC");

  // Helper to update jobs and sync to localStorage
  const updateJobs = (newJobs: JobPostingItem[]) => {
    setJobs(newJobs);
    if (newJobs.length > 0) {
      setSelectedJob((prev) => (prev && newJobs.some((j) => j.id === prev.id) ? prev : newJobs[0]));
    } else {
      setSelectedJob(null);
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newJobs));
    } catch (err) {
      console.error("Local storage write error:", err);
    }
  };

  // 1. Initial Load: Load from localStorage first, then sync with backend
  useEffect(() => {
    let hasLocal = false;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setJobs(parsed);
          setSelectedJob(parsed[0]);
          hasLocal = true;
        }
      }
    } catch {
      // Local storage read error
    }

    // If no jobs in localStorage, fetch from backend automatically
    if (!hasLocal) {
      fetchBackendJobs({ silent: true });
    }
  }, []);

  // Fetch jobs from backend (FastAPI /api/jobs) and save locally
  const fetchBackendJobs = async ({ silent = false }: { silent?: boolean } = {}) => {
    setIsFetchingBackend(true);
    if (!silent) setStatusFeedback(null);

    try {
      // Try fetching live / fresh jobs from backend
      let res = await fetch("http://localhost:8000/api/jobs?force_live=true");
      if (!res.ok) {
        // Fallback to cached jobs in DB
        res = await fetch("http://localhost:8000/api/jobs");
      }

      if (!res.ok) {
        throw new Error(`Backend responded with status ${res.status}`);
      }

      const liveData: JobPostingItem[] = await res.json();
      if (Array.isArray(liveData) && liveData.length > 0) {
        updateJobs(liveData);
        if (!silent) {
          setStatusFeedback({
            message: `Fetched ${liveData.length} jobs from backend & saved locally!`,
            type: "success",
          });
        }
      } else {
        if (!silent) {
          setStatusFeedback({
            message: "Connected to backend, but no jobs were returned.",
            type: "info",
          });
        }
      }
    } catch (err: unknown) {
      console.error("Fetch backend jobs error:", err);
      if (!silent) {
        setStatusFeedback({
          message: "Failed to connect to backend at localhost:8000. Is FastAPI running?",
          type: "error",
        });
      }
    } finally {
      setIsFetchingBackend(false);
      if (!silent) {
        setTimeout(() => setStatusFeedback(null), 5000);
      }
    }
  };

  // 2. Scan Live ATS Boards (Greenhouse, Lever, Ashby)
  const handleScanLive = async () => {
    setIsScanning(true);
    try {
      const res = await fetch("http://localhost:8000/api/jobs?force_live=true");
      if (res.ok) {
        const liveData = await res.json();
        if (Array.isArray(liveData) && liveData.length > 0) {
          updateJobs(liveData);
          setStatusFeedback({
            message: `Scanned ATS and updated ${liveData.length} jobs locally.`,
            type: "success",
          });
          setTimeout(() => setStatusFeedback(null), 4000);
        }
      }
    } catch (err) {
      console.error("Live scan error:", err);
      setStatusFeedback({
        message: "Live scan failed. Is the backend running?",
        type: "error",
      });
      setTimeout(() => setStatusFeedback(null), 4000);
    } finally {
      setIsScanning(false);
    }
  };

  // 3. Trigger Firecrawl web scraper
  const handleFirecrawlScrape = async () => {
    setIsScanning(true);
    try {
      const res = await fetch("http://localhost:8000/api/jobs/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          search_query: searchQuery || "Gen AI Intern",
          firecrawl_key: firecrawlKey.trim() || undefined,
        }),
      });
      if (res.ok) {
        const scraped = await res.json();
        if (Array.isArray(scraped) && scraped.length > 0) {
          // Merge with existing jobs (prevent duplicates)
          const existingIds = new Set(jobs.map((j) => j.id));
          const combined = [...scraped.filter((j: JobPostingItem) => !existingIds.has(j.id)), ...jobs];
          updateJobs(combined);
          setIsFirecrawlOpen(false);
          setStatusFeedback({
            message: `Scraped ${scraped.length} new jobs and saved locally!`,
            type: "success",
          });
          setTimeout(() => setStatusFeedback(null), 4000);
        }
      }
    } catch (err) {
      console.error("Firecrawl scrape error:", err);
      setStatusFeedback({
        message: "Firecrawl scrape failed.",
        type: "error",
      });
      setTimeout(() => setStatusFeedback(null), 4000);
    } finally {
      setIsScanning(false);
    }
  };

  // Clear locally stored jobs
  const handleClearLocalJobs = () => {
    if (window.confirm("Are you sure you want to clear locally stored jobs?")) {
      updateJobs([]);
      setStatusFeedback({
        message: "Cleared all locally stored jobs.",
        type: "info",
      });
      setTimeout(() => setStatusFeedback(null), 3000);
    }
  };

  // Filter Jobs based on actual ATS fields (title, location, techStack)
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (
        activePillFilter === "startups" &&
        !(
          (job.companyStage &&
            (job.companyStage.toLowerCase().includes("seed") ||
              job.companyStage.toLowerCase().includes("series a") ||
              job.companyStage.toLowerCase().includes("early") ||
              job.companyStage.toLowerCase().includes("yc"))) ||
          job.source.toLowerCase() === "ashby" ||
          job.source.toLowerCase() === "y combinator" ||
          job.source.toLowerCase() === "firecrawl"
        )
      ) {
        return false;
      }
      if (activePillFilter === "internship") {
        const isInternOrFresher =
          job.isInternship ||
          job.isFresher ||
          /intern|fresher|graduate|trainee|junior|student|co-op|apprentice/i.test(
            job.title + " " + job.description
          );
        if (!isInternOrFresher) return false;
      }
      if (activePillFilter === "agents") {
        const matchesAgents =
          /agent|langgraph|langchain|tool|workflow/i.test(job.title + " " + job.description) ||
          job.techStack.some((t) => /agent|langgraph|langchain|tool/i.test(t));
        if (!matchesAgents) return false;
      }
      if (activePillFilter === "rag") {
        const matchesRag =
          /rag|vector|supabase|pgvector|crag|retrieval/i.test(job.title + " " + job.description) ||
          job.techStack.some((t) => /rag|vector|supabase|pgvector|crag/i.test(t));
        if (!matchesRag) return false;
      }
      if (activePillFilter === "remote" && !job.location.toLowerCase().includes("remote")) {
        return false;
      }
      if (activePillFilter === "india") {
        const isIndiaRole =
          job.isIndia ||
          /india|bengaluru|bangalore|hyderabad|pune|gurgaon|gurugram|delhi|ncr|mumbai|noida|chennai|kochi/i.test(
            job.location + " " + job.title + " " + job.description
          );
        if (!isIndiaRole) return false;
      }
      return true;
    });
  }, [jobs, activePillFilter]);

  const handleTailorResume = (_jobDesc: string) => {
    setActiveTab("resume");
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#080F18] text-[#F8F8F8] font-sans antialiased select-none relative">
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
                onFetchJobs={() => fetchBackendJobs({ silent: false })}
                isFetching={isFetchingBackend}
                onScanLive={handleScanLive}
                onOpenFirecrawl={() => setIsFirecrawlOpen(true)}
                isScanning={isScanning}
                onClearLocalJobs={handleClearLocalJobs}
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
                    Fetch or select an opportunity from the radar to view AI match breakdown and tailor your resume.
                  </p>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Toast / Notification Banner */}
      {statusFeedback && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-semibold shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            statusFeedback.type === "success"
              ? "bg-[#10B981]/20 border-[#10B981]/50 text-[#34D399]"
              : statusFeedback.type === "error"
              ? "bg-[#EF4444]/20 border-[#EF4444]/50 text-[#F87171]"
              : "bg-[#6366F1]/20 border-[#6366F1]/50 text-[#A5B4FC]"
          }`}
        >
          {statusFeedback.type === "success" && <CheckCircle size={15} />}
          {statusFeedback.type === "error" && <AlertCircle size={15} />}
          {statusFeedback.type === "info" && <Sparkles size={15} />}
          <span>{statusFeedback.message}</span>
          <button
            onClick={() => setStatusFeedback(null)}
            className="ml-2 text-current opacity-70 hover:opacity-100 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Firecrawl Scraper Modal */}
      {isFirecrawlOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-[#101828] border border-[#232B3B] p-6 space-y-5 shadow-2xl text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FF5722]/15 text-[#FF5722] flex items-center justify-center">
                  <Flame size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#F8F8F8]">Fetch Jobs with Firecrawl</h3>
                  <p className="text-xs text-[#AAB4C5]">Deep-scrape live startup & YC portals</p>
                </div>
              </div>
              <button
                onClick={() => setIsFirecrawlOpen(false)}
                className="p-1 rounded-lg text-[#AAB4C5] hover:text-[#F8F8F8] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#AAB4C5] font-semibold mb-1">Search Keywords</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. Gen AI Intern, LLM Engineer"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#181F30] border border-[#232B3B] text-[#F8F8F8] placeholder-[#667085] focus:outline-hidden focus:border-[#6366F1]"
                />
              </div>

              <div>
                <label className="block text-[#AAB4C5] font-semibold mb-1">
                  Firecrawl API Key <span className="text-[10px] text-[#667085]">(Optional if set in .env)</span>
                </label>
                <input
                  type="password"
                  value={firecrawlKey}
                  onChange={(e) => setFirecrawlKey(e.target.value)}
                  placeholder="fc-..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#181F30] border border-[#232B3B] text-[#F8F8F8] placeholder-[#667085] focus:outline-hidden focus:border-[#6366F1]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setIsFirecrawlOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#181F30] border border-[#232B3B] text-[#AAB4C5] hover:text-[#F8F8F8] font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleFirecrawlScrape}
                disabled={isScanning}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF5722] to-[#4F46E5] hover:from-[#FF7043] hover:to-[#6366F1] text-white font-bold text-xs transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isScanning ? <Loader2 size={14} className="animate-spin" /> : <Flame size={14} />}
                <span>{isScanning ? "Scraping Portals..." : "Start Scraping"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
