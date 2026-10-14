# AI Job Radar — Website Build Specification

**Status: proposed; awaiting owner review and explicit authorization to build.**

Prepared: 14 October 2026.

## 1. Purpose and boundaries

Build a polished personal website for browsing jobs already collected in Supabase, reviewing match information, saving promising roles, and tracking applications. It must work well in desktop and phone browsers and follow the approved Figma designs.

This is a fresh implementation. The previous resume editor, crawler, backend, and frontend are not the starting codebase. This document describes future work only: no scaffolding, dependencies, app code, development server, or database changes during review.

| Decision | Requirement |
| --- | --- |
| Deliverable | Responsive website first, in one codebase |
| Phone support | Phone browser layout; native app/Expo deferred |
| Auth | None: no login, registration, sessions, or user onboarding |
| Workspace | One shared personal workspace |
| Database | Existing `ai-job-radar` Supabase project |
| Collection | Existing external daily process remains independent |
| Design | Improved Figma desktop and phone layouts |
| Interaction reference | Existing MagicPath prototype |
| Persistence | Supabase; no localStorage/IndexedDB for jobs or tracking |
| GitHub/source publishing | Owner handles it; excluded from implementation |
| Hosting/deployment | Owner handles it; excluded from implementation |

Do not add resume editing, resume tailoring, AI chat, a new scraper, collection schedules, email/push notifications, or another database.

## 2. Visual references

Figma: https://www.figma.com/design/zzzVHhneAYBLrXVqIvnmSw

| Screen | Node |
| --- | --- |
| Desktop Discover | `1:518` |
| Desktop job details | `1:617` |
| Desktop Applications | `1:672` |
| Phone Discover | `1:712` |
| Phone job details | `1:768` |
| Phone Applications | `1:805` |
| Phone Saved Jobs | `1:830` |

MagicPath project: `461166504738693120`.

MagicPath component: `461166553119989760`; generated name: `happy-stream-2269`.

Figma is the visual source of truth; MagicPath demonstrates the interactions. Its data is a snapshot and its changes reset on refresh. Replace that demo behavior with real database reads and persistent writes. Inspect the references again before building because they may change. Reuse prototype code only where it supports a maintainable application.

### Design foundations

| Token | Value/use |
| --- | --- |
| Canvas | `#F4F6F3` |
| Surface | `#FFFFFF` |
| Main text | `#182A23` |
| Secondary text | `#617169` |
| Primary actions | `#146C4E` |
| Dark radar panels | `#142D24` |
| Lime highlights | `#C6F16E` |
| Soft green | `#E7F2E9` |
| Borders | `#DFE6DF` |
| Verification notes | `#82571C` text on `#FFF4DF` |

Use Inter typography, rounded cards, compact chips, readable hierarchy, simple vector icons, and restrained motion. Serve fonts through the framework or local assets. Company monograms are acceptable; do not present invented marks as official company logos.

## 3. Technical approach

Use one root-level Next.js App Router application with React, TypeScript, Tailwind CSS, and pnpm. Use the Supabase JavaScript client in server-only modules. Add a small icon library and validation tooling only as needed. Avoid a separate Python/API runtime, SQLite, monorepo tooling, or a large state-management library for this scope.

Choose supported versions from current official documentation when implementation starts. Pin dependencies and keep a single pnpm lockfile. No package installation is part of specification review.

Suggested future structure:

```text
AGENTS.md
.codex/SPEC.md
app/
  layout.tsx
  globals.css
  page.tsx                       Discover
  saved/page.tsx
  applications/page.tsx
  jobs/[jobId]/page.tsx
  api/jobs/route.ts
  api/matches/[matchId]/route.ts
components/
  layout/                        sidebar, header, phone navigation
  jobs/                          feed, cards, detail, filters, score
  applications/                  tracker, summaries, empty states
  ui/                            shared controls and feedback
lib/
  server/                        server-only database client and queries
  jobs/                          mapping and filter definitions
  validation/                    query and mutation validation
  types/                         database and UI types
public/                          icons, illustrations, fonts
tests/                           focused behavior/integration checks
.env.example                     names and explanations, no credentials
package.json
pnpm-lock.yaml
```

This is a proposed structure, not files to create now. Keep related small modules together; avoid empty folders and abstractions created merely to match the tree.

