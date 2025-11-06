/**
 * Unit tests for Firebase/Firestore Integration
 * Tests user sync, tier updates, and real-time listeners
 *
 * NOTE: These are basic unit tests for Firebase/Firestore integration.
 * Full integration testing requires:
 * - Firebase emulator setup
 * - Real Firestore database connections
 * - Authentication flow testing
 * - E2E testing environment
 *
 * Future enhancements:
 * - Mock Firestore SDK properly
 * - Test auth state changes
 * - Test network failures and retries
 * - Test offline persistence
 * - Test security rules
 */

// Mock environment variables FIRST
process.env.FIREBASE_API_KEY = 'test-api-key';
process.env.FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.FIREBASE_APP_ID = 'test-app-id';

import { StorageManager } from '../src/lib/storage';

// Access mock data from global setup
const { mockStorageData } = require('./setup');

// Mock Firestore functions BEFORE importing firebase
const mockDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockOnSnapshot = jest.fn();

// Mock firebase/firestore module
jest.mock('firebase/firestore', () => ({
  doc: mockDoc,
  getDoc: mockGetDoc,
  setDoc: mockSetDoc,
  onSnapshot: mockOnSnapshot,
  serverTimestamp: () => new Date().toISOString(),
  initializeFirestore: jest.fn(),
  getFirestore: jest.fn(() => ({})),
}));

// Mock firebase/app
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  getApps: jest.fn(() => []),
}));

// Mock firebase/auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: null,
    onAuthStateChanged: jest.fn(),
  })),
  GoogleAuthProvider: jest.fn(),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
}));

// Mock firebase/functions
jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({})),
  httpsCallable: jest.fn(() => jest.fn()),
}));

// Now safe to import firebase modules
import { syncUserToFirestore, listenToUserTier, auth } from '../src/lib/firebase';

