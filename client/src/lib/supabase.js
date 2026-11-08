import { createClient } from '@supabase/supabase-js';

// The browser only uses Supabase for sign-in and Realtime "something changed"
// pings. All data goes through our Express API.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  url && anonKey && !url.includes('your-project') && !anonKey.startsWith('paste-')
);

export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null;
