/**
 * Datenbankoperationen für Supabase
 * Alle Funktionen sind "best-effort" – Fehler werden geloggt aber nicht geworfen,
 * damit die App offline weiter funktioniert.
 */
import { getSupabase, isSupabaseConfigured } from './supabase';
import { getDocumentSignedUrl, deleteStorageFile, DOCUMENTS_BUCKET } from './storage';
import type { Person, Resume, UploadedDocument, ApplicationStatus, ShareLink, ShareLinkView } from '../types/resume';
import type { Application } from '../types/tracker';

function sb() {
  return getSupabase();
}

async function userId(): Promise<string | null> {
  return sb().auth.getUser().then((r) => r.data.user?.id ?? null);
}

// ── Persons ────────────────────────────────────────────────

export async function fetchPersons(): Promise<Person[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await sb().from('persons').select('*').order('created_at');
    if (error) throw error;
    return (data ?? []).map(rowToPerson);
  } catch (e) {
    console.warn('[db] fetchPersons', e);
    return [];
  }
}

export async function upsertPerson(person: Person): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const uid = await userId();
    if (!uid) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (sb().from('persons') as any).upsert({
      id: person.id,
      user_id: uid,
      name: person.name,
      avatar: person.avatar ?? null,
      active_resume_id: person.activeResumeId || null,
    });
  } catch (e) {
    console.warn('[db] upsertPerson', e);
  }
}

export async function deletePerson(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    await sb().from('persons').delete().eq('id', id);
  } catch (e) {
    console.warn('[db] deletePerson', e);
  }
}

// ── Resumes ────────────────────────────────────────────────

export async function fetchResumes(): Promise<Resume[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await sb().from('resumes').select('*').order('created_at');
    if (error) throw error;
    return (data ?? []).map(rowToResume);
  } catch (e) {
    console.warn('[db] fetchResumes', e);
    return [];
  }
}

export async function upsertResume(resume: Resume): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const uid = await userId();
    if (!uid) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (sb().from('resumes') as any).upsert({
      id: resume.id,
      person_id: resume.personId,
      user_id: uid,
      name: resume.name,
      status: resume.status ?? 'entwurf',
      job_url: resume.jobUrl ?? '',
      deadline: resume.deadline ?? '',
      template_id: resume.templateId,
      accent_color: resume.accentColor,
      personal_info: resume.personalInfo,
      cover_letter: resume.coverLetter,
      work_experience: resume.workExperience,
      education: resume.education,
      skills: resume.skills,
      languages: resume.languages,
      projects: resume.projects,
      certificates: resume.certificates,
      custom_sections: resume.customSections ?? [],
      share_token: resume.shareToken ?? null,
      reminder_days: resume.reminderDays ?? [],
    });
  } catch (e) {
    console.warn('[db] upsertResume', e);
  }
}

export async function deleteResume(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    await sb().from('resumes').delete().eq('id', id);
  } catch (e) {
    console.warn('[db] deleteResume', e);
  }
}

// ── Documents ──────────────────────────────────────────────

export async function fetchDocuments(): Promise<(UploadedDocument & { resumeId: string })[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await sb().from('documents').select('*').order('uploaded_at');
    if (error) throw error;
    const docs = (data ?? []).map(rowToDocument);
    // Resolve signed URLs for documents stored in Supabase Storage
    await Promise.all(docs.map(async (doc) => {
      if (doc.storagePath) {
        const url = await getDocumentSignedUrl(doc.storagePath);
        if (url) doc.dataUrl = url;
      }
    }));
    return docs;
  } catch (e) {
    console.error('[db] fetchDocuments Fehler:', e);
    return [];
  }
}

export async function upsertDocument(resumeId: string, doc: UploadedDocument): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const uid = await userId();
    if (!uid) {
      console.error('[db] upsertDocument: kein User gefunden');
      return 'no-user';
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (sb().from('documents') as any).upsert({
      id: doc.id,
      resume_id: resumeId,
      user_id: uid,
      name: doc.name,
      type: doc.type,
      size: doc.size,
      category: doc.category,
      storage_path: doc.storagePath ?? null,
      // Only persist data_url for legacy (base64) documents; new uploads use storage_path
      data_url: doc.storagePath ? null : (doc.dataUrl || null),
      uploaded_at: doc.uploadedAt || new Date().toISOString(),
    });
    if (error) {
      console.error('[db] upsertDocument Fehler:', error.message, error.details, error.hint);
      return error.message;
    }
    return null;
  } catch (e) {
    console.error('[db] upsertDocument Exception:', e);
    return String(e);
  }
}

