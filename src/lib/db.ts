/**
 * Datenbankoperationen für Supabase
 * Alle Funktionen sind "best-effort" – Fehler werden geloggt aber nicht geworfen,
 * damit die App offline weiter funktioniert.
 */
import { getSupabase, isSupabaseConfigured } from './supabase';
import type { Person, Resume, UploadedDocument, ApplicationStatus } from '../types/resume';

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
    return (data ?? []).map(rowToDocument);
  } catch (e) {
    console.warn('[db] fetchDocuments', e);
    return [];
  }
}

export async function upsertDocument(resumeId: string, doc: UploadedDocument): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const uid = await userId();
    if (!uid) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (sb().from('documents') as any).upsert({
      id: doc.id,
      resume_id: resumeId,
      user_id: uid,
      name: doc.name,
      type: doc.type,
      size: doc.size,
      category: doc.category,
      data_url: doc.dataUrl,
    });
  } catch (e) {
    console.warn('[db] upsertDocument', e);
  }
}

export async function deleteDocument(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
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
    dataUrl: row.data_url as string,
    uploadedAt: row.uploaded_at as string,
  };
}
