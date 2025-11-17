/**
 * Script to update all existing user profiles to be public
 * Run this script with: node scripts/makeAllProfilesPublic.js
 *
 * Note: This uses Firebase Admin SDK for server-side operations
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'upright-social',
  });
}

const db = admin.firestore();

async function makeAllProfilesPublic() {
  try {
    console.log('🔄 Starting to update all user profiles to public...');

    const usersRef = db.collection('users');
    const querySnapshot = await usersRef.get();

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
        await userDoc.ref.update({
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

    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
makeAllProfilesPublic();
