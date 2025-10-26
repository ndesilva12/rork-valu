// backend/services/google-sheets.ts
import { google } from 'googleapis';
import type { Brand, ValueAlignment, Affiliate } from '@/types';
import type { Shareholder } from '@/types';

// Simple in-memory cache
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes
const cache = new Map<string, { data: any; timestamp: number }>();

// Initialize Google Sheets API
function getGoogleSheetsClient() {
  const serviceAccountFile = process.env.GOOGLE_SERVICE_ACCOUNT_FILE;
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;

  let auth: any;

  if (serviceAccountFile) {
    auth = new google.auth.GoogleAuth({
      keyFile: serviceAccountFile,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
  } else if (serviceAccountJson) {
    const credentials = JSON.parse(serviceAccountJson);
    auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
  } else if (apiKey) {
    // For public sheets, the google client can accept the API key as auth
    auth = apiKey;
  } else {
    throw new Error(
      'Google Sheets credentials not found. Please set either GOOGLE_SERVICE_ACCOUNT_FILE, GOOGLE_SERVICE_ACCOUNT_JSON, or GOOGLE_SHEETS_API_KEY in your environment.'
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

// Safe JSON parsing helper
function parseJsonField(value: string | undefined, defaultValue: any = []) {
  if (!value) return defaultValue;
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn('[Sheets] Failed to parse JSON field:', value);
    return defaultValue;
  }
}

// Fetch causes/values from Google Sheets
export async function fetchCausesFromSheets(): Promise<any[]> {
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

      const causes = rows
        .filter((row) => row[0] && row[1] && row[2])
        .map((row) => ({
          id: row[0],
          name: row[1],
          category: row[2],
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

// Fetch brands from Google Sheets (expanded to include affiliate pairs G..P)
export async function fetchBrandsFromSheets(): Promise<Brand[]> {
  return getCachedOrFetch('brands', async () => {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    const sheetName = process.env.SHEET_NAME_BRANDS || 'Brands';

    if (!spreadsheetId) {
      throw new Error('GOOGLE_SPREADSHEET_ID not set in environment variables');
    }

    try {
      // Include up to column P (A..P) so we can read affiliate pairs in G..P
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A2:P`, // Skip header row, columns A-P
      });

      const rows = response.data.values || [];
      console.log(`[Sheets] Fetched ${rows.length} brands from Google Sheets`);

      const brands: Brand[] = rows
        .filter((row) => row[0] && row[1]) // Must have id and name
        .map((row) => {
          // Note: row indexes: A=0, B=1, C=2, D=3, E=4, F=5, G=6, H=7, I=8, J=9, K=10, L=11, M=12, N=13, O=14, P=15
          const shareholders = parseJsonField(row[12], []); // column M (index 12)
          const brandName = row[1] || '';
          const moneyFlowCompany = row[11] || brandName; // column L (index 11)
          const alignmentScore = parseFloat(row[7]) || 0;

          // Build affiliates from pairs:
          // (G,H) => (6,7), (I,J) => (8,9), (K,L) => (10,11), (M,N) => (12,13), (O,P) => (14,15)
          const affiliatePairs: Array<[number, number]> = [
            [6, 7],
            [8, 9],
            [10, 11],
            [12, 13],
            [14, 15],
          ];

          const affiliates: Affiliate[] = [];
          for (const [nameIdx, commitmentIdx] of affiliatePairs) {
            const rawName = row[nameIdx];
            const rawCommitment = row[commitmentIdx];

            const name =
              typeof rawName === 'string'
                ? rawName.trim()
                : rawName != null
                ? String(rawName).trim()
                : '';
            const commitment =
              typeof rawCommitment === 'string'
                ? rawCommitment.trim()
                : rawCommitment != null
                ? String(rawCommitment).trim()
                : '';

            if (name || commitment) {
              affiliates.push({
                name,
                commitment,
              });
            }
          }

          const moneyFlow = {
            company: moneyFlowCompany,
            shareholders,
            overallAlignment: alignmentScore,
            affiliates,
          };

          return {
            id: row[0],
            name: brandName,
            category: row[3] || 'Uncategorized',
            imageUrl: row[4] || '',
            exampleImageUrl: row[5] || row[4] || '',
            description: row[6] || '',
            alignmentScore,
            keyReasons: parseJsonField(row[8], []),
            relatedValues: parseJsonField(row[9], []),
            website: row[10] || undefined,
            moneyFlow,
            valueAlignments: parseJsonField(row[13], []),
          };
        });

      return brands;
    } catch (error: any) {
      console.error('[Sheets] Error fetching brands:', error.message);
      throw new Error(`Failed to fetch brands from Google Sheets: ${error.message}`);
    }
  });
}

// Fetch local businesses from Google Sheets (keeps existing behavior)
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
        .filter((row) => row[0] && row[1])
        .map((row) => {
          const shareholders = parseJsonField(row[12], []);
          const brandName = row[1];
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
