/**
 * Zentrale User-Fehlermeldungen.
 *
 * Regel: Der technische Fehlerobjekt-Text (`err.message`, SQL, Stacktrace …)
 * wird nur ins Console-Log geschrieben und in die Supabase-Tabelle
 * `error_logs` (fuers spaetere Bugfixing mit User-Kontext) \xE2\x80\x94 der User
 * bekommt eine verstaendliche deutsche Meldung mit Kontakt-Hinweis.
 */
import { logError } from './errorLog';

export const SUPPORT_EMAIL = 'info@pixmatic.ch';

const CONTACT_HINT = `Falls das Problem bestehen bleibt, melde dich bitte bei uns unter ${SUPPORT_EMAIL}.`;

/**
 * Baut eine benutzerfreundliche Fehlermeldung aus einem Handlungs-Label.
 * Der eigentliche Fehler wird automatisch auf die Konsole geschrieben und
 * nach Supabase gelogged \xE2\x80\x94 aber nicht im UI gezeigt.
 *
 * @example
 *   setExportError(userError('Der PDF-Export hat nicht funktioniert', err));
 *   // => "Der PDF-Export hat nicht funktioniert. Bitte versuche es erneut.
 *   //     Falls das Problem bestehen bleibt, melde dich bitte bei uns
 *   //     unter info@pixmatic.ch."
 */
export function userError(message: string, err?: unknown): string {
  if (err !== undefined) console.error('[userError]', message, err);
  void logError(message, err);
  const base = message.endsWith('.') ? message : `${message}.`;
  return `${base} Bitte versuche es erneut. ${CONTACT_HINT}`;
}

/**
 * Wie `userError`, aber ohne „bitte erneut versuchen" — fuer Faelle, in denen
 * das Retry sinnlos ist.
 */
export function userErrorNoRetry(message: string, err?: unknown): string {
  if (err !== undefined) console.error('[userError]', message, err);
  void logError(message, err);
  const base = message.endsWith('.') ? message : `${message}.`;
  return `${base} ${CONTACT_HINT}`;
}
