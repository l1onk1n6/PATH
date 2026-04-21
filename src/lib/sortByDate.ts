import type { WorkExperience, Education } from '../types/resume';

/**
 * Parst ein Datum im Format "YYYY-MM", "YYYY", "MM/YYYY" (fallback) oder leer.
 * Gibt eine sortierbare Zahl zurueck (YYYYMM als Zahl). Leer / ungueltig → 0.
 */
function dateKey(s: string | undefined | null): number {
  if (!s) return 0;
  const t = s.trim();
  if (!t) return 0;

  // YYYY-MM oder YYYY-MM-DD
  const iso = /^(\d{4})-(\d{1,2})/.exec(t);
  if (iso) return Number(iso[1]) * 100 + Number(iso[2]);

  // MM/YYYY
  const eu = /^(\d{1,2})\/(\d{4})/.exec(t);
  if (eu) return Number(eu[2]) * 100 + Number(eu[1]);

  // Nur Jahr
  const yr = /^(\d{4})$/.exec(t);
  if (yr) return Number(yr[1]) * 100;

  return 0;
}

/**
 * Sortiert Berufserfahrung: laufende Stellen zuerst, sonst nach endDate desc,
 * bei Gleichstand nach startDate desc.
 */
export function sortWorkExperience(items: WorkExperience[]): WorkExperience[] {
  return [...items].sort((a, b) => {
    if (a.current && !b.current) return -1;
    if (!a.current && b.current) return 1;
    const endDiff = dateKey(b.endDate) - dateKey(a.endDate);
    if (endDiff !== 0) return endDiff;
    return dateKey(b.startDate) - dateKey(a.startDate);
  });
}

/**
 * Sortiert Ausbildung: ohne endDate (laufend) zuerst, sonst endDate desc,
 * bei Gleichstand startDate desc.
 */
export function sortEducation(items: Education[]): Education[] {
  return [...items].sort((a, b) => {
    const aCur = !a.endDate || !a.endDate.trim();
    const bCur = !b.endDate || !b.endDate.trim();
    if (aCur && !bCur) return -1;
    if (!aCur && bCur) return 1;
    const endDiff = dateKey(b.endDate) - dateKey(a.endDate);
    if (endDiff !== 0) return endDiff;
    return dateKey(b.startDate) - dateKey(a.startDate);
  });
}
