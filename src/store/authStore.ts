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
  emailUnconfirmed: boolean;

  initialize: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
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
          // Live-Sync des Stripe-Abostatus — zieht Pro auf Mobile/Web gleich.
          // Async, blockiert den Auth-Flow nicht.
          if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
            void useAuthStore.getState().refreshUser();
          }
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
    // Reset route before logout so next login always starts at Dashboard
    window.location.hash = '#/';
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

  updateName: async (name) => {
    set({ loading: true, error: null });
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.updateUser({ data: { full_name: name } });
      if (error) throw error;
      set({ user: data.user, loading: false });
    } catch (e) {
      set({ error: toGermanError(e), loading: false });
    }
  },

  deleteAccount: async () => {
    set({ loading: true, error: null });
    try {
      const supabase = getSupabase();
      const { error } = await supabase.rpc('delete_user');
      if (error) throw error;
      // Sign out after successful deletion (session is invalid anyway)
      await supabase.auth.signOut().catch(() => {});
      set({ user: null, session: null, loading: false });
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

      // Vor dem eigentlichen User-Refresh: Stripe-Abo live syncen.
      // Stellt sicher dass Web-Pro auf Mobile und Mobile-Pro auf Web
      // erscheint, auch wenn ein Webhook verpasst wurde.
      const { data: { session: s0 } } = await supabase.auth.getSession();
      if (s0?.access_token) {
        try {
          await supabase.functions.invoke('sync-subscription', {
            headers: { Authorization: `Bearer ${s0.access_token}` },
          });
        } catch (e) {
          console.warn('[auth] sync-subscription failed', e);
        }
      }

      // getUser() always fetches fresh metadata from the server (no JWT cache)
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        set((s) => ({ user: userData.user, session: s.session }));
      }
      // Also refresh the session token so the new metadata is in the JWT
      const { data: sessionData } = await supabase.auth.refreshSession();
      if (sessionData.session) {
        set({ session: sessionData.session, user: sessionData.session.user });
      }
    } catch { /* ignore */ }
  },

  clearError: () => set({ error: null }),
}));
