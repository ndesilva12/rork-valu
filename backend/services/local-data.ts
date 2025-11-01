import { Brand } from '@/types';
import { ValueItem } from '@/mocks/causes';

// Import data from loader
let brandsData: any[] = [];
let valuesData: any = {};

// Load data dynamically to support Edge Runtime
async function loadData() {
  // Check if data is already loaded
  const hasData = brandsData.length > 0 && Object.keys(valuesData).length > 0;

  if (!hasData) {
    try {
      console.log('[LocalData] Loading JSON files...');
      // Try to load from JSON files
      const brandsModule = await import('../../data/brands.json');
      const valuesModule = await import('../../data/values.json');
      brandsData = brandsModule.default || brandsModule;
      valuesData = valuesModule.default || valuesModule;
      console.log('[LocalData] Loaded:', brandsData.length, 'brands and', Object.keys(valuesData).length, 'values');
    } catch (error) {
      console.error('[LocalData] Failed to load JSON files:', error);
      // Fallback to empty data
      brandsData = [];
      valuesData = {};
    }
  }
}

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const cache = new Map<string, { data: any; timestamp: number }>();

// Get data from cache or fetch fresh
async function getCachedOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const cached = cache.get(key);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL) {
    console.log(`[LocalData] Cache hit for: ${key}`);
    return cached.data as T;
  }

  console.log(`[LocalData] Cache miss for: ${key}, loading...`);
  const data = await fetchFn();
  cache.set(key, { data, timestamp: now });
  return data;
}

// Fetch causes/values from local JSON
export async function fetchCausesFromSheets(): Promise<ValueItem[]> {
  await loadData(); // Ensure data is loaded
  return getCachedOrFetch('causes', async () => {
    console.log('[LocalData] Loading values from local JSON');

    // Convert values.json format to ValueItem format
    const causes: ValueItem[] = Object.values(valuesData).map((value: any) => ({
      id: value.id,
      name: value.name,
      category: 'values' as any, // Default category
      description: undefined,
    }));

    console.log(`[LocalData] Loaded ${causes.length} values`);
    return causes;
  });
}

// Fetch brands from local JSON
export async function fetchBrandsFromSheets(): Promise<Brand[]> {
  await loadData(); // Ensure data is loaded
  return getCachedOrFetch('brands', async () => {
    console.log('[LocalData] Loading brands from local JSON');

    const brands: Brand[] = brandsData.map((brand: any) => ({
      id: brand.id,
      name: brand.name,
      category: brand.category || 'Uncategorized',
      description: brand.description || '',
      website: brand.website || undefined,
      affiliates: brand.affiliates || [],
      partnerships: brand.partnerships || [],
      ownership: brand.ownership || [],
      ownershipSources: brand.ownershipSources || undefined,
      location: brand.location || undefined,
      latitude: brand.latitude || undefined,
      longitude: brand.longitude || undefined,
      // Default values for backward compatibility
      alignmentScore: 0,
      keyReasons: [],
      relatedValues: [],
      valueAlignments: [],
      moneyFlow: {
        company: brand.name,
        shareholders: [],
        overallAlignment: 0,
      },
    }));

    console.log(`[LocalData] Loaded ${brands.length} brands`);
    return brands;
  });
}

// Fetch local businesses from local JSON (can be same as brands for now)
export async function fetchLocalBusinessesFromSheets(): Promise<Brand[]> {
  // For now, return empty array. Can add local-businesses.json later if needed
  return [];
}

// Get the values matrix for scoring
export async function getValuesMatrix(): Promise<Record<string, { support: string[]; oppose: string[] }>> {
  await loadData(); // Make sure data is loaded!
  console.log('[LocalData] Returning values matrix with', Object.keys(valuesData).length, 'values');
  return valuesData as any;
}

// Search brands with user cause relevance
export function searchBrands(brands: Brand[], query: string, userCauses: string[]): Brand[] {
  const lowerQuery = query.toLowerCase();

  const filtered = brands.filter(
    (brand) =>
      brand.name.toLowerCase().includes(lowerQuery) ||
      brand.category.toLowerCase().includes(lowerQuery)
  );

  return filtered.sort((a, b) => {
    const aRelevance = calculateRelevance(a, userCauses);
    const bRelevance = calculateRelevance(b, userCauses);
    return bRelevance - aRelevance;
  });
}

function calculateRelevance(brand: Brand, userCauses: string[]): number {
  if (userCauses.length === 0) return Math.abs(brand.alignmentScore);

  const hasMatchingCause = brand.relatedValues.some((v) => userCauses.includes(v));

  if (hasMatchingCause) {
    return Math.abs(brand.alignmentScore) + 100;
  }

  return Math.abs(brand.alignmentScore);
}

// Clear cache (useful for testing or manual refresh)
export function clearCache() {
  cache.clear();
  console.log('[LocalData] Cache cleared');
}
