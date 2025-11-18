import { Brand } from '@/types';
import { ValueItem } from '@/mocks/causes';

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const cache = new Map<string, { data: any; timestamp: number }>();

// Fetch data from Google Sheets using direct API calls (Edge Runtime compatible)
async function fetchSheetData(range: string): Promise<any[][]> {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;

  if (!spreadsheetId) {
    throw new Error('GOOGLE_SPREADSHEET_ID not set in environment variables');
  }

  if (!apiKey) {
    throw new Error('GOOGLE_SHEETS_API_KEY not set in environment variables. Make sure your Google Sheet is publicly accessible.');
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`;

  console.log('[Sheets] Fetching from URL:', url.replace(apiKey, 'API_KEY_HIDDEN'));

  const response = await fetch(url);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Sheets] API error response:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText,
    });
    throw new Error(`Google Sheets API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  return data.values || [];
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

// Fetch causes/values from Google Sheets
export async function fetchCausesFromSheets(): Promise<ValueItem[]> {
  return getCachedOrFetch('causes', async () => {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    const sheetName = process.env.SHEET_NAME_CAUSES || 'Causes';

    if (!spreadsheetId) {
      throw new Error('GOOGLE_SPREADSHEET_ID not set in environment variables');
    }

    try {
      const rows = await fetchSheetData(`${sheetName}!A2:E`);
      console.log(`[Sheets] Fetched ${rows.length} causes from Google Sheets`);

      const causes: ValueItem[] = rows
        .filter((row) => row[0] && row[1] && row[2]) // Must have id, name, category
        .map((row) => ({
          id: row[0],
          name: row[1],
          category: row[2] as any,
          description: row[3] || undefined,
          imageUrl: row[4] || undefined,
        }));

      return causes;
    } catch (error: any) {
      console.error('[Sheets] Error fetching causes:', error.message);
      throw new Error(`Failed to fetch causes from Google Sheets: ${error.message}`);
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
    console.log('[Sheets] Starting fetchBrandsFromSheets');

    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    const sheetName = process.env.SHEET_NAME_BRANDS || 'Brands';

    console.log('[Sheets] Config:', {
      spreadsheetId: spreadsheetId ? `${spreadsheetId.substring(0, 10)}...` : 'NOT SET',
      sheetName,
      hasApiKey: !!process.env.GOOGLE_SHEETS_API_KEY,
      hasServiceAccountFile: !!process.env.GOOGLE_SERVICE_ACCOUNT_FILE,
      hasServiceAccountJson: !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
    });

    if (!spreadsheetId) {
      throw new Error('GOOGLE_SPREADSHEET_ID not set in environment variables');
    }

    try {
      console.log('[Sheets] Fetching data from range:', `${sheetName}!A2:P`);
      const rows = await fetchSheetData(`${sheetName}!A2:P`);
      console.log(`[Sheets] Fetched ${rows.length} brands from Google Sheets`);

      const brands: Brand[] = rows
        .filter((row) => row[0] && row[1]) // Must have id and name
        .map((row) => {
          const brandName = row[1]; // Brand name (e.g., "Apple", "Nike")

          // Parse affiliates from columns G-P (indices 6-15)
          // affiliate1: row[6], $affiliate1: row[7]
          // affiliate2: row[8], $affiliate2: row[9]
          // affiliate3: row[10], $affiliate3: row[11]
          // affiliate4: row[12], $affiliate4: row[13]
          // affiliate5: row[14], $affiliate5: row[15]
          const affiliates = [];
          for (let i = 0; i < 5; i++) {
            const affiliateIndex = 6 + (i * 2);
            const relationshipIndex = 7 + (i * 2);
            const affiliateName = row[affiliateIndex];
            const relationship = row[relationshipIndex];

            if (affiliateName && affiliateName.trim()) {
              affiliates.push({
                name: affiliateName,
                relationship: relationship || 'Unknown',
              });
            }
          }

          return {
            id: row[0],
            name: brandName,
            category: row[2] || 'Uncategorized',
            imageUrl: row[3] || '', // Brand logo
            description: row[4] || '', // Brand description
            website: row[5] || undefined,
            affiliates,
            // Default values for backward compatibility
            alignmentScore: 0,
            keyReasons: [],
            relatedValues: [],
            valueAlignments: [],
            moneyFlow: {
              company: brandName,
              shareholders: [],
              overallAlignment: 0,
            },
          };
        });

      console.log('[Sheets] Successfully parsed brands:', brands.length);
      return brands;
    } catch (error: any) {
      console.error('[Sheets] Error fetching brands:', {
        message: error.message,
        code: error.code,
        status: error.status,
        errors: error.errors,
        stack: error.stack,
      });
      throw new Error(`Failed to fetch brands from Google Sheets: ${error.message}`);
    }
  });
}

// Fetch local businesses from Google Sheets
export async function fetchLocalBusinessesFromSheets(): Promise<Brand[]> {
  return getCachedOrFetch('local-businesses', async () => {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    const sheetName = process.env.SHEET_NAME_LOCAL_BUSINESSES || 'Local Businesses';

    if (!spreadsheetId) {
      throw new Error('GOOGLE_SPREADSHEET_ID not set in environment variables');
    }

    try {
      const rows = await fetchSheetData(`${sheetName}!A2:N`);
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

// Search brands with user cause relevance
export function searchBrands(brands: Brand[], query: string, userCauses: string[]): Brand[] {
  const lowerQuery = query.toLowerCase();

  const filtered = brands.filter(
    (brand) =>
      brand.name.toLowerCase().includes(lowerQuery) ||
      brand.category.toLowerCase().includes(lowerQuery)
  );

  return filtered.sort((a, b) => {
    const aRelevance = calculateRelevance(a, userCauses);
    const bRelevance = calculateRelevance(b, userCauses);
    return bRelevance - aRelevance;
  });
}

function calculateRelevance(brand: Brand, userCauses: string[]): number {
  // All brands now default to score of 50
  const baseScore = 50;

  if (userCauses.length === 0) return baseScore;

  const hasMatchingCause = brand.relatedValues.some((v) => userCauses.includes(v));

  if (hasMatchingCause) {
    return baseScore + 100;
  }

  return baseScore;
}

// Clear cache (useful for testing or manual refresh)
export function clearCache() {
  cache.clear();
  console.log('[Sheets] Cache cleared');
}
