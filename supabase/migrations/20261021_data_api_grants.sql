-- 20261021_data_api_grants.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Tabellenrechte fuer die Data API explizit machen.
--
-- WARUM: Supabase stellt am 30.10.2026 die automatische Data-API-Freigabe fuer
-- NEU angelegte Tabellen im Schema `public` ab. Bisher bekam jede neue Tabelle
-- stillschweigend Rechte fuer anon/authenticated/service_role; ab dann nicht
-- mehr. Bestehende Tabellen behalten ihre Rechte — diese Datei aendert in der
-- laufenden Produktionsdatenbank also faktisch nichts. Sie wirkt beim
-- Wiederaufbau: ohne sie waere eine aus diesem Repo neu aufgebaute Datenbank
-- fuer die App stumm (jede Abfrage "permission denied for table ...").
--
-- NUR GRANT, KEIN REVOKE: Heute sind die Rechte breiter als hier vergeben.
-- Ein REVOKE wuerde die laufende App gefaehrden und bleibt eine bewusste,
-- separate Entscheidung (siehe PR-Beschreibung). Diese Datei engt nichts ein.
--
-- MINIMAL UND BELEGT: Die Rechte unten sind nicht das Muster aus der
-- Supabase-Mail (`grant all ... to anon, authenticated, service_role`), sondern
-- pro Tabelle aus zwei Quellen abgeleitet: den RLS-Policies in diesem Repo und
-- den tatsaechlichen Aufrufstellen in `src/` und `supabase/functions/`.
-- Ueber jeder Tabelle steht die Begruendung samt Fundstelle.
--
-- WICHTIG: RLS bleibt die Zeilen-Schranke. Ein GRANT oeffnet nur die Tabelle
-- als solche; welche ZEILEN eine Rolle sieht, entscheiden weiterhin die
-- Policies. Beides muss stimmen, keines ersetzt das andere.
--
-- Idempotent: GRANT ist in Postgres wiederholbar.
-- ─────────────────────────────────────────────────────────────────────────────

-- Schema-Zugang. Auf Supabase ist das gesetzt; hier explizit, damit ein
-- Wiederaufbau auch auf einer blanken Datenbank vollstaendig ist.
grant usage on schema public to anon, authenticated, service_role;


-- ── persons ──────────────────────────────────────────────────────────────────
-- Policy "own persons" (FOR ALL, auth.uid() = user_id) → nur der angemeldete
-- Eigentuemer. Zugriff ausschliesslich aus dem Browser als authenticated:
-- src/lib/db.ts:23 select, :38 upsert, :53 delete. Keine Edge Function fasst
-- persons an → service_role bekommt nichts. Personendaten, kein oeffentlicher
-- Lesepfad → anon bekommt nichts.
grant select, insert, update, delete on table public.persons to authenticated;


-- ── resumes ──────────────────────────────────────────────────────────────────
-- Zwei Lesepfade. (1) Eigentuemer: Policy "own resumes" (FOR ALL) —
-- src/lib/db.ts:64 select, :79 upsert, :109 delete als authenticated.
-- (2) Oeffentlich geteilte Mappe: Policy "shared resume via header token"
-- (FOR SELECT TO anon, authenticated) gibt GENAU die Zeile frei, deren
-- share_token den Header x-share-token trifft (20260909_secure_shared_read.sql).
-- Aufrufstelle: src/lib/db.ts:386 ueber getSharedSupabase() (src/lib/supabase.ts).
-- Das ist der belegte oeffentliche Lesepfad → anon erhaelt SELECT, aber nur
-- SELECT. Schreiben kann anon nicht, auch nicht auf geteilte Mappen.
-- service_role: nur SELECT (get-shared-docs/index.ts:75 loest den Token auf).
grant select on table public.resumes to anon;
grant select, insert, update, delete on table public.resumes to authenticated;
grant select on table public.resumes to service_role;


-- ── documents ────────────────────────────────────────────────────────────────
-- Wie resumes: Eigentuemer ueber "own documents" (FOR ALL) —
-- src/lib/db.ts:174 select, :213 upsert, :237 delete, :261 update.
-- Oeffentlich ueber "shared documents via header token" (FOR SELECT TO anon,
-- authenticated), ebenfalls token-gebunden; Aufrufstelle src/lib/db.ts:405 mit
-- demselben Header-Client. Die Dateien selbst liegen im Storage-Bucket
-- "documents" und haengen an eigenen storage.objects-Policies — hier geht es
-- nur um die Metadatenzeile.
-- service_role: nur SELECT (get-shared-docs/index.ts:83).
grant select on table public.documents to anon;
grant select, insert, update, delete on table public.documents to authenticated;
grant select on table public.documents to service_role;


-- ── applications ─────────────────────────────────────────────────────────────
-- Policy "own applications" (FOR ALL, user_id). Bewerbungen sind besonders
-- heikel (Arbeitgeber, Status, Notizen) und haben keinen Share-Pfad: in
-- fetchSharedResume wird applications nicht gelesen.
-- authenticated: src/lib/db.ts:277 select, :292 upsert, :313 delete.
-- Keine Edge Function → service_role nichts. Kein anon.
grant select, insert, update, delete on table public.applications to authenticated;


-- ── profiles ─────────────────────────────────────────────────────────────────
-- Adress- und Telefondaten. Policies "profiles_select_own" und
-- "profiles_upsert_own" (beide auth.uid() = id).
-- authenticated schreibt direkt aus dem Browser: src/pages/AccountPage.tsx:361
-- select, :380 upsert → SELECT, INSERT, UPDATE. Kein DELETE im Code; eine
-- Profilzeile verschwindet ueber ON DELETE CASCADE an auth.users.
-- service_role: update-user-profile/index.ts:56 upsert → INSERT, UPDATE
-- (kein SELECT dort). Kein anon.
grant select, insert, update on table public.profiles to authenticated;
grant insert, update on table public.profiles to service_role;


