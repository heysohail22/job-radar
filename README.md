# AI Job Radar

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
