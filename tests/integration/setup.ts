/**
 * Integration Test Setup
 *
 * Provides helper functions for integration tests that use real Firebase authentication.
 * This file handles:
 * - Loading test credentials from .env.test.local
 * - Signing in/out the test user
 * - Cleaning up test data after tests
 */

// Polyfill fetch for Node.js environment
import fetch, { Headers, Request, Response } from 'cross-fetch';
global.fetch = fetch;
(global as any).Headers = Headers;
(global as any).Request = Request;
(global as any).Response = Response;

import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  Auth,
  User
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  Firestore
} from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.test.local') });

// Validate required environment variables
const requiredEnvVars = [
  'TEST_USER_EMAIL',
  'TEST_USER_PASSWORD',
  'TEST_USER_UID',
  'FIREBASE_TEST_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  throw new Error(
    `Missing required environment variables in .env.test.local: ${missingVars.join(', ')}\n` +
    'Please ensure .env.test.local is properly configured.'
  );
}

// Firebase configuration from environment variables
// Uses FIREBASE_TEST_API_KEY which has localhost:9876 restriction for integration tests
const firebaseConfig = {
  apiKey: process.env.FIREBASE_TEST_API_KEY!,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.FIREBASE_PROJECT_ID!,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Initialize Firebase for tests
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

/**
 * Initialize Firebase services for integration tests
 */
export function initializeFirebaseForTests(): void {
  if (!app) {
    app = initializeApp(firebaseConfig, 'integration-tests');
    auth = getAuth(app);
    db = getFirestore(app);

    console.log('[Integration Test] Firebase initialized');
    console.log('[Integration Test] Project:', firebaseConfig.projectId);
  }
}

/**
 * Get Firebase Auth instance
 */
export function getTestAuth(): Auth {
  if (!auth) {
    initializeFirebaseForTests();
  }
  return auth;
}

/**
 * Get Firestore instance
 */
export function getTestFirestore(): Firestore {
  if (!db) {
    initializeFirebaseForTests();
  }
  return db;
}

/**
 * Sign in the test user
 * @returns The signed-in user
 */
export async function signInTestUser(): Promise<User> {
  const testAuth = getTestAuth();

  console.log('[Integration Test] Signing in test user...');
  console.log('[Integration Test] Email:', process.env.TEST_USER_EMAIL);

  try {
    const userCredential = await signInWithEmailAndPassword(
      testAuth,
      process.env.TEST_USER_EMAIL!,
      process.env.TEST_USER_PASSWORD!
    );

    console.log('[Integration Test] ✅ Signed in as:', userCredential.user.email);
    console.log('[Integration Test] UID:', userCredential.user.uid);

    // Verify UID matches expected
    if (userCredential.user.uid !== process.env.TEST_USER_UID) {
      console.warn(
        '[Integration Test] ⚠️  UID mismatch!\n' +
        `Expected: ${process.env.TEST_USER_UID}\n` +
        `Got: ${userCredential.user.uid}\n` +
        'Please update TEST_USER_UID in .env.test.local'
      );
    }

    return userCredential.user;
  } catch (error: any) {
    console.error('[Integration Test] ❌ Sign-in failed:', error.message);
    console.error('[Integration Test] Error code:', error.code);

    if (error.code === 'auth/user-not-found') {
      console.error(
        '[Integration Test] User not found. Please create the test user:\n' +
        '1. Go to Firebase Console → Authentication → Users\n' +
        '2. Click "Add User"\n' +
        `3. Email: ${process.env.TEST_USER_EMAIL}\n` +
        `4. Password: ${process.env.TEST_USER_PASSWORD}\n`
      );
    } else if (error.code === 'auth/wrong-password') {
      console.error(
        '[Integration Test] Wrong password. Please verify:\n' +
        '1. TEST_USER_PASSWORD in .env.test.local matches Firebase\n' +
        '2. Or reset password in Firebase Console'
      );
    } else if (error.code === 'auth/invalid-api-key') {
      console.error(
        '[Integration Test] Invalid API key. Please verify:\n' +
        '1. FIREBASE_API_KEY in .env.test.local is correct\n' +
        '2. API key has proper restrictions in Google Cloud Console'
      );
    }

    throw error;
  }
}

/**
 * Sign out the current user
 */
export async function signOutTestUser(): Promise<void> {
  const testAuth = getTestAuth();

  if (testAuth.currentUser) {
    console.log('[Integration Test] Signing out:', testAuth.currentUser.email);
    await signOut(testAuth);
    console.log('[Integration Test] ✅ Signed out');
  }
}

/**
 * Clean up test data from Firestore
 * Deletes all documents in the test user's collection
 */
export async function cleanupTestData(): Promise<void> {
  const testDb = getTestFirestore();
  const userId = process.env.TEST_USER_UID!;

  console.log('[Integration Test] Cleaning up test data for user:', userId);

  try {
    // Clean up user's stored rules
    const rulesQuery = query(
      collection(testDb, 'users', userId, 'rules')
    );
    const rulesSnapshot = await getDocs(rulesQuery);

    console.log(`[Integration Test] Deleting ${rulesSnapshot.size} test rules...`);
    const deletePromises = rulesSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    // Clean up user's stored patterns
    const patternsQuery = query(
      collection(testDb, 'users', userId, 'patterns')
    );
    const patternsSnapshot = await getDocs(patternsQuery);

    console.log(`[Integration Test] Deleting ${patternsSnapshot.size} test patterns...`);
    const patternDeletePromises = patternsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(patternDeletePromises);

    console.log('[Integration Test] ✅ Test data cleaned up');
  } catch (error: any) {
    console.error('[Integration Test] ⚠️  Cleanup failed:', error.message);
    // Don't throw - cleanup failures shouldn't break tests
  }
}

/**
 * Setup function to run before all integration tests
 */
export async function setupIntegrationTests(): Promise<User> {
  console.log('\n' + '='.repeat(60));
  console.log('Integration Test Setup');
  console.log('='.repeat(60));

  initializeFirebaseForTests();
  const user = await signInTestUser();

  console.log('='.repeat(60) + '\n');

  return user;
}

/**
 * Teardown function to run after all integration tests
 */
export async function teardownIntegrationTests(): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('Integration Test Teardown');
  console.log('='.repeat(60));

  await cleanupTestData();
  await signOutTestUser();

  console.log('='.repeat(60) + '\n');
}

/**
 * Get the current test user
 * @throws Error if no user is signed in
 */
export function getCurrentTestUser(): User {
  const testAuth = getTestAuth();

  if (!testAuth.currentUser) {
    throw new Error(
      'No user signed in. Call signInTestUser() before running tests.'
    );
  }

  return testAuth.currentUser;
}

/**
 * Wait for Firebase operation to complete
 * Useful for ensuring Firestore writes are committed
 */
export async function waitForFirebase(ms: number = 1000): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
