#!/usr/bin/env node
/**
 * One-time migration script to convert values data from old format to new array format
 *
 * Old format:
 *   aligned1: "Apple"
 *   aligned2: "Nike"
 *   unaligned1: "Amazon"
 *   unaligned2: "Walmart"
 *
 * New format:
 *   aligned: ["Apple", "Nike"]
 *   unaligned: ["Amazon", "Walmart"]
 *
 * Run with: node scripts/migrate-values.mjs
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

async function migrateValues() {
  console.log('🚀 Starting values migration...\n');

  const valuesRef = collection(db, 'values');
  const snapshot = await getDocs(valuesRef);

  console.log(`📊 Found ${snapshot.docs.length} values to process\n`);

  let migratedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const valueDoc of snapshot.docs) {
    const data = valueDoc.data();
    const valueName = data.name || valueDoc.id;

    try {
      // Check if already in new format
      if (data.aligned && Array.isArray(data.aligned)) {
        console.log(`⏭️  ${valueName}: Already migrated (has aligned array)`);
        skippedCount++;
        continue;
      }

      // Convert old format to new
      const aligned = [];
      const unaligned = [];

      for (let i = 1; i <= 10; i++) {
        const alignedBrand = data[`aligned${i}`];
        const unalignedBrand = data[`unaligned${i}`];

        if (alignedBrand) {
          aligned.push(alignedBrand);
        }

        if (unalignedBrand) {
          unaligned.push(unalignedBrand);
        }
      }

      // Check if any old format data exists
      if (aligned.length === 0 && unaligned.length === 0) {
        console.log(`⏭️  ${valueName}: No old format data to migrate`);
        skippedCount++;
        continue;
      }

      console.log(`🔄 ${valueName}:`);
      console.log(`   - Converting ${aligned.length} aligned brands`);
      console.log(`   - Converting ${unaligned.length} unaligned brands`);

      // Prepare update data
      const updates = {
        aligned,
        unaligned,
      };

      // Delete old numbered fields
      const fieldsToDelete = {};
      for (let i = 1; i <= 10; i++) {
        if (data[`aligned${i}`]) fieldsToDelete[`aligned${i}`] = deleteField();
        if (data[`unaligned${i}`]) fieldsToDelete[`unaligned${i}`] = deleteField();
      }

      // Update in Firebase
      const valueRef = doc(db, 'values', valueDoc.id);
      await updateDoc(valueRef, { ...updates, ...fieldsToDelete });

      console.log(`   ✅ Migrated successfully\n`);
      migratedCount++;

    } catch (error) {
      console.error(`   ❌ Error migrating ${valueName}:`, error);
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
migrateValues()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
