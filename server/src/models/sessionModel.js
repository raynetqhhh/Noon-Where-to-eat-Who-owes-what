import { supabase } from '../config/supabase.js';
import { unwrap } from '../utils/supabaseResult.js';

// Explicit FK hints (table!constraint) keep PostgREST embeds unambiguous,
// since several tables point at both sessions and participants.
const DETAILS_SELECT = `
  *,
  participants!participants_session_id_fkey (
    id, user_id, display_name, dietary, is_host, created_at,
    profile:profiles!participants_user_id_fkey ( paynow_id, avatar_url, favourite_cuisines, favourite_foods, spice_level )
  ),
  suggestions!suggestions_session_id_fkey (
    id, name, cuisine, tags, price_per_head_cents, location, url, is_sponsored, deal,
    suggested_by, created_at,
    votes!votes_suggestion_id_fkey ( participant_id, kind )
  ),
  crew:crews!sessions_crew_id_fkey (
    id, name, meeting_point,
    members:crew_members!crew_members_crew_id_fkey ( id, display_name, dietary, profile_id )
  )
`;

export const SessionModel = {
  async create({ code, title, expiresAt, crewId = null, hostUserId = null, budgetPerHeadCents = null, votingDeadline = null }) {
    return unwrap(
      await supabase
        .from('sessions')
        .insert({
          code,
          title,
          expires_at: expiresAt,
          crew_id: crewId,
          host_user_id: hostUserId,
          budget_per_head_cents: budgetPerHeadCents,
          voting_deadline: votingDeadline,
        })
        .select()
        .single()
    );
  },

  async findByCode(code) {
    return unwrap(await supabase.from('sessions').select('*').eq('code', code).maybeSingle());
  },

  // Session + participants + suggestions + votes + crew in a single round trip.
  async findDetailsById(id) {
    return unwrap(await supabase.from('sessions').select(DETAILS_SELECT).eq('id', id).single());
  },

  async update(id, fields) {
    return unwrap(await supabase.from('sessions').update(fields).eq('id', id).select().single());
  },

  async remove(id) {
    return unwrap(await supabase.from('sessions').delete().eq('id', id));
  },
};
