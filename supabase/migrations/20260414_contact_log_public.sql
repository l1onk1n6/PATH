-- Public contact form rate-limiting log
-- Stores one row per submission; used to enforce max 3 messages per IP per 24h
-- No auth required — identified by hashed IP address

create table if not exists contact_log_public (
  id       uuid primary key default gen_random_uuid(),
  ip_hash  text not null,
  sent_at  timestamptz not null default now()
);

-- Fast look-up for rate-limit check
create index if not exists contact_log_public_ip_sent on contact_log_public(ip_hash, sent_at);

-- Service role only (no user context for public submissions)
alter table contact_log_public enable row level security;
