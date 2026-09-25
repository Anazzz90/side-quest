# Local development setup

Development-only. There is no hosted, staging, or production environment yet;
those depend on CP1 hosting-region and privacy decisions
(`../../Checkpoint 0 Mobilization Record.md`, decisions D-06 and D-07).

## Resolved runtime versions

Recorded from the machine this scaffold was built and verified on:

| Tool | Version |
|---|---|
| Node.js | v24.11.1 |
| npm | 11.6.2 |
| pnpm | 12.6.0 |
| Docker | 29.4.2 (client), Docker Desktop |
| Supabase CLI | 2.117.0 (installed as a project devDependency) |
| PostgreSQL (local) | 15.8 via the Supabase CLI's `db.major_version = 15` |

Package versions are pinned in `package.json`/`pnpm-lock.yaml` after running
`pnpm install`; do not hand-edit the lockfile.

## Prerequisites

- Node.js 20+ (tested on 24.11.1).
- pnpm. If `pnpm` is not on PATH after `corepack enable`, install it directly:
  `npm install -g pnpm`, then make sure npm's global bin directory
  (`npm config get prefix`) is on PATH.
- Docker Desktop (or another Docker-compatible runtime) running and
  reachable — confirm with `docker ps`. The local Supabase stack needs this;
  keep it bound to localhost and never expose its ports beyond the
  development machine.

## First-time setup

```sh
pnpm install               # installs pinned dependencies, writes the lockfile
pnpm db:start              # starts local Postgres/PostGIS, Auth, Studio, etc.
cp .env.example .env.local # then fill in the local anon key pnpm db:start prints
pnpm dev                   # starts the app at http://localhost:3000
```

`pnpm db:start` prints a local API URL, anon key, and service-role key. Put
the **anon key only** into `.env.local` as `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
The service-role key is never placed in `.env.local`, never prefixed with
`NEXT_PUBLIC_`, and never referenced from any file under `src/app` that runs
in the browser — see [SECURITY.md](./SECURITY.md).

To enable the development sign-up form (disabled by default), also set in
`.env.local`:

```
AUTH_ALLOW_SIGNUP=true
```

This flag is force-disabled whenever `NODE_ENV=production`
(`src/lib/backend-config.ts`), independent of the environment variable, so
production registration cannot be turned on by configuration alone.

## Everyday commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Run the app locally with hot reload. |
| `pnpm build` | Production build; also runs the TypeScript check. |
| `pnpm typecheck` | Type-check without emitting or building. |
| `pnpm db:start` / `pnpm db:stop` | Start/stop the local Supabase stack. |
| `pnpm exec supabase db reset` | Drop and recreate the local database, replaying every migration in order — the way to confirm migrations are repeatable. |
| `pnpm exec supabase migration new <name>` | Scaffold a new versioned migration file. |

## Verifying the foundation after setup

1. `pnpm build` and `pnpm typecheck` complete with no errors.
2. `pnpm db:start` reports all local services healthy; `docker ps` shows the
   `supabase_*_side-quest-local` containers running.
3. `pnpm exec supabase db reset` re-applies both migrations
   (`supabase/migrations/`) to a fresh database with no errors — this is the
   "migrations are repeatable" exit-gate check.
4. Visiting `/api/health` returns `{"status":"ok"}`.
5. Visiting `/sign-up` with `AUTH_ALLOW_SIGNUP=true` creates a development
   account and profile row; `/account` then shows that account's standing.
   With the flag unset, `/sign-up` shows a disabled message instead of a form.
6. `grep -r "SUPABASE_SERVICE_ROLE" .next` after `pnpm build` returns nothing —
   see [SECURITY.md](./SECURITY.md) for what this confirms.

## Known local limitations (tracked, not blocking CP3)

- No hosted environment exists; deployment is out of scope until CP1
  hosting/privacy decisions are approved.
- The in-process rate limiter (`src/lib/rate-limit.ts`) resets on restart and
  does not share state across instances — adequate for a single local
  reviewer, not for a shared or hosted environment.
- Google sign-in is not wired yet; only email/password is implemented for
  local development. Enabling Google requires OAuth client credentials that
  do not belong in this repository.
