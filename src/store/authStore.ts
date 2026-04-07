import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { toGermanError } from '../lib/authErrors';

interface AuthStore {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  passwordRecovery: boolean;
  emailUnconfirmed: boolean; // nach Registrierung: warte auf Bestätigung

  initialize: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  session: null,
  loading: true,
  error: null,
  passwordRecovery: false,
  emailUnconfirmed: false,

  initialize: async () => {
    if (!isSupabaseConfigured()) {
      set({ loading: false });
      return;
    }
    try {
      const supabase = getSupabase();

      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          set({ session, user: session?.user ?? null, loading: false, passwordRecovery: true });
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, session: null, loading: false, passwordRecovery: false, emailUnconfirmed: false });
        } else if (event === 'TOKEN_REFRESHED') {
          set({ session, user: session?.user ?? null });
        } else {
          set({ session, user: session?.user ?? null, loading: false, passwordRecovery: false });
        }
      });

      await supabase.auth.getSession();
    } catch {
      set({ loading: false });
    }
  },

  signUp: async (email, password, name) => {
    set({ loading: true, error: null, emailUnconfirmed: false });
    try {
      const supabase = getSupabase();
      const redirectTo = `${window.location.origin}${window.location.pathname}`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name }, emailRedirectTo: redirectTo },
      });
      if (error) throw error;

      // Supabase gibt user zurück, aber session=null wenn E-Mail-Bestätigung nötig
      const needsConfirmation = data.user && !data.session;
      set({
        user: needsConfirmation ? null : data.user,
        session: data.session,
        loading: false,
        emailUnconfirmed: !!needsConfirmation,
      });
    } catch (e) {
      set({ error: toGermanError(e), loading: false });
    }
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      set({ user: data.user, session: data.session, loading: false, emailUnconfirmed: false });
    } catch (e) {
      set({ error: toGermanError(e), loading: false });
    }
  },

  signOut: async () => {
    try {
      const supabase = getSupabase();
      await supabase.auth.signOut();
    } catch {
      // ignore
    } finally {
      set({ user: null, session: null, passwordRecovery: false, emailUnconfirmed: false });
    }
  },

  sendPasswordReset: async (email) => {
    set({ loading: true, error: null });
    try {
      const supabase = getSupabase();
      const redirectTo = `${window.location.origin}${window.location.pathname}`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      set({ loading: false });
    } catch (e) {
      set({ error: toGermanError(e), loading: false });
    }
  },

  updatePassword: async (newPassword) => {
    set({ loading: true, error: null });
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      set({ loading: false, passwordRecovery: false });
    } catch (e) {
      set({ error: toGermanError(e), loading: false });
    }
  },

  resendConfirmation: async (email) => {
    set({ loading: true, error: null });
    try {
      const supabase = getSupabase();
      const redirectTo = `${window.location.origin}${window.location.pathname}`;
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;
      set({ loading: false });
    } catch (e) {
      set({ error: toGermanError(e), loading: false });
    }
  },

  refreshUser: async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const supabase = getSupabase();
      const { data } = await supabase.auth.refreshSession();
      if (data.session) {
        set({ session: data.session, user: data.session.user });
      }
    } catch { /* ignore */ }
  },

  clearError: () => set({ error: null }),
}));
