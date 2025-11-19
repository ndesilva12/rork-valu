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
    maxPossibleScore += weight;

    // Case-insensitive comparison
    const isInSupport = valueData.support.some(name => name.toLowerCase() === brandNameLower);
    const isInOppose = valueData.oppose.some(name => name.toLowerCase() === brandNameLower);

    if (cause.type === 'support') {
      // User supports this value
      if (isInSupport) rawScore += weight;      // Brand aligns with value: +1
      if (isInOppose) rawScore -= weight;       // Brand opposes value: -1
    } else if (cause.type === 'avoid') {
      // User avoids this value
      if (isInSupport) rawScore -= weight;      // Brand aligns with value: -1
      if (isInOppose) rawScore += weight;       // Brand opposes value: +1
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
