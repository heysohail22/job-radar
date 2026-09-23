# AGENTS.md — JobRadar Workspace Guide

This file is a living guide for AI coding agents working on this project. Update it whenever the build tooling, architecture, or conventions change.

---

## Project Overview

**JobRadar** is an autonomous AI job discovery radar and real-time ATS resume tailoring platform.

Core capabilities:
- **Autonomous Job Discovery**: Backend crawls ATS platforms (Greenhouse, Lever, Ashby, Workday) and Firecrawl sources to discover high-match technical/GenAI roles.
- **ATS Keyword Matching**: Real-time evaluation of candidate resume vs. target job descriptions with keyword alignment metrics.
- **Interactive Resume Workspace**: Next.js-based live editable resume document and modal editor.
- **Supabase Cloud Persistence**: Supabase is the single source of truth for jobs, applied tracking, and deletions (zero reliance on client-side localStorage).

---

## Architecture & Directory Layout

```
job-radar/
├── frontend/               # Next.js 16 (Turbopack) + React 19 + TailwindCSS v4
│   ├── app/                # App Router (layout.tsx, page.tsx, globals.css)
│   ├── components/         # UI Components (JobsFeed, ResumeDocument, ResumeEditorModal, etc.)
│   ├── lib/                # Types, resume data models, utilities
│   ├── public/             # Static assets (favicons, icons)
│   └── package.json        # Frontend dependencies and Next.js scripts
├── backend/                # FastAPI + Python 3.12 + SQLite + LangGraph
│   ├── data/               # Startup ATS target registries
│   ├── graphs/             # LangGraph agentic workflows (job_radar_graph, resume_tailor_graph)
│   ├── routes/             # FastAPI endpoints
│   ├── services/           # ats_scraper, firecrawl_service
│   ├── db.py               # SQLite storage and session management
│   └── main.py             # FastAPI entry point
└── package.json            # Monorepo runner scripts (pnpm dev, pnpm build, pnpm backend)
```

---

## Build and Development Commands

All frontend operations use `pnpm`:

```bash
# Start frontend dev server
pnpm dev

# Build frontend for production
pnpm build

# Start FastAPI backend server
pnpm backend
```
