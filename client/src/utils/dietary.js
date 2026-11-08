// Keep in sync with server/src/config/constants.js

export const DIETARY = [
  { id: 'halal', label: 'Halal', emoji: '🌙' },
  { id: 'vegetarian', label: 'Vegetarian', emoji: '🥦' },
  { id: 'vegan', label: 'Vegan', emoji: '🌱' },
  { id: 'no_beef', label: 'No beef', emoji: '🚫🐄' },
  { id: 'no_pork', label: 'No pork', emoji: '🚫🐖' },
];

export const MOODS = [
  { id: 'light', label: 'Something light', emoji: '🥗' },
  { id: 'spicy', label: 'Spicy', emoji: '🌶️' },
  { id: 'comfort', label: 'Comfort food', emoji: '🍜' },
  { id: 'healthy', label: 'Healthy', emoji: '💪' },
  { id: 'quick', label: 'Quick', emoji: '⚡' },
  { id: 'treat', label: 'Treat day', emoji: '🎉' },
];

const ALL = [...DIETARY, ...MOODS];
export const tagLabel = (id) => ALL.find((t) => t.id === id)?.label ?? id;
export const tagEmoji = (id) => ALL.find((t) => t.id === id)?.emoji ?? '';

/** Vegan food is vegetarian and has no beef/pork; vegetarian has no meat. */
function implied(tags) {
  const set = new Set(tags);
  if (set.has('vegan')) set.add('vegetarian');
  if (set.has('vegetarian')) {
    set.add('no_beef');
    set.add('no_pork');
  }
  return set;
}

/** Needs a place does not cover, e.g. ['halal'] for a place not tagged halal. */
export function unmetNeeds(placeTags, needs) {
  const covered = implied(placeTags);
  return needs.filter((need) => !covered.has(need));
}

/** People whose dietary needs a place does not meet. */
export function peopleNotCovered(placeTags, participants) {
  return participants.filter((p) => unmetNeeds(placeTags, p.dietary ?? []).length > 0);
}
