import type { Resume } from '../types/resume';

export interface CompletenessResult {
  score: number;       // 0–100
  filled: number;
  total: number;
  missing: string[];
}

export function calcCompleteness(resume: Resume): CompletenessResult {
  const checks: { label: string; ok: boolean }[] = [
    { label: 'Vorname',          ok: !!resume.personalInfo.firstName?.trim() },
    { label: 'Nachname',         ok: !!resume.personalInfo.lastName?.trim() },
    { label: 'Berufsbezeichnung',ok: !!resume.personalInfo.title?.trim() },
    { label: 'E-Mail',           ok: !!resume.personalInfo.email?.trim() },
    { label: 'Telefon',          ok: !!resume.personalInfo.phone?.trim() },
    { label: 'Ort',              ok: !!resume.personalInfo.location?.trim() },
    { label: 'Zusammenfassung',  ok: !!resume.personalInfo.summary?.trim() },
    { label: 'Berufserfahrung',  ok: resume.workExperience.length > 0 },
    { label: 'Ausbildung',       ok: resume.education.length > 0 },
    { label: 'Fähigkeiten',      ok: resume.skills.length > 0 },
    { label: 'Foto',             ok: !!resume.personalInfo.photo },
    { label: 'Anschreiben',      ok: !!resume.coverLetter.body?.trim() },
  ];

  const filled = checks.filter(c => c.ok).length;
  const total = checks.length;
  const score = Math.round((filled / total) * 100);
  const missing = checks.filter(c => !c.ok).map(c => c.label);

  return { score, filled, total, missing };
}

export function completenessColor(score: number): string {
  if (score >= 80) return 'var(--ios-green)';
  if (score >= 50) return '#FF9F0A';
  return 'var(--ios-red)';
}
