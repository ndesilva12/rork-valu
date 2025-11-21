/**
 * Cleanup Script: Remove business accounts from brands collection
 *
 * Business accounts (user IDs starting with "user_") should only exist in the users collection,
 * not in the brands collection. This script removes any misplaced business documents.
 *
 * USAGE:
 * 1. Install dependencies: npm install
 * 2. Run script: npx tsx scripts/cleanupBusinessesFromBrands.ts
 *
 * ALTERNATIVE (Firebase Console):
 * 1. Go to Firebase Console > Firestore Database
 * 2. Navigate to 'brands' collection
 * 3. Filter documents where Document ID starts with "user_"
 * 4. Delete all matching documents
 *
 * NOTE: This is a ONE-TIME cleanup. After running, the filter in dataService.ts
 * prevents these from being loaded in the future.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch } from 'firebase/firestore';

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

async function cleanupBusinessesFromBrands() {
  console.log('🔍 Starting cleanup of business accounts from brands collection...\n');

  try {
    // Get all documents from brands collection
    const brandsRef = collection(db, 'brands');
    const snapshot = await getDocs(brandsRef);

    console.log(`📦 Total documents in brands collection: ${snapshot.size}\n`);

    // Find documents with user IDs (business accounts)
    const businessDocs = snapshot.docs.filter(doc => doc.id.startsWith('user_'));

    if (businessDocs.length === 0) {
      console.log('✅ No business accounts found in brands collection. Nothing to clean up!');
      return;
    }

    console.log(`⚠️  Found ${businessDocs.length} business account(s) to remove:\n`);

    // Log each business that will be deleted
    businessDocs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. ID: ${doc.id}`);
      console.log(`   Name: ${data.name || 'Unknown'}`);
      console.log(`   Category: ${data.category || 'Unknown'}`);
      console.log('');
    });

    // Confirm before deletion
    console.log('🗑️  Deleting these documents from brands collection...\n');

    // Use batched writes for efficiency (max 500 per batch)
    const batchSize = 500;
    for (let i = 0; i < businessDocs.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchDocs = businessDocs.slice(i, i + batchSize);

      batchDocs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`✅ Deleted batch ${Math.floor(i / batchSize) + 1} (${batchDocs.length} documents)`);
    }

    console.log(`\n✅ Successfully removed ${businessDocs.length} business account(s) from brands collection!`);
    console.log('💡 These businesses still exist in the users collection and are unaffected.');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

// Run the cleanup
cleanupBusinessesFromBrands()
  .then(() => {
    console.log('\n✅ Cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  });
