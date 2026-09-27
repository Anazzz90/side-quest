# Side Quest website foundation

This directory contains the CP3/CP4 development build. It is separate from `../prototype`, which remains the browser-only clickable prototype.

## Stack baseline

- Next.js App Router with TypeScript for the web application.
- Supabase local development for PostgreSQL, PostGIS, Auth, and later Storage/Realtime integration.
- Versioned SQL migrations under `supabase/migrations/`.

A hosted Supabase project also exists (`wmaqfsetovfoowpwbqfr`, ap-southeast-1) with the same CP3/CP4 schema pushed to it (`supabase db push`) for review — it holds no real user data, is not what `pnpm dev` points at by default, and should stay that way until CP1 privacy/hosting decisions land. No secrets or real user records belong in this repository.

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

Development and staging use synthetic data only. The application shell, development-only email/password and Google sign-in, an account-standing page, quest creation/discovery, the join-request lifecycle, a gated quest room (private meeting instructions + chat), basic in-app notifications, and a real interactive map are wired up. Moderation tooling is not (blocking is enforced server-side but has no UI yet); discovery still points at synthetic fixture places (`supabase/seed.sql`) and a personal-account Mapbox token, not a reviewed venue list or a production map account. The health route returns only a generic status.

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

## Post-CP4: hosted project + Google sign-in

- Linked and pushed the CP3/CP4 schema to a hosted Supabase project (`supabase db push` + `--include-seed`); verified RLS and the security-definer functions behave identically there (anonymous reads denied, unauthenticated RPC calls rejected).
- Wired Google sign-in end to end: `supabase/config.toml` declares the provider with a real client ID, an `/auth/callback` route exchanges the OAuth code for a session, and both sign-in and sign-up pages offer "Continue with Google" (gated by the same `AUTH_ALLOW_SIGNUP` flag as email/password, since it's equally a registration path). The profile-creation trigger now also reads Google's `full_name`/`name` metadata, not just our own `display_name` key.
- The Google **client secret** is not in this repo: locally it's read via `env(GOOGLE_CLIENT_SECRET)` (export it in your shell before `pnpm db:start` — the Supabase CLI does not read `.env.local` itself); on the hosted project it's entered directly in the dashboard.
- See [docs/SECURITY.md](./docs/SECURITY.md) for a note on `supabase config push` vs `db push` — the former writes live hosted config and was triggered once by accident during this setup (a placeholder secret was pushed to the hosted project's Google provider; harmless, but worth the reminder).
- Replaced the illustrative map placeholder with a real Mapbox map (Checkpoint 0 decision D-05: Mapbox approved and integrated). A new read-only database function (`list_published_quest_points`) exposes published-quest coordinates via each quest's meetup place — still only fixed venue locations, never a device's position. Falls back to the placeholder if `NEXT_PUBLIC_MAPBOX_TOKEN` is unset. Verified with Playwright: the map renders, paints its canvas, shows a quest pin, and loads with no console errors.
- The Mapbox token in use is a personal-account public token, fine for development (it's meant to be public, restrict it by URL rather than keeping it secret) but should be swapped for a production-owned one before launch.

Still open, and intentionally deferred: reviewed public venues (D-04), a production-owned Mapbox account/token, a durable/shared rate limiter, background quest-expiry (currently computed at query time, not a stored transition), realtime chat delivery (CP5), report/block UI, and production use of the hosted project (pending the CP1 privacy/age-assurance review).

## Design alignment: accepted UI/UX spec

The discovery homepage was rebuilt to match `prototype/SideQuest_UI_UX_Design_Specification.docx` (the accepted design baseline), rather than the earlier ad hoc sidebar layout:

- Map-first layout: the map fills the screen under a slim top bar, with search, category filter chips, and a quest-create button floating over it (spec section 5, "Map home specification"). The quest list lives in a collapsible bottom-dock sheet (a floating panel on desktop, a drag-handle sheet on phone), with a separate "Chats" affordance next to it.
- Day/night map only, no manual toggle: the page itself always stays in the spec's light tokens (coral/violet/lime, section 7); only the Mapbox style switches (`light-v11` / `dark-v11`), automatically, based on the actual time in Dubai (7pm-6am counts as night) rather than the visitor's device clock, timezone, or dark-mode preference — computed once per page load in `map-experience.tsx`.
- Plus Jakarta Sans (the spec's typeface) is loaded via `next/font/google`.
- Quest categories were realigned to the spec's list — All, Movies, Going out, Hiking, Food, Study, Games, Arts, Sports, plus Favors for favor-type quests — replacing the earlier placeholder set (a migration relabels existing categories in place rather than deleting them, so any quest already referencing one keeps working). Each category has a matching emoji and a distinct map-pin color, so category is never conveyed by color alone.
- Verified with Playwright screenshots (day/night, desktop/mobile) and a full functional regression (quest creation → discovery → request → accept → gated room) to confirm the redesign didn't change any underlying behavior, plus one real CSS specificity bug caught and fixed along the way (a later, equal-specificity rule was silently overriding the selected category chip's background, leaving invisible white-on-white text).

Not carried over from the spec, out of scope for the current build: the separate "Filter" modal for combining categories with time/distance/group-size (category chips alone cover single-category filtering today), and the feed/leaderboard/profile screens the prototype also describes, since those don't exist in the real app yet (later checkpoints).
