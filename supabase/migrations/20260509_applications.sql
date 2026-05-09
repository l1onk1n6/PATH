-- ─────────────────────────────────────────────────────────────────────────────
-- Bewerbungs-Tracker (Applications)
-- Run in: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.applications (
  id            uuid        PRIMARY KEY,
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company       text        NOT NULL DEFAULT '',
  position      text        NOT NULL DEFAULT '',
  status        text        NOT NULL DEFAULT 'offen',
  type          text        NOT NULL DEFAULT 'online',
  applied_date  text        NOT NULL DEFAULT '',
  deadline      text        NOT NULL DEFAULT '',
  notes         text        NOT NULL DEFAULT '',
  url           text        NOT NULL DEFAULT '',
  resume_id     text        NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS applications_user_id_idx
  ON public.applications (user_id, created_at DESC);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own applications" ON public.applications;
CREATE POLICY "own applications" ON public.applications
  FOR ALL
  USING      ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ── DSGVO: Account-Löschung erweitern ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM public.applications WHERE user_id = auth.uid();
  DELETE FROM public.documents    WHERE user_id = auth.uid();
  DELETE FROM public.resumes      WHERE user_id = auth.uid();
  DELETE FROM public.persons      WHERE user_id = auth.uid();
  DELETE FROM auth.users          WHERE id      = auth.uid();
END;
$$;
