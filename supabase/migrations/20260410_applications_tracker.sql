-- Bewerbungs-Tracker: Cloud-Synchronisation für Bewerbungen
CREATE TABLE IF NOT EXISTS applications (
  id            UUID        PRIMARY KEY,
  user_id       UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company       TEXT        NOT NULL DEFAULT '',
  position      TEXT        NOT NULL DEFAULT '',
  status        TEXT        NOT NULL DEFAULT 'offen',
  type          TEXT        NOT NULL DEFAULT 'online',
  applied_date  TEXT        NOT NULL DEFAULT '',
  deadline      TEXT        NOT NULL DEFAULT '',
  notes         TEXT        NOT NULL DEFAULT '',
  url           TEXT        NOT NULL DEFAULT '',
  resume_id     TEXT        NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own applications"
  ON applications FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
