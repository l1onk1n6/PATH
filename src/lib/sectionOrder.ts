import type { EditorSection } from '../types/resume';
import { updateUserPrefs } from './userPrefs';

const STORAGE_KEY = 'path-section-order';

export const DEFAULT_ORDER: EditorSection[] = [
  'personal',
  'cover-letter',
  'experience',
  'education',
  'skills',
  'projects',
  'documents',
  'custom',
  'template',
];

/** Liest die gespeicherte Reihenfolge oder gibt Default zurueck.
 *  Validiert gegen knownIds, faellt zurueck auf Default bei Inkonsistenz. */
export function getSectionOrder(knownIds: EditorSection[]): EditorSection[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ORDER.filter(id => knownIds.includes(id));
    const stored = JSON.parse(raw) as string[];
    const valid = stored.filter(id => knownIds.includes(id as EditorSection)) as EditorSection[];
    // Fehlende IDs (z. B. neu hinzugefuegte Sektion) hinten anhaengen.
    const missing = knownIds.filter(id => !valid.includes(id));
    return [...valid, ...missing];
  } catch {
    return DEFAULT_ORDER.filter(id => knownIds.includes(id));
  }
}

export function setSectionOrder(order: EditorSection[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  } catch { /* storage voll */ }
  updateUserPrefs({ sectionOrder: order });
}

/** Aus Cloud-Prefs uebernehmen, ohne erneut zurueckzupushen. */
export function applyCloudSectionOrder(order: EditorSection[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  } catch { /* storage voll */ }
}

/** Bewegt id um delta Positionen (negative = hoch). Gibt neue Reihenfolge zurueck. */
export function moveSection(order: EditorSection[], id: EditorSection, delta: number): EditorSection[] {
  const idx = order.indexOf(id);
  if (idx < 0) return order;
  const next = [...order];
  const newIdx = Math.max(0, Math.min(order.length - 1, idx + delta));
  if (newIdx === idx) return order;
  next.splice(idx, 1);
  next.splice(newIdx, 0, id);
  return next;
}
