/**
 * Migration Script: Initialize all existing business owners as team members
 *
 * This script finds all business accounts and ensures each owner is properly
 * initialized in the businessTeamMembers collection.
 */

import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { initializeBusinessOwner } from '../services/firebase/businessTeamService';

async function migrateBusinessOwners() {
  console.log('🚀 Starting business owner migration...\n');

  try {
    // Get all users with accountType === 'business'
    const usersRef = collection(db, 'users');
    const businessQuery = query(usersRef, where('accountType', '==', 'business'));
    const businessSnapshot = await getDocs(businessQuery);

    console.log(`📊 Found ${businessSnapshot.size} business accounts\n`);

    if (businessSnapshot.empty) {
      console.log('✅ No business accounts found. Migration complete.');
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    // Process each business
    for (const userDoc of businessSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      const businessName = userData.businessInfo?.name;
      const email = userData.email || '';

      console.log(`\n📍 Processing: ${userId}`);
      console.log(`   Business: ${businessName || 'Unknown'}`);
      console.log(`   Email: ${email || 'N/A'}`);

      if (!businessName) {
        console.log(`   ⚠️  Skipped - No business name found`);
        skippedCount++;
        continue;
      }

      try {
        // Check if already exists in businessTeamMembers
        const teamMembersRef = collection(db, 'businessTeamMembers');
        const existingQuery = query(
          teamMembersRef,
          where('businessId', '==', userId),
          where('role', '==', 'owner')
        );
        const existingSnapshot = await getDocs(existingQuery);

        if (!existingSnapshot.empty) {
          console.log(`   ✓ Already initialized`);
          skippedCount++;
          continue;
        }

        // Initialize the owner
        await initializeBusinessOwner(userId, businessName, email);
        console.log(`   ✅ Successfully initialized`);
        successCount++;

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`   ❌ Error:`, error instanceof Error ? error.message : error);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully initialized: ${successCount}`);
    console.log(`⏭️  Already initialized: ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📈 Total processed: ${businessSnapshot.size}`);
    console.log('='.repeat(60));

    if (errorCount > 0) {
      console.log('\n⚠️  Migration completed with errors. Review the output above.');
      process.exit(1);
    } else {
      console.log('\n🎉 Migration completed successfully!');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ Fatal error during migration:', error);
    process.exit(1);
  }
}

// Run the migration
migrateBusinessOwners();
