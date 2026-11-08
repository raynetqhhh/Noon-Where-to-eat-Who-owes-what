// Shared vocabularies. Keep in sync with client/src/utils/dietary.js
// and the CHECK constraints in supabase/migrations.

export const DIETARY = ['halal', 'vegetarian', 'vegan', 'no_beef', 'no_pork'];

export const MOODS = ['light', 'spicy', 'comfort', 'healthy', 'quick', 'treat'];

// A suggestion can be tagged with dietary labels ("this place suits halal")
// and moods ("something light").
export const SUGGESTION_TAGS = [...DIETARY, ...MOODS];

export const VOTE_KINDS = ['vote', 'veto'];
