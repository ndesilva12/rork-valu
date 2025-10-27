import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { fetchBrandsFromSheets } from '../../../../services/google-sheets';
import { calculateAllBrandAlignments } from '../../../../services/calculate-alignment';
import { fetchValueBrandMatrix, buildAllValueAlignments } from '../../../../services/value-brand-matrix';

// Schema for user values
const userValueSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(['social_issue', 'religion', 'ideology', 'corporation', 'nation', 'organization', 'person']),
  type: z.enum(['support', 'avoid']),
  description: z.string().optional(),
});

/**
 * Get brands with calculated alignment scores based on user's selected values
 *
 * This route:
 * 1. Fetches brands from Google Sheets (cached 5 min)
 * 2. Calculates alignment scores based on user's selected values
 * 3. Returns scored brands sorted by alignment
 *
 * Performance: Calculates scores server-side for all 764 brands
 */
export const getScoredBrandsProcedure = publicProcedure
  .input(
    z.object({
      userValues: z.array(userValueSchema),
      filter: z.enum(['all', 'aligned', 'unaligned']).optional().default('all'),
    })
  )
  .query(async ({ input }) => {
  // Fetch brands from Google Sheets (uses 5-minute cache)
  const brands = await fetchBrandsFromSheets();

  // Fetch Value-Brand-Matrix and build valueAlignments for all brands
  let brandsWithAlignments;
  try {
    const matrix = await fetchValueBrandMatrix();
    const valueAlignmentsMap = buildAllValueAlignments(matrix);
    // DEBUG: Log what we got
   console.log(`[getScoredBrands] Matrix has ${matrix.length} values`);
   console.log(`[getScoredBrands] valueAlignmentsMap has ${valueAlignmentsMap.size} brand IDs`);
   console.log(`[getScoredBrands] Brands array has ${brands.length} brands`);
   console.log(`[getScoredBrands] First 5 brands from Brands sheet:`, brands.slice(0, 5).map(b => b.id));
   console.log(`[getScoredBrands] First 5 brand IDs from Values matrix:`, Array.from(valueAlignmentsMap.keys()).slice(0, 5));
    
    // Add valueAlignments to each brand
    brandsWithAlignments = brands.map(brand => ({
      ...brand,
      valueAlignments: valueAlignmentsMap.get(brand.id) || [],
    }));

    console.log(`[getScoredBrands] Added valueAlignments to ${brandsWithAlignments.length} brands`);
  } catch (error: any) {
    console.error('[getScoredBrands] Failed to load Value-Brand-Matrix:', error.message);
    // Fall back to brands without valueAlignments
    brandsWithAlignments = brands.map(brand => ({
      ...brand,
      valueAlignments: [],
    }));
  }

  // If user has no values selected, return unscored brands
  if (input.userValues.length === 0) {
      return {
        scoredBrands: brands.map(b => ({
          ...b,
          alignmentStrength: 50, // Neutral
          isAligned: false,
          totalSupportScore: 0,
          totalAvoidScore: 0,
          matchingValuesCount: 0,
          matchingValues: [],
        })),
        alignedBrands: [],
        unalignedBrands: [],
      };
    }

    // Calculate alignment scores for all brands
  const result = calculateAllBrandAlignments(brandsWithAlignments, input.userValues);

    // Return based on filter
    switch (input.filter) {
      case 'aligned':
        return {
          scoredBrands: result.alignedBrands,
          alignedBrands: result.alignedBrands,
          unalignedBrands: [],
        };
      case 'unaligned':
        return {
          scoredBrands: result.unalignedBrands,
          alignedBrands: [],
          unalignedBrands: result.unalignedBrands,
        };
      default:
        return result;
    }
  });
