/**
 * Find and analyze brands without names in Firebase
 * Run this script with: node scripts/find-brands-without-names.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'stand-3cd5c',
  });
}

const db = admin.firestore();

async function findBrandsWithoutNames() {
  console.log('🔍 Searching for brands without names...\n');

  try {
    const brandsRef = db.collection('brands');
    const snapshot = await brandsRef.get();

    console.log(`📦 Total brands in database: ${snapshot.size}\n`);

    const brandsWithoutNames = [];
    const brandsWithEmptyNames = [];

    snapshot.docs.forEach((doc) => {
      const data = doc.data();

      if (!data.name) {
        brandsWithoutNames.push({ id: doc.id, data });
      } else if (typeof data.name === 'string' && data.name.trim() === '') {
        brandsWithEmptyNames.push({ id: doc.id, data });
      }
    });

    console.log(`❌ Brands with no 'name' field: ${brandsWithoutNames.length}`);
    console.log(`❌ Brands with empty name string: ${brandsWithEmptyNames.length}`);
    console.log(`✅ Total problematic brands: ${brandsWithoutNames.length + brandsWithEmptyNames.length}\n`);

    if (brandsWithoutNames.length > 0) {
      console.log('=== BRANDS WITHOUT NAME FIELD ===\n');
      brandsWithoutNames.forEach((brand, index) => {
        console.log(`\n[${index + 1}] Document ID: ${brand.id}`);
        console.log('   Fields present:', Object.keys(brand.data).join(', '));
        console.log('   Category:', brand.data.category || 'N/A');
        console.log('   Website:', brand.data.website || 'N/A');
        console.log('   Description:', brand.data.description ? `"${brand.data.description.substring(0, 50)}..."` : 'N/A');
        console.log('   Affiliates:', brand.data.affiliates?.length || 0);
        console.log('   Partnerships:', brand.data.partnerships?.length || 0);
        console.log('   Ownership:', brand.data.ownership?.length || 0);
        console.log('   Location:', brand.data.location || 'N/A');

        // Show if it has ANY meaningful data
        const hasData = brand.data.category || brand.data.website || brand.data.description ||
                       (brand.data.affiliates && brand.data.affiliates.length > 0) ||
                       (brand.data.partnerships && brand.data.partnerships.length > 0) ||
                       (brand.data.ownership && brand.data.ownership.length > 0);

        console.log('   Has other data:', hasData ? 'YES ⚠️' : 'NO (safe to DELETE) ✓');
      });
    }

    if (brandsWithEmptyNames.length > 0) {
      console.log('\n\n=== BRANDS WITH EMPTY NAME STRING ===\n');
      brandsWithEmptyNames.forEach((brand, index) => {
        console.log(`\n[${index + 1}] Document ID: ${brand.id}`);
        console.log('   Name field:', `"${brand.data.name}" (empty string)`);
        console.log('   Fields present:', Object.keys(brand.data).join(', '));
        console.log('   Category:', brand.data.category || 'N/A');
        console.log('   Website:', brand.data.website || 'N/A');
        console.log('   Description:', brand.data.description ? `"${brand.data.description.substring(0, 50)}..."` : 'N/A');

        const hasData = brand.data.category || brand.data.website || brand.data.description;
        console.log('   Has other data:', hasData ? 'YES ⚠️' : 'NO (safe to DELETE) ✓');
      });
    }

    // Summary and recommendations
    console.log('\n\n=== RECOMMENDATIONS ===\n');

    const totalProblematic = brandsWithoutNames.length + brandsWithEmptyNames.length;
    const canDelete = [...brandsWithoutNames, ...brandsWithEmptyNames].filter(brand => {
      return !brand.data.category && !brand.data.website && !brand.data.description &&
             (!brand.data.affiliates || brand.data.affiliates.length === 0) &&
             (!brand.data.partnerships || brand.data.partnerships.length === 0) &&
             (!brand.data.ownership || brand.data.ownership.length === 0);
    });

    const needReview = totalProblematic - canDelete.length;

    console.log(`Total problematic brands: ${totalProblematic}`);
    console.log(`Safe to delete (no meaningful data): ${canDelete.length}`);
    console.log(`Need manual review (has data): ${needReview}`);

    if (canDelete.length > 0) {
      console.log('\n📝 Document IDs safe to delete:');
      canDelete.forEach(brand => {
        console.log(`   - ${brand.id}`);
      });
      console.log('\n💡 To delete these, run: node scripts/delete-empty-brands.js');
    }

    if (needReview > 0) {
      console.log('\n⚠️  Brands that need manual review (have data but no name):');
      [...brandsWithoutNames, ...brandsWithEmptyNames]
        .filter(brand => !canDelete.includes(brand))
        .forEach(brand => {
          console.log(`   - ${brand.id} (has: ${Object.keys(brand.data).filter(k => brand.data[k]).join(', ')})`);
        });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

findBrandsWithoutNames();