Data flow: browser → Next.js server page/route → Supabase → normalized response → UI. Share query logic between initial server rendering and interactive route handlers. Use temporary browser state for dialogs/selection, URL parameters for filters/sorting, and Supabase for persistent progress. A bounded cache is acceptable only with defined refresh/invalidation behavior.

## 4. Existing database facts and reinspection

Project: `ai-job-radar`; reference: `tybrswbrqmoxznizheuu`.

Inspection on 14 October 2026 found 12 jobs and 12 matching records: 9 remote, 2 onsite, 1 hybrid, with every matching record initially `new`. These are historical facts, not counts to hardcode into the website.

### `public.jobs`

- Identity/source: `id`, `canonical_url`, `apply_url`, `source_urls`, `external_job_id`, `source_type`.
- Role: `company`, `title`, `description`, `responsibilities`, `employment_type`.
- Location: `location_text`, `work_mode`, `eligible_from_india`.
- Requirements: `required_skills`, `preferred_skills`, `experience_text`, `minimum_experience_years`, `degree_requirements`.
- Pay: `compensation_text`, `currency`.
- Availability: `posting_status`, `posted_date`, `closing_date`.
- Freshness: `first_seen_at`, `last_seen_at`, `last_verified_at`, `created_at`, `updated_at`.

The existing collector owns these listings. Browsing or saving must not rewrite job content, scores, or freshness timestamps.

### `public.job_matches`

- Identity: `id`, `job_id`, `profile_version`.
- Scores: `total_score`, `technical_score`, `project_score`, `experience_score`, `geography_score`, `role_score`.
- Explanation: `matching_evidence`, `missing_requirements`, `recommendation`.
- Progress: `application_status`, `matched_at`, `reviewed_at`.

The inspected status constraint allows `new`, `reviewed`, `saved`, `applied`, `interview`, `rejected`, `withdrawn`, and `offer`.

Both public tables had RLS enabled. Complete policies and grants have not been validated for this new application. Reinspect the schema, policies, grants, constraints, and active profile values before implementation. Do not disable RLS to make queries work.

Choose the intended active profile version explicitly. A job can have multiple matching records in the future: do not mix scores across profiles or render duplicate jobs accidentally. Carry the exact matching-record ID into mutations rather than updating every match for a job. Handle missing matches as “Not scored yet”; never invent a score or create a synthetic match simply to enable a button.

## 5. Independent bookmarks and application progress

A bookmark and an application stage are separate facts. A job can be saved and also applied, in interview, or offered. Saving must never replace application progress.

The inspected schema has `application_status` but no separate bookmark field. Proposed minimal future change: add `is_saved boolean not null default false` to the matching record. Add `saved_at` only if sorting by save date is implemented. Reuse the existing tables rather than creating another tracking database.

Before any schema change:

1. Inspect current columns and constraints; the schema may already have changed.
2. Check how the external collector upserts matches. It must preserve bookmark and application fields rather than resetting them on the next crawl.
3. Check for legacy `application_status = 'saved'` rows and preserve their bookmark meaning. Do not discard any application progress during conversion.
4. Prepare the smallest compatible migration and rollback strategy during the authorized build.
5. Verify existing records and matching scores remain intact after the approved migration.

No migration is authorized now. If the owner later rejects schema changes, agree on reduced behavior explicitly instead of pretending one status field supports two independent states.

Application actions: mark applied; move to interview, offer, rejected, or withdrawn; correct a mistaken stage; remove from application tracking while preserving the bookmark. Support the collector's existing new/reviewed states without treating them as applied.

Opening an application link does not mark the job applied automatically. The owner completes the external application and then explicitly changes its status.

## 6. No-Auth operating model

No user accounts, user IDs, login screens, sessions, or per-user data isolation. All clients using the instance see the same shared personal workspace.

Initially run locally, bound to localhost. Keep any privileged Supabase credential in a server-only environment variable and server-only module. Never expose a secret/service-role key through `NEXT_PUBLIC_`, client bundles, logs, artifacts, or committed files.

Future environment names, with values supplied privately during implementation:

```text
SUPABASE_URL=
SUPABASE_SECRET_KEY=
JOB_RADAR_PROFILE_VERSION=
```

Verify the supported credential type when implementing. Document names only, not real keys. Do not assume the MagicPath prototype supplies production credentials or a secure server architecture.

