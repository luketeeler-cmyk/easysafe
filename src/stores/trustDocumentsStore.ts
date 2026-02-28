import { create } from 'zustand';
import type { TrustDocument } from '../types';
import {
  getTrustDocuments,
  createTrustDocument,
  deleteTrustDocument,
} from '../services/trustDocumentService';

/* ------------------------------------------------------------------ */
/*  Trust Documents Store                                               */
/* ------------------------------------------------------------------ */

interface TrustDocumentsState {
  documents: TrustDocument[];
  loading: boolean;
  error: string | null;

  fetchDocuments: () => Promise<void>;
  addDocument: (
    data: Partial<TrustDocument>,
  ) => Promise<{ data: TrustDocument | null; error: string | null }>;
  removeDocument: (id: string) => Promise<{ error: string | null }>;
}

export const useTrustDocumentsStore = create<TrustDocumentsState>(
  (set, get) => ({
    documents: [],
    loading: false,
    error: null,

    /* ---- fetchDocuments -------------------------------------------- */
    fetchDocuments: async () => {
      set({ loading: true, error: null });

      const { data, error } = await getTrustDocuments();

      if (error) {
        set({
          loading: false,
          error: error instanceof Error ? error.message : String(error),
        });
        return;
      }

      set({ documents: data, loading: false });
    },

    /* ---- addDocument ----------------------------------------------- */
    addDocument: async (data) => {
      const { data: created, error } = await createTrustDocument(data);

      if (error) {
        const msg = error instanceof Error ? error.message : String(error);
        set({ error: msg });
        return { data: null, error: msg };
      }

      if (created) {
        set({ documents: [created, ...get().documents] });
      }

      return { data: created, error: null };
    },

    /* ---- removeDocument -------------------------------------------- */
    removeDocument: async (id) => {
      const { error } = await deleteTrustDocument(id);

      if (error) {
        const msg = error instanceof Error ? error.message : String(error);
        set({ error: msg });
        return { error: msg };
      }

      set({ documents: get().documents.filter((d) => d.id !== id) });
      return { error: null };
    },
  }),
);
