#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_SRC_DIR = path.join(ROOT_DIR, 'data-src');
const DATA_DIR = path.join(ROOT_DIR, 'data');

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';

/**
 * Geocoding lookup for common US and international cities
 * Maps location strings to {latitude, longitude}
 */
const CITY_COORDINATES = {
  // Major US Cities
  'Boston, MA, USA': { latitude: 42.3601, longitude: -71.0589 },
  'Boston, MA': { latitude: 42.3601, longitude: -71.0589 },
  'New York, NY, USA': { latitude: 40.7128, longitude: -74.0060 },
  'New York, NY': { latitude: 40.7128, longitude: -74.0060 },
  'San Francisco, CA, USA': { latitude: 37.7749, longitude: -122.4194 },
  'San Francisco, CA': { latitude: 37.7749, longitude: -122.4194 },
  'Los Angeles, CA, USA': { latitude: 34.0522, longitude: -118.2437 },
  'Los Angeles, CA': { latitude: 34.0522, longitude: -118.2437 },
  'Seattle, WA, USA': { latitude: 47.6062, longitude: -122.3321 },
  'Seattle, WA': { latitude: 47.6062, longitude: -122.3321 },
  'Chicago, IL, USA': { latitude: 41.8781, longitude: -87.6298 },
  'Chicago, IL': { latitude: 41.8781, longitude: -87.6298 },
  'Austin, TX, USA': { latitude: 30.2672, longitude: -97.7431 },
  'Austin, TX': { latitude: 30.2672, longitude: -97.7431 },
  'Houston, TX, USA': { latitude: 29.7604, longitude: -95.3698 },
  'Houston, TX': { latitude: 29.7604, longitude: -95.3698 },
  'Dallas, TX, USA': { latitude: 32.7767, longitude: -96.7970 },
  'Dallas, TX': { latitude: 32.7767, longitude: -96.7970 },
  'Atlanta, GA, USA': { latitude: 33.7490, longitude: -84.3880 },
  'Atlanta, GA': { latitude: 33.7490, longitude: -84.3880 },
  'Miami, FL, USA': { latitude: 25.7617, longitude: -80.1918 },
  'Miami, FL': { latitude: 25.7617, longitude: -80.1918 },
  'Denver, CO, USA': { latitude: 39.7392, longitude: -104.9903 },
  'Denver, CO': { latitude: 39.7392, longitude: -104.9903 },
  'Phoenix, AZ, USA': { latitude: 33.4484, longitude: -112.0740 },
  'Phoenix, AZ': { latitude: 33.4484, longitude: -112.0740 },
  'Philadelphia, PA, USA': { latitude: 39.9526, longitude: -75.1652 },
  'Philadelphia, PA': { latitude: 39.9526, longitude: -75.1652 },
  'Washington, DC, USA': { latitude: 38.9072, longitude: -77.0369 },
  'Washington, DC': { latitude: 38.9072, longitude: -77.0369 },
  'Portland, OR, USA': { latitude: 45.5152, longitude: -122.6784 },
  'Portland, OR': { latitude: 45.5152, longitude: -122.6784 },
  'San Diego, CA, USA': { latitude: 32.7157, longitude: -117.1611 },
  'San Diego, CA': { latitude: 32.7157, longitude: -117.1611 },
  'Las Vegas, NV, USA': { latitude: 36.1699, longitude: -115.1398 },
  'Las Vegas, NV': { latitude: 36.1699, longitude: -115.1398 },
  'Detroit, MI, USA': { latitude: 42.3314, longitude: -83.0458 },
  'Detroit, MI': { latitude: 42.3314, longitude: -83.0458 },
  'Minneapolis, MN, USA': { latitude: 44.9778, longitude: -93.2650 },
  'Minneapolis, MN': { latitude: 44.9778, longitude: -93.2650 },
  'Nashville, TN, USA': { latitude: 36.1627, longitude: -86.7816 },
  'Nashville, TN': { latitude: 36.1627, longitude: -86.7816 },
  'Pittsburgh, PA, USA': { latitude: 40.4406, longitude: -79.9959 },
  'Pittsburgh, PA': { latitude: 40.4406, longitude: -79.9959 },
  'Cincinnati, OH, USA': { latitude: 39.1031, longitude: -84.5120 },
  'Cincinnati, OH': { latitude: 39.1031, longitude: -84.5120 },
  'Bentonville, AR, USA': { latitude: 36.3729, longitude: -94.2088 },
  'Bentonville, AR': { latitude: 36.3729, longitude: -94.2088 },
  'Cupertino, CA, USA': { latitude: 37.3230, longitude: -122.0322 },
  'Cupertino, CA': { latitude: 37.3230, longitude: -122.0322 },
  'Menlo Park, CA, USA': { latitude: 37.4530, longitude: -122.1817 },
  'Menlo Park, CA': { latitude: 37.4530, longitude: -122.1817 },
  'Mountain View, CA, USA': { latitude: 37.3861, longitude: -122.0839 },
  'Mountain View, CA': { latitude: 37.3861, longitude: -122.0839 },
  'Redmond, WA, USA': { latitude: 47.6740, longitude: -122.1215 },
  'Redmond, WA': { latitude: 47.6740, longitude: -122.1215 },
  // International Cities
  'London, UK': { latitude: 51.5074, longitude: -0.1278 },
  'Paris, France': { latitude: 48.8566, longitude: 2.3522 },
  'Tokyo, Japan': { latitude: 35.6762, longitude: 139.6503 },
  'Toronto, Canada': { latitude: 43.6532, longitude: -79.3832 },
  'Sydney, Australia': { latitude: -33.8688, longitude: 151.2093 },
};

