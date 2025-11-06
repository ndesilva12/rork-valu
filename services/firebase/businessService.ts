import { collection, query, where, getDocs, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/firebase';
import { BusinessInfo, Cause } from '@/types';

export interface BusinessUser {
  id: string; // User ID
  email?: string;
  businessInfo: BusinessInfo;
  causes?: Cause[]; // Business's selected values
  distance?: number; // Calculated distance from user
  alignmentScore?: number; // Alignment score with viewing user (0-100)
}

/**
 * Get all businesses that accept Stand discounts from Firebase
 * @returns Array of business users
 */
export async function getBusinessesAcceptingDiscounts(): Promise<BusinessUser[]> {
  try {
    console.log('[Firebase businessService] 🔄 Fetching businesses accepting Stand discounts');

    if (!db) {
      console.error('[Firebase businessService] ❌ db is null or undefined!');
      throw new Error('Firebase db not initialized');
    }

    // Query users collection for businesses accepting Stand discounts
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('accountType', '==', 'business'),
      where('businessInfo.acceptsStandDiscounts', '==', true)
    );

    const querySnapshot = await getDocs(q);
    console.log('[Firebase businessService] 📦 Found', querySnapshot.size, 'businesses');

    const businesses: BusinessUser[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // Validate that businessInfo exists and has required fields
      if (data.businessInfo && data.businessInfo.name) {
        businesses.push({
          id: doc.id,
          email: data.email,
          businessInfo: data.businessInfo as BusinessInfo,
        });
      } else {
        console.warn('[Firebase businessService] ⚠️ Business missing businessInfo:', doc.id);
      }
    });

    console.log('[Firebase businessService] ✅ Returning', businesses.length, 'valid businesses');
    return businesses;
  } catch (error) {
    console.error('[Firebase businessService] ❌ Error fetching businesses:', error);
    if (error instanceof Error) {
      console.error('[Firebase businessService] Error message:', error.message);
      console.error('[Firebase businessService] Error stack:', error.stack);
    }
    throw error;
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in miles
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get all user businesses (regardless of discount acceptance) from Firebase
 * @returns Array of all business users
 */
export async function getAllUserBusinesses(): Promise<BusinessUser[]> {
  try {
    console.log('[Firebase businessService] 🔄 Fetching all user businesses');

    if (!db) {
      console.error('[Firebase businessService] ❌ db is null or undefined!');
      throw new Error('Firebase db not initialized');
    }

    // Query users collection for all business accounts
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('accountType', '==', 'business')
    );

    const querySnapshot = await getDocs(q);
    console.log('[Firebase businessService] 📦 Found', querySnapshot.size, 'businesses');

    const businesses: BusinessUser[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // Validate that businessInfo exists and has required fields
      if (data.businessInfo && data.businessInfo.name) {
        businesses.push({
          id: doc.id,
          email: data.email,
          businessInfo: data.businessInfo as BusinessInfo,
          causes: data.causes || [], // Include the business's selected values
        });
      } else {
        console.warn('[Firebase businessService] ⚠️ Business missing businessInfo:', doc.id);
      }
    });

    console.log('[Firebase businessService] ✅ Returning', businesses.length, 'valid businesses');
    return businesses;
  } catch (error) {
    console.error('[Firebase businessService] ❌ Error fetching all businesses:', error);
    if (error instanceof Error) {
      console.error('[Firebase businessService] Error message:', error.message);
      console.error('[Firebase businessService] Error stack:', error.stack);
    }
    throw error;
  }
}

/**
 * Calculate alignment score between user and business based on their selected values
 *
 * Scoring method:
 * - Perfect match (all values align): 100
 * - Complete opposite (no overlap, all conflicts): 0
 * - Uses Jaccard similarity coefficient with adjustments for opposite stances
 *
 * @param userCauses Array of user's selected causes
 * @param businessCauses Array of business's selected causes
 * @returns Alignment score from 0-100
 */
export function calculateAlignmentScore(userCauses: Cause[], businessCauses: Cause[]): number {
  // Handle edge cases
  if (!userCauses || userCauses.length === 0 || !businessCauses || businessCauses.length === 0) {
    return 50; // Neutral score when one or both have no values
  }

  // Create maps for quick lookup
  const userSupportSet = new Set(userCauses.filter(c => c.type === 'support').map(c => c.id));
  const userAvoidSet = new Set(userCauses.filter(c => c.type === 'avoid').map(c => c.id));
  const bizSupportSet = new Set(businessCauses.filter(c => c.type === 'support').map(c => c.id));
  const bizAvoidSet = new Set(businessCauses.filter(c => c.type === 'avoid').map(c => c.id));

  let positivePoints = 0;
  let negativePoints = 0;
  let totalComparisons = 0;

  // Get all unique value IDs from both users
  const allValueIds = new Set([
    ...userSupportSet,
    ...userAvoidSet,
    ...bizSupportSet,
    ...bizAvoidSet,
  ]);

  // For each value, check alignment
  allValueIds.forEach(valueId => {
    const userSupports = userSupportSet.has(valueId);
    const userAvoids = userAvoidSet.has(valueId);
    const bizSupports = bizSupportSet.has(valueId);
    const bizAvoids = bizAvoidSet.has(valueId);

    // Skip if neither selected this value
    if (!userSupports && !userAvoids && !bizSupports && !bizAvoids) {
      return;
    }

    totalComparisons++;

    // Both support the same value: +2 points (strong alignment)
    if (userSupports && bizSupports) {
      positivePoints += 2;
    }
    // Both avoid the same value: +2 points (strong alignment)
    else if (userAvoids && bizAvoids) {
      positivePoints += 2;
    }
    // User supports but business avoids: -2 points (strong conflict)
    else if (userSupports && bizAvoids) {
      negativePoints += 2;
    }
    // User avoids but business supports: -2 points (strong conflict)
    else if (userAvoids && bizSupports) {
      negativePoints += 2;
    }
    // One selected but other didn't: +1 point (mild alignment)
    else {
      positivePoints += 1;
    }
  });

  // Calculate score
  if (totalComparisons === 0) {
    return 50; // Neutral if no comparable values
  }

  // Score = (positivePoints - negativePoints) / (maxPossiblePoints) * 100
  // MaxPossiblePoints = totalComparisons * 2 (all strong alignments)
  const maxPoints = totalComparisons * 2;
  const netPoints = positivePoints - negativePoints;

  // Normalize to 0-100 range
  // -maxPoints (all conflicts) -> 0
  // 0 (neutral) -> 50
  // +maxPoints (all alignments) -> 100
  const score = 50 + (netPoints / maxPoints) * 50;

  // Clamp to 0-100
  return Math.max(0, Math.min(100, Math.round(score)));
}
