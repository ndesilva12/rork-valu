#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_SRC_DIR = path.join(ROOT_DIR, 'data-src');
const DATA_DIR = path.join(ROOT_DIR, 'data');

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
function convertBrands() {
  console.log('Converting brands.csv...');

  const csvPath = path.join(DATA_SRC_DIR, 'brands.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('❌ brands.csv not found at:', csvPath);
    return;
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(csvContent);

  const brands = rows.map(row => {
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
    const latitude = row.latitude?.trim() ? parseFloat(row.latitude) : undefined;
    const longitude = row.longitude?.trim() ? parseFloat(row.longitude) : undefined;

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
  });

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

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Run conversions
console.log('🔄 Starting CSV to JSON conversion...\n');
convertBrands();
convertValues();
console.log('\n✨ Conversion complete!');
