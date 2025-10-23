import { Product } from '@/types';

export const LOCAL_BUSINESSES: Product[] = [
  {
    id: 'local-1',
    name: 'Blue Ginger',
    brand: 'Blue Ginger',
    category: 'Restaurant',
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop',
    alignmentScore: 85,
    moneyFlow: {
      company: 'Blue Ginger',
      shareholders: [
        { name: 'Ming Tsai (Chef/Owner)', percentage: 100, alignment: 'aligned', causes: ['Environmental Sustainability', 'Local Sourcing'] },
      ],
      overallAlignment: 85,
    },
    keyReasons: [
      'Locally owned and operated',
      'Sources from local farms',
      'Supports environmental sustainability'
    ],
    relatedValues: ['environmental-sustainability', 'local-economy'],
    valueAlignments: [
      { valueId: 'environmental-sustainability', position: 1, isSupport: true },
      { valueId: 'local-economy', position: 1, isSupport: true },
    ],
    website: 'https://ming.com/blue-ginger',
  },
  {
    id: 'local-2',
    name: 'Quebrada Baking Company',
    brand: 'Quebrada Baking Company',
    category: 'Bakery & Café',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop',
    alignmentScore: 92,
    moneyFlow: {
      company: 'Quebrada Baking Company',
      shareholders: [
        { name: 'Local Owners', percentage: 100, alignment: 'aligned', causes: ['Fair Trade', 'Organic Ingredients'] },
      ],
      overallAlignment: 92,
    },
    keyReasons: [
      'Uses organic, locally-sourced ingredients',
      'Fair trade coffee',
      'Community-focused business'
    ],
    relatedValues: ['environmental-sustainability', 'fair-trade', 'local-economy'],
    valueAlignments: [
      { valueId: 'environmental-sustainability', position: 1, isSupport: true },
      { valueId: 'fair-trade', position: 1, isSupport: true },
      { valueId: 'local-economy', position: 1, isSupport: true },
    ],
    website: 'https://quebradabakery.com',
  },
  {
    id: 'local-3',
    name: 'Wellesley Books',
    brand: 'Wellesley Books',
    category: 'Bookstore',
    imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop',
    alignmentScore: 88,
    moneyFlow: {
      company: 'Wellesley Books',
      shareholders: [
        { name: 'Independent Owners', percentage: 100, alignment: 'aligned', causes: ['Literacy', 'Local Business'] },
      ],
      overallAlignment: 88,
    },
    keyReasons: [
      'Independent bookstore supporting authors',
      'Hosts community events',
      'Supports local education'
    ],
    relatedValues: ['education', 'local-economy', 'literacy'],
    valueAlignments: [
      { valueId: 'education', position: 1, isSupport: true },
      { valueId: 'local-economy', position: 1, isSupport: true },
      { valueId: 'literacy', position: 1, isSupport: true },
    ],
    website: 'https://wellesleybooks.com',
  },
  {
    id: 'local-4',
    name: 'The Cottage Wellesley',
    brand: 'The Cottage Wellesley',
    category: 'Boutique',
    imageUrl: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&h=400&fit=crop',
    alignmentScore: 79,
    moneyFlow: {
      company: 'The Cottage Wellesley',
      shareholders: [
        { name: 'Local Owner', percentage: 100, alignment: 'aligned', causes: ['Local Business', 'Women-Owned'] },
      ],
      overallAlignment: 79,
    },
    keyReasons: [
      'Women-owned business',
      'Supports local artisans',
      'Community-focused'
    ],
    relatedValues: ['womens-rights', 'local-economy'],
    valueAlignments: [
      { valueId: 'womens-rights', position: 2, isSupport: true },
      { valueId: 'local-economy', position: 1, isSupport: true },
    ],
    website: 'https://thecottagewellesley.com',
  },
  {
    id: 'local-5',
    name: 'Wellesley Natural Market',
    brand: 'Wellesley Natural Market',
    category: 'Health Food Store',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop',
    alignmentScore: 91,
    moneyFlow: {
      company: 'Wellesley Natural Market',
      shareholders: [
        { name: 'Local Owners', percentage: 100, alignment: 'aligned', causes: ['Organic Food', 'Health & Wellness'] },
      ],
      overallAlignment: 91,
    },
    keyReasons: [
      'Specializes in organic and natural products',
      'Supports local farmers',
      'Eco-friendly practices'
    ],
    relatedValues: ['environmental-sustainability', 'health', 'local-economy'],
    valueAlignments: [
      { valueId: 'environmental-sustainability', position: 1, isSupport: true },
      { valueId: 'health', position: 1, isSupport: true },
      { valueId: 'local-economy', position: 1, isSupport: true },
    ],
    website: 'https://wellesleynaturalmarket.com',
  },
  {
    id: 'local-6',
    name: 'Fiorella\'s Cucina',
    brand: 'Fiorella\'s Cucina',
    category: 'Italian Restaurant',
    imageUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=400&fit=crop',
    alignmentScore: 82,
    moneyFlow: {
      company: 'Fiorella\'s Cucina',
      shareholders: [
        { name: 'Family Owners', percentage: 100, alignment: 'aligned', causes: ['Local Business', 'Traditional Cuisine'] },
      ],
      overallAlignment: 82,
    },
    keyReasons: [
      'Family-owned Italian restaurant',
      'Locally sourced ingredients',
      'Community gathering place'
    ],
    relatedValues: ['local-economy', 'family-values'],
    valueAlignments: [
      { valueId: 'local-economy', position: 1, isSupport: true },
      { valueId: 'family-values', position: 2, isSupport: true },
    ],
    website: 'https://fiorellascucina.com',
  },
  {
    id: 'local-7',
    name: 'Linden Store',
    brand: 'Linden Store',
    category: 'Specialty Food Market',
    imageUrl: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=400&h=400&fit=crop',
    alignmentScore: 86,
    moneyFlow: {
      company: 'Linden Store',
      shareholders: [
        { name: 'Local Owners', percentage: 100, alignment: 'aligned', causes: ['Gourmet Food', 'Local Products'] },
      ],
      overallAlignment: 86,
    },
    keyReasons: [
      'Curated selection of local products',
      'Supports regional producers',
      'Personalized service'
    ],
    relatedValues: ['local-economy', 'quality-goods'],
    valueAlignments: [
      { valueId: 'local-economy', position: 1, isSupport: true },
      { valueId: 'quality-goods', position: 1, isSupport: true },
    ],
    website: 'https://lindenstore.com',
  },
  {
    id: 'local-8',
    name: 'The Roche Bros',
    brand: 'The Roche Bros',
    category: 'Grocery Store',
    imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400&h=400&fit=crop',
    alignmentScore: 35,
    moneyFlow: {
      company: 'The Roche Bros',
      shareholders: [
        { name: 'Private Equity Investors', percentage: 60, alignment: 'neutral', causes: [] },
        { name: 'Roche Family', percentage: 40, alignment: 'aligned', causes: ['Local Employment'] },
      ],
      overallAlignment: 35,
    },
    keyReasons: [
      'Regional chain with local presence',
      'Mixed ownership structure',
      'Standard corporate practices'
    ],
    relatedValues: ['local-economy'],
    valueAlignments: [
      { valueId: 'local-economy', position: 6, isSupport: true },
    ],
    website: 'https://rochebros.com',
  },
  {
    id: 'local-9',
    name: 'Babson Coffee',
    brand: 'Babson Coffee',
    category: 'Coffee Shop',
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=400&fit=crop',
    alignmentScore: 89,
    moneyFlow: {
      company: 'Babson Coffee',
      shareholders: [
        { name: 'Local Owner', percentage: 100, alignment: 'aligned', causes: ['Fair Trade Coffee', 'Student Support'] },
      ],
      overallAlignment: 89,
    },
    keyReasons: [
      'Fair trade certified coffee',
      'Student-friendly environment',
      'Community hub'
    ],
    relatedValues: ['fair-trade', 'education', 'local-economy'],
    valueAlignments: [
      { valueId: 'fair-trade', position: 1, isSupport: true },
      { valueId: 'education', position: 2, isSupport: true },
      { valueId: 'local-economy', position: 1, isSupport: true },
    ],
    website: 'https://babsoncoffee.com',
  },
  {
    id: 'local-10',
    name: 'Central Fitness',
    brand: 'Central Fitness',
    category: 'Fitness Center',
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=400&fit=crop',
    alignmentScore: 76,
    moneyFlow: {
      company: 'Central Fitness',
      shareholders: [
        { name: 'Local Owners', percentage: 100, alignment: 'aligned', causes: ['Health & Wellness', 'Community Fitness'] },
      ],
      overallAlignment: 76,
    },
    keyReasons: [
      'Locally owned fitness center',
      'Community wellness focus',
      'Affordable rates'
    ],
    relatedValues: ['health', 'local-economy'],
    valueAlignments: [
      { valueId: 'health', position: 2, isSupport: true },
      { valueId: 'local-economy', position: 1, isSupport: true },
    ],
    website: 'https://centralfitnesswellesley.com',
  },
];

export function searchLocalBusinesses(query: string, userCauses: string[]): Product[] {
  const lowerQuery = query.toLowerCase();
  
  const filtered = LOCAL_BUSINESSES.filter(
    business =>
      business.name.toLowerCase().includes(lowerQuery) ||
      business.brand.toLowerCase().includes(lowerQuery) ||
      business.category.toLowerCase().includes(lowerQuery)
  );

  return filtered.sort((a, b) => {
    const aRelevance = calculateRelevance(a, userCauses);
    const bRelevance = calculateRelevance(b, userCauses);
    return bRelevance - aRelevance;
  });
}

function calculateRelevance(business: Product, userCauses: string[]): number {
  if (userCauses.length === 0) return Math.abs(business.alignmentScore);
  
  const hasMatchingCause = business.relatedValues.some(v => userCauses.includes(v));
  
  if (hasMatchingCause) {
    return Math.abs(business.alignmentScore) + 100;
  }
  
  return Math.abs(business.alignmentScore);
}
