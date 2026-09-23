# 🎯 JobRadar — Autonomous AI Job Discovery & Resume Tailoring

A modern, full-stack **Autonomous AI Job Discovery Radar & Real-Time Resume Tailoring Platform**. Combines autonomous ATS web scrapers (Greenhouse, Lever, Ashby, Workday) with an interactive Next.js resume workspace and LLM-powered resume tailoring (Groq LPUs & Google Gemini).

---

## 🚀 Architecture Overview

- **Frontend (`frontend/`)**: Next.js 16 (Turbopack), React 19, TailwindCSS v4, Lucide Icons, Framer Motion.
  - Interactive live-editable Resume Document.
  - Structured Resume Editor Modal with local storage persistence.
  - ATS Keyword Matcher comparing user skills against job requirements.
  - Live Jobs Radar feed with priority sorting, tech stack tags, and search/filters.
- **Backend (`backend/`)**: FastAPI, Python 3.12, SQLite database (`jobs_radar.db`), LangGraph agentic workflows.
  - Automated ATS board scrapers & Firecrawl integrations.
  - Real-time job ingestion, deduplication, and keyword relevance scoring.

---

## 🛠️ Quick Start

### 1. Install & Run Frontend
From the root directory:
```bash
# Start Next.js frontend dev server (runs on http://localhost:3000)
pnpm dev
```

Or build for production:
```bash
pnpm build
```

### 2. Run Backend
In a separate terminal:
```bash
# Start FastAPI backend (runs on http://localhost:8000)
pnpm backend
```
*(Requires Python 3.12+ and `uv`)*

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` in the root / backend directory:

```env
# AI Models (Groq LPUs & Google Gemini)
GROQ_API_KEY=gsk_your_groq_key_here
GEMINI_API_KEY=AIzaSy_your_gemini_key_here

# Optional: Firecrawl API Key for web scraping
FIRECRAWL_API_KEY=fc_your_firecrawl_key_here
```

---

## 📄 License

MIT License. Developed by **Sohail Islam** ([heysohail22](https://github.com/heysohail22)).
