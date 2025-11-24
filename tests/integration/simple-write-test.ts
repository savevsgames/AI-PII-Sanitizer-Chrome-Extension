/**
 * Simplest possible Firestore write test
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';

// Load test environment
dotenv.config({ path: 'H:/AI_Interceptor/.env.test.local' });

async function simpleWriteTest() {
  console.log('=== Simple Firestore Write Test ===');

  // Initialize Firebase
  const firebaseConfig = {
    apiKey: process.env.FIREBASE_TEST_API_KEY!,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.FIREBASE_PROJECT_ID!,
  };

  console.log('1. Initializing Firebase...');
  console.log('   Project ID:', firebaseConfig.projectId);
  const app = initializeApp(firebaseConfig, 'simple-test');

  console.log('2. Getting Auth instance...');
  const auth = getAuth(app);

  console.log('3. Getting Firestore instance...');
  const db = getFirestore(app);

  console.log('4. Signing in...');
  const userCred = await signInWithEmailAndPassword(
    auth,
    process.env.INTEGRATION_TEST_USER_EMAIL!,
    process.env.INTEGRATION_TEST_USER_PASSWORD!
  );
  console.log('   ✓ Signed in as:', userCred.user.email);
  console.log('   ✓ UID:', userCred.user.uid);

  console.log('5. Attempting write with 10 second timeout...');
  const testData = {
    test: 'simple-write',
    timestamp: new Date().toISOString(),
  };

  // Create a promise with timeout
  const writePromise = setDoc(doc(db, 'integration-test-data', 'simple-test'), testData);
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Timeout after 10 seconds')), 10000);
  });

  try {
    await Promise.race([writePromise, timeoutPromise]);
    console.log('   ✓ Write succeeded!');
  } catch (error: any) {
    console.error('   ✗ Write failed:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Full error:', error);
    throw error;
  }
}

simpleWriteTest()
  .then(() => {
    console.log('\n✓ Test passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Test failed:', error.message);
    process.exit(1);
  });
