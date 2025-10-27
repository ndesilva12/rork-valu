import { google } from 'googleapis';
import { Brand } from '@/types';
import { ValueItem } from '@/mocks/causes';
import { fetchValueBrandMatrix, buildAllValueAlignments } from './value-brand-matrix';

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const cache = new Map<string, { data: any; timestamp: number }>();

// Initialize Google Sheets API
function getGoogleSheetsClient() {
  // Check if service account credentials are provided
  const serviceAccountFile = process.env.GOOGLE_SERVICE_ACCOUNT_FILE;
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;

  let auth;

  if (serviceAccountFile) {
    // Method 1: Service account from file
    auth = new google.auth.GoogleAuth({
      keyFile: serviceAccountFile,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
  } else if (serviceAccountJson) {
    // Method 2: Service account from JSON string
    const credentials = JSON.parse(serviceAccountJson);
    auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
  } else if (apiKey) {
    // Method 3: API key (for public sheets)
    auth = apiKey;
  } else {
    throw new Error(
      'Google Sheets credentials not found. Please set either GOOGLE_SERVICE_ACCOUNT_FILE, GOOGLE_SERVICE_ACCOUNT_JSON, or GOOGLE_SHEETS_API_KEY in your .env file.'
    );
  }

  return google.sheets({ version: 'v4', auth });
}

// Get data from cache or fetch fresh
async function getCachedOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const cached = cache.get(key);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL) {
    console.log(`[Sheets] Cache hit for: ${key}`);
    return cached.data as T;
  }

  console.log(`[Sheets] Cache miss for: ${key}, fetching...`);
  const data = await fetchFn();
  cache.set(key, { data, timestamp: now });
  return data;
}

// Fetch values from Google Sheets
// NOTE: Fetches from Values sheet (columns A-C contain id, name, category)
export async function fetchValuesFromSheets(): Promise<ValueItem[]> {
  return getCachedOrFetch('values', async () => {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    const sheetName = process.env.SHEET_NAME_VALUES || 'Values';

    if (!spreadsheetId) {
      throw new Error('GOOGLE_SPREADSHEET_ID not set in environment variables');
    }

    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A2:C`, // Fetch id, name, category from Values sheet
      });

      const rows = response.data.values || [];
      console.log(`[Sheets] Fetched ${rows.length} values from Values sheet`);

      const values: ValueItem[] = rows
        .filter((row) => row[0] && row[1] && row[2]) // Must have id, name, category
        .map((row) => ({
          id: row[0].trim(),
          name: row[1].trim(),
          category: row[2] as any,
        }));

      return values;
    } catch (error: any) {
      console.error('[Sheets] Error fetching values:', error.message);
      throw new Error(`Failed to fetch values from Google Sheets: ${error.message}`);
    }
  });
}

// Parse JSON field safely
function parseJsonField(value: string | undefined, defaultValue: any = []): any {
  if (!value) return defaultValue;
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn('[Sheets] Failed to parse JSON field:', value);
    return defaultValue;
  }
}

// Fetch brands from Google Sheets
export async function fetchBrandsFromSheets(): Promise<Brand[]> {
  return getCachedOrFetch('brands', async () => {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    const sheetName = process.env.SHEET_NAME_BRANDS || 'Brands';

    if (!spreadsheetId) {
      throw new Error('GOOGLE_SPREADSHEET_ID not set in environment variables');
    }

    try {
      // Fetch brands data
      const brandsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A2:P`,
      });

      const rows = brandsResponse.data.values || [];
      console.log(`[Sheets] Fetched ${rows.length} brands from Google Sheets`);

      // Try to fetch value-brand matrix, but make it optional
      let valueAlignmentsMap = new Map<string, any[]>();
      try {
        const valueBrandMatrix = await fetchValueBrandMatrix();
        valueAlignmentsMap = buildAllValueAlignments(valueBrandMatrix);
        console.log(`[Sheets] Successfully loaded value alignments from matrix`);
      } catch (matrixError: any) {
        console.warn(`[Sheets] Could not load value-brand matrix (this is optional): ${matrixError.message}`);
        console.warn(`[Sheets] Continuing without value alignments...`);
      }

       const brands: Brand[] = rows
        .filter((row) => row[0] && row[1]) // Must have id and name
        .map((row) => {
          const brandId = String(row[0] || '').trim();
          const brandName = String(row[1] || '').trim(); // Brand name (e.g., "Apple", "Nike")

          console.log(`[Sheets] Processing brand: ${brandId} (${brandName})`);

          // Parse affiliate data from columns G-P (indices 6-15)
          // affiliate1 (6), $affiliate1 (7), affiliate2 (8), $affiliate2 (9), etc.
          const affiliates: Array<{ name: string; commitment?: string }> = [];
          for (let i = 0; i < 5; i++) {
            const nameIndex = 6 + (i * 2);
            const amountIndex = 7 + (i * 2);
            const rawName = row[nameIndex];
            const rawAmount = row[amountIndex];

            const affiliateName = typeof rawName === 'string' ? rawName.trim() : rawName != null ? String(rawName).trim() : '';
            const affiliateCommitment = typeof rawAmount === 'string' ? rawAmount.trim() : rawAmount != null ? String(rawAmount).trim() : '';

            // Include pair if either name or commitment exists (allows partial rows)
            if (affiliateName || affiliateCommitment) {
              affiliates.push({
                name: affiliateName,
                commitment: affiliateCommitment || undefined,
              });
            }
          }

          console.log(`[Sheets]   - Found ${affiliates.length} affiliates for ${brandId}`);

          // Also attempt to parse legacy shareholders JSON (column M, index 12)
          const parsedShareholders = parseJsonField(row[12], []);

           // For backward compatibility, if parsedShareholders is non-empty, prefer it for 'shareholders',
          // otherwise use affiliates as the 'shareholders' field so other parts of the app expecting shareholders keep working.
          const shareholders = Array.isArray(parsedShareholders) && parsedShareholders.length > 0 ? parsedShareholders : affiliates.map(a => ({
            name: a.name,
            // If $ value looks like a percentage or numeric, leave raw string as-is; further parsing can be added if needed
            percentage: a.commitment ? (isNaN(Number(a.commitment)) ? a.commitment : Number(a.commitment)) : 0,
            alignment: 'neutral',
            causes: [],
          }));

          const moneyFlow = {
            company: brandName,
            shareholders,
            overallAlignment: 0, // Deprecated: alignment is calculated per-user
            // Expose affiliates separately so UI can render Affiliate/Commitment pairs directly
            affiliates,
          };

          // Get valueAlignments from matrix (or empty array if brand not in matrix)
          const valueAlignments = valueAlignmentsMap.get(brandId) || [];

          return {
            id: brandId,
            name: brandName,
            category: row[2]?.trim() || 'Uncategorized',
            imageUrl: row[3]?.trim() || '', // Brand logo
            exampleImageUrl: row[3]?.trim() || '', // Use same image for both (preserve earlier behavior)
            description: row[4]?.trim() || '', // Brand description
            alignmentScore: 0, // Deprecated: use getScoredBrands endpoint for calculated scores
            keyReasons: [], // Not present in this sheet structure
            relatedValues: [], // Not present in this sheet structure
            website: row[5]?.trim() || undefined,
            moneyFlow,
            valueAlignments, // Built from Values sheet
          } as Brand;
        });

      console.log(`[Sheets] Built valueAlignments for ${brands.length} brands from Values sheet`);

      return brands;
    } catch (error: any) {
      console.error('[Sheets] Error fetching brands:', error.message);
      throw new Error(`Failed to fetch brands from Google Sheets: ${error.message}`);
    }
  });
}

