-- ══════════════════════════════════════════════════════════
-- Migration: DSGVO-konforme Account-Löschung
-- Ausführen in: Supabase Dashboard → SQL Editor → New query
-- ══════════════════════════════════════════════════════════

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

  delete from public.documents where user_id = auth.uid();
  delete from public.resumes   where user_id = auth.uid();
  delete from public.persons   where user_id = auth.uid();
  delete from auth.users       where id      = auth.uid();
end;
$$;

grant execute on function public.delete_user() to authenticated;
revoke execute on function public.delete_user() from anon, public;
