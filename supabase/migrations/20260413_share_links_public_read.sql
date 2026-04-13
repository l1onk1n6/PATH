-- Allow unauthenticated users to read active share links by token.
-- This is required so the shared CV page can load without login.
-- Same pattern as "Public can read shared resumes" on the resumes table.
-- The token is a 32-char random string so enumeration risk is negligible.

DROP POLICY IF EXISTS "Public can read active share links" ON share_links;

CREATE POLICY "Public can read active share links"
  ON share_links
  FOR SELECT
  USING (is_active = true);
