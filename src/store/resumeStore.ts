import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Person, Resume, PersonalInfo, WorkExperience, Education, Skill, Language, Project, Certificate, UploadedDocument, TemplateId, EditorSection } from '../types/resume';

interface ResumeStore {
  persons: Person[];
  resumes: Resume[];
  activePersonId: string | null;
  activeResumeId: string | null;
  activeSection: EditorSection;

  // Person actions
  addPerson: (name: string) => Person;
  updatePerson: (id: string, data: Partial<Person>) => void;
  deletePerson: (id: string) => void;
  setActivePerson: (id: string) => void;

  // Resume actions
  addResume: (personId: string) => Resume;
  updateResume: (id: string, data: Partial<Resume>) => void;
  deleteResume: (id: string) => void;
  setActiveResume: (id: string) => void;
  setTemplate: (resumeId: string, templateId: TemplateId) => void;
  setAccentColor: (resumeId: string, color: string) => void;

  // Section content
  updatePersonalInfo: (resumeId: string, data: Partial<PersonalInfo>) => void;
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

  // Helpers
  getActiveResume: () => Resume | null;
  getActivePerson: () => Person | null;
}

function createDefaultResume(personId: string): Resume {
  return {
    id: uuidv4(),
    personId,
    templateId: 'minimal',
    accentColor: '#007AFF',
    personalInfo: {
      firstName: '',
      lastName: '',
      title: '',
      email: '',
      phone: '',
      location: '',
      website: '',
      linkedin: '',
      github: '',
      summary: '',
    },
    workExperience: [],
    education: [],
    skills: [],
    languages: [],
    projects: [],
    certificates: [],
    documents: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set, get) => ({
      persons: [],
      resumes: [],
      activePersonId: null,
      activeResumeId: null,
      activeSection: 'personal',

      addPerson: (name) => {
        const resume = createDefaultResume('');
        const person: Person = {
          id: uuidv4(),
          name,
          resumeIds: [resume.id],
          activeResumeId: resume.id,
          createdAt: new Date().toISOString(),
        };
        resume.personId = person.id;
        set((s) => ({
          persons: [...s.persons, person],
          resumes: [...s.resumes, resume],
          activePersonId: person.id,
          activeResumeId: resume.id,
        }));
        return person;
      },

      updatePerson: (id, data) => {
        set((s) => ({
          persons: s.persons.map((p) => (p.id === id ? { ...p, ...data } : p)),
        }));
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
      },

      setActivePerson: (id) => {
        const person = get().persons.find((p) => p.id === id);
        set({ activePersonId: id, activeResumeId: person?.activeResumeId ?? null });
      },

      addResume: (personId) => {
        const resume = createDefaultResume(personId);
        set((s) => ({
          resumes: [...s.resumes, resume],
          persons: s.persons.map((p) =>
            p.id === personId
              ? { ...p, resumeIds: [...p.resumeIds, resume.id], activeResumeId: resume.id }
              : p
          ),
          activeResumeId: resume.id,
        }));
        return resume;
      },

      updateResume: (id, data) => {
        set((s) => ({
          resumes: s.resumes.map((r) =>
            r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r
          ),
        }));
      },

      deleteResume: (id) => {
        set((s) => {
          const updatedPersons = s.persons.map((p) => {
            if (!p.resumeIds.includes(id)) return p;
            const newIds = p.resumeIds.filter((rid) => rid !== id);
            return { ...p, resumeIds: newIds, activeResumeId: newIds[0] ?? '' };
          });
          return {
            resumes: s.resumes.filter((r) => r.id !== id),
            persons: updatedPersons,
            activeResumeId: s.activeResumeId === id ? null : s.activeResumeId,
          };
        });
      },

      setActiveResume: (id) => {
        const resume = get().resumes.find((r) => r.id === id);
        if (!resume) return;
        set((s) => ({
          activeResumeId: id,
          persons: s.persons.map((p) =>
            p.id === resume.personId ? { ...p, activeResumeId: id } : p
          ),
        }));
      },

      setTemplate: (resumeId, templateId) => {
        set((s) => ({
          resumes: s.resumes.map((r) =>
            r.id === resumeId ? { ...r, templateId, updatedAt: new Date().toISOString() } : r
          ),
        }));
      },

      setAccentColor: (resumeId, color) => {
        set((s) => ({
          resumes: s.resumes.map((r) =>
            r.id === resumeId ? { ...r, accentColor: color, updatedAt: new Date().toISOString() } : r
          ),
        }));
      },

      updatePersonalInfo: (resumeId, data) => {
        set((s) => ({
          resumes: s.resumes.map((r) =>
            r.id === resumeId
              ? { ...r, personalInfo: { ...r.personalInfo, ...data }, updatedAt: new Date().toISOString() }
              : r
          ),
        }));
      },

      addWorkExperience: (resumeId) => {
        const item: WorkExperience = {
          id: uuidv4(), company: '', position: '', location: '',
          startDate: '', endDate: '', current: false, description: '', highlights: [],
        };
        set((s) => ({
          resumes: s.resumes.map((r) =>
            r.id === resumeId
              ? { ...r, workExperience: [...r.workExperience, item], updatedAt: new Date().toISOString() }
              : r
          ),
        }));
      },

      updateWorkExperience: (resumeId, id, data) => {
        set((s) => ({
          resumes: s.resumes.map((r) =>
            r.id === resumeId
              ? { ...r, workExperience: r.workExperience.map((w) => (w.id === id ? { ...w, ...data } : w)), updatedAt: new Date().toISOString() }
              : r
          ),
        }));
      },

      removeWorkExperience: (resumeId, id) => {
        set((s) => ({
          resumes: s.resumes.map((r) =>
            r.id === resumeId
              ? { ...r, workExperience: r.workExperience.filter((w) => w.id !== id), updatedAt: new Date().toISOString() }
              : r
          ),
        }));
      },

      addEducation: (resumeId) => {
        const item: Education = {
          id: uuidv4(), institution: '', degree: '', field: '',
          location: '', startDate: '', endDate: '', grade: '', description: '',
        };
        set((s) => ({
          resumes: s.resumes.map((r) =>
            r.id === resumeId ? { ...r, education: [...r.education, item], updatedAt: new Date().toISOString() } : r
          ),
        }));
      },

      updateEducation: (resumeId, id, data) => {
        set((s) => ({
          resumes: s.resumes.map((r) =>
            r.id === resumeId
              ? { ...r, education: r.education.map((e) => (e.id === id ? { ...e, ...data } : e)), updatedAt: new Date().toISOString() }
              : r
          ),
        }));
      },

      removeEducation: (resumeId, id) => {
        set((s) => ({
          resumes: s.resumes.map((r) =>
            r.id === resumeId
              ? { ...r, education: r.education.filter((e) => e.id !== id), updatedAt: new Date().toISOString() }
              : r
          ),
        }));
      },

      addSkill: (resumeId) => {
        const item: Skill = { id: uuidv4(), name: '', level: 3, category: 'Allgemein' };
        set((s) => ({
          resumes: s.resumes.map((r) =>
            r.id === resumeId ? { ...r, skills: [...r.skills, item], updatedAt: new Date().toISOString() } : r
          ),
        }));
      },

      updateSkill: (resumeId, id, data) => {
        set((s) => ({
          resumes: s.resumes.map((r) =>
            r.id === resumeId
              ? { ...r, skills: r.skills.map((sk) => (sk.id === id ? { ...sk, ...data } : sk)), updatedAt: new Date().toISOString() }
              : r
          ),
        }));
      },

      removeSkill: (resumeId, id) => {
        set((s) => ({
          resumes: s.resumes.map((r) =>
            r.id === resumeId ? { ...r, skills: r.skills.filter((sk) => sk.id !== id), updatedAt: new Date().toISOString() } : r
          ),
        }));
      },

      addLanguage: (resumeId) => {
        const item: Language = { id: uuidv4(), name: '', level: 'Fließend' };
        set((s) => ({
          resumes: s.resumes.map((r) =>
            r.id === resumeId ? { ...r, languages: [...r.languages, item], updatedAt: new Date().toISOString() } : r
          ),
        }));
      },

      updateLanguage: (resumeId, id, data) => {
        set((s) => ({
          resumes: s.resumes.map((r) =>
            r.id === resumeId
              ? { ...r, languages: r.languages.map((l) => (l.id === id ? { ...l, ...data } : l)), updatedAt: new Date().toISOString() }
              : r
          ),
        }));
      },

      removeLanguage: (resumeId, id) => {
        set((s) => ({
          resumes: s.resumes.map((r) =>
            r.id === resumeId ? { ...r, languages: r.languages.filter((l) => l.id !== id), updatedAt: new Date().toISOString() } : r
          ),
        }));
      },

      addProject: (resumeId) => {
        const item: Project = { id: uuidv4(), name: '', description: '', url: '', technologies: [], startDate: '', endDate: '' };
        set((s) => ({
          resumes: s.resumes.map((r) =>
            r.id === resumeId ? { ...r, projects: [...r.projects, item], updatedAt: new Date().toISOString() } : r
          ),
        }));
      },

      updateProject: (resumeId, id, data) => {
        set((s) => ({
          resumes: s.resumes.map((r) =>
            r.id === resumeId
              ? { ...r, projects: r.projects.map((p) => (p.id === id ? { ...p, ...data } : p)), updatedAt: new Date().toISOString() }
              : r
          ),
        }));
      },

      removeProject: (resumeId, id) => {
        set((s) => ({
          resumes: s.resumes.map((r) =>
            r.id === resumeId ? { ...r, projects: r.projects.filter((p) => p.id !== id), updatedAt: new Date().toISOString() } : r
          ),
        }));
      },

      addCertificate: (resumeId) => {
        const item: Certificate = { id: uuidv4(), name: '', issuer: '', date: '', url: '' };
        set((s) => ({
          resumes: s.resumes.map((r) =>
            r.id === resumeId ? { ...r, certificates: [...r.certificates, item], updatedAt: new Date().toISOString() } : r
          ),
        }));
      },

      updateCertificate: (resumeId, id, data) => {
        set((s) => ({
          resumes: s.resumes.map((r) =>
            r.id === resumeId
              ? { ...r, certificates: r.certificates.map((c) => (c.id === id ? { ...c, ...data } : c)), updatedAt: new Date().toISOString() }
              : r
          ),
        }));
      },

      removeCertificate: (resumeId, id) => {
        set((s) => ({
          resumes: s.resumes.map((r) =>
            r.id === resumeId ? { ...r, certificates: r.certificates.filter((c) => c.id !== id), updatedAt: new Date().toISOString() } : r
          ),
        }));
      },

      addDocument: (resumeId, doc) => {
        const item: UploadedDocument = { ...doc, id: uuidv4(), uploadedAt: new Date().toISOString() };
        set((s) => ({
          resumes: s.resumes.map((r) =>
            r.id === resumeId ? { ...r, documents: [...r.documents, item], updatedAt: new Date().toISOString() } : r
          ),
        }));
      },

      removeDocument: (resumeId, id) => {
        set((s) => ({
          resumes: s.resumes.map((r) =>
            r.id === resumeId ? { ...r, documents: r.documents.filter((d) => d.id !== id), updatedAt: new Date().toISOString() } : r
          ),
        }));
      },

      setActiveSection: (section) => set({ activeSection: section }),

      getActiveResume: () => {
        const { resumes, activeResumeId } = get();
        return resumes.find((r) => r.id === activeResumeId) ?? null;
      },

      getActivePerson: () => {
        const { persons, activePersonId } = get();
        return persons.find((p) => p.id === activePersonId) ?? null;
      },
    }),
    { name: 'aicv-storage' }
  )
);
