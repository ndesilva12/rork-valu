/**
 * Business Enrichment Script
 *
 * This script takes a list of business names and uses Google Places API
 * to fetch complete details including:
 * - Full street address
 * - Latitude & Longitude
 * - Phone number
 * - Website
 * - Formatted address
 * - Place ID
 *
 * Usage: node enrich-businesses.js
 *
 * Requirements:
 * - Google Cloud API Key with Places API enabled
 * - Set GOOGLE_PLACES_API_KEY environment variable
 */

const fs = require('fs');
const path = require('path');

// Configuration
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const INPUT_FILE = path.join(__dirname, 'wellesley-businesses-raw.json');
const OUTPUT_FILE = path.join(__dirname, 'wellesley-businesses-enriched.csv');
const CITY = 'Wellesley';
const STATE = 'MA';
const DELAY_BETWEEN_REQUESTS = 200; // ms to avoid rate limits

// Validate API key
if (!API_KEY) {
  console.error('❌ ERROR: GOOGLE_PLACES_API_KEY environment variable not set');
  console.error('\nTo get an API key:');
  console.error('1. Go to https://console.cloud.google.com/');
  console.error('2. Create a new project or select existing');
  console.error('3. Enable "Places API"');
  console.error('4. Go to Credentials and create an API key');
  console.error('5. Run: export GOOGLE_PLACES_API_KEY="your-key-here"');
  console.error('\nThen run this script again.');
  process.exit(1);
}

// Sleep function for rate limiting
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Search for a business using Places API Text Search
async function searchBusiness(businessName, city, state) {
  const query = `${businessName}, ${city}, ${state}`;
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      return data.results[0]; // Return first result
    } else if (data.status === 'ZERO_RESULTS') {
      console.warn(`⚠️  No results for: ${businessName}`);
      return null;
    } else {
      console.error(`❌ API Error for ${businessName}:`, data.status, data.error_message);
      return null;
    }
  } catch (error) {
    console.error(`❌ Request failed for ${businessName}:`, error.message);
    return null;
  }
}

// Get detailed information about a place
async function getPlaceDetails(placeId) {
  const fields = 'name,formatted_address,geometry,formatted_phone_number,website,place_id,rating,user_ratings_total';
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.result) {
      return data.result;
    } else {
      console.error(`❌ Details API Error:`, data.status);
      return null;
    }
  } catch (error) {
    console.error(`❌ Details request failed:`, error.message);
    return null;
  }
}

// Main enrichment function
async function enrichBusinesses() {
  console.log('🚀 Starting business enrichment...\n');

  // Read input file
  let businesses;
  try {
    const rawData = fs.readFileSync(INPUT_FILE, 'utf8');
    businesses = JSON.parse(rawData);
    console.log(`📋 Loaded ${businesses.length} businesses from ${INPUT_FILE}\n`);
  } catch (error) {
    console.error('❌ Error reading input file:', error.message);
    process.exit(1);
  }

  // Prepare CSV header
  const csvHeader = 'businessName,category,address,city,state,zipCode,latitude,longitude,phone,website,placeId,rating,reviewCount,originalRating,originalReviews,status\n';
  let csvContent = csvHeader;

  let successCount = 0;
  let failCount = 0;

  // Process each business
  for (let i = 0; i < businesses.length; i++) {
    const business = businesses[i];
    console.log(`[${i + 1}/${businesses.length}] Processing: ${business.name}`);

    try {
      // Search for business
      const searchResult = await searchBusiness(business.name, CITY, STATE);

      if (!searchResult) {
        // No result found
        csvContent += `"${business.name.replace(/"/g, '""')}","${business.category || ''}","","${CITY}","${STATE}","","","","","","","","","${business.rating || ''}","${business.reviews || ''}","not_found"\n`;
        failCount++;
        console.log(`   ❌ Not found\n`);
        continue;
      }

      // Get detailed information
      const details = await getPlaceDetails(searchResult.place_id);

      if (!details) {
        // Details request failed, use search result data
        csvContent += `"${business.name.replace(/"/g, '""')}","${business.category || ''}","${searchResult.formatted_address || ''}","${CITY}","${STATE}","","${searchResult.geometry?.location?.lat || ''}","${searchResult.geometry?.location?.lng || ''}","","","${searchResult.place_id}","${searchResult.rating || ''}","${searchResult.user_ratings_total || ''}","${business.rating || ''}","${business.reviews || ''}","partial"\n`;
        successCount++;
        console.log(`   ⚠️  Partial data (no details)\n`);
        continue;
      }

      // Extract address components
      const addressParts = details.formatted_address.split(',');
      const zipMatch = details.formatted_address.match(/\b\d{5}\b/);
      const zipCode = zipMatch ? zipMatch[0] : '';

      // Add to CSV
      csvContent += `"${details.name.replace(/"/g, '""')}","${business.category || ''}","${details.formatted_address.replace(/"/g, '""')}","${CITY}","${STATE}","${zipCode}","${details.geometry.location.lat}","${details.geometry.location.lng}","${details.formatted_phone_number || ''}","${details.website || ''}","${details.place_id}","${details.rating || ''}","${details.user_ratings_total || ''}","${business.rating || ''}","${business.reviews || ''}","success"\n`;

      successCount++;
      console.log(`   ✅ Success - ${details.formatted_address}`);
      console.log(`   📍 Lat/Long: ${details.geometry.location.lat}, ${details.geometry.location.lng}\n`);

    } catch (error) {
      console.error(`   ❌ Error processing ${business.name}:`, error.message, '\n');
      csvContent += `"${business.name.replace(/"/g, '""')}","${business.category || ''}","","${CITY}","${STATE}","","","","","","","","","${business.rating || ''}","${business.reviews || ''}","error"\n`;
      failCount++;
    }

    // Rate limiting delay
    if (i < businesses.length - 1) {
      await sleep(DELAY_BETWEEN_REQUESTS);
    }
  }

  // Write output file
  try {
    fs.writeFileSync(OUTPUT_FILE, csvContent, 'utf8');
    console.log(`\n✅ Enrichment complete!`);
    console.log(`📊 Results:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📁 Output: ${OUTPUT_FILE}\n`);
    console.log(`Next steps:`);
    console.log(`1. Review the CSV file`);
    console.log(`2. Manually fix any "not_found" entries if needed`);
    console.log(`3. Use the import tool to add to Firebase\n`);
  } catch (error) {
    console.error('❌ Error writing output file:', error.message);
    process.exit(1);
  }
}

// Run the script
enrichBusinesses().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
