import { z } from "zod";
import { publicProcedure } from "../../../create-context";

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';

export const placeDetailsProcedure = publicProcedure
  .input(
    z.object({
      placeId: z.string(),
    })
  )
  .query(async ({ input }) => {
    if (!GOOGLE_PLACES_API_KEY) {
      console.warn('[Location API] No Google Places API key found');
      return { result: null, error: 'No API key configured' };
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${input.placeId}&fields=geometry&key=${GOOGLE_PLACES_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        return { result: data.result };
      } else {
        console.error('[Location API] Google Place Details API error:', data.status, data.error_message);
        return { result: null, error: data.error_message };
      }
    } catch (error) {
      console.error('[Location API] Error fetching place details:', error);
      return { result: null, error: 'Failed to fetch place details' };
    }
  });
