# Payment Testing Strategy

**Status:** 📋 Planned
**Priority:** P0 - Critical for Launch
**Estimated Time:** 2-3 days
**Target Release:** v1.1.0

---

## Table of Contents

1. [Overview](#overview)
2. [Stripe Test Mode](#stripe-test-mode)
3. [Test Cards](#test-cards)
4. [Test Scenarios](#test-scenarios)
5. [Automated Tests](#automated-tests)
6. [Manual Testing Checklist](#manual-testing-checklist)

---

## Overview

This document outlines the complete testing strategy for Stripe payment integration, including test mode setup, test cards, automated tests, and manual testing procedures.

### Testing Goals

- ✅ Verify checkout flow works end-to-end
- ✅ Confirm webhooks update Firestore correctly
- ✅ Validate tier changes reflect in UI immediately
- ✅ Test subscription management (cancel, upgrade, downgrade)
- ✅ Handle edge cases and errors gracefully
- ✅ Ensure data migration works on downgrade

---

## Stripe Test Mode

### Setup

1. **Use Test API Keys** in Firebase Functions config:
   ```bash
   firebase functions:config:set \
     stripe.secret_key="sk_test_..." \
     stripe.webhook_secret="whsec_..." \
     stripe.price_monthly="price_test_..." \
     stripe.price_yearly="price_test_..."
   ```

2. **Test Mode Dashboard:** https://dashboard.stripe.com/test

3. **Webhook Testing:** Use Stripe CLI for local testing
   ```bash
   stripe listen --forward-to http://localhost:5001/project-id/us-central1/stripeWebhook
   ```

### Test Environment

All tests should be run in:
- **Stripe:** Test mode (test API keys)
- **Firebase:** Development project
- **Extension:** Unpacked in Chrome dev mode

---

## Test Cards

### Success Scenarios

| Card Number | Scenario | CVC | Expiry |
|-------------|----------|-----|--------|
| `4242 4242 4242 4242` | ✅ Payment succeeds | Any 3 digits | Any future date |
| `5555 5555 5555 4444` | ✅ Mastercard succeeds | Any 3 digits | Any future date |

### Authentication Required

| Card Number | Scenario | CVC | Expiry |
|-------------|----------|-----|--------|
| `4000 0025 0000 3155` | 🔐 Requires 3D Secure auth | Any 3 digits | Any future date |
| `4000 0027 6000 3184` | 🔐 Requires auth, then succeeds | Any 3 digits | Any future date |

### Decline Scenarios

| Card Number | Scenario | Error Message |
|-------------|----------|---------------|
| `4000 0000 0000 9995` | ❌ Declined | Card declined |
| `4000 0000 0000 9987` | ❌ Declined (lost card) | Card lost |
| `4000 0000 0000 9979` | ❌ Declined (stolen card) | Card stolen |
| `4000 0000 0000 0069` | ❌ Expired card | Expired card |
| `4000 0000 0000 0127` | ❌ Incorrect CVC | Incorrect CVC |

### Special Cases

| Card Number | Scenario |
|-------------|----------|
| `4000 0000 0000 0341` | Charge succeeds, but card expires in next billing cycle |
| `4000 0000 0000 3220` | 3D Secure required, but customer abandons |

---

## Test Scenarios

### Scenario 1: Successful Monthly Subscription

**Steps:**
1. User clicks "Upgrade to PRO" button
2. Plan selection modal opens
3. User selects "Monthly $4.99/month"
4. Stripe checkout opens in new tab
5. User enters test card `4242 4242 4242 4242`
6. User completes payment
7. Redirected to success page

**Expected Results:**
- ✅ Webhook receives `checkout.session.completed`
- ✅ Firestore updates: `users/{uid}.tier = 'pro'`
- ✅ Extension listens and updates tier badge to PRO (gold)
- ✅ PRO features unlock immediately
- ✅ Notification shows: "Upgraded to PRO! All features unlocked."

**Test Code:**
```typescript
describe('Stripe Checkout - Monthly Subscription', () => {
  it('should upgrade user to PRO after successful payment', async () => {
    // Mock user
    const userId = 'test-user-123';
    const mockUser = { uid: userId, email: 'test@example.com' };

    // Mock Firestore
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      tier: 'free',
      email: mockUser.email,
    });

    // Simulate checkout session completion
    const session = {
      metadata: { firebaseUID: userId },
      subscription: 'sub_test_123',
      customer: 'cus_test_123',
    };

    // Call webhook handler
    await handleCheckoutComplete(session);

    // Verify Firestore updated
    const updatedUser = await getDoc(userRef);
    expect(updatedUser.data()?.tier).toBe('pro');
    expect(updatedUser.data()?.stripeSubscriptionId).toBe('sub_test_123');
  });
});
```

### Scenario 2: Failed Payment (Declined Card)

**Steps:**
1. User clicks "Upgrade to PRO"
2. Selects plan
3. Enters test card `4000 0000 0000 9995` (declined)
4. Clicks pay

**Expected Results:**
- ❌ Stripe shows error: "Your card was declined"
- ❌ Checkout does not complete
- ❌ Firestore tier remains `'free'`
- ❌ Extension tier badge stays FREE (gray)

### Scenario 3: Subscription Cancellation

**Steps:**
1. User (PRO tier) clicks "Manage Billing"
2. Stripe Customer Portal opens
3. User clicks "Cancel subscription"
4. Confirms cancellation

**Expected Results:**
- ✅ Webhook receives `customer.subscription.deleted`
- ✅ Firestore updates: `users/{uid}.tier = 'free'`
- ✅ Extension updates tier badge to FREE (gray)
- ✅ PRO features lock
- ✅ Data migration runs:
  - Profiles limited to 5 (excess deleted)
  - Templates limited to 5 (excess deleted)
- ✅ Notification shows: "Downgraded to FREE tier"

**Test Code:**
```typescript
describe('Subscription Cancellation', () => {
  it('should downgrade user to FREE and migrate data', async () => {
    const userId = 'test-user-123';

    // Setup: User with PRO tier and 10 profiles
    await setDoc(doc(db, 'users', userId), {
      tier: 'pro',
      stripeCustomerId: 'cus_test_123',
    });

    const storage = StorageManager.getInstance();
    for (let i = 0; i < 10; i++) {
      await storage.createProfile({
        profileName: `Profile ${i}`,
        // ... profile data
      });
    }

    // Simulate subscription deleted webhook
    await handleSubscriptionDeleted({
      customer: 'cus_test_123',
    });

    // Verify tier downgraded
    const updatedUser = await getDoc(doc(db, 'users', userId));
    expect(updatedUser.data()?.tier).toBe('free');

    // Verify profiles limited to 5
    const profiles = await storage.getAllProfiles();
    expect(profiles.length).toBe(5);
  });
});
```

### Scenario 4: Plan Change (Monthly → Yearly)

**Steps:**
1. PRO user clicks "Manage Billing"
2. Opens Customer Portal
3. Clicks "Update plan"
4. Selects yearly plan
5. Confirms change

**Expected Results:**
- ✅ Webhook receives `customer.subscription.updated`
- ✅ Firestore updates subscription ID
- ✅ User remains PRO tier
- ✅ Next billing shows yearly amount

### Scenario 5: Payment Requires Authentication

**Steps:**
1. User attempts upgrade
2. Enters card `4000 0025 0000 3155` (requires 3DS)
3. Stripe shows authentication challenge
4. User completes authentication
5. Payment succeeds

**Expected Results:**
- ✅ 3D Secure modal appears
- ✅ After auth, payment completes
- ✅ Webhook fires normally
- ✅ Tier upgrades to PRO

---

## Automated Tests

### Unit Tests

**File:** `tests/stripe.test.ts` (NEW)

```typescript
import { createCheckoutSession, handleWebhookEvent } from '../functions/src/stripe';

describe('Stripe Functions', () => {
  describe('createCheckoutSession', () => {
    it('should create session with correct parameters', async () => {
      const data = {
        priceId: 'price_test_monthly',
      };
      const context = {
        auth: {
          uid: 'test-user-123',
          token: { email: 'test@example.com' },
        },
      };

      const result = await createCheckoutSession(data, context);

      expect(result.sessionId).toBeDefined();
      expect(result.url).toContain('checkout.stripe.com');
    });

    it('should throw error if user not authenticated', async () => {
      const data = { priceId: 'price_test_monthly' };
      const context = { auth: null };

      await expect(createCheckoutSession(data, context)).rejects.toThrow('unauthenticated');
    });
  });

  describe('handleWebhookEvent', () => {
    it('should upgrade user on checkout.session.completed', async () => {
      const event = {
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: { firebaseUID: 'test-user-123' },
            subscription: 'sub_test_123',
            customer: 'cus_test_123',
          },
        },
      };

      await handleWebhookEvent(event);

      // Verify Firestore updated
      const userDoc = await getDoc(doc(db, 'users', 'test-user-123'));
      expect(userDoc.data()?.tier).toBe('pro');
    });

    it('should downgrade user on subscription.deleted', async () => {
      const event = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            customer: 'cus_test_123',
          },
        },
      };

      await handleWebhookEvent(event);

      // Verify user downgraded
      // (assumes user doc has stripeCustomerId = 'cus_test_123')
    });
  });
});
```

### Integration Tests

**File:** `tests/stripe-integration.test.ts` (NEW)

```typescript
describe('Stripe Integration E2E', () => {
  it('should complete full upgrade flow', async () => {
    // 1. Create checkout session
    const session = await createCheckoutSession({
      priceId: 'price_test_monthly',
    }, { auth: mockAuth });

    expect(session.url).toBeDefined();

    // 2. Simulate successful payment (mock webhook)
    const webhookEvent = {
      type: 'checkout.session.completed',
      data: { object: { ...session, metadata: { firebaseUID: 'test-user' } } },
    };

    await handleWebhookEvent(webhookEvent);

    // 3. Verify tier updated
    const userDoc = await getDoc(doc(db, 'users', 'test-user'));
    expect(userDoc.data()?.tier).toBe('pro');
  });
});
```

---

## Manual Testing Checklist

### Pre-Launch Checklist

#### Setup
- [ ] Stripe test mode configured
- [ ] Test products created
- [ ] Test prices created (monthly + yearly)
- [ ] Firebase Functions deployed to test project
- [ ] Webhook endpoint configured in Stripe
- [ ] Environment variables set correctly
- [ ] Stripe CLI installed for webhook testing

#### Upgrade Flow
- [ ] Click "Upgrade to PRO" from Features tab
- [ ] Plan selection modal appears with correct pricing
- [ ] Click "Select Monthly" → Stripe checkout opens
- [ ] Enter test card `4242 4242 4242 4242`
- [ ] Complete payment
- [ ] Verify webhook received (check Firebase logs)
- [ ] Verify Firestore updated: `tier = 'pro'`
- [ ] Verify tier badge changes to PRO (gold) in extension
- [ ] Verify PRO features unlock
- [ ] Verify notification appears: "Upgraded to PRO"

#### Authentication Required
- [ ] Start checkout with card `4000 0025 0000 3155`
- [ ] 3D Secure challenge appears
- [ ] Complete authentication
- [ ] Payment succeeds
- [ ] Tier upgrades normally

#### Declined Card
- [ ] Start checkout with card `4000 0000 0000 9995`
- [ ] Stripe shows "Card declined" error
- [ ] Checkout does not complete
- [ ] Extension tier remains FREE
- [ ] User can retry with different card

#### Account Settings
- [ ] Click user dropdown
- [ ] Click "Account Settings"
- [ ] Modal opens showing:
  - User profile (avatar, name, email)
  - Current tier badge
  - "Upgrade to PRO" button (FREE) or "Manage Billing" (PRO)
- [ ] Click buttons work correctly

#### Billing Management (PRO users)
- [ ] Click "Manage Billing" in dropdown
- [ ] Stripe Customer Portal opens in new tab
- [ ] Can view subscription details
- [ ] Can update payment method
- [ ] Can change plan (monthly ↔ yearly)
- [ ] Can cancel subscription

#### Cancellation Flow
- [ ] PRO user cancels subscription in portal
- [ ] Verify webhook received: `subscription.deleted`
- [ ] Verify Firestore updated: `tier = 'free'`
- [ ] Verify extension badge changes to FREE (gray)
- [ ] Verify data migration runs:
  - Check profiles count ≤ 5
  - Check templates count ≤ 5
- [ ] Verify PRO features lock
- [ ] Verify notification: "Downgraded to FREE"

#### Error Handling
- [ ] Test network error during checkout creation
- [ ] Test webhook failure (invalid signature)
- [ ] Test Firestore write failure
- [ ] Test portal session creation failure
- [ ] Verify error messages are user-friendly

#### Edge Cases
- [ ] User closes checkout without paying
- [ ] User refreshes during checkout
- [ ] Multiple tabs open during tier change
- [ ] Webhook arrives before checkout redirect completes
- [ ] User has exactly 5 profiles/templates on downgrade

---

## Success Criteria

All tests must pass before production launch:

### Automated Tests
- ✅ 100% of unit tests passing
- ✅ 100% of integration tests passing
- ✅ Stripe Functions deploy successfully
- ✅ Webhooks validated with Stripe CLI

### Manual Tests
- ✅ All 5 upgrade flow tests complete successfully
- ✅ All 3 cancellation tests complete successfully
- ✅ All 4 error handling scenarios verified
- ✅ All 5 edge cases handled gracefully

### Performance
- ✅ Checkout session creates in < 2 seconds
- ✅ Webhook processes in < 5 seconds
- ✅ Tier update reflects in UI in < 3 seconds
- ✅ Customer portal opens in < 2 seconds

### Security
- ✅ Webhook signature validation works
- ✅ User authentication required for all endpoints
- ✅ Firestore security rules prevent unauthorized tier changes
- ✅ Test mode API keys never committed to repo

---

**Next Steps:** Set up Stripe test mode and begin implementing checkout flow with these test scenarios as acceptance criteria.
