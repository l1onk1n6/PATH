import type { Resume } from '../types/resume';
import { getSupabase, isSupabaseConfigured } from './supabase';

export interface ResumeVersion {
  id: string;
  resume_id: string;
  snapshot: Omit<Resume, 'documents'>;
  label: string | null;
  created_at: string;
}

const MAX_VERSIONS = 20;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const table = () => getSupabase().from('resume_versions') as any;

export async function saveVersion(resume: Resume, label?: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return false;

  // Version without documents (large blobs, stored separately)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { documents: _docs, ...snapshot } = resume;

  const { error } = await table().insert({
    resume_id: resume.id,
    user_id:   user.id,
    snapshot,
    label:     label ?? null,
  });

  if (error) {
    console.error('saveVersion error:', error);
    return false;
  }

  // Prune old versions beyond the limit
  const { data: versions } = await table()
    .select('id')
    .eq('resume_id', resume.id)
    .order('created_at', { ascending: false });

  if (versions && versions.length > MAX_VERSIONS) {
    const toDelete = versions.slice(MAX_VERSIONS).map((v: { id: string }) => v.id);
    await table().delete().in('id', toDelete);
  }

  return true;
}

export async function listVersions(resumeId: string): Promise<{ data: ResumeVersion[]; error: string | null }> {
  if (!isSupabaseConfigured()) return { data: [], error: null };
  const { data, error } = await table()
    .select('id, resume_id, snapshot, label, created_at')
    .eq('resume_id', resumeId)
    .order('created_at', { ascending: false })
    .limit(MAX_VERSIONS);
  if (error) {
    console.error('listVersions error:', error);
    return { data: [], error: error.message ?? 'Unbekannter Fehler' };
  }
  return { data: (data ?? []) as ResumeVersion[], error: null };
}

export async function deleteVersion(versionId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await table().delete().eq('id', versionId);
}

export function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)  return 'Gerade eben';
  if (mins  < 60) return `Vor ${mins} Min.`;
  if (hours < 24) return `Vor ${hours} Std.`;
  if (days  < 7)  return `Vor ${days} Tag${days === 1 ? '' : 'en'}`;
  return new Date(dateStr).toLocaleDateString('de-CH', { day: 'numeric', month: 'short', year: 'numeric' });
}
