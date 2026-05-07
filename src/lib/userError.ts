/**
 * Zentrale User-Fehlermeldungen.
 *
 * Regel: Der technische Fehlerobjekt-Text (`err.message`, SQL, Stacktrace …)
 * wird nur ins Console-Log geschrieben und in die Supabase-Tabelle
 * `error_logs` (fuers spaetere Bugfixing mit User-Kontext) \xE2\x80\x94 der User
 * bekommt eine verstaendliche deutsche Meldung mit Kontakt-Hinweis.
 */
import { logError } from './errorLog';
import { tr } from './i18n';

export const SUPPORT_EMAIL = 'info@pixmatic.ch';

function contactHint(): string {
  return tr('Falls das Problem bestehen bleibt, melde dich bitte bei uns unter {email}.')
    .replace('{email}', SUPPORT_EMAIL);
}

/**
 * Baut eine benutzerfreundliche Fehlermeldung aus einem Handlungs-Label.
 * Der eigentliche Fehler wird automatisch auf die Konsole geschrieben und
 * nach Supabase gelogged — aber nicht im UI gezeigt.
 *
 * @example
 *   setExportError(userError('Der PDF-Export hat nicht funktioniert', err));
 */
export function userError(message: string, err?: unknown): string {
  if (err !== undefined) console.error('[userError]', message, err);
  void logError(message, err);
  const translated = tr(message);
  const base = translated.endsWith('.') ? translated : `${translated}.`;
  return `${base} ${tr('Bitte versuche es erneut.')} ${contactHint()}`;
}

/**
 * Wie `userError`, aber ohne „bitte erneut versuchen" — fuer Faelle, in denen
 * das Retry sinnlos ist.
 */
export function userErrorNoRetry(message: string, err?: unknown): string {
  if (err !== undefined) console.error('[userError]', message, err);
  void logError(message, err);
  const translated = tr(message);
  const base = translated.endsWith('.') ? translated : `${translated}.`;
  return `${base} ${contactHint()}`;
}
