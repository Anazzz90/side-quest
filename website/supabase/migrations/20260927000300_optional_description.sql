-- Quest description is useful but shouldn't block posting a quest -- a
-- title, schedule, place, and private meeting instructions already convey
-- enough for participants to decide whether to request to join.
alter table public.quests
  alter column description drop not null;

alter table public.quests
  drop constraint quests_description_check;

alter table public.quests
  add constraint quests_description_check
  check (description is null or char_length(description) <= 1000);
