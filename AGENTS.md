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
