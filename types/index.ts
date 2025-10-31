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

export interface Partnership {
  name: string;
  relationship: string;
}

export interface Ownership {
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
  exampleImageUrl?: string; // Optional image of example product
  description?: string; // Brand description
  alignmentScore: number;
  moneyFlow: MoneyFlow;
  keyReasons: string[];
  relatedValues: string[];
  valueAlignments: ValueAlignment[];
  alternatives?: Brand[];
  website?: string; // Used to generate logo URL via logo.dev
  affiliates?: Affiliate[]; // Celebrity/influencer affiliates and their relationships
  partnerships?: Partnership[]; // Business partnerships and collaborations
  ownership?: Ownership[]; // Parent companies, investors, and ownership structure
}

// For backwards compatibility during transition
// TODO: Remove this once all code is migrated
export type Product = Brand;

export interface Charity {
  id: string;
  name: string;
  description: string;
  category: string;
}

export type AccountType = 'individual' | 'business';

export interface BusinessInfo {
  name: string;
  category: string;
  description?: string;
  website?: string;
  logoUrl?: string;
  acceptsValuCodes: boolean;
  valuCodeDiscount?: number; // Percentage discount (e.g., 10 for 10%)
}

export interface ValuCodeCustomer {
  id: string;
  name: string;
  totalSpent: number;
  totalDiscounted: number;
  values: string[]; // Value IDs
  lastPurchaseDate: string;
}

export interface UserProfile {
  accountType?: AccountType; // Default: 'individual'
  causes: Cause[];
  searchHistory: string[];
  promoCode?: string;
  donationAmount?: number;
  selectedCharities?: Charity[];
  businessInfo?: BusinessInfo; // Only for business accounts
  valuCodeCustomers?: ValuCodeCustomer[]; // Only for business accounts
}