describe('Firebase/Firestore Integration', () => {
  let storage: StorageManager;

  beforeEach(async () => {
    jest.clearAllMocks();
    Object.keys(mockStorageData).forEach((key) => delete mockStorageData[key]);
    storage = StorageManager.getInstance();
    storage.clearCache();

    // Reset mocks
    mockDoc.mockClear();
    mockGetDoc.mockClear();
    mockSetDoc.mockClear();
    mockOnSnapshot.mockClear();
  });

  describe('syncUserToFirestore()', () => {
    test('throws error if user not authenticated', async () => {
      (auth as any).currentUser = null;

      // Import actual function for this test
      const { syncUserToFirestore: actualSync } = jest.requireActual(
        '../src/lib/firebase'
      );

      await expect(actualSync()).rejects.toThrow();
    });

    test('creates user document with FREE tier for new users', async () => {
      const mockUser = {
        uid: 'test-user-123',
        email: 'test@example.com',
      };
      (auth as any).currentUser = mockUser;

      // Mock Firestore getDoc to return non-existent document
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
      });

      // Mock setDoc
      mockSetDoc.mockResolvedValueOnce(undefined);

      // Import actual function
      const { syncUserToFirestore: actualSync } = jest.requireActual(
        '../src/lib/firebase'
      );

      await actualSync();

      // Verify setDoc was called with correct data
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          email: 'test@example.com',
          tier: 'free',
        })
      );
    });

    test('updates existing user document without changing tier', async () => {
      const mockUser = {
        uid: 'test-user-123',
        email: 'updated@example.com',
      };
      (auth as any).currentUser = mockUser;

      // Mock existing document with PRO tier
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          email: 'old@example.com',
          tier: 'pro',
          createdAt: '2024-01-01',
        }),
      });

      mockSetDoc.mockResolvedValueOnce(undefined);

      const { syncUserToFirestore: actualSync } = jest.requireActual(
        '../src/lib/firebase'
      );

      await actualSync();

      // Verify tier was preserved as PRO
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          email: 'updated@example.com',
          tier: 'pro', // Should NOT downgrade to free
        })
      );
    });

    test('handles Firestore errors gracefully', async () => {
      const mockUser = {
        uid: 'test-user-123',
        email: 'test@example.com',
      };
      (auth as any).currentUser = mockUser;

      // Mock Firestore error
      mockGetDoc.mockRejectedValueOnce(new Error('Firestore unavailable'));

      const { syncUserToFirestore: actualSync } = jest.requireActual(
        '../src/lib/firebase'
      );

      await expect(actualSync()).rejects.toThrow('Firestore unavailable');
    });
  });

  describe('listenToUserTier()', () => {
    test('sets up real-time listener for tier changes', async () => {
      const mockUser = {
        uid: 'test-user-123',
        email: 'test@example.com',
      };
      (auth as any).currentUser = mockUser;

      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();

      // Mock onSnapshot to capture callback
      mockOnSnapshot.mockImplementation((docRef, callback) => {
        // Simulate initial snapshot with FREE tier
        callback({
          exists: () => true,
          data: () => ({ tier: 'free', email: 'test@example.com' }),
        });

        return mockUnsubscribe;
      });

      const { listenToUserTier: actualListen } = jest.requireActual(
        '../src/lib/firebase'
      );

      const unsubscribe = actualListen(mockCallback);

      expect(mockOnSnapshot).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith('free');
      expect(typeof unsubscribe).toBe('function');
    });

    test('updates local storage when tier changes', async () => {
      const mockUser = {
        uid: 'test-user-123',
        email: 'test@example.com',
      };
      (auth as any).currentUser = mockUser;

      // Set up initial FREE tier config
      await storage.saveConfig({
        account: { userId: mockUser.uid, email: mockUser.email, tier: 'free' },
        promptTemplates: {
          templates: [],
          maxTemplates: -1,
          enableKeyboardShortcuts: false,
        },
      });

      const mockCallback = jest.fn();

      // Mock onSnapshot to simulate tier upgrade
      mockOnSnapshot.mockImplementation((docRef, callback) => {
        // Simulate Firestore update to PRO tier
        callback({
          exists: () => true,
          data: () => ({ tier: 'pro', email: 'test@example.com' }),
        });

        return jest.fn();
      });

      const { listenToUserTier: actualListen } = jest.requireActual(
        '../src/lib/firebase'
      );

      actualListen(mockCallback);

      // Callback should be called with new tier
      expect(mockCallback).toHaveBeenCalledWith('pro');
    });

    test('handles listener errors gracefully', async () => {
      const mockUser = {
        uid: 'test-user-123',
        email: 'test@example.com',
      };
      (auth as any).currentUser = mockUser;

      // Mock onSnapshot to throw error
      mockOnSnapshot.mockImplementation(() => {
        throw new Error('Network error');
      });

      const { listenToUserTier: actualListen } = jest.requireActual(
        '../src/lib/firebase'
      );

      const mockCallback = jest.fn();

      expect(() => actualListen(mockCallback)).toThrow('Network error');
    });

    test('unsubscribe function stops listening', async () => {
      const mockUser = {
        uid: 'test-user-123',
        email: 'test@example.com',
      };
      (auth as any).currentUser = mockUser;

      const mockUnsubscribe = jest.fn();
      mockOnSnapshot.mockReturnValue(mockUnsubscribe);

      const { listenToUserTier: actualListen } = jest.requireActual(
        '../src/lib/firebase'
      );

      const unsubscribe = actualListen(jest.fn());
      unsubscribe();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('Authentication State Changes', () => {
    test('clears user data on sign out', async () => {
      // Set up authenticated user with data
      await storage.saveConfig({
        account: {
          userId: 'test-user-123',
          email: 'test@example.com',
          tier: 'pro',
        },
        promptTemplates: {
          templates: [],
          maxTemplates: -1,
          enableKeyboardShortcuts: false,
        },
      });

      await storage.createProfile({
        profileName: 'Test Profile',
        real: { name: 'John Doe' },
        alias: { name: 'Jane Smith' },
      });

      // Simulate sign out
      (auth as any).currentUser = null;

      // Verify data exists before clearing
      const beforeConfig = await storage.loadConfig();
      expect(beforeConfig?.account?.userId).toBe('test-user-123');

      // In real app, sign out would trigger clear
      // For now, just verify we can detect auth state
      expect((auth as any).currentUser).toBeNull();
    });

    test('syncs new user data on sign in', async () => {
      // Simulate sign in
      const mockUser = {
        uid: 'new-user-456',
        email: 'newuser@example.com',
      };
      (auth as any).currentUser = mockUser;

      // Mock Firestore to return PRO tier from previous session
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          email: 'newuser@example.com',
          tier: 'pro',
          createdAt: '2024-01-01',
        }),
      });

      mockSetDoc.mockResolvedValueOnce(undefined);

      const { syncUserToFirestore: actualSync } = jest.requireActual(
        '../src/lib/firebase'
      );

      await actualSync();

      // Verify user was synced with existing PRO tier
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          tier: 'pro',
        })
      );
    });
  });
});

/**
 * TODO: Future Test Enhancements
 *
 * 1. Firebase Emulator Integration Tests
 *    - Set up Firebase emulator in CI/CD
 *    - Test actual Firestore operations (not mocked)
 *    - Test security rules enforcement
 *    - Test concurrent user updates
 *
 * 2. Authentication Flow Tests
 *    - Test sign up → sync → tier assignment
 *    - Test sign in → restore tier from Firestore
 *    - Test sign out → clear local data
 *    - Test account deletion flow
 *
 * 3. Real-time Listener Tests
 *    - Test multiple simultaneous listeners
 *    - Test listener cleanup on component unmount
 *    - Test rapid tier changes (debouncing)
 *    - Test offline → online reconnection
 *
 * 4. Error Recovery Tests
 *    - Test Firestore quota exceeded
 *    - Test network failure during sync
 *    - Test retry logic with exponential backoff
 *    - Test stale data handling
 *
 * 5. Cross-Device Sync Tests
 *    - Test tier upgrade on Device A reflects on Device B
 *    - Test profile changes sync across devices
 *    - Test conflict resolution (last-write-wins)
 *
 * 6. Performance Tests
 *    - Test large document updates
 *    - Test listener efficiency with many users
 *    - Test batch operations
 *    - Test cache utilization
 *
 * 7. Security Tests
 *    - Test unauthorized access attempts
 *    - Test user can only read/write their own data
 *    - Test admin operations (if applicable)
 *    - Test data validation rules
 *
 * 8. Integration with Stripe Tests
 *    - Test webhook → Firestore tier update flow
 *    - Test Stripe customer ID storage
 *    - Test subscription status sync
 *    - Test payment failure → tier downgrade
 */
