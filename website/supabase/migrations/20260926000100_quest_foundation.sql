-- CP4 foundation: quest creation, discovery, join lifecycle, gated room
-- chat, notifications, and blocks. Uses the CP3 geographic_areas,
-- meetup_places, quest_categories, and user_profiles tables. All writes
-- that need an authorization or consistency check (join requests, host
-- decisions, withdrawals) go through security-definer functions rather
-- than raw table policies, the same pattern CP3 used for account_status.

create type public.quest_status as enum ('draft', 'published', 'cancelled');
create type public.quest_type as enum ('activity', 'favor');
create type public.proof_rule as enum ('host_confirmation', 'photo_evidence', 'none');
create type public.join_request_status as enum ('pending', 'accepted', 'declined', 'withdrawn');

create table public.quests (
  id uuid primary key default gen_random_uuid(),
  host_user_id uuid not null references public.user_profiles(user_id) on delete cascade,
  area_id uuid not null references public.geographic_areas(id) on delete restrict,
  category_id uuid not null references public.quest_categories(id) on delete restrict,
  quest_type public.quest_type not null,
  meetup_place_id uuid not null references public.meetup_places(id) on delete restrict,
  title text not null check (char_length(title) between 3 and 80),
  description text not null check (char_length(description) between 1 and 1000),
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  capacity int not null check (capacity between 1 and 20),
  cost_note text check (cost_note is null or char_length(cost_note) <= 200),
  accessibility_notes text check (accessibility_notes is null or char_length(accessibility_notes) <= 500),
  proof_rule public.proof_rule not null default 'host_confirmation',
  expires_at timestamptz not null,
  favor_ack boolean not null default false,
  status public.quest_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quest_schedule_order check (scheduled_end > scheduled_start),
  constraint quest_expiry_order check (expires_at <= scheduled_start)
);

-- Private meeting instructions live in their own table so row-level
-- security can keep them hidden from a pending requester at the database
-- level, not just in the UI. Only the host and an accepted participant can
-- read this row (see is_quest_member below).
create table public.quest_private_instructions (
  quest_id uuid primary key references public.quests(id) on delete cascade,
  instructions text not null check (char_length(instructions) between 1 and 1000),
  updated_at timestamptz not null default now()
);

create table public.quest_join_requests (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.quests(id) on delete cascade,
  requester_user_id uuid not null references public.user_profiles(user_id) on delete cascade,
  status public.join_request_status not null default 'pending',
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references public.user_profiles(user_id) on delete set null,
  unique (quest_id, requester_user_id)
);

