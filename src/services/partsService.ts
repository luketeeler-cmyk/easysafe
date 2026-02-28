import { supabase } from '../config/supabase';
import type { PartAttachment } from '../types';

/* ------------------------------------------------------------------ */
/*  Parts / Attachments CRUD Service                                   */
/* ------------------------------------------------------------------ */

/** Fetch parts for a given parent (firearm or suppressor). */
export async function getParts(parentType: string, parentId: string) {
  const { data, error } = await supabase
    .from('parts_attachments')
    .select('*')
    .eq('parent_type', parentType)
    .eq('parent_id', parentId)
    .order('created_at', { ascending: false });

  return { data: (data ?? []) as PartAttachment[], error };
}

/** Create a new part/attachment record. */
export async function createPart(fields: Partial<PartAttachment>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: null, error: new Error('Not authenticated') };

  const { data, error } = await supabase
    .from('parts_attachments')
    .insert({ ...fields, user_id: user.id })
    .select()
    .single();

  return { data: data as PartAttachment | null, error };
}

/** Update an existing part by id. */
export async function updatePart(id: string, fields: Partial<PartAttachment>) {
  const { data, error } = await supabase
    .from('parts_attachments')
    .update(fields)
    .eq('id', id)
    .select()
    .single();

  return { data: data as PartAttachment | null, error };
}

/** Delete a part by id. */
export async function deletePart(id: string) {
  const { error } = await supabase.from('parts_attachments').delete().eq('id', id);
  return { error };
}
