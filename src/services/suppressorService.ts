import { supabase } from '../config/supabase';
import type { Suppressor } from '../types';

/* ------------------------------------------------------------------ */
/*  Suppressor CRUD Service                                            */
/* ------------------------------------------------------------------ */

/** Fetch all suppressors, ordered by created_at desc. */
export async function getSuppressors() {
  const { data, error } = await supabase
    .from('suppressors')
    .select('*')
    .order('created_at', { ascending: false });

  return { data: (data ?? []) as Suppressor[], error };
}

/** Fetch a single suppressor by id. */
export async function getSuppressor(id: string) {
  const { data, error } = await supabase
    .from('suppressors')
    .select('*')
    .eq('id', id)
    .single();

  return { data: data as Suppressor | null, error };
}

/** Create a new suppressor record. */
export async function createSuppressor(fields: Partial<Suppressor>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: null, error: new Error('Not authenticated') };

  const { data, error } = await supabase
    .from('suppressors')
    .insert({ ...fields, user_id: user.id })
    .select()
    .single();

  return { data: data as Suppressor | null, error };
}

/** Update an existing suppressor by id. */
export async function updateSuppressor(id: string, fields: Partial<Suppressor>) {
  const { data, error } = await supabase
    .from('suppressors')
    .update(fields)
    .eq('id', id)
    .select()
    .single();

  return { data: data as Suppressor | null, error };
}

/** Delete a suppressor by id. */
export async function deleteSuppressor(id: string) {
  const { error } = await supabase.from('suppressors').delete().eq('id', id);
  return { error };
}
