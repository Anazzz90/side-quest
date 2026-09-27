-- CP4 development fixtures ONLY. Every row here is synthetic and clearly
-- labeled as such. None of this is a reviewed public venue, an approved
-- category list, or an operating-area boundary decision — those remain
-- open per Checkpoint 0 decisions D-03, D-04, and D-05. This exists so
-- quest creation and discovery have something to point at locally; it
-- must never be treated as pre-approved content for a real launch.

insert into public.geographic_areas (id, slug, name, time_zone, status)
values ('00000000-0000-0000-0000-000000000001', 'dubai-academic-city', 'Dubai Academic City', 'Asia/Dubai', 'active')
on conflict (id) do nothing;

-- Matches the accepted design spec (prototype/SideQuest_UI_UX_Design_
-- Specification.docx, section 5): All, Movies, Going out, Hiking, Food,
-- Study, Games, Arts, Sports, plus Favors for favor-type quests.
insert into public.quest_categories (id, slug, label, quest_type, enabled)
values
  ('00000000-0000-0000-0000-0000000000a1', 'going-out', 'Going out', 'activity', true),
  ('00000000-0000-0000-0000-0000000000a2', 'study', 'Study', 'activity', true),
  ('00000000-0000-0000-0000-0000000000a3', 'sports', 'Sports', 'activity', true),
  ('00000000-0000-0000-0000-0000000000a4', 'movies', 'Movies', 'activity', true),
  ('00000000-0000-0000-0000-0000000000a5', 'hiking', 'Hiking', 'activity', true),
  ('00000000-0000-0000-0000-0000000000a6', 'food', 'Food', 'activity', true),
  ('00000000-0000-0000-0000-0000000000a7', 'games', 'Games', 'activity', true),
  ('00000000-0000-0000-0000-0000000000a8', 'arts', 'Arts', 'activity', true),
  ('00000000-0000-0000-0000-0000000000f1', 'favors', 'Favors', 'favor', true)
on conflict (slug) do nothing;

insert into public.meetup_places (id, area_id, label, public_point, public_access_verified_at, status)
values
  (
    '00000000-0000-0000-0000-0000000000e1',
    '00000000-0000-0000-0000-000000000001',
    'DEV FIXTURE — Community Plaza (not a reviewed venue)',
    extensions.st_setsrid(extensions.st_makepoint(55.4526, 25.1197), 4326)::extensions.geography,
    null,
    'active'
  ),
  (
    '00000000-0000-0000-0000-0000000000e2',
    '00000000-0000-0000-0000-000000000001',
    'DEV FIXTURE — Central Library Courtyard (not a reviewed venue)',
    extensions.st_setsrid(extensions.st_makepoint(55.4552, 25.1223), 4326)::extensions.geography,
    null,
    'active'
  ),
  (
    '00000000-0000-0000-0000-0000000000e3',
    '00000000-0000-0000-0000-000000000001',
    'DEV FIXTURE — Sports Court A (not a reviewed venue)',
    extensions.st_setsrid(extensions.st_makepoint(55.4501, 25.1178), 4326)::extensions.geography,
    null,
    'active'
  )
on conflict (id) do nothing;
