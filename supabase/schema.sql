-- Schema for "Movies: based on true story".
-- Run as a single block in Supabase → SQL Editor after creating the project.
-- The published page expects this schema before Supabase login can load or save marks.

-- ─────────────────────────────────────────────────────────────
-- 1. Profiles: human names instead of uuids
-- ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id    uuid primary key references auth.users(id) on delete cascade,
  name  text not null,
  color text not null default 'slate'   -- ira | olena | alex | laverka
);

alter table public.profiles enable row level security;

-- New Supabase projects can keep "Automatically expose new tables" disabled.
-- Expose only the operations the signed-in client actually needs.
revoke all on table public.profiles from anon, authenticated;
grant select, update on table public.profiles to authenticated;
grant all on table public.profiles to service_role;

drop policy if exists "profiles: read all" on public.profiles;
create policy "profiles: read all" on public.profiles
  for select to authenticated using (true);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- The profile is created together with the account.
-- security definer, because at insert time the user does not yet pass RLS.
-- set search_path = '' is Supabase's own recommendation against search-path hijacking.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Safe to run even if Auth users were created before this schema.
insert into public.profiles (id, name)
select id, coalesce(nullif(split_part(coalesce(email, ''), '@', 1), ''), 'user')
from auth.users
on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────
-- 2. Marks: private to each person, keyed by person + film
-- ─────────────────────────────────────────────────────────────
create table if not exists public.marks (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  imdb_id    text        not null,
  watched    boolean     not null default false,
  together   boolean     not null default false,
  no_translation boolean not null default false,
  rating     smallint    check (rating between 1 and 5),
  updated_at timestamptz not null default now(),
  primary key (user_id, imdb_id)
);

alter table public.marks add column if not exists no_translation boolean not null default false;

alter table public.marks enable row level security;

revoke all on table public.marks from anon, authenticated;
grant select, insert, update, delete on table public.marks to authenticated;
grant all on table public.marks to service_role;

-- Everyone signed in can read: that is the point of a shared catalogue.
-- To make ratings private instead, narrow this to using (auth.uid() = user_id).
drop policy if exists "marks: read all" on public.marks;
create policy "marks: read all" on public.marks
  for select to authenticated using (true);

drop policy if exists "marks: insert own" on public.marks;
create policy "marks: insert own" on public.marks
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "marks: update own" on public.marks;
create policy "marks: update own" on public.marks
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "marks: delete own" on public.marks;
create policy "marks: delete own" on public.marks
  for delete to authenticated
  using (auth.uid() = user_id);

create index if not exists marks_imdb_idx on public.marks (imdb_id);

-- ─────────────────────────────────────────────────────────────
-- 3. Comments: signed-in group members can read all and add their own
-- ─────────────────────────────────────────────────────────────
create table if not exists public.comments (
  id         bigint generated always as identity primary key,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  imdb_id    text        not null,
  body       text        not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

revoke all on table public.comments from anon, authenticated;
grant select, insert on table public.comments to authenticated;
grant all on table public.comments to service_role;
revoke all on sequence public.comments_id_seq from anon, authenticated;
grant usage, select on sequence public.comments_id_seq to authenticated;
grant all on sequence public.comments_id_seq to service_role;

drop policy if exists "comments: read all" on public.comments;
create policy "comments: read all" on public.comments
  for select to authenticated using (true);

drop policy if exists "comments: insert own" on public.comments;
create policy "comments: insert own" on public.comments
  for insert to authenticated
  with check (auth.uid() = user_id);

create index if not exists comments_imdb_created_idx
  on public.comments (imdb_id, created_at);

-- ─────────────────────────────────────────────────────────────
-- 4. Per-film summary
-- ─────────────────────────────────────────────────────────────
-- security_invoker = true is required: without it the view runs with the
-- owner's rights and silently bypasses RLS.
create or replace view public.film_ratings with (security_invoker = true) as
select imdb_id,
       count(*) filter (where watched)  as watched_count,
       round(avg(rating)::numeric, 1)   as avg_rating
from public.marks
group by imdb_id;

revoke all on table public.film_ratings from anon, authenticated;
grant select on table public.film_ratings to authenticated;
grant all on table public.film_ratings to service_role;
