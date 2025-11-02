#!/usr/bin/env node
/**
 * Geocode missing brand locations in brands.json
 * Adds latitude and longitude to brands that have a location but no coordinates
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const BRANDS_JSON_PATH = path.join(ROOT_DIR, 'data', 'brands.json');
const BACKUP_PATH = path.join(ROOT_DIR, 'data', 'brands.json.backup');

// Try to load .env file manually
const envPath = path.join(ROOT_DIR, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  });
}

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';

// Hardcoded coordinates for major cities (faster lookup, reduces API calls)
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
  'Burbank, CA, USA': { latitude: 34.1808, longitude: -118.3090 },
  'Burbank, CA': { latitude: 34.1808, longitude: -118.3090 },
  'Freeport, ME, USA': { latitude: 43.8570, longitude: -70.1028 },
  'Freeport, ME': { latitude: 43.8570, longitude: -70.1028 },
  'Beaverton, OR, USA': { latitude: 45.4871, longitude: -122.8037 },
  'Beaverton, OR': { latitude: 45.4871, longitude: -122.8037 },
  'Columbus, OH, USA': { latitude: 39.9612, longitude: -82.9988 },
  'Columbus, OH': { latitude: 39.9612, longitude: -82.9988 },
  'Indianapolis, IN, USA': { latitude: 39.7684, longitude: -86.1581 },
  'Indianapolis, IN': { latitude: 39.7684, longitude: -86.1581 },
  'Charlotte, NC, USA': { latitude: 35.2271, longitude: -80.8431 },
  'Charlotte, NC': { latitude: 35.2271, longitude: -80.8431 },
  'San Antonio, TX, USA': { latitude: 29.4241, longitude: -98.4936 },
  'San Antonio, TX': { latitude: 29.4241, longitude: -98.4936 },
  'San Jose, CA, USA': { latitude: 37.3382, longitude: -121.8863 },
  'San Jose, CA': { latitude: 37.3382, longitude: -121.8863 },
  'Jacksonville, FL, USA': { latitude: 30.3322, longitude: -81.6557 },
  'Jacksonville, FL': { latitude: 30.3322, longitude: -81.6557 },
  'Fort Worth, TX, USA': { latitude: 32.7555, longitude: -97.3308 },
  'Fort Worth, TX': { latitude: 32.7555, longitude: -97.3308 },
  'Milwaukee, WI, USA': { latitude: 43.0389, longitude: -87.9065 },
  'Milwaukee, WI': { latitude: 43.0389, longitude: -87.9065 },
  'Baltimore, MD, USA': { latitude: 39.2904, longitude: -76.6122 },
  'Baltimore, MD': { latitude: 39.2904, longitude: -76.6122 },
  'Oklahoma City, OK, USA': { latitude: 35.4676, longitude: -97.5164 },
  'Oklahoma City, OK': { latitude: 35.4676, longitude: -97.5164 },
  'Louisville, KY, USA': { latitude: 38.2527, longitude: -85.7585 },
  'Louisville, KY': { latitude: 38.2527, longitude: -85.7585 },
  'Memphis, TN, USA': { latitude: 35.1495, longitude: -90.0490 },
  'Memphis, TN': { latitude: 35.1495, longitude: -90.0490 },
  'Raleigh, NC, USA': { latitude: 35.7796, longitude: -78.6382 },
  'Raleigh, NC': { latitude: 35.7796, longitude: -78.6382 },
  'Omaha, NE, USA': { latitude: 41.2565, longitude: -95.9345 },
  'Omaha, NE': { latitude: 41.2565, longitude: -95.9345 },
  'Kansas City, MO, USA': { latitude: 39.0997, longitude: -94.5786 },
  'Kansas City, MO': { latitude: 39.0997, longitude: -94.5786 },
  'Virginia Beach, VA, USA': { latitude: 36.8529, longitude: -75.9780 },
  'Virginia Beach, VA': { latitude: 36.8529, longitude: -75.9780 },
  'Oakland, CA, USA': { latitude: 37.8044, longitude: -122.2712 },
  'Oakland, CA': { latitude: 37.8044, longitude: -122.2712 },
  'Tulsa, OK, USA': { latitude: 36.1540, longitude: -95.9928 },
  'Tulsa, OK': { latitude: 36.1540, longitude: -95.9928 },
  'New Orleans, LA, USA': { latitude: 29.9511, longitude: -90.0715 },
  'New Orleans, LA': { latitude: 29.9511, longitude: -90.0715 },
  'Cleveland, OH, USA': { latitude: 41.4993, longitude: -81.6944 },
  'Cleveland, OH': { latitude: 41.4993, longitude: -81.6944 },
  'Tampa, FL, USA': { latitude: 27.9506, longitude: -82.4572 },
  'Tampa, FL': { latitude: 27.9506, longitude: -82.4572 },
  'Honolulu, HI, USA': { latitude: 21.3099, longitude: -157.8581 },
  'Honolulu, HI': { latitude: 21.3099, longitude: -157.8581 },
  'Albuquerque, NM, USA': { latitude: 35.0844, longitude: -106.6504 },
  'Albuquerque, NM': { latitude: 35.0844, longitude: -106.6504 },
  'Tucson, AZ, USA': { latitude: 32.2226, longitude: -110.9747 },
  'Tucson, AZ': { latitude: 32.2226, longitude: -110.9747 },
  'Fresno, CA, USA': { latitude: 36.7378, longitude: -119.7871 },
  'Fresno, CA': { latitude: 36.7378, longitude: -119.7871 },
  'Sacramento, CA, USA': { latitude: 38.5816, longitude: -121.4944 },
  'Sacramento, CA': { latitude: 38.5816, longitude: -121.4944 },
  'Mesa, AZ, USA': { latitude: 33.4152, longitude: -111.8315 },
  'Mesa, AZ': { latitude: 33.4152, longitude: -111.8315 },
  'Colorado Springs, CO, USA': { latitude: 38.8339, longitude: -104.8214 },
  'Colorado Springs, CO': { latitude: 38.8339, longitude: -104.8214 },
  // Additional US Brand Locations
  'Santa Monica, CA, USA': { latitude: 34.0195, longitude: -118.4912 },
  'Santa Monica, CA': { latitude: 34.0195, longitude: -118.4912 },
  'Arlington, VA, USA': { latitude: 38.8816, longitude: -77.0910 },
  'Arlington, VA': { latitude: 38.8816, longitude: -77.0910 },
  'Culver City, CA, USA': { latitude: 34.0211, longitude: -118.3965 },
  'Culver City, CA': { latitude: 34.0211, longitude: -118.3965 },
  'Wilmington, DE, USA': { latitude: 39.7391, longitude: -75.5398 },
  'Wilmington, DE': { latitude: 39.7391, longitude: -75.5398 },
  'Stamford, CT, USA': { latitude: 41.0534, longitude: -73.5387 },
  'Stamford, CT': { latitude: 41.0534, longitude: -73.5387 },
  'Boca Raton, FL, USA': { latitude: 26.3683, longitude: -80.1289 },
  'Boca Raton, FL': { latitude: 26.3683, longitude: -80.1289 },
  'St. Louis, MO, USA': { latitude: 38.6270, longitude: -90.1994 },
  'St. Louis, MO': { latitude: 38.6270, longitude: -90.1994 },
  'Reston, VA, USA': { latitude: 38.9586, longitude: -77.3570 },
  'Reston, VA': { latitude: 38.9586, longitude: -77.3570 },
  'Purchase, NY, USA': { latitude: 41.0401, longitude: -73.7151 },
  'Purchase, NY': { latitude: 41.0401, longitude: -73.7151 },
  'New Albany, OH, USA': { latitude: 40.0810, longitude: -82.8088 },
  'New Albany, OH': { latitude: 40.0810, longitude: -82.8088 },
  'Cambridge, MA, USA': { latitude: 42.3736, longitude: -71.1097 },
  'Cambridge, MA': { latitude: 42.3736, longitude: -71.1097 },
  'Brooklyn, NY, USA': { latitude: 40.6782, longitude: -73.9442 },
  'Brooklyn, NY': { latitude: 40.6782, longitude: -73.9442 },
  'Fremont, CA, USA': { latitude: 37.5485, longitude: -121.9886 },
  'Fremont, CA': { latitude: 37.5485, longitude: -121.9886 },
  'Dearborn, MI, USA': { latitude: 42.3223, longitude: -83.1763 },
  'Dearborn, MI': { latitude: 42.3223, longitude: -83.1763 },
  'Issaquah, WA, USA': { latitude: 47.5301, longitude: -122.0326 },
  'Issaquah, WA': { latitude: 47.5301, longitude: -122.0326 },
  'Irvine, CA, USA': { latitude: 33.6846, longitude: -117.8265 },
  'Irvine, CA': { latitude: 33.6846, longitude: -117.8265 },
  'Palo Alto, CA, USA': { latitude: 37.4419, longitude: -122.1430 },
  'Palo Alto, CA': { latitude: 37.4419, longitude: -122.1430 },
  'Santa Clara, CA, USA': { latitude: 37.3541, longitude: -121.9552 },
  'Santa Clara, CA': { latitude: 37.3541, longitude: -121.9552 },
  'Jersey City, NJ, USA': { latitude: 40.7178, longitude: -74.0431 },
  'Jersey City, NJ': { latitude: 40.7178, longitude: -74.0431 },
  'Bethesda, MD, USA': { latitude: 38.9807, longitude: -77.1028 },
  'Bethesda, MD': { latitude: 38.9807, longitude: -77.1028 },
  'McLean, VA, USA': { latitude: 38.9339, longitude: -77.1773 },
  'McLean, VA': { latitude: 38.9339, longitude: -77.1773 },
  'Irving, TX, USA': { latitude: 32.8140, longitude: -96.9489 },
  'Irving, TX': { latitude: 32.8140, longitude: -96.9489 },
  'Spring, TX, USA': { latitude: 30.0799, longitude: -95.4171 },
  'Spring, TX': { latitude: 30.0799, longitude: -95.4171 },
  'Hershey, PA, USA': { latitude: 40.2862, longitude: -76.6505 },
  'Hershey, PA': { latitude: 40.2862, longitude: -76.6505 },
  'Malvern, PA, USA': { latitude: 40.0362, longitude: -75.5138 },
  'Malvern, PA': { latitude: 40.0362, longitude: -75.5138 },
  'Round Rock, TX, USA': { latitude: 30.5083, longitude: -97.6789 },
  'Round Rock, TX': { latitude: 30.5083, longitude: -97.6789 },
  'Lakeland, FL, USA': { latitude: 28.0395, longitude: -81.9498 },
  'Lakeland, FL': { latitude: 28.0395, longitude: -81.9498 },
  'Dublin, OH, USA': { latitude: 40.0992, longitude: -83.1141 },
  'Dublin, OH': { latitude: 40.0992, longitude: -83.1141 },
  'Akron, OH, USA': { latitude: 41.0814, longitude: -81.5190 },
  'Akron, OH': { latitude: 41.0814, longitude: -81.5190 },
  'Redwood City, CA, USA': { latitude: 37.4852, longitude: -122.2364 },
  'Redwood City, CA': { latitude: 37.4852, longitude: -122.2364 },
  'Ventura, CA, USA': { latitude: 34.2746, longitude: -119.2290 },
  'Ventura, CA': { latitude: 34.2746, longitude: -119.2290 },
  'Pensacola, FL, USA': { latitude: 30.4213, longitude: -87.2169 },
  'Pensacola, FL': { latitude: 30.4213, longitude: -87.2169 },
  'Los Gatos, CA, USA': { latitude: 37.2358, longitude: -121.9623 },
  'Los Gatos, CA': { latitude: 37.2358, longitude: -121.9623 },
  'Herndon, VA, USA': { latitude: 38.9696, longitude: -77.3861 },
  'Herndon, VA': { latitude: 38.9696, longitude: -77.3861 },
  'Beverly Hills, CA, USA': { latitude: 34.0736, longitude: -118.4004 },
  'Beverly Hills, CA': { latitude: 34.0736, longitude: -118.4004 },
  'Sarasota, FL, USA': { latitude: 27.3364, longitude: -82.5307 },
  'Sarasota, FL': { latitude: 27.3364, longitude: -82.5307 },
  'Melbourne, FL, USA': { latitude: 28.0836, longitude: -80.6081 },
  'Melbourne, FL': { latitude: 28.0836, longitude: -80.6081 },
  'Springfield, MO, USA': { latitude: 37.2090, longitude: -93.2923 },
  'Springfield, MO': { latitude: 37.2090, longitude: -93.2923 },
  'Salt Lake City, UT, USA': { latitude: 40.7608, longitude: -111.8910 },
  'Salt Lake City, UT': { latitude: 40.7608, longitude: -111.8910 },
  'Bloomington, IL, USA': { latitude: 40.4842, longitude: -88.9937 },
  'Bloomington, IL': { latitude: 40.4842, longitude: -88.9937 },
  'Orlando, FL, USA': { latitude: 28.5383, longitude: -81.3792 },
  'Orlando, FL': { latitude: 28.5383, longitude: -81.3792 },
  'West Palm Beach, FL, USA': { latitude: 26.7153, longitude: -80.0534 },
  'West Palm Beach, FL': { latitude: 26.7153, longitude: -80.0534 },
  'Boise, ID, USA': { latitude: 43.6150, longitude: -116.2023 },
  'Boise, ID': { latitude: 43.6150, longitude: -116.2023 },
  'Scottsdale, AZ, USA': { latitude: 33.4942, longitude: -111.9261 },
  'Scottsdale, AZ': { latitude: 33.4942, longitude: -111.9261 },
  // International Cities
  'London, UK': { latitude: 51.5074, longitude: -0.1278 },
  'Toronto, ON, Canada': { latitude: 43.6532, longitude: -79.3832 },
  'Toronto, Canada': { latitude: 43.6532, longitude: -79.3832 },
  'Vancouver, BC, Canada': { latitude: 49.2827, longitude: -123.1207 },
  'Vancouver, Canada': { latitude: 49.2827, longitude: -123.1207 },
  'Moscow, Russia': { latitude: 55.7558, longitude: 37.6173 },
  'Mexico City, Mexico': { latitude: 19.4326, longitude: -99.1332 },
  'Beijing, China': { latitude: 39.9042, longitude: 116.4074 },
  'Seoul, South Korea': { latitude: 37.5665, longitude: 126.9780 },
  'Mumbai, Maharashtra, India': { latitude: 19.0760, longitude: 72.8777 },
  'Mumbai, India': { latitude: 19.0760, longitude: 72.8777 },
  'Shanghai, China': { latitude: 31.2304, longitude: 121.4737 },
  'Shenzhen, Guangdong, China': { latitude: 22.5431, longitude: 114.0579 },
  'Shenzhen, China': { latitude: 22.5431, longitude: 114.0579 },
  'Hangzhou, China': { latitude: 30.2741, longitude: 120.1551 },
  'Bengaluru, Karnataka, India': { latitude: 12.9716, longitude: 77.5946 },
  'Bengaluru, India': { latitude: 12.9716, longitude: 77.5946 },
  'Herzogenaurach, Germany': { latitude: 49.5681, longitude: 10.8850 },
  'Wolfsburg, Germany': { latitude: 52.4227, longitude: 10.7865 },
  'Wolfsburg, Lower Saxony, Germany': { latitude: 52.4227, longitude: 10.7865 },
  'Stuttgart, Baden-Württemberg, Germany': { latitude: 48.7758, longitude: 9.1829 },
  'Stuttgart, Germany': { latitude: 48.7758, longitude: 9.1829 },
  'Courbevoie, France': { latitude: 48.8978, longitude: 2.2536 },
  'Issy-les-Moulineaux, France': { latitude: 48.8239, longitude: 2.2710 },
  'Zug, Switzerland': { latitude: 47.1660, longitude: 8.5152 },
  'Tel Aviv, Israel': { latitude: 32.0853, longitude: 34.7818 },
  'Haifa, Israel': { latitude: 32.7940, longitude: 34.9896 },
  'Singapore': { latitude: 1.3521, longitude: 103.8198 },
  'Hong Kong, China': { latitude: 22.3193, longitude: 114.1694 },
  'Dubai, UAE': { latitude: 25.2048, longitude: 55.2708 },
  'Kuala Lumpur, Malaysia': { latitude: 3.1390, longitude: 101.6869 },
  'Saint Petersburg, Russia': { latitude: 59.9311, longitude: 30.3609 },
  'Calgary, AB, Canada': { latitude: 51.0447, longitude: -114.0719 },
  'Calgary, Canada': { latitude: 51.0447, longitude: -114.0719 },
  'Ottawa, ON, Canada': { latitude: 45.4215, longitude: -75.6972 },
  'Ottawa, Canada': { latitude: 45.4215, longitude: -75.6972 },
  'London, England, UK': { latitude: 51.5074, longitude: -0.1278 },
  'Paris, France': { latitude: 48.8566, longitude: 2.3522 },
  'Tokyo, Japan': { latitude: 35.6762, longitude: 139.6503 },
  'Toronto, Canada': { latitude: 43.6532, longitude: -79.3832 },
  'Sydney, Australia': { latitude: -33.8688, longitude: 151.2093 },
  'Stockholm, Sweden': { latitude: 59.3293, longitude: 18.0686 },
  'Dublin, Ireland': { latitude: 53.3498, longitude: -6.2603 },
  'Amsterdam, Netherlands': { latitude: 52.3676, longitude: 4.9041 },
  'Berlin, Germany': { latitude: 52.5200, longitude: 13.4050 },
  'Rome, Italy': { latitude: 41.9028, longitude: 12.4964 },
  'Madrid, Spain': { latitude: 40.4168, longitude: -3.7038 },
  'Brussels, Belgium': { latitude: 50.8503, longitude: 4.3517 },
  'Copenhagen, Denmark': { latitude: 55.6761, longitude: 12.5683 },
  'Oslo, Norway': { latitude: 59.9139, longitude: 10.7522 },
  'Helsinki, Finland': { latitude: 60.1699, longitude: 24.9384 },
  'Vienna, Austria': { latitude: 48.2082, longitude: 16.3738 },
  'Zurich, Switzerland': { latitude: 47.3769, longitude: 8.5417 },
  'Barcelona, Spain': { latitude: 41.3874, longitude: 2.1686 },
  'Munich, Germany': { latitude: 48.1351, longitude: 11.5820 },
  'Milan, Italy': { latitude: 45.4642, longitude: 9.1900 },
};

/**
 * Add a delay to avoid hitting rate limits
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Geocode a location using Google Geocoding API
 * @param {string} location - The location string to geocode
 * @returns {Promise<{latitude: number, longitude: number} | null>}
 */
