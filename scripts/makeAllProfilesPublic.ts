/**
 * Script to update all existing user profiles to be public
 * Run this script with: npx tsx scripts/makeAllProfilesPublic.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// Firebase configuration (should match your main config)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function makeAllProfilesPublic() {
  try {
    console.log('🔄 Starting to update all user profiles to public...');

    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const userDoc of querySnapshot.docs) {
      try {
        const data = userDoc.data();
        const userId = userDoc.id;

        // Check if already public
        if (data.isPublicProfile === true) {
          console.log(`⏭️  Skipping user ${userId} (already public)`);
          skipped++;
          continue;
        }

        // Update to public
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          isPublicProfile: true,
          alignedListPublic: true,
          unalignedListPublic: true,
        });

        console.log(`✅ Updated user ${userId} to public`);
        updated++;
      } catch (error) {
        console.error(`❌ Error updating user ${userDoc.id}:`, error);
        errors++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Total users: ${querySnapshot.size}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped (already public): ${skipped}`);
    console.log(`   Errors: ${errors}`);
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
makeAllProfilesPublic();
