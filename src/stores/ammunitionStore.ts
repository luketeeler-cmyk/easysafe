import { create } from 'zustand';
import type { Ammunition } from '../types';
import {
  getAmmunition,
  createAmmunition,
  updateAmmunition,
  deleteAmmunition,
} from '../services/ammunitionService';

/* ------------------------------------------------------------------ */
/*  Ammunition Store                                                    */
/* ------------------------------------------------------------------ */

interface AmmunitionState {
  ammunition: Ammunition[];
  loading: boolean;
  error: string | null;

  fetchAmmunition: () => Promise<void>;
  addAmmunition: (
    data: Partial<Ammunition>,
  ) => Promise<{ data: Ammunition | null; error: string | null }>;
  updateAmmunition: (
    id: string,
    data: Partial<Ammunition>,
  ) => Promise<{ error: string | null }>;
  removeAmmunition: (id: string) => Promise<{ error: string | null }>;
}

export const useAmmunitionStore = create<AmmunitionState>((set, get) => ({
  ammunition: [],
  loading: false,
  error: null,

  /* ---- fetchAmmunition ------------------------------------------- */
  fetchAmmunition: async () => {
    set({ loading: true, error: null });

    const { data, error } = await getAmmunition();

    if (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : String(error),
      });
      return;
    }

    set({ ammunition: data, loading: false });
  },

  /* ---- addAmmunition --------------------------------------------- */
  addAmmunition: async (data) => {
    const { data: created, error } = await createAmmunition(data);

    if (error) {
      const msg = error instanceof Error ? error.message : String(error);
      set({ error: msg });
      return { data: null, error: msg };
    }

    if (created) {
      set({ ammunition: [created, ...get().ammunition] });
    }

    return { data: created, error: null };
  },

  /* ---- updateAmmunition ------------------------------------------ */
  updateAmmunition: async (id, data) => {
    const { data: updated, error } = await updateAmmunition(id, data);

    if (error) {
      const msg = error instanceof Error ? error.message : String(error);
      set({ error: msg });
      return { error: msg };
    }

    if (updated) {
      set({
        ammunition: get().ammunition.map((a) => (a.id === id ? updated : a)),
      });
    }

    return { error: null };
  },

  /* ---- removeAmmunition ------------------------------------------ */
  removeAmmunition: async (id) => {
    const { error } = await deleteAmmunition(id);

    if (error) {
      const msg = error instanceof Error ? error.message : String(error);
      set({ error: msg });
      return { error: msg };
    }

    set({ ammunition: get().ammunition.filter((a) => a.id !== id) });
    return { error: null };
  },
}));
