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
-- Dieser Block ist eine Vorlage und laeuft NICHT mit der Migration — er war
-- schon immer auskommentiert. Der tatsaechlich laufende Cron-Job wurde von Hand
-- angelegt und ist aus diesem Repo nicht nachmessbar; er muss nach der
-- Absicherung der Function nachgezogen werden (siehe PR-Beschreibung).
--
-- Der anon-Key allein ist keine Berechtigung: er steckt oeffentlich im
-- Browser-Bundle (src/lib/supabase.ts:11). Die Function prueft seit der
-- Absicherung zusaetzlich den Header x-admin-secret gegen ihr Secret
-- ADMIN_SECRET — ohne diesen Header antwortet sie 403 und sendet nichts.
--
-- Das Geheimnis gehoert NICHT in dieses Repo (es ist oeffentlich) und nicht in
-- den Klartext eines Cron-Kommandos (cron.job ist lesbar). Bezugsquelle ist
-- Supabase Vault: das Geheimnis einmal unter einem Namen ablegen und hier nur
-- den Namen nennen. (ungeprueft — ob die Extension supabase_vault in diesem
-- Projekt aktiv ist, laesst sich aus dem Repo nicht belegen.)

-- SELECT cron.schedule(
--   'send-deadline-reminders',
--   '0 7 * * *',
--   $$
--   SELECT net.http_post(
--     url     := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-deadline-reminders',
--     headers := jsonb_build_object(
--       'Authorization',   'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'anon_key'),
--       'x-admin-secret',  (select decrypted_secret from vault.decrypted_secrets where name = 'admin_secret')
--     )
--   ) AS request_id;
--   $$
-- );
--
-- Die beiden Vault-Eintraege 'anon_key' und 'admin_secret' vorher anlegen
-- (Dashboard → Project Settings → Vault). Erst danach diesen Block
-- auskommentieren und separat ausfuehren.
