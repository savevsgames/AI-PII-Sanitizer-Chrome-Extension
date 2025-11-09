/**
 * @jest-environment node
 *
 * Diagnostic test to check Firestore Security Rules
 * This test provides better error messages than the main integration tests
 */

import {
  setupIntegrationTests,
  teardownIntegrationTests,
  getCurrentTestUser,
  getTestFirestore,
} from './setup';
import { User } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
} from 'firebase/firestore';

describe('Firestore Security Rules Diagnostic', () => {
  let testUser: User;

  beforeAll(async () => {
    testUser = await setupIntegrationTests();
  }, 30000);

  afterAll(async () => {
    await teardownIntegrationTests();
  }, 30000);

  it('should write to integration-test-data collection with detailed error', async () => {
    console.log('[Diagnostic] Testing integration-test-data collection...');
    console.log('[Diagnostic] Test user UID:', testUser.uid);

    const db = getTestFirestore();
    const testData = {
      test: 'diagnostic',
      timestamp: new Date().toISOString(),
      userId: testUser.uid,
    };

    try {
      const docRef = doc(db, 'integration-test-data', 'diagnostic-test-1');
      console.log('[Diagnostic] Attempting to write to:', docRef.path);

      await setDoc(docRef, testData);

      console.log('[Diagnostic] ✅ SUCCESS - Write operation completed');
      expect(true).toBe(true);
    } catch (error: any) {
      console.error('[Diagnostic] ❌ FAILED - Error details:');
      console.error('[Diagnostic] Error code:', error.code);
      console.error('[Diagnostic] Error message:', error.message);
      console.error('[Diagnostic] Full error:', JSON.stringify(error, null, 2));

      // Fail the test with detailed error
      throw new Error(`Firestore write failed: ${error.code} - ${error.message}`);
    }
  }, 30000);
});
