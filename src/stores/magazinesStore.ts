import { create } from 'zustand';
import type { Magazine } from '../types';
import {
  getMagazines,
  createMagazine,
  updateMagazine,
  deleteMagazine,
} from '../services/magazineService';

/* ------------------------------------------------------------------ */
/*  Magazines Store                                                     */
/* ------------------------------------------------------------------ */

interface MagazinesState {
  magazines: Magazine[];
  loading: boolean;
  error: string | null;

  fetchMagazines: (firearmId: string) => Promise<void>;
  addMagazine: (
    data: Partial<Magazine>,
  ) => Promise<{ data: Magazine | null; error: string | null }>;
  updateMagazine: (
    id: string,
    data: Partial<Magazine>,
  ) => Promise<{ error: string | null }>;
  removeMagazine: (id: string) => Promise<{ error: string | null }>;
}

export const useMagazinesStore = create<MagazinesState>((set, get) => ({
  magazines: [],
  loading: false,
  error: null,

  /* ---- fetchMagazines -------------------------------------------- */
  fetchMagazines: async (firearmId: string) => {
    set({ loading: true, error: null });

    const { data, error } = await getMagazines(firearmId);

    if (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : String(error),
      });
      return;
    }

    set({ magazines: data, loading: false });
  },

  /* ---- addMagazine ----------------------------------------------- */
  addMagazine: async (data) => {
    const { data: created, error } = await createMagazine(data);

    if (error) {
      const msg = error instanceof Error ? error.message : String(error);
      set({ error: msg });
      return { data: null, error: msg };
    }

    if (created) {
      set({ magazines: [created, ...get().magazines] });
    }

    return { data: created, error: null };
  },

  /* ---- updateMagazine -------------------------------------------- */
  updateMagazine: async (id, data) => {
    const { data: updated, error } = await updateMagazine(id, data);

    if (error) {
      const msg = error instanceof Error ? error.message : String(error);
      set({ error: msg });
      return { error: msg };
    }

    if (updated) {
      set({
        magazines: get().magazines.map((m) => (m.id === id ? updated : m)),
      });
    }

    return { error: null };
  },

  /* ---- removeMagazine -------------------------------------------- */
  removeMagazine: async (id) => {
    const { error } = await deleteMagazine(id);

    if (error) {
      const msg = error instanceof Error ? error.message : String(error);
      set({ error: msg });
      return { error: msg };
    }

    set({ magazines: get().magazines.filter((m) => m.id !== id) });
    return { error: null };
  },
}));
