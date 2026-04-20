/**
 * Zentrale User-Fehlermeldungen.
 *
 * Regel: Der technische Fehlerobjekt-Text (`err.message`, SQL, Stacktrace …)
 * wird nur ins Console-Log geschrieben, der User bekommt eine verstaendliche
 * deutsche Meldung mit Kontakt-Hinweis.
 */
export const SUPPORT_EMAIL = 'info@pixmatic.ch';

const CONTACT_HINT = `Falls das Problem bestehen bleibt, melde dich bitte bei uns unter ${SUPPORT_EMAIL}.`;

/**
 * Baut eine benutzerfreundliche Fehlermeldung aus einem Handlungs-Label.
 * Der eigentliche Fehler wird automatisch auf die Konsole geschrieben, damit
 * wir beim Debuggen noch rankommen — aber nicht im UI gezeigt.
 *
 * @example
 *   setExportError(userError('Der PDF-Export ist fehlgeschlagen', err));
 *   // => "Der PDF-Export ist fehlgeschlagen. Bitte versuche es erneut.
 *   //     Falls das Problem bestehen bleibt, melde dich bitte bei uns
 *   //     unter info@pixmatic.ch."
 */
export function userError(message: string, err?: unknown): string {
  if (err !== undefined) console.error('[userError]', message, err);
  const base = message.endsWith('.') ? message : `${message}.`;
  return `${base} Bitte versuche es erneut. ${CONTACT_HINT}`;
}

/**
 * Wie `userError`, aber ohne „bitte erneut versuchen" — fuer Faelle, in denen
 * das Retry sinnlos ist (z. B. fehlende Datenbank-Migration).
 */
export function userErrorNoRetry(message: string, err?: unknown): string {
  if (err !== undefined) console.error('[userError]', message, err);
  const base = message.endsWith('.') ? message : `${message}.`;
  return `${base} ${CONTACT_HINT}`;
}
