# AI Job Radar

A personal job discovery workspace with a Next.js website, Expo mobile app and
**one Python backend**. Supabase is the existing authoritative database.

- `backend/`: FastAPI API, LangChain/Gemini/Groq, LangGraph collection workflow,
  direct JD extraction, optional Firecrawl, daily scheduler and database setup records.
- `website/`: responsive Next.js website.
- `mobile/`: Expo Android/iOS app.
- `packages/contracts/`: shared pure TypeScript client types and validation.

## Run locally

```sh
uv sync --project backend --frozen
pnpm install --frozen-lockfile
pnpm backend
# another terminal
pnpm dev
```

All server secrets now belong in **`backend/.env`**. Website configuration remains
in ignored `website/.env.local`; mobile public configuration contains no secrets.
Local mode does not require login and binds the API to 127.0.0.1:3001. Android uses
`adb reverse tcp:3001 tcp:3001` for private operations. Mobile public Discover can
fall back to the listing-only Supabase feed when the local backend is disconnected.

## Discovery and hosting

See [backend setup](backend/README.md) for the one-service architecture, environment
variables, Docker build, authentication and scheduler. Deploy **only `backend/`**
for the API and collection engine. The website is a client hosted separately; the
mobile app is built and installed. No hosting or deployment has been performed.

`pnpm collect:preview` runs discovery and analysis without publishing to the job
feed. `pnpm collect` publishes qualifying jobs. `COLLECTOR_ENABLED=true` runs daily
collection inside the API process; the old separate TypeScript collector and timer
have been replaced. One worker, one service, one Supabase database. No Firebase or
additional database is required.

For public hosting, use owner authentication and HTTPS, configure the client API
URLs, and rebuild mobile. The current local APK continues to work with the unchanged
API contracts. Never expose `AUTH_MODE=local` publicly or bundle privileged keys.

## Checks

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --dir mobile export
```

Python dependencies are pinned in `backend/pyproject.toml`, `uv.lock`, and hashed
`requirements.txt`. JavaScript dependencies remain pinned in `pnpm-lock.yaml`.
