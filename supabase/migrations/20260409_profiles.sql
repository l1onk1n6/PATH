-- public.profiles — stores user contact/address data
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  phone      text,
  street     text,
  zip        text,
  city       text,
  country    text default 'Schweiz',
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_upsert_own" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
