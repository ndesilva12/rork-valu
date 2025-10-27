export type CauseCategory = 
  | 'social_issue'
  | 'religion'
  | 'ideology'
  | 'corporation'
  | 'nation'
  | 'organization'
  | 'person';

export type AlignmentType = 'support' | 'avoid';

export interface Cause {
  id: string;
  name: string;
  category: CauseCategory;
  type: AlignmentType;
  description?: string;
}

export interface Shareholder {
  name: string;
  percentage: number;
  alignment: 'aligned' | 'opposed' | 'neutral';
  causes: string[];
}

export interface MoneyFlow {
  company: string;
  shareholders: Shareholder[];
  overallAlignment: number;
}

export interface Affiliate {
  name: string;
  relationship: string;
}

export interface ValueAlignment {
  valueId: string;
  position: number;
  isSupport: boolean;
}

export interface Brand {
  id: string;
  name: string; // Brand name (e.g., "Apple", "Nike")
  category: string;
  imageUrl: string; // Brand logo
  exampleImageUrl?: string; // Optional image of example product
  description?: string; // Brand description
  alignmentScore: number;
  moneyFlow: MoneyFlow;
  keyReasons: string[];
  relatedValues: string[];
  valueAlignments: ValueAlignment[];
  alternatives?: Brand[];
  website?: string;
  affiliates?: Affiliate[]; // Celebrity/influencer affiliates and their relationships
}

// For backwards compatibility during transition
// TODO: Remove this once all code is migrated
export type Product = Brand;

export interface UserProfile {
  causes: Cause[];
  searchHistory: string[];
}
