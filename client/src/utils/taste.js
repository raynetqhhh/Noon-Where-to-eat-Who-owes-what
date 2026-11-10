// Profile taste vocabulary. Keep CUISINES in sync with
// server/src/config/constants.js and the profiles_cuisines_check constraint.

export const CUISINES = [
  { id: 'chinese', label: 'Chinese' },
  { id: 'malay', label: 'Malay' },
  { id: 'indian', label: 'Indian' },
  { id: 'peranakan', label: 'Peranakan' },
  { id: 'hawker', label: 'Hawker classics' },
  { id: 'japanese', label: 'Japanese' },
  { id: 'korean', label: 'Korean' },
  { id: 'thai', label: 'Thai' },
  { id: 'vietnamese', label: 'Vietnamese' },
  { id: 'indonesian', label: 'Indonesian' },
  { id: 'western', label: 'Western' },
  { id: 'italian', label: 'Italian' },
  { id: 'mexican', label: 'Mexican' },
  { id: 'middle_eastern', label: 'Middle Eastern' },
  { id: 'cafe', label: 'Café & brunch' },
  { id: 'dessert', label: 'Desserts' },
];

export const cuisineLabel = (id) => CUISINES.find((c) => c.id === id)?.label ?? id;

export const SPICE_LEVELS = [
  { value: 0, label: 'No chilli', note: 'Keep it mild, please' },
  { value: 1, label: 'A little', note: 'Some sambal on the side' },
  { value: 2, label: 'Proper spicy', note: 'Bring on the chilli padi' },
  { value: 3, label: 'Fire', note: 'Mala at maximum' },
];

/** Quick picks for favourite dishes. People can type their own too. */
export const DISH_SUGGESTIONS = [
  'Chicken rice',
  'Laksa',
  'Nasi lemak',
  'Char kway teow',
  'Roti prata',
  'Bak chor mee',
  'Mala xiang guo',
  'Hokkien mee',
  'Satay',
  'Dim sum',
  'Ramen',
  'Sushi',
  'Pho',
  'Bibimbap',
  'Pad thai',
  'Burgers',
  'Pizza',
  'Pasta',
];

export const MAX_FAVOURITE_FOODS = 12;

// Words that show up in a place's free-text cuisine ("Japanese ramen",
// "Nasi padang") for each cuisine someone can like.
const KEYWORDS = {
  chinese: ['chinese', 'cantonese', 'sichuan', 'szechuan', 'hainanese', 'teochew', 'hokkien', 'dim sum', 'mala'],
  malay: ['malay', 'nasi lemak', 'nasi padang'],
  indian: ['indian', 'biryani', 'prata', 'tandoor', 'north indian', 'south indian'],
  peranakan: ['peranakan', 'nyonya'],
  hawker: ['hawker', 'kopitiam', 'food court', 'coffee shop'],
  japanese: ['japanese', 'ramen', 'sushi', 'izakaya', 'donburi', 'udon'],
  korean: ['korean', 'bibimbap', 'tteok'],
  thai: ['thai', 'mookata'],
  vietnamese: ['vietnamese', 'pho', 'banh mi'],
  indonesian: ['indonesian', 'padang', 'ayam penyet'],
  western: ['western', 'burger', 'steak', 'grill', 'american'],
  italian: ['italian', 'pizza', 'pasta'],
  mexican: ['mexican', 'taco', 'burrito'],
  middle_eastern: ['middle eastern', 'turkish', 'lebanese', 'kebab', 'shawarma'],
  cafe: ['cafe', 'café', 'brunch', 'coffee'],
  dessert: ['dessert', 'bingsu', 'ice cream', 'cake'],
};

// Whole words only, so "mala" doesn't match "Malay". Allows a plural "s".
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const PATTERNS = Object.entries(KEYWORDS).map(([id, words]) => [
  id,
  new RegExp(`(?:^|[^\\p{L}])(?:${words.map(escape).join('|')})s?(?![\\p{L}])`, 'iu'),
]);

/** Which cuisines (ids) a place's free-text cuisine and name fit. */
export function cuisinesOf(...texts) {
  const haystack = texts.filter(Boolean).join(' ');
  if (!haystack.trim()) return [];
  return PATTERNS.filter(([, re]) => re.test(haystack)).map(([id]) => id);
}

/** People in the lunch who list one of this place's cuisines as a favourite. */
export function fansOf(place, participants) {
  const ids = cuisinesOf(place.cuisine, place.name);
  if (!ids.length) return [];
  return participants.filter((p) => (p.favouriteCuisines ?? []).some((c) => ids.includes(c)));
}

/** The table's most-liked cuisines, e.g. [{ id: 'japanese', count: 3 }]. */
export function tableFavourites(participants, limit = 4) {
  const counts = new Map();
  for (const p of participants) for (const c of p.favouriteCuisines ?? []) counts.set(c, (counts.get(c) ?? 0) + 1);
  return [...counts.entries()]
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count || cuisineLabel(a.id).localeCompare(cuisineLabel(b.id)))
    .slice(0, limit);
}
