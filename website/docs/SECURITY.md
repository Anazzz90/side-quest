# Secrets, data access, and incident handling (development scaffold)

This describes the CP3/CP4 foundation. It will be revised once CP1 hosting
and privacy decisions are approved and real user data is authorized.

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
- `optional_communities`, `community_memberships`, and
  `moderation_audit_events` remain default-deny: RLS is on and no client
  policy exists yet, pending the checkpoint that builds their features.

### CP4: quests, join requests, chat, blocks, notifications

CP4 added the read policies CP3 deferred for `geographic_areas`,
`meetup_places`, and `quest_categories` (each now select-only, scoped to
`status = 'active'` / `enabled = true`), plus a new set of tables
(`supabase/migrations/20260926000100_quest_foundation.sql`):

- **`quests`**: a signed-in user can see a quest if it is `published`, if
  they host it, or if they hold any join request against it (so a declined
  requester can still see what they applied to). Only the host can insert or
  update their own quest. There is no delete policy — a quest is cancelled,
  not removed, so join-request and chat history survive. Two triggers guard
  what an update may do: `validate_quest_foundation` rejects a disabled
  category, an inactive area, or a meetup place outside that area (checks
  RLS can't express as column constraints), and `guard_quest_transition`
  blocks reopening a cancelled quest, moving a published quest back to
  draft, and shrinking capacity below the number of already-accepted
  participants.
- **`quest_join_requests`**: direct table access is select-only (a requester
  sees their own request; a host sees every request on their quest). Every
  write — creating a request, accepting/declining, withdrawing — goes
  through a `SECURITY DEFINER` function (`request_to_join`,
  `decide_join_request`, `withdraw_join_request`) so eligibility, duplicate
  prevention, and capacity can't be bypassed by writing to the table
  directly. `decide_join_request` re-checks the accepted count against
  `capacity` inside the same transaction (with `select ... for update` row
  locks on both the quest and the request) immediately before writing the
  decision, so two hosts (or two calls) cannot both accept past capacity.
- **`quest_private_instructions`**: a private, per-quest table so a pending
  requester cannot read the meeting instructions at the database level, not
  just in the UI — the select policy calls `is_quest_member()`, which is
  true only for the host or an accepted participant. There is no insert
  policy; the host sets it via `set_private_instructions()`, which checks
  host ownership itself.
- **`quest_room_messages`**: select and insert both require
  `is_quest_member()`. A pending requester gets a row-level-security
  rejection on `insert` and simply sees no rows on `select` — verified
  directly against the API (see the CP4 test notes below).
- **`user_blocks`**: a user can only see, create, or delete their own
  outgoing blocks. `request_to_join()` checks both directions (host blocked
  requester, or requester blocked host) before allowing a request.
- **`notifications`**: select/update scoped to `user_id = auth.uid()`.
  Rows are only ever inserted by the `SECURITY DEFINER` functions above.  A
  trigger (`guard_notification_edit`) allows a client update to change only
  `read_at`, rejecting any attempt to rewrite `type`, `quest_id`, or `data`.

**A note on policy recursion**: `quests`' "can a requester see this quest"
policy and `quest_join_requests`' "can the host see this request" policy
each need to look at the other table. Two ordinary RLS policies
cross-referencing each other's protected table that way sends Postgres's
policy evaluation into infinite recursion. The fix used here —
`user_has_join_request()` and `user_hosts_quest()` — is the same pattern as
`is_quest_member()`: a `SECURITY DEFINER` function, owned by the table
owner, does the lookup once without re-triggering RLS, and the policy calls
the function instead of querying the other table inline.

**Verified**, both directly against the local REST API and through a real
Playwright browser session driving the actual pages: cross-user profile and
quest isolation, capacity enforcement (a second accept past capacity is
rejected), duplicate join-request prevention, host self-join prevention,
block enforcement, the cancelled-quest-cannot-reopen and
capacity-cannot-shrink-below-accepted guards, chat/instructions access
denied before acceptance and granted immediately after, notification
creation on request/decision events, and the read-only-except-`read_at`
guard on notifications.

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

## The hosted project and `supabase config push`

A hosted Supabase project exists (linked via `supabase link`). Two CLI
commands touch it, and they are easy to confuse:

- `supabase db push` — applies pending migrations from `supabase/migrations/`
  to the hosted database. This is the safe, expected way to deploy schema
  changes, and was used to bring the hosted project's schema up to date
  with CP3/CP4.
- `supabase config push` — pushes `supabase/config.toml` (auth providers,
  redirect URLs, etc.) to the hosted project's **live configuration**,
  including secrets resolved from `env()` at the time it runs. **This
  happened once by accident** during CP4 Google sign-in setup, using a
  placeholder value for `GOOGLE_CLIENT_SECRET` that was only meant for a
  local test — it enabled the Google provider on the hosted project with a
  non-functional placeholder secret. Nothing was exposed (a placeholder is
  not a real credential), but it's a reminder that `config push` is a
  write to the real, live project, not a local-only operation, and should
  be run deliberately, not as a side effect of testing something else.
  Fix: enter the real secret directly in the hosted dashboard
  (Authentication → Providers → Google) — that overwrites whatever the CLI
  last pushed.
