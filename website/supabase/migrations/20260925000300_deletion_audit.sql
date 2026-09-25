-- CP3 privacy-by-default foundation: record that an account was deleted
-- before cascading deletes remove the profile row, so there is an audit
-- trail even though no admin UI exists yet. This does not implement a
-- self-serve export/deletion flow (deferred to the checkpoint that adds an
-- account-settings surface); it establishes the auditable data path so that
-- workflow has something to build on.
create function public.log_account_deletion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.moderation_audit_events (actor_user_id, action, subject_type, subject_id, reason)
  values (old.id, 'account_deleted', 'user_profiles', old.id, 'auth.users row deleted');
  return old;
end;
$$;

create trigger on_auth_user_deleted
  before delete on auth.users
  for each row execute function public.log_account_deletion();
