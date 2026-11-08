import { supabase } from '../config/supabase.js';
import { unwrap } from '../utils/supabaseResult.js';

export const VoteModel = {
  // One vote and one veto per participant: casting again moves it.
  async upsert({ sessionId, participantId, suggestionId, kind }) {
    return unwrap(
      await supabase
        .from('votes')
        .upsert(
          { session_id: sessionId, participant_id: participantId, suggestion_id: suggestionId, kind },
          { onConflict: 'session_id,participant_id,kind' }
        )
        .select()
        .single()
    );
  },

  async remove({ sessionId, participantId, kind }) {
    return unwrap(
      await supabase
        .from('votes')
        .delete()
        .eq('session_id', sessionId)
        .eq('participant_id', participantId)
        .eq('kind', kind)
    );
  },

  async listForParticipant(sessionId, participantId) {
    return unwrap(
      await supabase
        .from('votes')
        .select('suggestion_id, kind')
        .eq('session_id', sessionId)
        .eq('participant_id', participantId)
    );
  },
};
