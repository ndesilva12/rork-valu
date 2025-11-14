import { CauseCategory } from '@/types';

/**
 * Value Weights Configuration
 *
 * This file controls how much each value contributes to alignment scoring.
 * Higher weights = more important to the overall score.
 *
 * How weighting works:
 * - Category weights apply to ALL values in that category
 * - Individual value weights override the category weight
 * - Default weight: 1.0 (standard importance)
 * - Example: 2.0 = twice as important, 0.5 = half as important
 *
 * Usage:
 * - Adjust categoryWeights to change entire categories at once
 * - Adjust individualWeights to fine-tune specific values
 * - All weights currently set to 1.0 (equal importance)
 */

// Default weight for all values (if not specified)
export const DEFAULT_WEIGHT = 1.0;

/**
 * Category-level weights
 *
 * Adjust these to make entire categories more or less important
 * in alignment calculations.
 *
 * Examples of when to adjust:
 * - Set social_issue to 2.0 if social issues matter most
 * - Set person to 0.5 if celebrity opinions matter less
 * - Set ideology to 1.5 if core beliefs should weigh more
 */
export const CATEGORY_WEIGHTS: Record<CauseCategory, number> = {
  social_issue: 1.0,  // Social issues (abortion, gun rights, climate, etc.)
  ideology: 1.0,      // Political/philosophical ideologies
  religion: 1.0,      // Religious affiliations
  person: 1.0,        // Public figures and celebrities
  nation: 1.0,        // Countries and states
  organization: 1.0,  // Organizations (foundations, advocacy groups, etc.)
  corporation: 1.0,   // Corporations and companies
  sports: 1.0,        // Sports leagues and teams
};

/**
 * Individual value weights
 *
 * Use this to override the category weight for specific values.
 * Only add values here if they should be weighted differently from their category.
 *
 * Examples of when to use:
 * - Make "abortion" 2.0 if it's a critical issue
 * - Make "climate-change" 1.5 if environmental issues are key
 * - Make celebrity endorsements 0.3 if they matter less
 *
 * Currently empty - all values use their category weight.
 */
export const INDIVIDUAL_WEIGHTS: Record<string, number> = {
  // Example entries (currently commented out - all values weighted equally):
  // 'abortion': 1.0,
  // 'gun-rights': 1.0,
  // 'climate-change': 1.0,
  // 'lgbtq': 1.0,
  // Add specific value IDs here to override category weights
};

/**
 * Get the weight for a specific value
 *
 * Priority:
 * 1. Individual weight (if specified)
 * 2. Category weight
 * 3. Default weight (1.0)
 */
export function getValueWeight(valueId: string, category: CauseCategory): number {
  // Check for individual override first
  if (INDIVIDUAL_WEIGHTS[valueId] !== undefined) {
    return INDIVIDUAL_WEIGHTS[valueId];
  }

  // Use category weight
  if (CATEGORY_WEIGHTS[category] !== undefined) {
    return CATEGORY_WEIGHTS[category];
  }

  // Fallback to default
  return DEFAULT_WEIGHT;
}

/**
 * Quick adjustment helpers
 *
 * These functions make it easy to adjust weights in code if needed.
 * Useful for A/B testing or dynamic weight adjustments.
 */

// Set weight for an entire category
export function setCategoryWeight(category: CauseCategory, weight: number): void {
  CATEGORY_WEIGHTS[category] = weight;
}

// Set weight for a specific value
export function setIndividualWeight(valueId: string, weight: number): void {
  INDIVIDUAL_WEIGHTS[valueId] = weight;
}

// Reset all weights to default
export function resetAllWeights(): void {
  Object.keys(CATEGORY_WEIGHTS).forEach(key => {
    CATEGORY_WEIGHTS[key as CauseCategory] = DEFAULT_WEIGHT;
  });
  Object.keys(INDIVIDUAL_WEIGHTS).forEach(key => {
    delete INDIVIDUAL_WEIGHTS[key];
  });
}

/**
 * Presets for common weighting scenarios
 *
 * Call these functions to quickly apply common weight configurations.
 */

// Focus on social issues (double weight)
export function applyFocusSocialIssues(): void {
  setCategoryWeight('social_issue', 2.0);
  setCategoryWeight('person', 0.5);
}

// Focus on people and organizations (celebrities/influencers matter more)
export function applyFocusPeople(): void {
  setCategoryWeight('person', 1.5);
  setCategoryWeight('organization', 1.5);
  setCategoryWeight('social_issue', 0.8);
}

// Focus on ideology and religion (core beliefs matter most)
export function applyFocusBeliefs(): void {
  setCategoryWeight('ideology', 2.0);
  setCategoryWeight('religion', 2.0);
  setCategoryWeight('person', 0.5);
}

// Equal weights (reset to default)
export function applyEqualWeights(): void {
  resetAllWeights();
}
