-- Sharing-Analytics: Aufrufzaehler + Last-Seen pro geteiltem Lebenslauf.
-- Inkrement laeuft anon-faehig via SECURITY DEFINER RPC, damit ein
-- nicht-eingeloggter Besucher der Share-URL den Counter erhoehen kann.

alter table public.resumes
  add column if not exists share_views integer default 0 not null,
  add column if not exists last_viewed_at timestamptz;

create or replace function public.increment_share_view(token text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.resumes
     set share_views = share_views + 1,
         last_viewed_at = now()
   where share_token = token
     and share_token is not null;
$$;

revoke all on function public.increment_share_view(text) from public;
grant execute on function public.increment_share_view(text) to anon, authenticated;

-- RLS: Owner darf share_views + last_viewed_at lesen (Owner-Policy
-- existiert bereits). Anon liest die Felder ueber den geteilten Resume
-- ebenfalls (Share-Policy laesst SELECT fuer share_token != null zu).
