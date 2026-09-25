-- CP3 local foundation. No production records, credentials, or venue fixtures belong here.
create extension if not exists postgis with schema extensions;

create type public.account_status as enum ('active', 'restricted', 'suspended', 'closed');
create type public.area_status as enum ('draft', 'active', 'paused');
create type public.membership_status as enum ('pending', 'active', 'removed');

create table public.geographic_areas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  time_zone text not null default 'Asia/Dubai',
  boundary extensions.geography(MultiPolygon, 4326),
  status public.area_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  age_attested_at timestamptz,
  account_status public.account_status not null default 'active',
  leaderboard_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.optional_communities (
  id uuid primary key default gen_random_uuid(),
  area_id uuid references public.geographic_areas(id) on delete restrict,
  name text not null check (char_length(name) between 1 and 100),
  visibility text not null check (visibility in ('public', 'restricted')),
  status text not null default 'active' check (status in ('active', 'paused', 'closed')),
  created_at timestamptz not null default now()
);

create table public.community_memberships (
  community_id uuid not null references public.optional_communities(id) on delete cascade,
  user_id uuid not null references public.user_profiles(user_id) on delete cascade,
  status public.membership_status not null default 'pending',
  created_at timestamptz not null default now(),
  primary key (community_id, user_id)
);

create table public.meetup_places (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references public.geographic_areas(id) on delete restrict,
  label text not null check (char_length(label) between 1 and 120),
  public_point extensions.geography(Point, 4326) not null,
  public_access_verified_at timestamptz,
  accessibility_notes text,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quest_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  label text not null check (char_length(label) between 1 and 60),
  quest_type text not null check (quest_type in ('activity', 'favor')),
  enabled boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.moderation_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.user_profiles(user_id) on delete set null,
  action text not null check (char_length(action) between 1 and 80),
  subject_type text not null check (char_length(subject_type) between 1 and 60),
  subject_id uuid,
  reason text check (reason is null or char_length(reason) <= 500),
  created_at timestamptz not null default now()
);

create index meetup_places_area_status_idx on public.meetup_places (area_id, status);
create index meetup_places_public_point_gix on public.meetup_places using gist (public_point);
create index community_memberships_user_status_idx on public.community_memberships (user_id, status);
create index moderation_audit_events_actor_created_idx on public.moderation_audit_events (actor_user_id, created_at desc);

-- RLS with no policies is intentionally default-deny until each feature's
-- authorization rules are implemented and reviewed in later checkpoints.
alter table public.geographic_areas enable row level security;
alter table public.user_profiles enable row level security;
alter table public.optional_communities enable row level security;
alter table public.community_memberships enable row level security;
alter table public.meetup_places enable row level security;
alter table public.quest_categories enable row level security;
alter table public.moderation_audit_events enable row level security;
