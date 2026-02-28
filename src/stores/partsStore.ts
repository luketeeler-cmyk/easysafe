import { create } from 'zustand';
import type { PartAttachment } from '../types';
import {
  getParts,
  createPart,
  updatePart,
  deletePart,
} from '../services/partsService';

/* ------------------------------------------------------------------ */
/*  Parts / Attachments Store                                           */
/* ------------------------------------------------------------------ */

interface PartsState {
  parts: PartAttachment[];
  loading: boolean;
  error: string | null;

  fetchParts: (parentType: string, parentId: string) => Promise<void>;
  addPart: (
    data: Partial<PartAttachment>,
  ) => Promise<{ data: PartAttachment | null; error: string | null }>;
  updatePart: (
    id: string,
    data: Partial<PartAttachment>,
  ) => Promise<{ error: string | null }>;
  removePart: (id: string) => Promise<{ error: string | null }>;
}

export const usePartsStore = create<PartsState>((set, get) => ({
  parts: [],
  loading: false,
  error: null,

  /* ---- fetchParts ------------------------------------------------ */
  fetchParts: async (parentType: string, parentId: string) => {
    set({ loading: true, error: null });

    const { data, error } = await getParts(parentType, parentId);

    if (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : String(error),
      });
      return;
    }

    set({ parts: data, loading: false });
  },

  /* ---- addPart --------------------------------------------------- */
  addPart: async (data) => {
    const { data: created, error } = await createPart(data);

    if (error) {
      const msg = error instanceof Error ? error.message : String(error);
      set({ error: msg });
      return { data: null, error: msg };
    }

    if (created) {
      set({ parts: [created, ...get().parts] });
    }

    return { data: created, error: null };
  },

  /* ---- updatePart ------------------------------------------------ */
  updatePart: async (id, data) => {
    const { data: updated, error } = await updatePart(id, data);

    if (error) {
      const msg = error instanceof Error ? error.message : String(error);
      set({ error: msg });
      return { error: msg };
    }

    if (updated) {
      set({
        parts: get().parts.map((p) => (p.id === id ? updated : p)),
      });
    }

    return { error: null };
  },

  /* ---- removePart ------------------------------------------------ */
  removePart: async (id) => {
    const { error } = await deletePart(id);

    if (error) {
      const msg = error instanceof Error ? error.message : String(error);
      set({ error: msg });
      return { error: msg };
    }

    set({ parts: get().parts.filter((p) => p.id !== id) });
    return { error: null };
  },
}));