/**
 * Geocode a location using Google Geocoding API
 * @param {string} location - The location string to geocode
 * @returns {Promise<{latitude: number, longitude: number} | null>}
 */
async function geocodeLocation(location) {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn('[Geocoding] No Google Places API key found, skipping geocoding for:', location);
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${GOOGLE_PLACES_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      console.log(`[Geocoding] ✓ Successfully geocoded "${location}" to (${lat}, ${lng})`);
      return { latitude: lat, longitude: lng };
    } else {
      console.warn(`[Geocoding] ✗ Failed to geocode "${location}": ${data.status}`);
      return null;
    }
  } catch (error) {
    console.error(`[Geocoding] Error geocoding "${location}":`, error.message);
    return null;
  }
}

/**
 * Parse CSV string to array of objects
 * Handles quoted fields with commas inside them
 */
function parseCSV(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  // Parse a single CSV line, handling quoted values
  function parseLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    // Add last field
    values.push(current.trim());
    return values;
  }

  const headers = parseLine(lines[0]).map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return rows;
}

/**
 * Convert brands.csv to brands.json
 * Expected columns: id, name, category, description, website, Headquarters Location,
 *                   affiliate1, $affiliate1, affiliate2, $affiliate2, etc.
 *                   ownership1-5, ownership Sources
 */