Expose narrowly defined bookmark/status operations. Validate IDs, allowed status values, and writable fields server-side. Preserve unrelated columns. Check browser mutation origins; do not expose arbitrary SQL or unrestricted updates.

Same-origin checks are not authentication. Unrestricted public access to privileged no-Auth endpoints is not an approved design. Public-access decisions and hosting remain outside this plan.

## 7. Website screens

### Discover

Desktop: sidebar navigation and counts, dark radar overview, search/filter toolbar, compact cards, and a selected-job preview. Selecting a role updates the preview. “View opportunity” opens the full job route.

Phone: compact brand header, radar summary, search, work-mode chips, single-column cards, and fixed bottom navigation. Job details open as a dedicated full-width view. Add sufficient bottom padding so navigation does not obscure content.

Search company, title, skills, and location. Support remote, onsite, hybrid, and unknown work modes. Use existing location text without inventing geographic precision. Advanced filters may include a minimum match score and stored posting status, with clear wording that status is not a fresh verification.

Default sort: descending match score, deterministic tie-breaker, null scores last. Optional sorts: company name and recently discovered. Filtering/sorting must cover all matching rows, not just the currently loaded page. Use bounded pagination or Load More for larger datasets.

Keep filters/sort in URL parameters and preserve them when returning from details. Clear filters must restore the appropriate full list. Workspace counts describe the whole active profile; result counts describe the selected filters.

### Job details

Show the complete title, company, location/work mode, compensation text, posting status, source freshness, actual score, available explanation, skills, description, responsibilities, and missing requirements. Only show a score breakdown if real component scores exist. Do not infer numbers from the total.

Desktop uses wider information and decision areas; phone uses a focused reading layout with an accessible Apply action. Provide Save and explicit application-status controls without mixing their meanings.

Use valid `apply_url`, otherwise valid `canonical_url`. Allow only HTTP/HTTPS; use safe external-link attributes. If neither is usable, disable Apply with a readable explanation. Opening the source must not mutate application status.

Imported text is untrusted: render it as text or deliberately sanitized content, never unchecked HTML. Unknown pay periods, unclear eligibility, missing descriptions, and uncertain posting status must remain explicit. “Compensation not listed” is better than an invented amount.

### Saved Jobs

Load bookmarked roles from Supabase. Reuse card/preview patterns. Allow unsaving, update counts, preserve application progress, and use the approved illustrated empty state when the shortlist is empty.

### Applications

Show accurate counts for Saved, Applied, Interview, and Offers. Saved is a bookmark count; stage counts count records currently in that stage. List tracked roles, filter by stage, open their details, and allow explicit status corrections/removal.

Use the approved empty state for no applications. Do not fabricate interview dates, recruiter messages, application history, or activity timelines.

## 8. Server contracts and feedback

| Proposed interface | Responsibility |
| --- | --- |
| `GET /api/jobs` | Validated filters, search, sort, pagination, and normalized job/match data |
| Server query for `/jobs/[jobId]` | Exact job and active matching record; useful not-found behavior |
| `PATCH /api/matches/[matchId]` | Only independent bookmark and allowed application-status fields |

Share queries across server pages and API handlers. Finalize exact response shapes during implementation. Database errors must not disclose secrets or internals. Distinguish invalid input, missing records, and database failures.

Refresh the card, detail, Saved Jobs, Applications, and relevant counts after a write. Optimistic changes are acceptable only with rollback and visible failure feedback. Reloading must reproduce Supabase state.

Provide useful loading, empty, pending, error/retry, and not-found states. Missing matching rows must not trigger arbitrary record creation. Keep mutations focused on an exact matching-record ID.

## 9. Ordered implementation plan — only after authorization

### Step 1: Reconfirm references and database compatibility

Read this document and AGENTS.md. Inspect approved Figma nodes and MagicPath behavior. Reinspect Supabase schema, grants, RLS, profile versions, constraints, and collector upsert behavior. Document any difference affecting the plan.

Acceptance: required fields, exact mutation targets, and collector preservation of user progress are understood; unresolved data ambiguities are not hidden in the UI.

### Step 2: Scaffold one website

Initialize a root Next.js TypeScript project with pnpm and Tailwind. Add only needed packages, pin versions, preserve planning documents, and create an environment example containing names only. Establish local dev/lint/typecheck/test/build scripts.

