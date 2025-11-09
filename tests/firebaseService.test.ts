/**
 * Tests for Firebase Service
 * User management, tier system, and subscription handling
 */

import { Timestamp } from 'firebase/firestore';

// Mock Firebase Firestore - must be defined before imports
const mockUserData: Record<string, any> = {};

// Create Timestamp mock
const TimestampMock = {
  now: () => ({ toMillis: () => Date.now() }),
  fromMillis: (ms: number) => ({ toMillis: () => ms }),
};

jest.mock('firebase/firestore', () => ({
  doc: jest.fn((db: any, path: string) => ({ path })),
  getDoc: jest.fn(async (ref: any) => {
    const userId = ref.path.split('/')[1];
    const data = mockUserData[userId];

    return {
      exists: () => !!data,
      data: () => data,
    };
  }),
  setDoc: jest.fn(async (ref: any, data: any) => {
    const userId = ref.path.split('/')[1];
    mockUserData[userId] = {
      ...data,
      createdAt: TimestampMock.now(),
      updatedAt: TimestampMock.now(),
    };
  }),
  updateDoc: jest.fn(async (ref: any, data: any) => {
    const userId = ref.path.split('/')[1];
    const updates = { ...data };

    // Handle nested field updates (e.g., 'subscription.status')
    Object.keys(updates).forEach(key => {
      if (key.includes('.')) {
        const parts = key.split('.');
        delete updates[key];

        // Apply nested update
        if (!mockUserData[userId][parts[0]]) {
          mockUserData[userId][parts[0]] = {};
        }
        mockUserData[userId][parts[0]][parts[1]] = data[key];
      }
    });

    mockUserData[userId] = {
      ...mockUserData[userId],
      ...updates,
      updatedAt: TimestampMock.now(),
    };
  }),
  onSnapshot: jest.fn((ref: any, callback: any, errorCallback: any) => {
    const userId = ref.path.split('/')[1];

    // Immediately call callback with current data
    setTimeout(() => {
      const data = mockUserData[userId];
      callback({
        exists: () => !!data,
        data: () => data,
      });
    }, 0);

    // Return unsubscribe function
    return jest.fn();
  }),
  serverTimestamp: jest.fn(() => TimestampMock.now()),
  Timestamp: TimestampMock,
}));

jest.mock('../src/lib/firebase', () => ({
  db: { _type: 'firestore' },
}));

// Import after mocks are set up
import {
  syncUserToFirestore,
  getUserTier,
  getUserData,
  isProUser,
  hasActiveSubscription,
  upgradeUserToPro,
  downgradeUserToFree,
  listenToUserTier,
  type FirestoreUser,
} from '../src/lib/firebaseService';

// Get mocked functions for assertions
const { getDoc: mockGetDoc, setDoc: mockSetDoc, updateDoc: mockUpdateDoc } = jest.requireMock('firebase/firestore');

