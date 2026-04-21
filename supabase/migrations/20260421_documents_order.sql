-- 20260421_documents_order.sql
-- User-Sortierung fuer Dokumente: neue optionale Spalte order_index.
-- Ueber fetchDocuments wird zuerst nach order_index (nulls last) sortiert,
-- bei Gleichstand / Altbestand bleibt uploaded_at als Fallback.

alter table public.documents
  add column if not exists order_index integer;

create index if not exists idx_documents_resume_order
  on public.documents(resume_id, order_index);
