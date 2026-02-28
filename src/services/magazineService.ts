import { supabase } from '../config/supabase';
import type { Magazine } from '../types';

/* ------------------------------------------------------------------ */
/*  Magazine CRUD Service                                              */
/* ------------------------------------------------------------------ */

/** Fetch all magazines for a given firearm. */
export async function getMagazines(firearmId: string) {
  const { data, error } = await supabase
    .from('magazines')
    .select('*')
    .eq('firearm_id', firearmId)
    .order('created_at', { ascending: false });

  return { data: (data ?? []) as Magazine[], error };
}

/** Create a new magazine record. */
export async function createMagazine(fields: Partial<Magazine>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: null, error: new Error('Not authenticated') };

  const { data, error } = await supabase
    .from('magazines')
    .insert({ ...fields, user_id: user.id })
    .select()
    .single();

  return { data: data as Magazine | null, error };
}

/** Update an existing magazine by id. */
export async function updateMagazine(id: string, fields: Partial<Magazine>) {
  const { data, error } = await supabase
    .from('magazines')
    .update(fields)
    .eq('id', id)
    .select()
    .single();

  return { data: data as Magazine | null, error };
}

/** Delete a magazine by id. */
export async function deleteMagazine(id: string) {
  const { error } = await supabase.from('magazines').delete().eq('id', id);
  return { error };
}