-- ── resume_versions ──────────────────────────────────────────────────────────
-- Versionshistorie, enthaelt vollstaendige Lebenslauf-Schnappschuesse
-- (snapshot jsonb) — also Personendaten. Policy "own versions" (FOR ALL).
-- authenticated: src/lib/versions.ts:27 insert, :41/:56 select, :47/:69 delete.
-- Kein UPDATE im Code (eine Version wird nie geaendert, nur ersetzt) → kein
-- UPDATE-Recht. Keine Edge Function, kein oeffentlicher Pfad.
grant select, insert, delete on table public.resume_versions to authenticated;


-- ── referrals ────────────────────────────────────────────────────────────────
-- Policy "own referrals" ist bewusst nur FOR SELECT und nur fuer den Werber
-- (referrer_id) — der Nutzer darf seine Empfehlungen sehen, aber nicht selbst
-- anlegen oder gutschreiben. Deshalb fuer authenticated AUSSCHLIESSLICH SELECT:
-- src/pages/AccountPage.tsx:766.
-- Angelegt und belohnt wird serverseitig: record-referral/index.ts:56 upsert
-- (INSERT ... ON CONFLICT DO NOTHING) und stripe-webhook/index.ts:96 select,
-- :103 update → service_role SELECT, INSERT, UPDATE. Kein DELETE im Code.
grant select on table public.referrals to authenticated;
grant select, insert, update on table public.referrals to service_role;


-- ── deadline_reminders ───────────────────────────────────────────────────────
-- Enthaelt E-Mail-Adressen und Fristen. Jeder gemessene Zugriff laeuft ueber
-- Edge Functions mit service_role: upsert-deadline-reminders/index.ts:58
-- delete, :85 insert; send-deadline-reminders/index.ts:51 select, :172 update.
-- Der Browser ruft nur die Function (src/components/editor/CoverLetterEditor.tsx:90),
-- nie die Tabelle. Die Policy "own reminders" (FOR ALL) existiert, hat aber
-- keine Aufrufstelle → authenticated bekommt hier NICHTS, bis ein Lesepfad
-- belegt ist. Offene Frage dazu im Bericht. Kein anon.
grant select, insert, update, delete on table public.deadline_reminders to service_role;


-- ── error_logs ───────────────────────────────────────────────────────────────
-- Der einzige Fall mit einem belegten oeffentlichen SCHREIB-Pfad, und zwar
-- ausdruecklich so gebaut: Policy error_logs_insert_anon (FOR INSERT TO anon,
-- WITH CHECK user_id IS NULL) und error_logs_insert_own (FOR INSERT TO
-- authenticated). Aufrufstelle src/lib/errorLog.ts:48 — logError() laeuft auch
-- vor der Anmeldung (z. B. ErrorBoundary auf der Login-Seite), dann ist
-- user_id NULL und greift die anon-Policy.
-- Bewusst KEIN SELECT, fuer keine der drei Rollen: Fehler-Logs enthalten
-- user_email, Stacktraces und Seitenpfade. Gelesen wird als Eigentuemer der
-- Tabelle im SQL-Editor (siehe Kommentar in 20260420_error_logs.sql), nicht
-- ueber die Data API. Nur INSERT heisst: Schreiben ja, Nachlesen nein.
grant insert on table public.error_logs to anon;
grant insert on table public.error_logs to authenticated;


-- ── stripe_customers ─────────────────────────────────────────────────────────
-- Zahlungsbezug (Abbildung user_id ↔ Stripe-Kunde). Gemessen wird sie nur
-- serverseitig: create-checkout-session/index.ts:69 select, :82 insert;
-- create-portal-session/index.ts:47 select; sync-subscription/index.ts:73
-- select; stripe-webhook/index.ts:42 select, :73 upsert, :107 select
-- → service_role SELECT, INSERT, UPDATE. Kein DELETE im Code.
-- Die Policy "Users can view own stripe record" (FOR SELECT) existiert, aber
-- kein Frontend-Code liest die Tabelle. Nach der Regel "nur mit Beleg" bekommt
-- authenticated daher NICHTS. Offene Frage dazu im Bericht. Kein anon.
grant select, insert, update on table public.stripe_customers to service_role;


-- ── Funktionen, die an den oeffentlichen Lesepfaden haengen ──────────────────
-- current_share_token() wird in den USING-Klauseln der Share-Policies
-- aufgerufen und laeuft mit den Rechten der abfragenden Rolle (kein SECURITY
-- DEFINER). Heute traegt sie das Standard-EXECUTE fuer PUBLIC; explizit
-- gesetzt, damit die Share-Policies auch dann greifen, wenn dieses
-- Standardrecht spaeter entzogen wird.
grant execute on function public.current_share_token() to anon, authenticated;

-- increment_share_view(text) und delete_user() haben ihre Rechte bereits in
-- 20260506_share_analytics.sql bzw. 20260509_applications.sql/schema.sql
-- erhalten — hier absichtlich nicht wiederholt.

-- KEIN "alter default privileges": Das wuerde die Pauschalfreigabe, die
-- Supabase am 30.10.2026 gerade abschafft, hinten wieder einbauen und jede
-- kuenftige Tabelle ungeprueft oeffnen. Stattdessen bringt jede neue Tabelle
-- ihre Rechte selbst mit — Geruest in supabase/migrations/_VORLAGE-neue-tabelle.sql.txt.
