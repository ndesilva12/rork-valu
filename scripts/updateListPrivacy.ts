/**
 * Migration script to update list privacy settings
 *
 * Rules:
 * - All endorsement lists: isPublic = true
 * - All user profile aligned lists: alignedListPublic = false
 * - All user profile unaligned lists: unalignedListPublic = false
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, query } from 'firebase/firestore';

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

async function updateListPrivacy() {
  console.log('Starting list privacy migration...');

  try {
    // Update all user lists to set endorsement lists as public
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    let usersUpdated = 0;
    let listsUpdated = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();

      // Update user profile: aligned and unaligned lists are now always private
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        alignedListPublic: false,
        unalignedListPublic: false,
      });
      usersUpdated++;

      // Get user's lists
      const listsRef = collection(db, 'userLists');
      const listsQuery = query(listsRef);
      const listsSnapshot = await getDocs(listsQuery);

      for (const listDoc of listsSnapshot.docs) {
        const listData = listDoc.data();

        // Only update lists for this user
        if (listData.userId === userId) {
          const listRef = doc(db, 'userLists', listDoc.id);

          // Check if this is an endorsement list (oldest list for the user, or named after user)
          const userName = userData.userDetails?.name || userData.fullName || 'User';
          const isEndorsementList = listData.name === userName;

          if (isEndorsementList) {
            // Endorsement lists are always public
            await updateDoc(listRef, {
              isPublic: true,
            });
            console.log(`Updated endorsement list for user ${userId}: ${listDoc.id}`);
            listsUpdated++;
          }
        }
      }
    }

    console.log(`\nMigration complete!`);
    console.log(`Users updated: ${usersUpdated}`);
    console.log(`Endorsement lists updated: ${listsUpdated}`);
    console.log(`\nAll aligned and unaligned lists are now private by default.`);
    console.log(`All endorsement lists are now public.`);

  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
}

// Run the migration
updateListPrivacy()
  .then(() => {
    console.log('Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
