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
 * WEIGHTED Scoring method (focuses ONLY on shared positions with importance weighting):
 * - Only counts values where BOTH parties have taken a position (support or avoid)
 * - Ignores values where only one party has selected (neutral = doesn't count)
 * - Applies weights to values based on category and individual importance
 * - Perfect match: 100 (all shared positions align)
 * - Complete opposite: 0 (all shared positions conflict)
 * - No overlap: 50 (neutral - no shared positions to compare)
 *
 * Scoring rules:
 * - Both support same value: +weight points (alignment)
 * - Both avoid same value: +weight points (alignment)
 * - One supports, other avoids: -weight points (conflict)
 * - One has position, other neutral: 0 points (IGNORED - doesn't count)
 *
 * Final Score = (weighted_matches / (weighted_matches + weighted_conflicts)) * 100
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

  // Import weight configuration
  const { getValueWeight } = require('@/config/valueWeights');

  // Create maps for quick lookup with full cause data
  const userSupportMap = new Map(
    userCauses.filter(c => c.type === 'support').map(c => [c.id, c])
  );
  const userAvoidMap = new Map(
    userCauses.filter(c => c.type === 'avoid').map(c => [c.id, c])
  );
  const bizSupportMap = new Map(
    businessCauses.filter(c => c.type === 'support').map(c => [c.id, c])
  );
  const bizAvoidMap = new Map(
    businessCauses.filter(c => c.type === 'avoid').map(c => [c.id, c])
  );

  let weightedMatches = 0;      // Weighted sum of agreements
  let weightedConflicts = 0;    // Weighted sum of conflicts

  // Get all unique value IDs from both users
  const allValueIds = new Set([
    ...userSupportMap.keys(),
    ...userAvoidMap.keys(),
    ...bizSupportMap.keys(),
    ...bizAvoidMap.keys(),
  ]);

  // For each value, check alignment ONLY where both have positions
  allValueIds.forEach(valueId => {
    const userSupports = userSupportMap.has(valueId);
    const userAvoids = userAvoidMap.has(valueId);
    const bizSupports = bizSupportMap.has(valueId);
    const bizAvoids = bizAvoidMap.has(valueId);

    const userHasPosition = userSupports || userAvoids;
    const bizHasPosition = bizSupports || bizAvoids;

    // Skip if EITHER party has no position on this value
    if (!userHasPosition || !bizHasPosition) {
      return; // One or both neutral - doesn't count toward score
    }

    // Get the cause object (from either user or business) to determine category and weight
    const cause = userSupports ? userSupportMap.get(valueId)
              : userAvoids ? userAvoidMap.get(valueId)
              : bizSupports ? bizSupportMap.get(valueId)
              : bizAvoidMap.get(valueId);

    if (!cause) {
      return; // Safety check (should never happen)
    }

    // Get weight for this value (uses individual weight override or category weight)
    const weight = getValueWeight(valueId, cause.category);

    // Now we know BOTH have positions - check if they match or conflict

    // MATCHES: Both support OR both avoid
    if ((userSupports && bizSupports) || (userAvoids && bizAvoids)) {
      weightedMatches += weight;
    }
    // CONFLICTS: Support vs Avoid (either direction)
    else if ((userSupports && bizAvoids) || (userAvoids && bizSupports)) {
      weightedConflicts += weight;
    }
  });

  // Calculate score based ONLY on overlapping positions
  const totalWeightedComparisons = weightedMatches + weightedConflicts;

  if (totalWeightedComparisons === 0) {
    // No overlapping positions at all - completely neutral
    return 50;
  }

  // Score = percentage of weighted matches out of all weighted comparisons
  // All matches (100%) = 100 score
  // All conflicts (0%) = 0 score
  // 50/50 mix = 50 score
  const score = (weightedMatches / totalWeightedComparisons) * 100;

  return Math.round(score);
}

/**
 * Check if a business has ANY location within the specified distance from user
 * @param business Business user object
 * @param userLat User's latitude
 * @param userLon User's longitude
 * @param maxDistance Maximum distance in miles
 * @returns Object with isWithinRange boolean and closest distance
 */
export function isBusinessWithinRange(
  business: BusinessUser,
  userLat: number,
  userLon: number,
  maxDistance: number
): { isWithinRange: boolean; closestDistance?: number; closestLocation?: string } {
  const businessInfo = business.businessInfo;

  // Check new locations array first (preferred)
  if (businessInfo.locations && businessInfo.locations.length > 0) {
    let closestDistance = Infinity;
    let closestAddress = '';

    for (const location of businessInfo.locations) {
      const distance = calculateDistance(userLat, userLon, location.latitude, location.longitude);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestAddress = location.address;
      }
    }

    return {
      isWithinRange: closestDistance <= maxDistance,
      closestDistance: closestDistance === Infinity ? undefined : closestDistance,
      closestLocation: closestAddress || undefined,
    };
  }

  // Fallback to old single location fields (backwards compatibility)
  if (businessInfo.latitude && businessInfo.longitude) {
    const distance = calculateDistance(userLat, userLon, businessInfo.latitude, businessInfo.longitude);
    return {
      isWithinRange: distance <= maxDistance,
      closestDistance: distance,
      closestLocation: businessInfo.location,
    };
  }

  // No location data available
  return {
    isWithinRange: false,
    closestDistance: undefined,
    closestLocation: undefined,
  };
}
