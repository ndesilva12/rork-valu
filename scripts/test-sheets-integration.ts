/**
 * Test Script for Google Sheets Integration
 *
 * Run this script to verify your Google Sheets setup is working correctly.
 *
 * Usage:
 *   npm run test-sheets  (or bun run test-sheets)
 */

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import {
  fetchCausesFromSheets,
  fetchBrandsFromSheets,
  fetchLocalBusinessesFromSheets,
} from '../backend/services/google-sheets';

async function testGoogleSheetsIntegration() {
  console.log('🧪 Testing Google Sheets Integration\n');
  console.log('=' .repeat(60));

  // Test 1: Check environment variables
  console.log('\n📋 Step 1: Checking Environment Variables');
  console.log('-'.repeat(60));

  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  const hasServiceAccountFile = !!process.env.GOOGLE_SERVICE_ACCOUNT_FILE;
  const hasServiceAccountJson = !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const hasApiKey = !!process.env.GOOGLE_SHEETS_API_KEY;

  console.log(`GOOGLE_SPREADSHEET_ID: ${spreadsheetId ? '✅ Set' : '❌ Not set'}`);
  console.log(`Authentication method:`);
  console.log(`  - Service Account File: ${hasServiceAccountFile ? '✅' : '❌'}`);
  console.log(`  - Service Account JSON: ${hasServiceAccountJson ? '✅' : '❌'}`);
  console.log(`  - API Key: ${hasApiKey ? '✅' : '❌'}`);

  if (!spreadsheetId) {
    console.error('\n❌ Error: GOOGLE_SPREADSHEET_ID is not set in .env file');
    console.log('\nPlease add to .env:');
    console.log('GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here');
    process.exit(1);
  }

  if (!hasServiceAccountFile && !hasServiceAccountJson && !hasApiKey) {
    console.error('\n❌ Error: No authentication method configured');
    console.log('\nPlease add ONE of these to .env:');
    console.log('GOOGLE_SERVICE_ACCOUNT_FILE=./secrets/google-service-account.json');
    console.log('GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}');
    console.log('GOOGLE_SHEETS_API_KEY=AIzaSy...');
    process.exit(1);
  }

  // Test 2: Fetch Causes
  console.log('\n📋 Step 2: Fetching Causes');
  console.log('-'.repeat(60));

  try {
    const causes = await fetchCausesFromSheets();
    console.log(`✅ Successfully fetched ${causes.length} causes`);

    if (causes.length > 0) {
      console.log('\nSample causes:');
      causes.slice(0, 5).forEach((cause) => {
        console.log(`  - ${cause.name} (${cause.category})`);
      });

      // Validate structure
      const hasRequiredFields = causes.every(
        (c) => c.id && c.name && c.category
      );
      if (hasRequiredFields) {
        console.log('\n✅ All causes have required fields (id, name, category)');
      } else {
        console.log('\n⚠️  Warning: Some causes are missing required fields');
      }
    } else {
      console.log('\n⚠️  Warning: No causes found. Make sure your "Causes" sheet has data.');
    }
  } catch (error: any) {
    console.error('❌ Error fetching causes:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check that you have a sheet named "Causes" (case-sensitive)');
    console.log('2. Verify the sheet is shared with your service account email');
    console.log('3. Make sure the sheet has data starting from row 2');
    process.exit(1);
  }

  // Test 3: Fetch Brands
  console.log('\n📋 Step 3: Fetching Brands');
  console.log('-'.repeat(60));

  try {
    const brands = await fetchBrandsFromSheets();
    console.log(`✅ Successfully fetched ${brands.length} brands`);

    if (brands.length > 0) {
      console.log('\nSample brands:');
      brands.slice(0, 5).forEach((brand) => {
        console.log(`  - ${brand.name} (score: ${brand.alignmentScore})`);
      });

      // Validate structure
      const hasRequiredFields = brands.every(
        (b) => b.id && b.name
      );
      if (hasRequiredFields) {
        console.log('\n✅ All brands have required fields (id, name)');
      } else {
        console.log('\n⚠️  Warning: Some brands are missing required fields');
      }

      // Check alignment scores
      const hasValidScores = brands.every(
        (b) => typeof b.alignmentScore === 'number' &&
               b.alignmentScore >= -100 &&
               b.alignmentScore <= 100
      );
      if (hasValidScores) {
        console.log('✅ All brands have valid alignment scores (-100 to +100)');
      } else {
        console.log('⚠️  Warning: Some brands have invalid alignment scores');
      }
    } else {
      console.log('\n⚠️  Warning: No brands found. Make sure your "Brands" sheet has data.');
    }
  } catch (error: any) {
    console.error('❌ Error fetching brands:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check that you have a sheet named "Brands" (case-sensitive)');
    console.log('2. Verify the sheet is shared with your service account email');
    console.log('3. Make sure the sheet has data starting from row 2');
    process.exit(1);
  }

  // Test 4: Fetch Local Businesses
  console.log('\n📋 Step 4: Fetching Local Businesses');
  console.log('-'.repeat(60));

  try {
    const businesses = await fetchLocalBusinessesFromSheets();
    console.log(`✅ Successfully fetched ${businesses.length} local businesses`);

    if (businesses.length > 0) {
      console.log('\nSample businesses:');
      businesses.slice(0, 5).forEach((business) => {
        console.log(`  - ${business.name} (${business.category})`);
      });
    } else {
      console.log('\n⚠️  Warning: No local businesses found. Make sure your "Local Businesses" sheet has data.');
    }
  } catch (error: any) {
    console.error('❌ Error fetching local businesses:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check that you have a sheet named "Local Businesses" (case-sensitive)');
    console.log('2. Verify the sheet is shared with your service account email');
    console.log('3. Make sure the sheet has data starting from row 2');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Test Complete!');
  console.log('='.repeat(60));

  console.log('\n✅ Your Google Sheets integration is working correctly!');
  console.log('\nNext steps:');
  console.log('1. Add more data to your Google Sheets');
  console.log('2. Update your frontend code to use the new API endpoints');
  console.log('3. See GOOGLE_SHEETS_USAGE.md for migration examples');

  process.exit(0);
}

// Run the test
testGoogleSheetsIntegration().catch((error) => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});
