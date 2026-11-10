-- Noon: richer profiles. Profile photo, a one-line bio, favourite cuisines,
-- favourite dishes and spice tolerance.
-- Run AFTER 20261108010000_accounts_and_features.sql. Safe to run twice.

alter table public.profiles
  add column if not exists avatar_url         text,
  add column if not exists tagline            text,
  add column if not exists favourite_cuisines text[] not null default '{}',
  add column if not exists favourite_foods    text[] not null default '{}',
  add column if not exists spice_level        smallint;

alter table public.profiles drop constraint if exists profiles_tagline_length;
alter table public.profiles add constraint profiles_tagline_length
  check (char_length(tagline) <= 80);

alter table public.profiles drop constraint if exists profiles_avatar_url_length;
alter table public.profiles add constraint profiles_avatar_url_length
  check (char_length(avatar_url) <= 500);

-- Keep in sync with server/src/config/constants.js (CUISINES).
alter table public.profiles drop constraint if exists profiles_cuisines_check;
alter table public.profiles add constraint profiles_cuisines_check
  check (favourite_cuisines <@ array[
    'chinese', 'malay', 'indian', 'peranakan', 'japanese', 'korean', 'thai',
    'vietnamese', 'indonesian', 'western', 'italian', 'mexican',
    'middle_eastern', 'hawker', 'cafe', 'dessert'
  ]::text[]);

alter table public.profiles drop constraint if exists profiles_foods_count;
alter table public.profiles add constraint profiles_foods_count
  check (cardinality(favourite_foods) <= 12);

alter table public.profiles drop constraint if exists profiles_spice_level_check;
alter table public.profiles add constraint profiles_spice_level_check
  check (spice_level between 0 and 3);

-- ---------------------------------------------------------------------------
-- Profile photos. Public bucket so <img> tags work without signed URLs; only
-- the API (service role) can write to it. Files live at <user id>/<time>.webp
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
