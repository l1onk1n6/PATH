import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ApplicationStatus = 'offen' | 'beworben' | 'interview' | 'angebot' | 'abgelehnt' | 'zurueckgezogen';

export interface Application {
  id: string;
  company: string;
  position: string;
  status: ApplicationStatus;
  appliedDate: string;   // YYYY-MM-DD
  deadline: string;      // YYYY-MM-DD
  notes: string;
  url: string;
  resumeId?: string;
}

interface TrackerState {
  applications: Application[];
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
    appliedDate: new Date().toISOString().slice(0, 10),
    deadline: '',
    notes: '',
    url: '',
  };
}

export const useTrackerStore = create<TrackerState>()(
  persist(
    (set) => ({
      applications: [],
      addApplication: () =>
        set((s) => ({ applications: [newApp(), ...s.applications] })),
      updateApplication: (id, patch) =>
        set((s) => ({
          applications: s.applications.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        })),
      removeApplication: (id) =>
        set((s) => ({ applications: s.applications.filter((a) => a.id !== id) })),
    }),
    { name: 'path_tracker' }
  )
);
