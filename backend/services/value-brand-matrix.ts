import { google } from 'googleapis';
import { ValueAlignment } from '@/types';

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const matrixCache = new Map<string, { data: any; timestamp: number }>();

// Initialize Google Sheets API (same as google-sheets.ts)
function getGoogleSheetsClient() {
  const serviceAccountFile = process.env.GOOGLE_SERVICE_ACCOUNT_FILE;
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;

  let auth;

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
    auth = apiKey;
  } else {
    throw new Error('Google Sheets credentials not found');
  }

  return google.sheets({ version: 'v4', auth });
}

// Get data from cache or fetch fresh
async function getCachedOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const cached = matrixCache.get(key);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL) {
    console.log(`[Matrix] Cache hit for ${key}`);
    return cached.data as T;
  }

  console.log(`[Matrix] Cache miss for ${key}, fetching fresh data...`);
  const data = await fetchFn();
  matrixCache.set(key, { data, timestamp: now });
  return data;
}

export interface ValueBrandMatrix {
  valueId: string;
  valueName: string;
  valueCategory: string;
  aligned: string[]; // Brand IDs in rank order (position 1-10)
  unaligned: string[]; // Brand IDs in rank order (position 1-10)
}

/**
 * Fetch value-brand matrix from Google Sheets
 *
 * Expected format:
 * Column A: id
 * Column B: name
 * Column C: category
 * Columns D-M: aligned1 through aligned10
 * Columns N-W: unaligned1 through unaligned10
 */
export async function fetchValueBrandMatrix(): Promise<ValueBrandMatrix[]> {
  return getCachedOrFetch('value-brand-matrix', async () => {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    const sheetName = process.env.SHEET_NAME_VALUES || 'Values';

    if (!spreadsheetId) {
      throw new Error('GOOGLE_SPREADSHEET_ID not set in environment variables');
    }

    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A2:W`, // Skip header row, columns A-W (23 columns total)
      });

      const rows = response.data.values || [];
      console.log(`[Matrix] Fetched ${rows.length} value rows from Google Sheets`);

      const matrix: ValueBrandMatrix[] = rows
        .filter((row) => row[0] && row[1]) // Must have id and name
        .map((row) => {
          // Columns D-M (indices 3-12) = aligned1-aligned10
          const aligned: string[] = [];
          for (let i = 3; i <= 12; i++) {
            if (row[i]) aligned.push(row[i].trim());
          }

          // Columns N-W (indices 13-22) = unaligned1-unaligned10
          const unaligned: string[] = [];
          for (let i = 13; i <= 22; i++) {
            if (row[i]) unaligned.push(row[i].trim());
          }

          return {
            valueId: row[0].trim(),
            valueName: row[1].trim(),
            valueCategory: row[2]?.trim() || 'General',
            aligned,
            unaligned,
          };
        });

      // Validation warnings
      matrix.forEach((value) => {
        if (value.aligned.length !== 10) {
          console.warn(
            `[Matrix] Warning: "${value.valueName}" has ${value.aligned.length}/10 aligned brands`
          );
        }
        if (value.unaligned.length !== 10) {
          console.warn(
            `[Matrix] Warning: "${value.valueName}" has ${value.unaligned.length}/10 unaligned brands`
          );
        }
      });

      return matrix;
    } catch (error: any) {
      console.error('[Matrix] Error fetching value-brand matrix:', error.message);
      throw new Error(
        `Failed to fetch value-brand matrix from Google Sheets: ${error.message}`
      );
    }
  });
}

/**
 * Build valueAlignments for a specific brand based on the matrix
 *
 * @param brandId - The brand's unique ID
 * @param matrix - The value-brand matrix
 * @returns Array of value alignments for this brand
 */
export function buildValueAlignmentsForBrand(
  brandId: string,
  matrix: ValueBrandMatrix[]
): ValueAlignment[] {
  const alignments: ValueAlignment[] = [];

  matrix.forEach((value) => {
    // Check if brand is in aligned list
    const alignedIndex = value.aligned.indexOf(brandId);
    if (alignedIndex !== -1) {
      alignments.push({
        valueId: value.valueId,
        position: alignedIndex + 1, // Convert 0-indexed to 1-indexed
        isSupport: true,
      });
    }

    // Check if brand is in unaligned list
    const unalignedIndex = value.unaligned.indexOf(brandId);
    if (unalignedIndex !== -1) {
      alignments.push({
        valueId: value.valueId,
        position: unalignedIndex + 1, // Convert 0-indexed to 1-indexed
        isSupport: false,
      });
    }
  });

  return alignments;
}

/**
 * Build valueAlignments for ALL brands based on the matrix
 *
 * @param matrix - The value-brand matrix
 * @returns Map of brandId -> ValueAlignment[]
 */
export function buildAllValueAlignments(
  matrix: ValueBrandMatrix[]
): Map<string, ValueAlignment[]> {
  const brandAlignments = new Map<string, ValueAlignment[]>();

  matrix.forEach((value) => {
    // Process aligned brands
    value.aligned.forEach((brandId, index) => {
      if (!brandAlignments.has(brandId)) {
        brandAlignments.set(brandId, []);
      }
      brandAlignments.get(brandId)!.push({
        valueId: value.valueId,
        position: index + 1,
        isSupport: true,
      });
    });

    // Process unaligned brands
    value.unaligned.forEach((brandId, index) => {
      if (!brandAlignments.has(brandId)) {
        brandAlignments.set(brandId, []);
      }
      brandAlignments.get(brandId)!.push({
        valueId: value.valueId,
        position: index + 1,
        isSupport: false,
      });
    });
  });

  console.log(
    `[Matrix] Built value alignments for ${brandAlignments.size} unique brands`
  );

  return brandAlignments;
}
