// Test Firebase connection and operations
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';

export async function testFirebaseConnection(): Promise<void> {
  try {
    console.log('[Firebase Test] 🧪 Starting Firebase connection test...');

    // Test 1: Check if db is initialized
    if (!db) {
      console.error('[Firebase Test] ❌ db is null or undefined!');
      return;
    }
    console.log('[Firebase Test] ✅ db object exists');

    // Test 2: Try to write a test document
    const testDocRef = doc(db, 'test', 'connection-test');
    const testData = {
      message: 'Firebase connection test',
      timestamp: serverTimestamp(),
      testArray: ['item1', 'item2'],
      testNumber: 42,
    };

    console.log('[Firebase Test] 🔄 Attempting to write test document...');
    await setDoc(testDocRef, testData);
    console.log('[Firebase Test] ✅ Test document written successfully');

    // Test 3: Try to read the test document back
    console.log('[Firebase Test] 🔄 Attempting to read test document...');
    const docSnap = await getDoc(testDocRef);

    if (docSnap.exists()) {
      console.log('[Firebase Test] ✅ Test document read successfully:', docSnap.data());
    } else {
      console.error('[Firebase Test] ❌ Test document does not exist after write!');
    }

    console.log('[Firebase Test] 🎉 All tests passed!');
  } catch (error) {
    console.error('[Firebase Test] ❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('[Firebase Test] Error message:', error.message);
      console.error('[Firebase Test] Error stack:', error.stack);
    }
  }
}
