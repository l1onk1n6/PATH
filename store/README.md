# Play-Store-Release: Komplette Anleitung

Dieser Ordner enthaelt alles was du brauchst, um PATH in den Google Play
Store zu bringen.

```
store/
├── listing-de.md            # Store-Texte (Deutsch)
├── listing-en.md            # Store-Texte (Englisch)
├── feature-graphic.png      # 1024×500 Banner fuer Store-Listing
├── app-icon-512.png         # 512×512 App-Icon
├── screenshots/
│   ├── 01-dashboard.png     # 1080×1920 Phone Screenshot
│   ├── 02-templates.png
│   ├── 03-pdf-export.png
│   └── 04-tracker.png
└── README.md                # Dieses Dokument
```

Assets koennen per `node scripts/generate-store-assets.mjs` neu generiert
werden (passt das SVG-Template im Script an wenn du aendern willst).

---

## Schritt 1 – GitHub Secrets setzen (einmalig, ~5 Min)

Gehe auf **`github.com/l1onk1n6/PATH/settings/secrets/actions`**
→ Button **„New repository secret"** und lege diese drei an:

| Name | Wert |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | siehe unten, Block **„Base64-Keystore"** |
| `ANDROID_KEYSTORE_PASSWORD` | `gBViQmAsL9o3EYRruD7N` |
| `ANDROID_KEY_ALIAS` | `path-upload` |

> ⚠️ **Kritisch:** Der Keystore ist dein Signatur-Schluessel fuer IMMER.
> Speichere Passwort + Base64 zusaetzlich im Passwort-Manager (1Password,
> Bitwarden). Wenn du ihn verlierst, kannst du die App im Play Store nie
> wieder aktualisieren — Google kann ihn nicht wiederherstellen.

### Base64-Keystore

Den vollstaendigen Base64-String bekommst du von der Chat-Antwort, in der
der Keystore generiert wurde (der lange Block unter `---B64-SECTION---`).
Falls du ihn nicht mehr hast: neu generieren lassen, Secret aktualisieren.

### SHA-256-Fingerabdruck (fuer Supabase-Konfiguration & App Links)

```
17:C5:16:C4:9A:B6:7E:5E:49:FC:64:93:0A:FA:1C:E5:4A:9F:F9:92:2C:A5:46:C7:32:A4:9A:F7:01:6E:80:66
```

---

## Schritt 2 – Google-Play-Konto anlegen (einmalig, ~15 Min + 25 USD)

1. `play.google.com/console` oeffnen → „Jetzt anmelden"
2. Google-Konto waehlen (idealerweise `info@pixmatic.ch`)
3. **25 USD Registrierungsgebuehr** bezahlen (einmalig, lebenslang)
4. Entwicklerprofil ausfuellen (Name, Land, Kontakt)
5. Identitaet verifizieren (Google schickt evtl. einen Code per Post —
   dauert 1–2 Wochen; App-Upload geht parallel schon)

---

## Schritt 3 – App im Play Console anlegen (~10 Min)

