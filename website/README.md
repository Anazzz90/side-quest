# Side Quest website foundation

This directory contains the CP3 development foundation. It is separate from `../prototype`, which remains the browser-only clickable prototype.

## Stack baseline

- Next.js App Router with TypeScript for the web application.
- Supabase local development for PostgreSQL, PostGIS, Auth, and later Storage/Realtime integration.
- Versioned SQL migrations under `supabase/migrations/`.

The database and identity services are not connected to a hosted project. No secrets or real user records belong in this repository.

## Local development

See [docs/SETUP.md](./docs/SETUP.md) for prerequisites, first-time setup, and everyday commands. In short:

```sh
pnpm install
pnpm db:start
cp .env.example .env.local   # fill in the local anon key pnpm db:start prints
pnpm dev
```

The local Supabase stack requires a working Docker-compatible runtime, kept bound to the local machine only.

## Environment and data boundary

Development and staging use synthetic data only. The application shell, a development-only email/password sign-in and sign-up flow, and an account-standing page are wired up; the map provider, quests, chat, and moderation are not. The health route returns only a generic status.

Do not configure a hosted database, accept production registrations, or collect real user data until CP1 approvals settle age assurance, privacy/data handling, hosting region, venues, account integrity, and moderation coverage. Sign-up is disabled by default and force-disabled whenever `NODE_ENV=production`, regardless of configuration (see `src/lib/backend-config.ts`). Service-role credentials are never read from client-reachable code; the browser receives only the public Supabase URL and anon key. See [docs/SECURITY.md](./docs/SECURITY.md) and [docs/PRIVACY.md](./docs/PRIVACY.md).

## CP3 status

Verified locally:

- `pnpm install`, `pnpm typecheck`, and `pnpm build` all succeed with pinned dependency versions.
- The local Supabase stack starts and the foundation migrations apply; `pnpm exec supabase db reset` re-applies all migrations to a fresh database with no errors (repeatability check).
- Row-level security is enabled on every foundation table; `user_profiles` has self-only read/update policies, verified against real requests (an account holder can read/update only their own row; another account holder cannot see it; account status cannot be self-changed but can be changed by the service role, with an automatic audit-log entry).
- A development-only sign-up/sign-in flow works end-to-end, including automatic profile creation via a database trigger and an account-deletion audit trail.
- No service-role reference or other secret appears in `.next/static`, the client-served build output.

Documented in `docs/`: local setup, secrets handling, backup/restore rehearsal, data access, incident response, and the privacy-by-default design (no live location table, private media storage design, and the current export/deletion workflow).

Still open, and intentionally deferred: Google sign-in (needs OAuth credentials that don't belong in this repo), a shared/durable rate limiter (the current one is in-process, fine for local review only), and anything requiring a hosted environment — those wait on CP1 hosting/privacy decisions. Feature-specific RLS policies for quests, chat, and points land alongside those features in CP4/CP5.
