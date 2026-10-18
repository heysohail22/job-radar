# Shared local backend

The website and signed-in mobile app use this Fastify API. It listens only on
127.0.0.1:3001. No hosting or publishing has been performed.

## Run

From the repository root:

```sh
pnpm backend
pnpm dev
```

Database credentials have been copied privately from the existing ignored website
configuration when available. `backend/.env.example` documents names only.
`JOB_RADAR_PROFILE_VERSION=skills-v2` selects the new skills-only matching rubric.

The owner account is allowlisted by `OWNER_USER_ID` and uses Supabase Auth.
The initial credentials are in the ignored `.local/owner-access.txt` file; do not
commit or share it. To provision an owner on a new installation, set OWNER_EMAIL
in backend/.env and run `pnpm --dir backend owner:setup`. Existing passwords are
never reset automatically. Change the initial password through Supabase account
administration; no public signup UI or signup API is provided by this backend.
Before any future public hosting, disable **Allow new users to sign up** in the
Supabase Authentication settings. The API denies all identities except the owner
regardless of that setting.

Private requests require a Supabase bearer access token; the backend validates
it through Auth and checks the immutable owner ID. Website tokens are HttpOnly
cookies; mobile tokens use SecureStore. Database secrets never enter either client.
The public listing API returns no personal scores, application state or raw sources.

## Routes

- GET /health
- POST /api/auth/login, /api/auth/refresh, /api/auth/logout; GET /api/auth/me
- GET /api/public/jobs and /api/public/jobs/:id (listing-only)
- GET /api/jobs and /api/jobs/:id (owner only)
- PATCH /api/matches/:id: revision plus isSaved and/or status
- GET /api/candidates and /api/runs (owner only, latest 100)

The existing website query/filter names are preserved. Writes target the exact
match and reject stale revisions with HTTP 409. A bookmark never replaces a stage.
Opening an employer link never marks the job applied.

For local Android use, reverse **both** ports if opening the website too:
`adb reverse tcp:3001 tcp:3001` for the native app, and port 3000 for the website.
Rebuild the APK before expecting SecureStore and the new UI in an installed binary.
No APK installation is performed by this change.

## Verification and database operations

`pnpm --dir backend test` uses Fastify injection without opening ports.
`pnpm --dir backend exec node --env-file=.env --import tsx scripts/check-persistence.ts`
checks live ingestion/status behavior and removes its temporary record in finally.
`pnpm --dir backend backup` creates a permission-restricted, checksummed JSON backup.
Keep backups private. Restoring requires jobs first, then matches, then workspace
state, preserving IDs; do not restore over newer application changes.

Database SQL lives in database/. Operational tables have RLS enabled with no
anonymous/authenticated access. Ingestion updates score/listing fields atomically
without replacing IDs, first-seen timestamps or application state.
The stale-revision SQLSTATE is PT409, not 40001: PostgREST retries serialization
failures, so 40001 can hang an intentional conflict.

Supabase remains the sole database. Render configuration, hosting, remotes, and
source publishing are intentionally excluded.

## Security advisor review

Operational and personal tables intentionally have no client RLS policies: access
is server-only and anonymous/authenticated table grants are revoked. The advisor
reports these as informational, consistent with deny-by-default. Existing project
warnings remain for the legacy set_updated_at search path and disabled leaked-password
protection. Review these before future public hosting:
https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
