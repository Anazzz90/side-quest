-- Google sign-in populates raw_user_meta_data with 'full_name'/'name' (and
-- 'avatar_url'), not our own 'display_name' key used by the email/password
-- sign-up form. Widen the fallback chain so a Google account holder gets
-- their real name instead of falling through to the email-local-part
-- default every time.
create or replace function public.handle_new_user()
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
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      split_part(new.email, '@', 1),
      'New account'
    )
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;
