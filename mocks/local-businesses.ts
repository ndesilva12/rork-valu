import { Product } from '@/types';

export const LOCAL_BUSINESSES: Product[] = [
  {
    id: 'local-1',
    name: 'Blue Ginger',
    brand: 'Blue Ginger',
    category: 'Restaurant',
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop',
    productImageUrl: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=800',
    productDescription: 'Asian Fusion Tasting Menu - Innovative dishes blending Eastern and Western flavors',
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
    relatedValues: ['environmentalism', 'entrepreneurship', 'personal-health', 'individual-responsibility'],
    valueAlignments: [
      { valueId: 'environmentalism', position: 1, isSupport: true },
      { valueId: 'entrepreneurship', position: 2, isSupport: true },
      { valueId: 'personal-health', position: 2, isSupport: true },
      { valueId: 'individual-responsibility', position: 3, isSupport: true },
      { valueId: 'climate-change', position: 2, isSupport: true },
    ],
    website: 'https://ming.com/blue-ginger',
  },
  {
    id: 'local-2',
    name: 'Quebrada Baking Company',
    brand: 'Quebrada Baking Company',
    category: 'Bakery & Café',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop',
    productImageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800',
    productDescription: 'Artisan Sourdough Bread - Made with organic flour and natural starter',
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
    relatedValues: ['environmentalism', 'entrepreneurship', 'personal-health', 'veganism'],
    valueAlignments: [
      { valueId: 'environmentalism', position: 1, isSupport: true },
      { valueId: 'entrepreneurship', position: 1, isSupport: true },
      { valueId: 'personal-health', position: 1, isSupport: true },
      { valueId: 'veganism', position: 3, isSupport: true },
      { valueId: 'climate-change', position: 2, isSupport: true },
      { valueId: 'individual-responsibility', position: 2, isSupport: true },
    ],
    website: 'https://quebradabakery.com',
  },
  {
    id: 'local-3',
    name: 'Wellesley Books',
    brand: 'Wellesley Books',
    category: 'Bookstore',
    imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop',
    productImageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800',
    productDescription: 'Book Club Membership - Monthly curated selections with author discussions',
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
    relatedValues: ['entrepreneurship', 'freedom-of-speech', 'privacy', 'individual-responsibility'],
    valueAlignments: [
      { valueId: 'entrepreneurship', position: 1, isSupport: true },
      { valueId: 'freedom-of-speech', position: 2, isSupport: true },
      { valueId: 'privacy', position: 2, isSupport: true },
      { valueId: 'individual-responsibility', position: 2, isSupport: true },
      { valueId: 'home-schooling', position: 3, isSupport: true },
      { valueId: 'school-choice', position: 3, isSupport: true },
    ],
    website: 'https://wellesleybooks.com',
  },
  {
    id: 'local-4',
    name: 'The Cottage Wellesley',
    brand: 'The Cottage Wellesley',
    category: 'Boutique',
    imageUrl: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&h=400&fit=crop',
    productImageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800',
    productDescription: 'Handcrafted Jewelry Collection - Unique pieces from local artisans',
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
    relatedValues: ['feminism', 'entrepreneurship', 'individual-responsibility', 'body-positivity'],
    valueAlignments: [
      { valueId: 'feminism', position: 2, isSupport: true },
      { valueId: 'entrepreneurship', position: 1, isSupport: true },
      { valueId: 'individual-responsibility', position: 2, isSupport: true },
      { valueId: 'body-positivity', position: 2, isSupport: true },
      { valueId: 'privacy', position: 3, isSupport: true },
    ],
    website: 'https://thecottagewellesley.com',
  },
  {
    id: 'local-5',
    name: 'Wellesley Natural Market',
    brand: 'Wellesley Natural Market',
    category: 'Health Food Store',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop',
    productImageUrl: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800',
    productDescription: 'Organic Produce Box - Weekly delivery of local farm-fresh vegetables',
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
    relatedValues: ['environmentalism', 'personal-health', 'entrepreneurship', 'veganism', 'fitness'],
    valueAlignments: [
      { valueId: 'environmentalism', position: 1, isSupport: true },
      { valueId: 'personal-health', position: 1, isSupport: true },
      { valueId: 'entrepreneurship', position: 2, isSupport: true },
      { valueId: 'veganism', position: 2, isSupport: true },
      { valueId: 'fitness', position: 2, isSupport: true },
      { valueId: 'climate-change', position: 2, isSupport: true },
      { valueId: 'individual-responsibility', position: 2, isSupport: true },
    ],
    website: 'https://wellesleynaturalmarket.com',
  },
  {
    id: 'local-6',
    name: 'Fiorella\'s Cucina',
    brand: 'Fiorella\'s Cucina',
    category: 'Italian Restaurant',
    imageUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=400&fit=crop',
    productImageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800',
    productDescription: 'House-Made Pasta Dinner - Fresh pasta with seasonal ingredients',
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
    relatedValues: ['entrepreneurship', 'individual-responsibility', 'personal-health'],
    valueAlignments: [
      { valueId: 'entrepreneurship', position: 1, isSupport: true },
      { valueId: 'individual-responsibility', position: 3, isSupport: true },
      { valueId: 'personal-health', position: 3, isSupport: true },
      { valueId: 'environmentalism', position: 3, isSupport: true },
    ],
    website: 'https://fiorellascucina.com',
  },
  {
    id: 'local-7',
    name: 'Linden Store',
    brand: 'Linden Store',
    category: 'Specialty Food Market',
    imageUrl: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=400&h=400&fit=crop',
    productImageUrl: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=800',
    productDescription: 'Gourmet Gift Basket - Curated selection of local artisanal products',
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
    relatedValues: ['entrepreneurship', 'environmentalism', 'personal-health', 'individual-responsibility'],
    valueAlignments: [
      { valueId: 'entrepreneurship', position: 1, isSupport: true },
      { valueId: 'environmentalism', position: 2, isSupport: true },
      { valueId: 'personal-health', position: 2, isSupport: true },
      { valueId: 'individual-responsibility', position: 2, isSupport: true },
    ],
    website: 'https://lindenstore.com',
  },
  {
    id: 'local-8',
    name: 'Babson Coffee',
    brand: 'Babson Coffee',
    category: 'Coffee Shop',
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=400&fit=crop',
    productImageUrl: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800',
    productDescription: 'Fair Trade Cold Brew - Ethically sourced, small-batch roasted',
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
    relatedValues: ['entrepreneurship', 'environmentalism', 'personal-health', 'remote-work'],
    valueAlignments: [
      { valueId: 'entrepreneurship', position: 1, isSupport: true },
      { valueId: 'environmentalism', position: 2, isSupport: true },
      { valueId: 'personal-health', position: 3, isSupport: true },
      { valueId: 'remote-work', position: 2, isSupport: true },
      { valueId: 'climate-change', position: 2, isSupport: true },
      { valueId: 'individual-responsibility', position: 2, isSupport: true },
    ],
    website: 'https://babsoncoffee.com',
  },
  {
    id: 'local-9',
    name: 'Central Fitness',
    brand: 'Central Fitness',
    category: 'Fitness Center',
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=400&fit=crop',
    productImageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
    productDescription: 'Personal Training Package - 12 sessions with certified trainers',
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
    relatedValues: ['fitness', 'personal-health', 'entrepreneurship', 'mental-health', 'individual-responsibility'],
    valueAlignments: [
      { valueId: 'fitness', position: 1, isSupport: true },
      { valueId: 'personal-health', position: 2, isSupport: true },
      { valueId: 'entrepreneurship', position: 2, isSupport: true },
      { valueId: 'mental-health', position: 2, isSupport: true },
      { valueId: 'individual-responsibility', position: 1, isSupport: true },
      { valueId: 'body-positivity', position: 3, isSupport: true },
    ],
    website: 'https://centralfitnesswellesley.com',
  },
  {
    id: 'local-10',
    name: 'Slice of Wellesley',
    brand: 'Slice of Wellesley',
    category: 'Pizza Shop',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=400&fit=crop',
    productImageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    productDescription: 'Wood-Fired Margherita Pizza - Classic recipe with fresh mozzarella',
    alignmentScore: 83,
    moneyFlow: {
      company: 'Slice of Wellesley',
      shareholders: [
        { name: 'Family Owners', percentage: 100, alignment: 'aligned', causes: ['Local Business', 'Family Values'] },
      ],
      overallAlignment: 83,
    },
    keyReasons: [
      'Family-owned pizzeria',
      'Uses local dairy and produce',
      'Community favorite'
    ],
    relatedValues: ['entrepreneurship', 'individual-responsibility', 'personal-health'],
    valueAlignments: [
      { valueId: 'entrepreneurship', position: 1, isSupport: true },
      { valueId: 'individual-responsibility', position: 2, isSupport: true },
      { valueId: 'personal-health', position: 3, isSupport: true },
      { valueId: 'environmentalism', position: 4, isSupport: true },
    ],
    website: 'https://sliceofwellesley.com',
  },
  {
    id: 'local-11',
    name: 'Stevens & Associates Law',
    brand: 'Stevens & Associates Law',
    category: 'Law Firm',
    imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=400&fit=crop',
    productImageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800',
    productDescription: 'Legal Consultation - Expert advice on business and family law',
    alignmentScore: 74,
    moneyFlow: {
      company: 'Stevens & Associates Law',
      shareholders: [
        { name: 'Partners', percentage: 100, alignment: 'aligned', causes: ['Professional Services', 'Community Support'] },
      ],
      overallAlignment: 74,
    },
    keyReasons: [
      'Locally practicing attorneys',
      'Community-focused legal services',
      'Pro bono work for local families'
    ],
    relatedValues: ['individual-responsibility', 'entrepreneurship', 'privacy', 'freedom-of-speech'],
    valueAlignments: [
      { valueId: 'individual-responsibility', position: 1, isSupport: true },
      { valueId: 'entrepreneurship', position: 3, isSupport: true },
      { valueId: 'privacy', position: 2, isSupport: true },
      { valueId: 'freedom-of-speech', position: 2, isSupport: true },
      { valueId: 'pro-life', position: 4, isSupport: true },
    ],
    website: 'https://stevenslaw.com',
  },
  {
    id: 'local-12',
    name: 'Precision Auto Repair',
    brand: 'Precision Auto Repair',
    category: 'Auto Mechanic',
    imageUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=400&fit=crop',
    productImageUrl: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=800',
    productDescription: 'Complete Auto Service - Oil change, inspections, and repairs',
    alignmentScore: 78,
    moneyFlow: {
      company: 'Precision Auto Repair',
      shareholders: [
        { name: 'Owner Operator', percentage: 100, alignment: 'aligned', causes: ['Small Business', 'Quality Service'] },
      ],
      overallAlignment: 78,
    },
    keyReasons: [
      'Honest, transparent pricing',
      'Family-owned for 25 years',
      'Supports local suppliers'
    ],
    relatedValues: ['entrepreneurship', 'individual-responsibility', 'privacy'],
    valueAlignments: [
      { valueId: 'entrepreneurship', position: 1, isSupport: true },
      { valueId: 'individual-responsibility', position: 2, isSupport: true },
      { valueId: 'privacy', position: 3, isSupport: true },
      { valueId: 'personal-health', position: 4, isSupport: true },
    ],
    website: 'https://precisionautowellesley.com',
  },
  {
    id: 'local-13',
    name: 'The Daily Grind Cafe',
    brand: 'The Daily Grind Cafe',
    category: 'Café',
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=400&fit=crop',
    productImageUrl: 'https://images.unsplash.com/photo-1514481538271-cf9f99627ab4?w=800',
    productDescription: 'Breakfast Sandwich & Coffee Combo - Fresh-baked croissant with local eggs',
    alignmentScore: 81,
    moneyFlow: {
      company: 'The Daily Grind Cafe',
      shareholders: [
        { name: 'Local Owner', percentage: 100, alignment: 'aligned', causes: ['Community Hub', 'Local Sourcing'] },
      ],
      overallAlignment: 81,
    },
    keyReasons: [
      'Neighborhood gathering spot',
      'Sources from local bakeries',
      'Supports community events'
    ],
    relatedValues: ['entrepreneurship', 'environmentalism', 'personal-health', 'remote-work'],
    valueAlignments: [
      { valueId: 'entrepreneurship', position: 1, isSupport: true },
      { valueId: 'environmentalism', position: 3, isSupport: true },
      { valueId: 'personal-health', position: 3, isSupport: true },
      { valueId: 'remote-work', position: 2, isSupport: true },
      { valueId: 'individual-responsibility', position: 2, isSupport: true },
    ],
    website: 'https://dailygrindwellesley.com',
  },
  {
    id: 'local-14',
    name: 'Corner Convenience Store',
    brand: 'Corner Convenience Store',
    category: 'Convenience Store',
    imageUrl: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=400&fit=crop',
    productImageUrl: 'https://images.unsplash.com/photo-1586999768626-37937feb49eb?w=800',
    productDescription: 'Quick Essentials - Groceries, snacks, and household items',
    alignmentScore: 72,
    moneyFlow: {
      company: 'Corner Convenience Store',
      shareholders: [
        { name: 'Family Owners', percentage: 100, alignment: 'aligned', causes: ['Local Service', 'Community Access'] },
      ],
      overallAlignment: 72,
    },
    keyReasons: [
      'Family-owned for three generations',
      'Convenient local shopping',
      'Employs neighborhood residents'
    ],
    relatedValues: ['entrepreneurship', 'individual-responsibility', 'privacy'],
    valueAlignments: [
      { valueId: 'entrepreneurship', position: 2, isSupport: true },
      { valueId: 'individual-responsibility', position: 2, isSupport: true },
      { valueId: 'privacy', position: 3, isSupport: true },
      { valueId: 'personal-health', position: 4, isSupport: true },
    ],
    website: 'https://cornerstorewellesley.com',
  },
  {
    id: 'local-15',
    name: 'The Roche Bros',
    brand: 'The Roche Bros',
    category: 'Grocery Store',
    imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400&h=400&fit=crop',
    productImageUrl: 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=800',
    productDescription: 'Weekly Grocery Essentials - Full-service supermarket',
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
    relatedValues: ['entrepreneurship', 'government-spending'],
    valueAlignments: [
      { valueId: 'entrepreneurship', position: 7, isSupport: false },
      { valueId: 'individual-responsibility', position: 8, isSupport: false },
      { valueId: 'environmentalism', position: 7, isSupport: false },
      { valueId: 'government-spending', position: 6, isSupport: true },
    ],
    website: 'https://rochebros.com',
  },
  {
    id: 'local-16',
    name: 'Corporate Java Express',
    brand: 'Corporate Java Express',
    category: 'Coffee Chain',
    imageUrl: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400&h=400&fit=crop',
    productImageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
    productDescription: 'Chain Coffee Drinks - Standardized menu items',
    alignmentScore: 28,
    moneyFlow: {
      company: 'Corporate Java Express',
      shareholders: [
        { name: 'National Corporation', percentage: 90, alignment: 'opposed', causes: ['Corporate Consolidation'] },
        { name: 'Franchise Owner', percentage: 10, alignment: 'neutral', causes: [] },
      ],
      overallAlignment: 28,
    },
    keyReasons: [
      'National chain presence',
      'Limited local sourcing',
      'Corporate ownership model'
    ],
    relatedValues: ['entrepreneurship', 'environmentalism', 'privacy'],
    valueAlignments: [
      { valueId: 'entrepreneurship', position: 8, isSupport: false },
      { valueId: 'environmentalism', position: 8, isSupport: false },
      { valueId: 'individual-responsibility', position: 9, isSupport: false },
      { valueId: 'privacy', position: 7, isSupport: false },
      { valueId: 'climate-change', position: 8, isSupport: false },
    ],
    website: 'https://corporatejava.com',
  },
  {
    id: 'local-17',
    name: 'MegaMart Discount',
    brand: 'MegaMart Discount',
    category: 'Discount Store',
    imageUrl: 'https://images.unsplash.com/photo-1601599561213-832382fd07ba?w=400&h=400&fit=crop',
    productImageUrl: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=800',
    productDescription: 'Bulk Discount Items - Mass-produced goods at low prices',
    alignmentScore: 22,
    moneyFlow: {
      company: 'MegaMart Discount',
      shareholders: [
        { name: 'Large Corporation', percentage: 100, alignment: 'opposed', causes: ['Low Wages', 'Anti-Local'] },
      ],
      overallAlignment: 22,
    },
    keyReasons: [
      'Large corporate chain',
      'Displaces local businesses',
      'Low wage structure'
    ],
    relatedValues: ['entrepreneurship', 'environmentalism', 'individual-responsibility', 'privacy'],
    valueAlignments: [
      { valueId: 'entrepreneurship', position: 9, isSupport: false },
      { valueId: 'environmentalism', position: 7, isSupport: false },
      { valueId: 'individual-responsibility', position: 8, isSupport: false },
      { valueId: 'privacy', position: 8, isSupport: false },
      { valueId: 'climate-change', position: 9, isSupport: false },
      { valueId: 'personal-health', position: 7, isSupport: false },
    ],
    website: 'https://megamart.com',
  },
  {
    id: 'local-18',
    name: 'QuickLube Auto Center',
    brand: 'QuickLube Auto Center',
    category: 'Auto Service Chain',
    imageUrl: 'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=400&h=400&fit=crop',
    productImageUrl: 'https://images.unsplash.com/photo-1632823469529-281c2f974b80?w=800',
    productDescription: 'Express Oil Change - Quick service, corporate standards',
    alignmentScore: 31,
    moneyFlow: {
      company: 'QuickLube Auto Center',
      shareholders: [
        { name: 'National Franchise Corp', percentage: 85, alignment: 'opposed', causes: [] },
        { name: 'Local Franchisee', percentage: 15, alignment: 'neutral', causes: [] },
      ],
      overallAlignment: 31,
    },
    keyReasons: [
      'Corporate franchise model',
      'Limited local investment',
      'Standardized service'
    ],
    relatedValues: ['entrepreneurship', 'individual-responsibility', 'environmentalism'],
    valueAlignments: [
      { valueId: 'entrepreneurship', position: 7, isSupport: false },
      { valueId: 'individual-responsibility', position: 7, isSupport: false },
      { valueId: 'environmentalism', position: 8, isSupport: false },
      { valueId: 'privacy', position: 6, isSupport: false },
    ],
    website: 'https://quicklube.com',
  },
  {
    id: 'local-19',
    name: 'Corporate Legal Services',
    brand: 'Corporate Legal Services',
    category: 'Law Firm Chain',
    imageUrl: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=400&h=400&fit=crop',
    productImageUrl: 'https://images.unsplash.com/photo-1436450412740-6b988f486c6b?w=800',
    productDescription: 'Template Legal Services - Low-cost, standardized legal documents',
    alignmentScore: 26,
    moneyFlow: {
      company: 'Corporate Legal Services',
      shareholders: [
        { name: 'Large Legal Corp', percentage: 100, alignment: 'opposed', causes: ['Corporate Consolidation'] },
      ],
      overallAlignment: 26,
    },
    keyReasons: [
      'Corporate legal chain',
      'Minimal personalized service',
      'Displaces local attorneys'
    ],
    relatedValues: ['entrepreneurship', 'individual-responsibility', 'privacy', 'freedom-of-speech'],
    valueAlignments: [
      { valueId: 'entrepreneurship', position: 8, isSupport: false },
      { valueId: 'individual-responsibility', position: 7, isSupport: false },
      { valueId: 'privacy', position: 8, isSupport: false },
      { valueId: 'freedom-of-speech', position: 7, isSupport: false },
    ],
    website: 'https://corporatelegal.com',
  },
  {
    id: 'local-20',
    name: 'FastFit Gym',
    brand: 'FastFit Gym',
    category: 'Fitness Chain',
    imageUrl: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400&h=400&fit=crop',
    productImageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
    productDescription: 'Budget Gym Membership - Basic equipment, minimal service',
    alignmentScore: 24,
    moneyFlow: {
      company: 'FastFit Gym',
      shareholders: [
        { name: 'Investment Fund', percentage: 100, alignment: 'opposed', causes: ['Corporate Fitness'] },
      ],
      overallAlignment: 24,
    },
    keyReasons: [
      'Corporate franchise gym',
      'Low-cost, high-volume model',
      'Minimal community engagement'
    ],
    relatedValues: ['fitness', 'entrepreneurship', 'personal-health', 'mental-health', 'individual-responsibility'],
    valueAlignments: [
      { valueId: 'fitness', position: 8, isSupport: false },
      { valueId: 'entrepreneurship', position: 9, isSupport: false },
      { valueId: 'personal-health', position: 8, isSupport: false },
      { valueId: 'mental-health', position: 9, isSupport: false },
      { valueId: 'individual-responsibility', position: 9, isSupport: false },
      { valueId: 'privacy', position: 7, isSupport: false },
    ],
    website: 'https://fastfitgym.com',
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
