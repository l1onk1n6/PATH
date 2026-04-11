-- Contact form rate-limiting log
-- Stores one row per submission; used to enforce max 3 messages per user per 24h

create table if not exists contact_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  sent_at    timestamptz not null default now()
);

-- Fast look-up for rate-limit check
create index if not exists contact_log_user_sent on contact_log(user_id, sent_at);

-- Users may only see their own rows; service role bypasses RLS
alter table contact_log enable row level security;

create policy "owner read" on contact_log
  for select using (auth.uid() = user_id);