1. Play Console → **„App erstellen"**
2. Eingabe:
   - Name: **PATH** (oder „PATH — Bewerbungsmappe")
   - Standardsprache: **Deutsch**
   - App oder Spiel: **App**
   - Kostenlos / Kostenpflichtig: **Kostenlos**
3. Zwei Checkboxen (Richtlinien) bestaetigen
4. Linkes Menue → **„Dashboard"** fuehrt durch Pflicht-Einstellungen

**Pflichtfragen** (alle unter Dashboard auffindbar):

| Bereich | Wert |
|---|---|
| Datenschutzerklaerung | `https://pixmatic.ch/datenschutz` |
| App-Zugriff | „Alle Funktionen sind ohne besondere Zugriffs­erlaubnisse verfuegbar" → nein, **Login noetig** — Demo-Zugang fuer Reviewer angeben |
| Werbung | „Enthaelt keine Werbung" |
| Inhaltsklassifizierung | Fragebogen ausfuellen (keine Gewalt, keine Glueckspiele — PEGI 3) |
| Zielgruppe & Inhalt | **18+** (wegen DSGVO-Datenverarbeitung) |
| Datensicherheit | Formular — „Wir sammeln: E-Mail, Name, Berufsdaten; verschluesselt uebertragen & gespeichert; Loeschung auf Anfrage moeglich" |
| Regierungs-App | Nein |
| Finanz-App | Nein |

**Demo-Zugang fuer Google-Reviewer**: lege in der Live-App einen
Test-Account an (z. B. `playreview@pixmatic.ch` + sicheres Passwort) und
trage die Credentials im Review-Dialog ein.

---

## Schritt 4 – Store-Listing ausfuellen (~15 Min)

In Play Console: **„Hauptbereich des Stores"** → **„Store-Eintrag"**

Quelle fuer alle Texte: `store/listing-de.md` und `store/listing-en.md`.

1. **Titel** (30 Zeichen) → aus `listing-de.md` kopieren
2. **Kurzbeschreibung** (80 Zeichen)
3. **Vollstaendige Beschreibung** (4000 Zeichen)
4. **App-Symbol** → `store/app-icon-512.png` hochladen
5. **Funktionsgrafik** → `store/feature-graphic.png` hochladen
6. **Telefon-Screenshots** (min. 2, max. 8) → alle 4 aus
   `store/screenshots/` hochladen
7. **Kategorie** → Produktivitaet
8. **Tags** → Productivity, Business
9. **Kontaktdaten** → `info@pixmatic.ch`, `https://path.pixmatic.ch`
10. **Datenschutzerklaerung** → `https://pixmatic.ch/datenschutz`

Englische Uebersetzung kannst du spaeter unter „Uebersetzungen
verwalten" hinzufuegen (Texte stehen in `listing-en.md` bereit).

---

## Schritt 5 – Signiertes AAB bauen (automatisch via CI)

1. GitHub → Reiter **Actions** → links **„Build Signed Android AAB
   (Play Store)"**
2. Rechts oben **„Run workflow"** klicken
3. (Optional) `versionName` z. B. `1.0.0`, `versionCode` z. B. `1`
   eintragen. Beim ersten Release kannst du die Felder leer lassen —
   dann werden die Werte aus `android/app/build.gradle` genommen.
4. Run startet, dauert ~6 Min beim ersten Mal
5. Wenn gruen: Artifact **`path-release-aab`** unten auf der Run-Seite
   → ZIP herunterladen → `app-release.aab` entpacken

> **Wichtig:** `versionCode` muss bei JEDEM neuen Release um mindestens
> 1 erhoeht werden (`1`, `2`, `3`, …). Sonst lehnt Play Store den Upload
> ab.

---

## Schritt 6 – AAB hochladen & Test-Release (~10 Min)

Play Console empfiehlt, mit **Internal Testing** anzufangen, nicht
direkt Produktion:

1. Linkes Menue → **„Tests"** → **„Interner Test"**
2. Tab **„Tester"** → neue Liste anlegen, deine E-Mail eintragen
3. Tab **„Releases"** → **„Neues Release erstellen"**
4. Zeile **„App-Bundles"**: `app-release.aab` hochladen
5. Release-Name z. B. `1.0.0` (wird automatisch aus AAB gelesen)
6. Release-Notes einfuegen (siehe `listing-de.md`, Abschnitt
   „Release Notes")
7. **„Speichern"** → **„Pruefung starten"**
8. Nach 1–3 Tagen (Google-Review): Link zum Testen kommt per Mail

---

## Schritt 7 – Nach erfolgreichem Test: Produktion (~2 Min)

1. Linkes Menue → **„Produktion"**
2. **„Neues Release erstellen"** → „Aus internem Test uebernehmen"
3. Release-Notes anpassen
4. **„Veroeffentlichen"** → Google prueft nochmal (1–7 Tage)
5. App ist live in allen Laendern die du ausgewaehlt hast

---

## Updates spaeter

Fuer jede neue Version:

1. Code-Aenderung → `git push origin main`
2. Actions → **„Build Signed Android AAB"** → Run workflow, mit
   erhoehtem `versionCode` (z. B. `2`) und neuem `versionName`
3. AAB herunterladen
4. Play Console → Produktion → Neues Release → AAB hochladen →
   Release-Notes → Pruefung starten

---

## App Links (Supabase-Auth-Mails oeffnen App)

Damit Klicks auf Magic-Link- / Password-Reset-Mails direkt die App
oeffnen (statt Browser), braucht es **Digital Asset Links**. Datei
`.well-known/assetlinks.json` auf `path.pixmatic.ch`:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "ch.pixmatic.path",
    "sha256_cert_fingerprints": [
      "17:C5:16:C4:9A:B6:7E:5E:49:FC:64:93:0A:FA:1C:E5:4A:9F:F9:92:2C:A5:46:C7:32:A4:9A:F7:01:6E:80:66"
    ]
  }
}]
```

> **Wichtig**: Wenn Google Play App-Signing aktiviert ist (Standard seit
> 2021), ueberschreibt Google deinen Upload-Key mit ihrem eigenen
> **App-Signing-Key**. Den SHA-256-Fingerabdruck davon findest du in
> Play Console unter **„Einrichtung → App-Integritaet → App-Signatur"**.
> Erst wenn du dort den finalen Fingerabdruck hast, funktionieren App
> Links zuverlaessig.
