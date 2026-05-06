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
    'Speichert…': 'Saving…',
    'Gespeichert': 'Saved',
    'Offline': 'Offline',
    'Heute aktiv': 'Active today',

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
