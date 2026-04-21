-- 20260421_documents_storage.sql
-- Umstellung: Dokumente liegen jetzt im Supabase Storage Bucket "documents"
-- statt als base64 in der documents-Tabelle.
-- Abwaertskompatibel: Zeilen mit bestehendem data_url bleiben weiter lesbar,
-- neue Zeilen nutzen storage_path.

-- ── Schema-Anpassung ─────────────────────────────────────────────────────────
alter table public.documents
  add column if not exists storage_path text;

-- data_url darf jetzt NULL sein (neue Uploads haben kein base64 mehr)
alter table public.documents
  alter column data_url drop not null;

-- Index auf storage_path, damit Cleanup-Jobs bei DELETE schnell finden
create index if not exists idx_documents_storage_path on public.documents(storage_path)
  where storage_path is not null;

-- ── Storage Bucket ──────────────────────────────────────────────────────────
-- Bucket wird idempotent angelegt (Supabase-Dashboard macht's ggf. schon).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 10485760, null)  -- 10 MB, private
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;

-- ── Storage RLS: nur eigener Ordner ─────────────────────────────────────────
-- Pfad-Konvention: {user_id}/{document_id}
-- storage.foldername(name) = {'<user_id>', '<document_id>'} -- wir pruefen [1]
drop policy if exists "documents_own_select" on storage.objects;
drop policy if exists "documents_own_insert" on storage.objects;
drop policy if exists "documents_own_update" on storage.objects;
drop policy if exists "documents_own_delete" on storage.objects;

create policy "documents_own_select" on storage.objects
  for select
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "documents_own_insert" on storage.objects
  for insert
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "documents_own_update" on storage.objects
  for update
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "documents_own_delete" on storage.objects
  for delete
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
