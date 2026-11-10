// Shared vocabularies. Keep in sync with client/src/utils/dietary.js
// and the CHECK constraints in supabase/migrations.

export const DIETARY = ['halal', 'vegetarian', 'vegan', 'no_beef', 'no_pork'];

export const MOODS = ['light', 'spicy', 'comfort', 'healthy', 'quick', 'treat'];

// A suggestion can be tagged with dietary labels ("this place suits halal")
// and moods ("something light").
export const SUGGESTION_TAGS = [...DIETARY, ...MOODS];

export const VOTE_KINDS = ['vote', 'veto'];

// Profile taste. Keep in sync with client/src/utils/taste.js and the
// profiles_cuisines_check constraint.
export const CUISINES = [
  'chinese', 'malay', 'indian', 'peranakan', 'japanese', 'korean', 'thai',
  'vietnamese', 'indonesian', 'western', 'italian', 'mexican',
  'middle_eastern', 'hawker', 'cafe', 'dessert',
];
export const MAX_FAVOURITE_FOODS = 12;

// Profile photos (Supabase Storage).
export const AVATAR_BUCKET = 'avatars';
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
