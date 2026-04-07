import { createClient } from '@supabase/supabase-js';

// Werte entweder aus Build-Zeit-Env-Vars oder aus localStorage (Setup-Seite)
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
  return url.startsWith('https://') && key.length > 20;
}

export function saveSupabaseConfig(url: string, key: string) {
  localStorage.setItem('aicv-supabase-url', url.trim());
  localStorage.setItem('aicv-supabase-key', key.trim());
}

// Lazy singleton – wird erst beim ersten Aufruf erstellt
let _client: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (_client) return _client;
  const { url, key } = getConfig();
  if (!url || !key) throw new Error('Supabase nicht konfiguriert');
  _client = createClient(url, key);
  return _client;
}

// Nach Konfigurationsänderung Client zurücksetzen
export function resetSupabaseClient() {
  _client = null;
}
