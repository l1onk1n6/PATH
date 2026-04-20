# RevenueCat + Google Play Billing — Einrichtung

Die App nutzt RevenueCat fuer In-App-Kaeufe auf Android. Web bleibt bei
Stripe. Der Code ist bereits verdrahtet — du musst einmalig die Produkte
in Play Console + RevenueCat anlegen.

## 1. Abo-Produkte in Play Console anlegen (~15 Min)

1. Play Console → deine App → linkes Menue **„Produkte → Abos"**
2. **„Abo erstellen"** → zweimal:

| Produkt-ID | Name | Laufzeit |
|---|---|---|
| `pro_monthly` | PATH Pro Monatlich | 1 Monat |
| `pro_yearly` | PATH Pro Jaehrlich | 1 Jahr |

3. Pro Abo **Basis-Tarif** hinzufuegen:
   - Tarif-ID z. B. `default`
   - Preis setzen (Land: Schweiz + alle anderen Zielmaerkte). Google
     nimmt 15 % in den ersten $1 M/Jahr. Kalkulation:
     - Wenn Stripe-Preis CHF 4.90/Monat → Play-Preis gleich lassen
       (du absorbierst die 15 %), ODER CHF 5.90 (neutral).
   - **Status**: Aktiv
4. **Pruefung einreichen** → Status „Aktiv" erscheint nach wenigen Min

> Voraussetzung: Die App muss vorher als App-Bundle hochgeladen
> worden sein (z. B. interner Test-Release). Erst dann schaltet Play
> das Produkt frei.

## 2. RevenueCat-Dashboard konfigurieren (~10 Min)

1. `app.revenuecat.com` → dein Projekt
2. **Project Settings → Apps** → **„+ New"** → **Google Play Store**
   - Package name: `ch.pixmatic.path`
   - Service Account JSON: aus Google Cloud Console exportieren
     (Play Console → Setup → API access → Service Account erstellen →
     JSON downloaden) — **RevenueCat braucht diese fuer die Validierung**
3. **Products** (linkes Menue) → **„+ New"** zweimal:
   - Product ID: `pro_monthly` → Store: Play Store → Play-Produkt mappen
   - Product ID: `pro_yearly` → dto.
4. **Entitlements** → **„+ New"**:
   - Identifier: **`pro`** (muss exakt so heissen — `PRO_ENTITLEMENT`
     im Code verweist darauf)
   - Beide Produkte (`pro_monthly`, `pro_yearly`) diesem Entitlement
     zuweisen
5. **Offerings** → „default" Offering anlegen (wird automatisch
   vorgeschlagen) mit den beiden Produkten als Packages. Das ist was
   die Paywall anzeigt.
6. **Paywalls** (linkes Menue) → **„+ New Paywall"** → visuellen
   Editor benutzen, Inhalte in Deutsch + Englisch pflegen. Einmal
   **Publish** → fertig.

## 3. RevenueCat-SDK-Key setzen

Der Public SDK-Key fuer Android liegt unter **Project Settings → API
Keys** im RevenueCat-Dashboard (beginnt mit `goog_` fuer Play).

Optional ins CI einfliessen lassen:
- GitHub Secret **`VITE_REVENUECAT_ANDROID_KEY`** = dein `goog_…` Key
- In `.github/workflows/android.yml` und `android-release.yml` als
  Env-Var in den `npm run build` Step

Ohne Secret greift `src/lib/revenuecat.ts` auf den im Code
hinterlegten Test-Key zurueck (nur fuer Sandbox-Tests geeignet —
fuer Produktion ersetzen).

## 4. Supabase-Auth-Sync

Im Client synchronisiert `src/lib/revenuecat.ts` bei jedem
`CustomerInfoUpdate`-Event automatisch das `plan`-Feld in
Supabase-user_metadata (`plan = 'pro'` / `'free'`). Dadurch:
- Web-Version erkennt den Pro-Status nach Login
- AI-Quota / Limits funktionieren weiter unveraendert
- Stripe-User + Play-User leben in derselben `plan`-Spalte

Fuer serverseitige Sicherheit (Receipt-Validation unabhaengig vom
Client) kannst du spaeter einen RevenueCat-Webhook auf eine Supabase-
Edge-Function zeigen lassen — Setup unter Dashboard → Integrations →
Webhooks. Nicht zwingend fuer V1.

## 5. Test-Ablauf

1. Play Console → **Interne Tests** → Test-Tester eintragen (eigene
   Gmail-Adresse)
2. Opt-in-Link auf Test-Geraet oeffnen, App aus Play installieren
3. In der App „Upgrade auf Pro" tippen → RevenueCat-Paywall
4. Kauf mit Test-Zahlungsmethode (Play Console → Settings → License
   testing → dein Google-Konto als Tester)
5. Nach Kauf: `plan = 'pro'` in Supabase, Pro-Features sofort aktiv
6. „Abo verwalten" → oeffnet Customer Center (Kuendigen, History)

## 6. Preis-Sync Web ↔ Mobile

Play-Store-Policy verbietet Cross-Selling (z. B. „Abo woanders
abschliessen"). Der Pro-Status synct aber trotzdem:
- Stripe (Web) → Webhook schreibt `plan = 'pro'` in Supabase
- RevenueCat (Mobile) → Client-Sync schreibt `plan = 'pro'`

User bekommt Pro automatisch auf beiden Plattformen, egal wo er
gekauft hat. Kuendigung muss aber am **Kauf-Ort** erfolgen.
