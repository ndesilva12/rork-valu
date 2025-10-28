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
 * Expected columns: id, name, category, imageUrl, description, website,
 *                   affiliate1, $affiliate1, affiliate2, $affiliate2, etc.
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

    return {
      id: row.id || '',
      name: row.name || '',
      category: row.category || 'Uncategorized',
      imageUrl: row.imageUrl || '',
      description: row.description || '',
      website: row.website || '',
      affiliates: affiliates
    };
  });

  const outputPath = path.join(DATA_DIR, 'brands.json');
  fs.writeFileSync(outputPath, JSON.stringify(brands, null, 2));
  console.log(`✅ Converted ${brands.length} brands to ${outputPath}`);
}

/**
 * Convert values.csv to values.json
 * Expected format: valueId, valueName, support/oppose, brandName columns
 * This creates a mapping of values to their aligned/opposed brands for scoring
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
    console.log('📋 First row data:', rows[0]);
  }

  // Group by value
  const valuesMap = {};
  let skippedRows = 0;

  rows.forEach((row, index) => {
    const valueId = row.id || row.valueId;
    const valueName = row.name || row.valueName;
    const type = row.type; // 'support' or 'oppose'
    const brandName = row.brandName || row.brand;

    if (!valueId || !brandName) {
      skippedRows++;
      if (index < 5) {
        console.log(`⚠️  Skipping row ${index + 1}: missing valueId or brandName`, row);
      }
      return;
    }

    if (!valuesMap[valueId]) {
      valuesMap[valueId] = {
        id: valueId,
        name: valueName,
        support: [],
        oppose: []
      };
    }

    if (type === 'support' || type === 'aligned') {
      valuesMap[valueId].support.push(brandName);
    } else if (type === 'oppose' || type === 'unaligned') {
      valuesMap[valueId].oppose.push(brandName);
    }
  });

  const outputPath = path.join(DATA_DIR, 'values.json');
  fs.writeFileSync(outputPath, JSON.stringify(valuesMap, null, 2));

  if (skippedRows > 0) {
    console.log(`⚠️  Skipped ${skippedRows} rows with missing data`);
  }
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
