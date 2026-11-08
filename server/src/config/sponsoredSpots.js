// MOCK-UP for the "sponsored spots" business-model demo.
// These eateries are fictional. Sponsored spots are always shown with a clear
// "Sponsored" label and never change how votes are counted.
export const SPONSORED_SPOTS = [
  {
    id: 'kopi-kaya-corner',
    name: 'Kopi & Kaya Corner',
    cuisine: 'Local',
    tags: ['halal', 'light', 'quick'],
    pricePerHeadCents: 650,
    location: 'Level 1, Block 52',
    deal: '10% off for groups of 4+',
  },
  {
    id: 'green-bowl',
    name: 'Green Bowl Salad Bar',
    cuisine: 'Healthy',
    tags: ['halal', 'vegetarian', 'vegan', 'light', 'healthy'],
    pricePerHeadCents: 1190,
    location: 'Food court, stall 8',
    deal: 'Free drink each for groups of 4+',
  },
  {
    id: 'spice-route',
    name: 'Spice Route Biryani',
    cuisine: 'Indian',
    tags: ['halal', 'spicy', 'comfort'],
    pricePerHeadCents: 890,
    location: 'Near MRT exit B',
    deal: 'Free papadum platter for groups of 5+',
  },
];
