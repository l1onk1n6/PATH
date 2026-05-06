import type { Resume } from '../types/resume';

export interface FieldChange {
  label: string;
  before: string;
  after: string;
}

export interface ListChange {
  /** Section-Name fuer die UI. */
  label: string;
  /** Anzahl Eintraege in der gespeicherten Version. */
  before: number;
  /** Anzahl Eintraege in der aktuellen Version. */
  after: number;
  /** Hinzugefuegte Eintraege (vorhandene Bezeichner). */
  added: string[];
  /** Entfernte Eintraege (vorhandene Bezeichner). */
  removed: string[];
  /** Anzahl modifizierter Eintraege (id stimmt ueberein, Inhalt nicht). */
  modified: number;
}

export interface VersionDiff {
  /** Geaenderte Felder in personalInfo + coverLetter. */
  fields: FieldChange[];
  /** Aenderungen pro Liste-Sektion. */
  lists: ListChange[];
  /** Gesamtanzahl Aenderungen — fuer Badge. */
  totalChanges: number;
}

type WithId = { id?: string };

function describe(item: unknown): string {
  if (!item || typeof item !== 'object') return '';
  const o = item as Record<string, unknown>;
  // Abhaengig vom Section-Typ einen aussagekraeftigen Bezeichner waehlen.
  return (
    (o.position as string) ||
    (o.degree as string) ||
    (o.name as string) ||
    (o.title as string) ||
    ''
  );
}

function diffList(
  label: string,
  before: unknown[] | undefined,
  after: unknown[] | undefined,
): ListChange | null {
  const a = (before ?? []) as WithId[];
  const b = (after ?? []) as WithId[];
  if (a.length === 0 && b.length === 0) return null;

  const idA = new Set(a.map(x => x.id).filter(Boolean));
  const idB = new Set(b.map(x => x.id).filter(Boolean));

  const added: string[] = [];
  const removed: string[] = [];
  let modified = 0;

  for (const item of b) {
    if (!item.id || !idA.has(item.id)) {
      const d = describe(item);
      if (d) added.push(d);
    }
  }
  for (const item of a) {
    if (!item.id || !idB.has(item.id)) {
      const d = describe(item);
      if (d) removed.push(d);
    }
  }
  // Modified: id in beiden, aber JSON unterschiedlich
  for (const item of a) {
    if (!item.id || !idB.has(item.id)) continue;
    const counterpart = b.find(x => x.id === item.id);
    if (counterpart && JSON.stringify(item) !== JSON.stringify(counterpart)) modified++;
  }

  if (added.length === 0 && removed.length === 0 && modified === 0 && a.length === b.length) {
    return null;
  }

  return { label, before: a.length, after: b.length, added, removed, modified };
}

function diffField(label: string, before: unknown, after: unknown): FieldChange | null {
  const b = (before ?? '') as string;
  const a = (after ?? '') as string;
  if (b === a) return null;
  return { label, before: String(b), after: String(a) };
}

/**
 * Berechnet die Aenderungen zwischen einer gespeicherten Resume-Version
 * (snapshot) und dem aktuellen Resume.
 */
export function computeDiff(snapshot: Resume, current: Resume): VersionDiff {
  const fields: FieldChange[] = [];

  // personalInfo: jedes Textfeld einzeln vergleichen
  const piA = snapshot.personalInfo ?? {};
  const piB = current.personalInfo ?? {};
  const piKeys: Array<[keyof typeof piA, string]> = [
    ['firstName', 'Vorname'],
    ['lastName', 'Nachname'],
    ['title', 'Titel'],
    ['email', 'E-Mail'],
    ['phone', 'Telefon'],
    ['street', 'Strasse'],
    ['location', 'Ort'],
    ['website', 'Website'],
    ['linkedin', 'LinkedIn'],
    ['github', 'GitHub'],
    ['summary', 'Zusammenfassung'],
  ];
  for (const [key, label] of piKeys) {
    const c = diffField(label, piA[key], piB[key]);
    if (c) fields.push(c);
  }

  // coverLetter
  const clA = snapshot.coverLetter ?? {};
  const clB = current.coverLetter ?? {};
  const clKeys: Array<[keyof typeof clA, string]> = [
    ['recipient', 'Anschreiben — Empfänger'],
    ['subject', 'Anschreiben — Betreff'],
    ['body', 'Anschreiben — Text'],
    ['closing', 'Anschreiben — Grussformel'],
  ];
  for (const [key, label] of clKeys) {
    const c = diffField(label, clA[key], clB[key]);
    if (c) fields.push(c);
  }

  // Listen
  const lists: ListChange[] = [];
  const sections: Array<[string, keyof Resume]> = [
    ['Berufserfahrung', 'workExperience'],
    ['Ausbildung', 'education'],
    ['Fähigkeiten', 'skills'],
    ['Sprachen', 'languages'],
    ['Projekte', 'projects'],
    ['Zertifikate', 'certificates'],
  ];
  for (const [label, key] of sections) {
    const c = diffList(label, snapshot[key] as unknown[], current[key] as unknown[]);
    if (c) lists.push(c);
  }

  const totalChanges = fields.length + lists.reduce(
    (s, l) => s + l.added.length + l.removed.length + l.modified, 0,
  );

  return { fields, lists, totalChanges };
}
