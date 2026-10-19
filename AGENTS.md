# AGENTS.md — AI Job Radar

## Current phase: website and mobile implementation

The owner requested a fresh start and then authorized implementation from `.codex/SPEC.md`, the Figma design, and the MagicPath prototype on 14 October 2026. The old application was removed.

Read `.codex/SPEC.md` before work. Its original review-only gate has now been satisfied by the owner's build instruction. The owner subsequently authorized a React Native mobile app in `mobile/`, including dark mode. Continue within the scope below. The owner initially declined starting the local development server, then authorized phone installation on 15 October 2026. The local website API and mobile Metro server were started with command approval for that installation. Keep these servers localhost-only.

## Scope

Build a personal, responsive job discovery website using the existing `ai-job-radar` Supabase project. Desktop and phone browsers use one website and codebase. The native mobile app uses Expo SDK 57 and React Native in `mobile/`, with a separate package in the pnpm workspace.

Version one includes Discover, job details, Saved Jobs, and Applications. It reads existing jobs and matching scores, supports search and filters, and persists bookmarks and application progress in Supabase.

Do not add Auth, login, registration, user onboarding, a crawler, resume editing/tailoring, AI chat, or a second database. The existing external daily collection process remains independent. This is one shared personal workspace.

## Owner-controlled actions

- Do not push to GitHub, create pull requests, configure remotes, or publish source.
- Do not deploy, configure hosting, connect domains, or perform Vercel operations.
- The owner handles publishing and hosting separately.
- Do not automatically apply for jobs. Opening an employer page and marking a role applied are separate user actions.

## Architecture

The website in `website/` uses Next.js App Router, React, TypeScript, Tailwind CSS, locally packaged Inter fonts, and pnpm. Supabase access is confined to `website/lib/server/` and Next.js route handlers. The mobile app calls the loopback API using ADB port reversal over a paired USB/wireless debugging connection on Android or an iOS simulator; it never bundles Supabase credentials. No LAN/internet access to privileged endpoints is added. Theme preference alone may be stored in mobile AsyncStorage. There is no FastAPI or SQLite service. Website linting uses the supported ESLint 9 / TypeScript 5.9 combination; mobile type checking uses Expo SDK 57’s recommended TypeScript 6.0.3; dependencies are pinned in package.json and pnpm-lock.yaml.

Dev and production builds explicitly use Webpack because Turbopack's PostCSS worker needs a port disallowed by this environment. `experimental.useTypeScriptCli: false` uses Next.js's supported TypeScript compiler-API integration; type checking is enabled, not skipped.

Website-owned state is stored in `public.job_workspace_state`, keyed by the exact matching-record ID. This is a deliberate refinement of the spec's proposed bookmark column: external collector upsert code is not available here, so isolation preserves both bookmarks and application stages without changing collector-owned rows. `website/database/workspace.sql` records the idempotent schema, server-only read RPC, and atomic revision-checked mutation RPC applied to the existing project. RLS is enabled and anonymous/authenticated RPC execution is revoked.

`website/components/website.tsx` contains the interactive views. Pages delegate initial queries to `website/components/website-page.tsx`. Filters/sort/pagination live in the URL. The server RPC filters and sorts before pagination. UI mutation success refreshes server data; stale revisions return a conflict rather than overwriting another tab.

Verify supported package versions against current official documentation when implementing. Pin dependencies and keep a pnpm lockfile. Do not assume versions from the deleted application are requirements.

Supabase is authoritative. Do not persist saved jobs, application status, or authoritative job data in localStorage or IndexedDB. Temporary in-memory UI state and bounded server caching are acceptable, with invalidation after writes.

Use server-only modules and environment variables for privileged database credentials. Never expose a secret/service-role key through `NEXT_PUBLIC_`, browser code, documentation, logs, or versioned files.

No Auth means local personal use initially. Do not expose unauthenticated privileged mutation endpoints publicly. Public-access decisions are outside this scope.

## Design references

- Figma: https://www.figma.com/design/zzzVHhneAYBLrXVqIvnmSw
- Desktop: Discover `1:518`; job details `1:617`; Applications `1:672`.
- Phone: Discover `1:712`; job details `1:768`; Applications `1:805`; Saved Jobs `1:830`.
- MagicPath project: `461166504738693120`.
- MagicPath component: `461166553119989760`; generated name `happy-stream-2269`.

