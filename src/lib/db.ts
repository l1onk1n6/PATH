/**
 * Datenbankoperationen für Supabase
 * Alle Funktionen sind "best-effort" – Fehler werden geloggt aber nicht geworfen,
 * damit die App offline weiter funktioniert.
 */
import { getSupabase, isSupabaseConfigured } from './supabase';
import type { Person, Resume } from '../types/resume';

function sb() {
  return getSupabase();
}

function userId() {
  // Wird synchron aus dem Session-Cache gelesen
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
      template_id: resume.templateId,
      accent_color: resume.accentColor,
      personal_info: resume.personalInfo,
      work_experience: resume.workExperience,
      education: resume.education,
      skills: resume.skills,
      languages: resume.languages,
      projects: resume.projects,
      certificates: resume.certificates,
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
    templateId: row.template_id as Resume['templateId'],
    accentColor: row.accent_color as string,
    personalInfo: (row.personal_info as Resume['personalInfo']) ?? {},
    workExperience: (row.work_experience as Resume['workExperience']) ?? [],
    education: (row.education as Resume['education']) ?? [],
    skills: (row.skills as Resume['skills']) ?? [],
    languages: (row.languages as Resume['languages']) ?? [],
    projects: (row.projects as Resume['projects']) ?? [],
    certificates: (row.certificates as Resume['certificates']) ?? [],
    documents: [],           // Dokumente separat laden wenn nötig
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
