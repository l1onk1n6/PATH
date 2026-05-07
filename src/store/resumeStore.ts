import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  Person, Resume, PersonalInfo, CoverLetter, WorkExperience, Education,
  Skill, Language, Project, Certificate, UploadedDocument, TemplateId, EditorSection,
  ApplicationStatus, CustomSection,
} from '../types/resume';
import * as db from '../lib/db';
import { LIMITS, getPlanFromMetadata } from '../lib/plan';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { tr } from '../lib/i18n';

async function getCurrentPlan() {
  if (!isSupabaseConfigured()) return 'free' as const;
  try {
    const { data } = await getSupabase().auth.getUser();
    return getPlanFromMetadata(data.user?.user_metadata as Record<string, unknown> | undefined);
  } catch { return 'free' as const; }
}

// ── Debounce helper with savePending tracking ─────────────
const debounceMap = new Map<string, ReturnType<typeof setTimeout>>();
let pendingCount = 0;
// Will be set after store creation to update savePending state
let notifySaving: ((v: boolean) => void) | null = null;

function queueSave(key: string, fn: () => void, ms = 1200) {
  const isNew = !debounceMap.has(key);
  const existing = debounceMap.get(key);
  if (existing) clearTimeout(existing);
  if (isNew) {
    pendingCount++;
    notifySaving?.(true);
  }
  debounceMap.set(key, setTimeout(() => {
    fn();
    debounceMap.delete(key);
    pendingCount = Math.max(0, pendingCount - 1);
    if (pendingCount === 0) notifySaving?.(false);
  }, ms));
}

// ── Types ─────────────────────────────────────────────────
interface ResumeStore {
  persons: Person[];
  resumes: Resume[];
  activePersonId: string | null;
  activeResumeId: string | null;
  activeSection: EditorSection;
  syncing: boolean;
  savePending: boolean;
  limitError: string | null;   // shown when a plan limit is hit

  // Cloud sync
  syncFromCloud: () => Promise<void>;

  // Person actions
  addPerson: (name: string) => Promise<Person | null>;
  updatePerson: (id: string, data: Partial<Person>) => void;
  deletePerson: (id: string) => void;
  setActivePerson: (id: string) => void;

  // Resume actions
  addResume: (personId: string, name?: string) => Promise<Resume | null>;
  duplicateResume: (id: string) => Resume;
  updateResume: (id: string, data: Partial<Resume>) => void;
  deleteResume: (id: string) => void;
  setActiveResume: (id: string) => void;
  renameResume: (id: string, name: string) => void;
  setResumeStatus: (id: string, status: ApplicationStatus) => void;
  setTemplate: (resumeId: string, templateId: TemplateId) => void;
  setAccentColor: (resumeId: string, color: string) => void;

  // Section content
  updatePersonalInfo: (resumeId: string, data: Partial<PersonalInfo>) => void;
  updateCoverLetter: (resumeId: string, data: Partial<CoverLetter>) => void;
  addWorkExperience: (resumeId: string) => void;
  updateWorkExperience: (resumeId: string, id: string, data: Partial<WorkExperience>) => void;
  removeWorkExperience: (resumeId: string, id: string) => void;
  reorderWorkExperience: (resumeId: string, from: number, to: number) => void;
  addEducation: (resumeId: string) => void;
  updateEducation: (resumeId: string, id: string, data: Partial<Education>) => void;
  removeEducation: (resumeId: string, id: string) => void;
  reorderEducation: (resumeId: string, from: number, to: number) => void;
  addSkill: (resumeId: string) => void;
  updateSkill: (resumeId: string, id: string, data: Partial<Skill>) => void;
  removeSkill: (resumeId: string, id: string) => void;
  reorderSkills: (resumeId: string, from: number, to: number) => void;
  addLanguage: (resumeId: string) => void;
  updateLanguage: (resumeId: string, id: string, data: Partial<Language>) => void;
  removeLanguage: (resumeId: string, id: string) => void;
  addProject: (resumeId: string) => void;
  updateProject: (resumeId: string, id: string, data: Partial<Project>) => void;
  removeProject: (resumeId: string, id: string) => void;
  reorderProjects: (resumeId: string, from: number, to: number) => void;
  addCertificate: (resumeId: string) => void;
  updateCertificate: (resumeId: string, id: string, data: Partial<Certificate>) => void;
  removeCertificate: (resumeId: string, id: string) => void;
  reorderCertificates: (resumeId: string, from: number, to: number) => void;
  /** Nur State (und DB-Metadata). File muss schon im Storage liegen wenn storagePath gesetzt ist. */
  addDocument: (resumeId: string, doc: Omit<UploadedDocument, 'id' | 'uploadedAt'>, opts?: { storagePath?: string }) => void;
  /** Datei nach Storage hochladen, Signed URL holen, State + DB aktualisieren. */
  uploadDocument: (resumeId: string, file: File, category?: UploadedDocument['category']) => Promise<{ ok: boolean; error?: string }>;
  removeDocument: (resumeId: string, id: string) => void;
  updateDocumentCategory: (resumeId: string, docId: string, category: UploadedDocument['category']) => void;
  reorderDocuments: (resumeId: string, from: number, to: number) => void;

