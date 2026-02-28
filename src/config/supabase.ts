import { createClient } from '@supabase/supabase-js';

/**
 * Supabase configuration for EasySafe.
 *
 * These values are safe to be public. The anon key only grants access
 * through Row Level Security (RLS) policies, so all data access is
 * scoped to the authenticated user. This is a static site deployed
 * to GitHub Pages — no server-side environment variables are available.
 */
const SUPABASE_URL = 'https://cngrtzoyncmxfcakesio.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_nwCsqQ46vrd3HElgzNoP5Q_qPVHB49d';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
