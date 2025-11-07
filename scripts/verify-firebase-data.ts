/**
 * Verify Firebase brands and values collections
 */
import { db } from '../firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';

async function verifyFirebaseData() {
  console.log('🔍 Checking Firebase collections...\n');

  try {
    // Check brands collection
    console.log('📦 Checking brands collection...');
    const brandsRef = collection(db, 'brands');
    const brandsSnapshot = await getDocs(brandsRef);
    console.log(`✅ Found ${brandsSnapshot.size} documents in brands collection`);

    if (brandsSnapshot.size > 0) {
      const firstBrand = brandsSnapshot.docs[0];
      console.log('First brand sample:', {
        id: firstBrand.id,
        data: firstBrand.data()
      });
    }

    // Check values collection
    console.log('\n📊 Checking values collection...');
    const valuesRef = collection(db, 'values');
    const valuesSnapshot = await getDocs(valuesRef);
    console.log(`✅ Found ${valuesSnapshot.size} documents in values collection`);

    if (valuesSnapshot.size > 0) {
      const firstValue = valuesSnapshot.docs[0];
      console.log('First value sample:', {
        id: firstValue.id,
        data: firstValue.data()
      });
    }

    console.log('\n✅ Firebase verification complete!');
    console.log('\n📋 Summary:');
    console.log(`   - Brands: ${brandsSnapshot.size} documents`);
    console.log(`   - Values: ${valuesSnapshot.size} documents`);

  } catch (error) {
    console.error('❌ Error verifying Firebase data:', error);
    process.exit(1);
  }
}

verifyFirebaseData();
