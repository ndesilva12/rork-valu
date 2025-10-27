/* backend/services/google-sheets.ts */
/* Unified sheets service: prefer Apps Script endpoint (SHEETS_API_URL) if configured,
   otherwise use Google Sheets API (GOOGLE_SHEETS_API_KEY + GOOGLE_SPREADSHEET_ID). */

const APPS_SCRIPT_URL = process.env.SHEETS_API_URL || "";
const APPS_SCRIPT_KEY = process.env.SHEETS_API_KEY || "";
const GOOGLE_API_KEY = process.env.GOOGLE_SHEETS_API_KEY || "";
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || "";
const SHEET_NAME_BRANDS = process.env.SHEET_NAME_BRANDS || "Brands";
const SHEET_NAME_LOCAL_BUSINESSES = process.env.SHEET_NAME_LOCAL_BUSINESSES || "Local Businesses";
const SHEET_NAME_CAUSES = process.env.SHEET_NAME_CAUSES || "Causes";

function parseRows(values: any[][]) {
  if (!Array.isArray(values) || values.length === 0) return [];
  const headers = values[0].map((h: any) => (h == null ? "" : String(h).trim()));
  const rows: any[] = [];
  for (let r = 1; r < values.length; r++) {
    const rowArr = values[r];
    if (!rowArr) continue;
    const row: any = {};
    for (let c = 0; c < headers.length; c++) {
      const keyRaw = headers[c] || `col${c}`;
      const key = String(keyRaw).trim();
      row[key] = rowArr[c] === undefined ? null : rowArr[c];
    }
    rows.push(row);
  }
  return rows;
}

async function fetchFromAppsScript(action: string, params: Record<string, string> = {}) {
  if (!APPS_SCRIPT_URL) throw new Error("SHEETS_API_URL not configured");
  try {
    const u = new URL(APPS_SCRIPT_URL);
    u.searchParams.set("action", action);
    for (const k of Object.keys(params)) {
      u.searchParams.set(k, params[k]);
    }
    if (APPS_SCRIPT_KEY) u.searchParams.set("apiKey", APPS_SCRIPT_KEY);
    const res = await fetch(u.toString(), { method: "GET" });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Apps Script returned ${res.status} ${res.statusText} ${text}`);
    }
    const payload = await res.json();
    return payload?.result ?? payload;
  } catch (err) {
    console.error("[Sheets] fetchFromAppsScript error:", err);
    throw err;
  }
}

async function fetchRangeFromSheetsLegacy(sheetName: string) {
  if (!GOOGLE_API_KEY) {
    throw new Error("GOOGLE_SHEETS_API_KEY is not configured for legacy fetch.");
  }
  if (!SPREADSHEET_ID) {
    throw new Error("GOOGLE_SPREADSHEET_ID is not configured for legacy fetch.");
  }
  try {
    const range = `${encodeURIComponent(`${sheetName}!A:Z`)}`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      SPREADSHEET_ID
    )}/values/${range}?key=${encodeURIComponent(GOOGLE_API_KEY)}`;

    const res = await fetch(url, { method: "GET" });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Google Sheets API returned ${res.status} ${res.statusText} ${text}`);
    }
    const payload = await res.json();
    const values = payload?.values ?? [];
    return parseRows(values);
  } catch (err) {
    console.error("[Sheets] fetchRangeFromSheetsLegacy error:", err);
    throw err;
  }
}

async function fetchFromAppsScriptListBrands() {
  return await fetchFromAppsScript("listBrands");
}
async function fetchFromAppsScriptListLocalBusinesses() {
  return await fetchFromAppsScript("listLocalBusinesses");
}
async function fetchFromAppsScriptListCauses() {
  return await fetchFromAppsScript("listCauses");
}
async function fetchFromAppsScriptGetBrand(id: string) {
  return await fetchFromAppsScript("getBrand", { id });
}

export async function fetchBrandsFromSheetsLegacy(): Promise<any[]> {
  return await fetchRangeFromSheetsLegacy(SHEET_NAME_BRANDS);
}

export async function fetchBrandsFromSheets(): Promise<any[]> {
  if (APPS_SCRIPT_URL) {
    try {
      const rows = await fetchFromAppsScriptListBrands();
      return Array.isArray(rows) ? rows : [];
    } catch (err) {
      console.error("[Sheets] Apps Script brands fetch failed, falling back to legacy:", err);
    }
  }
  return await fetchBrandsFromSheetsLegacy();
}

export async function fetchLocalBusinessesFromSheets(): Promise<any[]> {
  if (APPS_SCRIPT_URL) {
    try {
      const rows = await fetchFromAppsScriptListLocalBusinesses();
      return Array.isArray(rows) ? rows : [];
    } catch (err) {
      console.error("[Sheets] Apps Script local businesses fetch failed, falling back to legacy:", err);
    }
  }
  return await fetchRangeFromSheetsLegacy(SHEET_NAME_LOCAL_BUSINESSES);
}

export async function fetchCausesFromSheets(): Promise<any[]> {
  if (APPS_SCRIPT_URL) {
    try {
      const rows = await fetchFromAppsScriptListCauses();
      return Array.isArray(rows) ? rows : [];
    } catch (err) {
      console.error("[Sheets] Apps Script causes fetch failed, falling back to legacy:", err);
    }
  }
  return await fetchRangeFromSheetsLegacy(SHEET_NAME_CAUSES);
}

export async function fetchBrandFromAppsScript(brandId: string): Promise<any | null> {
  if (APPS_SCRIPT_URL) {
    try {
      const brand = await fetchFromAppsScriptGetBrand(brandId);
      return brand || null;
    } catch (err) {
      console.error("[Sheets] fetchBrandFromAppsScript failed, falling back to array search:", err);
    }
  }
  const all = await fetchBrandsFromSheets();
  if (!Array.isArray(all)) return null;
  const idLower = String(brandId).toLowerCase();
  for (const r of all) {
    if (r.id && String(r.id).toLowerCase() === idLower) return r;
    if (r.ID && String(r.ID).toLowerCase() === idLower) return r;
    if (r.slug && String(r.slug).toLowerCase() === idLower) return r;
    if (r.name && String(r.name).toLowerCase() === idLower) return r;
    for (const k in r) {
      if (String(k).toLowerCase().includes("id") && String(r[k]).toLowerCase() === idLower) return r;
    }
  }
  return null;
}

export { fetchRangeFromSheetsLegacy as fetchBrandsRangeLegacy }
