# Automatic job discovery

Local TypeScript/LangGraph workflow using LangChain model adapters. It discovers
employers automatically; no company watchlist is required from the owner.

## Configure and run

Edit the ignored collector/.env. Revoke credentials previously shared in chat and
enter replacements locally. Required: TAVILY_API_KEY plus GROQ_API_KEY or
GEMINI_API_KEY. Firecrawl is optional. Existing Supabase server credentials have
been copied privately where available. Never put secrets in EXPO_PUBLIC_ or
NEXT_PUBLIC_ values.

```sh
pnpm collect:preview
pnpm collect
```

Preview stores private operational candidates/checkpoints, but does not publish
jobs or matches. Write mode requires OLD_COLLECTOR_DISABLED=true. The previous
Supabase schedule must be paused before enabling writes. A failed run prints its
ID; resume with `pnpm --dir collector start -- --resume RUN_ID --preview` or
`pnpm --dir collector start -- --resume RUN_ID --write`. If pnpm forwards a literal
`--`, it is harmless; the CLI recognizes the following flags. Resume in the same
mode as the original run. A run lease prevents concurrent execution; after a hard
crash it expires in two hours.

Groq GPT-OSS 120B is the default analysis model. Gemini is the configured fallback;
model IDs are configurable and account availability/quota must be verified. No
OpenRouter or NVIDIA trial is silently enabled. Model failures defer candidates,
not reject them. No LLM receives database tools or secrets.

## Data flow

Profile → query planning → Tavily + feeds + discovered employer boards → URL
deduplication → full-description extraction → structured analysis → evidence
validation → deterministic scoring → Supabase → website/mobile.

Queries rotate through all role families in src/profile.ts, with eight reserved
coverage queries and up to twelve model-proposed queries. Searches include skills,
roles, deliverables and varied employment types. Known Greenhouse/Lever/Ashby
boards are discovered from results and monitored. Remotive and We Work Remotely
feeds supplement search. Failed sources are recorded; failures never close jobs.

Extraction order: employer API, public HTTP/JobPosting JSON-LD/HTML, optional
Playwright, optional Firecrawl Markdown fallback. Robots rules are checked for
candidate pages. Size/time/redirect limits and pinned DNS validation reject
private/local destinations, including redirects. Playwright requests go through
the same guarded fetcher; WebSockets and service workers are blocked.
To enable browser extraction, install Chromium with
`pnpm --dir collector exec playwright install chromium` and set ENABLE_BROWSER=true.
It is disabled by default to conserve local memory.

The source text must look like a full description. Incomplete pages remain queued.
Exact duplicate URLs (after tracking-parameter removal) are deduplicated; redirect
aliases converge when they resolve to the same employer URL. Ambiguous jobs with
similar titles remain separate rather than merging distinct openings incorrectly.

## Matching

Approved profile: fresher, BCA, India; AI/LLM applications, Python/backend, RAG,
automation, integrations, voice/chat, graduate/trainee/intern/evaluation roles.
Full-time, contract, freelance, part-time and paid internships are included.
Remote-from-India is preferred; onsite/hybrid India remains eligible.

Skills = 60%, responsibility fit = 25%, experience fit = 15%. No project score.
For skill/role requirements: required weight 2, preferred weight 1; matched earns
1, transferable 0.5, missing/unknown 0. Experience earns 100 entry, 75 preferred
experience gap, 40 stretch, 0 senior, 50 unknown. Total is rounded to an integer.
Matched/transferable items must cite an approved profile skill and exact JD quote.
Eligibility and experience assertions require supporting quotes.

Score >=60 with no known blockers enters the shortlist. Unknown India eligibility,
unknown required-skill fit, or unclear internship compensation needs checking.
Known blockers, explicitly unpaid work, closed jobs and mandatory >3 years are
outside the shortlist. Relevant <=3-year requirements may be stretch opportunities.
These are profile-fit scores, not hiring probabilities. Calibrate against about 30
real descriptions before treating ranking as reliable; this remains pending fresh keys.

Existing published jobs are refreshed even if they lose shortlist eligibility;
saved/applied records remain accessible. Applied status and bookmarks survive
re-ingestion. Private rejected/deferred candidates expire after 90 inactive days;
listings, bookmarks and application tracking are never purged by that cleanup.

## Budgets, persistence and scheduling

Tavily defaults: 20 Basic searches/day, 900 credits/month. Firecrawl defaults:
20 basic fallback pages/day, 900 credits/month. Search/extraction budgets are
reserved atomically before calls, including failed attempts conservatively. No
paid overages. Limits are checked in UTC, matching a stable server-side boundary.
Missing LLM quota queues the remaining candidates. Default maximum is 100
processed candidates/run, sequentially to keep memory and provider load bounded.
Completed candidates are revisited after three days; extraction failures after one.
Descriptions are hashed so unchanged content/profile can reuse validated analysis.

LangGraph checkpoints, source registry, runs and candidates are private Supabase
records. The pinned MemorySaver byte storage is serialized into collector_runs;
a restart test verifies restored execution does not repeat successful nodes.

A user systemd service/timer template is supplied for 09:00 Asia/Kolkata with
persistent catch-up. It is not enabled while replacement keys are missing.
Use `pnpm --dir collector schedule:install` once preview succeeds. This installs
only the user's timer, with the current Node/pnpm path, and never deploys anything.
Inspect `systemctl --user status job-radar-collector.timer` and
`journalctl --user -u job-radar-collector.service`. Computer must be online.

The owner-only website /review page shows recent runs, candidate scores and
reasons. Native job browsing/tracking uses the same backend once signed in.
