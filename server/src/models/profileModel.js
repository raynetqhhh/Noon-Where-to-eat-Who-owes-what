import { supabase } from '../config/supabase.js';
import { unwrap } from '../utils/supabaseResult.js';

const COLUMNS = 'id, display_name, dietary, allergies, paynow_id, created_at';

export const ProfileModel = {
  async findById(id) {
    return unwrap(await supabase.from('profiles').select(COLUMNS).eq('id', id).maybeSingle());
  },

  async create(fields) {
    return unwrap(await supabase.from('profiles').insert(fields).select(COLUMNS).single());
  },

  async update(id, fields) {
    return unwrap(await supabase.from('profiles').update(fields).eq('id', id).select(COLUMNS).single());
  },
};
