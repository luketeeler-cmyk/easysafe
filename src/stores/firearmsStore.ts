import { create } from 'zustand';
import type { Firearm, FirearmCategory } from '../types';
import {
  getFirearms,
  createFirearm,
  updateFirearm,
  deleteFirearm,
} from '../services/firearmService';

/* ------------------------------------------------------------------ */
/*  Firearms Store                                                      */
/* ------------------------------------------------------------------ */

interface FirearmsState {
  firearms: Firearm[];
  loading: boolean;
  error: string | null;

  fetchFirearms: (category?: FirearmCategory) => Promise<void>;
  addFirearm: (
    data: Partial<Firearm>,
  ) => Promise<{ data: Firearm | null; error: string | null }>;
  updateFirearm: (
    id: string,
    data: Partial<Firearm>,
  ) => Promise<{ error: string | null }>;
  removeFirearm: (id: string) => Promise<{ error: string | null }>;
}

export const useFirearmsStore = create<FirearmsState>((set, get) => ({
  firearms: [],
  loading: false,
  error: null,

  /* ---- fetchFirearms ---------------------------------------------- */
  fetchFirearms: async (category?: FirearmCategory) => {
    set({ loading: true, error: null });

    const { data, error } = await getFirearms(category);

    if (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : String(error),
      });
      return;
    }

    set({ firearms: data, loading: false });
  },

  /* ---- addFirearm ------------------------------------------------- */
  addFirearm: async (data) => {
    const { data: created, error } = await createFirearm(data);

    if (error) {
      const msg = error instanceof Error ? error.message : String(error);
      set({ error: msg });
      return { data: null, error: msg };
    }

    if (created) {
      set({ firearms: [created, ...get().firearms] });
    }

    return { data: created, error: null };
  },

  /* ---- updateFirearm ---------------------------------------------- */
  updateFirearm: async (id, data) => {
    const { data: updated, error } = await updateFirearm(id, data);

    if (error) {
      const msg = error instanceof Error ? error.message : String(error);
      set({ error: msg });
      return { error: msg };
    }

    if (updated) {
      set({
        firearms: get().firearms.map((f) => (f.id === id ? updated : f)),
      });
    }

    return { error: null };
  },

  /* ---- removeFirearm ---------------------------------------------- */
  removeFirearm: async (id) => {
    const { error } = await deleteFirearm(id);

    if (error) {
      const msg = error instanceof Error ? error.message : String(error);
      set({ error: msg });
      return { error: msg };
    }

    set({ firearms: get().firearms.filter((f) => f.id !== id) });
    return { error: null };
  },
}));
