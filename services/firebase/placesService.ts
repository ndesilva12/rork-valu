/**
 * Google Places Service
 *
 * Provides access to Google Places API via Firebase Functions
 * for searching and getting details of external businesses
 */

import { getFunctions, httpsCallable } from 'firebase/functions';

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

// Get Firebase Functions instance
const functions = getFunctions();

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
  try {
    const searchPlacesFunc = httpsCallable<
      { query: string; location?: { lat: number; lng: number }; radius?: number },
      { places: PlaceSearchResult[] }
    >(functions, 'searchPlaces');

    const result = await searchPlacesFunc({ query, location, radius });
    return result.data.places;
  } catch (error: any) {
    console.error('[PlacesService] Error searching places:', error);

    // Return empty array on error to fail gracefully
    if (error.code === 'functions/failed-precondition') {
      console.warn('[PlacesService] Google Places API not configured');
    }

    return [];
  }
};

/**
 * Get detailed information about a specific place
 * @param placeId Google Place ID
 */
export const getPlaceDetails = async (placeId: string): Promise<PlaceDetails | null> => {
  try {
    const getPlaceDetailsFunc = httpsCallable<
      { placeId: string },
      { place: PlaceDetails }
    >(functions, 'getPlaceDetails');

    const result = await getPlaceDetailsFunc({ placeId });
    return result.data.place;
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
  // This will use the Firebase Function endpoint
  // The function ID will be auto-generated, so we need the full URL
  // For now, we'll construct a placeholder that the app can use
  const region = 'us-central1'; // Update this to match your Firebase region
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '';

  if (!projectId) {
    console.warn('[PlacesService] Firebase project ID not configured for photo URLs');
    return '';
  }

  return `https://${region}-${projectId}.cloudfunctions.net/getPlacePhoto?ref=${encodeURIComponent(photoReference)}&maxwidth=${maxWidth}`;
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
