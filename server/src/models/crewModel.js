import { supabase } from '../config/supabase.js';
import { unwrap } from '../utils/supabaseResult.js';

const CREW_SELECT = `
  *,
  members:crew_members!crew_members_crew_id_fkey ( id, display_name, dietary, profile_id, created_at )
`;
const MEMBER_COLUMNS = 'id, crew_id, display_name, dietary, profile_id, created_at';

/** Owners and linked members can see a crew. */
export function canAccessCrew(crew, userId) {
  return crew.owner_id === userId || (crew.members ?? []).some((m) => m.profile_id === userId);
}

export const CrewModel = {
  async listForUser(userId) {
    const [owned, memberships] = await Promise.all([
      supabase.from('crews').select(CREW_SELECT).eq('owner_id', userId),
      supabase.from('crew_members').select('crew_id').eq('profile_id', userId),
    ]);
    const ownedCrews = unwrap(owned);
    const ownedIds = new Set(ownedCrews.map((c) => c.id));
    const otherIds = [...new Set(unwrap(memberships).map((m) => m.crew_id))].filter((id) => !ownedIds.has(id));
    const otherCrews = otherIds.length
      ? unwrap(await supabase.from('crews').select(CREW_SELECT).in('id', otherIds))
      : [];
    return [...ownedCrews, ...otherCrews].sort((a, b) => a.name.localeCompare(b.name));
  },

  async findById(id) {
    return unwrap(await supabase.from('crews').select(CREW_SELECT).eq('id', id).maybeSingle());
  },

  async create({ ownerId, name, budgetPerHeadCents = null, meetingPoint = null }) {
    return unwrap(
      await supabase
        .from('crews')
        .insert({ owner_id: ownerId, name, budget_per_head_cents: budgetPerHeadCents, meeting_point: meetingPoint })
        .select('id')
        .single()
    );
  },

  async update(id, fields) {
    return unwrap(await supabase.from('crews').update(fields).eq('id', id).select('id').single());
  },

  async remove(id) {
    return unwrap(await supabase.from('crews').delete().eq('id', id));
  },

  async findMember(crewId, memberId) {
    return unwrap(
      await supabase.from('crew_members').select(MEMBER_COLUMNS).eq('crew_id', crewId).eq('id', memberId).maybeSingle()
    );
  },

  async addMember({ crewId, profileId = null, displayName, dietary = [] }) {
    return unwrap(
      await supabase
        .from('crew_members')
        .insert({ crew_id: crewId, profile_id: profileId, display_name: displayName, dietary })
        .select(MEMBER_COLUMNS)
        .single()
    );
  },

  async updateMember(crewId, memberId, fields) {
    return unwrap(
      await supabase
        .from('crew_members')
        .update(fields)
        .eq('crew_id', crewId)
        .eq('id', memberId)
        .select(MEMBER_COLUMNS)
        .maybeSingle()
    );
  },

  async removeMember(crewId, memberId) {
    return unwrap(await supabase.from('crew_members').delete().eq('crew_id', crewId).eq('id', memberId));
  },

  /** Decided lunches for these crews, for the fairness board. */
  async listDecidedSessions(crewIds) {
    if (crewIds.length === 0) return [];
    return unwrap(
      await supabase
        .from('sessions')
        .select(
          `id, crew_id, created_at, decided_suggestion_id,
           participants!participants_session_id_fkey ( id, display_name, user_id ),
           votes!votes_session_id_fkey ( participant_id, suggestion_id, kind )`
        )
        .in('crew_id', crewIds)
        .not('decided_suggestion_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(300)
    );
  },
};
