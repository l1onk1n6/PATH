-- ─────────────────────────────────────────────────────────────────────────────
-- Security & Performance fixes (Supabase Advisor warnings)
-- Run in: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Function Search Path Mutable ──────────────────────────────────────────
-- set_updated_at had a mutable search_path (security risk: search_path hijack)
ALTER FUNCTION public.set_updated_at() SET search_path = '';


-- ── 2. RLS Enabled No Policy: stripe_customers ───────────────────────────────
-- Table has RLS enabled but no policies → all authenticated queries blocked.
-- Service role bypasses RLS, so edge functions still work.
-- Users can read only their own record (harmless; they can't write directly).
DROP POLICY IF EXISTS "Users can view own stripe record" ON public.stripe_customers;
CREATE POLICY "Users can view own stripe record"
  ON public.stripe_customers
  FOR SELECT
  USING ((select auth.uid()) = user_id);


-- ── 3 + 4. Auth RLS Initialization Plan + Multiple Permissive Policies ───────
-- Replace auth.uid() with (select auth.uid()) in all policies → evaluated once
-- per query instead of once per row. Also consolidates duplicate policies.

-- ── persons ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users own their persons"   ON public.persons;
DROP POLICY IF EXISTS "own persons"               ON public.persons;
DROP POLICY IF EXISTS "Users can manage persons"  ON public.persons;
DROP POLICY IF EXISTS "Users manage their persons" ON public.persons;

CREATE POLICY "own persons" ON public.persons
  FOR ALL
  USING      ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);


-- ── resumes ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users own their resumes"    ON public.resumes;
DROP POLICY IF EXISTS "own resumes"                ON public.resumes;
DROP POLICY IF EXISTS "Users can manage resumes"   ON public.resumes;
DROP POLICY IF EXISTS "Users manage their resumes" ON public.resumes;
-- keep the public shared-resume read policy from previous migration
-- DROP only auth-user policies, not "Public can read shared resumes"

CREATE POLICY "own resumes" ON public.resumes
  FOR ALL
  USING      ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);


-- ── documents ────────────────────────────────────────────────────────────────
-- Consolidate all permissive policies into a single ALL policy
DROP POLICY IF EXISTS "Users own their documents"      ON public.documents;
DROP POLICY IF EXISTS "own documents"                  ON public.documents;
DROP POLICY IF EXISTS "Users can manage documents"     ON public.documents;
DROP POLICY IF EXISTS "Users manage their documents"   ON public.documents;
DROP POLICY IF EXISTS "Users can select documents"     ON public.documents;
DROP POLICY IF EXISTS "Users can insert documents"     ON public.documents;
DROP POLICY IF EXISTS "Users can update documents"     ON public.documents;
DROP POLICY IF EXISTS "Users can delete documents"     ON public.documents;

CREATE POLICY "own documents" ON public.documents
  FOR ALL
  USING      ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
