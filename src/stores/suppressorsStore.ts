import { create } from 'zustand';
import type { Suppressor } from '../types';
import {
  getSuppressors,
  createSuppressor,
  updateSuppressor,
  deleteSuppressor,
} from '../services/suppressorService';

/* ------------------------------------------------------------------ */
/*  Suppressors Store                                                   */
/* ------------------------------------------------------------------ */

interface SuppressorsState {
  suppressors: Suppressor[];
  loading: boolean;
  error: string | null;

  fetchSuppressors: () => Promise<void>;
  addSuppressor: (
    data: Partial<Suppressor>,
  ) => Promise<{ data: Suppressor | null; error: string | null }>;
  updateSuppressor: (
    id: string,
    data: Partial<Suppressor>,
  ) => Promise<{ error: string | null }>;
  removeSuppressor: (id: string) => Promise<{ error: string | null }>;
}

export const useSuppressorsStore = create<SuppressorsState>((set, get) => ({
  suppressors: [],
  loading: false,
  error: null,

  /* ---- fetchSuppressors ------------------------------------------ */
  fetchSuppressors: async () => {
    set({ loading: true, error: null });

    const { data, error } = await getSuppressors();

    if (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : String(error),
      });
      return;
    }

    set({ suppressors: data, loading: false });
  },

  /* ---- addSuppressor --------------------------------------------- */
  addSuppressor: async (data) => {
    const { data: created, error } = await createSuppressor(data);

    if (error) {
      const msg = error instanceof Error ? error.message : String(error);
      set({ error: msg });
      return { data: null, error: msg };
    }

    if (created) {
      set({ suppressors: [created, ...get().suppressors] });
    }

    return { data: created, error: null };
  },

  /* ---- updateSuppressor ------------------------------------------ */
  updateSuppressor: async (id, data) => {
    const { data: updated, error } = await updateSuppressor(id, data);

    if (error) {
      const msg = error instanceof Error ? error.message : String(error);
      set({ error: msg });
      return { error: msg };
    }

    if (updated) {
      set({
        suppressors: get().suppressors.map((s) => (s.id === id ? updated : s)),
      });
    }

    return { error: null };
  },

  /* ---- removeSuppressor ------------------------------------------ */
  removeSuppressor: async (id) => {
    const { error } = await deleteSuppressor(id);

    if (error) {
      const msg = error instanceof Error ? error.message : String(error);
      set({ error: msg });
      return { error: msg };
    }

    set({ suppressors: get().suppressors.filter((s) => s.id !== id) });
    return { error: null };
  },
}));