create table public.quest_room_messages (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.quests(id) on delete cascade,
  sender_user_id uuid not null references public.user_profiles(user_id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table public.user_blocks (
  blocker_user_id uuid not null references public.user_profiles(user_id) on delete cascade,
  blocked_user_id uuid not null references public.user_profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_user_id, blocked_user_id),
  constraint user_blocks_not_self check (blocker_user_id <> blocked_user_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(user_id) on delete cascade,
  type text not null check (char_length(type) between 1 and 60),
  quest_id uuid references public.quests(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index quests_area_status_idx on public.quests (area_id, status);
create index quests_host_idx on public.quests (host_user_id);
create index quest_join_requests_quest_status_idx on public.quest_join_requests (quest_id, status);
create index quest_join_requests_requester_idx on public.quest_join_requests (requester_user_id);
create index quest_room_messages_quest_created_idx on public.quest_room_messages (quest_id, created_at);
create index notifications_user_unread_idx on public.notifications (user_id, read_at);

alter table public.quests enable row level security;
alter table public.quest_private_instructions enable row level security;
alter table public.quest_join_requests enable row level security;
alter table public.quest_room_messages enable row level security;
alter table public.user_blocks enable row level security;
alter table public.notifications enable row level security;

-- ---------------------------------------------------------------------
-- Read policies for the CP3 reference tables discovery/creation need.
-- These were intentionally left default-deny in CP3; CP4 is the feature
-- that needs them, per the CP3 exit note.
-- ---------------------------------------------------------------------

create policy "geographic_areas_select_active"
  on public.geographic_areas for select
  to authenticated
  using (status = 'active');

create policy "meetup_places_select_active"
  on public.meetup_places for select
  to authenticated
  using (status = 'active');

create policy "quest_categories_select_enabled"
  on public.quest_categories for select
  to authenticated
  using (enabled = true);

-- ---------------------------------------------------------------------
-- Membership helper. A user is a quest's member if they host it or hold
-- an accepted join request for it. Used to gate private instructions and
-- room messages.
-- ---------------------------------------------------------------------

create function public.is_quest_member(p_quest_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.quests q
    where q.id = p_quest_id and q.host_user_id = p_user_id
  ) or exists (
    select 1 from public.quest_join_requests r
    where r.quest_id = p_quest_id and r.requester_user_id = p_user_id and r.status = 'accepted'
  );
$$;

-- These two exist only to break a policy cycle: quests' "can a requester
-- see this quest" policy needs to look at quest_join_requests, and
-- quest_join_requests' "can the host see this request" policy needs to
-- look at quests. Two ordinary (non-definer) policies cross-referencing
-- each other's protected table sends Postgres's RLS evaluation into
-- infinite recursion. A security-definer function runs as the table
-- owner, which bypasses row-level security for its own query, so the
-- lookup happens once and does not re-trigger the calling policy.
create function public.user_has_join_request(p_quest_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.quest_join_requests r
    where r.quest_id = p_quest_id and r.requester_user_id = p_user_id
  );
$$;

create function public.user_hosts_quest(p_quest_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.quests q
    where q.id = p_quest_id and q.host_user_id = p_user_id
  );
$$;

-- ---------------------------------------------------------------------
-- quests
-- ---------------------------------------------------------------------

create policy "quests_select_published"
  on public.quests for select
  to authenticated
  using (status = 'published');

create policy "quests_select_own"
  on public.quests for select
  to authenticated
  using (host_user_id = auth.uid());

create policy "quests_select_requested"
  on public.quests for select
  to authenticated
  using (public.user_has_join_request(id, auth.uid()));

create policy "quests_insert_own"
  on public.quests for insert
  to authenticated
  with check (host_user_id = auth.uid());

create policy "quests_update_own"
  on public.quests for update
  to authenticated
  using (host_user_id = auth.uid())
  with check (host_user_id = auth.uid());

-- No delete policy: hosts cancel a quest (status = 'cancelled') rather
-- than deleting it, preserving join-request and audit history.

-- Validate cross-table consistency the column check constraints above
-- cannot express, and stamp updated_at. Runs before the transition guard
-- below so a rejected category/area/place never reaches it.
create function public.validate_quest_foundation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_category quest_categories;
  v_area geographic_areas;
  v_place meetup_places;
begin
  select * into v_category from quest_categories where id = new.category_id;
  if not found or not v_category.enabled or v_category.quest_type <> new.quest_type::text then
    raise exception 'category is not enabled for this quest type';
  end if;

  select * into v_area from geographic_areas where id = new.area_id;
  if not found or v_area.status <> 'active' then
    raise exception 'area is not active';
  end if;

  select * into v_place from meetup_places where id = new.meetup_place_id;
  if not found or v_place.status <> 'active' or v_place.area_id <> new.area_id then
    raise exception 'meetup place is not an active place in this area';
  end if;

  if new.quest_type = 'favor' and not new.favor_ack then
    raise exception 'favor quests require prohibited-favor guidance acknowledgement';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger validate_quest_foundation_trigger
  before insert or update on public.quests
  for each row execute function public.validate_quest_foundation();

-- Restrict status transitions and prevent shrinking capacity below the
-- number of already-accepted participants. Row-level security authorizes
-- *who* can update their own quest; this authorizes *what* they can turn
-- it into.
create function public.guard_quest_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_accepted_count int;
begin
  if old.status = 'cancelled' and new.status <> 'cancelled' then
    raise exception 'a cancelled quest cannot be reopened';
  end if;
  if old.status = 'published' and new.status = 'draft' then
    raise exception 'a published quest cannot return to draft';
  end if;

  if new.capacity < old.capacity then
    select count(*) into v_accepted_count
    from quest_join_requests
    where quest_id = new.id and status = 'accepted';
    if new.capacity < v_accepted_count then
      raise exception 'capacity cannot drop below the number of accepted participants';
    end if;
  end if;

  return new;
end;
$$;

create trigger guard_quest_transition_trigger
  before update on public.quests
  for each row execute function public.guard_quest_transition();

-- ---------------------------------------------------------------------
-- quest_private_instructions: host/accepted-participant read only. No
-- client insert/update/delete policy — the host sets these through
-- set_private_instructions() below, which checks host ownership itself.
-- ---------------------------------------------------------------------

create policy "quest_private_instructions_select_member"
  on public.quest_private_instructions for select
  to authenticated
  using (public.is_quest_member(quest_id, auth.uid()));

create function public.set_private_instructions(p_quest_id uuid, p_instructions text)
returns public.quest_private_instructions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quest quests;
  v_row quest_private_instructions;
begin
  select * into v_quest from quests where id = p_quest_id;
  if not found or v_quest.host_user_id <> auth.uid() then
    raise exception 'only the host can set private meeting instructions';
  end if;

  insert into quest_private_instructions (quest_id, instructions)
  values (p_quest_id, p_instructions)
  on conflict (quest_id) do update set instructions = excluded.instructions, updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

-- ---------------------------------------------------------------------
-- quest_join_requests: select-only policies for direct table reads.
-- Every write (create, accept/decline, withdraw) goes through a
-- security-definer function so eligibility, duplicate-prevention, and
-- atomic capacity checks cannot be bypassed by calling the table
-- directly.
-- ---------------------------------------------------------------------

create policy "quest_join_requests_select_participant_or_host"
  on public.quest_join_requests for select
  to authenticated
  using (
    requester_user_id = auth.uid()
    or public.user_hosts_quest(quest_id, auth.uid())
  );

create function public.request_to_join(p_quest_id uuid)
returns public.quest_join_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quest quests;
  v_uid uuid := auth.uid();
  v_existing quest_join_requests;
begin
  if v_uid is null then
    raise exception 'must be signed in';
  end if;

  select * into v_quest from quests where id = p_quest_id for update;
  if not found then
    raise exception 'quest not found';
  end if;

  if v_quest.host_user_id = v_uid then
    raise exception 'hosts cannot request to join their own quest';
  end if;

  if v_quest.status <> 'published' then
    raise exception 'quest is not open for requests';
  end if;

  if v_quest.expires_at <= now() then
    raise exception 'quest has expired';
  end if;

  if exists (
    select 1 from user_blocks
    where (blocker_user_id = v_quest.host_user_id and blocked_user_id = v_uid)
       or (blocker_user_id = v_uid and blocked_user_id = v_quest.host_user_id)
  ) then
    raise exception 'unable to request to join this quest';
  end if;

  select * into v_existing from quest_join_requests where quest_id = p_quest_id and requester_user_id = v_uid;

  if found then
    if v_existing.status in ('pending', 'accepted') then
      raise exception 'you already have an active request for this quest';
    end if;
    update quest_join_requests
      set status = 'pending', decided_at = null, decided_by = null, created_at = now()
      where id = v_existing.id
      returning * into v_existing;
  else
    insert into quest_join_requests (quest_id, requester_user_id, status)
    values (p_quest_id, v_uid, 'pending')
    returning * into v_existing;
  end if;

  insert into notifications (user_id, type, quest_id, data)
  values (v_quest.host_user_id, 'join_request_created', v_quest.id, jsonb_build_object('quest_title', v_quest.title));

  return v_existing;
end;
$$;

create function public.decide_join_request(p_request_id uuid, p_decision public.join_request_status)
returns public.quest_join_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request quest_join_requests;
  v_quest quests;
  v_accepted_count int;
begin
  if p_decision not in ('accepted', 'declined') then
    raise exception 'invalid decision';
  end if;

  select * into v_request from quest_join_requests where id = p_request_id for update;
  if not found then
    raise exception 'request not found';
  end if;

  select * into v_quest from quests where id = v_request.quest_id for update;
  if not found then
    raise exception 'quest not found';
  end if;

  if v_quest.host_user_id <> auth.uid() then
    raise exception 'only the host can decide join requests';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'request is not pending';
  end if;

  if p_decision = 'accepted' then
    select count(*) into v_accepted_count
    from quest_join_requests
    where quest_id = v_quest.id and status = 'accepted';
    if v_accepted_count >= v_quest.capacity then
      raise exception 'quest is full';
    end if;
  end if;

  update quest_join_requests
    set status = p_decision, decided_at = now(), decided_by = auth.uid()
    where id = p_request_id
    returning * into v_request;

  insert into notifications (user_id, type, quest_id, data)
  values (
    v_request.requester_user_id,
    case p_decision when 'accepted' then 'join_request_accepted' else 'join_request_declined' end,
    v_quest.id,
    jsonb_build_object('quest_title', v_quest.title)
  );

  return v_request;
end;
$$;

create function public.withdraw_join_request(p_request_id uuid)
returns public.quest_join_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request quest_join_requests;
begin
  select * into v_request from quest_join_requests where id = p_request_id for update;
  if not found then
    raise exception 'request not found';
  end if;

  if v_request.requester_user_id <> auth.uid() then
    raise exception 'not your request';
  end if;

  if v_request.status not in ('pending', 'accepted') then
    raise exception 'this request cannot be withdrawn';
  end if;

  update quest_join_requests
    set status = 'withdrawn', decided_at = now(), decided_by = auth.uid()
    where id = p_request_id
    returning * into v_request;

  return v_request;
end;
$$;

revoke execute on function public.request_to_join(uuid) from public;
revoke execute on function public.decide_join_request(uuid, public.join_request_status) from public;
revoke execute on function public.withdraw_join_request(uuid) from public;
revoke execute on function public.set_private_instructions(uuid, text) from public;
grant execute on function public.request_to_join(uuid) to authenticated;
grant execute on function public.decide_join_request(uuid, public.join_request_status) to authenticated;
grant execute on function public.withdraw_join_request(uuid) to authenticated;
grant execute on function public.set_private_instructions(uuid, text) to authenticated;

-- ---------------------------------------------------------------------
-- quest_room_messages: host or accepted participant only, enforced on
-- every read and write.
-- ---------------------------------------------------------------------

create policy "quest_room_messages_select_member"
  on public.quest_room_messages for select
  to authenticated
  using (public.is_quest_member(quest_id, auth.uid()));

create policy "quest_room_messages_insert_member"
  on public.quest_room_messages for insert
  to authenticated
  with check (sender_user_id = auth.uid() and public.is_quest_member(quest_id, auth.uid()));

-- ---------------------------------------------------------------------
-- user_blocks: a user manages only their own outgoing blocks.
-- ---------------------------------------------------------------------

create policy "user_blocks_select_own"
  on public.user_blocks for select
  to authenticated
  using (blocker_user_id = auth.uid());

create policy "user_blocks_insert_own"
  on public.user_blocks for insert
  to authenticated
  with check (blocker_user_id = auth.uid());

create policy "user_blocks_delete_own"
  on public.user_blocks for delete
  to authenticated
  using (blocker_user_id = auth.uid());

-- ---------------------------------------------------------------------
-- notifications: read own; only read_at may be changed by the client
-- (marking as read). Rows are otherwise created only by the
-- security-definer functions above.
-- ---------------------------------------------------------------------

create policy "notifications_select_own"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

create policy "notifications_update_own"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create function public.guard_notification_edit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.type <> old.type or new.quest_id is distinct from old.quest_id
     or new.data <> old.data or new.user_id <> old.user_id then
    raise exception 'only read_at may be updated on a notification';
  end if;
  return new;
end;
$$;

create trigger guard_notification_edit_trigger
  before update on public.notifications
  for each row execute function public.guard_notification_edit();
