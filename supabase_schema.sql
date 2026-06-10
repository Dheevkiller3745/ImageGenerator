-- =========================
-- 0) Extensions
-- =========================
create extension if not exists "uuid-ossp";

-- =========================
-- 1) Tables (idempotent)
-- =========================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.user_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  device_info text,
  ip_address text,
  logged_in_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.generations_log (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  prompt text not null,
  seed text,
  engine text not null,
  aspect_ratio text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.leads_log (
  id uuid default uuid_generate_v4() primary key,
  name text,
  email text,
  target_prompt text not null,
  whatsapp_uri text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================
-- 2) Enable RLS
-- =========================
alter table public.profiles enable row level security;
alter table public.user_sessions enable row level security;
alter table public.generations_log enable row level security;
alter table public.leads_log enable row level security;

-- =========================
-- 3) RLS Policies (drop + recreate)
-- =========================

-- Profiles
drop policy if exists "Allow users to read their own profile" on public.profiles;
create policy "Allow users to read their own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "Allow users to update their own profile" on public.profiles;
create policy "Allow users to update their own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

drop policy if exists "Allow admin reads on profiles" on public.profiles;
create policy "Allow admin reads on profiles"
  on public.profiles
  for select
  using (auth.jwt() ->> 'email' like '%@statics.agency');

-- User Sessions
drop policy if exists "Allow users to read their own sessions" on public.user_sessions;
create policy "Allow users to read their own sessions"
  on public.user_sessions
  for select
  using (auth.uid() = user_id);

drop policy if exists "Allow admin reads on sessions" on public.user_sessions;
create policy "Allow admin reads on sessions"
  on public.user_sessions
  for select
  using (auth.jwt() ->> 'email' like '%@statics.agency');

-- Generations Log
drop policy if exists "Allow admin reads on generations_log" on public.generations_log;
create policy "Allow admin reads on generations_log"
  on public.generations_log
  for select
  using (auth.jwt() ->> 'email' like '%@statics.agency');

drop policy if exists "Allow inserts on generations_log" on public.generations_log;
create policy "Allow inserts on generations_log"
  on public.generations_log
  for insert
  with check (auth.uid() = user_id or user_id is null);

-- Leads Log
drop policy if exists "Allow admin reads on leads_log" on public.leads_log;
create policy "Allow admin reads on leads_log"
  on public.leads_log
  for select
  using (auth.jwt() ->> 'email' like '%@statics.agency');

drop policy if exists "Allow inserts on leads_log" on public.leads_log;
create policy "Allow inserts on leads_log"
  on public.leads_log
  for insert
  with check (true);

-- =========================
-- 4) Trigger Function (create or replace)
-- =========================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = excluded.display_name,
    avatar_url = excluded.avatar_url;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Keep function locked down (only trigger should use it)
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon, authenticated;

-- =========================
-- 5) Trigger (drop + recreate)
-- =========================
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();
