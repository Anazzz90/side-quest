# Side Quest website foundation

This directory contains the CP3/CP4 development build. It is separate from `../prototype`, which remains the browser-only clickable prototype.

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

Development and staging use synthetic data only. The application shell, a development-only email/password sign-in and sign-up flow, an account-standing page, quest creation/discovery, the join-request lifecycle, a gated quest room (private meeting instructions + chat), and basic in-app notifications are wired up. The real map provider and moderation tooling are not; discovery uses a filtered list against synthetic fixture places (`supabase/seed.sql`), and the map panel stays an illustrative placeholder pending a CP1 provider decision. The health route returns only a generic status.

Do not configure a hosted database, accept production registrations, or collect real user data until CP1 approvals settle age assurance, privacy/data handling, hosting region, venues, account integrity, and moderation coverage. Sign-up is disabled by default and force-disabled whenever `NODE_ENV=production`, regardless of configuration (see `src/lib/backend-config.ts`). Service-role credentials are never read from client-reachable code; the browser receives only the public Supabase URL and anon key. See [docs/SECURITY.md](./docs/SECURITY.md) and [docs/PRIVACY.md](./docs/PRIVACY.md).

## CP3 status

- `pnpm install`, `pnpm typecheck`, and `pnpm build` all succeed with pinned dependency versions.
- The local Supabase stack starts and the foundation migrations apply; `pnpm exec supabase db reset` re-applies all migrations to a fresh database with no errors (repeatability check).
- Row-level security is enabled on every foundation table; `user_profiles` has self-only read/update policies, verified against real requests.
- A development-only sign-up/sign-in flow works end-to-end, including automatic profile creation via a database trigger and an account-deletion audit trail.
- No service-role reference or other secret appears in `.next/static`, the client-served build output.

## CP4 status

Verified locally, both against the raw API and through a real Playwright-driven browser session (sign up two accounts → host publishes a quest → it appears in discovery → the second account requests to join → the host accepts → the private meeting instructions and quest-room chat unlock only after acceptance → both sides see the resulting notifications):

- Quest creation, discovery (filtered list + category/type chips + search), join requests, host accept/decline, withdrawal, host cancellation, and capacity enforcement all work, backed by database triggers and `SECURITY DEFINER` functions rather than client-side checks alone.
- Capacity is enforced atomically inside `decide_join_request()` with row locks — a second accept past capacity is rejected, not just discouraged in the UI.
- Private meeting instructions and quest-room chat live behind row-level security keyed on host-or-accepted-participant membership, not just a UI conditional; verified that a pending requester's direct API calls return nothing / are rejected.
- Duplicate join requests, a host joining their own quest, and joining after a block in either direction are all rejected server-side.
- In-app notifications are created on request/decision events and are read-only except for `read_at` from the client.
- `pnpm exec supabase db reset` re-applies all four migrations (CP3 + CP4) and the CP4 seed fixtures cleanly.

Documented in `docs/`: local setup (now including the seed fixtures and type-generation command), secrets handling, backup/restore rehearsal, data access (including the CP4 policy set and the RLS-recursion fix), incident response, and the privacy-by-default design.

Still open, and intentionally deferred: a real map provider (CP1 decision D-05), reviewed public venues (D-04) — the current ones are clearly labeled synthetic fixtures, Google sign-in, a durable/shared rate limiter, background quest-expiry (currently computed at query time, not a stored transition), realtime chat delivery (CP5), and anything requiring a hosted environment.
