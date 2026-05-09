/**
 * Geräteübergreifende Nutzer-Präferenzen via Supabase user_metadata.preferences.
 *
 * Hält Sprache, Editor-Section-Reihenfolge und zuletzt aktive Person/Resume
 * synchron, damit ein Login auf einem zweiten Gerät den gleichen Zustand zeigt.
 * Lokale localStorage-Werte bleiben als Offline-Cache und Schnellstart erhalten.
 */
import { getSupabase, isSupabaseConfigured } from './supabase';
import type { Locale } from './i18n';
import type { EditorSection } from '../types/resume';

export interface UserPrefs {
  locale?: Locale;
  sectionOrder?: EditorSection[];
  activePersonId?: string | null;
  activeResumeId?: string | null;
}

export async function fetchUserPrefs(): Promise<UserPrefs> {
  if (!isSupabaseConfigured()) return {};
  try {
    const { data } = await getSupabase().auth.getUser();
    const meta = (data.user?.user_metadata ?? {}) as Record<string, unknown>;
    return ((meta.preferences as UserPrefs) ?? {});
  } catch (e) {
    console.warn('[userPrefs] fetch', e);
    return {};
  }
}

// Mehrere Updates in kurzer Folge zu einem Auth-Roundtrip zusammenfassen.
let pending: UserPrefs = {};
let timer: ReturnType<typeof setTimeout> | null = null;

export function updateUserPrefs(patch: UserPrefs): void {
  if (!isSupabaseConfigured()) return;
  pending = { ...pending, ...patch };
  if (timer) clearTimeout(timer);
  timer = setTimeout(flush, 800);
}

async function flush() {
  const next = pending;
  pending = {};
  timer = null;
  if (Object.keys(next).length === 0) return;
  try {
    const sb = getSupabase();
    const { data: userRes } = await sb.auth.getUser();
    if (!userRes.user) return;
    const meta = (userRes.user.user_metadata ?? {}) as Record<string, unknown>;
    const current = (meta.preferences as UserPrefs) ?? {};
    await sb.auth.updateUser({ data: { preferences: { ...current, ...next } } });
  } catch (e) {
    console.warn('[userPrefs] update', e);
  }
}