Follow the improved desktop and phone designs. MagicPath is an interaction reference, not production persistence: its changes reset on refresh. Reuse prototype code selectively after review.

## Implementation conventions

- Follow the ordered phases and acceptance checks in `.codex/SPEC.md`.
- Use pnpm for all website operations and follow current framework documentation.
- Load relevant Supabase/Figma skills before working with those services.
- Inspect the current schema, policies, active profile versions, and collector upsert behavior before writing database code.
- Preserve collector ownership of job listings and scores. User actions modify only the exact matching/tracking record.
- Keep independent bookmark state separate from application status. Saving must never erase applied/interview/offer progress.
- Treat imported descriptions as untrusted text and validate external application URLs.
- Never invent salary periods, match breakdowns, official company logos, application history, or missing job descriptions.
- Build reusable components, semantic HTML, visible focus, accessible dialogs, and comfortably sized touch controls.
- Verify meaningful behavior and database persistence; avoid trivial implementation-mirroring tests.
- Update this guide when approved tooling, architecture, or conventions change.

## Local commands

Run from the repository root:

```text
pnpm dev        local website, bound to localhost
pnpm lint       lint
pnpm typecheck  TypeScript verification
pnpm test       focused behavioral tests
pnpm build      local production build validation
```

Use `pnpm format` to format source. `pnpm check:db` performs read-only Supabase connection checks using ignored `website/.env.local`. Browser verification requires permission to start the local server; never claim it has been performed when only tests/build passed.

Mobile commands: `pnpm --dir mobile start`, `pnpm --dir mobile typecheck`, and `pnpm --dir mobile export`. Export verifies JavaScript/assets for Android and iOS and does not publish or start the website server.

The owner requested the website be grouped into `website/`. Root package scripts forward website operations; workspace lint covers both applications. Website code, config, assets, SQL, tests and server environment files live under `website/`. Root `AGENTS.md`, `.codex/`, README, ESLint workspace configuration, package manifest and pnpm lock/workspace files remain repository-level. Mobile currently imports only pure types/URL validation from `website/lib/`; never import its server modules into mobile.

Website appearance and sidebar preferences may be stored in localStorage (`jobradar-theme` and `jobradar-sidebar`); authoritative jobs, bookmarks and application progress must still remain in Supabase. The website provides system/light/dark appearance and a desktop sidebar collapse/reopen control.

For local Android APK builds on this ~7 GB RAM machine, use `pnpm --dir mobile build:android`. It limits Gradle and native compilation concurrency and heap usage. Avoid running website/Metro servers during native compilation. The JDK under `.local-tools/` is ignored and must never be published.

For phone APK updates, increment Expo `version` and Android `versionCode`, use a versioned APK filename, and verify the installed version or APK digest through ADB. File Manager’s INSTALLED label and an owner confirmation alone do not establish that the new binary replaced the old one. Keep prior APKs as backups rather than uninstalling the app or deleting its data.

For the personal installed Android app, use `pnpm --dir mobile build:android:lite` to build an optimized arm64 release variant with embedded Hermes JavaScript/assets, R8 and resource shrinking. It is locally signed with the existing development certificate for in-place personal updates; no publishing is performed. This removes the Metro startup dependency, while jobs still require the localhost API over paired ADB. The `with-local-api` Expo plugin allows cleartext HTTP only to loopback hosts; never broaden it to LAN/public hosts. Keep Metro/website servers stopped during native builds.

## Approved public mobile browsing — 16 October 2026

The owner authorized no-login, direct Supabase listing reads from mobile. Discover and public job details call the HTTPS `job_radar_public_feed` security-invoker RPC using a publishable key. `website/database/mobile-public.sql` records the applied column grants and SELECT-only RLS policy. Only listing columns are public; raw collector data and all personal matching/tracking data remain protected. No public writes are authorized. Saved/Activity continue using the loopback API; their private data needs the paired computer connection. Public Discover sorts by recency or company, with no personal-score filters. This supersedes the earlier rule that all mobile reads use loopback. No secret key may be bundled.

