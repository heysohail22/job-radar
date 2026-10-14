# AI Job Radar

A personal responsive job workspace built with Next.js, React, TypeScript, Tailwind CSS, and Supabase. Discover roles, inspect stored matching information, bookmark jobs, and track applications across reloads.

## Run locally

Run these commands from the repository root. Website commands are forwarded into `website/`.

```bash
pnpm install
pnpm dev
```

Open http://127.0.0.1:3000. The website binds to localhost and rejects non-local hosts. There is no Auth or multi-user separation.

Server configuration belongs in the ignored `website/.env.local` file. See `website/.env.example` for variable names. The active profile must match the collector's profile version; the inspected current value is `resume-v1`. Never put the server secret in a `NEXT_PUBLIC_` variable or client code. The publishable key is not needed for this implementation.

## Local checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm check:db
```

The database check is read-only. The tests cover request validation, origin protection, filtered preview selection, bookmark/status payload separation, write failures, conflicts, external application links, and filter URL preservation.

The local scripts use Next.js's Webpack bundler. TypeScript checking remains enabled through the supported compiler-API integration; this avoids environment-specific Turbopack worker-port and CLI-output restrictions.

## Data ownership

The existing `jobs` and `job_matches` tables and external collection process remain collector-owned. The website reads those records and stores user changes separately in `job_workspace_state`, linked to the exact match ID. This avoids ingestion resetting application progress.

`website/database/workspace.sql` records the applied, re-runnable database setup. Its read RPC performs search, filtering, deterministic sorting, and pagination in Postgres. Its write RPC changes only bookmark/status state and checks a revision number to prevent stale-tab overwrites. Both functions use invoker security and are executable only by the server role; RLS remains enabled. No anonymous browser database client is used.

No state rows are created until a user changes a bookmark or application stage. Until then, legacy saved/application values from the matching record are respected. Once website state exists, it is authoritative for that match. Removing a job/match from the source database removes its linked state through the foreign key.

Opening Apply launches the original posting and never automatically marks a job applied. Mark Applied separately after completing the employer's application.

## Design and scope

The improved [Figma design](https://www.figma.com/design/zzzVHhneAYBLrXVqIvnmSw) is the visual reference; the MagicPath interactive prototype is the behavior reference. Downloaded Figma SVGs are local in `website/public/figma/`; fonts are packaged locally. No temporary asset URLs are used at runtime.

The Figma Starter limit prevented re-reading some screens and retrieving the Saved Jobs illustration; the shared approved application illustration is currently used for empty states. Exact visual comparison in a real browser remains outstanding because the localhost server launch was declined. Do not treat the build/tests as a browser visual review.

The specification is in `.codex/SPEC.md`; current agent guidance and the collector-safe state-table refinement are in `AGENTS.md`.

Auth, resume editing/tailoring, crawling, source publishing, and hosting are outside the current scope.

## Native mobile app

The Expo / React Native app lives in the sibling `mobile/` folder with Discover, Saved, Activity, job details and system/light/dark appearance. See [mobile setup](../mobile/README.md) for USB/simulator instructions. Both clients use the same server-only Supabase workspace.
