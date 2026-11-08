import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// One shared client for the whole server process.
// Uses the service role key, so all access control lives in our middleware.
export const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
