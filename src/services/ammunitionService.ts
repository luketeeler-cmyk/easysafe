import { supabase } from '../config/supabase';
import type { Ammunition } from '../types';

/* ------------------------------------------------------------------ */
/*  Ammunition CRUD Service                                            */
/* ------------------------------------------------------------------ */

/** Fetch all ammunition, ordered by caliber then manufacturer. */
export async function getAmmunition() {
  const { data, error } = await supabase
    .from('ammunition')
    .select('*')
    .order('caliber', { ascending: true })
    .order('manufacturer', { ascending: true });

  return { data: (data ?? []) as Ammunition[], error };
}

/** Fetch ammunition that matches a given caliber (case-insensitive). */
export async function getAmmunitionByCaliber(caliber: string) {
  const { data, error } = await supabase
    .from('ammunition')
    .select('*')
    .ilike('caliber', caliber)
    .order('manufacturer', { ascending: true });

  return { data: (data ?? []) as Ammunition[], error };
}

/** Fetch a single ammunition item by id. */
export async function getAmmunitionItem(id: string) {
  const { data, error } = await supabase
    .from('ammunition')
    .select('*')
    .eq('id', id)
    .single();

  return { data: data as Ammunition | null, error };
}

/** Create a new ammunition record. */
export async function createAmmunition(fields: Partial<Ammunition>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: null, error: new Error('Not authenticated') };

  const { data, error } = await supabase
    .from('ammunition')
    .insert({ ...fields, user_id: user.id })
    .select()
    .single();

  return { data: data as Ammunition | null, error };
}

/** Update an existing ammunition record by id. */
export async function updateAmmunition(id: string, fields: Partial<Ammunition>) {
  const { data, error } = await supabase
    .from('ammunition')
    .update(fields)
    .eq('id', id)
    .select()
    .single();

  return { data: data as Ammunition | null, error };
}

/** Delete an ammunition record by id. */
export async function deleteAmmunition(id: string) {
  const { error } = await supabase.from('ammunition').delete().eq('id', id);
  return { error };
}
