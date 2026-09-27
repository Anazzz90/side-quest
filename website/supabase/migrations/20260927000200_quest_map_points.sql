-- CP4 map support: expose published-quest coordinates for the discovery
-- map. This is a plain (not SECURITY DEFINER) function, so it runs with
-- the caller's own row-level security -- it can only ever return what the
-- caller could already see via quests_select_published and
-- meetup_places_select_active. No new access is granted here.
create function public.list_published_quest_points(
  p_quest_type public.quest_type default null,
  p_category_id uuid default null,
  p_search text default null
)
returns table (
  id uuid,
  title text,
  category_label text,
  lng double precision,
  lat double precision
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    q.id,
    q.title,
    qc.label,
    extensions.st_x(mp.public_point::extensions.geometry) as lng,
    extensions.st_y(mp.public_point::extensions.geometry) as lat
  from quests q
  join meetup_places mp on mp.id = q.meetup_place_id
  join quest_categories qc on qc.id = q.category_id
  where q.status = 'published'
    and q.expires_at > now()
    and (p_quest_type is null or q.quest_type = p_quest_type)
    and (p_category_id is null or q.category_id = p_category_id)
    and (p_search is null or q.title ilike '%' || p_search || '%');
$$;

grant execute on function public.list_published_quest_points(public.quest_type, uuid, text) to authenticated;
