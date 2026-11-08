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

// Does Supabase accept our server key? Cached so /api/health stays cheap.
const KEY_CHECK_MS = 60 * 1000;
let keyCheck = { at: 0, result: null };

/** @returns {Promise<{ accepted: boolean, problem?: string }>} never throws */
export async function checkServiceKey() {
  if (keyCheck.result && Date.now() - keyCheck.at < KEY_CHECK_MS) return keyCheck.result;
  let result;
  try {
    const { error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    result = error ? { accepted: false, problem: `${error.status ?? ''} ${error.message}`.trim() } : { accepted: true };
  } catch (err) {
    result = { accepted: false, problem: err.message };
  }
  keyCheck = { at: Date.now(), result };
  return result;
}
