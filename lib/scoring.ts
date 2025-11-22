/**
 * Scoring utilities for brand recommendations and user similarity
 */

import { Cause } from '@/types';

/**
 * Calculate a brand's alignment score for a user based on their values
 *
 * @param brandName - The brand name to score (not ID - valuesMatrix uses names)
 * @param userCauses - User's selected causes/values
 * @param valuesMatrix - Matrix mapping value IDs to aligned/opposed brand NAMES
 * @returns Score from 0-100 (50 = neutral, >50 = aligned, <50 = opposed)
 */
export function calculateBrandScore(
  brandName: string,
  userCauses: Cause[],
  valuesMatrix: Record<string, { support: string[]; oppose: string[] }>
): number {
  // Safety check: if brand has no name, return neutral score
  if (!brandName || typeof brandName !== 'string' || brandName.trim() === '') {
    return 50;
  }

  if (!userCauses || userCauses.length === 0) {
    return 50; // Neutral score for users with no causes
  }

  let rawScore = 0;
  let maxPossibleScore = 0;
  let mentionedCount = 0; // Track how many values mention this brand

  const brandNameLower = brandName.toLowerCase();

  userCauses.forEach((cause) => {
    const valueData = valuesMatrix[cause.id];
    if (!valueData) return;

    const weight = cause.weight || 1.0;

    // Find brand position in support/oppose arrays (position matters!)
    // Earlier in array = stronger alignment/opposition
    const supportIndex = valueData.support.findIndex(name => name.toLowerCase() === brandNameLower);
    const opposeIndex = valueData.oppose.findIndex(name => name.toLowerCase() === brandNameLower);

    const isInSupport = supportIndex !== -1;
    const isInOppose = opposeIndex !== -1;

    if (!isInSupport && !isInOppose) {
      // Brand not mentioned for this value - neutral contribution
      maxPossibleScore += weight;
      return;
    }

    // Brand is mentioned in this value's data
    mentionedCount++;

    // Calculate position-based score (earlier position = higher score)
    // Position 0 (first) = 100% of weight
    // Position 49 (last in top 50) = 51% of weight
    // This creates separation while maintaining relative importance
    let positionScore = 0;

    if (isInSupport) {
      const totalSupport = valueData.support.length;
      const positionWeight = totalSupport > 1
        ? 1.0 - (supportIndex / totalSupport) * 0.49  // Range: 1.0 to 0.51
        : 1.0;
      positionScore = weight * positionWeight;
    } else if (isInOppose) {
      const totalOppose = valueData.oppose.length;
      const positionWeight = totalOppose > 1
        ? 1.0 - (opposeIndex / totalOppose) * 0.49  // Range: 1.0 to 0.51
        : 1.0;
      positionScore = weight * positionWeight;
    }

    maxPossibleScore += weight;

    if (cause.type === 'support') {
      // User supports this value
      if (isInSupport) rawScore += positionScore;      // Brand aligns: positive
      if (isInOppose) rawScore -= positionScore;       // Brand opposes: negative
    } else if (cause.type === 'avoid') {
      // User avoids this value
      if (isInSupport) rawScore -= positionScore;      // Brand aligns: negative
      if (isInOppose) rawScore += positionScore;       // Brand opposes: positive
    }
  });

  // Normalize to 0-100 scale
  // rawScore ranges from -maxPossibleScore to +maxPossibleScore
  // Map to 0-100 where 50 is neutral
  if (maxPossibleScore === 0) return 50;

  const normalizedScore = 50 + (rawScore / maxPossibleScore) * 50;
  const finalScore = Math.round(Math.max(0, Math.min(100, normalizedScore)));

  return finalScore;
}

/**
 * Normalize an array of brand scores to 1-99 range with median at 50
 * This preserves the midpoint: half of brands score below 50, half above
 *
 * @param brandsWithScores - Array of {brand, score} objects
 * @returns Array with normalized scores (1-99, median = 50)
 */
export function normalizeBrandScores(
  brandsWithScores: Array<{ brand: any; score: number }>
): Array<{ brand: any; score: number }> {
  if (brandsWithScores.length === 0) return brandsWithScores;
  if (brandsWithScores.length === 1) {
    return [{ ...brandsWithScores[0], score: 50 }]; // Single brand = neutral
  }

  // Get all scores and sort them
  const scores = brandsWithScores.map(b => b.score).sort((a, b) => a - b);
  const minScore = scores[0];
  const maxScore = scores[scores.length - 1];

  // If all scores are the same, return 50 for all
  if (minScore === maxScore) {
    return brandsWithScores.map(b => ({ ...b, score: 50 }));
  }

  // Find the median score
  const medianIndex = Math.floor(scores.length / 2);
  const medianScore = scores.length % 2 === 0
    ? (scores[medianIndex - 1] + scores[medianIndex]) / 2
    : scores[medianIndex];

  // Normalize with median at 50
  return brandsWithScores.map(({ brand, score }) => {
    let normalized: number;

    if (score <= medianScore) {
      // Below median: map to 1-50 range
      if (medianScore === minScore) {
        normalized = 50;
      } else {
        normalized = 1 + ((score - minScore) / (medianScore - minScore)) * 49;
      }
    } else {
      // Above median: map to 50-99 range
      if (maxScore === medianScore) {
        normalized = 50;
      } else {
        normalized = 50 + ((score - medianScore) / (maxScore - medianScore)) * 49;
      }
    }

    return {
      brand,
      score: Math.round(normalized)
    };
  });
}

