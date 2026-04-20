# Fehler-Logs einsehen

Jeder unerwartete Fehler in der App (PDF-Export, LinkedIn-Import,
React-Render-Fehler, unbehandelte Promise-Rejections, …) wird in der
Supabase-Tabelle `error_logs` protokolliert.

## Tabellen-Schema

```
id           uuid
created_at   timestamptz
user_id      uuid   (NULL wenn anonym)
user_email   text
action       text   — z. B. "PDF-Export hat nicht funktioniert"
message      text   — err.message
stack        text   — err.stack (max 4000 Zeichen)
page         text   — "/editor#/editor"
platform     text   — "web" | "android" | "ios"
app_version  text
user_agent   text
extra        jsonb  — optional zusaetzliche Felder
```

## Wer kann lesen?

RLS erlaubt `INSERT` fuer authentifizierte User (nur in die eigene Zeile)
und anonyme User (mit `user_id = NULL`). **`SELECT` hat keine Policy** —
heisst nur ueber den Supabase-SQL-Editor (Service-Role) einsehbar, nicht
vom Client aus.

## Haeufige Abfragen (SQL Editor)

**Letzte 50 Fehler:**
```sql
select created_at, user_email, action, message, page, platform, app_version
from error_logs
order by created_at desc
limit 50;
```

**Fehler eines bestimmten Users:**
```sql
select created_at, action, message, stack
from error_logs
where user_email = 'kunde@example.ch'
order by created_at desc;
```

**Haeufigste Fehler der letzten 7 Tage:**
```sql
select action, count(*) as anzahl
from error_logs
where created_at > now() - interval '7 days'
order by anzahl desc;
```

**Nach Plattform gruppieren:**
```sql
select platform, count(*) as anzahl
from error_logs
where created_at > now() - interval '30 days'
group by platform;
```

## Aufraeumen

Logs wachsen mit der Zeit. Monatlich aufraeumen:

```sql
delete from error_logs where created_at < now() - interval '90 days';
```

Oder als Supabase-Cron-Job unter **Database → Cron Jobs**.

## Wenn ein User sich meldet

Frag nach der E-Mail und der ungefaehren Uhrzeit. Dann:

```sql
select * from error_logs
where user_email = 'xyz@example.ch'
  and created_at between '2026-04-20 14:00' and '2026-04-20 15:00'
order by created_at desc;
```

Der `stack`-Wert + `page` + `platform` + `app_version` geben dir meistens
schon alles was du zur Reproduktion brauchst.
