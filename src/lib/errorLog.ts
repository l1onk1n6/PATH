/**
 * Client-seitiges Fehler-Logging in die Supabase-Tabelle `error_logs`.
 *
 * Best effort: wir versuchen einmal zu schreiben, schlucken aber Fehler hier
 * still \xE2\x80\x94 sonst wuerden wir in eine Fehlerschleife geraten. Alles was hier
 * protokolliert wird, ist im SQL Editor unter auth → SQL
 *
 *   select created_at, user_email, action, message, page
 *     from error_logs
 *     order by created_at desc
 *     limit 100;
 *
 * sichtbar.
 */
import { Capacitor } from '@capacitor/core';
import { getSupabase, isSupabaseConfigured } from './supabase';
import { useAuthStore } from '../store/authStore';

const APP_VERSION: string = (globalThis as unknown as { __APP_VERSION__?: string }).__APP_VERSION__ ?? 'dev';

export interface LogErrorOptions {
  /** Zusatzinfos, die mit in das extra-JSONB-Feld wandern (z. B. IDs). */
  extra?: Record<string, unknown>;
}

/**
 * Loggt einen Fehler nach Supabase. Darf aus jedem Kontext aufgerufen werden
 * (Promise-Handler, Event-Listener, ErrorBoundary) und wirft niemals.
 */
export async function logError(action: string, err: unknown, opts: LogErrorOptions = {}): Promise<void> {
  try {
    if (!isSupabaseConfigured()) return;
    const user = useAuthStore.getState().user;
    const error = err instanceof Error ? err : undefined;
    const payload = {
      user_id:     user?.id ?? null,
      user_email:  user?.email ?? null,
      action:      action.slice(0, 200),
      message:     (error?.message ?? String(err ?? 'unknown')).slice(0, 2000),
      stack:       error?.stack?.slice(0, 4000) ?? null,
      page:        typeof window !== 'undefined' ? `${window.location.pathname}${window.location.hash}`.slice(0, 500) : null,
      platform:    Capacitor.getPlatform(),
      app_version: APP_VERSION,
      user_agent:  typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 500) : null,
      extra:       opts.extra ?? null,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (getSupabase().from('error_logs') as any).insert(payload);
  } catch (writeErr) {
    // NIEMALS re-werfen: Logging darf keine User-Flows brechen.
    console.warn('[errorLog] insert failed', writeErr);
  }
}