Acceptance: the starter builds locally. No Auth, native-app project, separate backend, source publishing, or hosting configuration is added.

### Step 3: Create design foundations and application shell

Implement tokens, typography, icons, monograms, buttons/states, cards, skeletons, and illustrations. Build the desktop sidebar/header and phone header/bottom navigation. Establish responsive layout rules from Figma.

Acceptance: representative desktop and phone shells match the reference, keyboard focus is visible, controls are comfortably tappable, and there is no horizontal overflow.

### Step 4: Add server-only Supabase access

Configure credentials privately, add typed queries and normalized view models, select the active profile, and implement validated filtering/pagination. Verify reads against real data without modifying job listings.

Acceptance: real jobs and scores reach the UI; counts are dynamic; missing values and database errors are handled; privileged credentials are absent from browser code.

### Step 5: Implement Discover

Connect the summary, feed, search, filters, sorting, pagination, query parameters, and selection preview. Implement phone navigation and useful loading/empty/error states.

Acceptance: filters/sorting operate across the query result, Clear Filters works, and returning from details restores browsing context. No fake job records replace a failed database read.

### Step 6: Implement full job details

Build desktop and phone details, overview/requirements sections, actual matching information, verification notes, safe external links, and missing-job handling.

Acceptance: the displayed role always matches the selected card and URL, including after filtering. Unknown source information stays explicit and opening Apply does not change progress.

### Step 7: Add persistent bookmarks

Prepare the minimal authorized schema addition only if reinspection still requires it. Verify collector compatibility and legacy saved-state handling. Implement Save/Unsave, the Saved Jobs screen, pending feedback, rollback on failure, and count refresh.

Acceptance: bookmarks survive reload and ingestion, and saving/unsaving never erases application progress.

### Step 8: Add persistent application tracking

Implement explicit status updates, tracking list, stage filters, accurate summaries, and correction/removal actions. Keep opening an employer page separate from marking applied.

Acceptance: a role remains bookmarked while applied/interviewing; all screens and counts agree after an update and reload.

### Step 9: Polish responsiveness and accessibility

Review around 360, 390, 768, 1024, and 1440 pixels. Check long titles, pay text, large skill lists, missing fields, and verification notes. Verify keyboard navigation, dialog focus trapping, Escape/close behavior, labels, selected states, contrast, reduced motion, and adequate touch targets.

Acceptance: desktop and phone browsers are comfortable to use, fixed navigation does not cover content, and important actions remain reachable.

### Step 10: Verify the complete local application

Run lint, type checking, focused behavioral tests, and a local production build. Perform the end-to-end checks below. Use deliberate test records or reversible changes; restore real database rows changed during verification.

Acceptance: no unresolved core-flow failures, credential exposure, serious layout defects, or state inconsistencies remain. Summarize checks and limitations, then stop for owner review.

There is no GitHub publishing or hosting/deployment phase in this plan.

## 10. Required verification

- Jobs, scores, and global counts come from Supabase rather than a snapshot.
- Search, filters, sort, pagination, and no-results/reset behavior work together.
- A filtered preview opens the exact job it displays rather than stale selection.
- Unknown pay periods, eligibility, and posting status stay explicit.
- Source URLs are validated; opening one does not silently mark applied.
- Save persists after reload; Unsave preserves application progress.
- Applied/Interview/Offer updates target the exact matching record and refresh counts.
- Correcting/removing a stage preserves the independent bookmark.
- Collector upserts preserve user-managed bookmark and tracking fields.
- Loading, invalid input, missing match/job, unavailable URL, and database failure have useful states.
- Credentials remain server-only and mutations cannot update arbitrary columns.
- Desktop and phone layouts are visually checked with long and missing content.
- No Auth, native-app scaffold, crawler, resume tooling, publishing, or hosting work slips into scope.

## 11. Review points and completion

Defaults proposed for review: one root-level Next.js website, local personal use without Auth, the intended active profile's matches, and a minimal independent bookmark field if still needed. The owner can revise these choices before authorizing the build.

Definition of done: the owner can run the website locally, browse real jobs, review real match information, bookmark roles, and track applications across reloads. Desktop and phone browser layouts follow the approved designs. The existing collection process remains independent, and Supabase remains authoritative.

The finished local website and validation results are ready for review. Source publishing, hosting, native apps, and future product features remain later owner decisions.
