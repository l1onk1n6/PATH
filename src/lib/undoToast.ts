import { create } from 'zustand';

export interface UndoToast {
  id: number;
  message: string;
  onUndo: () => void;
  createdAt: number;
  durationMs: number;
}

interface UndoToastStore {
  toasts: UndoToast[];
  show: (message: string, onUndo: () => void, durationMs?: number) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useUndoToast = create<UndoToastStore>((set, get) => ({
  toasts: [],
  show: (message, onUndo, durationMs = 6000) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, message, onUndo, createdAt: Date.now(), durationMs }] }));
    setTimeout(() => {
      // auto-dismiss if still present
      if (get().toasts.some(t => t.id === id)) get().dismiss(id);
    }, durationMs);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}));