export async function deleteDocument(id: string, storagePath?: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    if (storagePath) await deleteStorageFile(DOCUMENTS_BUCKET, storagePath);
    await sb().from('documents').delete().eq('id', id);
  } catch (e) {
    console.warn('[db] deleteDocument', e);
  }
}

// ── Row mappers ────────────────────────────────────────────

function rowToPerson(row: Record<string, unknown>): Person {
  return {
    id: row.id as string,
    name: row.name as string,
    avatar: (row.avatar as string) ?? undefined,
    activeResumeId: (row.active_resume_id as string) ?? '',
    resumeIds: [],          // wird aus Resumes befüllt
    createdAt: row.created_at as string,
  };
}

function rowToResume(row: Record<string, unknown>): Resume {
  return {
    id: row.id as string,
    personId: row.person_id as string,
    name: (row.name as string) || 'Bewerbungsmappe',
    status: ((row.status as ApplicationStatus) || 'entwurf'),
    jobUrl: (row.job_url as string) ?? '',
    deadline: (row.deadline as string) ?? '',
    templateId: row.template_id as Resume['templateId'],
    accentColor: row.accent_color as string,
    personalInfo: (row.personal_info as Resume['personalInfo']) ?? {},
    coverLetter: (row.cover_letter as Resume['coverLetter']) ?? { recipient: '', subject: '', body: '', closing: 'Mit freundlichen Grüssen' },
    workExperience: (row.work_experience as Resume['workExperience']) ?? [],
    education: (row.education as Resume['education']) ?? [],
    skills: (row.skills as Resume['skills']) ?? [],
    languages: (row.languages as Resume['languages']) ?? [],
    projects: (row.projects as Resume['projects']) ?? [],
    certificates: (row.certificates as Resume['certificates']) ?? [],
    documents: [],
    customSections: (row.custom_sections as Resume['customSections']) ?? [],
    shareToken: (row.share_token as string) ?? undefined,
    reminderDays: (row.reminder_days as number[]) ?? [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ── Public shared resume (no auth required) ────────────────
export async function fetchSharedResume(token: string): Promise<Resume | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await sb()
      .from('resumes')
      .select('*')
      .eq('share_token', token)
      .not('share_token', 'is', null)
      .maybeSingle();
    if (error || !data) return null;
    return rowToResume(data as Record<string, unknown>);
  } catch (e) {
    console.warn('[db] fetchSharedResume', e);
    return null;
  }
}

function rowToDocument(row: Record<string, unknown>): UploadedDocument & { resumeId: string } {
  return {
    resumeId: row.resume_id as string,
    id: row.id as string,
    name: row.name as string,
    type: row.type as string,
    size: row.size as number,
    category: row.category as UploadedDocument['category'],
    dataUrl: (row.data_url as string) ?? '',
    storagePath: (row.storage_path as string) ?? undefined,
    uploadedAt: row.uploaded_at as string,
  };
}

// ── Applications (Tracker) ─────────────────────────────────

export async function fetchApplications(): Promise<Application[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await sb()
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToApplication);
  } catch (e) {
    console.warn('[db] fetchApplications', e);
    return [];
  }
}

export async function upsertApplication(app: Application): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const uid = await userId();
    if (!uid) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (sb().from('applications') as any).upsert({
      id: app.id,
      user_id: uid,
      company: app.company,
      position: app.position,
      status: app.status,
      type: app.type,
      applied_date: app.appliedDate,
      deadline: app.deadline,
      notes: app.notes,
      url: app.url,
      resume_id: app.resumeId,
    });
  } catch (e) {
    console.warn('[db] upsertApplication', e);
  }
}

export async function deleteApplication(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    await sb().from('applications').delete().eq('id', id);
  } catch (e) {
    console.warn('[db] deleteApplication', e);
  }
}

