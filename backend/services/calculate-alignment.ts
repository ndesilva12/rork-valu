import { Brand, Cause } from '@/types';

export interface ScoredBrand extends Brand {
  alignmentStrength: number;
  isAligned: boolean;
  totalSupportScore: number;
  totalAvoidScore: number;
  matchingValuesCount: number;
  matchingValues: string[];
}

/**
 * Calculates alignment score for a brand based on user's causes
 *
 * Algorithm:
 * 1. For each user value, check if brand has alignment (position 1-10) or not (position 11)
 * 2. Calculate average position across all user values
 * 3. Convert to 0-100 score:
 *    - Aligned: avgPosition 1→100, avgPosition 11→50
 *    - Unaligned: avgPosition 1→0, avgPosition 11→50
 */
export function calculateBrandAlignment(
  brand: Brand,
  userCauses: Cause[]
): ScoredBrand {
  const supportedCauses = userCauses.filter(c => c.type === 'support').map(c => c.id);
  const avoidedCauses = userCauses.filter(c => c.type === 'avoid').map(c => c.id);
  const totalUserValues = userCauses.length;

  let totalSupportScore = 0;
  let totalAvoidScore = 0;
  const matchingValues = new Set<string>();
  const positionSum: number[] = [];

  // Process each brand value alignment
  brand.valueAlignments.forEach(alignment => {
    const isUserSupporting = supportedCauses.includes(alignment.valueId);
    const isUserAvoiding = avoidedCauses.includes(alignment.valueId);

    // Skip if user doesn't care about this value
    if (!isUserSupporting && !isUserAvoiding) return;

    matchingValues.add(alignment.valueId);
    positionSum.push(alignment.position);

    // Calculate score: position 1 = ±100, position 10 = ±50
    const score = alignment.isSupport
      ? (100 - alignment.position * 5)
      : -(100 - alignment.position * 5);

    if (isUserSupporting) {
      if (score > 0) {
        totalSupportScore += score;
      } else {
        totalAvoidScore += Math.abs(score);
      }
    }

    if (isUserAvoiding) {
      if (score < 0) {
        totalSupportScore += Math.abs(score);
      } else {
        totalAvoidScore += score;
      }
    }
  });

  // Add position 11 (neutral) for values where brand has no stance
  const valuesWhereNotAppears = totalUserValues - matchingValues.size;
  const totalPositionSum = positionSum.reduce((a, b) => a + b, 0) + (valuesWhereNotAppears * 11);
  const avgPosition = totalUserValues > 0 ? totalPositionSum / totalUserValues : 11;

  // Determine if brand is negatively aligned
  const isNegativelyAligned = totalAvoidScore > totalSupportScore && totalAvoidScore > 0;

  // Convert average position to 0-100 alignment strength
  let alignmentStrength: number;
  if (isNegativelyAligned) {
    // Unaligned: avgPos 1→0, avgPos 11→50
    alignmentStrength = Math.round(((avgPosition - 1) / 10) * 50);
  } else {
    // Aligned: avgPos 1→100, avgPos 11→50
    alignmentStrength = Math.round((1 - ((avgPosition - 1) / 10)) * 50 + 50);
  }

  return {
    ...brand,
    alignmentStrength,
    isAligned: !isNegativelyAligned && totalSupportScore > 0,
    totalSupportScore,
    totalAvoidScore,
    matchingValuesCount: matchingValues.size,
    matchingValues: Array.from(matchingValues),
  };
}

/**
 * Calculates alignment scores for all brands based on user's causes
 * Returns brands sorted by alignment strength
 */
export function calculateAllBrandAlignments(
  brands: Brand[],
  userCauses: Cause[]
): {
  scoredBrands: ScoredBrand[];
  alignedBrands: ScoredBrand[];
  unalignedBrands: ScoredBrand[];
} {
  // Calculate scores for all brands
  const scoredBrands = brands.map(brand =>
    calculateBrandAlignment(brand, userCauses)
  );

  // Split into aligned and unaligned
  const alignedBrands = scoredBrands
    .filter(s => s.totalSupportScore > s.totalAvoidScore && s.totalSupportScore > 0)
    .sort((a, b) => b.alignmentStrength - a.alignmentStrength);

  const unalignedBrands = scoredBrands
    .filter(s => s.totalAvoidScore > s.totalSupportScore && s.totalAvoidScore > 0)
    .sort((a, b) => a.alignmentStrength - b.alignmentStrength);

  return {
    scoredBrands,
    alignedBrands,
    unalignedBrands,
  };
}
