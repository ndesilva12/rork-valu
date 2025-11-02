import { z } from "zod";
import { publicProcedure } from "../../../create-context";

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';

export const autocompleteProcedure = publicProcedure
  .input(
    z.object({
      input: z.string(),
    })
  )
  .query(async ({ input }) => {
    if (!input.input.trim()) {
      return { predictions: [] };
    }

    if (!GOOGLE_PLACES_API_KEY) {
      console.warn('[Location API] No Google Places API key found');
      return { predictions: [] };
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input.input)}&types=(cities)&key=${GOOGLE_PLACES_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
        return { predictions: data.predictions || [] };
      } else {
        console.error('[Location API] Google Places API error:', data.status, data.error_message);
        return { predictions: [], error: data.error_message };
      }
    } catch (error) {
      console.error('[Location API] Error fetching autocomplete:', error);
      return { predictions: [], error: 'Failed to fetch suggestions' };
    }
  });