function rowToApplication(row: Record<string, unknown>): Application {
  return {
    id: row.id as string,
    company: (row.company as string) ?? '',
    position: (row.position as string) ?? '',
    status: (row.status as Application['status']) ?? 'offen',
    type: (row.type as Application['type']) ?? 'online',
    appliedDate: (row.applied_date as string) ?? '',
    deadline: (row.deadline as string) ?? '',
    notes: (row.notes as string) ?? '',
    url: (row.url as string) ?? '',
    resumeId: (row.resume_id as string) ?? '',
  };
}

// ── Share Links ─────────────────────────────────────────────

export async function getShareLinks(resumeId: string): Promise<ShareLink[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (sb().from('share_links') as any)
      .select('id, resume_id, token, label, is_active, created_at, resume_views(count)')
      .eq('resume_id', resumeId)
      .order('created_at', { ascending: false }) as { data: Record<string, unknown>[] | null; error: unknown };
    if (error || !data) return [];
    return data.map(row => ({
      id: row.id as string,
      resumeId: row.resume_id as string,
      token: row.token as string,
      label: (row.label as string) || '',
      isActive: row.is_active as boolean,
      createdAt: row.created_at as string,
      viewCount: (row.resume_views as { count: number }[])?.[0]?.count ?? 0,
    }));
  } catch (e) {
    console.warn('[db] getShareLinks', e);
    return [];
  }
}

export async function createShareLink(resumeId: string, label: string): Promise<ShareLink | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const uid = await userId();
    if (!uid) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (sb().from('share_links') as any)
      .insert({ resume_id: resumeId, user_id: uid, label })
      .select('id, resume_id, token, label, is_active, created_at')
      .single() as { data: Record<string, unknown> | null; error: unknown };
    if (error || !data) return null;
    const row = data;
    return { id: row.id as string, resumeId: row.resume_id as string, token: row.token as string, label: (row.label as string) || '', isActive: row.is_active as boolean, createdAt: row.created_at as string, viewCount: 0 };
  } catch (e) {
    console.warn('[db] createShareLink', e);
    return null;
  }
}

export async function updateShareLink(linkId: string, patch: { label?: string; isActive?: boolean }): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const update: Record<string, unknown> = {};
    if (patch.label !== undefined) update.label = patch.label;
    if (patch.isActive !== undefined) update.is_active = patch.isActive;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (sb().from('share_links') as any).update(update).eq('id', linkId);
  } catch (e) {
    console.warn('[db] updateShareLink', e);
  }
}

export async function deleteShareLink(linkId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    await sb().from('share_links').delete().eq('id', linkId);
  } catch (e) {
    console.warn('[db] deleteShareLink', e);
  }
}

export async function getShareLinkViews(linkId: string, limit = 50): Promise<ShareLinkView[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await sb()
      .from('resume_views')
      .select('id, viewed_at, country, country_code, city, device, browser, referrer, duration_s')
      .eq('share_link_id', linkId)
      .order('viewed_at', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return (data as Record<string, unknown>[]).map(row => ({
      id: row.id as string,
      viewedAt: row.viewed_at as string,
      country: row.country as string | undefined,
      countryCode: row.country_code as string | undefined,
      city: row.city as string | undefined,
      device: row.device as string | undefined,
      browser: row.browser as string | undefined,
      referrer: row.referrer as string | undefined,
      durationS: row.duration_s as number | undefined,
    }));
  } catch (e) {
    console.warn('[db] getShareLinkViews', e);
    return [];
  }
}

// fetchSharedResume: checks share_links table (new) + resumes.share_token (legacy)
export async function fetchSharedResumeByToken(token: string): Promise<Resume | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    // New path: share_links table
    const { data: link } = await sb()
      .from('share_links')
      .select('resume_id')
      .eq('token', token)
      .eq('is_active', true)
      .maybeSingle();
    if (link) {
      const { data } = await sb().from('resumes').select('*').eq('id', (link as Record<string, unknown>).resume_id as string).maybeSingle();
      if (data) return rowToResume(data as Record<string, unknown>);
    }
    // Legacy path: resumes.share_token
    const { data } = await sb().from('resumes').select('*').eq('share_token', token).not('share_token', 'is', null).maybeSingle();
    if (data) return rowToResume(data as Record<string, unknown>);
    return null;
  } catch (e) {
    console.warn('[db] fetchSharedResumeByToken', e);
    return null;
  }
}
