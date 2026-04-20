-- Client-seitige Fehler-Logs.
-- Wird von src/lib/errorLog.ts beim Auftreten von userError()-Fehlern und
-- uncaught React-Errors (ErrorBoundary) befuellt. Admin liest via SQL-Editor.
-- Idempotent (IF NOT EXISTS / DROP POLICY IF EXISTS) — darf wiederholt laufen.

CREATE TABLE IF NOT EXISTS public.error_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email   text,
  action       text NOT NULL,                    -- Handlungs-Label, z. B. "PDF-Export"
  message      text,                             -- err.message
  stack        text,                             -- err.stack (abgeschnitten bei 4000 Zeichen)
  page         text,                             -- window.location.pathname + hash
  platform     text,                             -- "web" | "android" | "ios"
  app_version  text,
  user_agent   text,
  extra        jsonb                              -- beliebige Zusatzinfos
);

CREATE INDEX IF NOT EXISTS error_logs_created_at_idx ON public.error_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS error_logs_user_id_idx    ON public.error_logs (user_id);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Authentifizierte User duerfen neue Zeilen schreiben, aber nur fuer ihre
-- eigene user_id (oder anonym mit user_id = NULL).
DROP POLICY IF EXISTS error_logs_insert_own ON public.error_logs;
CREATE POLICY error_logs_insert_own ON public.error_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS error_logs_insert_anon ON public.error_logs;
CREATE POLICY error_logs_insert_anon ON public.error_logs
  FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);

-- Lesen nur fuer den Admin (Service-Role ueber Dashboard / SQL Editor).
-- Keine SELECT-Policy fuer authenticated/anon = null SELECT-Zugriff fuer sie.
