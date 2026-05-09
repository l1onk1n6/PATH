import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as db from '../lib/db';

export type ApplicationStatus = 'offen' | 'beworben' | 'interview' | 'angebot' | 'abgelehnt' | 'zurueckgezogen';
export type ApplicationType = 'online' | 'email' | 'postalisch' | 'persoenlich' | 'telefonisch';

export interface Application {
  id: string;
  company: string;
  position: string;
  status: ApplicationStatus;
  type: ApplicationType;
  appliedDate: string;   // YYYY-MM-DD
  deadline: string;      // YYYY-MM-DD
  notes: string;
  url: string;
  resumeId: string;
}

interface TrackerState {
  applications: Application[];
  syncFromCloud: () => Promise<void>;
  addApplication: () => void;
  updateApplication: (id: string, patch: Partial<Omit<Application, 'id'>>) => void;
  removeApplication: (id: string) => void;
}

function newApp(): Application {
  return {
    id: crypto.randomUUID(),
    company: '',
    position: '',
    status: 'offen',
    type: 'online',
    appliedDate: new Date().toISOString().slice(0, 10),
    deadline: '',
    notes: '',
    url: '',
    resumeId: '',
  };
}

// Debounce pro Application, damit Eingaben nicht jede Tastatureingabe pushen.
const debounceMap = new Map<string, ReturnType<typeof setTimeout>>();
function queueUpsert(app: Application, ms = 1200) {
  const existing = debounceMap.get(app.id);
  if (existing) clearTimeout(existing);
  debounceMap.set(app.id, setTimeout(() => {
    debounceMap.delete(app.id);
    void db.upsertApplication(app);
  }, ms));
}

export const useTrackerStore = create<TrackerState>()(
  persist(
    (set, get) => ({
      applications: [],

      syncFromCloud: async () => {
        const cloud = await db.fetchApplications();
        if (cloud.length === 0) {
          // Erstes Login auf Cloud-Konto: lokale Bewerbungen hochladen.
          const local = get().applications;
          await Promise.all(local.map(db.upsertApplication));
          return;
        }
        set({ applications: cloud });
      },

      addApplication: () => {
        const app = newApp();
        set((s) => ({ applications: [app, ...s.applications] }));
        void db.upsertApplication(app);
      },

      updateApplication: (id, patch) => {
        set((s) => ({
          applications: s.applications.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        }));
        const updated = get().applications.find((a) => a.id === id);
        if (updated) queueUpsert(updated);
      },

      removeApplication: (id) => {
        set((s) => ({ applications: s.applications.filter((a) => a.id !== id) }));
        const pending = debounceMap.get(id);
        if (pending) { clearTimeout(pending); debounceMap.delete(id); }
        void db.deleteApplication(id);
      },
    }),
    { name: 'path_tracker' }
  )
);
