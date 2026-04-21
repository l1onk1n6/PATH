-- 20260421_shared_docs_access.sql
-- Wenn ein Resume einen share_token hat, darf JEDER (auch anon) die
-- zugehoerigen Dokumente + Storage-Objekte lesen — sonst fehlen Anlagen
-- im geteilten Lebenslauf.

-- ── documents table: SELECT fuer shared resumes ─────────────────────────────
drop policy if exists "documents_shared_select" on public.documents;

create policy "documents_shared_select" on public.documents
  for select
  using (
    exists (
      select 1 from public.resumes r
      where r.id = documents.resume_id
        and r.share_token is not null
    )
  );

-- ── storage.objects: SELECT fuer shared resume-Dokumente ────────────────────
drop policy if exists "documents_shared_select_storage" on storage.objects;

create policy "documents_shared_select_storage" on storage.objects
  for select
  using (
    bucket_id = 'documents'
    and exists (
      select 1
      from public.documents d
      join public.resumes r on r.id = d.resume_id
      where d.storage_path = storage.objects.name
        and r.share_token is not null
    )
  );