async function convertBrands() {
  console.log('Converting brands.csv...');

  const csvPath = path.join(DATA_SRC_DIR, 'brands.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('❌ brands.csv not found at:', csvPath);
    return;
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(csvContent);

  const brands = await Promise.all(rows.map(async row => {
    // Parse affiliates from affiliate1-5 and $affiliate1-5 columns
    const affiliates = [];
    for (let i = 1; i <= 5; i++) {
      const name = row[`affiliate${i}`];
      const relationship = row[`$affiliate${i}`];

      if (name && name.trim()) {
        affiliates.push({
          name: name.trim(),
          relationship: relationship ? relationship.trim() : 'Unknown'
        });
      }
    }

    // Parse ownership from ownership1-5 columns
    // Extracts percentages or other info in parentheses into relationship field
    const ownership = [];
    for (let i = 1; i <= 5; i++) {
      const ownershipEntry = row[`ownership${i}`];

      if (ownershipEntry && ownershipEntry.trim()) {
        const entry = ownershipEntry.trim();
        // Match pattern: "Name (percentage/info)" or just "Name"
        const match = entry.match(/^(.+?)\s*\(([^)]+)\)$/);

        if (match) {
          // Found parentheses - split into name and relationship
          ownership.push({
            name: match[1].trim(),
            relationship: match[2].trim()
          });
        } else {
          // No parentheses - use full text as name
          ownership.push({
            name: entry,
            relationship: ''
          });
        }
      }
    }

    // Parse location from "Headquarters Location" column (with fallback to old "location")
    const location = row['Headquarters Location']?.trim() || row.location?.trim() || '';

    // Try to get coordinates from CSV first, then from geocoding lookup
    let latitude = row.latitude?.trim() ? parseFloat(row.latitude) : undefined;
    let longitude = row.longitude?.trim() ? parseFloat(row.longitude) : undefined;

    // If no coordinates in CSV but we have a location string, try geocoding
    if ((!latitude || !longitude) && location) {
      // Try hardcoded lookup first
      const coords = CITY_COORDINATES[location];
      if (coords) {
        latitude = coords.latitude;
        longitude = coords.longitude;
      } else {
        // Fallback to Google Geocoding API
        const geocoded = await geocodeLocation(location);
        if (geocoded) {
          latitude = geocoded.latitude;
          longitude = geocoded.longitude;
        }
      }
    }

    // Parse ownership sources (column name is just "Sources")
    const ownershipSources = row['Sources']?.trim() || '';

    const brand = {
      id: row.id || '',
      name: row.name || '',
      category: row.category || 'Uncategorized',
      description: row.description || '',
      website: row.website || '',
      affiliates: affiliates,
      ownership: ownership
    };

    // Only include location fields if they have values
    if (location) {
      brand.location = location;
    }
    if (latitude !== undefined && !isNaN(latitude)) {
      brand.latitude = latitude;
    }
    if (longitude !== undefined && !isNaN(longitude)) {
      brand.longitude = longitude;
    }

    // Include ownership sources if present
    if (ownershipSources) {
      brand.ownershipSources = ownershipSources;
    }

    return brand;
  }));

  const outputPath = path.join(DATA_DIR, 'brands.json');
  fs.writeFileSync(outputPath, JSON.stringify(brands, null, 2));
  console.log(`✅ Converted ${brands.length} brands to ${outputPath}`);
}

/**
 * Convert values.csv to values.json
 * Expected format: id, name, category, aligned1-10, unaligned1-10
 * Each row is a value with multiple brand columns
 */
function convertValues() {
  console.log('Converting values.csv...');

  const csvPath = path.join(DATA_SRC_DIR, 'values.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('❌ values.csv not found at:', csvPath);
    return;
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(csvContent);

  console.log(`📊 Parsed ${rows.length} rows from values.csv`);
  if (rows.length > 0) {
    console.log('📋 First row columns:', Object.keys(rows[0]));
  }

  // Convert wide format to nested format
  const valuesMap = {};

  rows.forEach((row) => {
    const valueId = row.id;
    const valueName = row.name;

    if (!valueId || !valueName) {
      console.log('⚠️  Skipping row: missing id or name');
      return;
    }

    // Collect aligned brands from aligned1, aligned2, ..., aligned10 columns
    const support = [];
    for (let i = 1; i <= 10; i++) {
      const brandName = row[`aligned${i}`];
      if (brandName && brandName.trim() && brandName !== '') {
        support.push(brandName.trim());
      }
    }

    // Collect unaligned brands from unaligned1, unaligned2, ..., unaligned10 columns
    const oppose = [];
    for (let i = 1; i <= 10; i++) {
      const brandName = row[`unaligned${i}`];
      if (brandName && brandName.trim() && brandName !== '') {
        oppose.push(brandName.trim());
      }
    }

    valuesMap[valueId] = {
      id: valueId,
      name: valueName,
      support: support,
      oppose: oppose
    };

    console.log(`✓ ${valueName}: ${support.length} aligned, ${oppose.length} unaligned`);
  });

  const outputPath = path.join(DATA_DIR, 'values.json');
  fs.writeFileSync(outputPath, JSON.stringify(valuesMap, null, 2));

  console.log(`✅ Converted ${Object.keys(valuesMap).length} values to ${outputPath}`);
}

// Main execution
(async () => {
  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Run conversions
  console.log('🔄 Starting CSV to JSON conversion...\n');
  await convertBrands();
  convertValues();
  console.log('\n✨ Conversion complete!');
})();
