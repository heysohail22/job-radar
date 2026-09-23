"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Sidebar, type NavTab } from "../components/Sidebar";
import { Header } from "../components/Header";
import { JobsFeed } from "../components/JobsFeed";
import { JobDetailPane } from "../components/JobDetailPane";
import { ResumeView } from "../components/ResumeView";
import { Sparkles, Flame, X, Loader2, CheckCircle, AlertCircle, Home as HomeIcon, FileText, Search } from "lucide-react";
import type { JobPostingItem } from "../lib/types";
import { defaultJobs } from "../lib/defaultJobs";

const STORAGE_KEY = "jobmatch_radar_jobs";

// Dynamically connect to backend via LAN IP (e.g. 192.168.x.x:8000) or localhost
const getBackendUrl = () => {
  if (typeof window !== "undefined" && window.location.hostname) {
    return `http://${window.location.hostname}:8000`;
  }
  return "http://localhost:8000";
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>("jobs");
  const [feedTab, setFeedTab] = useState<"radar" | "applied">("radar");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState<boolean>(false);
  const [activePillFilter, setActivePillFilter] = useState<string>("all");
  // Start with defaultJobs on both SSR and client to ensure 100% hydration match
  const [jobs, setJobs] = useState<JobPostingItem[]>(defaultJobs);
  const [selectedJob, setSelectedJob] = useState<JobPostingItem | null>(defaultJobs[0] || null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isFetchingBackend, setIsFetchingBackend] = useState<boolean>(false);
  const [statusFeedback, setStatusFeedback] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [targetTailorJD, setTargetTailorJD] = useState<string>("");

  // Total applied count for badge
  const appliedCount = useMemo(() => {
    return jobs.filter((j) => !!j.isApplied).length;
  }, [jobs]);

  // Sync saved jobs from localStorage after hydration without mismatch
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setJobs(parsed);
            setSelectedJob(parsed[0]);
          }
        }
      }
    } catch (err) {
      console.error("Local storage load error:", err);
    }
  }, []);

  // Set sidebar open by default only on desktop
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      setIsSidebarOpen(true);
    }
  }, []);

  // Firecrawl modal state
  const [isFirecrawlOpen, setIsFirecrawlOpen] = useState<boolean>(false);
  const [firecrawlKey, setFirecrawlKey] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("Gen AI Intern YC");

  // Google Jobs modal state
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState<boolean>(false);
  const [googleQuery, setGoogleQuery] = useState<string>("Gen AI Intern India");
  const [isSearchingGoogle, setIsSearchingGoogle] = useState<boolean>(false);

  // Helper to merge newly fetched/scraped jobs with existing jobs:
  // 1. Strictly deduplicates by ID, normalized Company+Title, and URL (guarantees zero duplicate cards)
  // 2. Preserves already applied status so applied jobs stay safely in "Applied Jobs" and never reappear in "Active Radar"
  const mergeJobsPreservingApplied = (incoming: JobPostingItem[], current: JobPostingItem[]): JobPostingItem[] => {
    const currentAppliedMap = new Map<string, JobPostingItem>();
    const currentAppliedKeys = new Set<string>();

    current.forEach((j) => {
      if (j.isApplied) {
        currentAppliedMap.set(j.id, j);
        const compTitleKey = `${(j.company || "").trim().toLowerCase()}::${(j.title || "").trim().toLowerCase()}`;
        currentAppliedKeys.add(compTitleKey);
        if (j.url) currentAppliedKeys.add(j.url.trim().toLowerCase());
      }
    });

    const seenKeys = new Set<string>();
    const result: JobPostingItem[] = [];

    const getKeys = (j: JobPostingItem) => {
      const compTitleKey = `${(j.company || "").trim().toLowerCase()}::${(j.title || "").trim().toLowerCase()}`;
      const urlKey = j.url ? j.url.trim().toLowerCase() : "";
      return { compTitleKey, urlKey };
    };

    // 1. Add incoming jobs, preserving applied status if candidate already marked it
    for (const job of incoming) {
      const { compTitleKey, urlKey } = getKeys(job);
      if (seenKeys.has(job.id) || seenKeys.has(compTitleKey) || (urlKey && seenKeys.has(urlKey))) {
        continue;
      }
      seenKeys.add(job.id);
      seenKeys.add(compTitleKey);
      if (urlKey) seenKeys.add(urlKey);

      const wasApplied =
        currentAppliedMap.has(job.id) ||
        currentAppliedKeys.has(compTitleKey) ||
        (urlKey ? currentAppliedKeys.has(urlKey) : false);

      const existingApplied = currentAppliedMap.get(job.id);

      result.push({
        ...job,
        isApplied: wasApplied || Boolean(job.isApplied),
        appliedAt: existingApplied?.appliedAt || job.appliedAt,
      });
    }

    // 2. Keep existing jobs that were not in incoming batch (including all applied jobs)
    for (const job of current) {
      const { compTitleKey, urlKey } = getKeys(job);
      if (seenKeys.has(job.id) || seenKeys.has(compTitleKey) || (urlKey && seenKeys.has(urlKey))) {
        continue;
      }
      seenKeys.add(job.id);
      seenKeys.add(compTitleKey);
      if (urlKey) seenKeys.add(urlKey);
      result.push(job);
    }

    return result;
  };

  // Search Google Jobs index (Indeed, LinkedIn, Shine, Lever, Jobrapido)
  const handleSearchGoogleJobs = async (customQuery?: string) => {
    const queryToUse = customQuery || googleQuery;
    setIsSearchingGoogle(true);
    setStatusFeedback({
      message: `Searching Google Jobs for "${queryToUse}"...`,
      type: "info",
    });

    try {
      const res = await fetch(`${getBackendUrl()}/api/jobs/google-search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ search_query: queryToUse }),
      });

      if (res.ok) {
        const liveGoogleJobs: JobPostingItem[] = await res.json();
        if (Array.isArray(liveGoogleJobs) && liveGoogleJobs.length > 0) {
          const merged = mergeJobsPreservingApplied(liveGoogleJobs, jobs);
          const newAdded = merged.length - jobs.length;
          updateJobs(merged);
          setIsGoogleModalOpen(false);
          setStatusFeedback({
            message: newAdded > 0 
              ? `Discovered ${newAdded} new Google Jobs! (Deduplicated repeats)`
              : `All ${liveGoogleJobs.length} Google Jobs already up to date in radar.`,
            type: "success",
          });
          setTimeout(() => setStatusFeedback(null), 5000);
        } else {
          setStatusFeedback({
            message: "No new Google Jobs found for this query.",
            type: "info",
          });
          setTimeout(() => setStatusFeedback(null), 4000);
        }
      } else {
        throw new Error(`Server returned ${res.status}`);
      }
    } catch (err) {
      console.error("Google jobs search error:", err);
      setStatusFeedback({
        message: "Google Jobs search failed. Please verify backend.",
        type: "error",
      });
      setTimeout(() => setStatusFeedback(null), 4000);
    } finally {
      setIsSearchingGoogle(false);
    }
  };

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

  // 1. Initial Load: Sync fresh jobs from backend in background without blocking UI
  useEffect(() => {
    fetchBackendJobs({ silent: true });
  }, []);

  // Fetch jobs from backend (FastAPI /api/jobs) with graceful abort handling
  const fetchBackendJobs = async ({ silent = false }: { silent?: boolean } = {}) => {
    setIsFetchingBackend(true);
    if (!silent) setStatusFeedback(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const baseUrl = getBackendUrl();
      // Fast fetch from backend database/cache + applied records
      const [res, appliedRes] = await Promise.all([
        fetch(`${baseUrl}/api/jobs`, { signal: controller.signal }),
        fetch(`${baseUrl}/api/jobs/applied`, { signal: controller.signal }).catch(() => null),
      ]);

      if (!res.ok) {
        throw new Error(`Backend responded with status ${res.status}`);
      }

      const liveData: JobPostingItem[] = await res.json();
      let appliedDbList: any[] = [];
      if (appliedRes && appliedRes.ok) {
        try {
          appliedDbList = await appliedRes.json();
        } catch {}
      }

      if (Array.isArray(liveData) && liveData.length > 0) {
        // Overlay any applied jobs stored in Supabase
        const appliedDbIds = new Set(appliedDbList.map((a: any) => a.job_id || a.id));
        const enrichedLiveData = liveData.map((job) => {
          if (appliedDbIds.has(job.id)) {
            const foundApplied = appliedDbList.find((a: any) => (a.job_id || a.id) === job.id);
            return {
              ...job,
              isApplied: true,
              appliedAt: foundApplied?.applied_at || job.appliedAt || new Date().toISOString(),
            };
          }
          return job;
        });

        // Merge with existing jobs while preserving applied status & removing any duplicate repeats
        const merged = mergeJobsPreservingApplied(enrichedLiveData, jobs);
        updateJobs(merged);
        if (!silent) {
          setStatusFeedback({
            message: `Synced ${merged.length} opportunities! (Deduplicated, applied preserved)`,
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
      // Gracefully ignore intentional abort cancellations
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      console.error("Fetch backend jobs error:", err);
      if (!silent) {
        setStatusFeedback({
          message: "Failed to connect to backend. Is FastAPI running on port 8000?",
          type: "error",
        });
      }
    } finally {
      clearTimeout(timeoutId);
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
      const res = await fetch(`${getBackendUrl()}/api/jobs?force_live=true`);
      if (res.ok) {
        const liveData = await res.json();
        if (Array.isArray(liveData) && liveData.length > 0) {
          const merged = mergeJobsPreservingApplied(liveData, jobs);
          const newAdded = merged.length - jobs.length;
          updateJobs(merged);
          setStatusFeedback({
            message: newAdded > 0 
              ? `Scanned ATS: added ${newAdded} new jobs! (Deduplicated)`
              : `Scanned ATS: all ${merged.length} jobs already current.`,
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
      const res = await fetch(`${getBackendUrl()}/api/jobs/scrape`, {
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
          // Merge with existing jobs (prevent duplicates & preserve applied status)
          const merged = mergeJobsPreservingApplied(scraped, jobs);
          const newAdded = merged.length - jobs.length;
          updateJobs(merged);
          setIsFirecrawlOpen(false);
          setStatusFeedback({
            message: newAdded > 0
              ? `Scraped ${newAdded} new unique jobs!`
              : `Scraped portals: all positions already up to date in radar.`,
            type: "success",
          });
          setTimeout(() => setStatusFeedback(null), 4000);
        }
      }
    } catch (err) {
      console.error("Firecrawl scrape error:", err);
      setStatusFeedback({
        message: "Scrape request failed. Please check Firecrawl API key.",
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

  // Toggle applied status for a job
  const handleToggleApply = async (jobId: string, isApplied: boolean) => {
    const updatedJobs = jobs.map((j) => {
      if (j.id === jobId) {
        return {
          ...j,
          isApplied,
          appliedAt: isApplied ? new Date().toISOString() : undefined,
        };
      }
      return j;
    });
    updateJobs(updatedJobs);

    if (selectedJob?.id === jobId) {
      setSelectedJob({
        ...selectedJob,
        isApplied,
        appliedAt: isApplied ? new Date().toISOString() : undefined,
      });
    }

    setStatusFeedback({
      message: isApplied ? "Moved to Applied Jobs ✓" : "Restored to Active Radar",
      type: "success",
    });
    setTimeout(() => setStatusFeedback(null), 3000);

    try {
      const baseUrl = getBackendUrl();
      const targetJob = jobs.find((j) => j.id === jobId);
      await fetch(`${baseUrl}/api/jobs/${jobId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApplied: isApplied, job: targetJob }),
      });
    } catch (err) {
      console.warn("Backend toggle apply status failed (persisted in localStorage):", err);
    }
  };

  const handleSelectJob = (job: JobPostingItem) => {
    setSelectedJob(job);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsMobileDetailOpen(true);
    }
  };

  const handleTailorResume = (jobDesc: string) => {
    setTargetTailorJD(jobDesc);
    setActiveTab("resume");
    setIsMobileDetailOpen(false);
  };

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full max-w-full overflow-hidden bg-[#080F18] text-[#F8F8F8] font-sans antialiased relative">
      {/* 1. Left Collapsible Sidebar with close button */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab === "resume" ? "resume" : feedTab === "applied" ? "applied" : "jobs"}
        appliedCount={appliedCount}
        onTabChange={(tab) => {
          if (tab === "applied") {
            setActiveTab("jobs");
            setFeedTab("applied");
          } else if (tab === "jobs") {
            setActiveTab("jobs");
            setFeedTab("radar");
          } else if (tab === "resume") {
            setActiveTab("resume");
          }
          setIsMobileDetailOpen(false);
        }}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Top Header with Sidebar Toggle Button */}
        <Header
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        />

        {/* Dynamic Body Pane */}
        <main className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden relative">
          {activeTab === "resume" ? (
            <div className="w-full flex-1 min-h-0 h-full overflow-hidden flex">
              <ResumeView
                onGoToJobFinder={() => {
                  setActiveTab("jobs");
                  setIsMobileDetailOpen(false);
                }}
                targetJobDescription={targetTailorJD}
                availableJobs={jobs}
                backendUrl={getBackendUrl()}
              />
            </div>
          ) : (
            <>
              {/* Center Feed: Visible on desktop always, or on mobile when detail pane is NOT active */}
              <div
                className={`flex-1 min-h-0 h-full overflow-hidden ${
                  isMobileDetailOpen ? "hidden md:flex" : "flex"
                }`}
              >
                <JobsFeed
                  jobs={jobs}
                  selectedJobId={selectedJob?.id || ""}
                  onSelectJob={handleSelectJob}
                  activeFilter={activePillFilter}
                  onFilterChange={setActivePillFilter}
                  onFetchJobs={() => fetchBackendJobs({ silent: false })}
                  isFetching={isFetchingBackend}
                  onScanLive={handleScanLive}
                  onOpenFirecrawl={() => setIsFirecrawlOpen(true)}
                  onOpenGoogleJobs={() => setIsGoogleModalOpen(true)}
                  isScanning={isScanning}
                  onClearLocalJobs={handleClearLocalJobs}
                  onToggleApply={handleToggleApply}
                  activeFeedTab={feedTab}
                  onFeedTabChange={setFeedTab}
                  backendUrl={getBackendUrl()}
                />
              </div>

              {/* Right Detail Pane: Visible on desktop always (or placeholder), and on mobile when a job is selected */}
              <div
                className={`
                  min-h-0 h-full overflow-hidden shrink-0 border-l border-[#1F293D] bg-[#080F18]
                  ${
                    isMobileDetailOpen
                      ? "fixed inset-0 z-40 flex flex-col w-full md:relative md:inset-auto md:z-auto md:flex md:w-[390px] lg:w-[430px] xl:w-[470px]"
                      : "hidden md:flex md:w-[390px] lg:w-[430px] xl:w-[470px]"
                  }
                `}
              >
                {selectedJob ? (
                  <JobDetailPane
                    job={selectedJob}
                    onTailorResume={handleTailorResume}
                    onBack={() => setIsMobileDetailOpen(false)}
                    onToggleApply={handleToggleApply}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-[#AAB4C5] space-y-3 bg-[#080F18]">
                    <div className="w-12 h-12 rounded-2xl bg-[#101828] border border-[#232B3B] flex items-center justify-center text-[#6366F1]">
                      <Sparkles size={20} />
                    </div>
                    <h3 className="font-extrabold text-sm text-[#F8F8F8]">No Job Selected</h3>
                    <p className="text-xs text-[#667085] leading-relaxed max-w-[260px]">
                      Fetch or select an opportunity from the radar to view AI match breakdown and tailor your resume.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </main>

        {/* 3. Mobile Bottom Navigation Bar */}
        <nav className="md:hidden h-14 border-t border-[#232B3B] bg-[#080820]/95 backdrop-blur-md flex items-center justify-around px-4 shrink-0 z-20">
          <button
            type="button"
            onClick={() => {
              setActiveTab("jobs");
              setIsMobileDetailOpen(false);
            }}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-4 rounded-xl transition-all cursor-pointer ${
              activeTab === "jobs"
                ? "text-[#6366F1] font-bold"
                : "text-[#AAB4C5] hover:text-[#F8F8F8]"
            }`}
          >
            <HomeIcon size={18} />
            <span className="text-[10px]">Jobs Radar</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("resume");
              setIsMobileDetailOpen(false);
            }}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-4 rounded-xl transition-all cursor-pointer ${
              activeTab === "resume"
                ? "text-[#6366F1] font-bold"
                : "text-[#AAB4C5] hover:text-[#F8F8F8]"
            }`}
          >
            <FileText size={18} />
            <span className="text-[10px]">My Resume</span>
          </button>
        </nav>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-[#101828] border border-[#232B3B] p-5 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl text-left max-h-[90vh] overflow-y-auto">
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

      {/* Google Jobs Discovery Modal */}
      {isGoogleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-[#101828] border border-[#232B3B] p-5 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4285F4]/20 via-[#EA4335]/20 to-[#34A853]/20 border border-[#4285F4]/30 text-[#4285F4] flex items-center justify-center font-bold">
                  <Search size={18} className="text-[#38BDF8]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-[#F8F8F8]">Google Jobs Radar</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#4285F4]/15 text-[#38BDF8] border border-[#4285F4]/30">
                      Live Index
                    </span>
                  </div>
                  <p className="text-xs text-[#AAB4C5]">Search Indeed, LinkedIn, Shine, Lever & Jobrapido via Google</p>
                </div>
              </div>
              <button
                onClick={() => setIsGoogleModalOpen(false)}
                className="p-1 rounded-lg text-[#AAB4C5] hover:text-[#F8F8F8] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#AAB4C5] font-semibold mb-1.5">
                  Target Search Query
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={googleQuery}
                    onChange={(e) => setGoogleQuery(e.target.value)}
                    placeholder="e.g. Gen AI Intern India, Epifi Product Builder, LLM Engineer"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#181F30] border border-[#232B3B] text-[#F8F8F8] placeholder-[#667085] focus:outline-hidden focus:border-[#38BDF8]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isSearchingGoogle) {
                        handleSearchGoogleJobs();
                      }
                    }}
                  />
                  <Search size={14} className="absolute left-3 top-3.5 text-[#667085]" />
                </div>
              </div>

              <div>
                <label className="block text-[#667085] text-[11px] font-semibold uppercase tracking-wider mb-2">
                  Quick High-Match Presets
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Gen AI Intern India",
                    "GenAI Product Builder Intern Bengaluru",
                    "AI Engineer GenAI Applications India",
                    "LangGraph Multi-Agent Remote",
                    "Python FastAPI GenAI India",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setGoogleQuery(preset);
                        handleSearchGoogleJobs(preset);
                      }}
                      disabled={isSearchingGoogle}
                      className="px-2.5 py-1.5 rounded-lg bg-[#181F30] hover:bg-[#1E293B] border border-[#232B3B] hover:border-[#38BDF8]/40 text-[#E0E7FF] text-[11px] font-medium transition-all cursor-pointer disabled:opacity-50 text-left"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#080F18] border border-[#1E293B] text-[11px] text-[#94A3B8] leading-relaxed">
                💡 <span className="font-semibold text-[#E2E8F0]">Direct Postings:</span> Filters specifically for roles open to Indian engineers or worldwide remote, extracting authentic job links from Greenhouse, Lever, Ashby, Indeed & LinkedIn.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setIsGoogleModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#181F30] border border-[#232B3B] text-[#AAB4C5] hover:text-[#F8F8F8] font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSearchGoogleJobs()}
                disabled={isSearchingGoogle || !googleQuery.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#4F46E5] hover:from-[#1D4ED8] hover:to-[#4338CA] text-white font-bold text-xs transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                {isSearchingGoogle ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                <span>{isSearchingGoogle ? "Searching Google Jobs..." : "Search & Ingest"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
