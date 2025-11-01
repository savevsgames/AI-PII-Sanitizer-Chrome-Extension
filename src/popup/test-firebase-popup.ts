/**
 * Firebase Test for Popup
 * Simple test that uses the bundled Firebase SDK
 */

import { auth, db } from '../lib/firebase';
import { signInAnonymously, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

export async function testFirebaseConnection() {
  console.log('========================================');
  console.log('[Firebase Test] Starting...');
  console.log('========================================');

  try {
    // Test 1: Check initialization
    console.log('[Test 1] Firebase initialized');
    console.log('  Project ID:', process.env.FIREBASE_PROJECT_ID);

    // Test 2: Anonymous sign-in
    console.log('[Test 2] Signing in anonymously...');
    const userCred = await signInAnonymously(auth);
    const userId = userCred.user.uid;
    console.log('  ✅ Auth works! User ID:', userId);

    // Test 3: Firestore write
    console.log('[Test 3] Writing to Firestore...');
    const testDoc = doc(db, `users/${userId}`);
    const testData = {
      email: 'test@example.com',
      createdAt: Date.now(),
      tier: 'free',
      testRun: new Date().toISOString(),
    };
    await setDoc(testDoc, testData);
    console.log('  ✅ Write successful!');

    // Test 4: Firestore read
    console.log('[Test 4] Reading from Firestore...');
    const snapshot = await getDoc(testDoc);
    if (snapshot.exists()) {
      console.log('  ✅ Read successful!', snapshot.data());
    } else {
      throw new Error('Document not found');
    }

    // Test 5: Cleanup
    console.log('[Test 5] Cleaning up...');
    await deleteDoc(testDoc);
    await signOut(auth);
    console.log('  ✅ Cleanup complete');

    console.log('');
    console.log('========================================');
    console.log('🎉 ALL TESTS PASSED!');
    console.log('========================================');
    console.log('Firebase is ready for authentication UI!');
    console.log('');

    return true;
  } catch (error: any) {
    console.error('');
    console.error('========================================');
    console.error('❌ TEST FAILED!');
    console.error('========================================');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('');
    console.error('Troubleshooting:');
    console.error('  1. Enable Anonymous Auth in Firebase Console');
    console.error('  2. Verify security rules deployed');
    console.error('  3. Check .env file has correct config');
    console.error('  4. Rebuild: npm run build');
    console.error('');

    return false;
  }
}

// Auto-run test if in development mode
if (process.env.NODE_ENV === 'development') {
  console.log('[Firebase Test] Development mode detected - running test...');
  testFirebaseConnection();
}
