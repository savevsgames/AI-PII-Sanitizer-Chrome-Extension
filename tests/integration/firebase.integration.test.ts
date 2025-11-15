/**
 * @jest-environment node
 *
 * Integration Tests for Firebase Auth + Firestore
 *
 * These tests use a real Firebase user to test:
 * - Real Firebase Authentication
 * - Real Firestore read/write operations
 * - Real Firebase Security Rules enforcement
 *
 * This gives us confidence that our Firebase setup works correctly.
 */

import {
  setupIntegrationTests,
  teardownIntegrationTests,
  getCurrentTestUser,
  getTestFirestore,
  waitForFirebase,
} from './setup';
import { User } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';

describe('Firebase Integration Tests (Real Firebase)', () => {
  let testUser: User;

  // Sign in before all tests
  beforeAll(async () => {
    testUser = await setupIntegrationTests();
  }, 30000); // 30 second timeout for sign-in

  // Clean up and sign out after all tests
  afterAll(async () => {
    await teardownIntegrationTests();
  }, 30000);

  describe('Firebase Authentication', () => {
    it('should have a valid authenticated user', () => {
      expect(testUser).toBeDefined();
      expect(testUser.email).toBe(process.env.INTEGRATION_TEST_USER_EMAIL);
      expect(testUser.uid).toBe(process.env.INTEGRATION_TEST_USER_UID);

      console.log('[Test] ✅ User authentication verified');
    });

    it('should maintain authentication throughout tests', () => {
      const currentUser = getCurrentTestUser();

      expect(currentUser).toBeDefined();
      expect(currentUser.uid).toBe(testUser.uid);
      expect(currentUser.email).toBe(testUser.email);

      console.log('[Test] ✅ User session maintained');
    });

    it('should have user metadata', () => {
      expect(testUser.metadata).toBeDefined();
      expect(testUser.metadata.creationTime).toBeDefined();

      console.log('[Test] ✅ User metadata available');
      console.log('[Test] Account created:', testUser.metadata.creationTime);
    });
  });

  describe('Firestore Read/Write Operations', () => {
    const testCollection = 'integration-test-data';
    const testDocId = 'test-doc-1';

    it('should write a document to Firestore', async () => {
      console.log('[Test] Writing document to Firestore...');

      const db = getTestFirestore();
      const testData = {
        name: 'Integration Test',
        value: 12345,
        timestamp: new Date().toISOString(),
        userId: testUser.uid,
      };

      const docRef = doc(db, testCollection, testDocId);
      await setDoc(docRef, testData);

      console.log('[Test] ✅ Document written successfully');

      // Wait for Firestore to commit
      await waitForFirebase(1000);
    }, 15000);

    it('should read the document from Firestore', async () => {
      console.log('[Test] Reading document from Firestore...');

      const db = getTestFirestore();
      const docRef = doc(db, testCollection, testDocId);
      const docSnap = await getDoc(docRef);

      expect(docSnap.exists()).toBe(true);
      expect(docSnap.data()).toMatchObject({
        name: 'Integration Test',
        value: 12345,
        userId: testUser.uid,
      });

      console.log('[Test] ✅ Document read successfully');
      console.log('[Test] Data:', docSnap.data());
    }, 15000);

    it('should update a document in Firestore', async () => {
      console.log('[Test] Updating document in Firestore...');

      const db = getTestFirestore();
      const docRef = doc(db, testCollection, testDocId);

      await setDoc(docRef, {
        name: 'Updated Integration Test',
        value: 99999,
        timestamp: new Date().toISOString(),
        userId: testUser.uid,
        updated: true,
      });

      await waitForFirebase(1000);

      const docSnap = await getDoc(docRef);
      expect(docSnap.data()?.name).toBe('Updated Integration Test');
      expect(docSnap.data()?.value).toBe(99999);
      expect(docSnap.data()?.updated).toBe(true);

      console.log('[Test] ✅ Document updated successfully');
    }, 15000);

    it('should write multiple documents', async () => {
      console.log('[Test] Writing multiple documents...');

      const db = getTestFirestore();

      for (let i = 1; i <= 3; i++) {
        const docRef = doc(db, testCollection, `test-doc-${i + 1}`);
        await setDoc(docRef, {
          name: `Test Document ${i}`,
          value: i * 100,
          userId: testUser.uid,
        });
      }

      await waitForFirebase(1000);

      // Query all documents
      const querySnapshot = await getDocs(collection(db, testCollection));

      expect(querySnapshot.size).toBeGreaterThanOrEqual(4); // Original + 3 new

      console.log('[Test] ✅ Multiple documents written');
      console.log('[Test] Total documents:', querySnapshot.size);
    }, 15000);

    it('should query documents by userId', async () => {
      console.log('[Test] Querying documents by userId...');

      const db = getTestFirestore();
      const q = query(
        collection(db, testCollection),
        where('userId', '==', testUser.uid)
      );

      const querySnapshot = await getDocs(q);

      expect(querySnapshot.size).toBeGreaterThan(0);
      querySnapshot.forEach(doc => {
        expect(doc.data().userId).toBe(testUser.uid);
      });

      console.log('[Test] ✅ Query successful');
      console.log('[Test] Found', querySnapshot.size, 'documents for user');
    }, 15000);

    it('should delete a document from Firestore', async () => {
      console.log('[Test] Deleting document from Firestore...');

      const db = getTestFirestore();
      const docRef = doc(db, testCollection, testDocId);

      await deleteDoc(docRef);
      await waitForFirebase(1000);

      const docSnap = await getDoc(docRef);
      expect(docSnap.exists()).toBe(false);

      console.log('[Test] ✅ Document deleted successfully');
    }, 15000);

    // Clean up all test documents
    afterAll(async () => {
      console.log('[Test] Cleaning up all test documents...');

      const db = getTestFirestore();
      const querySnapshot = await getDocs(collection(db, testCollection));

      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      console.log('[Test] ✅ Cleaned up', querySnapshot.size, 'test documents');
    }, 15000);
  });

  describe('User-Specific Collections', () => {
    it('should write to user-specific subcollection', async () => {
      console.log('[Test] Writing to user subcollection...');

      const db = getTestFirestore();
      const userDocRef = doc(db, 'users', testUser.uid);
      const testDataRef = doc(collection(userDocRef, 'testData'), 'test-item-1');

      await setDoc(testDataRef, {
        name: 'User-specific test data',
        created: new Date().toISOString(),
      });

      await waitForFirebase(1000);

      const docSnap = await getDoc(testDataRef);
      expect(docSnap.exists()).toBe(true);
      expect(docSnap.data()?.name).toBe('User-specific test data');

      console.log('[Test] ✅ User subcollection write successful');
    }, 15000);

    it('should read from user-specific subcollection', async () => {
      console.log('[Test] Reading from user subcollection...');

      const db = getTestFirestore();
      const userDocRef = doc(db, 'users', testUser.uid);
      const testDataSnapshot = await getDocs(collection(userDocRef, 'testData'));

      expect(testDataSnapshot.size).toBeGreaterThan(0);

      console.log('[Test] ✅ User subcollection read successful');
      console.log('[Test] Found', testDataSnapshot.size, 'items in user subcollection');
    }, 15000);

    // Clean up user-specific test data
    afterAll(async () => {
      console.log('[Test] Cleaning up user subcollection...');

      const db = getTestFirestore();
      const userDocRef = doc(db, 'users', testUser.uid);
      const testDataSnapshot = await getDocs(collection(userDocRef, 'testData'));

      const deletePromises = testDataSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      console.log('[Test] ✅ Cleaned up user subcollection');
    }, 15000);
  });
});