describe('Firebase Service', () => {
  beforeEach(() => {
    // Clear mock data before each test
    Object.keys(mockUserData).forEach(key => delete mockUserData[key]);
    jest.clearAllMocks();
  });

  describe('syncUserToFirestore', () => {
    it('should create new user document when user does not exist', async () => {
      const mockUser: any = {
        uid: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
      };

      const result = await syncUserToFirestore(mockUser);

      expect(mockSetDoc).toHaveBeenCalled();
      expect(result.email).toBe('test@example.com');
      expect(result.tier).toBe('free');
    });

    it('should update existing user document', async () => {
      // Pre-populate with existing user
      mockUserData['user456'] = {
        email: 'old@example.com',
        tier: 'free',
        createdAt: TimestampMock.now(),
        updatedAt: TimestampMock.now(),
      };

      const mockUser: any = {
        uid: 'user456',
        email: 'new@example.com',
        displayName: 'Updated User',
      };

      await syncUserToFirestore(mockUser);

      expect(mockUpdateDoc).toHaveBeenCalled();
    });

    it('should handle users without displayName', async () => {
      const mockUser: any = {
        uid: 'user789',
        email: 'nodisplay@example.com',
        // No displayName
      };

      const result = await syncUserToFirestore(mockUser);

      expect(result.email).toBe('nodisplay@example.com');
    });

    it('should handle users without photoURL', async () => {
      const mockUser: any = {
        uid: 'user999',
        email: 'nophoto@example.com',
        displayName: 'User',
        // No photoURL
      };

      const result = await syncUserToFirestore(mockUser);

      expect(result.email).toBe('nophoto@example.com');
    });

    it('should default to free tier for new users', async () => {
      const mockUser: any = {
        uid: 'newuser',
        email: 'newuser@example.com',
      };

      const result = await syncUserToFirestore(mockUser);

      expect(result.tier).toBe('free');
    });
  });

  describe('getUserTier', () => {
    it('should return user tier when user exists', async () => {
      mockUserData['prouser'] = {
        email: 'pro@example.com',
        tier: 'pro',
        createdAt: TimestampMock.now(),
        updatedAt: TimestampMock.now(),
      };

      const tier = await getUserTier('prouser');

      expect(tier).toBe('pro');
    });

    it('should return free tier when user does not exist', async () => {
      const tier = await getUserTier('nonexistent');

      expect(tier).toBe('free');
    });

    it('should return free tier as default when tier is missing', async () => {
      mockUserData['notier'] = {
        email: 'notier@example.com',
        // No tier field
      };

      const tier = await getUserTier('notier');

      expect(tier).toBe('free');
    });

    it('should handle errors gracefully', async () => {
      // Force an error
      mockGetDoc.mockRejectedValueOnce(new Error('Database error'));

      const tier = await getUserTier('erroruser');

      expect(tier).toBe('free');
    });
  });

  describe('getUserData', () => {
    it('should return user data when user exists', async () => {
      const userData: any = {
        email: 'user@example.com',
        displayName: 'User Name',
        tier: 'free',
        createdAt: TimestampMock.now(),
        updatedAt: TimestampMock.now(),
      };

      mockUserData['datauser'] = userData;

      const result = await getUserData('datauser');

      expect(result).toBeDefined();
      expect(result!.email).toBe('user@example.com');
      expect(result!.displayName).toBe('User Name');
    });

    it('should return null when user does not exist', async () => {
      const result = await getUserData('nonexistent');

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      mockGetDoc.mockRejectedValueOnce(new Error('Database error'));

      const result = await getUserData('erroruser');

      expect(result).toBeNull();
    });

    it('should include subscription data when present', async () => {
      mockUserData['subuser'] = {
        email: 'sub@example.com',
        tier: 'pro',
        subscription: {
          status: 'active',
          stripeCustomerId: 'cus_123',
          stripeSubscriptionId: 'sub_123',
          currentPeriodEnd: TimestampMock.fromMillis(Date.now() + 86400000),
        },
        createdAt: TimestampMock.now(),
        updatedAt: TimestampMock.now(),
      };

      const result = await getUserData('subuser');

      expect(result!.subscription).toBeDefined();
      expect(result!.subscription!.status).toBe('active');
    });
  });

  describe('isProUser', () => {
    it('should return true for PRO users', async () => {
      mockUserData['prouser'] = {
        email: 'pro@example.com',
        tier: 'pro',
        createdAt: TimestampMock.now(),
        updatedAt: TimestampMock.now(),
      };

      const isPro = await isProUser('prouser');

      expect(isPro).toBe(true);
    });

    it('should return false for FREE users', async () => {
      mockUserData['freeuser'] = {
        email: 'free@example.com',
        tier: 'free',
        createdAt: TimestampMock.now(),
        updatedAt: TimestampMock.now(),
      };

      const isPro = await isProUser('freeuser');

      expect(isPro).toBe(false);
    });

    it('should return false for non-existent users', async () => {
      const isPro = await isProUser('nonexistent');

      expect(isPro).toBe(false);
    });
  });

  describe('hasActiveSubscription', () => {
    it('should return true for active subscriptions', async () => {
      mockUserData['activeuser'] = {
        email: 'active@example.com',
        tier: 'pro',
        subscription: {
          status: 'active',
          currentPeriodEnd: TimestampMock.fromMillis(Date.now() + 86400000), // Tomorrow
        },
        createdAt: TimestampMock.now(),
        updatedAt: TimestampMock.now(),
      };

      const hasActive = await hasActiveSubscription('activeuser');

      expect(hasActive).toBe(true);
    });

    it('should return false for expired subscriptions', async () => {
      mockUserData['expireduser'] = {
        email: 'expired@example.com',
        tier: 'pro',
        subscription: {
          status: 'active',
          currentPeriodEnd: TimestampMock.fromMillis(Date.now() - 86400000), // Yesterday
        },
        createdAt: TimestampMock.now(),
        updatedAt: TimestampMock.now(),
      };

      const hasActive = await hasActiveSubscription('expireduser');

      expect(hasActive).toBe(false);
    });

    it('should return false for cancelled subscriptions', async () => {
      mockUserData['cancelleduser'] = {
        email: 'cancelled@example.com',
        tier: 'free',
        subscription: {
          status: 'cancelled',
          currentPeriodEnd: TimestampMock.fromMillis(Date.now() + 86400000),
        },
        createdAt: TimestampMock.now(),
        updatedAt: TimestampMock.now(),
      };

      const hasActive = await hasActiveSubscription('cancelleduser');

      expect(hasActive).toBe(false);
    });

    it('should return false for users without subscription', async () => {
      mockUserData['nosubuser'] = {
        email: 'nosub@example.com',
        tier: 'free',
        createdAt: TimestampMock.now(),
        updatedAt: TimestampMock.now(),
      };

      const hasActive = await hasActiveSubscription('nosubuser');

      expect(hasActive).toBe(false);
    });

    it('should return false for non-existent users', async () => {
      const hasActive = await hasActiveSubscription('nonexistent');

      expect(hasActive).toBe(false);
    });
  });

  describe('upgradeUserToPro', () => {
    beforeEach(() => {
      mockUserData['upgradeuser'] = {
        email: 'upgrade@example.com',
        tier: 'free',
        createdAt: TimestampMock.now(),
        updatedAt: TimestampMock.now(),
      };
    });

    it('should upgrade user to PRO tier', async () => {
      await upgradeUserToPro('upgradeuser', {
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        currentPeriodEnd: Date.now() + 86400000,
      });

      expect(mockUpdateDoc).toHaveBeenCalled();
      expect(mockUserData['upgradeuser'].tier).toBe('pro');
    });

    it('should set subscription data correctly', async () => {
      const subData = {
        stripeCustomerId: 'cus_456',
        stripeSubscriptionId: 'sub_456',
        currentPeriodEnd: Date.now() + 2592000000, // 30 days
      };

      await upgradeUserToPro('upgradeuser', subData);

      expect(mockUserData['upgradeuser'].subscription).toBeDefined();
      expect(mockUserData['upgradeuser'].subscription.status).toBe('active');
      expect(mockUserData['upgradeuser'].subscription.stripeCustomerId).toBe('cus_456');
    });

    it('should handle errors during upgrade', async () => {
      mockUpdateDoc.mockRejectedValueOnce(new Error('Update failed'));

      await expect(upgradeUserToPro('upgradeuser', {
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        currentPeriodEnd: Date.now() + 86400000,
      })).rejects.toThrow('Update failed');
    });
  });

  describe('downgradeUserToFree', () => {
    beforeEach(() => {
      mockUserData['downgradeuser'] = {
        email: 'downgrade@example.com',
        tier: 'pro',
        subscription: {
          status: 'active',
          currentPeriodEnd: TimestampMock.now(),
        },
        createdAt: TimestampMock.now(),
        updatedAt: TimestampMock.now(),
      };
    });

    it('should downgrade user to FREE tier', async () => {
      await downgradeUserToFree('downgradeuser');

      expect(mockUpdateDoc).toHaveBeenCalled();
      expect(mockUserData['downgradeuser'].tier).toBe('free');
    });

    it('should mark subscription as cancelled', async () => {
      await downgradeUserToFree('downgradeuser');

      expect(mockUserData['downgradeuser'].subscription.status).toBe('cancelled');
    });

    it('should handle errors during downgrade', async () => {
      mockUpdateDoc.mockRejectedValueOnce(new Error('Downgrade failed'));

      await expect(downgradeUserToFree('downgradeuser')).rejects.toThrow('Downgrade failed');
    });
  });

  describe('listenToUserTier', () => {
    it('should call callback with current tier', (done) => {
      mockUserData['listeneruser'] = {
        email: 'listener@example.com',
        tier: 'pro',
        createdAt: TimestampMock.now(),
        updatedAt: TimestampMock.now(),
      };

      const callback = jest.fn((tier) => {
        expect(tier).toBe('pro');
        expect(callback).toHaveBeenCalled();
        done();
      });

      listenToUserTier('listeneruser', callback);
    });

    it('should call callback with free tier for non-existent users', (done) => {
      const callback = jest.fn((tier) => {
        expect(tier).toBe('free');
        done();
      });

      listenToUserTier('nonexistent', callback);
    });

    it('should return unsubscribe function', () => {
      const callback = jest.fn();
      const unsubscribe = listenToUserTier('user', callback);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should handle missing tier field', (done) => {
      mockUserData['notieruser'] = {
        email: 'notier@example.com',
        // No tier field
      };

      const callback = jest.fn((tier) => {
        expect(tier).toBe('free');
        done();
      });

      listenToUserTier('notieruser', callback);
    });
  });

  describe('Integration Tests', () => {
    it('should sync, upgrade, and check pro status', async () => {
      // Create user
      const mockUser: any = {
        uid: 'integrationuser',
        email: 'integration@example.com',
      };

      await syncUserToFirestore(mockUser);

      // Verify starts as free
      let isPro = await isProUser('integrationuser');
      expect(isPro).toBe(false);

      // Upgrade to pro
      await upgradeUserToPro('integrationuser', {
        stripeCustomerId: 'cus_int',
        stripeSubscriptionId: 'sub_int',
        currentPeriodEnd: Date.now() + 86400000,
      });

      // Verify is now pro
      isPro = await isProUser('integrationuser');
      expect(isPro).toBe(true);

      // Verify has active subscription
      const hasActive = await hasActiveSubscription('integrationuser');
      expect(hasActive).toBe(true);
    });

    it('should handle complete subscription lifecycle', async () => {
      const userId = 'lifecycleuser';
      const mockUser: any = {
        uid: userId,
        email: 'lifecycle@example.com',
      };

      // 1. Create user
      await syncUserToFirestore(mockUser);
      let tier = await getUserTier(userId);
      expect(tier).toBe('free');

      // 2. Upgrade to PRO
      await upgradeUserToPro(userId, {
        stripeCustomerId: 'cus_life',
        stripeSubscriptionId: 'sub_life',
        currentPeriodEnd: Date.now() + 2592000000,
      });
      tier = await getUserTier(userId);
      expect(tier).toBe('pro');

      // 3. Verify active subscription
      let hasActive = await hasActiveSubscription(userId);
      expect(hasActive).toBe(true);

      // 4. Downgrade to FREE
      await downgradeUserToFree(userId);
      tier = await getUserTier(userId);
      expect(tier).toBe('free');

      // 5. Verify subscription is no longer active
      hasActive = await hasActiveSubscription(userId);
      expect(hasActive).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle users with empty email', async () => {
      const mockUser: any = {
        uid: 'noemailuser',
        email: '',
      };

      const result = await syncUserToFirestore(mockUser);

      expect(result.email).toBe('');
    });

    it('should handle concurrent tier checks', async () => {
      mockUserData['concurrentuser'] = {
        email: 'concurrent@example.com',
        tier: 'pro',
        createdAt: TimestampMock.now(),
        updatedAt: TimestampMock.now(),
      };

      const promises = Array(10).fill(null).map(() => getUserTier('concurrentuser'));
      const results = await Promise.all(promises);

      expect(results.every(tier => tier === 'pro')).toBe(true);
    });

    it('should handle subscription with past_due status', async () => {
      mockUserData['pastdueuser'] = {
        email: 'pastdue@example.com',
        tier: 'pro',
        subscription: {
          status: 'past_due',
          currentPeriodEnd: TimestampMock.fromMillis(Date.now() + 86400000),
        },
        createdAt: TimestampMock.now(),
        updatedAt: TimestampMock.now(),
      };

      const hasActive = await hasActiveSubscription('pastdueuser');

      // past_due is not 'active', so should return false
      expect(hasActive).toBe(false);
    });

    it('should handle malformed user data gracefully', async () => {
      mockUserData['malformeduser'] = {
        // Missing required fields
        tier: 'pro',
      };

      const userData = await getUserData('malformeduser');

      expect(userData).toBeDefined();
      expect(userData!.tier).toBe('pro');
    });
  });
});
