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

      // Convert old format (affiliate1, $affiliate1, etc.) to new format (affiliates array)
      const convertToArray = (fieldPrefix: string, dollarPrefix?: string) => {
        const result: { name: string; relationship: string }[] = [];
        for (let i = 1; i <= 20; i++) {
          const nameField = `${fieldPrefix}${i}`;
          const relationshipField = dollarPrefix ? `${dollarPrefix}${i}` : null;

          if (data[nameField]) {
            result.push({
              name: data[nameField],
              relationship: relationshipField && data[relationshipField] ? data[relationshipField] : ''
            });
          }
        }
        return result;
      };

      // Try new format first, fall back to old format
      let affiliates = data.affiliates || [];
      let partnerships = data.partnerships || [];
      let ownership = data.ownership || [];

      // If new format is empty, try converting from old format
      if (affiliates.length === 0) {
        const converted = convertToArray('affiliate', '$affiliate');
        if (converted.length > 0) {
          affiliates = converted;
          console.log(`[DataService] Converted ${converted.length} affiliates for ${data.name || doc.id}`);
        }
      }

      if (partnerships.length === 0) {
        const converted = convertToArray('Partnership');
        if (converted.length > 0) {
          partnerships = converted;
          console.log(`[DataService] Converted ${converted.length} partnerships for ${data.name || doc.id}`);
        }
      }

      if (ownership.length === 0) {
        const converted = convertToArray('ownership');
        if (converted.length > 0) {
          ownership = converted;
          console.log(`[DataService] Converted ${converted.length} ownership entries for ${data.name || doc.id}`);
        }
      }

      // Get ownership sources from either new or old format
      const ownershipSources = data.ownershipSources || data['ownership Sources'] || undefined;

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

    // Convert old format (affiliate1, $affiliate1, etc.) to new format (affiliates array)
    const convertToArray = (fieldPrefix: string, dollarPrefix?: string) => {
      const result: { name: string; relationship: string }[] = [];
      for (let i = 1; i <= 20; i++) {
        const nameField = `${fieldPrefix}${i}`;
        const relationshipField = dollarPrefix ? `${dollarPrefix}${i}` : null;

        if (data[nameField]) {
          result.push({
            name: data[nameField],
            relationship: relationshipField && data[relationshipField] ? data[relationshipField] : ''
          });
        }
      }
      return result;
    };

    // Try new format first, fall back to old format
    let affiliates = data.affiliates || [];
    let partnerships = data.partnerships || [];
    let ownership = data.ownership || [];

    // If new format is empty, try converting from old format
    if (affiliates.length === 0) {
      const converted = convertToArray('affiliate', '$affiliate');
      if (converted.length > 0) {
        affiliates = converted;
        console.log(`[DataService] Converted ${converted.length} affiliates for ${data.name || brandId}`);
      }
    }

    if (partnerships.length === 0) {
      const converted = convertToArray('Partnership');
      if (converted.length > 0) {
        partnerships = converted;
        console.log(`[DataService] Converted ${converted.length} partnerships for ${data.name || brandId}`);
      }
    }

    if (ownership.length === 0) {
      const converted = convertToArray('ownership');
      if (converted.length > 0) {
        ownership = converted;
        console.log(`[DataService] Converted ${converted.length} ownership entries for ${data.name || brandId}`);
      }
    }

    // Get ownership sources from either new or old format
    const ownershipSources = data.ownershipSources || data['ownership Sources'] || undefined;

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

      // Convert aligned1-10 and unaligned1-10 fields to arrays
      const support: string[] = [];
      const oppose: string[] = [];

      for (let i = 1; i <= 10; i++) {
        const alignedKey = `aligned${i}`;
        const unalignedKey = `unaligned${i}`;

        if (data[alignedKey]) {
          support.push(data[alignedKey]);
        }

        if (data[unalignedKey]) {
          oppose.push(data[unalignedKey]);
        }
      }

      return {
        id: doc.id,
        name: data.name || doc.id,
        support,
        oppose,
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
