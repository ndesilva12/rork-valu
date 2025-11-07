/**
 * Firebase Data Service (Client-Side)
 *
 * Loads brands and values directly from Firebase Firestore
 * Similar to userService.ts - runs on the client, not backend
 */
import { collection, getDocs, doc, getDoc, query, limit, orderBy } from 'firebase/firestore';
import { db } from '@/firebase';
import { Brand } from '@/types';

export interface ValueData {
  id: string;
  name: string;
  support: string[];
  oppose: string[];
}

/**
 * Fetch all brands from Firebase brands collection
 * This runs client-side, so no timeout issues like backend
 */
export async function getBrandsFromFirebase(): Promise<Brand[]> {
  try {
    console.log('[DataService] Fetching brands from Firebase...');
    const brandsRef = collection(db, 'brands');
    const snapshot = await getDocs(brandsRef);

    const brands: Brand[] = snapshot.docs.map((doc) => {
      const data = doc.data();

      // Data is now in the new array format after migration
      const affiliates = data.affiliates || [];
      const partnerships = data.partnerships || [];
      const ownership = data.ownership || [];
      const ownershipSources = data.ownershipSources || undefined;

      return {
        id: doc.id,
        name: data.name || doc.id,
        category: data.category || 'Uncategorized',
        description: data.description || '',
        website: data.website || undefined,
        exampleImageUrl: data.exampleImageUrl || undefined,

        // Money flow sections (now converted from old format if needed)
        affiliates,
        partnerships,
        ownership,
        ownershipSources,

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

    console.log(`[DataService] ✅ Loaded ${brands.length} brands from Firebase`);
    return brands;
  } catch (error) {
    console.error('[DataService] ❌ Error fetching brands from Firebase:', error);
    throw error;
  }
}

/**
 * Fetch a single brand by ID from Firebase
 */
export async function getBrandById(brandId: string): Promise<Brand | null> {
  try {
    console.log(`[DataService] Fetching single brand by ID: ${brandId}`);
    const brandRef = doc(db, 'brands', brandId);
    const brandDoc = await getDoc(brandRef);

    if (!brandDoc.exists()) {
      console.log(`[DataService] Brand ${brandId} not found in Firebase`);
      return null;
    }

    const data = brandDoc.data();

    // Data is now in the new array format after migration
    const affiliates = data.affiliates || [];
    const partnerships = data.partnerships || [];
    const ownership = data.ownership || [];
    const ownershipSources = data.ownershipSources || undefined;

    return {
      id: brandDoc.id,
      name: data.name || brandDoc.id,
      category: data.category || 'Uncategorized',
      description: data.description || '',
      website: data.website || undefined,
      exampleImageUrl: data.exampleImageUrl || undefined,

      affiliates,
      partnerships,
      ownership,
      ownershipSources,

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
    console.error(`[DataService] Error fetching brand ${brandId}:`, error);
    return null;
  }
}

/**
 * Fetch all values from Firebase values collection
 */
export async function getValuesFromFirebase(): Promise<ValueData[]> {
  try {
    console.log('[DataService] Fetching values from Firebase...');
    const valuesRef = collection(db, 'values');
    const snapshot = await getDocs(valuesRef);

    const values: ValueData[] = snapshot.docs.map((doc) => {
      const data = doc.data();

      // Data is now in the new array format after migration
      return {
        id: doc.id,
        name: data.name || doc.id,
        support: data.aligned || [],
        oppose: data.unaligned || [],
      };
    });

    console.log(`[DataService] ✅ Loaded ${values.length} values from Firebase`);
    return values;
  } catch (error) {
    console.error('[DataService] ❌ Error fetching values from Firebase:', error);
    throw error;
  }
}

/**
 * Get the values matrix for scoring
 * Returns data in format: { valueId: { support: [...brands], oppose: [...brands] } }
 */
export async function getValuesMatrix(): Promise<Record<string, { support: string[]; oppose: string[] }>> {
  try {
    console.log('[DataService] Fetching values matrix from Firebase...');
    const values = await getValuesFromFirebase();

    const matrix: Record<string, { support: string[]; oppose: string[] }> = {};
    values.forEach((value) => {
      matrix[value.id] = {
        support: value.support,
        oppose: value.oppose,
      };
    });

    console.log(`[DataService] ✅ Loaded values matrix with ${Object.keys(matrix).length} values`);
    return matrix;
  } catch (error) {
    console.error('[DataService] ❌ Error fetching values matrix from Firebase:', error);
    throw error;
  }
}
