import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  Person, Resume, PersonalInfo, CoverLetter, WorkExperience, Education,
  Skill, Language, Project, Certificate, UploadedDocument, TemplateId, EditorSection,
  ApplicationStatus,
} from '../types/resume';
import * as db from '../lib/db';

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

  // Cloud sync
  syncFromCloud: () => Promise<void>;

  // Person actions
  addPerson: (name: string) => Person;
  updatePerson: (id: string, data: Partial<Person>) => void;
  deletePerson: (id: string) => void;
  setActivePerson: (id: string) => void;

  // Resume actions
  addResume: (personId: string, name?: string) => Resume;
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
  addEducation: (resumeId: string) => void;
  updateEducation: (resumeId: string, id: string, data: Partial<Education>) => void;
  removeEducation: (resumeId: string, id: string) => void;
  addSkill: (resumeId: string) => void;
  updateSkill: (resumeId: string, id: string, data: Partial<Skill>) => void;
  removeSkill: (resumeId: string, id: string) => void;
  addLanguage: (resumeId: string) => void;
  updateLanguage: (resumeId: string, id: string, data: Partial<Language>) => void;
  removeLanguage: (resumeId: string, id: string) => void;
  addProject: (resumeId: string) => void;
  updateProject: (resumeId: string, id: string, data: Partial<Project>) => void;
  removeProject: (resumeId: string, id: string) => void;
  addCertificate: (resumeId: string) => void;
  updateCertificate: (resumeId: string, id: string, data: Partial<Certificate>) => void;
  removeCertificate: (resumeId: string, id: string) => void;
  addDocument: (resumeId: string, doc: Omit<UploadedDocument, 'id' | 'uploadedAt'>) => void;
  removeDocument: (resumeId: string, id: string) => void;

  setActiveSection: (section: EditorSection) => void;
  getActiveResume: () => Resume | null;
  getActivePerson: () => Person | null;
}

// ── Default resume ────────────────────────────────────────
function createDefaultResume(personId: string, name = 'Bewerbungsmappe'): Resume {
  return {
    id: uuidv4(), personId,
    name, status: 'entwurf',
    templateId: 'minimal', accentColor: '#007AFF',
    personalInfo: { firstName: '', lastName: '', title: '', email: '', phone: '', location: '', website: '', linkedin: '', github: '', summary: '' },
    coverLetter: { recipient: '', subject: '', body: '', closing: 'Mit freundlichen Grüssen' },
    workExperience: [], education: [], skills: [], languages: [],
    projects: [], certificates: [], documents: [],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
}

// ── Store ─────────────────────────────────────────────────
export const useResumeStore = create<ResumeStore>()(
  persist(
    (set, get) => ({
      persons: [], resumes: [], activePersonId: null, activeResumeId: null,
      activeSection: 'personal', syncing: false, savePending: false,

      // ── Cloud sync ──────────────────────────────────────
      syncFromCloud: async () => {
        notifySaving = (v) => set({ savePending: v });
        set({ syncing: true });
        try {
          const [cloudPersons, cloudResumes, cloudDocs] = await Promise.all([
            db.fetchPersons(), db.fetchResumes(), db.fetchDocuments(),
          ]);
          if (cloudPersons.length === 0 && cloudResumes.length === 0) {
            // Neues Konto: lokale Daten hochladen
            const { persons, resumes } = get();
            const allDocs = resumes.flatMap(r => r.documents.map(d => ({ resumeId: r.id, doc: d })));
            await Promise.all([
              ...persons.map(db.upsertPerson),
              ...resumes.map(db.upsertResume),
              ...allDocs.map(({ resumeId, doc }) => db.upsertDocument(resumeId, doc)),
            ]);
          } else {
            // resumeIds aus Cloud-Daten rekonstruieren + Dokumente einfügen
            const persons = cloudPersons.map(p => ({
              ...p,
              resumeIds: cloudResumes.filter(r => r.personId === p.id).map(r => r.id),
            }));
            const resumes = cloudResumes.map(r => ({
              ...r,
              documents: cloudDocs.filter(d => d.resumeId === r.id).map(({ resumeId: _rid, ...d }) => d),
            }));
            set({ persons, resumes });
          }
        } finally {
          set({ syncing: false });
        }
      },

      // ── Persons ─────────────────────────────────────────
      addPerson: (name) => {
        const resume = createDefaultResume('', 'Bewerbungsmappe 1');
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
      addResume: (personId, name) => {
        const existing = get().resumes.filter(r => r.personId === personId).length;
        const resumeName = name || `Bewerbungsmappe ${existing + 1}`;
        const resume = createDefaultResume(personId, resumeName);
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
        set((s) => ({ resumes: s.resumes.map(r => r.id === resumeId ? { ...r, personalInfo: { ...r.personalInfo, ...data }, updatedAt: new Date().toISOString() } : r) }));
        queueSave(`resume-${resumeId}`, () => { const r = get().resumes.find(r => r.id === resumeId); if (r) db.upsertResume(r); });
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

      addSkill: (resumeId) => {
        const item: Skill = { id: uuidv4(), name: '', level: 3, category: 'Allgemein' };
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

      addDocument: (resumeId, doc) => {
        const item: UploadedDocument = { ...doc, id: uuidv4(), uploadedAt: new Date().toISOString() };
        set((s) => ({ resumes: s.resumes.map(r => r.id === resumeId ? { ...r, documents: [...r.documents, item], updatedAt: new Date().toISOString() } : r) }));
        db.upsertDocument(resumeId, item);
      },

      removeDocument: (resumeId, id) => {
        set((s) => ({ resumes: s.resumes.map(r => r.id === resumeId ? { ...r, documents: r.documents.filter(d => d.id !== id), updatedAt: new Date().toISOString() } : r) }));
        db.deleteDocument(id);
      },

      setActiveSection: (section) => set({ activeSection: section }),
      getActiveResume: () => { const { resumes, activeResumeId } = get(); return resumes.find(r => r.id === activeResumeId) ?? null; },
      getActivePerson: () => { const { persons, activePersonId } = get(); return persons.find(p => p.id === activePersonId) ?? null; },
    }),
    { name: 'aicv-storage' }
  )
);
