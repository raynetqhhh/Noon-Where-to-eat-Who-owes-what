import { supabase } from '../config/supabase.js';
import { unwrap } from '../utils/supabaseResult.js';

// Read-only queries across many sessions: meal history, payments,
// fairness stats, "been there recently".

const PARTICIPATION_SELECT = `
  id, display_name, is_host, created_at,
  session:sessions!participants_session_id_fkey (
    id, code, title, status, created_at, decided_at, decided_suggestion_id, budget_per_head_cents,
    crew:crews!sessions_crew_id_fkey ( id, name ),
    decided:suggestions!sessions_decided_suggestion_id_fkey ( id, name, cuisine, tags, location ),
    bill:bills!bills_session_id_fkey ( id, total_cents )
  ),
  shares:bill_shares!bill_shares_participant_id_fkey ( owed_cents ),
  payments:bill_payers!bill_payers_participant_id_fkey ( amount_cents ),
  votes:votes!votes_participant_id_fkey ( suggestion_id, kind )
`;

const SETTLEMENT_SELECT = `
  id, amount_cents, is_paid, paid_at, created_at, from_participant_id, to_participant_id,
  debtor:participants!settlements_from_participant_id_fkey ( id, display_name, user_id ),
  creditor:participants!settlements_to_participant_id_fkey ( id, display_name, user_id ),
  bill:bills!settlements_bill_id_fkey (
    session:sessions!bills_session_id_fkey ( code, title, created_at )
  )
`;

export const HistoryModel = {
  /** Every lunch this user took part in, newest first. */
  async listParticipations(userId, limit = 200) {
    return unwrap(
      await supabase
        .from('participants')
        .select(PARTICIPATION_SELECT)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)
    );
  },

  /** Transfers where any of these participants pays or gets paid. */
  async listSettlements(participantIds) {
    if (participantIds.length === 0) return [];
    const ids = participantIds.join(',');
    return unwrap(
      await supabase
        .from('settlements')
        .select(SETTLEMENT_SELECT)
        .or(`from_participant_id.in.(${ids}),to_participant_id.in.(${ids})`)
        .order('created_at', { ascending: false })
        .limit(500)
    );
  },

  /** Past votes of these users, for the fairness tie-breaker. */
  async listWinHistory(userIds, excludeSessionId) {
    if (userIds.length === 0) return [];
    return unwrap(
      await supabase
        .from('participants')
        .select(
          `user_id,
           session:sessions!participants_session_id_fkey ( decided_suggestion_id ),
           votes:votes!votes_participant_id_fkey ( suggestion_id, kind )`
        )
        .in('user_id', userIds)
        .neq('session_id', excludeSessionId)
        .limit(1000)
    );
  },

  /** Names of places picked in this crew's (or host's) last few lunches. */
  async listRecentDecidedNames({ crewId, hostUserId, excludeSessionId, limit = 5 }) {
    if (!crewId && !hostUserId) return [];
    let query = supabase
      .from('sessions')
      .select('decided:suggestions!sessions_decided_suggestion_id_fkey ( name )')
      .neq('id', excludeSessionId)
      .not('decided_suggestion_id', 'is', null)
      .order('decided_at', { ascending: false, nullsFirst: false })
      .limit(limit);
    query = crewId ? query.eq('crew_id', crewId) : query.eq('host_user_id', hostUserId);
    const rows = unwrap(await query);
    return rows.map((r) => r.decided?.name).filter(Boolean);
  },
};
