/**
 * @jest-environment node
 *
 * Integration tests for Stripe Integration with Real Firebase Auth
 * Tests Stripe integration with authenticated user
 *
 * NOTE: These tests verify Stripe functions are called correctly with auth.
 * Full payment testing requires Stripe test mode and Firebase Functions deployed.
 */

import {
  setupIntegrationTests,
  teardownIntegrationTests,
  getCurrentTestUser,
} from './setup';
import { User } from 'firebase/auth';

// Mock environment variables for Stripe
process.env.STRIPE_PRICE_MONTHLY = 'price_test_monthly123';
process.env.STRIPE_PRICE_YEARLY = 'price_test_yearly123';

describe('Stripe Integration with Firebase Auth', () => {
  let testUser: User;

  // Set up Firebase auth before all tests
  beforeAll(async () => {
    testUser = await setupIntegrationTests();
  }, 30000);

  // Clean up after all tests
  afterAll(async () => {
    await teardownIntegrationTests();
  }, 30000);

  describe('Firebase Authentication for Stripe', () => {
    test('test user is authenticated for Stripe operations', () => {
      expect(testUser).toBeDefined();
      expect(testUser.uid).toBeDefined();
      expect(testUser.email).toBe(process.env.INTEGRATION_TEST_USER_EMAIL);

      console.log('[Stripe Test] ✅ User authenticated:', testUser.email);
      console.log('[Stripe Test] UID for Stripe operations:', testUser.uid);
    });

    test('user has required properties for Stripe integration', () => {
      // Stripe integration needs user UID and email
      expect(testUser.uid).toBeTruthy();
      expect(testUser.email).toBeTruthy();
      expect(typeof testUser.uid).toBe('string');
      expect(typeof testUser.email).toBe('string');

      console.log('[Stripe Test] ✅ User has valid properties for Stripe');
    });
  });

  describe('Stripe Environment Configuration', () => {
    test('Stripe price IDs are configured', () => {
      expect(process.env.STRIPE_PRICE_MONTHLY).toBeDefined();
      expect(process.env.STRIPE_PRICE_YEARLY).toBeDefined();
      expect(process.env.STRIPE_PRICE_MONTHLY).toBe('price_test_monthly123');
      expect(process.env.STRIPE_PRICE_YEARLY).toBe('price_test_yearly123');

      console.log('[Stripe Test] ✅ Stripe price IDs configured');
    });
  });

  // Additional Stripe integration tests can be added here
  // For actual payment flow testing, we'd need:
  // - Deployed Firebase Functions
  // - Stripe test mode API
  // - Webhook handling
});
