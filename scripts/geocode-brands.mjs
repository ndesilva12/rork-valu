import fs from 'fs';
import path from 'path';
import https from 'https';

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

if (!GOOGLE_API_KEY) {
  console.error('Error: EXPO_PUBLIC_GOOGLE_PLACES_API_KEY not found in environment');
  process.exit(1);
}

function httpsRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Failed to parse JSON response'));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function geocodeLocation(location) {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${GOOGLE_API_KEY}`;
    const data = await httpsRequest(url);

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return { latitude: lat, longitude: lng, success: true };
    } else if (data.status === 'ZERO_RESULTS') {
      console.warn(`  ⚠️  No results for: ${location}`);
      return { latitude: null, longitude: null, success: false, status: 'ZERO_RESULTS' };
    } else if (data.status === 'OVER_QUERY_LIMIT') {
      console.error(`  🚫 API rate limit hit!`);
      return { latitude: null, longitude: null, success: false, status: 'RATE_LIMIT' };
    } else {
      console.warn(`  ⚠️  Failed: ${location} - Status: ${data.status}`);
      return { latitude: null, longitude: null, success: false, status: data.status };
    }
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    return { latitude: null, longitude: null, success: false, error: error.message };
  }
}

async function geocodeAllBrands() {
  console.log('🗺️  Starting brand geocoding process...\n');

  // Read brands.json
  const brandsPath = path.join(process.cwd(), 'data', 'brands.json');
  const brandsData = JSON.parse(fs.readFileSync(brandsPath, 'utf-8'));

  console.log(`📊 Found ${brandsData.length} brands to geocode\n`);

  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;
  let rateLimitHit = false;

  // Process each brand
  for (let i = 0; i < brandsData.length; i++) {
    const brand = brandsData[i];
    const progress = `[${i + 1}/${brandsData.length}]`;

    // Skip if already has coordinates
    if (brand.latitude && brand.longitude) {
      console.log(`${progress} ⏭️  SKIP: ${brand.name} (already has coordinates)`);
      skippedCount++;
      continue;
    }

    // Skip if no location
    if (!brand.location) {
      console.log(`${progress} ⏭️  SKIP: ${brand.name} (no location data)`);
      skippedCount++;
      continue;
    }

    process.stdout.write(`${progress} 🔍 ${brand.name} - "${brand.location}"...`);

    // Geocode the location
    const result = await geocodeLocation(brand.location);

    if (result.status === 'RATE_LIMIT') {
      console.log('\n\n🚫 Rate limit hit! Saving progress and stopping...\n');
      rateLimitHit = true;
      break;
    }

    if (result.success) {
      brand.latitude = result.latitude;
      brand.longitude = result.longitude;
      console.log(` ✅ (${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)})`);
      successCount++;
    } else {
      console.log(` ❌`);
      failCount++;
    }

    // Rate limit: Wait 50ms between requests to avoid hitting API limits
    await new Promise(resolve => setTimeout(resolve, 50));

    // Save progress every 100 brands
    if ((i + 1) % 100 === 0) {
      console.log(`\n💾 Saving progress... (${i + 1} brands processed)\n`);
      fs.writeFileSync(brandsPath, JSON.stringify(brandsData, null, 2));
    }
  }

  // Final save
  console.log('\n💾 Saving final results...');
  fs.writeFileSync(brandsPath, JSON.stringify(brandsData, null, 2));

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('🎉 GEOCODING COMPLETE');
  console.log('='.repeat(60));
  console.log(`📊 Total brands: ${brandsData.length}`);
  console.log(`✅ Successfully geocoded: ${successCount}`);
  console.log(`❌ Failed to geocode: ${failCount}`);
  console.log(`⏭️  Skipped (already had coords): ${skippedCount}`);
  if (rateLimitHit) {
    console.log(`\n⚠️  Rate limit was hit - run script again later to continue`);
  }
  console.log('='.repeat(60));
  console.log(`\n✨ brands.json has been updated with ${successCount} new coordinates!`);
}

// Run the script
geocodeAllBrands().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
