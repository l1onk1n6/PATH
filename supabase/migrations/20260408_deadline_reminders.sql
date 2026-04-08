-- ─────────────────────────────────────────────────────────────────────────────
-- Deadline Reminders
-- Run in: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Add reminder_days column to resumes ───────────────────────────────────
ALTER TABLE public.resumes
  ADD COLUMN IF NOT EXISTS reminder_days integer[] DEFAULT '{}';


-- ── 2. Create deadline_reminders table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.deadline_reminders (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id   text        NOT NULL,
  resume_name text        NOT NULL,
  deadline    date        NOT NULL,
  remind_at   timestamptz NOT NULL,
  email       text        NOT NULL,
  sent        boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index for cron query (unsent, due reminders)
CREATE INDEX IF NOT EXISTS deadline_reminders_remind_at_idx
  ON public.deadline_reminders (remind_at)
  WHERE NOT sent;

-- RLS
ALTER TABLE public.deadline_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own reminders" ON public.deadline_reminders;
CREATE POLICY "own reminders" ON public.deadline_reminders
  FOR ALL
  USING      ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);


-- ── 3. pg_cron: call send-deadline-reminders daily at 07:00 UTC ─────────────
-- Replace YOUR_PROJECT_REF and YOUR_ANON_KEY with your actual values.
-- Find them in: Supabase Dashboard → Project Settings → API

-- SELECT cron.schedule(
--   'send-deadline-reminders',
--   '0 7 * * *',
--   $$
--   SELECT net.http_post(
--     url     := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-deadline-reminders',
--     headers := jsonb_build_object('Authorization', 'Bearer YOUR_ANON_KEY')
--   ) AS request_id;
--   $$
-- );
--
-- Uncomment and fill in the values above, then run separately.
