/**
 * Google Places Service
 *
 * Provides access to Google Places API for searching
 * and getting details of external businesses
 *
 * Uses client-side API calls with EXPO_PUBLIC_GOOGLE_PLACES_API_KEY
 */

// Get API key from environment
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';

// Types for Places API responses
export interface PlaceSearchResult {
  placeId: string;
  name: string;
  address: string;
  category: string;
  rating?: number;
  userRatingsTotal?: number;
  photoReference?: string;
  location?: {
    lat: number;
    lng: number;
  };
  openNow?: boolean;
  priceLevel?: number;
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  googleMapsUrl: string;
  rating?: number;
  userRatingsTotal?: number;
  category: string;
  categories: string[];
  location?: {
    lat: number;
    lng: number;
  };
  priceLevel?: number;
  openingHours?: string[];
  isOpenNow?: boolean;
  photoReferences: string[];
  reviews: {
    author: string;
    rating: number;
    text: string;
    time: string;
  }[];
}

/**
 * Search for places using Google Places API
 * @param query Search query string
 * @param location Optional location to bias results
 * @param radius Search radius in meters (default 50km)
 */
export const searchPlaces = async (
  query: string,
  location?: { lat: number; lng: number },
  radius: number = 50000
): Promise<PlaceSearchResult[]> => {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn('[PlacesService] Google Places API key not configured');
    return [];
  }

  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const baseUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
    const params = new URLSearchParams({
      query: query,
      key: GOOGLE_PLACES_API_KEY,
      type: 'establishment',
    });

    // Add location bias if provided
    if (location?.lat && location?.lng) {
      params.append('location', `${location.lat},${location.lng}`);
      params.append('radius', radius.toString());
    }

    const response = await fetch(`${baseUrl}?${params.toString()}`);
    const result = await response.json();

    if (result.status !== 'OK' && result.status !== 'ZERO_RESULTS') {
      console.error('[PlacesService] API error:', result.status, result.error_message);
      return [];
    }

    // Transform results to our format
    const places: PlaceSearchResult[] = (result.results || []).slice(0, 20).map((place: any) => ({
      placeId: place.place_id,
      name: place.name,
      address: place.formatted_address,
      category: place.types?.[0]?.replace(/_/g, ' ') || 'Business',
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      photoReference: place.photos?.[0]?.photo_reference,
      location: place.geometry?.location,
      openNow: place.opening_hours?.open_now,
      priceLevel: place.price_level,
    }));

    console.log('[PlacesService] Search completed:', places.length, 'results');
    return places;
  } catch (error: any) {
    console.error('[PlacesService] Error searching places:', error);
    return [];
  }
};

/**
 * Get detailed information about a specific place
 * @param placeId Google Place ID
 */
export const getPlaceDetails = async (placeId: string): Promise<PlaceDetails | null> => {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn('[PlacesService] Google Places API key not configured');
    return null;
  }

  try {
    const baseUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
    const params = new URLSearchParams({
      place_id: placeId,
      key: GOOGLE_PLACES_API_KEY,
      fields: 'place_id,name,formatted_address,formatted_phone_number,website,url,rating,user_ratings_total,photos,types,opening_hours,price_level,reviews,geometry',
    });

    const response = await fetch(`${baseUrl}?${params.toString()}`);
    const result = await response.json();

    if (result.status !== 'OK') {
      console.error('[PlacesService] API error:', result.status, result.error_message);
      return null;
    }

    const place = result.result;

    // Transform to our format
    const details: PlaceDetails = {
      placeId: place.place_id,
      name: place.name,
      address: place.formatted_address,
      phone: place.formatted_phone_number,
      website: place.website,
      googleMapsUrl: place.url,
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      category: place.types?.[0]?.replace(/_/g, ' ') || 'Business',
      categories: place.types?.map((t: string) => t.replace(/_/g, ' ')) || [],
      location: place.geometry?.location,
      priceLevel: place.price_level,
      openingHours: place.opening_hours?.weekday_text,
      isOpenNow: place.opening_hours?.open_now,
      photoReferences: place.photos?.slice(0, 5).map((p: any) => p.photo_reference) || [],
      reviews: place.reviews?.slice(0, 5).map((r: any) => ({
        author: r.author_name,
        rating: r.rating,
        text: r.text,
        time: r.relative_time_description,
      })) || [],
    };

    console.log('[PlacesService] Details retrieved for:', details.name);
    return details;
  } catch (error: any) {
    console.error('[PlacesService] Error getting place details:', error);
    return null;
  }
};

/**
 * Get the URL for a place photo
 * @param photoReference Photo reference from Places API
 * @param maxWidth Maximum width in pixels
 */
export const getPlacePhotoUrl = (photoReference: string, maxWidth: number = 400): string => {
  if (!photoReference || !GOOGLE_PLACES_API_KEY) {
    return '';
  }
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;
};

/**
 * Format price level to dollar signs
 */
export const formatPriceLevel = (priceLevel?: number): string => {
  if (priceLevel === undefined || priceLevel === null) return '';
  return '$'.repeat(priceLevel);
};

/**
 * Format rating with stars
 */
export const formatRating = (rating?: number): string => {
  if (rating === undefined || rating === null) return 'No rating';
  return `${rating.toFixed(1)} ★`;
};

/**
 * Get a display-friendly category name
 */
export const formatCategory = (category: string): string => {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
