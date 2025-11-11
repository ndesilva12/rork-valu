/**
 * Logo URL utility for generating brand logos using logo.dev API
 * Falls back to Stand app logo if logo.dev fails
 */

// Stand app logo fallback
const STAND_LOGO_FALLBACK = 'https://upright.money/icon-512.png';

// Logo.dev API key (use publishable key for client-side requests)
const LOGO_DEV_API_KEY = process.env.EXPO_PUBLIC_LOGO_DEV_API_KEY || 'pk_NmXtbgd3TRWfEXgPZ_qtzw';

/**
 * Extract domain from a full URL
 * @param url - Full URL (e.g., "https://www.apple.com/store")
 * @returns Domain (e.g., "apple.com")
 */
function extractDomain(url: string): string {
  try {
    // Handle URLs without protocol
    const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`;
    const urlObj = new URL(urlWithProtocol);
    // Remove www. prefix if present
    return urlObj.hostname.replace(/^www\./, '');
  } catch (error) {
    console.warn('[Logo] Failed to extract domain from URL:', url, error);
    // Return the URL as-is if parsing fails, logo.dev might still handle it
    return url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  }
}

/**
 * Generate logo URL using logo.dev API
 * @param websiteUrl - Company website URL or domain
 * @param options - Optional parameters for logo customization
 * @returns Logo URL
 */
export function getLogoUrl(
  websiteUrl: string,
  options: {
    size?: number;
    format?: 'png' | 'jpg' | 'svg';
    fallback?: string;
  } = {}
): string {
  const { size = 128, format = 'png', fallback = STAND_LOGO_FALLBACK } = options;

  // If no website URL provided, return fallback
  if (!websiteUrl || websiteUrl.trim() === '') {
    return fallback;
  }

  const domain = extractDomain(websiteUrl);

  // Generate logo.dev URL with API key
  return `https://img.logo.dev/${domain}?token=${LOGO_DEV_API_KEY}&size=${size}&format=${format}`;
}

/**
 * Get fallback logo URL (Stand app logo)
 * @returns Stand logo URL
 */
export function getFallbackLogoUrl(): string {
  return STAND_LOGO_FALLBACK;
}

/**
 * Check if a URL is a logo.dev URL
 * @param url - URL to check
 * @returns true if URL is from logo.dev
 */
export function isLogoDevUrl(url: string): boolean {
  return url.includes('logo.dev');
}
