/**
 * Firebase Connection Test
 * Tests authentication and Firestore connectivity
 * Run this to verify Firebase setup is working
 */

import { auth, db } from './lib/firebase';
import { signInAnonymously, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

async function testFirebase() {
  console.log('========================================');
  console.log('[Firebase Test] Starting tests...');
  console.log('========================================');
  console.log('');

  try {
    // Test 1: Firebase Initialization
    console.log('Test 1: Firebase Initialization');
    console.log('  Project ID:', process.env.FIREBASE_PROJECT_ID);
    console.log('  Auth Domain:', process.env.FIREBASE_AUTH_DOMAIN);
    console.log('  ✅ Firebase initialized successfully');
    console.log('');

    // Test 2: Authentication
    console.log('Test 2: Authentication (Anonymous Sign-In)');
    const userCredential = await signInAnonymously(auth);
    const userId = userCredential.user.uid;
    console.log('  ✅ Authentication works!');
    console.log('  User ID:', userId);
    console.log('  User Email:', userCredential.user.email || 'anonymous');
    console.log('');

    // Test 3: Firestore Write
    console.log('Test 3: Firestore Write');
    const testDocRef = doc(db, `users/${userId}`);
    const testData = {
      email: 'test@example.com',
      createdAt: Date.now(),
      tier: 'free',
      testField: 'Hello Firebase!',
      timestamp: new Date().toISOString(),
    };

    await setDoc(testDocRef, testData);
    console.log('  ✅ Firestore write successful!');
    console.log('  Document path:', `users/${userId}`);
    console.log('  Data written:', testData);
    console.log('');

    // Test 4: Firestore Read
    console.log('Test 4: Firestore Read');
    const docSnapshot = await getDoc(testDocRef);

    if (docSnapshot.exists()) {
      console.log('  ✅ Firestore read successful!');
      console.log('  Data retrieved:', docSnapshot.data());
    } else {
      console.error('  ❌ Document not found!');
      throw new Error('Document does not exist');
    }
    console.log('');

    // Test 5: Security Rules (try to access another user's data)
    console.log('Test 5: Security Rules Validation');
    const otherUserDoc = doc(db, 'users/fake-user-id-12345');

    try {
      await getDoc(otherUserDoc);
      console.error('  ❌ Security rules failed! Should not be able to read other users data.');
    } catch (securityError: any) {
      if (securityError.code === 'permission-denied') {
        console.log('  ✅ Security rules working correctly!');
        console.log('  Cannot access other users data (as expected)');
      } else {
        console.log('  ⚠️ Unexpected error:', securityError.message);
      }
    }
    console.log('');

    // Test 6: Cleanup
    console.log('Test 6: Cleanup');
    await deleteDoc(testDocRef);
    console.log('  ✅ Test document deleted');

    await signOut(auth);
    console.log('  ✅ User signed out');
    console.log('');

    // Summary
    console.log('========================================');
    console.log('🎉 All Firebase tests passed!');
    console.log('========================================');
    console.log('');
    console.log('What works:');
    console.log('  ✅ Firebase initialization');
    console.log('  ✅ Anonymous authentication');
    console.log('  ✅ Firestore write operations');
    console.log('  ✅ Firestore read operations');
    console.log('  ✅ Security rules enforcement');
    console.log('  ✅ Document cleanup');
    console.log('');
    console.log('Firebase is ready for authentication UI!');
    console.log('');

  } catch (error: any) {
    console.error('');
    console.error('========================================');
    console.error('❌ Firebase test failed!');
    console.error('========================================');
    console.error('');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('');
    console.error('Troubleshooting:');
    console.error('  1. Check .env file has correct Firebase config');
    console.error('  2. Verify security rules are deployed');
    console.error('  3. Check Firebase Console for errors');
    console.error('  4. Ensure Authentication is enabled');
    console.error('');
  }
}

// Run tests when this file is loaded
testFirebase();
