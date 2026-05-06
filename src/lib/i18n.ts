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