/**
 * Calculate similarity between two sets of causes using Jaccard similarity
 * with confidence weighting based on overlap size
 *
 * @param causesA - First set of causes
 * @param causesB - Second set of causes
 * @returns Similarity score from 0-100 (0 = no overlap, 100 = identical)
 */
export function calculateSimilarityScore(
  causesA: Cause[],
  causesB: Cause[]
): number {
  if (!causesA || !causesB || (causesA.length === 0 && causesB.length === 0)) {
    return 0; // No similarity if one or both have no causes
  }

  if (causesA.length === 0 || causesB.length === 0) {
    return 0; // No similarity if one has no causes
  }

  // Extract cause IDs for set operations
  const setA = new Set(causesA.map(c => c.id));
  const setB = new Set(causesB.map(c => c.id));

  // Calculate intersection
  const intersection = new Set([...setA].filter(id => setB.has(id)));

  // Calculate union
  const union = new Set([...setA, ...setB]);

  // Jaccard similarity: intersection / union
  const similarity = intersection.size / union.size;

  // Apply confidence weighting based on number of overlapping values
  // More overlaps = higher confidence = score can be further from 50
  // Fewer overlaps = lower confidence = score pulled toward 50
  const overlapCount = intersection.size;

  // Confidence factor: scales from 0.2 (1 overlap) to 1.0 (5+ overlaps)
  // This makes scores with few overlaps more neutral
  let confidence: number;
  if (overlapCount === 0) {
    confidence = 0;
  } else if (overlapCount === 1) {
    confidence = 0.3;
  } else if (overlapCount === 2) {
    confidence = 0.5;
  } else if (overlapCount === 3) {
    confidence = 0.7;
  } else if (overlapCount === 4) {
    confidence = 0.85;
  } else {
    confidence = 1.0; // 5+ overlaps = full confidence
  }

  // Convert to 0-100 scale
  const baseScore = Math.round(similarity * 100);

  // Apply confidence: pull score toward 50 based on confidence
  // score = 50 + (score - 50) * confidence
  const adjustedScore = 50 + (baseScore - 50) * confidence;

  return Math.round(adjustedScore);
}

/**
 * Normalize similarity scores to 1-99 range with median at 50
 *
 * @param businessesWithScores - Array of businesses with similarity scores
 * @returns Array with normalized scores (1-99, median = 50)
 */
export function normalizeSimilarityScores<T extends { alignmentScore: number }>(
  businessesWithScores: T[]
): T[] {
  if (businessesWithScores.length === 0) return businessesWithScores;
  if (businessesWithScores.length === 1) {
    return businessesWithScores.map(b => ({ ...b, alignmentScore: 50 }));
  }

  // Get all scores and sort them
  const scores = businessesWithScores.map(b => b.alignmentScore).sort((a, b) => a - b);
  const minScore = scores[0];
  const maxScore = scores[scores.length - 1];

  // If all scores are the same, return 50 for all
  if (minScore === maxScore) {
    return businessesWithScores.map(b => ({ ...b, alignmentScore: 50 }));
  }

  // Find the median score
  const medianIndex = Math.floor(scores.length / 2);
  const medianScore = scores.length % 2 === 0
    ? (scores[medianIndex - 1] + scores[medianIndex]) / 2
    : scores[medianIndex];

  // Normalize with median at 50
  return businessesWithScores.map(business => {
    const score = business.alignmentScore;
    let normalized: number;

    if (score <= medianScore) {
      // Below median: map to 1-50 range
      if (medianScore === minScore) {
        normalized = 50;
      } else {
        normalized = 1 + ((score - minScore) / (medianScore - minScore)) * 49;
      }
    } else {
      // Above median: map to 50-99 range
      if (maxScore === medianScore) {
        normalized = 50;
      } else {
        normalized = 50 + ((score - medianScore) / (maxScore - medianScore)) * 49;
      }
    }

    return {
      ...business,
      alignmentScore: Math.round(normalized)
    };
  });
}

/**
 * Get a text label for a brand score
 */
export function getBrandScoreLabel(score: number): string {
  if (score >= 80) return 'Highly Aligned';
  if (score >= 60) return 'Aligned';
  if (score > 40) return 'Neutral';
  if (score >= 20) return 'Opposed';
  return 'Highly Opposed';
}

/**
 * Get a color for a brand score (for UI display)
 */
export function getBrandScoreColor(score: number, colors: any): string {
  if (score >= 60) return colors.success;      // Green for aligned
  if (score > 40) return colors.textSecondary; // Gray for neutral
  return colors.danger;                         // Red for opposed
}

/**
 * Get a text label for a similarity score
 */
export function getSimilarityLabel(score: number): string {
  if (score >= 80) return 'Very Similar';
  if (score >= 60) return 'Similar';
  if (score >= 40) return 'Somewhat Similar';
  if (score >= 20) return 'Slightly Similar';
  return 'Different';
}
