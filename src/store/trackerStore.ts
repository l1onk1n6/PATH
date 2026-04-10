import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as db from '../lib/db';
import type { Application, ApplicationStatus, ApplicationType } from '../types/tracker';

export type { Application, ApplicationStatus, ApplicationType };

// Debounce helper (same pattern as resumeStore)
const debounceMap = new Map<string, ReturnType<typeof setTimeout>>();
function queueSave(key: string, fn: () => void, ms = 1200) {
  const existing = debounceMap.get(key);
  if (existing) clearTimeout(existing);
  debounceMap.set(key, setTimeout(() => {
    fn();
    debounceMap.delete(key);
  }, ms));
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

interface TrackerState {
  applications: Application[];
  syncing: boolean;
  syncFromCloud: () => Promise<void>;
  addApplication: () => void;
  updateApplication: (id: string, patch: Partial<Omit<Application, 'id'>>) => void;
  removeApplication: (id: string) => void;
}

export const useTrackerStore = create<TrackerState>()(
  persist(
    (set, get) => ({
      applications: [],
      syncing: false,

      syncFromCloud: async () => {
        set({ syncing: true });
        try {
          const cloudApps = await db.fetchApplications();
          if (cloudApps.length === 0) {
            // New account: push local data to cloud
            const local = get().applications;
            await Promise.all(local.map(db.upsertApplication));
          } else {
            set({ applications: cloudApps });
          }
        } catch (e) {
          console.warn('[trackerStore] syncFromCloud', e);
        } finally {
          set({ syncing: false });
        }
      },

      addApplication: () => {
        const app = newApp();
        set((s) => ({ applications: [app, ...s.applications] }));
        db.upsertApplication(app);
      },

      updateApplication: (id, patch) => {
        set((s) => ({
          applications: s.applications.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        }));
        queueSave(`app-${id}`, () => {
          const app = get().applications.find((a) => a.id === id);
          if (app) db.upsertApplication(app);
        });
      },

      removeApplication: (id) => {
        set((s) => ({ applications: s.applications.filter((a) => a.id !== id) }));
        db.deleteApplication(id);
      },
    }),
    { name: 'path_tracker' }  // localStorage fallback for offline
  )
);
