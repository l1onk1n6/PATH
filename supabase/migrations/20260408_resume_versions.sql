-- ─────────────────────────────────────────────────────────────────────────────
-- Resume Versions (CV Versionshistorie)
-- Run in: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.resume_versions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id   text        NOT NULL,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot    jsonb       NOT NULL,
  label       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS resume_versions_resume_id_idx
  ON public.resume_versions (resume_id, created_at DESC);

ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own versions" ON public.resume_versions;
CREATE POLICY "own versions" ON public.resume_versions
  FOR ALL
  USING      ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
