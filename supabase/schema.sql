-- ══════════════════════════════════════════════════════════
-- AICV – Supabase Schema
-- Ausführen in: Supabase Dashboard → SQL Editor → New query
-- ══════════════════════════════════════════════════════════

-- Personen
create table if not exists public.persons (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  avatar      text,                     -- base64
  active_resume_id uuid,
  created_at  timestamptz default now() not null
);

-- Bewerbungsmappen (Inhalt als JSONB für Flexibilität)
create table if not exists public.resumes (
  id               uuid primary key default gen_random_uuid(),
  person_id        uuid references public.persons(id) on delete cascade not null,
  user_id          uuid references auth.users(id) on delete cascade not null,
  name             text default 'Bewerbungsmappe' not null,
  template_id      text default 'minimal' not null,
  accent_color     text default '#007AFF' not null,
  personal_info    jsonb default '{}' not null,
  cover_letter     jsonb default '{}',
  work_experience  jsonb default '[]' not null,
  education        jsonb default '[]' not null,
  skills           jsonb default '[]' not null,
  languages        jsonb default '[]' not null,
  projects         jsonb default '[]' not null,
  certificates     jsonb default '[]' not null,
  created_at       timestamptz default now() not null,
  updated_at       timestamptz default now() not null
);

-- Dokumente
create table if not exists public.documents (
  id           uuid primary key default gen_random_uuid(),
  resume_id    uuid references public.resumes(id) on delete cascade not null,
  user_id      uuid references auth.users(id) on delete cascade not null,
  name         text not null,
  type         text not null,
  size         integer not null,
  category     text default 'other' not null,
  data_url     text not null,            -- base64 (max ~8MB nach Supabase-Limit)
  uploaded_at  timestamptz default now() not null
);

-- Bewerbungs-Tracker
create table if not exists public.applications (
  id            uuid        primary key,
  user_id       uuid        not null references auth.users(id) on delete cascade,
  company       text        not null default '',
  position      text        not null default '',
  status        text        not null default 'offen',
  type          text        not null default 'online',
  applied_date  text        not null default '',
  deadline      text        not null default '',
  notes         text        not null default '',
  url           text        not null default '',
  resume_id     text        not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── Row Level Security ──────────────────────────────────────
alter table public.persons      enable row level security;
alter table public.resumes      enable row level security;
alter table public.documents    enable row level security;
alter table public.applications enable row level security;

-- Jeder Nutzer sieht & verändert nur seine eigenen Daten
create policy "own persons"      on public.persons      for all using (auth.uid() = user_id);
create policy "own resumes"      on public.resumes      for all using (auth.uid() = user_id);
create policy "own documents"    on public.documents    for all using (auth.uid() = user_id);
create policy "own applications" on public.applications for all using (auth.uid() = user_id);

-- ── updated_at automatisch setzen ──────────────────────────
-- security definer + set search_path = '' verhindert Search-Path-Injection
create or replace function public.set_updated_at()
returns trigger language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger resumes_updated_at
  before update on public.resumes
  for each row execute procedure public.set_updated_at();

create trigger applications_updated_at
  before update on public.applications
  for each row execute procedure public.set_updated_at();

-- ── DSGVO: Account-Löschung ────────────────────────────────
-- Löscht den angemeldeten User + alle seine Daten (CASCADE).
-- SECURITY DEFINER: läuft als postgres, darf auth.users schreiben.
-- set search_path = '': verhindert Search-Path-Injection.
create or replace function public.delete_user()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- App-Daten explizit löschen (CASCADE würde es auch tun,
  -- aber explizit für Audit-Trail und DSGVO-Dokumentation)
  delete from public.applications where user_id = auth.uid();
  delete from public.documents    where user_id = auth.uid();
  delete from public.resumes      where user_id = auth.uid();
  delete from public.persons      where user_id = auth.uid();

  -- Auth-User löschen → triggert CASCADE auf alle verknüpften Tabellen
  delete from auth.users where id = auth.uid();
end;
$$;

-- Nur angemeldete User dürfen diese Funktion aufrufen
grant execute on function public.delete_user() to authenticated;
revoke execute on function public.delete_user() from anon, public;
