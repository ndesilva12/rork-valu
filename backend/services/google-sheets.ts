import { google } from 'googleapis';
import { Product } from '@/types';
import { ValueItem } from '@/mocks/causes';

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

// Fetch causes/values from Google Sheets
export async function fetchCausesFromSheets(): Promise<ValueItem[]> {
  return getCachedOrFetch('causes', async () => {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    const sheetName = process.env.SHEET_NAME_CAUSES || 'Causes';

    if (!spreadsheetId) {
      throw new Error('GOOGLE_SPREADSHEET_ID not set in environment variables');
    }

    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A2:E`, // Skip header row
      });

      const rows = response.data.values || [];
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

// Fetch products from Google Sheets
export async function fetchProductsFromSheets(): Promise<Product[]> {
  return getCachedOrFetch('products', async () => {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    const sheetName = process.env.SHEET_NAME_PRODUCTS || 'Products';

    if (!spreadsheetId) {
      throw new Error('GOOGLE_SPREADSHEET_ID not set in environment variables');
    }

    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A2:N`, // Skip header row, columns A-N
      });

      const rows = response.data.values || [];
      console.log(`[Sheets] Fetched ${rows.length} products from Google Sheets`);

      const products: Product[] = rows
        .filter((row) => row[0] && row[1] && row[2]) // Must have id, name, brand
        .map((row) => {
          const shareholders = parseJsonField(row[12], []);
          const moneyFlow = {
            company: row[11] || row[2], // Use moneyFlowCompany or brand
            shareholders,
            overallAlignment: parseFloat(row[7]) || 0,
          };

          return {
            id: row[0],
            name: row[1],
            brand: row[2],
            category: row[3] || 'Uncategorized',
            imageUrl: row[4] || '',
            productImageUrl: row[5] || row[4] || '',
            productDescription: row[6] || '',
            alignmentScore: parseFloat(row[7]) || 0,
            keyReasons: parseJsonField(row[8], []),
            relatedValues: parseJsonField(row[9], []),
            website: row[10] || undefined,
            moneyFlow,
            valueAlignments: parseJsonField(row[13], []),
          };
        });

      return products;
    } catch (error: any) {
      console.error('[Sheets] Error fetching products:', error.message);
      throw new Error(`Failed to fetch products from Google Sheets: ${error.message}`);
    }
  });
}

// Fetch local businesses from Google Sheets
export async function fetchLocalBusinessesFromSheets(): Promise<Product[]> {
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

      const businesses: Product[] = rows
        .filter((row) => row[0] && row[1] && row[2]) // Must have id, name, brand
        .map((row) => {
          const shareholders = parseJsonField(row[12], []);
          const moneyFlow = {
            company: row[11] || row[2],
            shareholders,
            overallAlignment: parseFloat(row[7]) || 0,
          };

          return {
            id: row[0],
            name: row[1],
            brand: row[2],
            category: row[3] || 'Local Business',
            imageUrl: row[4] || '',
            productImageUrl: row[5] || row[4] || '',
            productDescription: row[6] || '',
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

// Search products with user cause relevance
export function searchProducts(products: Product[], query: string, userCauses: string[]): Product[] {
  const lowerQuery = query.toLowerCase();

  const filtered = products.filter(
    (product) =>
      product.name.toLowerCase().includes(lowerQuery) ||
      product.brand.toLowerCase().includes(lowerQuery) ||
      product.category.toLowerCase().includes(lowerQuery)
  );

  return filtered.sort((a, b) => {
    const aRelevance = calculateRelevance(a, userCauses);
    const bRelevance = calculateRelevance(b, userCauses);
    return bRelevance - aRelevance;
  });
}

function calculateRelevance(product: Product, userCauses: string[]): number {
  if (userCauses.length === 0) return Math.abs(product.alignmentScore);

  const hasMatchingCause = product.relatedValues.some((v) => userCauses.includes(v));

  if (hasMatchingCause) {
    return Math.abs(product.alignmentScore) + 100;
  }

  return Math.abs(product.alignmentScore);
}

// Clear cache (useful for testing or manual refresh)
export function clearCache() {
  cache.clear();
  console.log('[Sheets] Cache cleared');
}
