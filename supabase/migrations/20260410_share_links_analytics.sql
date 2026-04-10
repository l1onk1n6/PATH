-- Share Links: multiple named links per resume
CREATE TABLE IF NOT EXISTS share_links (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id   UUID        REFERENCES resumes(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token       TEXT        UNIQUE NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''),
  label       TEXT        NOT NULL DEFAULT '',
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own share_links"
  ON share_links FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Migrate existing share tokens from resumes into share_links
INSERT INTO share_links (resume_id, user_id, token, label, created_at)
SELECT r.id, r.user_id, r.share_token, '', r.updated_at
FROM resumes r
WHERE r.share_token IS NOT NULL
ON CONFLICT (token) DO NOTHING;

-- Resume Views: one row per page load
CREATE TABLE IF NOT EXISTS resume_views (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  share_link_id   UUID        REFERENCES share_links(id) ON DELETE CASCADE NOT NULL,
  viewed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  country         TEXT,
  country_code    TEXT,
  city            TEXT,
  device          TEXT,   -- 'desktop' | 'mobile' | 'tablet'
  browser         TEXT,
  referrer        TEXT,
  duration_s      INT
);

ALTER TABLE resume_views ENABLE ROW LEVEL SECURITY;

-- Owners read their own views (via share_links join)
CREATE POLICY "Owners read own views"
  ON resume_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM share_links sl
      WHERE sl.id = share_link_id AND sl.user_id = auth.uid()
    )
  );

-- Public INSERT — no auth needed (called by SharedResumePage)
CREATE POLICY "Public can insert views"
  ON resume_views FOR INSERT
  WITH CHECK (true);

-- Index for fast analytics queries
CREATE INDEX IF NOT EXISTS resume_views_link_idx ON resume_views (share_link_id, viewed_at DESC);
