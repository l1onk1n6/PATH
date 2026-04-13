-- Allow unauthenticated users to read active share links by token.
-- This is required so the shared CV page can load without login.
-- The token is a 32-char random string so enumeration risk is negligible.

DROP POLICY IF EXISTS "Public can read active share links" ON share_links;

CREATE POLICY "Public can read active share links"
  ON share_links
  FOR SELECT
  USING (is_active = true);

-- Allow unauthenticated users to read resumes that have an active share link.
-- The existing "Public can read shared resumes" policy only covers the legacy
-- resumes.share_token field. New links created via the ShareLinksPanel only
-- exist in the share_links table, so we need this additional policy.

DROP POLICY IF EXISTS "Public can read resumes with active share link" ON resumes;

CREATE POLICY "Public can read resumes with active share link"
  ON resumes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM share_links
      WHERE share_links.resume_id = resumes.id
        AND share_links.is_active = true
    )
  );
