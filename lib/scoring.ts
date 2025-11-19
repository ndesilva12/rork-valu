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
  return Math.round(Math.max(0, Math.min(100, normalizedScore)));
}

/**
 * Normalize an array of brand scores to 1-99 range for better visual separation
 * The highest score becomes 99, lowest becomes 1, others distributed proportionally
 *
 * @param brandsWithScores - Array of {brand, score} objects
 * @returns Array with normalized scores (1-99)
 */
export function normalizeBrandScores(
  brandsWithScores: Array<{ brand: any; score: number }>
): Array<{ brand: any; score: number }> {
  if (brandsWithScores.length === 0) return brandsWithScores;
  if (brandsWithScores.length === 1) {
    return [{ ...brandsWithScores[0], score: 50 }]; // Single brand = neutral
  }

  // Find min and max scores
  const scores = brandsWithScores.map(b => b.score);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);

  // If all scores are the same, return 50 for all
  if (minScore === maxScore) {
    return brandsWithScores.map(b => ({ ...b, score: 50 }));
  }

  // Normalize to 1-99 range
  return brandsWithScores.map(({ brand, score }) => {
    const normalized = 1 + ((score - minScore) / (maxScore - minScore)) * 98;
    return {
      brand,
      score: Math.round(normalized)
    };
  });
}

/**
 * Calculate similarity between two sets of causes using Jaccard similarity
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

  // Convert to 0-100 scale
  return Math.round(similarity * 100);
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
