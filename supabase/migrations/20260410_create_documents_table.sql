-- Create documents table for uploaded files (PDFs, images, etc.)
-- This is the canonical migration; storage_path was added separately in
-- 20260410_add_storage_paths.sql but that ALTER is safe to re-run.

CREATE TABLE IF NOT EXISTS public.documents (
  id           UUID        PRIMARY KEY,
  resume_id    UUID        REFERENCES public.resumes(id) ON DELETE CASCADE NOT NULL,
  user_id      UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name         TEXT        NOT NULL DEFAULT '',
  type         TEXT        NOT NULL DEFAULT '',
  size         INTEGER     NOT NULL DEFAULT 0,
  category     TEXT        NOT NULL DEFAULT 'other',
  storage_path TEXT,
  data_url     TEXT,
  uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own documents" ON public.documents;
CREATE POLICY "Users can manage their own documents"
  ON public.documents FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for fast lookup by resume
CREATE INDEX IF NOT EXISTS documents_resume_id_idx ON public.documents (resume_id);
CREATE INDEX IF NOT EXISTS documents_user_id_idx ON public.documents (user_id);
