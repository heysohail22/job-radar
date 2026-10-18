# AI Job Radar

Current setup: **local personal workspace, no sign-in**. Daily discovery is enabled for 09:00 Asia/Kolkata while the computer is available. Hosting and authentication remain deferred.

One pnpm workspace with two applications:

- [website/](website/README.md): Next.js website, server API, database setup SQL, assets and tests.
- [mobile/](mobile/README.md): Expo / React Native app with light, dark and system appearance.

Both clients use the same existing Supabase project. Mobile Discover and public job details read directly over HTTPS with a publishable key, without a computer or login. Private Saved/Activity still use the localhost website API. Server secrets belong only in ignored `website/.env.local`.

Install dependencies from this folder with `pnpm install`. Root commands continue to work:

```sh
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm check:db
```

You can also run website commands directly, such as `pnpm --dir website dev`. Start the mobile development tools with `pnpm --dir mobile start`; see its README for USB/simulator setup. The server remains bound to localhost. No hosting or publishing configuration is added.

## Local backend and automatic discovery

See [backend setup](backend/README.md) and [collector setup](collector/README.md).
Run `pnpm backend` and `pnpm dev` in separate terminals. Use `pnpm collect:preview`
before `pnpm collect`. Replacement search/model API keys are required; credentials
shared in chat are not used. Initial owner access is in ignored `.local/owner-access.txt`.
The collector timer is prepared but not enabled until configuration and preview succeed.
No Render service, deployment or source publishing is part of this implementation.

## Current local no-login mode

The owner deferred authentication. `AUTH_MODE=local` is configured for backend
and website. The backend remains bound to loopback and validates connection IP,
Host and browser origins. Website matches, Saved and Applied tracking need no login.
Mobile uses the personal backend automatically for loopback URLs (port 3001);
public browsing with a future hosted URL still uses the protected/public split.
Sign-in code is retained for later: use AUTH_MODE=owner in backend and website
and EXPO_PUBLIC_AUTH_MODE=owner in mobile when ready. No public unauthenticated
private endpoint is authorized. Earlier owner-sign-in setup instructions apply
only when that mode is enabled. Existing owner account/data are preserved.