## Approved backend and discovery implementation — 18 October 2026

The owner authorized the shared backend, automatic job discovery, single-owner
Supabase email/password sign-in, and a complete backed-up reset of existing jobs
and matches (including the 12 legacy Applied records). This supersedes the earlier
no-Auth/no-crawler restrictions. No hosting, Render configuration, source publishing
or deployment is authorized; the owner will host later.

`backend/` is a localhost-only Fastify API on port 3001. `collector/` is a local
LangGraph workflow with LangChain Groq/Gemini integrations. `packages/contracts/`
owns pure shared types/validation/mapping. Website server queries call the backend;
mobile uses the backend for signed-in personal reads/writes and retains public
listing-only browsing when signed out. Owner identity is checked on every private
request. Mobile sessions use SecureStore; authoritative jobs/tracking remain solely
in Supabase. The mobile app requires a rebuilt binary for the new native module.

API keys previously shared in chat must be revoked; replacement keys are entered
only into ignored local environment files. Never copy those chat values into code.
Operational collector tables are private with RLS and no client grants. The old
`ai-job-radar-daily` Supabase schedule is paused during reset/replacement.

Use `pnpm backend`, `pnpm collect:preview`, `pnpm collect`; daily timer installation
is gated on configured replacement keys and a successful preview. No project-evidence
scoring category: skills 60%, role/responsibilities 25%, experience 15%. Eligibility
is separate. Keep unknowns for review; never invent missing fields. Ingestion must
preserve match IDs, bookmarks, application status and first-seen timestamps.

Stale tracking revisions use SQLSTATE PT409 (HTTP 409), not serialization_failure
40001, because PostgREST retries the latter. `backend/database/` records the new SQL.
Backups and generated owner credentials live under ignored `.local/` with restricted
permissions; never publish them. Root checks cover website, mobile, backend and
collector. No APK installation is implied by source implementation.

## Auth deferred — 18 October 2026

The owner deferred sign-in until hosting. AUTH_MODE=local in backend and website
allows the single personal workspace without login, exclusively on loopback.
Backend validates connection IP, Host and browser origin; never expose this mode
publicly or broaden binding. Mobile defaults to local workspace access only for
loopback API URLs. Existing owner-auth code is retained for later opt-in with
AUTH_MODE=owner and EXPO_PUBLIC_AUTH_MODE=owner. No accounts are deleted.

The local collector timer is enabled after the live preview on 18 October 2026:
09:00 Asia/Kolkata, with persistent catch-up. Native Discover can fall back to
public listing reads if the paired backend is unreachable; private data/writes
always require that local connection in local mode.

## Unified Python service — 18 October 2026

The owner explicitly requested replacing the separate TypeScript API/collector
with **one Python backend folder and one deployable service**. This supersedes
all earlier Fastify/separate-collector and no-FastAPI architecture instructions.
`backend/job_radar/` contains FastAPI, LangChain Gemini/Groq integrations,
LangGraph, source discovery/extraction, scoring, Supabase access, persistent JSON
checkpoints and the in-process daily scheduler. All server secrets are consolidated
in ignored `backend/.env`; process environment overrides it on a host. No Firebase,
SQLite, Redis or second database is introduced. Existing Supabase tables and RPCs
are reused without schema changes. Preserve tracking and existing API contracts.

Root `pnpm backend`, `pnpm collect:preview`, `pnpm collect` invoke Python through uv.
Use Python 3.12, `uv sync --project backend --frozen`. `backend/uv.lock` locks all
Python dependencies; Docker installs hashed `requirements.txt` from this folder.
`pnpm backend:test` runs behavioral tests; `pnpm backend:lint` runs Ruff. Root tests
and lint cover Python plus the clients. Website/mobile TypeScript remains intact.

Run exactly one API worker and one service instance. Background collection runs
outside the request event loop; Supabase leases prevent overlap, credit reservation
RPCs enforce budgets, and checkpoints persist after each candidate. JSON-only
Python checkpoints cannot resume old Node/V8 runs. Old operational records remain
preserved. Direct extraction uses public-only DNS resolution, response limits,
robots checks and pacing; browser automation is omitted in Python, with optional
Firecrawl as fallback. Never bypass these protections.