  // Custom sections
  addCustomSection: (resumeId: string) => void;
  updateCustomSection: (resumeId: string, id: string, data: Partial<CustomSection>) => void;
  removeCustomSection: (resumeId: string, id: string) => void;
  reorderCustomSections: (resumeId: string, from: number, to: number) => void;

  // Undo: re-insert an item at the given index in any list section
  restoreItemAt: (
    resumeId: string,
    section: 'workExperience' | 'education' | 'skills' | 'languages' | 'projects' | 'certificates' | 'customSections',
    item: unknown,
    index: number,
  ) => void;

  // Share token
  setShareToken: (resumeId: string, token: string | null) => void;
  clearLimitError: () => void;

  // GDPR export
  exportGdprData: () => void;

  setActiveSection: (section: EditorSection) => void;
  getActiveResume: () => Resume | null;
  getActivePerson: () => Person | null;
}

// ── Default resume ────────────────────────────────────────
function createDefaultResume(personId: string, name?: string): Resume {
  return {
    id: uuidv4(), personId,
    name: name ?? tr('Bewerbungsmappe'), status: 'entwurf', jobUrl: '', deadline: '', reminderDays: [],
    templateId: 'minimal', accentColor: '#007AFF',
    personalInfo: { firstName: '', lastName: '', title: '', email: '', phone: '', street: '', location: '', website: '', linkedin: '', github: '', summary: '' },
    coverLetter: { recipient: '', subject: '', body: '', closing: tr('Mit freundlichen Grüssen') },
    workExperience: [], education: [], skills: [], languages: [],
    projects: [], certificates: [], documents: [], customSections: [],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
}

// ── Store ─────────────────────────────────────────────────
export const useResumeStore = create<ResumeStore>()(
  persist(
    (set, get) => ({
      persons: [], resumes: [], activePersonId: null, activeResumeId: null,
      activeSection: 'personal', syncing: false, savePending: false, limitError: null,

      // ── Cloud sync ──────────────────────────────────────
      syncFromCloud: async () => {
        notifySaving = (v) => set({ savePending: v });
        set({ syncing: true });
        try {
          const [cloudPersons, cloudResumes, cloudDocs] = await Promise.all([
            db.fetchPersons(), db.fetchResumes(), db.fetchDocuments(),
          ]);

          // Lazy-Migration: Altbestand mit base64 data_url in Storage verschieben.
          // Laeuft asynchron im Hintergrund, blockiert den Sync nicht.
          const legacyDocs = cloudDocs.filter(d => d.dataUrl?.startsWith('data:'));
          if (legacyDocs.length > 0) {
            void Promise.all(legacyDocs.map(d => db.migrateDocumentToStorage(d.resumeId, d)))
              .catch((e) => console.warn('[store] legacy doc migration', e));
          }

          if (cloudPersons.length === 0 && cloudResumes.length === 0) {
            // Neues Konto: lokale Daten hochladen
            const { persons, resumes } = get();
            await Promise.all([
              ...persons.map(db.upsertPerson),
              ...resumes.map(db.upsertResume),
            ]);
            // Dokumente: base64 aus localStorage direkt nach Storage migrieren
            for (const r of resumes) {
              for (const d of r.documents) {
                if (d.dataUrl?.startsWith('data:')) {
                  await db.migrateDocumentToStorage(r.id, d);
                } else if (d.dataUrl) {
                  // schon HTTPS oder leer → nur Metadaten anlegen
                  await db.upsertDocument(r.id, d);
                }
              }
            }
          } else {
            // resumeIds aus Cloud-Daten rekonstruieren + Dokumente einfügen
            const persons = cloudPersons.map(p => ({
              ...p,
              resumeIds: cloudResumes.filter(r => r.personId === p.id).map(r => r.id),
            }));
            const resumes = cloudResumes.map(r => ({
              ...r,
              customSections: r.customSections ?? [],
              documents: cloudDocs.filter(d => d.resumeId === r.id).map(({ resumeId: _rid, ...d }) => d),
            }));
            // Falls noch keine Auswahl existiert (z.B. Erstanmeldung auf einem
            // neuen Geraet), die erste Person + deren gespeicherten oder ersten
            // Lebenslauf aktiv setzen, damit Editor/Vorschau direkt Inhalt haben.
            const current = get();
            const keepPerson = persons.some(p => p.id === current.activePersonId);
            const keepResume = resumes.some(r => r.id === current.activeResumeId);
            const firstPerson = keepPerson ? null : persons[0] ?? null;
            const firstResumeOfPerson = firstPerson
              ? resumes.find(r => r.id === firstPerson.activeResumeId)
                ?? resumes.find(r => r.personId === firstPerson.id)
                ?? null
              : null;
            set({
              persons,
              resumes,
              activePersonId: keepPerson ? current.activePersonId : firstPerson?.id ?? null,
              activeResumeId: keepResume ? current.activeResumeId : firstResumeOfPerson?.id ?? null,
            });
          }
        } finally {
          set({ syncing: false });
        }
      },

      // ── Persons ─────────────────────────────────────────
      addPerson: async (name) => {
        const plan = await getCurrentPlan();
        const limit = LIMITS[plan].persons;
        if (get().persons.length >= limit) {
          set({ limitError: `Maximale Anzahl Personen (${limit}) für deinen Plan erreicht.` });
          return null;
        }
        const resume = createDefaultResume('', `${tr('Bewerbungsmappe')} 1`);
        const person: Person = { id: uuidv4(), name, resumeIds: [resume.id], activeResumeId: resume.id, createdAt: new Date().toISOString() };
        resume.personId = person.id;
        set((s) => ({ persons: [...s.persons, person], resumes: [...s.resumes, resume], activePersonId: person.id, activeResumeId: resume.id }));
        db.upsertPerson(person);
        db.upsertResume(resume);
        return person;
      },

      updatePerson: (id, data) => {
        set((s) => ({ persons: s.persons.map((p) => p.id === id ? { ...p, ...data } : p) }));
        queueSave(`person-${id}`, () => {
          const p = get().persons.find(p => p.id === id);
          if (p) db.upsertPerson(p);
        });
      },

      deletePerson: (id) => {
        const person = get().persons.find((p) => p.id === id);
        if (!person) return;
        set((s) => ({
          persons: s.persons.filter((p) => p.id !== id),
          resumes: s.resumes.filter((r) => !person.resumeIds.includes(r.id)),
          activePersonId: s.activePersonId === id ? (s.persons.find((p) => p.id !== id)?.id ?? null) : s.activePersonId,
          activeResumeId: person.resumeIds.includes(s.activeResumeId ?? '') ? null : s.activeResumeId,
        }));
        db.deletePerson(id);
      },

      setActivePerson: (id) => {
        const person = get().persons.find((p) => p.id === id);
        set({ activePersonId: id, activeResumeId: person?.activeResumeId ?? null });
      },

      // ── Resumes ─────────────────────────────────────────
      addResume: async (personId, name) => {
        const plan = await getCurrentPlan();
        const limit = LIMITS[plan].resumes;
        if (get().resumes.length >= limit) {
          set({ limitError: `Maximale Anzahl Bewerbungsmappen (${limit}) für deinen Plan erreicht.` });
          return null;
        }
        const existing = get().resumes.filter(r => r.personId === personId);
        const resumeName = name || `Bewerbungsmappe ${existing.length + 1}`;
        const resume = createDefaultResume(personId, resumeName);
        if (existing.length > 0) {
          // Persoenliche Daten + Lebenslauf-Inhalte von der ersten Mappe der
          // gleichen Person uebernehmen (Ausbildung, Erfahrung, Fertigkeiten
          // etc. aendern sich nicht pro Bewerbung). Anschreiben, Dokumente,
          // Template und Jobdetails bleiben bewusst leer, weil sie pro
          // Bewerbung unterschiedlich sind. Neue UUIDs, damit Edits einer
          // Mappe die andere nicht beeinflussen.
          const src = existing[0];
          resume.personalInfo = { ...src.personalInfo };
          resume.workExperience = src.workExperience.map(w => ({ ...w, id: uuidv4() }));
          resume.education = src.education.map(e => ({ ...e, id: uuidv4() }));
          resume.skills = src.skills.map(s => ({ ...s, id: uuidv4() }));
          resume.languages = src.languages.map(l => ({ ...l, id: uuidv4() }));
          resume.projects = (src.projects ?? []).map(p => ({ ...p, id: uuidv4() }));
          resume.certificates = (src.certificates ?? []).map(c => ({ ...c, id: uuidv4() }));
          resume.customSections = (src.customSections ?? []).map(cs => ({
            ...cs,
            id: uuidv4(),
            items: [...(cs.items ?? [])],
          }));
        }
        set((s) => ({
          resumes: [...s.resumes, resume],
          persons: s.persons.map((p) => p.id === personId ? { ...p, resumeIds: [...p.resumeIds, resume.id], activeResumeId: resume.id } : p),
          activeResumeId: resume.id,
        }));
        db.upsertResume(resume);
        return resume;
      },

      updateResume: (id, data) => {
        set((s) => ({ resumes: s.resumes.map((r) => r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r) }));
        queueSave(`resume-${id}`, () => {
          const r = get().resumes.find(r => r.id === id);
          if (r) db.upsertResume(r);
        });
      },

      deleteResume: (id) => {
        set((s) => {
          const updated = s.persons.map((p) => {
            if (!p.resumeIds.includes(id)) return p;
            const ids = p.resumeIds.filter(rid => rid !== id);
            return { ...p, resumeIds: ids, activeResumeId: ids[0] ?? '' };
          });
          return { resumes: s.resumes.filter(r => r.id !== id), persons: updated, activeResumeId: s.activeResumeId === id ? null : s.activeResumeId };
        });
        db.deleteResume(id);
      },

      setActiveResume: (id) => {
        const resume = get().resumes.find(r => r.id === id);
        if (!resume) return;
        set((s) => ({ activeResumeId: id, persons: s.persons.map(p => p.id === resume.personId ? { ...p, activeResumeId: id } : p) }));
      },

      duplicateResume: (id) => {
        const original = get().resumes.find(r => r.id === id);
        if (!original) throw new Error('Resume not found');
        const copy: Resume = {
          ...JSON.parse(JSON.stringify(original)),
          id: uuidv4(),
          name: `${original.name} (Kopie)`,
          status: 'entwurf' as ApplicationStatus,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          documents: [],
        };
        set((s) => ({
          resumes: [...s.resumes, copy],
          persons: s.persons.map(p => p.id === copy.personId ? { ...p, resumeIds: [...p.resumeIds, copy.id], activeResumeId: copy.id } : p),
          activeResumeId: copy.id,
        }));
        db.upsertResume(copy);
        return copy;
      },

      renameResume: (id, name) => {
        set((s) => ({ resumes: s.resumes.map(r => r.id === id ? { ...r, name, updatedAt: new Date().toISOString() } : r) }));
        queueSave(`resume-${id}`, () => { const r = get().resumes.find(r => r.id === id); if (r) db.upsertResume(r); });
      },

      setResumeStatus: (id, status) => {
        set((s) => ({ resumes: s.resumes.map(r => r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r) }));
        queueSave(`resume-${id}`, () => { const r = get().resumes.find(r => r.id === id); if (r) db.upsertResume(r); });
      },

      setTemplate: (resumeId, templateId) => {
        set((s) => ({ resumes: s.resumes.map(r => r.id === resumeId ? { ...r, templateId, updatedAt: new Date().toISOString() } : r) }));
        queueSave(`resume-${resumeId}`, () => { const r = get().resumes.find(r => r.id === resumeId); if (r) db.upsertResume(r); });
      },

      setAccentColor: (resumeId, color) => {
        set((s) => ({ resumes: s.resumes.map(r => r.id === resumeId ? { ...r, accentColor: color, updatedAt: new Date().toISOString() } : r) }));
        queueSave(`resume-${resumeId}`, () => { const r = get().resumes.find(r => r.id === resumeId); if (r) db.upsertResume(r); });
      },

      // ── Section mutations (alle sync-fähig via updateResume-Debounce) ──
      updatePersonalInfo: (resumeId, data) => {
        // Sync personalInfo across all resumes of the same person
        const personId = get().resumes.find(r => r.id === resumeId)?.personId;
        set((s) => ({
          resumes: s.resumes.map(r => {
            if (personId && r.personId === personId) {
              return { ...r, personalInfo: { ...r.personalInfo, ...data }, updatedAt: new Date().toISOString() };
            }
            return r;
          }),
        }));
        // Persist all affected resumes
        get().resumes
          .filter(r => personId && r.personId === personId)
          .forEach(r => queueSave(`resume-${r.id}`, () => { const fresh = get().resumes.find(x => x.id === r.id); if (fresh) db.upsertResume(fresh); }));
      },

      updateCoverLetter: (resumeId, data) => {
        set((s) => ({ resumes: s.resumes.map(r => r.id === resumeId ? { ...r, coverLetter: { ...r.coverLetter, ...data }, updatedAt: new Date().toISOString() } : r) }));
        queueSave(`resume-${resumeId}`, () => { const r = get().resumes.find(r => r.id === resumeId); if (r) db.upsertResume(r); });
      },

      addWorkExperience: (resumeId) => {
        const item: WorkExperience = { id: uuidv4(), company: '', position: '', location: '', startDate: '', endDate: '', current: false, description: '', highlights: [] };
        set((s) => ({ resumes: s.resumes.map(r => r.id === resumeId ? { ...r, workExperience: [...r.workExperience, item], updatedAt: new Date().toISOString() } : r) }));
        queueSave(`resume-${resumeId}`, () => { const r = get().resumes.find(r => r.id === resumeId); if (r) db.upsertResume(r); });
      },

      updateWorkExperience: (resumeId, id, data) => {
        set((s) => ({ resumes: s.resumes.map(r => r.id === resumeId ? { ...r, workExperience: r.workExperience.map(w => w.id === id ? { ...w, ...data } : w), updatedAt: new Date().toISOString() } : r) }));
        queueSave(`resume-${resumeId}`, () => { const r = get().resumes.find(r => r.id === resumeId); if (r) db.upsertResume(r); });
      },

      removeWorkExperience: (resumeId, id) => {
        set((s) => ({ resumes: s.resumes.map(r => r.id === resumeId ? { ...r, workExperience: r.workExperience.filter(w => w.id !== id), updatedAt: new Date().toISOString() } : r) }));
        queueSave(`resume-${resumeId}`, () => { const r = get().resumes.find(r => r.id === resumeId); if (r) db.upsertResume(r); });
      },

      reorderWorkExperience: (resumeId, from, to) => {
        set((s) => ({ resumes: s.resumes.map(r => { if (r.id !== resumeId) return r; const a = [...r.workExperience]; const [m] = a.splice(from, 1); a.splice(to, 0, m); return { ...r, workExperience: a, updatedAt: new Date().toISOString() }; }) }));
        queueSave(`resume-${resumeId}`, () => { const r = get().resumes.find(r => r.id === resumeId); if (r) db.upsertResume(r); });
      },

      addEducation: (resumeId) => {
        const item: Education = { id: uuidv4(), institution: '', degree: '', field: '', location: '', startDate: '', endDate: '', grade: '', description: '' };
        set((s) => ({ resumes: s.resumes.map(r => r.id === resumeId ? { ...r, education: [...r.education, item], updatedAt: new Date().toISOString() } : r) }));
        queueSave(`resume-${resumeId}`, () => { const r = get().resumes.find(r => r.id === resumeId); if (r) db.upsertResume(r); });
      },

      updateEducation: (resumeId, id, data) => {
        set((s) => ({ resumes: s.resumes.map(r => r.id === resumeId ? { ...r, education: r.education.map(e => e.id === id ? { ...e, ...data } : e), updatedAt: new Date().toISOString() } : r) }));
        queueSave(`resume-${resumeId}`, () => { const r = get().resumes.find(r => r.id === resumeId); if (r) db.upsertResume(r); });
      },

      removeEducation: (resumeId, id) => {
        set((s) => ({ resumes: s.resumes.map(r => r.id === resumeId ? { ...r, education: r.education.filter(e => e.id !== id), updatedAt: new Date().toISOString() } : r) }));
        queueSave(`resume-${resumeId}`, () => { const r = get().resumes.find(r => r.id === resumeId); if (r) db.upsertResume(r); });
      },

      reorderEducation: (resumeId, from, to) => {
        set((s) => ({ resumes: s.resumes.map(r => { if (r.id !== resumeId) return r; const a = [...r.education]; const [m] = a.splice(from, 1); a.splice(to, 0, m); return { ...r, education: a, updatedAt: new Date().toISOString() }; }) }));
        queueSave(`resume-${resumeId}`, () => { const r = get().resumes.find(r => r.id === resumeId); if (r) db.upsertResume(r); });
      },

      addSkill: (resumeId) => {
        const item: Skill = { id: uuidv4(), name: '', level: 3, category: tr('Allgemein') };
        set((s) => ({ resumes: s.resumes.map(r => r.id === resumeId ? { ...r, skills: [...r.skills, item], updatedAt: new Date().toISOString() } : r) }));
        queueSave(`resume-${resumeId}`, () => { const r = get().resumes.find(r => r.id === resumeId); if (r) db.upsertResume(r); });
      },

      updateSkill: (resumeId, id, data) => {
        set((s) => ({ resumes: s.resumes.map(r => r.id === resumeId ? { ...r, skills: r.skills.map(sk => sk.id === id ? { ...sk, ...data } : sk), updatedAt: new Date().toISOString() } : r) }));
        queueSave(`resume-${resumeId}`, () => { const r = get().resumes.find(r => r.id === resumeId); if (r) db.upsertResume(r); });
      },

      removeSkill: (resumeId, id) => {
        set((s) => ({ resumes: s.resumes.map(r => r.id === resumeId ? { ...r, skills: r.skills.filter(sk => sk.id !== id), updatedAt: new Date().toISOString() } : r) }));
        queueSave(`resume-${resumeId}`, () => { const r = get().resumes.find(r => r.id === resumeId); if (r) db.upsertResume(r); });
      },

      reorderSkills: (resumeId, from, to) => {
        set((s) => ({ resumes: s.resumes.map(r => { if (r.id !== resumeId) return r; const a = [...r.skills]; const [m] = a.splice(from, 1); a.splice(to, 0, m); return { ...r, skills: a, updatedAt: new Date().toISOString() }; }) }));
        queueSave(`resume-${resumeId}`, () => { const r = get().resumes.find(r => r.id === resumeId); if (r) db.upsertResume(r); });
      },

      addLanguage: (resumeId) => {
        const item: Language = { id: uuidv4(), name: '', level: 'Fließend' };
        set((s) => ({ resumes: s.resumes.map(r => r.id === resumeId ? { ...r, languages: [...r.languages, item], updatedAt: new Date().toISOString() } : r) }));
        queueSave(`resume-${resumeId}`, () => { const r = get().resumes.find(r => r.id === resumeId); if (r) db.upsertResume(r); });
      },

      updateLanguage: (resumeId, id, data) => {
        set((s) => ({ resumes: s.resumes.map(r => r.id === resumeId ? { ...r, languages: r.languages.map(l => l.id === id ? { ...l, ...data } : l), updatedAt: new Date().toISOString() } : r) }));
        queueSave(`resume-${resumeId}`, () => { const r = get().resumes.find(r => r.id === resumeId); if (r) db.upsertResume(r); });
      },

      removeLanguage: (resumeId, id) => {
        set((s) => ({ resumes: s.resumes.map(r => r.id === resumeId ? { ...r, languages: r.languages.filter(l => l.id !== id), updatedAt: new Date().toISOString() } : r) }));
        queueSave(`resume-${resumeId}`, () => { const r = get().resumes.find(r => r.id === resumeId); if (r) db.upsertResume(r); });
      },

      addProject: (resumeId) => {
        const item: Project = { id: uuidv4(), name: '', description: '', url: '', technologies: [], startDate: '', endDate: '' };
        set((s) => ({ resumes: s.resumes.map(r => r.id === resumeId ? { ...r, projects: [...r.projects, item], updatedAt: new Date().toISOString() } : r) }));
        queueSave(`resume-${resumeId}`, () => { const r = get().resumes.find(r => r.id === resumeId); if (r) db.upsertResume(r); });
      },

      updateProject: (resumeId, id, data) => {
        set((s) => ({ resumes: s.resumes.map(r => r.id === resumeId ? { ...r, projects: r.projects.map(p => p.id === id ? { ...p, ...data } : p), updatedAt: new Date().toISOString() } : r) }));
        queueSave(`resume-${resumeId}`, () => { const r = get().resumes.find(r => r.id === resumeId); if (r) db.upsertResume(r); });
      },

      removeProject: (resumeId, id) => {
        set((s) => ({ resumes: s.resumes.map(r => r.id === resumeId ? { ...r, projects: r.projects.filter(p => p.id !== id), updatedAt: new Date().toISOString() } : r) }));
        queueSave(`resume-${resumeId}`, () => { const r = get().resumes.find(r => r.id === resumeId); if (r) db.upsertResume(r); });
      },

      reorderProjects: (resumeId, from, to) => {
        set((s) => ({ resumes: s.resumes.map(r => { if (r.id !== resumeId) return r; const a = [...r.projects]; const [m] = a.splice(from, 1); a.splice(to, 0, m); return { ...r, projects: a, updatedAt: new Date().toISOString() }; }) }));
        queueSave(`resume-${resumeId}`, () => { const r = get().resumes.find(r => r.id === resumeId); if (r) db.upsertResume(r); });
      },

      addCertificate: (resumeId) => {
        const item: Certificate = { id: uuidv4(), name: '', issuer: '', date: '', url: '' };
        set((s) => ({ resumes: s.resumes.map(r => r.id === resumeId ? { ...r, certificates: [...r.certificates, item], updatedAt: new Date().toISOString() } : r) }));
        queueSave(`resume-${resumeId}`, () => { const r = get().resumes.find(r => r.id === resumeId); if (r) db.upsertResume(r); });
      },

      updateCertificate: (resumeId, id, data) => {
        set((s) => ({ resumes: s.resumes.map(r => r.id === resumeId ? { ...r, certificates: r.certificates.map(c => c.id === id ? { ...c, ...data } : c), updatedAt: new Date().toISOString() } : r) }));
        queueSave(`resume-${resumeId}`, () => { const r = get().resumes.find(r => r.id === resumeId); if (r) db.upsertResume(r); });
      },

      removeCertificate: (resumeId, id) => {
        set((s) => ({ resumes: s.resumes.map(r => r.id === resumeId ? { ...r, certificates: r.certificates.filter(c => c.id !== id), updatedAt: new Date().toISOString() } : r) }));
        queueSave(`resume-${resumeId}`, () => { const r = get().resumes.find(r => r.id === resumeId); if (r) db.upsertResume(r); });
      },

      reorderCertificates: (resumeId, from, to) => {
        set((s) => ({ resumes: s.resumes.map(r => { if (r.id !== resumeId) return r; const a = [...r.certificates]; const [m] = a.splice(from, 1); a.splice(to, 0, m); return { ...r, certificates: a, updatedAt: new Date().toISOString() }; }) }));
        queueSave(`resume-${resumeId}`, () => { const r = get().resumes.find(r => r.id === resumeId); if (r) db.upsertResume(r); });
      },

      addDocument: (resumeId, doc, opts) => {
        const item: UploadedDocument = { ...doc, id: uuidv4(), uploadedAt: new Date().toISOString() };
        set((s) => ({ resumes: s.resumes.map(r => r.id === resumeId ? { ...r, documents: [...r.documents, item], updatedAt: new Date().toISOString() } : r) }));
        db.upsertDocument(resumeId, item, opts?.storagePath ? { storagePath: opts.storagePath } : undefined);
      },

      uploadDocument: async (resumeId, file, category = 'other') => {
        const id = uuidv4();
        const item: UploadedDocument = {
          id,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          category,
          dataUrl: '',
          uploadedAt: new Date().toISOString(),
        };
        const storagePath = await db.uploadDocumentFile(item, file);
        if (!storagePath) return { ok: false, error: tr('Upload in Storage fehlgeschlagen') };

        // Metadaten speichern, Signed URL fuer sofortige Anzeige holen
        await db.upsertDocument(resumeId, item, { storagePath });
        const freshDocs = await db.fetchDocuments();
        const fresh = freshDocs.find(d => d.id === id);
        const itemWithUrl: UploadedDocument = fresh
          ? { ...item, dataUrl: fresh.dataUrl }
          : item;

        set((s) => ({ resumes: s.resumes.map(r => r.id === resumeId ? { ...r, documents: [...r.documents, itemWithUrl], updatedAt: new Date().toISOString() } : r) }));
        return { ok: true };
      },

      removeDocument: (resumeId, id) => {
        set((s) => ({ resumes: s.resumes.map(r => r.id === resumeId ? { ...r, documents: r.documents.filter(d => d.id !== id), updatedAt: new Date().toISOString() } : r) }));
        db.deleteDocument(id);
      },

      updateDocumentCategory: (resumeId, docId, category) => {
        set((s) => ({
          resumes: s.resumes.map(r =>
            r.id === resumeId
              ? { ...r, documents: r.documents.map(d => d.id === docId ? { ...d, category } : d), updatedAt: new Date().toISOString() }
              : r,
          ),
        }));
        // Nur Metadaten-Update, keine Storage-Bewegung
        const doc = get().resumes.find(r => r.id === resumeId)?.documents.find(d => d.id === docId);
        if (doc) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (getSupabase().from('documents') as any).update({ category }).eq('id', docId)
            .then((res: { error: unknown }) => { if (res.error) console.warn('[store] updateDocumentCategory', res.error); });
        }
      },

      reorderDocuments: (resumeId, from, to) => {
        // Lokale Reihenfolge sofort updaten
        set((s) => ({
          resumes: s.resumes.map(r => {
            if (r.id !== resumeId) return r;
            const arr = [...r.documents];
            const [m] = arr.splice(from, 1);
            arr.splice(to, 0, m);
            // orderIndex pro Position neu setzen
            const reindexed = arr.map((d, i) => ({ ...d, orderIndex: i }));
            return { ...r, documents: reindexed, updatedAt: new Date().toISOString() };
          }),
        }));
        // In Supabase fuer alle betroffenen Zeilen order_index nachziehen
        const docs = get().resumes.find(r => r.id === resumeId)?.documents ?? [];
        if (isSupabaseConfigured() && docs.length > 0) {
          const sb = getSupabase();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          Promise.all(docs.map((d, i) => (sb.from('documents') as any).update({ order_index: i }).eq('id', d.id)))
            .catch(e => console.warn('[store] reorderDocuments', e));
        }
      },

      // ── Custom sections ──────────────────────────────────
      addCustomSection: (resumeId) => {
        const item: CustomSection = { id: uuidv4(), title: tr('Eigene Sektion'), items: [''] };
        set((s) => ({ resumes: s.resumes.map(r => r.id === resumeId ? { ...r, customSections: [...(r.customSections ?? []), item], updatedAt: new Date().toISOString() } : r) }));
        queueSave(`resume-${resumeId}`, () => { const r = get().resumes.find(r => r.id === resumeId); if (r) db.upsertResume(r); });
      },

      updateCustomSection: (resumeId, id, data) => {
        set((s) => ({ resumes: s.resumes.map(r => r.id === resumeId ? { ...r, customSections: (r.customSections ?? []).map(cs => cs.id === id ? { ...cs, ...data } : cs), updatedAt: new Date().toISOString() } : r) }));
        queueSave(`resume-${resumeId}`, () => { const r = get().resumes.find(r => r.id === resumeId); if (r) db.upsertResume(r); });
      },

      removeCustomSection: (resumeId, id) => {
        set((s) => ({ resumes: s.resumes.map(r => r.id === resumeId ? { ...r, customSections: (r.customSections ?? []).filter(cs => cs.id !== id), updatedAt: new Date().toISOString() } : r) }));
        queueSave(`resume-${resumeId}`, () => { const r = get().resumes.find(r => r.id === resumeId); if (r) db.upsertResume(r); });
      },

      reorderCustomSections: (resumeId, from, to) => {
        set((s) => ({ resumes: s.resumes.map(r => { if (r.id !== resumeId) return r; const a = [...(r.customSections ?? [])]; const [m] = a.splice(from, 1); a.splice(to, 0, m); return { ...r, customSections: a, updatedAt: new Date().toISOString() }; }) }));
        queueSave(`resume-${resumeId}`, () => { const r = get().resumes.find(r => r.id === resumeId); if (r) db.upsertResume(r); });
      },

      // ── Undo: re-insert an item at the given index ───────
      restoreItemAt: (resumeId, section, item, index) => {
        set((s) => ({
          resumes: s.resumes.map(r => {
            if (r.id !== resumeId) return r;
            const existing = (r[section] ?? []) as unknown[];
            const arr = [...existing];
            const safeIdx = Math.max(0, Math.min(index, arr.length));
            arr.splice(safeIdx, 0, item);
            return { ...r, [section]: arr, updatedAt: new Date().toISOString() };
          }),
        }));
        queueSave(`resume-${resumeId}`, () => { const r = get().resumes.find(r => r.id === resumeId); if (r) db.upsertResume(r); });
      },

      // ── Share token ──────────────────────────────────────
      setShareToken: (resumeId, token) => {
        set((s) => ({ resumes: s.resumes.map(r => r.id === resumeId ? { ...r, shareToken: token ?? undefined, updatedAt: new Date().toISOString() } : r) }));
        queueSave(`resume-${resumeId}`, () => { const r = get().resumes.find(r => r.id === resumeId); if (r) db.upsertResume(r); });
      },

      // ── GDPR export ──────────────────────────────────────
      exportGdprData: () => {
        const { persons, resumes } = get();
        const exportData = {
          exportedAt: new Date().toISOString(),
          persons,
          resumes: resumes.map(r => ({ ...r, documents: r.documents.map(d => ({ ...d, dataUrl: '[base64 omitted]' })) })),
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `path-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      },

      clearLimitError: () => set({ limitError: null }),
      setActiveSection: (section) => set({ activeSection: section }),
      getActiveResume: () => { const { resumes, activeResumeId } = get(); return resumes.find(r => r.id === activeResumeId) ?? null; },
      getActivePerson: () => { const { persons, activePersonId } = get(); return persons.find(p => p.id === activePersonId) ?? null; },
    }),
    { name: 'aicv-storage' }
  )
);
