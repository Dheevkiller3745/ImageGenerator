-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. User Sessions Table (multi-device tracking)
create table public.user_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  device_info text,
  ip_address text,
  logged_in_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Telemetry and Context Memory Log
create table public.generations_log (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade, -- nullable for fallback/anon
  prompt text not null,
  seed text,
  engine text not null,
  aspect_ratio text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Lead Conversions (WhatsApp Handoff Trigger)
create table public.leads_log (
  id uuid default uuid_generate_v4() primary key,
  name text,
  email text,
  target_prompt text not null,
  whatsapp_uri text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.user_sessions enable row level security;
alter table public.generations_log enable row level security;
alter table public.leads_log enable row level security;

-- 5. RLS Policies

-- Profiles
create policy "Allow users to read their own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Allow users to update their own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Allow admin reads on profiles" on public.profiles
  for select using (auth.jwt() ->> 'email' like '%@statics.agency');

-- User Sessions
create policy "Allow users to read their own sessions" on public.user_sessions
  for select using (auth.uid() = user_id);

create policy "Allow admin reads on sessions" on public.user_sessions
  for select using (auth.jwt() ->> 'email' like '%@statics.agency');

-- Generations Log
create policy "Allow public inserts to generations_log" on public.generations_log
  for insert with check (true);

create policy "Allow admin reads on generations_log" on public.generations_log
  for select using (auth.jwt() ->> 'email' like '%@statics.agency');

-- Leads Log
create policy "Allow public inserts to leads_log" on public.leads_log
  for insert with check (true);

create policy "Allow admin reads on leads_log" on public.leads_log
  for select using (auth.jwt() ->> 'email' like '%@statics.agency');

-- 6. Trigger to automatically create profile on sign up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
