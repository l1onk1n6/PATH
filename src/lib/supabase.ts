import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Build-time env vars take priority; localStorage is a fallback for self-hosted setups.
// Note: VITE_SUPABASE_ANON_KEY is a public key — safe to store in localStorage.
function getConfig() {
  const url =
    import.meta.env.VITE_SUPABASE_URL ||
    localStorage.getItem('aicv-supabase-url') ||
    '';
  const key =
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    localStorage.getItem('aicv-supabase-key') ||
    '';
  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getConfig();
  return (
    /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url.trim()) &&
    key.trim().startsWith('eyJ') &&
    key.trim().length > 100
  );
}

export function saveSupabaseConfig(url: string, key: string) {
  localStorage.setItem('aicv-supabase-url', url.trim());
  localStorage.setItem('aicv-supabase-key', key.trim());
}

// Lazy singleton — created on first access
let _client: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> {
  if (_client) return _client;
  const { url, key } = getConfig();
  if (!url || !key) throw new Error('Supabase nicht konfiguriert');
  _client = createClient<Database>(url, key);
  return _client;
}

// Reset after config change
export function resetSupabaseClient() {
  _client = null;
}
