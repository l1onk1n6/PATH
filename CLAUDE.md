# Claude-Instruktionen für dieses Repo

## PRs

Wenn du einen Pull Request erstellst, aktiviere danach immer GitHub-Auto-Merge
(`mcp__github__enable_pr_auto_merge`, Strategie: `SQUASH`). GitHub merged den PR
dann automatisch, sobald CI-Checks grün sind und Branch-Protection-Regeln erfüllt
sind. Du musst dafür nicht nachfragen.

**Ausnahme: PRs, die eine Datei unter `supabase/migrations/` anlegen oder
ändern.** Dort kein Auto-Merge — der Merge nach `main` spielt die Datei sofort
und ohne Rollback auf die Produktionsdatenbank (siehe
`.github/workflows/supabase-migrations.yml`). Solche PRs bleiben offen, bis ein
Mensch sie gelesen hat.

## Datenbank: neue Tabellen brauchen ihre Rechte selbst

Seit dem **30.10.2026** gibt Supabase neue Tabellen im Schema `public` nicht
mehr automatisch für die Data API frei: ohne ausdrückliches `GRANT` ist eine
neue Tabelle für `anon`, `authenticated` und `service_role` unsichtbar, und
jede Abfrage antwortet mit `permission denied for table …`. Eine Migration, die
eine Tabelle anlegt, muss deshalb immer beides mitbringen — `enable row level
security` plus Policies für die Frage, welche *Zeilen* eine Rolle sieht, und
`grant` für die Frage, welche *Operationen* sie auf der Tabelle überhaupt darf.

Vergib die Rechte pro Tabelle und pro Rolle mit einer Begründung als Kommentar
darüber, nie pauschal als `grant all … to anon, authenticated, service_role`;
`anon` nur dort, wo ein öffentlicher Pfad im Code belegt ist. Gerüst und
Checkliste: `supabase/migrations/_VORLAGE-neue-tabelle.sql.txt`. Die Rechte des
bestehenden Stands stehen in `supabase/migrations/20261021_data_api_grants.sql`.
