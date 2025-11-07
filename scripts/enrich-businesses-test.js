/**
 * Business Enrichment Script - TEST VERSION
 *
 * This tests the enrichment with just 5 businesses
 * Use this to verify your API key works before running the full batch
 *
 * Usage: node enrich-businesses-test.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const INPUT_FILE = path.join(__dirname, 'wellesley-businesses-raw.json');
const OUTPUT_FILE = path.join(__dirname, 'wellesley-businesses-enriched-test.csv');
const CITY = 'Wellesley';
const STATE = 'MA';
const DELAY_BETWEEN_REQUESTS = 200;
const TEST_LIMIT = 5; // Only process first 5 businesses

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

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function searchBusiness(businessName, city, state) {
  const query = `${businessName}, ${city}, ${state}`;
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      return data.results[0];
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

async function enrichBusinesses() {
  console.log('🧪 TEST MODE: Processing first 5 businesses only\n');

  let businesses;
  try {
    const rawData = fs.readFileSync(INPUT_FILE, 'utf8');
    businesses = JSON.parse(rawData).slice(0, TEST_LIMIT);
    console.log(`📋 Testing with ${businesses.length} businesses\n`);
  } catch (error) {
    console.error('❌ Error reading input file:', error.message);
    process.exit(1);
  }

  const csvHeader = 'businessName,category,address,city,state,zipCode,latitude,longitude,phone,website,placeId,rating,reviewCount,status\n';
  let csvContent = csvHeader;

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < businesses.length; i++) {
    const business = businesses[i];
    console.log(`[${i + 1}/${businesses.length}] ${business.name}`);

    try {
      const searchResult = await searchBusiness(business.name, CITY, STATE);

      if (!searchResult) {
        csvContent += `"${business.name.replace(/"/g, '""')}","${business.category || ''}","","${CITY}","${STATE}","","","","","","","","","not_found"\n`;
        failCount++;
        console.log(`   ❌ Not found\n`);
        continue;
      }

      const details = await getPlaceDetails(searchResult.place_id);

      if (!details) {
        csvContent += `"${business.name.replace(/"/g, '""')}","${business.category || ''}","${searchResult.formatted_address || ''}","${CITY}","${STATE}","","${searchResult.geometry?.location?.lat || ''}","${searchResult.geometry?.location?.lng || ''}","","","${searchResult.place_id}","${searchResult.rating || ''}","${searchResult.user_ratings_total || ''}","partial"\n`;
        successCount++;
        console.log(`   ⚠️  Partial data\n`);
        continue;
      }

      const zipMatch = details.formatted_address.match(/\b\d{5}\b/);
      const zipCode = zipMatch ? zipMatch[0] : '';

      csvContent += `"${details.name.replace(/"/g, '""')}","${business.category || ''}","${details.formatted_address.replace(/"/g, '""')}","${CITY}","${STATE}","${zipCode}","${details.geometry.location.lat}","${details.geometry.location.lng}","${details.formatted_phone_number || ''}","${details.website || ''}","${details.place_id}","${details.rating || ''}","${details.user_ratings_total || ''}","success"\n`;

      successCount++;
      console.log(`   ✅ ${details.formatted_address}`);
      console.log(`   📍 ${details.geometry.location.lat}, ${details.geometry.location.lng}`);
      console.log(`   📞 ${details.formatted_phone_number || 'N/A'}`);
      console.log(`   🌐 ${details.website || 'N/A'}\n`);

    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
      csvContent += `"${business.name.replace(/"/g, '""')}","${business.category || ''}","","${CITY}","${STATE}","","","","","","","","","error"\n`;
      failCount++;
    }

    if (i < businesses.length - 1) {
      await sleep(DELAY_BETWEEN_REQUESTS);
    }
  }

  fs.writeFileSync(OUTPUT_FILE, csvContent, 'utf8');

  console.log(`\n✅ Test complete!`);
  console.log(`📊 Results: ${successCount} success, ${failCount} failed`);
  console.log(`📁 Output: ${OUTPUT_FILE}\n`);

  if (successCount > 0) {
    console.log(`🎉 API key works! You can now run the full enrichment:`);
    console.log(`   node enrich-businesses.js\n`);
  } else {
    console.log(`⚠️  No successful results. Check your API key and billing.\n`);
  }
}

enrichBusinesses().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
