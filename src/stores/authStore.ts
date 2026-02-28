import { create } from 'zustand';
import type { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';

/* ------------------------------------------------------------------ */
/*  Auth step union                                                    */
/* ------------------------------------------------------------------ */
export type AuthStep =
  | 'signin'
  | 'signup-email'
  | 'signup-otp'
  | 'signup-password'
  | 'forgot-email'
  | 'forgot-otp'
  | 'forgot-password';

/* ------------------------------------------------------------------ */
/*  Store shape                                                        */
/* ------------------------------------------------------------------ */
interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  settingPassword: boolean;
  pendingEmail: string;
  authStep: AuthStep;

  /* actions */
  initialize: () => Promise<void>;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: AuthError | null }>;
  signUp: (email: string) => Promise<{ error: AuthError | null }>;
  verifyOtp: (token: string) => Promise<{ error: AuthError | null }>;
  setPassword: (password: string) => Promise<{ error: AuthError | null }>;
  forgotPassword: (email: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  setAuthStep: (step: AuthStep) => void;
  resetAuth: () => void;
}

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */
export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  loading: true,
  settingPassword: false,
  pendingEmail: '',
  authStep: 'signin',

  /* ---- initialize ------------------------------------------------ */
  initialize: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      set({
        session,
        user: session?.user ?? null,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }

    /* Listen for future auth changes */
    supabase.auth.onAuthStateChange((_event, session) => {
      /* If the user is in the middle of creating / resetting a
         password we must NOT update the session yet — the UI is
         still showing the set-password form and updating here would
         cause AuthGate to prematurely render the main app. */
      if (get().settingPassword) return;

      set({
        session,
        user: session?.user ?? null,
      });
    });
  },

  /* ---- signIn ---------------------------------------------------- */
  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error ?? null };
  },

  /* ---- signUp (OTP) --------------------------------------------- */
  signUp: async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

    if (!error) {
      set({ pendingEmail: email, authStep: 'signup-otp' });
    }

    return { error: error ?? null };
  },

  /* ---- verifyOtp ------------------------------------------------- */
  verifyOtp: async (token) => {
    const { pendingEmail, authStep } = get();

    const { error } = await supabase.auth.verifyOtp({
      email: pendingEmail,
      token,
      type: 'email',
    });

    if (!error) {
      /* Mark that we are about to show the set-password screen so the
         onAuthStateChange listener does not push the user into the app
         while they are still creating / resetting their password. */
      const nextStep =
        authStep === 'signup-otp' ? 'signup-password' : 'forgot-password';

      set({ settingPassword: true, authStep: nextStep });
    }

    return { error: error ?? null };
  },

  /* ---- setPassword ----------------------------------------------- */
  setPassword: async (password) => {
    const { error } = await supabase.auth.updateUser({ password });

    if (!error) {
      /* Release the guard — the next onAuthStateChange will set the
         session properly and AuthGate will render children. */
      set({ settingPassword: false });

      /* Manually refresh the session so onAuthStateChange fires
         immediately with a valid session. */
      const {
        data: { session },
      } = await supabase.auth.getSession();

      set({
        session,
        user: session?.user ?? null,
      });
    }

    return { error: error ?? null };
  },

  /* ---- forgotPassword -------------------------------------------- */
  forgotPassword: async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });

    if (!error) {
      set({ pendingEmail: email, authStep: 'forgot-otp' });
    }

    return { error: error ?? null };
  },

  /* ---- signOut --------------------------------------------------- */
  signOut: async () => {
    await supabase.auth.signOut();
    set({
      session: null,
      user: null,
      settingPassword: false,
      pendingEmail: '',
      authStep: 'signin',
    });
  },

  /* ---- navigation helpers ---------------------------------------- */
  setAuthStep: (step) => set({ authStep: step }),

  resetAuth: () =>
    set({
      authStep: 'signin',
      pendingEmail: '',
      settingPassword: false,
    }),
}));
