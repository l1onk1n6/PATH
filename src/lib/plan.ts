import { useAuthStore } from '../store/authStore';

export type PlanType = 'free' | 'pro';

export interface PlanLimits {
  persons: number;
  resumes: number;
  customSections: number;       // per resume (0 = disabled)
  templates: number;            // how many templates accessible
  shareLinks: number;           // active share links total
  documentsMb: number;          // total upload MB
  pdfExportsPerMonth: number;   // PDF exports per calendar month
  photoMb: number;              // photo upload size limit in MB
  versionHistory: boolean;      // CV version history
}

export const FREE_TEMPLATE_IDS = [
  'minimal', 'modern', 'corporate', 'nordic', 'compact', 'executive',
] as const;

export const LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    persons:             1,
    resumes:             10,
    customSections:      0,
    templates:           6,
    shareLinks:          1,
    documentsMb:         20,
    pdfExportsPerMonth:  5,
    photoMb:             1,
    versionHistory:      false,
  },
  pro: {
    persons:             5,
    resumes:             60,
    customSections:      Infinity,
    templates:           Infinity,
    shareLinks:          10,
    documentsMb:         200,
    pdfExportsPerMonth:  20,
    photoMb:             10,
    versionHistory:      true,
  },
};

export interface ProFeature {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export const PRO_FEATURES: ProFeature[] = [
  { id: 'ai',          label: 'KI-Assistent',            icon: '✦', description: 'Anschreiben generieren & Texte mit Claude KI verbessern' },
  { id: 'translate',   label: 'Mehrsprachige CVs',        icon: '🌍', description: 'Automatische Übersetzung in jede Sprache' },
  { id: 'ats',         label: 'ATS-Score',                icon: '📊', description: 'Lebenslauf gegen Stellenbeschreibung prüfen' },
  { id: 'password',    label: 'PDF-Passwortschutz',       icon: '🔐', description: 'Bewerbungs-PDFs verschlüsselt versenden' },
  { id: 'reminder',    label: 'Deadline-Reminder',        icon: '⏰', description: 'E-Mail-Benachrichtigung vor Bewerbungsschluss' },
  { id: 'analytics',   label: 'Link-Analytics',           icon: '📈', description: 'Sehen wer deinen geteilten Lebenslauf aufgerufen hat' },
  { id: 'history',     label: 'CV-Versionshistorie',      icon: '🕓', description: 'Frühere Versionen deines Lebenslaufs wiederherstellen' },
  { id: 'video',       label: 'Video-Intro',              icon: '🎬', description: 'Kurzes Video-Profil zur Bewerbung hinzufügen' },
];

export function usePlan(): { plan: PlanType; isPro: boolean; limits: PlanLimits } {
  const { user } = useAuthStore();
  const plan: PlanType = (user?.user_metadata?.plan as PlanType) ?? 'free';
  return { plan, isPro: plan === 'pro', limits: LIMITS[plan] };
}

/** Standalone helper for use outside React (e.g. in the store) */
export function getPlanFromMetadata(userMetadata: Record<string, unknown> | undefined): PlanType {
  return (userMetadata?.plan as PlanType) ?? 'free';
}
