import { supabase } from '../config/supabase.js';
import { unwrap } from '../utils/supabaseResult.js';

export const SuggestionModel = {
  async create({
    sessionId,
    suggestedBy,
    name,
    cuisine = null,
    tags = [],
    pricePerHeadCents = null,
    location = null,
    url = null,
    isSponsored = false,
    deal = null,
  }) {
    return unwrap(
      await supabase
        .from('suggestions')
        .insert({
          session_id: sessionId,
          suggested_by: suggestedBy,
          name,
          cuisine,
          tags,
          price_per_head_cents: pricePerHeadCents,
          location,
          url,
          is_sponsored: isSponsored,
          deal,
        })
        .select()
        .single()
    );
  },

  // Scoped by session so one session can never touch another's suggestions.
  async findInSession(sessionId, id) {
    return unwrap(
      await supabase.from('suggestions').select('*').eq('session_id', sessionId).eq('id', id).maybeSingle()
    );
  },

  async countInSession(sessionId) {
    const { count, error } = await supabase
      .from('suggestions')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId);
    unwrap({ data: null, error });
    return count ?? 0;
  },

  async remove(sessionId, id) {
    return unwrap(await supabase.from('suggestions').delete().eq('session_id', sessionId).eq('id', id));
  },
};
