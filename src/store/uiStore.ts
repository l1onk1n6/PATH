import { create } from 'zustand';

export type AccountSection = 'account' | 'security' | 'referral' | 'privacy' | 'plan';

interface UIStore {
  accountSection: AccountSection;
  setAccountSection: (s: AccountSection) => void;
  showTranslate: boolean;
  setShowTranslate: (v: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  accountSection: 'account',
  setAccountSection: (accountSection) => set({ accountSection }),
  showTranslate: false,
  setShowTranslate: (showTranslate) => set({ showTranslate }),
}));
