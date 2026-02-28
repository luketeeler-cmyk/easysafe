import { supabase } from '../config/supabase';
import type { RoundCount } from '../types';

/* ------------------------------------------------------------------ */
/*  Round Count CRUD Service                                           */
/* ------------------------------------------------------------------ */

/** Fetch round counts for a parent (firearm or suppressor), newest first. */
export async function getRoundCounts(parentType: string, parentId: string) {
  const { data, error } = await supabase
    .from('round_counts')
    .select('*')
    .eq('parent_type', parentType)
    .eq('parent_id', parentId)
    .order('date', { ascending: false });

  return { data: (data ?? []) as RoundCount[], error };
}

/** Sum all round counts for a parent entity. */
export async function getTotalRoundCount(
  parentType: string,
  parentId: string,
): Promise<{ total: number; error: unknown }> {
  const { data, error } = await supabase
    .from('round_counts')
    .select('count')
    .eq('parent_type', parentType)
    .eq('parent_id', parentId);

  if (error) return { total: 0, error };

  const total = (data ?? []).reduce(
    (sum: number, row: { count: number }) => sum + (row.count ?? 0),
    0,
  );

  return { total, error: null };
}

/** Create a new round count entry. */
export async function createRoundCount(fields: Partial<RoundCount>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: null, error: new Error('Not authenticated') };

  const { data, error } = await supabase
    .from('round_counts')
    .insert({ ...fields, user_id: user.id })
    .select()
    .single();

  return { data: data as RoundCount | null, error };
}

/** Delete a round count entry by id. */
export async function deleteRoundCount(id: string) {
  const { error } = await supabase.from('round_counts').delete().eq('id', id);
  return { error };
}
