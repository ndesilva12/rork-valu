#!/usr/bin/env node
/**
 * One-time migration script to convert old money flow format to new array format
 *
 * Old format:
 *   affiliate1: "Doug McMillon"
 *   $affiliate1: "$50M (CEO stake)"
 *   Partnership1: "OpenAI (ChatGPT Shopping/2025)"
 *   ownership1: "Walton Family (~46%)"
 *
 * New format:
 *   affiliates: [{name: "Doug McMillon", relationship: "$50M (CEO stake)"}]
 *   partnerships: [{name: "OpenAI", relationship: "ChatGPT Shopping/2025"}]
 *   ownership: [{name: "Walton Family", relationship: "~46%"}]
 *
 * Run with: node scripts/migrate-money-flow.mjs
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, deleteField } from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA-sKyoC38WPxWBf57-GWeBCyZj3KJNgCw",
  authDomain: "stand-3cd5c.firebaseapp.com",
  projectId: "stand-3cd5c",
  storageBucket: "stand-3cd5c.appspot.com",
  messagingSenderId: "556381043052",
  appId: "1:556381043052:web:899cd33ce13a6827cf1b49",
  measurementId: "G-CZEDDWZBSP"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateBrands() {
  console.log('🚀 Starting money flow migration...\n');

  const brandsRef = collection(db, 'brands');
  const snapshot = await getDocs(brandsRef);

  console.log(`📊 Found ${snapshot.docs.length} brands to process\n`);

  let migratedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const brandDoc of snapshot.docs) {
    const data = brandDoc.data();
    const brandName = data.name || brandDoc.id;

    try {
      // Check if already in new format
      if (data.affiliates && Array.isArray(data.affiliates) && data.affiliates.length > 0) {
        console.log(`⏭️  ${brandName}: Already migrated (has affiliates array)`);
        skippedCount++;
        continue;
      }

      // Convert old format to new
      const convertToArray = (fieldPrefix, dollarPrefix) => {
        const result = [];
        for (let i = 1; i <= 20; i++) {
          const nameField = `${fieldPrefix}${i}`;
          const relationshipField = dollarPrefix ? `${dollarPrefix}${i}` : null;

          if (data[nameField]) {
            result.push({
              name: data[nameField],
              relationship: relationshipField && data[relationshipField] ? data[relationshipField] : ''
            });
          }
        }
        return result;
      };

      const affiliates = convertToArray('affiliate', '$affiliate');
      const partnerships = convertToArray('Partnership');
      const ownership = convertToArray('ownership');

      // Check if any old format data exists
      if (affiliates.length === 0 && partnerships.length === 0 && ownership.length === 0) {
        console.log(`⏭️  ${brandName}: No old format data to migrate`);
        skippedCount++;
        continue;
      }

      console.log(`🔄 ${brandName}:`);
      console.log(`   - Converting ${affiliates.length} affiliates`);
      console.log(`   - Converting ${partnerships.length} partnerships`);
      console.log(`   - Converting ${ownership.length} ownership entries`);

      // Prepare update data
      const updates = {};

      // Add new array format
      if (affiliates.length > 0) updates.affiliates = affiliates;
      if (partnerships.length > 0) updates.partnerships = partnerships;
      if (ownership.length > 0) updates.ownership = ownership;

      // Convert ownership sources field name
      if (data['ownership Sources']) {
        updates.ownershipSources = data['ownership Sources'];
      }

      // Delete old numbered fields
      const fieldsToDelete = {};
      for (let i = 1; i <= 20; i++) {
        if (data[`affiliate${i}`]) fieldsToDelete[`affiliate${i}`] = deleteField();
        if (data[`$affiliate${i}`]) fieldsToDelete[`$affiliate${i}`] = deleteField();
        if (data[`Partnership${i}`]) fieldsToDelete[`Partnership${i}`] = deleteField();
        if (data[`ownership${i}`]) fieldsToDelete[`ownership${i}`] = deleteField();
      }
      if (data['ownership Sources']) fieldsToDelete['ownership Sources'] = deleteField();
      if (data['Partnership Sources']) fieldsToDelete['Partnership Sources'] = deleteField();

      // Update in Firebase
      const brandRef = doc(db, 'brands', brandDoc.id);
      await updateDoc(brandRef, { ...updates, ...fieldsToDelete });

      console.log(`   ✅ Migrated successfully\n`);
      migratedCount++;

    } catch (error) {
      console.error(`   ❌ Error migrating ${brandName}:`, error);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📈 Migration Summary:');
  console.log(`   ✅ Migrated: ${migratedCount}`);
  console.log(`   ⏭️  Skipped: ${skippedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📊 Total: ${snapshot.docs.length}`);
  console.log('='.repeat(50) + '\n');

  if (errorCount === 0) {
    console.log('🎉 Migration completed successfully!');
    console.log('💡 Next step: Remove conversion code from dataService.ts');
  } else {
    console.log('⚠️  Migration completed with errors. Please review the logs above.');
  }
}

// Run migration
migrateBrands()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
