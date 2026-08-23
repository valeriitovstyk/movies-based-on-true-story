-- Schema for "Movies: based on true story".
-- Run as a single block in Supabase → SQL Editor after creating the project.
-- Until it is run, the page works against the local stub (LocalBackend in index.html).

-- ─────────────────────────────────────────────────────────────
-- 1. Profiles: human names instead of uuids
-- ─────────────────────────────────────────────────────────────
create table if not exists profiles (
  id    uuid primary key references auth.users(id) on delete cascade,
  name  text not null,
  color text not null default 'slate'   -- ira | olena | alex | laverka
);

alter table profiles enable row level security;

create policy "profiles: read all" on profiles
  for select to authenticated using (true);

create policy "profiles: update own" on profiles
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

-- ─────────────────────────────────────────────────────────────
-- 2. Marks: private to each person, keyed by person + film
-- ─────────────────────────────────────────────────────────────
create table if not exists marks (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  imdb_id    text        not null,
  watched    boolean     not null default false,
  together   boolean     not null default false,
  rating     smallint    check (rating between 1 and 5),
  updated_at timestamptz not null default now(),
  primary key (user_id, imdb_id)
);

alter table marks enable row level security;

-- Everyone signed in can read: that is the point of a shared catalogue.
-- To make ratings private instead, narrow this to using (auth.uid() = user_id).
create policy "marks: read all" on marks
  for select to authenticated using (true);

create policy "marks: insert own" on marks
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "marks: update own" on marks
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "marks: delete own" on marks
  for delete to authenticated
  using (auth.uid() = user_id);

create index if not exists marks_imdb_idx on marks (imdb_id);

-- ─────────────────────────────────────────────────────────────
-- 3. Per-film summary
-- ─────────────────────────────────────────────────────────────
-- security_invoker = true is required: without it the view runs with the
-- owner's rights and silently bypasses RLS.
create or replace view film_ratings with (security_invoker = true) as
select imdb_id,
       count(*) filter (where watched)  as watched_count,
       round(avg(rating)::numeric, 1)   as avg_rating
from marks
group by imdb_id;
