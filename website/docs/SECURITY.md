# Secrets, data access, and incident handling (development scaffold)

This describes the CP3 foundation only. It will be revised once CP1 hosting
and privacy decisions are approved and a real deployment target exists.

## Secrets handling

- The **only** Supabase credential ever read from browser-reachable code is
  the public anon key, via `getPublicBackendConfig()`
  (`src/lib/backend-config.ts`). It is exposed intentionally through the
  `NEXT_PUBLIC_` prefix, which Next.js inlines into the client bundle — this
  is standard and expected for a public anon key protected by row-level
  security.
- The **service-role key** (printed by `pnpm db:start`) must never be placed
  in `.env.local` or any `NEXT_PUBLIC_*` variable, and no source file in this
  scaffold reads it. If a later checkpoint needs it (e.g. moderation
  tooling), it must be read only in server-only code (a Route Handler,
  Server Action, or a script run outside the request path) from a
  non-`NEXT_PUBLIC_` environment variable, and never returned in a response.
- `.env`, `.env.local`, and every `.env.*` variant except `.env.example` are
  git-ignored (see `.gitignore`). Only `.env.example`, which holds
  placeholders, is committed.
- No provider keys, service-role keys, or real credentials of any kind exist
  in this repository as of CP3.

### Verifying no secret reaches the client

After `pnpm build`, the compiled client bundles live under `.next/`. Confirm
none of these appear anywhere in `.next/` (they should return no matches):

```sh
grep -rIl "SERVICE_ROLE\|service_role" .next/static   # the client-served output
grep -rIo "NEXT_PUBLIC_[A-Z_]*" .next/static | sort -u # should list only URL/ANON_KEY
```

This was run against the CP3 build and returned no service-role references in
`.next/static`. Note: `.next/server/**/*.js.map` sourcemaps do contain the
literal string `service_role` — that comes from the Supabase SDK's own role
type (`'anon' | 'authenticated' | 'service_role'`), lives only in
server-only build output, and is not evidence of a leaked key. Check
`.next/static` specifically, since that is what actually reaches the browser.

## Data access

- Every table created in CP3 (`supabase/migrations/20260925000100_foundation.sql`)
  has row-level security enabled. Only `user_profiles` has policies so far
  (`20260925000200_profile_identity.sql`): an authenticated account holder
  may read and update their own row, and only their own row. No table has an
  anonymous-access policy.
- `account_status` cannot be changed by the account holder themselves, even
  through their own-row update policy — a database trigger
  (`prevent_self_account_status_change`) blocks any non-service-role change
  to that column. Only server code running with the service-role key
  (moderation tooling, built and reviewed in a later checkpoint) may change
  account standing, and every change is written to
  `moderation_audit_events` automatically.
- All other tables (`geographic_areas`, `optional_communities`,
  `community_memberships`, `meetup_places`, `quest_categories`,
  `moderation_audit_events`) remain default-deny: RLS is on and no policy
  exists yet. This is intentional until each feature's authorization rules
  are implemented and reviewed (CP4/CP5), per the CP3 exit gate.

## Backup and restore (local rehearsal)

There is no hosted database yet, so this documents the local rehearsal
procedure; it will be revised for a hosted target once CP1 approves one.

```sh
# Back up the local database to a SQL dump
pnpm exec supabase db dump --local -f backup.sql

# Rehearse a restore into a clean local database
pnpm exec supabase stop --no-backup
pnpm exec supabase start
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f backup.sql
```

The restore rehearsal should be re-run whenever a new migration is added, to
confirm the dump/restore cycle still reflects the current schema. `backup.sql`
is a local artifact and must never be committed (it can contain data).

## Logging and alerting (current state)

- The local Supabase stack's own service logs (Postgres, GoTrue, PostgREST,
  Realtime, Storage) are visible via `pnpm exec supabase status` and Docker
  logs (`docker logs supabase_<service>_side-quest-local`); no external log
  aggregation is configured yet.
- Application-level logging is not yet implemented beyond default Next.js
  server output. A data-minimized logging design (no message bodies, no
  precise location, no raw evidence content in logs) is deferred to the
  checkpoint that implements chat and evidence handling (CP5), per the CP3
  scope.
- Alerting has no target yet: there is no hosted environment or on-call
  rotation defined (Checkpoint 0 decision D-08 covers moderator coverage;
  engineering on-call is not yet assigned).

## Incident response (development scope)

Because there is no production data, the current incident scope is limited
to protecting the development machine and any synthetic test data:

1. If a credential is suspected exposed (e.g. accidentally committed), rotate
   it immediately: for local Supabase, `pnpm exec supabase stop` then
   `pnpm exec supabase start` issues fresh local JWT signing material; for
   any real provider key, rotate it in that provider's dashboard and force
   `git filter-repo`/history rewrite before any push, since this repository
   has no remote yet.
2. If the local database contains anything beyond synthetic data, treat that
   as a process failure to fix (development must stay synthetic-data-only)
   rather than an incident with an affected user, since no real user data is
   authorized yet.
3. Real incident response — paging, user notification, breach assessment —
   is designed once CP1 approves a hosting/privacy posture and there is a
   real user base to protect.

## Migrations

Migrations are plain, versioned SQL files under `supabase/migrations/`,
applied in filename (timestamp) order. `pnpm exec supabase db reset` is the
repeatability check: it must apply every migration to an empty database
without error. Never edit a migration that has already been applied anywhere
outside a fresh local reset; add a new migration instead.
