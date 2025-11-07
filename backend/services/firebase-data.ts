/**
 * Firebase Data Service
 *
 * Fetches brands and values from Firebase Firestore collections
 * Replaces local-data.ts to read from Firebase instead of JSON files
 */
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Brand } from '@/types';
import { ValueItem } from '@/mocks/causes';

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const cache = new Map<string, { data: any; timestamp: number }>();

/**
 * Get data from cache or fetch fresh from Firebase
 */
async function getCachedOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const cached = cache.get(key);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL) {
    console.log(`[FirebaseData] Cache hit for: ${key}`);
    return cached.data as T;
  }

  console.log(`[FirebaseData] Cache miss for: ${key}, fetching from Firebase...`);
  const data = await fetchFn();
  cache.set(key, { data, timestamp: now });
  return data;
}

/**
 * Fetch all brands from Firebase brands collection
 */
export async function fetchBrandsFromFirebase(): Promise<Brand[]> {
  return getCachedOrFetch('brands', async () => {
    try {
      console.log('[FirebaseData] Fetching brands from Firebase...');
      const brandsRef = collection(db, 'brands');
      const snapshot = await getDocs(brandsRef);

      const brands: Brand[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || doc.id,
          category: data.category || 'Uncategorized',
          description: data.description || '',
          website: data.website || undefined,
          exampleImageUrl: data.exampleImageUrl || undefined,

          // Money flow sections
          affiliates: data.affiliates || [],
          partnerships: data.partnerships || [],
          ownership: data.ownership || [],
          ownershipSources: data.ownershipSources || undefined,

          // Location data
          location: data.location || undefined,
          latitude: data.latitude || undefined,
          longitude: data.longitude || undefined,

          // Default values for backward compatibility
          alignmentScore: data.alignmentScore || 0,
          keyReasons: data.keyReasons || [],
          relatedValues: data.relatedValues || [],
          valueAlignments: data.valueAlignments || [],
          moneyFlow: data.moneyFlow || {
            company: data.name || doc.id,
            shareholders: [],
            overallAlignment: 0,
          },
        } as Brand;
      });

      console.log(`[FirebaseData] Loaded ${brands.length} brands from Firebase`);
      return brands;
    } catch (error) {
      console.error('[FirebaseData] Error fetching brands from Firebase:', error);
      throw new Error('Failed to fetch brands from Firebase');
    }
  });
}

/**
 * Fetch a single brand by ID from Firebase
 */
export async function fetchBrandById(brandId: string): Promise<Brand | null> {
  try {
    const brandRef = doc(db, 'brands', brandId);
    const brandDoc = await getDoc(brandRef);

    if (!brandDoc.exists()) {
      return null;
    }

    const data = brandDoc.data();
    return {
      id: brandDoc.id,
      name: data.name || brandDoc.id,
      category: data.category || 'Uncategorized',
      description: data.description || '',
      website: data.website || undefined,
      exampleImageUrl: data.exampleImageUrl || undefined,

      affiliates: data.affiliates || [],
      partnerships: data.partnerships || [],
      ownership: data.ownership || [],
      ownershipSources: data.ownershipSources || undefined,

      location: data.location || undefined,
      latitude: data.latitude || undefined,
      longitude: data.longitude || undefined,

      alignmentScore: data.alignmentScore || 0,
      keyReasons: data.keyReasons || [],
      relatedValues: data.relatedValues || [],
      valueAlignments: data.valueAlignments || [],
      moneyFlow: data.moneyFlow || {
        company: data.name || brandDoc.id,
        shareholders: [],
        overallAlignment: 0,
      },
    } as Brand;
  } catch (error) {
    console.error(`[FirebaseData] Error fetching brand ${brandId}:`, error);
    return null;
  }
}

/**
 * Fetch all values/causes from Firebase values collection
 */
export async function fetchValuesFromFirebase(): Promise<ValueItem[]> {
  return getCachedOrFetch('values', async () => {
    try {
      console.log('[FirebaseData] Fetching values from Firebase...');
      const valuesRef = collection(db, 'values');
      const snapshot = await getDocs(valuesRef);

      const values: ValueItem[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || doc.id,
          category: data.category || 'values',
          description: data.description || undefined,
        } as ValueItem;
      });

      console.log(`[FirebaseData] Loaded ${values.length} values from Firebase`);
      return values;
    } catch (error) {
      console.error('[FirebaseData] Error fetching values from Firebase:', error);
      throw new Error('Failed to fetch values from Firebase');
    }
  });
}

/**
 * Get the values matrix for scoring from Firebase
 * Returns data in format: { valueId: { support: [...brands], oppose: [...brands] } }
 */
export async function getValuesMatrixFromFirebase(): Promise<Record<string, { support: string[]; oppose: string[] }>> {
  return getCachedOrFetch('valuesMatrix', async () => {
    try {
      console.log('[FirebaseData] Fetching values matrix from Firebase...');
      const valuesRef = collection(db, 'values');
      const snapshot = await getDocs(valuesRef);

      const matrix: Record<string, { support: string[]; oppose: string[] }> = {};

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        matrix[doc.id] = {
          support: data.support || [],
          oppose: data.oppose || [],
        };
      });

      console.log(`[FirebaseData] Loaded values matrix with ${Object.keys(matrix).length} values`);
      return matrix;
    } catch (error) {
      console.error('[FirebaseData] Error fetching values matrix from Firebase:', error);
      throw new Error('Failed to fetch values matrix from Firebase');
    }
  });
}

/**
 * Search brands with user cause relevance
 */
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

/**
 * Fetch local businesses from Firebase users collection
 * Returns user accounts with accountType: 'business' as Brand objects
 */
export async function fetchLocalBusinessesFromFirebase(): Promise<Brand[]> {
  return getCachedOrFetch('localBusinesses', async () => {
    try {
      console.log('[FirebaseData] Fetching local businesses from Firebase...');
      // This would query users with accountType: 'business'
      // For now, return empty array - this can be enhanced later
      // The businessService.ts already handles this functionality
      return [];
    } catch (error) {
      console.error('[FirebaseData] Error fetching local businesses from Firebase:', error);
      return [];
    }
  });
}

/**
 * Clear cache (useful for testing or manual refresh)
 */
export function clearCache() {
  cache.clear();
  console.log('[FirebaseData] Cache cleared');
}
