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
    documentsMb:         10,
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
    documentsMb:         50,
    pdfExportsPerMonth:  20,
    photoMb:             2,
    versionHistory:      true,
  },
};

export interface ProFeature {
  id: string;
  label: string;
  description: string;
  icon: string;
  available: boolean;   // true = already live, false = coming soon
}

export const PRO_FEATURES: ProFeature[] = [
  // ── Already live ──────────────────────────────────────────
  { id: 'persons',   label: '5 Personen & 60 Mappen',  icon: '👥', description: 'Bis zu 5 Profile mit je 60 Bewerbungsmappen (Free: 1 / 10)',          available: true },
  { id: 'templates', label: 'Alle Templates',           icon: '🎨', description: 'Zugriff auf alle Premium-Designs (Free: 6 Templates)',                  available: true },
  { id: 'sections',  label: 'Eigene Sektionen',         icon: '📋', description: 'Beliebig viele eigene Sektionen im Lebenslauf (Free: keine)',           available: true },
  { id: 'share',     label: '10 Share-Links',           icon: '🔗', description: 'Bis zu 10 aktive öffentliche Links gleichzeitig (Free: 1)',             available: true },
  { id: 'pdf',       label: '20 PDF-Exports / Monat',  icon: '📄', description: 'Mehr PDF-Exporte pro Monat (Free: 5)',                                   available: true },
  { id: 'photo',     label: '2 MB Foto-Upload',         icon: '🖼️', description: 'Grössere Profilfotos hochladen (Free: 1 MB)',                           available: true },
  // ── Coming soon ───────────────────────────────────────────
  { id: 'ai',        label: 'KI-Assistent',             icon: '✦', description: 'Anschreiben generieren & Texte mit Claude KI verbessern',               available: true },
  { id: 'ats',       label: 'ATS-Score',                icon: '📊', description: 'Lebenslauf gegen Stellenbeschreibung prüfen & Keywords optimieren',     available: false },
  { id: 'history',   label: 'CV-Versionshistorie',      icon: '🕓', description: 'Frühere Versionen wiederherstellen',                                     available: true  },
  { id: 'analytics', label: 'Link-Analytics',           icon: '📈', description: 'Sehen wer deinen geteilten Lebenslauf aufgerufen hat',                  available: false },
  { id: 'translate', label: 'Mehrsprachige CVs',        icon: '🌍', description: 'Automatische Übersetzung in jede Sprache',                              available: true },
  { id: 'password',  label: 'PDF-Passwortschutz',       icon: '🔐', description: 'Bewerbungs-PDFs verschlüsselt versenden',                               available: false },
  { id: 'reminder',  label: 'Deadline-Reminder',        icon: '⏰', description: 'E-Mail-Benachrichtigung vor Bewerbungsschluss',                         available: true  },
  { id: 'video',     label: 'Video-Intro',              icon: '🎬', description: 'Kurzes Video-Profil zur Bewerbung hinzufügen',                          available: false },
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
