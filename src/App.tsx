import { useState, useRef, useEffect, useCallback } from "react";
import { resumeData } from "./resumeData";
import type { ResumeDataType } from "./resumeData";
import { ALL_AI_MODELS, tailorResumeWithAI } from "./aiTailor";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { ResumeDocument } from "./components/ResumeDocument";
import type { SpacingConfig } from "./components/SpacingControls";

export function App() {
  const [activeTab, setActiveTab] = useState<"ai" | "edit" | "jobs">("jobs");

  // Sidebar toggle state
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("resume_sidebar_open");
      if (saved !== null) return JSON.parse(saved);
      return window.innerWidth >= 1280;
    } catch {
      return true;
    }
  });

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("resume_sidebar_open", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Keyboard shortcut Ctrl+B / Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  // Master Resume State
  const [activeResume, setActiveResume] = useState<ResumeDataType>(() => {
    try {
      const isCustomized = localStorage.getItem("resume_is_customized");
      if (isCustomized === "true") {
        const saved = localStorage.getItem("saved_resume_data");
        if (saved) {
          const parsed = JSON.parse(saved);
          const hasOldProjects = parsed.projects?.some(
            (p: { name: string; demoUrl?: string }) =>
              p.name?.toLowerCase().includes("docmatch") || p.name?.includes("Kraya") || p.demoUrl?.includes("3000") || p.demoUrl?.includes("docmatch")
          );
          if (hasOldProjects) {
            localStorage.removeItem("saved_resume_data");
            localStorage.removeItem("resume_is_customized");
            return resumeData;
          }
          if (parsed?.name && parsed?.contact && parsed?.skills && parsed?.projects) {
            return parsed;
          }
        }
      }
    } catch {
      // fallback
    }
    return resumeData;
  });

  // Dynamic Spacing Configuration
  const [spacing, setSpacing] = useState<SpacingConfig>({
    fontSize: 12,
    lineHeight: 1.45,
    sectionGap: 8,
    projectGap: 6,
    paddingX: 36,
    paddingY: 28,
  });

  // AI Tailoring State
  const [selectedModel, setSelectedModel] = useState<string>(ALL_AI_MODELS[0].id);
  const [jobDescription, setJobDescription] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isTailored, setIsTailored] = useState<boolean>(false);
  const [tailoredRole, setTailoredRole] = useState<string>("");

  // API Keys & Job Bookmarks State
  const [userGroqKey, setUserGroqKey] = useState<string>(() => {
    return localStorage.getItem("groq_api_key") || "";
  });
  const [userGeminiKey, setUserGeminiKey] = useState<string>(() => {
    return localStorage.getItem("gemini_api_key") || "";
  });
  const [userFirecrawlKey, setUserFirecrawlKey] = useState<string>(() => {
    return localStorage.getItem("firecrawl_api_key") || import.meta.env.VITE_FIRECRAWL_API_KEY || "fc-f4adcf4a4f86405689ff0e21f69a54ea";
  });
  const [savedBookmarkIds, setSavedBookmarkIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("saved_job_bookmarks");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const hasEnvGroq = Boolean(import.meta.env.VITE_GROQ_API_KEY);
  const hasEnvGemini = Boolean(import.meta.env.VITE_GEMINI_API_KEY);

  const handleSaveGroqKey = (key: string) => {
    setUserGroqKey(key);
    localStorage.setItem("groq_api_key", key);
  };

  const handleSaveGeminiKey = (key: string) => {
    setUserGeminiKey(key);
    localStorage.setItem("gemini_api_key", key);
  };

  const handleSaveFirecrawlKey = (key: string) => {
    setUserFirecrawlKey(key);
    localStorage.setItem("firecrawl_api_key", key);
  };

  const handleToggleBookmark = (jobId: string) => {
    setSavedBookmarkIds((prev) => {
      const next = prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId];
      try {
        localStorage.setItem("saved_job_bookmarks", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleSelectJobForTailoring = (jd: string) => {
    setJobDescription(jd);
    setActiveTab("ai");
    setIsSidebarOpen(true);
  };

  // Sync Master Resume with LocalStorage
  const updateResume = (newResume: ResumeDataType) => {
    setActiveResume(newResume);
    try {
      localStorage.setItem("resume_is_customized", "true");
      localStorage.setItem("saved_resume_data", JSON.stringify(newResume));
    } catch {
      // ignore
    }
  };

  // Reset to Default Resume Data
  const handleResetResume = () => {
    setActiveResume(resumeData);
    setIsTailored(false);
    setErrorMsg(null);
    try {
      localStorage.removeItem("saved_resume_data");
      localStorage.removeItem("saved_resume_version");
      localStorage.removeItem("resume_is_customized");
    } catch {
      // ignore
    }
  };

  // Run AI Tailoring
  const handleRunAiTailor = async () => {
    if (!jobDescription.trim()) {
      setErrorMsg("Please paste a job description first.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const tailored = await tailorResumeWithAI(
        jobDescription,
        selectedModel,
        userGroqKey,
        userGeminiKey,
        activeResume
      );

      const mergedResume: ResumeDataType = {
        ...activeResume,
        title: tailored.title || activeResume.title,
        summary: tailored.summary || activeResume.summary,
        skills:
          tailored.skills && tailored.skills.length > 0
            ? tailored.skills.map((s, idx) => ({
                category: s.category || activeResume.skills[idx]?.category || "Technical Skills",
                items: s.items || activeResume.skills[idx]?.items || [],
              }))
            : activeResume.skills,
        projects:
          tailored.projects && tailored.projects.length > 0
            ? tailored.projects.map((p, idx) => ({
                ...activeResume.projects[idx],
                name: p.name || activeResume.projects[idx]?.name || "",
                subtitle: p.subtitle || activeResume.projects[idx]?.subtitle || "",
                tech: p.tech || activeResume.projects[idx]?.tech || [],
                bullets: p.bullets || activeResume.projects[idx]?.bullets || [],
              }))
            : activeResume.projects,
      };

      updateResume(mergedResume);
      setIsTailored(true);
      setTailoredRole(tailored.targetRole || tailored.title || "Target Position");
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(
        err instanceof Error ? err.message : "Tailoring failed. Please check your API key and connection."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Inline Click-to-Edit Blur Handler
  const handleEditableBlur = (fieldPath: string, newValue: string) => {
    const updated = JSON.parse(JSON.stringify(activeResume)) as ResumeDataType;
    const cleanText = newValue.trim();

    if (fieldPath === "name") updated.name = cleanText;
    else if (fieldPath === "title") updated.title = cleanText;
    else if (fieldPath === "summary") updated.summary = cleanText;
    else if (fieldPath === "contact.email") updated.contact.email = cleanText;
    else if (fieldPath === "contact.phone") updated.contact.phone = cleanText;
    else if (fieldPath === "contact.location") updated.contact.location = cleanText;
    else if (fieldPath === "contact.linkedin") updated.contact.linkedin = cleanText;
    else if (fieldPath === "contact.github") updated.contact.github = cleanText;
    else if (fieldPath.startsWith("skillCat.")) {
      const idx = parseInt(fieldPath.split(".")[1], 10);
      if (updated.skills[idx]) updated.skills[idx].category = cleanText;
    } else if (fieldPath.startsWith("skillItems.")) {
      const idx = parseInt(fieldPath.split(".")[1], 10);
      if (updated.skills[idx]) {
        updated.skills[idx].items = cleanText.split(",").map((i) => i.trim());
      }
    } else if (fieldPath.startsWith("projName.")) {
      const idx = parseInt(fieldPath.split(".")[1], 10);
      if (updated.projects[idx]) updated.projects[idx].name = cleanText;
    } else if (fieldPath.startsWith("projSubtitle.")) {
      const idx = parseInt(fieldPath.split(".")[1], 10);
      if (updated.projects[idx]) updated.projects[idx].subtitle = cleanText;
    } else if (fieldPath.startsWith("projTech.")) {
      const idx = parseInt(fieldPath.split(".")[1], 10);
      if (updated.projects[idx]) {
        updated.projects[idx].tech = cleanText.split(",").map((t) => t.trim());
      }
    } else if (fieldPath.startsWith("projBullet.")) {
      const [, pIdx, bIdx] = fieldPath.split(".");
      const projectIdx = parseInt(pIdx, 10);
      const bulletIdx = parseInt(bIdx, 10);
      if (updated.projects[projectIdx]?.bullets[bulletIdx] !== undefined) {
        updated.projects[projectIdx].bullets[bulletIdx] = cleanText;
      }
    } else if (fieldPath === "edu.degree") updated.education.degree = cleanText;
    else if (fieldPath === "edu.institution") updated.education.institution = cleanText;
    else if (fieldPath === "edu.duration") updated.education.duration = cleanText;
    else if (fieldPath === "edu.location") updated.education.location = cleanText;
    else if (fieldPath === "edu.cgpa") updated.education.cgpa = cleanText;

    updateResume(updated);
  };

  const resumeRef = useRef<HTMLDivElement>(null);

  // Trigger Print to PDF
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-zinc-100/70 flex flex-col font-sans antialiased text-zinc-900 selection:bg-zinc-800 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
        spacing={spacing}
        onUpdateSpacing={setSpacing}
        onResetResume={handleResetResume}
        onPrint={handlePrint}
      />

      {/* Main Layout Area */}
      <div className="w-full max-w-[1700px] mx-auto px-2 sm:px-4 my-4 sm:my-6 flex items-start justify-center gap-6 relative print:m-0 print:p-0 print:block">
        {/* Toggleable Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          userGroqKey={userGroqKey}
          onSaveGroqKey={handleSaveGroqKey}
          userGeminiKey={userGeminiKey}
          onSaveGeminiKey={handleSaveGeminiKey}
          userFirecrawlKey={userFirecrawlKey}
          onSaveFirecrawlKey={handleSaveFirecrawlKey}
          hasEnvGroq={hasEnvGroq}
          hasEnvGemini={hasEnvGemini}
          jobDescription={jobDescription}
          onChangeJobDescription={setJobDescription}
          isLoading={isLoading}
          isTailored={isTailored}
          tailoredRole={tailoredRole}
          errorMsg={errorMsg}
          onRunAiTailor={handleRunAiTailor}
          onResetResume={handleResetResume}
          resume={activeResume}
          onChangeResume={updateResume}
          onSelectJobForTailoring={handleSelectJobForTailoring}
          savedBookmarkIds={savedBookmarkIds}
          onToggleBookmark={handleToggleBookmark}
        />

        {/* Live Resume Preview Document */}
        <main className="flex-1 flex justify-center w-full min-w-0 transition-all duration-300">
          <ResumeDocument
            resume={activeResume}
            spacing={spacing}
            onEditableBlur={handleEditableBlur}
            resumeRef={resumeRef}
          />
        </main>
      </div>
    </div>
  );
}

export default App;

