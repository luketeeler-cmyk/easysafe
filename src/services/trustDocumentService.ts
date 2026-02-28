import { supabase } from '../config/supabase';
import type { TrustDocument } from '../types';

/* ------------------------------------------------------------------ */
/*  Trust Document CRUD + Storage Service                              */
/* ------------------------------------------------------------------ */

/** Fetch all trust documents for the current user, newest first. */
export async function getTrustDocuments() {
  const { data, error } = await supabase
    .from('trust_documents')
    .select('*')
    .order('created_at', { ascending: false });

  return { data: (data ?? []) as TrustDocument[], error };
}

/** Create a trust document record (metadata row). */
export async function createTrustDocument(fields: Partial<TrustDocument>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: null, error: new Error('Not authenticated') };

  const { data, error } = await supabase
    .from('trust_documents')
    .insert({ ...fields, user_id: user.id })
    .select()
    .single();

  return { data: data as TrustDocument | null, error };
}

/** Delete a trust document record by id. */
export async function deleteTrustDocument(id: string) {
  const { error } = await supabase.from('trust_documents').delete().eq('id', id);
  return { error };
}

/**
 * Upload a file to the 'trust-documents' storage bucket.
 * Returns { data: filePath, error }.
 */
export async function uploadDocument(
  file: File,
): Promise<{ data: string | null; error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: null, error: 'Not authenticated' };

  const ts = Date.now();
  const filePath = `${user.id}/${ts}_${file.name}`;

  const { error } = await supabase.storage
    .from('trust-documents')
    .upload(filePath, file, { upsert: true });

  if (error) return { data: null, error: error.message };

  return { data: filePath, error: null };
}

/**
 * Generate a signed URL for a trust document file.
 */
export async function getDocumentUrl(
  filePath: string,
): Promise<{ data: string | null; error: string | null }> {
  const { data, error } = await supabase.storage
    .from('trust-documents')
    .createSignedUrl(filePath, 31_536_000);

  if (error) return { data: null, error: error.message };

  return { data: data.signedUrl, error: null };
}

/** Delete a file from the trust-documents storage bucket. */
export async function deleteDocumentFile(filePath: string) {
  const { error } = await supabase.storage
    .from('trust-documents')
    .remove([filePath]);
  return { error };
}
