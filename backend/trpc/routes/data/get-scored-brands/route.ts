import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { fetchBrandsFromSheets } from '../../../../services/google-sheets';
import { calculateAllBrandAlignments } from '../../../../services/calculate-alignment';

// Schema for user causes
const causeSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(['social_issue', 'religion', 'ideology', 'corporation', 'nation', 'organization', 'person']),
  type: z.enum(['support', 'avoid']),
  description: z.string().optional(),
});

/**
 * Get brands with calculated alignment scores based on user's causes
 *
 * This route:
 * 1. Fetches brands from Google Sheets (cached 5 min)
 * 2. Calculates alignment scores based on user's selected causes
 * 3. Returns scored brands sorted by alignment
 *
 * Performance: Calculates scores server-side for all 764 brands
 */
export const getScoredBrandsProcedure = publicProcedure
  .input(
    z.object({
      userCauses: z.array(causeSchema),
      filter: z.enum(['all', 'aligned', 'unaligned']).optional().default('all'),
    })
  )
  .query(async ({ input }) => {
    // Fetch brands from Google Sheets (uses 5-minute cache)
    const brands = await fetchBrandsFromSheets();

    // If user has no causes selected, return unscored brands
    if (input.userCauses.length === 0) {
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
    const result = calculateAllBrandAlignments(brands, input.userCauses);

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
