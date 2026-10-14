# AGENTS.md — AI Job Radar

## Current phase: website implementation

The owner requested a fresh start and then authorized implementation from `.codex/SPEC.md`, the Figma design, and the MagicPath prototype on 14 October 2026. The old application was removed.

Read `.codex/SPEC.md` before work. Its original review-only gate has now been satisfied by the owner's build instruction. Continue within the website-only scope below. The owner declined starting the local development server during this session; do not retry that rejected action without a new instruction.

## Scope

Build a personal, responsive job discovery website using the existing `ai-job-radar` Supabase project. Desktop and phone browsers use one website and codebase. Native mobile apps and Expo are deferred.

Version one includes Discover, job details, Saved Jobs, and Applications. It reads existing jobs and matching scores, supports search and filters, and persists bookmarks and application progress in Supabase.

Do not add Auth, login, registration, user onboarding, a crawler, resume editing/tailoring, AI chat, or a second database. The existing external daily collection process remains independent. This is one shared personal workspace.

## Owner-controlled actions

- Do not push to GitHub, create pull requests, configure remotes, or publish source.
- Do not deploy, configure hosting, connect domains, or perform Vercel operations.
- The owner handles publishing and hosting separately.
- Do not automatically apply for jobs. Opening an employer page and marking a role applied are separate user actions.

## Architecture

The root application uses Next.js App Router, React, TypeScript, Tailwind CSS, locally packaged Inter fonts, and pnpm. Supabase access is confined to `lib/server/` and Next.js route handlers. There is no FastAPI or SQLite service. Linting uses the supported ESLint 9 / TypeScript 5.9 combination; dependencies are pinned in package.json and pnpm-lock.yaml.

Dev and production builds explicitly use Webpack because Turbopack's PostCSS worker needs a port disallowed by this environment. `experimental.useTypeScriptCli: false` uses Next.js's supported TypeScript compiler-API integration; type checking is enabled, not skipped.

Website-owned state is stored in `public.job_workspace_state`, keyed by the exact matching-record ID. This is a deliberate refinement of the spec's proposed bookmark column: external collector upsert code is not available here, so isolation preserves both bookmarks and application stages without changing collector-owned rows. `database/workspace.sql` records the idempotent schema, server-only read RPC, and atomic revision-checked mutation RPC applied to the existing project. RLS is enabled and anonymous/authenticated RPC execution is revoked.

`components/website.tsx` contains the interactive views. Pages delegate initial queries to `components/website-page.tsx`. Filters/sort/pagination live in the URL. The server RPC filters and sorts before pagination. UI mutation success refreshes server data; stale revisions return a conflict rather than overwriting another tab.

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

Use `pnpm format` to format source. `pnpm check:db` performs read-only Supabase connection checks using ignored `.env.local`. Browser verification requires permission to start the local server; never claim it has been performed when only tests/build passed.
