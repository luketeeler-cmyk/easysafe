import { create } from 'zustand';
import type { RoundCount } from '../types';
import {
  getRoundCounts,
  createRoundCount,
  deleteRoundCount,
} from '../services/roundCountService';

/* ------------------------------------------------------------------ */
/*  Round Counts Store                                                  */
/* ------------------------------------------------------------------ */

interface RoundCountsState {
  roundCounts: RoundCount[];
  totalCount: number;
  loading: boolean;
  error: string | null;

  fetchRoundCounts: (parentType: string, parentId: string) => Promise<void>;
  addRoundCount: (
    data: Partial<RoundCount>,
  ) => Promise<{ data: RoundCount | null; error: string | null }>;
  removeRoundCount: (id: string) => Promise<{ error: string | null }>;
}

/** Helper: sum all round count entries. */
function computeTotal(roundCounts: RoundCount[]): number {
  return roundCounts.reduce((sum, rc) => sum + (rc.count ?? 0), 0);
}

export const useRoundCountsStore = create<RoundCountsState>((set, get) => ({
  roundCounts: [],
  totalCount: 0,
  loading: false,
  error: null,

  /* ---- fetchRoundCounts ------------------------------------------ */
  fetchRoundCounts: async (parentType: string, parentId: string) => {
    set({ loading: true, error: null });

    const { data, error } = await getRoundCounts(parentType, parentId);

    if (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : String(error),
      });
      return;
    }

    set({
      roundCounts: data,
      totalCount: computeTotal(data),
      loading: false,
    });
  },

  /* ---- addRoundCount --------------------------------------------- */
  addRoundCount: async (data) => {
    const { data: created, error } = await createRoundCount(data);

    if (error) {
      const msg = error instanceof Error ? error.message : String(error);
      set({ error: msg });
      return { data: null, error: msg };
    }

    if (created) {
      const updated = [created, ...get().roundCounts];
      set({ roundCounts: updated, totalCount: computeTotal(updated) });
    }

    return { data: created, error: null };
  },

  /* ---- removeRoundCount ------------------------------------------ */
  removeRoundCount: async (id) => {
    const { error } = await deleteRoundCount(id);

    if (error) {
      const msg = error instanceof Error ? error.message : String(error);
      set({ error: msg });
      return { error: msg };
    }

    const updated = get().roundCounts.filter((rc) => rc.id !== id);
    set({ roundCounts: updated, totalCount: computeTotal(updated) });
    return { error: null };
  },
}));
