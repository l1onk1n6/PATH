import { getSupabase, isSupabaseConfigured } from './supabase';

async function call(action: string, params: Record<string, unknown>): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = getSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data, error } = await supabase.functions.invoke('ai-assist', {
      body: { action, ...params },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (error) { console.error('[ai]', error); return null; }
    return (data?.result as string) ?? null;
  } catch (e) {
    console.error('[ai]', e);
    return null;
  }
}

export async function generateCoverLetter(params: {
  jobTitle?: string;
  company?: string;
  jobDescription?: string;
  summary?: string;
  experience?: string;
}): Promise<string | null> {
  return call('generate-cover-letter', params);
}

export async function improveText(text: string, context?: string): Promise<string | null> {
  return call('improve', { text, context });
}

export async function translateFields(
  fields: Record<string, string>,
  targetLanguage: string,
): Promise<Record<string, string> | null> {
  const raw = await call('translate', { fields, targetLanguage });
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
