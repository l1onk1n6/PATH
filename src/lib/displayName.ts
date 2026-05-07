import type { Person, Resume } from '../types/resume';
import { tr } from './i18n';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(s: string | undefined | null): boolean {
  return typeof s === 'string' && UUID_PATTERN.test(s.trim());
}

/**
 * Benutzerfreundlicher Anzeigename einer Person.
 * Wenn person.name leer oder versehentlich eine UUID ist (historischer DB-
 * Ueberbleibsel), wird auf Vor- und Nachname aus dem Lebenslauf zurueck-
 * gegriffen. Letzter Fallback: "Mein Profil".
 */
export function displayPersonName(person: Person | null | undefined, resume?: Resume | null): string {
  const raw = person?.name?.trim();
  if (raw && !isUuid(raw)) return raw;
  const pi = resume?.personalInfo;
  const fromResume = [pi?.firstName, pi?.lastName].filter(Boolean).join(' ').trim();
  if (fromResume) return fromResume;
  return tr('Mein Profil');
}
