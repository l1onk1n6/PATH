import { create } from 'zustand';

export type AccountSection = 'account' | 'security' | 'referral' | 'privacy' | 'plan';
export type Theme = 'dark' | 'light';

function initTheme(): Theme {
  const saved = localStorage.getItem('path_theme') as Theme | null;
  const theme = saved === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  return theme;
}

interface UIStore {
  accountSection: AccountSection;
  setAccountSection: (s: AccountSection) => void;
  showTranslate: boolean;
  setShowTranslate: (v: boolean) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  accountSection: 'account',
  setAccountSection: (accountSection) => set({ accountSection }),
  showTranslate: false,
  setShowTranslate: (showTranslate) => set({ showTranslate }),
  theme: initTheme(),
  setTheme: (theme) => {
    localStorage.setItem('path_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },
}));
