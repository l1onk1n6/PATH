import { useAuthStore } from '../store/authStore';

export type PlanType = 'free' | 'pro';

export interface ProFeature {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export const PRO_FEATURES: ProFeature[] = [
  { id: 'ai',         label: 'KI-Assistent',            icon: '✦', description: 'Anschreiben generieren & Texte mit Claude KI verbessern' },
  { id: 'translate',  label: 'Mehrsprachige CVs',        icon: '🌍', description: 'Automatische Übersetzung in jede Sprache' },
  { id: 'ats',        label: 'ATS-Score',                icon: '📊', description: 'Lebenslauf gegen Stellenbeschreibung prüfen' },
  { id: 'password',   label: 'PDF-Passwortschutz',       icon: '🔐', description: 'Bewerbungs-PDFs verschlüsselt versenden' },
  { id: 'reminder',   label: 'Deadline-Reminder',        icon: '⏰', description: 'E-Mail-Benachrichtigung vor Bewerbungsschluss' },
  { id: 'analytics',  label: 'Link-Analytics',           icon: '📈', description: 'Sehen wer deinen geteilten Lebenslauf aufgerufen hat' },
  { id: 'video',      label: 'Video-Intro',              icon: '🎬', description: 'Kurzes Video-Profil zur Bewerbung hinzufügen' },
];

export function usePlan(): { plan: PlanType; isPro: boolean } {
  const { user } = useAuthStore();
  const plan: PlanType = (user?.user_metadata?.plan as PlanType) ?? 'free';
  return { plan, isPro: plan === 'pro' };
}
