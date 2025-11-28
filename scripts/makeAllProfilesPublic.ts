/**
 * Migration script to make all user profiles public
 *
 * This script updates all existing user profiles to have isPublicProfile = true
 * so they appear in the Top Users section and can be viewed by other users.
 *
 * Run with: npx ts-node --esm scripts/makeAllProfilesPublic.ts
 * Or: node --loader ts-node/esm scripts/makeAllProfilesPublic.ts
 */

// Use require for CommonJS compatibility
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function makeAllProfilesPublic() {
  console.log('Starting profile visibility migration...');
  console.log('This will make all user profiles public.\n');

  try {
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    let totalUsers = 0;
    let updatedUsers = 0;
    let alreadyPublic = 0;

    for (const userDoc of usersSnapshot.docs) {
      totalUsers++;
      const userId = userDoc.id;
      const userData = userDoc.data();

      // Check current visibility status
      const currentlyPublic = userData.isPublicProfile === true;

      if (currentlyPublic) {
        alreadyPublic++;
        console.log(`[SKIP] User ${userId} - already public`);
        continue;
      }

      // Update user to be public
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isPublicProfile: true,
      });

      updatedUsers++;
      const userName = userData.userDetails?.name || userData.fullName || userData.email || 'Unknown';
      console.log(`[UPDATED] User ${userId} (${userName}) - now public`);
    }

    console.log(`\n========================================`);
    console.log(`Migration complete!`);
    console.log(`========================================`);
    console.log(`Total users processed: ${totalUsers}`);
    console.log(`Users updated to public: ${updatedUsers}`);
    console.log(`Users already public: ${alreadyPublic}`);
    console.log(`\nAll user profiles are now public and will appear in the Top Users section.`);

  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
}

// Run the migration
makeAllProfilesPublic()
  .then(() => {
    console.log('\nMigration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