// Fetch local businesses from Google Sheets
export async function fetchLocalBusinessesFromSheets(): Promise<Brand[]> {
  return getCachedOrFetch('local-businesses', async () => {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    const sheetName = process.env.SHEET_NAME_LOCAL_BUSINESSES || 'Local Businesses';

    if (!spreadsheetId) {
      throw new Error('GOOGLE_SPREADSHEET_ID not set in environment variables');
    }

    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A2:N`, // Skip header row
      });

      const rows = response.data.values || [];
      console.log(`[Sheets] Fetched ${rows.length} local businesses from Google Sheets`);

      const businesses: Brand[] = rows
        .filter((row) => row[0] && row[1]) // Must have id and name
        .map((row) => {
          const shareholders = parseJsonField(row[12], []);
          const brandName = row[1]; // Business/brand name
          const moneyFlow = {
            company: row[11] || brandName,
            shareholders,
            overallAlignment: parseFloat(row[7]) || 0,
          };

          return {
            id: row[0],
            name: brandName,
            category: row[3] || 'Local Business',
            imageUrl: row[4] || '',
            exampleImageUrl: row[5] || row[4] || '',
            description: row[6] || '',
            alignmentScore: parseFloat(row[7]) || 0,
            keyReasons: parseJsonField(row[8], []),
            relatedValues: parseJsonField(row[9], []),
            website: row[10] || undefined,
            moneyFlow,
            valueAlignments: parseJsonField(row[13], []),
          };
        });

      return businesses;
    } catch (error: any) {
      console.error('[Sheets] Error fetching local businesses:', error.message);
      throw new Error(`Failed to fetch local businesses from Google Sheets: ${error.message}`);
    }
  });
}

// Search brands with user value relevance
export function searchBrands(brands: Brand[], query: string, userValues: string[]): Brand[] {
  const lowerQuery = query.toLowerCase();

  const filtered = brands.filter(
    (brand) =>
      brand.name.toLowerCase().includes(lowerQuery) ||
      brand.category.toLowerCase().includes(lowerQuery)
  );

  return filtered.sort((a, b) => {
    const aRelevance = calculateRelevance(a, userValues);
    const bRelevance = calculateRelevance(b, userValues);
    return bRelevance - aRelevance;
  });
}

function calculateRelevance(brand: Brand, userValues: string[]): number {
  if (userValues.length === 0) return Math.abs(brand.alignmentScore);

  const hasMatchingValue = brand.relatedValues.some((v) => userValues.includes(v));

  if (hasMatchingValue) {
    return Math.abs(brand.alignmentScore) + 100;
  }

  return Math.abs(brand.alignmentScore);
}

// Clear cache (useful for testing or manual refresh)
export function clearCache() {
  cache.clear();
  console.log('[Sheets] Cache cleared');
}
