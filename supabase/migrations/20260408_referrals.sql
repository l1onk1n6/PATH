-- ─────────────────────────────────────────────────────────────────────────────
-- Referrals
-- Run in: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.referrals (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_id  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscribed  boolean     NOT NULL DEFAULT false,
  rewarded    boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(referee_id)   -- each user can only be referred once
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own referrals" ON public.referrals;
CREATE POLICY "own referrals" ON public.referrals
  FOR SELECT
  USING ((select auth.uid()) = referrer_id);
