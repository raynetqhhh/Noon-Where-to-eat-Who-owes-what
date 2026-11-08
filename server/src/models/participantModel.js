import { supabase } from '../config/supabase.js';
import { unwrap } from '../utils/supabaseResult.js';

// Never select token_hash back out; it is only used for lookups.
const PUBLIC_COLUMNS = 'id, session_id, user_id, crew_member_id, display_name, dietary, is_host, created_at';

export const ParticipantModel = {
  async create({ sessionId, displayName, tokenHash = null, isHost = false, userId = null, crewMemberId = null, dietary = [] }) {
    return unwrap(
      await supabase
        .from('participants')
        .insert({
          session_id: sessionId,
          display_name: displayName,
          token_hash: tokenHash,
          is_host: isHost,
          user_id: userId,
          crew_member_id: crewMemberId,
          dietary,
        })
        .select(PUBLIC_COLUMNS)
        .single()
    );
  },

  async findByTokenHash(sessionId, tokenHash) {
    return unwrap(
      await supabase
        .from('participants')
        .select(PUBLIC_COLUMNS)
        .eq('session_id', sessionId)
        .eq('token_hash', tokenHash)
        .maybeSingle()
    );
  },

  async findByUser(sessionId, userId) {
    return unwrap(
      await supabase
        .from('participants')
        .select(PUBLIC_COLUMNS)
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .maybeSingle()
    );
  },

  async listBySession(sessionId) {
    return unwrap(await supabase.from('participants').select(PUBLIC_COLUMNS).eq('session_id', sessionId));
  },
};
