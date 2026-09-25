-- CP3 identity foundation: self-service profile access and automatic
-- profile provisioning for the development-only sign-up flow.
-- No feature tables (quests, requests, chat, points) are authorized here;
-- those policies land alongside each feature in later checkpoints.

-- A signed-in account holder may read and maintain only their own profile.
-- There is no policy granting access to another user's profile row, and no
-- policy allowing anonymous (unauthenticated) access.
create policy "profiles_select_own"
  on public.user_profiles for select
  to authenticated
  using (auth.uid() = user_id);

create policy "profiles_update_own"
  on public.user_profiles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- The policy above authorizes an account holder to update their own row,
-- but row-level security cannot restrict which columns change within that
-- row. account_status is a moderation decision, not a user preference, so
-- a trigger blocks any non-privileged attempt to change it directly; only
-- server code running as the service role (moderation tooling, reviewed in
-- a later checkpoint) may change it.
create function public.prevent_self_account_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.account_status is distinct from old.account_status
     and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'account_status can only be changed by moderation tooling';
  end if;
  return new;
end;
$$;

create trigger guard_account_status_self_edit
  before update on public.user_profiles
  for each row execute function public.prevent_self_account_status_change();

-- Row creation happens through the handle_new_user trigger below, run with
-- definer privileges, rather than through a client-facing insert policy.
-- This keeps account_status and leaderboard_opt_in defaults out of client
-- control at creation time.

-- Automatically create a minimal profile row when a new auth.users record
-- is created (development-only sign-up). display_name falls back to the
-- local part of the email address if none was supplied at sign-up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (user_id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(new.email, '@', 1),
      'New account'
    )
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Audit account-standing changes going forward. Application code, not the
-- client, is responsible for calling this after a reviewed status change.
create function public.log_account_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.account_status is distinct from old.account_status then
    insert into public.moderation_audit_events (actor_user_id, action, subject_type, subject_id, reason)
    values (auth.uid(), 'account_status_changed', 'user_profiles', new.user_id,
            format('status: %s -> %s', old.account_status, new.account_status));
  end if;
  return new;
end;
$$;

create trigger on_account_status_change
  after update on public.user_profiles
  for each row execute function public.log_account_status_change();