async function geocodeLocation(location) {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn('[Geocoding] No Google Places API key found, skipping:', location);
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${GOOGLE_PLACES_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      console.log(`  ✓ Geocoded "${location}" → (${lat}, ${lng})`);
      return { latitude: lat, longitude: lng };
    } else if (data.status === 'ZERO_RESULTS') {
      console.warn(`  ✗ No results for "${location}"`);
      return null;
    } else if (data.status === 'OVER_QUERY_LIMIT') {
      console.error('  ✗ Google API quota exceeded. Please wait or add an API key with higher limits.');
      return null;
    } else {
      console.warn(`  ✗ Failed to geocode "${location}": ${data.status}`);
      return null;
    }
  } catch (error) {
    console.error(`  ✗ Error geocoding "${location}":`, error.message);
    return null;
  }
}

/**
 * Main geocoding function
 */
async function geocodeBrands() {
  console.log('🌍 Starting brand geocoding process...\n');

  // Check if brands.json exists
  if (!fs.existsSync(BRANDS_JSON_PATH)) {
    console.error(`❌ brands.json not found at: ${BRANDS_JSON_PATH}`);
    process.exit(1);
  }

  // Load brands
  console.log('📖 Reading brands.json...');
  const brandsContent = fs.readFileSync(BRANDS_JSON_PATH, 'utf-8');
  const brands = JSON.parse(brandsContent);
  console.log(`   Found ${brands.length} total brands\n`);

  // Create backup
  console.log('💾 Creating backup...');
  fs.writeFileSync(BACKUP_PATH, brandsContent);
  console.log(`   Backup saved to: ${BACKUP_PATH}\n`);

  // Find brands that need geocoding
  const brandsNeedingGeocode = brands.filter(brand => {
    return brand.location && (!brand.latitude || !brand.longitude);
  });

  console.log(`🔍 Found ${brandsNeedingGeocode.length} brands needing geocoding\n`);

  if (brandsNeedingGeocode.length === 0) {
    console.log('✅ All brands with locations already have coordinates!');
    return;
  }

  // Statistics
  let hardcodedCount = 0;
  let apiCount = 0;
  let failedCount = 0;

  // Geocode each brand
  for (let i = 0; i < brandsNeedingGeocode.length; i++) {
    const brand = brandsNeedingGeocode[i];
    const location = brand.location;

    console.log(`[${i + 1}/${brandsNeedingGeocode.length}] ${brand.name} (${location})`);

    // Try hardcoded lookup first
    const hardcoded = CITY_COORDINATES[location];
    if (hardcoded) {
      brand.latitude = hardcoded.latitude;
      brand.longitude = hardcoded.longitude;
      console.log(`  ✓ Matched hardcoded coordinates`);
      hardcodedCount++;
      continue;
    }

    // Try Google Geocoding API
    const geocoded = await geocodeLocation(location);
    if (geocoded) {
      brand.latitude = geocoded.latitude;
      brand.longitude = geocoded.longitude;
      apiCount++;

      // Rate limiting: wait 100ms between API calls to avoid hitting limits
      await delay(100);
    } else {
      failedCount++;
    }
  }

  // Save updated brands
  console.log('\n💾 Saving updated brands.json...');
  fs.writeFileSync(BRANDS_JSON_PATH, JSON.stringify(brands, null, 2));

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('✨ GEOCODING COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total brands processed:    ${brandsNeedingGeocode.length}`);
  console.log(`Hardcoded matches:         ${hardcodedCount}`);
  console.log(`API geocoded:              ${apiCount}`);
  console.log(`Failed to geocode:         ${failedCount}`);
  console.log(`Backup location:           ${BACKUP_PATH}`);
  console.log('='.repeat(60));

  if (failedCount > 0) {
    console.log('\n⚠️  Some locations could not be geocoded.');
    console.log('   You may need to manually add coordinates or update location strings.');
  }
}

// Run the geocoding
geocodeBrands().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
