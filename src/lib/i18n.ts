/**
 * Minimal-i18n-Setup. Deutsch ist Quelle (= Key). Andere Sprachen
 * mappen die Quell-Strings auf ihre Uebersetzung.
 *
 * Migration-Pattern in Komponenten:
 *   const t = useT();
 *   return <button>{t('Anmelden')}</button>;
 *
 * Strings ohne Mapping fallen auf den Quell-String zurueck — d. h. eine
 * Uebersetzung kann inkrementell ergaenzt werden, ohne dass irgendwas
 * bricht.
 */
import { create } from 'zustand';

export type Locale = 'de' | 'en';

const STORAGE_KEY = 'path-locale';

const TRANSLATIONS: Record<Locale, Record<string, string>> = {
  de: {}, // Identitaet — keys sind bereits die deutschen Quell-Strings
  en: {
    // ── Auth ─────────────────────────────────────────────
    'Anmelden': 'Sign in',
    'Registrieren': 'Sign up',
    'Konto erstellen': 'Create account',
    'E-Mail': 'Email',
    'Passwort': 'Password',
    'Passwort vergessen?': 'Forgot password?',
    'Mit Magic Link anmelden': 'Sign in with magic link',
    'Magic Link': 'Magic Link',
    'Magic Link senden': 'Send magic link',
    'Reset-Link senden': 'Send reset link',
    'Neues Passwort': 'New password',
    'Passwort speichern': 'Save password',
    'Passwort bestätigen': 'Confirm password',
    'Zurück zur Anmeldung': 'Back to sign in',
    'Bitte warten…': 'Please wait…',
    'Wird gesendet…': 'Sending…',
    'Wird gespeichert…': 'Saving…',
    'ODER': 'OR',
    'Name': 'Name',
    'E-Mail bestätigen': 'Confirm email',
    'E-Mail erneut senden': 'Resend email',
    'E-Mail erneut gesendet!': 'Email resent!',
    'E-Mail gesendet': 'Email sent',
    'Passwort zurücksetzen': 'Reset password',

    // ── Account / Navigation ─────────────────────────────
    'Konto': 'Account',
    'Sicherheit': 'Security',
    'Freunde einladen': 'Invite friends',
    'Datenschutz': 'Privacy',
    'Plan & Features': 'Plan & Features',
    'Erscheinungsbild': 'Appearance',
    'System': 'System',
    'Dunkel': 'Dark',
    'Hell': 'Light',
    'Sprache': 'Language',
    'Deutsch': 'German',
    'Englisch': 'English',
    'Abmelden': 'Sign out',
    'Tour neu starten': 'Restart tour',

    // ── Dashboard / Editor ───────────────────────────────
    'Dashboard': 'Dashboard',
    'Editor': 'Editor',
    'Vorschau': 'Preview',
    'Tracker': 'Tracker',
    'Auswählen': 'Select',
    'Personen': 'People',
    'Bewerbungsmappen': 'Applications',
    'Persönliche Daten': 'Personal Info',
    'Motivationsschreiben': 'Cover Letter',
    'Berufserfahrung': 'Experience',
    'Ausbildung': 'Education',
    'Fähigkeiten': 'Skills',
    'Projekte & Zertifikate': 'Projects & Certificates',
    'Dokumente': 'Documents',
    'Eigene Sektionen': 'Custom Sections',
    'Design & Template': 'Design & Template',
    'Übersetzen': 'Translate',
    'Versionen': 'Versions',
    'Reihenfolge': 'Order',
    'Fertig': 'Done',

    // ── Dashboard ────────────────────────────────────────
    'Personen oder Mappen suchen…': 'Search people or applications…',
    'Neue Person': 'New Person',
    'Neue ': 'New ',
    'Neue Person anlegen': 'Create new person',
    'Vorname Nachname': 'First Last',
    'Erstellen': 'Create',
    'Abbruch': 'Cancel',
    'Abbrechen': 'Cancel',
    'Lebensläufe': 'Resumes',
    'Aktiv': 'Active',
    'Bewerbungen': 'Applications',
    'Zusagen': 'Offers',
    'Zusagen-Quote': 'Offer rate',
    'Pro-Features': 'Pro features',
    'Bewerbungsmappe': 'Application',
    'Ohne Titel': 'Untitled',
    'Mappe leer': 'Empty application',
    'Tage': 'days',
    'Abgelaufen': 'Expired',
    'Status: ': 'Status: ',
    'Stelle öffnen': 'Open job posting',
    'Bearbeiten': 'Edit',
    'Vorschau ansehen': 'View preview',
    'Als Vorlage duplizieren': 'Duplicate as template',
    'Mappe löschen': 'Delete application',
    'Person löschen': 'Delete person',
    'Person umbenennen': 'Rename person',
    'Umbenennen': 'Rename',
    'Speichern': 'Save',
    'Mappe öffnen': 'Open application',
    'Neue Mappe': 'New application',
    'Mappe hinzufügen': 'Add application',
    'Name der Mappe': 'Application name',
    'Hinzufügen': 'Add',
    'Person': 'Person',
    'Mappen': 'Applications',
    'Letzte Aktivität': 'Last activity',
    'EINGEFROREN': 'FROZEN',
    'gerade eben': 'just now',
    'vor': 'ago',
    'Min.': 'min',
    'Std.': 'h',
    'Tagen': 'days',
    'Monaten': 'months',
    'Jahren': 'years',
    'Limit erreicht': 'Limit reached',
    'Zu viele Anfragen': 'Too many requests',
    'ausgewählt': 'selected',
    'Löschen': 'Delete',
    'Keine Mappen vorhanden': 'No applications yet',
    'Lege deine erste Person an, um zu starten.': 'Create your first person to get started.',
    'Erste Person anlegen': 'Create first person',
    'Heute': 'Today',
    'Duplizieren': 'Duplicate',
    'Link teilen': 'Share link',
    'Link teilen ·  aktiv': 'Share link · active',
    'ATS-Score prüfen': 'Check ATS score',

    // ── Auth (additional) ────────────────────────────────
    'Wir haben dir eine Bestätigungs-E-Mail geschickt.': 'We sent you a confirmation email.',
    'Bitte klicke auf den Link in der E-Mail.': 'Please click the link in the email.',
    'E-Mail oder Passwort ist falsch.': 'Email or password is incorrect.',
    'Diese E-Mail-Adresse ist bereits registriert.': 'This email address is already registered.',
    'Das Passwort ist zu schwach. Bitte wähle ein sichereres Passwort.': 'The password is too weak. Please choose a more secure password.',
    'Sitzung abgelaufen. Bitte melde dich erneut an.': 'Session expired. Please sign in again.',
    'Verbindungsfehler. Bitte prüfe deine Internetverbindung.': 'Connection error. Please check your internet connection.',
    'Zu viele Anfragen. Bitte warte einige Minuten.': 'Too many requests. Please wait a few minutes.',
    'Wir haben dir einen Link zum Zurücksetzen deines Passworts geschickt. Bitte prüfe dein Postfach.': 'We sent you a link to reset your password. Please check your inbox.',
    'Gib deine E-Mail-Adresse ein. Wir senden dir einen Link zum Zurücksetzen.': 'Enter your email address. We will send you a reset link.',
    'Wir haben dir einen Anmeldelink an': 'We sent you a sign-in link to',
    'geschickt. Der Link ist 60 Minuten gültig.': '. The link is valid for 60 minutes.',
    'Link gesendet': 'Link sent',
    'Gib deine E-Mail-Adresse ein. Wir senden dir einen einmaligen Anmeldelink – kein Passwort nötig.': 'Enter your email address. We will send you a one-time sign-in link — no password needed.',
    'Wähle ein neues Passwort für dein Konto.': 'Choose a new password for your account.',
    'Mindestens 8 Zeichen': 'At least 8 characters',
    'Passwort eingeben': 'Enter password',
    'Passwort wiederholen': 'Repeat password',
    'Die Passwörter stimmen nicht überein.': 'The passwords do not match.',
    'Passwortstärke': 'Password strength',
    'Schwach': 'Weak',
    'Mittel': 'Medium',
    'Stark': 'Strong',
    'Zu viele Versuche. Bitte warte': 'Too many attempts. Please wait',
    'Sekunden.': 'seconds.',
    'Zurück': 'Back',

    // ── Common ───────────────────────────────────────────
    'Ja': 'Yes',
    'Nein': 'No',
    'OK': 'OK',
    'Schliessen': 'Close',
    'Weiter': 'Next',
    'Zurück zur Liste': 'Back to list',
    'Keine Daten': 'No data',
    'Lädt…': 'Loading…',
    'Verbinde…': 'Connecting…',
    'Synchronisiert': 'Synced',
    'Synchronisiert…': 'Syncing…',
    'Speichert…': 'Saving…',
    'Gespeichert': 'Saved',
    'Lokal': 'Local',
    'Offline': 'Offline',
    'Heute aktiv': 'Active today',
    'Menü öffnen': 'Open menu',
    'Kein Profil ausgewählt': 'No profile selected',
    'PATH Pro — alle Features aktiv': 'PATH Pro — all features active',
    'Upgrade auf PATH Pro': 'Upgrade to PATH Pro',

    // ── Dashboard (additional) ───────────────────────────
    'Vollständigkeit': 'Completeness',
    'Status setzen': 'Set status',
    'Person anlegen': 'Create person',
    'Mappe gestalten': 'Build application',
    'PDF & Teilen': 'PDF & share',
    'Name + Kontaktdaten erfassen': 'Capture name + contact data',
    'Werdegang, Skills, Template': 'Career, skills, template',
    'Export oder öffentlicher Link': 'Export or public link',
    'wirklich löschen?': 'really delete?',
    'Upgrade auf Pro zum Bearbeiten': 'Upgrade to Pro to edit',
    'Mappe': 'Application',
    'Mappen leer': 'No applications',
    'Suchen': 'Search',
    'Status': 'Status',
    'Entwurf': 'Draft',
    'Gesendet': 'Sent',
    'Interview': 'Interview',
    'Abgelehnt': 'Rejected',
    'Angenommen': 'Accepted',

    // ── AccountPage ──────────────────────────────────────
    'PROFIL': 'PROFILE',
    'E-MAIL-ADRESSE': 'EMAIL ADDRESS',
    'KONTO-DETAILS': 'ACCOUNT DETAILS',
    'APP-TOUR': 'APP TOUR',
    'SUPPORT': 'SUPPORT',
    'SITZUNG': 'SESSION',
    'PASSWORT': 'PASSWORD',
    'AKTIVE SITZUNG': 'ACTIVE SESSION',
    'DEIN EINLADUNGSLINK': 'YOUR INVITE LINK',
    'DEINE STATISTIK': 'YOUR STATS',
    'RECHTLICHES': 'LEGAL',
    'DATENVERARBEITUNG': 'DATA PROCESSING',
    'DATEN-EXPORT (DSGVO Art. 20)': 'DATA EXPORT (GDPR Art. 20)',
    'GEFAHRENZONE': 'DANGER ZONE',
    'PLAN & FEATURES': 'PLAN & FEATURES',
    'DEIN PLAN': 'YOUR PLAN',
    'AKTIVE FEATURES': 'ACTIVE FEATURES',
    'NUTZUNG': 'USAGE',
    'Telefon': 'Phone',
    'Strasse & Nr.': 'Street & no.',
    'PLZ': 'Postal code',
    'Ort': 'City',
    'Land': 'Country',
    'Konto löschen anfragen': 'Request account deletion',
    'Daten herunterladen': 'Download data',
    'Geteiltes hier herunterladen': 'Download shared here',
    'Wir senden einen Link an': 'We will send a link to',
    'zum Zurücksetzen des Passworts.': 'to reset your password.',
    'E-Mail gesendet — bitte prüfe dein Postfach.': 'Email sent — please check your inbox.',
    'Mitglied seit': 'Member since',
    'Profil bearbeiten': 'Edit profile',
    'Profil-Daten gespeichert': 'Profile data saved',
    'Speichern fehlgeschlagen': 'Save failed',
    'Schweiz': 'Switzerland',
    'E-Mail ändern': 'Change email',
    'Bestätigung senden': 'Send confirmation',
    'Bestätigungs-E-Mail gesendet': 'Confirmation email sent',
    'Wir haben einen Bestätigungslink an': 'We sent a confirmation link to',
    'geschickt. Klicke auf den Link, um die Änderung abzuschliessen.':
      'The change becomes active once you click the link.',
    'neue@beispiel.de': 'new@example.com',
    'Wir senden einen Bestätigungslink an die neue Adresse — die Änderung wird erst nach dem Klick aktiv.':
      'We will send a confirmation link to the new address — the change is applied after you click it.',
    'Ändern': 'Change',
    'Englische Übersetzungen sind teilweise verfügbar — bestehende Stellen werden schrittweise migriert.':
      'English translations are partially available — existing strings are migrated incrementally.',

    // ── Privacy ──────────────────────────────────────────
    'Lade alle deine Daten als JSON-Datei herunter. Dokumentenanhänge (Base64) werden aus Datenschutzgründen nicht mitexportiert.':
      'Download all your data as a JSON file. Document attachments (Base64) are excluded for privacy reasons.',
    'Zum Löschen deines Kontos kontaktiere uns bitte direkt — wir entfernen alle Daten innerhalb von 30 Tagen.':
      'To delete your account, contact us directly — we will remove all data within 30 days.',
    'Datenschutzerklärung': 'Privacy policy',
    'Impressum': 'Imprint',
    'AGB': 'Terms',
    'Cookies': 'Cookies',

    // ── Plan ─────────────────────────────────────────────
    'Free': 'Free',
    'Pro': 'Pro',
    'Pro-Aktivierung läuft…': 'Activating Pro…',
    'Aktivierung verzögert': 'Activation delayed',
    'Nochmals prüfen': 'Check again',
    'Zahlung bestätigt — warte auf Aktivierung (max. 15 Sek.)':
      'Payment confirmed — waiting for activation (max 15 sec)',
    'Willkommen bei PATH Pro!': 'Welcome to PATH Pro!',
    'Dein Upgrade war erfolgreich. Alle Pro-Features sind jetzt aktiv.':
      'Your upgrade was successful. All Pro features are active now.',
    'Auf Pro upgraden': 'Upgrade to Pro',
    'Abo verwalten': 'Manage subscription',
    'Upgrade auf Pro': 'Upgrade to Pro',
    'Verfügbar': 'Available',

    // ── Security ─────────────────────────────────────────
    'Sitzung beenden': 'End session',
    'Du wirst nach 5 Minuten Inaktivität automatisch abgemeldet.':
      'You will be signed out automatically after 5 minutes of inactivity.',
    'Aktive Sitzungen': 'Active sessions',

    // ── Referral ─────────────────────────────────────────
    'Lade Freunde ein und erhalte beide einen Pro-Bonus.':
      'Invite friends — both receive a Pro bonus.',
    'Kopiert': 'Copied',
    'Kopieren': 'Copy',
    'Eingeladen': 'Invited',
    'Erfolgreich': 'Successful',
    'Bonus erhalten': 'Bonus received',

    // ── Editor: PersonalInfoEditor ───────────────────────
    'Vorname': 'First name',
    'Nachname': 'Last name',
    'Berufsbezeichnung': 'Job title',
    'Kontaktdaten': 'Contact details',
    'Telefonnummer': 'Phone number',
    'Webseite': 'Website',
    'Website': 'Website',
    'GitHub': 'GitHub',
    'LinkedIn': 'LinkedIn',
    'Adresse': 'Address',
    'Strasse': 'Street',
    'Strasse und Hausnummer': 'Street and number',
    'Ort / PLZ': 'City / postal code',
    'PLZ / Ort': 'Postal code / city',
    'Kurzzusammenfassung / Profil': 'Summary / Profile',
    'Kurze Beschreibung Ihrer Berufserfahrung, Stärken und Ziele...':
      'Short description of your experience, strengths and goals...',
    'z.B. Senior Software Engineer': 'e.g. Senior Software Engineer',
    'Musterstrasse 12': 'Sample Street 12',
    'Max': 'Max',
    'Mustermann': 'Mustermann',
    '+49 123 456789': '+49 123 456789',
    '8000 Zürich': '8000 Zurich',
    'www.beispiel.de': 'www.example.com',
    'linkedin.com/in/max': 'linkedin.com/in/jane',
    'github.com/max': 'github.com/jane',
    'Profilbild': 'Profile picture',
    'Foto entfernen': 'Remove photo',
    'Foto hochladen': 'Upload photo',
    'Bild zu groß. Maximal {max} MB erlaubt.': 'Image too large. Maximum {max} MB allowed.',
    'Aus LinkedIn importieren': 'Import from LinkedIn',

    // ── Editor: Experience / Education ───────────────────
    'z.B. Tech GmbH': 'e.g. Tech Corp',
    'z.B. Senior Developer': 'e.g. Senior Developer',
    'Berlin': 'Berlin',
    'z.B. Universität Zürich': 'e.g. University of Zurich',
    'z.B. Bachelor of Science': 'e.g. Bachelor of Science',
    'Beschreibung': 'Description',
    'Beschreibe Aufgaben, Erfolge und verwendete Technologien…': 'Describe tasks, achievements and technologies used…',
    'Position': 'Position',
    'Firma': 'Company',
    'Standort': 'Location',
    'Von': 'From',
    'Bis': 'To',
    'aktuell': 'current',
    'Aktuell': 'Currently',
    'Studienrichtung / Fachrichtung': 'Field of study',
    'Bildungseinrichtung': 'Institution',
    'Abschluss': 'Degree',
    'Note': 'Grade',
    'Eintrag hinzufügen': 'Add entry',
    'Eintrag entfernen': 'Remove entry',
    'Anschreiben': 'Cover letter',

    // ── Editor: Skills / Languages / Projects ────────────
    'Fähigkeit (z.B. React, Python...)': 'Skill (e.g. React, Python...)',
    'Kategorie': 'Category',
    'Sprache hinzufügen': 'Add language',
    'Skill hinzufügen': 'Add skill',
    'Projekt hinzufügen': 'Add project',
    'Zertifikat hinzufügen': 'Add certificate',
    'Sprachen': 'Languages',
    'Projekte': 'Projects',
    'Zertifikate': 'Certificates',
    'Niveau': 'Level',
    'Grundkenntnisse': 'Basic',
    'Fortgeschritten': 'Intermediate',
    'Fließend': 'Fluent',
    'Muttersprache': 'Native',
    'Grundlagen': 'Foundations',
    'Fachkundig': 'Proficient',
    'Experte': 'Expert',
    'Projektname': 'Project name',
    'Rolle': 'Role',
    'Technologien': 'Technologies',
    'URL': 'URL',
    'Aussteller': 'Issuer',
    'Datum': 'Date',
    'Zertifikatsname': 'Certificate name',

    // ── Editor: CoverLetter ──────────────────────────────
    'Empfänger': 'Recipient',
    'Firmenname / Personalabteilung': 'Company / HR department',
    'Adresszeile': 'Address line',
    'Strasse / Ort der Firma': 'Company street / city',
    'Stadt / PLZ': 'City / postal code',
    'Betreff': 'Subject',
    'z.B. Bewerbung als Senior Developer': 'e.g. Application as Senior Developer',
    'Anrede': 'Salutation',
    'Sehr geehrte Damen und Herren,': 'Dear Sir or Madam,',
    'Anschreiben-Text': 'Cover letter text',
    'Schreiben Sie hier Ihren Anschreiben-Text...':
      'Write your cover letter text here...',
    'Grussformel': 'Closing',
    'Mit freundlichen Grüssen': 'Sincerely',
    'Mit KI verbessern': 'Improve with AI',
    'Mit KI generieren': 'Generate with AI',
    'Stellenbeschreibung': 'Job description',
    'Vorlagen': 'Templates',

    // ── Editor: Documents ────────────────────────────────
    'Datei hochladen': 'Upload file',
    'Datei wählen': 'Choose file',
    'Dateien hier ablegen oder klicken': 'Drop files here or click',
    'Maximale Dateigrösse': 'Maximum file size',
    'Sonstiges': 'Other',
    'Zeugnis': 'Certificate',
    'Empfehlungsschreiben': 'Reference letter',
    'Unterstützte Formate': 'Supported formats',

    // ── Editor: Custom Sections ──────────────────────────
    'Titel': 'Title',
    'Inhalt': 'Content',
    'Eigene Sektion': 'Custom section',
    'Neue Sektion': 'New section',

    // ── Editor: Template ─────────────────────────────────
    'Akzentfarbe': 'Accent color',
    'Template auswählen': 'Choose template',
    'Template wählen': 'Choose template',
    'Eigene Farbe': 'Custom color',

    // ── Editor: General ──────────────────────────────────
    'Drag & Drop oder Pfeiltasten zum Sortieren': 'Drag & drop or arrow keys to reorder',
    'Eintrag löschen?': 'Delete entry?',
    'Eintrag duplizieren': 'Duplicate entry',

    // ── Modals: Onboarding ───────────────────────────────
    'Willkommen bei PATH': 'Welcome to PATH',
    'Dein persönlicher Bewerbungsassistent.': 'Your personal application assistant.',
    'Lass uns in 2 Minuten alles einrichten.': 'Let\'s set everything up in 2 minutes.',
    'Loslegen': 'Get started',
    'Überspringen': 'Skip',
    'SCHRITT 1 VON 2': 'STEP 1 OF 2',
    'SCHRITT 2 VON 2': 'STEP 2 OF 2',
    'Wie heisst du?': 'What\'s your name?',
    'Wir legen dein erstes Profil an.': 'We\'ll create your first profile.',
    'Profil anlegen': 'Create profile',
    'Erstelle…': 'Creating…',
    'Was PATH kann': 'What PATH can do',
    'Mit Beispieldaten starten': 'Start with sample data',
    'Empfohlen — du kannst alle Daten später bearbeiten':
      'Recommended — you can edit everything later',
    'Mit leerer Mappe starten': 'Start with empty application',
    'Erstelle für jede Stelle eine eigene Mappe mit Lebenslauf und Anschreiben.':
      'Create a separate application with resume and cover letter for each job.',
    'KI-Unterstützung': 'AI Support',
    'Lass dir Anschreiben generieren, Texte verbessern und in andere Sprachen übersetzen.':
      'Generate cover letters, improve texts and translate to other languages.',
    'Link teilen & Export': 'Share link & export',
    'Teile deinen Lebenslauf als Link oder exportiere ihn als professionelles PDF.':
      'Share your resume as a link or export it as a professional PDF.',
    'Deadline-Reminder': 'Deadline reminders',
    'Verpasse keine Bewerbungsfrist — erhalte Erinnerungen per E-Mail.':
      'Never miss a deadline — receive email reminders.',

    // ── Modals: Upgrade / ProGate ────────────────────────
    'Pro freischalten': 'Unlock Pro',
    'Diese Funktion ist Teil von PATH Pro.': 'This feature is part of PATH Pro.',
    'Was du mit Pro bekommst': 'What you get with Pro',
    'Unbegrenzte Bewerbungsmappen': 'Unlimited applications',
    'Unbegrenzte Personen': 'Unlimited people',
    'Versionshistorie': 'Version history',
    'KI-Anschreiben generieren': 'AI cover letter generation',
    'KI-Übersetzungen': 'AI translations',
    'ATS-Score-Analyse': 'ATS score analysis',
    'Premium-Templates': 'Premium templates',
    'CHF': 'CHF',
    '/ Monat': '/ month',
    '/ Jahr': '/ year',
    'Monatlich': 'Monthly',
    'Jährlich': 'Yearly',
    'sparen': 'save',
    'Jederzeit kündbar.': 'Cancel anytime.',
    'Jetzt Upgraden': 'Upgrade now',
    'Vielleicht später': 'Maybe later',
    'Wird geladen…': 'Loading…',

    // ── Modals: ShareModal ───────────────────────────────
    'Lebenslauf teilen': 'Share resume',
    'Erstelle einen öffentlichen Link — der Lebenslauf ist ohne Login einsehbar.':
      'Create a public link — the resume is viewable without sign-in.',
    'Link generieren': 'Generate link',
    'Link deaktivieren': 'Deactivate link',
    'Aufruf': 'view',
    'Aufrufe': 'views',
    'Noch nicht aufgerufen': 'Not viewed yet',
    'Share-Link-Limit erreicht': 'Share link limit reached',
    'Deaktiviere einen anderen Link oder upgrade auf Pro.': 'Deactivate another link or upgrade to Pro.',

    // ── Modals: Shortcuts Help ───────────────────────────
    'Tastatur-Kürzel': 'Keyboard shortcuts',
    'Diese Hilfe anzeigen': 'Show this help',
    'Sidebar einklappen / ausklappen': 'Collapse / expand sidebar',
    'Tipp: Drücke': 'Tip: press',
    'jederzeit, um diese Liste zu öffnen.': 'anytime to open this list.',

    // ── Modals: ATS Dialog ───────────────────────────────
    'ATS-Score': 'ATS score',
    'Stellenbeschreibung einfügen': 'Paste job description',
    'Füge die Stellenbeschreibung ein, um deinen ATS-Score zu prüfen.':
      'Paste the job description to check your ATS score.',
    'Score berechnen': 'Calculate score',
    'Score wird berechnet…': 'Calculating score…',
    'Sehr gute Übereinstimmung': 'Very good match',
    'Solide Übereinstimmung': 'Solid match',
    'Mittlere Übereinstimmung': 'Average match',
    'Niedrige Übereinstimmung': 'Low match',
    'Gefundene Schlüsselwörter': 'Matched keywords',
    'Fehlende Schlüsselwörter': 'Missing keywords',
    'Tipps': 'Tips',

    // ── Modals: Translate ────────────────────────────────
    'In andere Sprache übersetzen': 'Translate to another language',
    'Zielsprache': 'Target language',
    'Übersetzen…': 'Translating…',
    'Übersetze…': 'Translating…',
    'Lebenslauf übersetzen': 'Translate resume',
    'Anschreiben übersetzen': 'Translate cover letter',
    'Alle Textfelder werden übersetzt': 'All text fields will be translated',
    'Übersetzung abgeschlossen!': 'Translation complete!',
    'Andere…': 'Other…',
    'Sprache eingeben…': 'Enter language…',
    'Jetzt übersetzen': 'Translate now',
    'Kein übersetzbarer Text gefunden.': 'No translatable text found.',
    'Übersetzt: Zusammenfassung, Berufserfahrung, Ausbildung, Projekte, eigene Sektionen, Anschreiben. Namen, Daten und Kontaktdaten bleiben unverändert.':
      'Translated: summary, work experience, education, projects, custom sections, cover letter. Names, dates and contact info stay unchanged.',
    'Französisch': 'French',
    'Italienisch': 'Italian',
    'Spanisch': 'Spanish',
    'Portugiesisch': 'Portuguese',
    'Niederländisch': 'Dutch',
    'Polnisch': 'Polish',
    'Russisch': 'Russian',
    'Chinesisch (Vereinfacht)': 'Chinese (Simplified)',
    'Japanisch': 'Japanese',
    'Arabisch': 'Arabic',

    // ── Setup (Supabase) ─────────────────────────────────
    'Supabase konfigurieren': 'Configure Supabase',
    'Verbinden Sie Ihr eigenes Supabase-Projekt für sichere Cloud-Synchronisation.':
      'Connect your own Supabase project for secure cloud sync.',
    'So richten Sie Supabase ein': 'How to set up Supabase',
    'Kostenloses Konto auf supabase.com erstellen': 'Create a free account on supabase.com',
    'Neues Projekt anlegen': 'Create a new project',
    'SQL Editor → schema.sql ausführen': 'SQL Editor → run schema.sql',
    'Settings → API → URL & anon key kopieren': 'Settings → API → copy URL & anon key',
    'Supabase Dashboard öffnen': 'Open Supabase dashboard',
    'Project URL': 'Project URL',
    'anon / public Key': 'anon / public key',
    'Ungültige URL. Format: https://xxx.supabase.co':
      'Invalid URL. Format: https://xxx.supabase.co',
    'Ungültiger API-Key. Muss mit "eyJ" beginnen.':
      'Invalid API key. Must start with "eyJ".',
    'Verbindung herstellen': 'Connect',
    'Gespeichert – Seite wird neu geladen…': 'Saved – reloading page…',
    'Überspringen (bereits konfiguriert)': 'Skip (already configured)',

    // ── Auth Callback ────────────────────────────────────
    'E-Mail wird bestätigt…': 'Confirming email…',
    'Bitte warte einen Moment.': 'Please wait a moment.',
    'E-Mail bestätigt!': 'Email confirmed!',
    'Dein Konto ist jetzt aktiv. Du wirst weitergeleitet…': 'Your account is now active. Redirecting…',
    'Anmeldung läuft…': 'Signing you in…',
    'Du wirst gleich eingeloggt.': 'You will be logged in shortly.',
    'Erfolgreich angemeldet!': 'Successfully signed in!',
    'Du wirst zur App weitergeleitet…': 'Redirecting to the app…',
    'Passwort-Reset wird vorbereitet…': 'Preparing password reset…',
    'Bereit!': 'Ready!',
    'Du kannst jetzt dein neues Passwort setzen.': 'You can now set a new password.',
    'Einladung wird verarbeitet…': 'Processing invitation…',
    'Gleich kannst du dein Konto einrichten.': 'You can set up your account in a moment.',
    'Einladung angenommen!': 'Invitation accepted!',
    'Du wirst weitergeleitet…': 'Redirecting…',
    'Wird verarbeitet…': 'Processing…',
    'Fertig!': 'Done!',
    'Fehler aufgetreten': 'An error occurred',
    'Der Link ist ungültig oder abgelaufen.': 'The link is invalid or has expired.',
    'Das Formular zum Passwort setzen erscheint gleich…': 'The password form will appear shortly…',

    // ── Shared Resume (public link) ──────────────────────
    'Bewerbungsmappe wird geladen…': 'Loading application…',
    'Bewerbungsmappe nicht gefunden': 'Application not found',
    'Dieser Link ist ungültig oder wurde deaktiviert.': 'This link is invalid or has been disabled.',
    'Die Mappe konnte nicht gerendert werden. Bitte lade die Seite neu.':
      'The application could not be rendered. Please reload the page.',

    // ── Tracker ──────────────────────────────────────────
    'Bewerbungs-Tracker': 'Application tracker',
    'Noch keine Bewerbungen': 'No applications yet',
    'Bewerbung hinzufügen': 'Add application',
    'Stelle': 'Job',
    'Stelleninserat URL': 'Job posting URL',
    'Bewerbungsdatum': 'Application date',
    'Deadline (optional)': 'Deadline (optional)',
    'Bewerbungsart': 'Application type',
    'Notizen': 'Notes',
    'Kontaktperson, Gesprächsthemen, Eindrücke...': 'Contact person, talking points, impressions...',
    'Aus Mappe importieren': 'Import from application',
    'z.B. Google AG': 'e.g. Google Inc.',
    'z.B. Product Manager': 'e.g. Product Manager',
    'Direkt-Bewerbung': 'Direct application',
    'Initiativ-Bewerbung': 'Speculative application',
    'Empfehlung': 'Referral',
    'Beobachten': 'Watch',
    'Schon beworben': 'Already applied',
    'Statistik': 'Stats',
    'Gesamt': 'Total',

    // ── Preview ──────────────────────────────────────────
    'Kein Lebenslauf ausgewählt': 'No resume selected',
    'Zum Dashboard': 'To dashboard',
    'Templates': 'Templates',
    'Ganze Mappe': 'Full application',
    'Nur Lebenslauf': 'Resume only',
    'Nur Motivationsschreiben': 'Cover letter only',
    'Mit Passwort…': 'With password…',
    'Download': 'Download',
    'Teilen': 'Share',
    'Vorschau wird aufgebaut…': 'Building preview…',
    'Vorschau wird geladen…': 'Loading preview…',
    'Die Vorschau konnte nicht aufgebaut werden': 'Preview could not be generated',
    'Die Vorschau konnte nicht geladen werden.': 'Preview could not be loaded.',

    // ── LandingPage ──────────────────────────────────────
    'Noch': 'Only',
    'Zufriedener Nutzer aus Zürich': 'Happy user from Zurich',
    'Google Play Store': 'Google Play Store',
    'Apple App Store': 'Apple App Store',
    'Für immer kostenlos': 'Free forever',
    'Jederzeit kündbar': 'Cancel anytime',
    'Softwareentwickler': 'Software engineer',
    'Bald im Play Store': 'Coming soon to Play Store',
    'Bald im App Store': 'Coming soon to App Store',
    'Web-App bereits jetzt kostenlos nutzbar — Apps folgen in Kürze.':
      'Web app available for free now — mobile apps coming soon.',
    'Bereit für deine': 'Ready for your',
    'Traumstelle?': 'dream job?',
    'Erstelle in wenigen Minuten einen Lebenslauf, der überzeugt. Kostenlos, ohne Kreditkarte.':
      'Build a convincing resume in minutes. Free, no credit card.',
    'Kostenlos starten': 'Start for free',
    'Volle Offline-Unterstützung': 'Full offline support',
    'Push-Erinnerungen für Deadlines': 'Push notifications for deadlines',
    'Native PDF-Speicherung': 'Native PDF storage',
    'Nahtlose iCloud-Synchronisation': 'Seamless iCloud sync',
    'Face ID & Touch ID Login': 'Face ID & Touch ID login',
    'Apple Pencil Unterstützung': 'Apple Pencil support',

    // ── Plan-Preise ──────────────────────────────────────
    'pro Monat': 'per month',
    'pro Jahr': 'per year',
    'Für Anfänger': 'For beginners',
    'Für Profis': 'For pros',
    'Bis zu': 'Up to',

    // ── Plan-Section additional ──────────────────────────
    'AKTIV': 'ACTIVE',
    'Pro-Plan aktiv': 'Pro plan active',
    'Free-Plan': 'Free plan',
  },
};

interface I18nStore {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

function initialLocale(): Locale {
  if (typeof window === 'undefined') return 'de';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'de' || stored === 'en') return stored;
  // Browser-Praeferenz als Fallback
  if (typeof navigator !== 'undefined' && /^en\b/i.test(navigator.language)) return 'en';
  return 'de';
}

export const useI18n = create<I18nStore>((set) => ({
  locale: initialLocale(),
  setLocale: (locale) => {
    try { localStorage.setItem(STORAGE_KEY, locale); } catch { /* ignore */ }
    document.documentElement.setAttribute('lang', locale);
    set({ locale });
  },
}));

/**
 * Reaktive Translator-Funktion fuer Komponenten. Liefert eine Function,
 * die unter dem aktuellen Locale uebersetzt — und re-rendert die
 * Komponente, sobald sich das Locale aendert.
 */
export function useT() {
  const locale = useI18n(s => s.locale);
  return (key: string): string => TRANSLATIONS[locale][key] ?? key;
}

/** Locale am App-Start ans <html lang="..."> binden. */
export function initI18n() {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('lang', useI18n.getState().locale);
  }
}