Local use remains AUTH_MODE=local on loopback only. Public-ready code supports
HOST=0.0.0.0 only with AUTH_MODE=owner and the existing owner identity. The user
has not authorized deployment or source publishing. Do not configure a hosting
account or publish a service. The Dockerfile and instructions are reviewable local
artifacts only. Hosted clients will require the real HTTPS API URL and owner mode;
the current APK is unchanged and still uses localhost through ADB.

The old `job-radar-collector.timer` was disabled during migration. A unified local
`job-radar-backend.service` can be installed with `pnpm backend:install-service`
to keep the loopback API and daily scheduler together under the user session.
The old TypeScript service sources/configuration are backed up privately under
`.local/backups/typescript-services-before-python-2026-10-18.tar.gz` (mode 0600).
Do not restore the old collector timer alongside the new scheduler.

Migration verification: the unified user service is installed, enabled and active
locally; COLLECTOR_ENABLED=true, next regular slot 19 October 2026 09:00 IST.
The startup catch-up run for 18 October began after the successful bounded Python
preview. The legacy timer is disabled. A temporary live Supabase fixture verified
Applied/bookmark persistence, collector re-ingestion and website API reload; it
was removed. Website production build, client type checks, lint, 27 website tests
and eight Python behavioral tests passed. No public deployment was performed.

## Optional Python browser extraction

The owner authorized Playwright as a fallback before Firecrawl. Python Playwright
is pinned with the backend dependencies. `ENABLE_BROWSER` defaults false; enable
it only when matching Chromium is installed. The Dockerfile includes Chromium
headless shell and OS libraries. Preserve Chromium sandboxing, public-only DNS
fetch routing, GET-only requests, robots checks and bounded rendering. Browser
unavailability must safely defer/fall through without breaking collection.
This supersedes the earlier statement that Python omits browser automation.

Playwright verification: matching Chromium headless shell installed locally;
ENABLE_BROWSER=true in the ignored backend environment. All 14 Python tests passed,
including real sandboxed JS rendering and blocked private requests, POSTs and
WebSockets. The local backend service was restarted successfully. The owner's
COLLECTOR_ENABLED=false setting was preserved. No cloud deployment performed.

## Live collection verification and reliability fixes

A manual write collection was authorized. Provider budgets remained enforced even
when Tavily's daily allowance was exhausted. Current employer pages supplemented
stale search results; complete JDs were cached before analysis. Queue selection now
mixes the backlog, recent discoveries and already-extracted pending descriptions,
prioritizing relevant entry-level roles so fresh vacancies cannot be starved.

Groq uses JSON mode with explicit schema instructions, mandatory local Pydantic
validation and exact-source evidence checks. Its completion budget is configurable
with GROQ_MAX_OUTPUT_TOKENS (default 4096); 2048 was used successfully with the
available qwen/qwen3.8-27b model during this collection. Saved provider model choices
are not changed by per-run overrides. GPT-OSS uses low reasoning effort. Validation
retries identify unsupported evidence/profile references and provide actual source
lines; they must never silently accept invented quotes or skills. Role analysis
receives the skills/education/preferences profile, excluding search-title taxonomy.
OR alternatives must be grouped, and semantic capability mappings remain constrained
to approved profile skills. Mandatory experience gaps override an erroneous model
entry label. Physical addresses alone do not establish onsite work. JSON-LD work
mode and employment metadata are retained. All 19 Python tests including real
Chromium verification passed. Scheduling remains disabled per owner configuration.

Manual publication outcome: two real matches were published and read back through
the shared mobile API and website API: TMLC GenAI Engineer (0 to 3yrs), score 100,
and Nexvia Technologies Junior Python Developer, score 96. Both retain full JDs,
source application URLs and application_status=new; nothing was applied for.
Nexvia's work mode is unknown and posting status uncertain; do not claim it is
verified remote/onsite or confirmed open. Scores are skills-fit, not hiring odds.
Provider/search limits caused partial runs; scheduled collection remains off.

## Match threshold — 19 October 2026

The owner requested considering jobs with at least 70% skills-fit; a perfect match
is not required. Collector shortlisting uses an inclusive score threshold of 70.
Explicit eligibility blockers still reject; unknown requirements remain for review.
