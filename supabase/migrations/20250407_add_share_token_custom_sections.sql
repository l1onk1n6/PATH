-- Migration: Add share_token and custom_sections to resumes table
-- Run this in the Supabase SQL Editor

ALTER TABLE resumes
  ADD COLUMN IF NOT EXISTS share_token TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS custom_sections JSONB DEFAULT '[]'::jsonb;

-- Unique index for share tokens (fast lookup)
CREATE UNIQUE INDEX IF NOT EXISTS resumes_share_token_idx
  ON resumes (share_token)
  WHERE share_token IS NOT NULL;

-- RLS policy: allow public read access for shared resumes (no auth required)
-- First ensure RLS is enabled on resumes
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

-- Drop existing public policy if it exists, then recreate
DROP POLICY IF EXISTS "Public can read shared resumes" ON resumes;

CREATE POLICY "Public can read shared resumes"
  ON resumes
  FOR SELECT
  USING (share_token IS NOT NULL);
