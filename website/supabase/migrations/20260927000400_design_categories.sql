-- Align quest categories with the accepted UI/UX design specification
-- (prototype/SideQuest_UI_UX_Design_Specification.docx, section 5):
-- All, Movies, Going out, Hiking, Food, Study, Games, Arts, Sports, plus
-- Favors as the standing favor-type category. Existing rows are relabeled
-- rather than replaced so any quest already referencing them (by foreign
-- key) keeps working; only genuinely new categories are inserted.

update public.quest_categories set slug = 'going-out', label = 'Going out' where slug = 'hangout';
update public.quest_categories set slug = 'study', label = 'Study' where slug = 'study-session';
update public.quest_categories set slug = 'sports', label = 'Sports' where slug = 'pickup-sport';
update public.quest_categories set slug = 'favors', label = 'Favors' where slug = 'small-favor';

insert into public.quest_categories (slug, label, quest_type, enabled)
values
  ('movies', 'Movies', 'activity', true),
  ('hiking', 'Hiking', 'activity', true),
  ('food', 'Food', 'activity', true),
  ('games', 'Games', 'activity', true),
  ('arts', 'Arts', 'activity', true)
on conflict (slug) do nothing;
