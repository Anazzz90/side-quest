# Privacy-by-default storage (CP3/CP4 foundation)

This documents the privacy posture for the tables and flows that exist
today. Completion evidence upload is still CP5 scope and is not built yet.

## Quest chat and private meeting instructions (CP4)

`quest_room_messages` and `quest_private_instructions` (added in CP4) are
gated by row-level security on `is_quest_member()`: only the host and an
accepted participant can read or write them — a pending or declined
requester's direct API calls return nothing, not just a hidden UI element.
Message bodies are plain text; there is no read receipt, delivery tracking,
or analytics event tied to message content. Retention for chat history
after a quest closes is not yet decided (Checkpoint 0 decision D-11 covers
closed-room access/retention) — messages currently persist indefinitely via
`on delete cascade` from the quest, which only removes them if the quest
itself is deleted (quests are cancelled, not deleted, so in practice chat
history is kept). This should be revisited when D-11 is settled.

## No live location history

There is no table that stores a user's current or historical device
location, and no code path collects one. `geographic_areas` describes
operating areas (polygons) and `meetup_places` describes fixed, curated
public venues (`extensions.geography(Point, 4326)`) — both describe *places*,
never a *person's* position. The product direction (Checkpoint 0 record)
and the Database Design Document both rule out a live location table by
design; CP3 does not introduce one.

## Private media storage design (not yet built)

No media/evidence table or storage bucket exists in CP3 — quests, join
requests, and completion evidence are CP4/CP5 scope. The design this
scaffold commits to, so later checkpoints build consistently:

- Files live in Supabase Storage, in a **private** (non-public) bucket, never
  in the relational database.
- The database stores only the storage key, uploader, associated quest/report,
  a processing status, and a retention state — never the file bytes.
- Access is via short-lived signed URLs issued server-side after an
  authorization check (e.g. "is an accepted participant of this quest" or
  "is a moderator reviewing this report"), never a public bucket URL.
- Metadata stripping (EXIF/GPS and similar) happens server-side before a file
  is persisted, so an uploaded photo cannot leak a location or device
  fingerprint the product doesn't ask for.

## Export and deletion workflow

Today, the only real personal-data table is `user_profiles`
(`user_id`, `display_name`, `age_attested_at`, `account_status`,
`leaderboard_opt_in`, timestamps), linked 1:1 to Supabase Auth's `auth.users`.

- **Deletion:** `user_profiles.user_id` references `auth.users(id) on delete
  cascade`. Deleting the `auth.users` row (via the Supabase Auth admin API,
  using the service-role key, server-side only) deletes the profile row in
  the same transaction. A `before delete` trigger on `auth.users`
  (`log_account_deletion`, in `20260925000300_deletion_audit.sql`) records an
  `account_deleted` audit event before the cascade runs; the audit event's
  actor reference is set to null once the profile row it pointed to is gone
  (via `moderation_audit_events.actor_user_id ... on delete set null`), so
  the deletion is auditable without leaving a live pointer to deleted data.
- **Export:** No self-serve export endpoint exists yet — there is no
  account-settings surface to put it behind. For local development and
  review, an account's full data can be exported manually:

  ```sh
  psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
    -c "\copy (select * from public.user_profiles where user_id = '<uuid>') to 'profile-export.csv' csv header"
  ```

  A self-serve export/deletion UI, and the retention rules for data created
  in CP4/CP5 (join requests, chat, evidence, ledger entries), are tracked
  against Checkpoint 0 decision D-07 and built alongside those features.

## Data-minimized logging and analytics boundaries

- Server logs from the local Supabase stack and the Next.js dev/build
  process are the only logs that exist today; see
  [SECURITY.md](./SECURITY.md#logging-and-alerting-current-state).
- No analytics collection is wired into the application yet. When it is
  added, it must not log message bodies, private meeting instructions,
  evidence content, or precise location — this boundary is a CP3 commitment
  that later checkpoints are expected to honor, not something enforced by
  code today because the features that would violate it don't exist yet.
