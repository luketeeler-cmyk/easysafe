import { supabase } from '../config/supabase';
import type { Firearm, FirearmCategory } from '../types';

/* ------------------------------------------------------------------ */
/*  Firearm CRUD Service                                               */
/* ------------------------------------------------------------------ */

/** Fetch all firearms, optionally filtered by category. */
export async function getFirearms(category?: FirearmCategory) {
  let query = supabase
    .from('firearms')
    .select('*')
    .order('created_at', { ascending: false });

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  return { data: (data ?? []) as Firearm[], error };
}

/** Fetch a single firearm by id. */
export async function getFirearm(id: string) {
  const { data, error } = await supabase
    .from('firearms')
    .select('*')
    .eq('id', id)
    .single();

  return { data: data as Firearm | null, error };
}

/** Create a new firearm record. */
export async function createFirearm(fields: Partial<Firearm>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: null, error: new Error('Not authenticated') };

  const { data, error } = await supabase
    .from('firearms')
    .insert({ ...fields, user_id: user.id })
    .select()
    .single();

  return { data: data as Firearm | null, error };
}

/** Update an existing firearm by id. */
export async function updateFirearm(id: string, fields: Partial<Firearm>) {
  const { data, error } = await supabase
    .from('firearms')
    .update(fields)
    .eq('id', id)
    .select()
    .single();

  return { data: data as Firearm | null, error };
}

/** Delete a firearm by id. */
export async function deleteFirearm(id: string) {
  const { error } = await supabase.from('firearms').delete().eq('id', id);
  return { error };
}
