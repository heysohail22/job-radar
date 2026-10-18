# Unified Python backend

Deploy **this folder only** as one continuously running service. FastAPI serves
website/mobile requests while a background LangGraph workflow discovers and scores
jobs. Everything uses the existing Supabase project; no Firebase, Redis, SQLite,
second database, Node runtime, or separately deployed collector is needed.

## Local use

Install [uv](https://docs.astral.sh/uv/getting-started/installation/), then from the
repository root:

```sh
uv sync --project backend --frozen
pnpm backend
```

Or run `uv run --directory backend --frozen python -m job_radar` directly.
Copy `.env.example` to ignored `backend/.env` when configuring a new machine.
Existing local configuration was consolidated from the previous collector and API;
never copy keys from chat. Process environment variables override this file.

Local mode is `AUTH_MODE=local`, `HOST=127.0.0.1`, port 3001. The mobile app uses
ADB reverse forwarding; the website uses `BACKEND_URL=http://127.0.0.1:3001`.
The server validates loopback peer, Host and browser origin. It does not trust
forwarded headers. Do not expose local mode publicly.

## One cloud service (owner deploys later)

Use this directory as the build context. The included Dockerfile installs hashed,
locked requirements and starts `python -m job_radar` as an unprivileged user.
For a Python-native host, install Python 3.12 dependencies with
`pip install --require-hashes -r requirements.txt`, then start `python -m job_radar`.
No deployment or hosting configuration has been performed.

Set all secrets in that service's environment settings, not in source:

- `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, existing `OWNER_USER_ID`.
- `AUTH_MODE=owner`, `HOST=0.0.0.0`; the host supplies `PORT`.
- `WEBSITE_ORIGINS` as a comma-separated list of exact allowed website origins.
- `TAVILY_API_KEY` and either `GEMINI_API_KEY` or `GROQ_API_KEY`.
- Optional `FIRECRAWL_API_KEY`, used only after free extraction fails.
- `COLLECTOR_ENABLED=true`, `OLD_COLLECTOR_DISABLED=true` once the old collector
  is stopped. `COLLECTOR_WRITE=true` publishes shortlisted jobs; false previews.
- Schedule and budgets from `.env.example`. Default: 09:00 Asia/Kolkata.

Use **one worker/process and one service instance**. Collection runs in a worker
thread so API requests remain available. A Supabase lease also prevents overlap
with other collector processes. Use a host that stays awake: a sleeping service
cannot execute its schedule. There is no separate cron service to deploy.

After hosting, set website `BACKEND_URL=https://<your-api-host>` and
`AUTH_MODE=owner`. Set mobile `EXPO_PUBLIC_API_URL` to that HTTPS origin and
`EXPO_PUBLIC_AUTH_MODE=owner`, then rebuild/install it. Existing owner sign-in
and SecureStore support are retained. The current APK still uses localhost until
rebuilt with your real hosted address. No Supabase secret belongs in either client.

## Discovery and recovery

```text
schedule / authenticated API request
  → plan (LangChain Gemini/Groq + rotating role queries)
  → discover (Tavily, Remotive, WWR, learned employer boards)
  → process one job → full JD → evidence validation → score → Supabase
                       ↖ repeat until run limit ↵
```

Employer APIs: Greenhouse, Lever and Ashby. Extraction: API → JSON-LD/HTML →
optional Playwright Chromium → optional Firecrawl. Set `ENABLE_BROWSER=true` to
use browser rendering. The Dockerfile installs the matching headless Chromium
and OS dependencies. For a native Python host or local machine, run
`uv run --directory backend python -m playwright install --with-deps --only-shell chromium`
first (OS dependencies may require sudo). Browser failure safely falls through
to Firecrawl or leaves the candidate deferred. Robots rules, public-only
DNS resolution at connection time, redirect validation, response limits, request
timeouts and per-host pacing apply to direct extraction. JD content is untrusted
model input; the model receives no credentials or tools.

Skills 60%, role 25%, experience 15%; no project-evidence scoring. Mandatory
restrictions reject a role; unclear eligibility remains reviewable. Credit
reservations are atomic in Supabase and failed calls count toward budgets.

LangGraph checkpoints persist in the existing private `collector_runs.checkpoint`
column, including pending writes. Only bounded JSON state is stored, never pickle.
Each candidate is its own graph step. Interrupted Python runs resume automatically
on service startup when scheduling is enabled; expired leases may delay recovery
up to two hours after an abrupt kill. A graceful shutdown releases the lease.
Legacy Node/V8 checkpoints are preserved but cannot resume in Python.

Candidates and analysis are reused for three days; changed JDs are rescored.
Ingestion preserves exact match IDs, first-seen timestamps, bookmarks and application
status. Cached preview shortlists can be published by a subsequent write run.

Manual CLI (scheduler need not be enabled):

```sh
pnpm collect:preview
pnpm collect
uv run --directory backend python -m job_radar.cli --resume <python-run-uuid> --write
```

Authenticated API: `POST /api/collector/runs` with `{"write":true}` or
`{"write":false,"resumeRunId":"<python-run-uuid>"}` returns HTTP 202 and a run ID.
Use `GET /api/runs` and `/api/candidates` to follow progress. Local mode allows
these only over loopback. Private endpoints require an owner Supabase access token
in public mode. Opening an employer application page never marks a job Applied;
that remains an explicit tracking action.

## Verification

```sh
uv run --directory backend pytest
uv run --directory backend ruff check job_radar tests_python
```

Existing `database/*.sql` records already-applied Supabase schema/functions. No
new database or migration is needed for this Python conversion. The SQL is part
of Supabase, not another storage service. Keep the paused legacy Supabase cron
and old systemd collector timer disabled. Do not run both collectors.

## This machine after migration

The unified `job-radar-backend.service` is enabled under the user session. It runs
the loopback API and scheduler together; the old collector timer is disabled.
Use `systemctl --user restart job-radar-backend.service` after backend source or
configuration changes. Do not also run `pnpm backend` while this service is active.
For a fresh local installation, `pnpm backend:install-service` installs the service;
configure `backend/.env` first. This is local process management, not cloud hosting.

Browser extraction uses one Chromium instance/page at a time and a 35-second
render deadline, a 60-request/10 MB traffic budget and a 2 MB rendered-page cap.
All browser HTTP requests use the DNS-validated public fetcher; only GET requests
for documents/scripts/XHR/fetch are allowed. WebSockets, service workers, child
frames, popups, downloads and form submissions are blocked. Chromium's sandbox
remains enabled. A host that prohibits Chromium's OS sandbox will fall back to
Firecrawl; do not disable the sandbox to work around that restriction.

Real offline browser integration verification (requires Chromium):
`RUN_BROWSER_TESTS=1 uv run --directory backend pytest tests_python/test_browser.py`.
