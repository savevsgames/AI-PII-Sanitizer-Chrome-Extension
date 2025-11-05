# Stripe Payment Integration

**Status:** 📋 Planned
**Priority:** P0 - Required for Monetization
**Estimated Time:** 5-7 days
**Target Release:** v1.1.0

---

## Table of Contents

1. [Overview](#overview)
2. [Current State Analysis](#current-state-analysis)
3. [Architecture](#architecture)
4. [Stripe Setup](#stripe-setup)
5. [Checkout Flow](#checkout-flow)
6. [Webhook Handler](#webhook-handler)
7. [Customer Portal](#customer-portal)
8. [Testing Strategy](#testing-strategy)
9. [Implementation Plan](#implementation-plan)

---

## Overview

This document outlines the integration of Stripe payment processing into the AI PII Sanitizer Chrome extension. The goal is to enable monetization of PRO features while maintaining the existing FREE tier.

### Pricing Model
- **FREE Tier:** $0/month
  - 5 alias profiles
  - 5 prompt templates
  - Basic features

- **PRO Tier:** $4.99/month or $49/year (17% savings)
  - Unlimited alias profiles
  - Unlimited prompt templates
  - Quick Alias Generator (bulk generation)
  - Custom redaction rules
  - API key vault
  - Advanced features

---

## Current State Analysis

### ✅ What's Already Built

#### 1. **Tier System Foundation** (`src/lib/types.ts:23-24`)
```typescript
export type TierLevel = 'free' | 'pro';
```

#### 2. **User Config with Tier** (`src/lib/types.ts:203-232`)
```typescript
export interface UserConfig {
  account: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    tier: TierLevel;              // ← Already tracked
    createdAt: number;
    lastLogin: number;
  };
  // ... other config
}
```

#### 3. **Firebase Integration** (`src/lib/store.ts:158-190`)
```typescript
// User profile synced with Firestore
const userDoc = await getDoc(doc(db, 'users', user.uid));
const userData = userDoc.data();

// Tier loaded from Firestore
tier: (userData?.tier as TierLevel) || 'free'
```

#### 4. **Tier Badges in UI** (4 locations)
- Header badge: `popup-v2.html:50`
- Features tab badge: `popup-v2.html:190`
- Templates tab badge: `popup-v2.html:207`
- User dropdown badge: `popup-v2.html:924`

#### 5. **User Dropdown Menu** (`popup-v2.html:920-950`)
- ✅ User info display (avatar, name, email)
- ✅ Tier badge
- ⏳ **Account Settings** (needs implementation)
- ⏳ **Manage Billing** (needs implementation)
- ✅ Sign Out (working)

#### 6. **Feature Tier Gating** (`src/popup/components/featuresTab.ts:27-64`)
```typescript
const FEATURES: Feature[] = [
  {
    id: 'custom-rules',
    tier: 'pro',  // ← Already defined
    // ...
  }
];

// Check function exists
function checkFeatureAccess(featureId: string): boolean {
  const feature = FEATURES.find(f => f.id === featureId);
  if (!feature) return false;

  const userTier = useAppStore.getState().config?.account?.tier || 'free';
  return feature.tier === 'free' || userTier === 'pro';
}
```

#### 7. **Upgrade CTA** (`src/popup/components/featuresTab.ts:535-539`)
```typescript
// Shows alert, needs real upgrade flow
upgradeBtn.addEventListener('click', () => {
  alert('Upgrade to PRO to unlock this feature!');
});
```

### ❌ What Needs to Be Built

1. **Stripe Checkout Session Creation** - New endpoint
2. **Webhook Handler** - Firebase Cloud Function
3. **Customer Portal Integration** - Manage subscription UI
4. **Account Settings Modal** - Profile management
5. **Billing Management Modal** - View invoices, change plan
6. **Upgrade Flow** - Smooth checkout experience
7. **Downgrade/Cancel Flow** - Handle tier changes
8. **Payment Testing** - Stripe test mode integration

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Chrome Extension                        │
│                                                              │
│  ┌────────────┐    ┌──────────────┐    ┌────────────────┐ │
│  │   Popup    │───▶│   Firebase   │───▶│   Firestore    │ │
│  │    UI      │◀───│     Auth     │◀───│  (user.tier)   │ │
│  └────────────┘    └──────────────┘    └────────────────┘ │
│         │                                                   │
│         │ Upgrade/Billing Actions                          │
│         ▼                                                   │
│  ┌────────────────────────────────────────────────────┐   │
│  │          Stripe Checkout / Portal Links            │   │
│  └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Open in new tab
                              ▼
                    ┌──────────────────┐
                    │  Stripe Hosted   │
                    │     Checkout     │
                    └──────────────────┘
                              │
                              │ Payment Complete
                              ▼
                    ┌──────────────────┐
                    │  Stripe Webhook  │
                    │  (Cloud Function)│
                    └──────────────────┘
                              │
                              │ Update tier
                              ▼
                    ┌──────────────────┐
                    │    Firestore     │
                    │   users/{uid}    │
                    │   tier: 'pro'    │
                    └──────────────────┘
```

### Data Flow

1. **User clicks "Upgrade to PRO"** → Extension popup
2. **Create Checkout Session** → Firebase callable function
3. **Open Stripe Checkout** → New browser tab
4. **User completes payment** → Stripe hosted page
5. **Stripe sends webhook** → Firebase Cloud Function
6. **Update Firestore** → Set `users/{uid}.tier = 'pro'`
7. **Extension polls/listens** → Firestore onSnapshot updates tier badge

---

## Stripe Setup

### Prerequisites

- Stripe account (production + test mode)
- Firebase project (already configured)
- Firebase Functions enabled
- Firebase Extensions or Cloud Functions v2

### Products and Prices

Create in Stripe Dashboard:

#### Product: "PRO Subscription"
- **Monthly Price:** $4.99/month
  - Price ID: `price_xxx` (test), `price_yyy` (production)
  - Billing interval: monthly
  - Currency: USD

- **Annual Price:** $49/year
  - Price ID: `price_xxx` (test), `price_yyy` (production)
  - Billing interval: yearly
  - Currency: USD
  - Savings: 17% vs monthly

### Environment Variables

Add to Firebase Functions config:

```bash
firebase functions:config:set \
  stripe.secret_key="sk_test_xxx" \
  stripe.webhook_secret="whsec_xxx" \
  stripe.price_monthly="price_xxx" \
  stripe.price_yearly="price_xxx"
```

---

## Checkout Flow

### 1. Create Checkout Session (Firebase Function)

**File:** `functions/src/createCheckoutSession.ts` (NEW)

```typescript
import * as functions from 'firebase-functions';
import Stripe from 'stripe';
import { getFirestore } from 'firebase-admin/firestore';

const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: '2023-10-16',
});

export const createCheckoutSession = functions.https.onCall(
  async (data, context) => {
    // Verify user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const { priceId, mode = 'subscription' } = data;
    const userId = context.auth.uid;
    const userEmail = context.auth.token.email;

    try {
      // Create or retrieve Stripe customer
      const db = getFirestore();
      const userDoc = await db.collection('users').doc(userId).get();
      let customerId = userDoc.data()?.stripeCustomerId;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: {
            firebaseUID: userId,
          },
        });
        customerId = customer.id;

        // Save customer ID to Firestore
        await db.collection('users').doc(userId).update({
          stripeCustomerId: customerId,
        });
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: mode,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `https://yourdomain.com/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `https://yourdomain.com/cancel`,
        metadata: {
          firebaseUID: userId,
        },
      });

      return { sessionId: session.id, url: session.url };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw new functions.https.HttpsError('internal', 'Failed to create checkout session');
    }
  }
);
```

### 2. Trigger Checkout from Extension

**File:** `src/lib/stripe.ts` (NEW)

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

export async function initiateCheckout(priceId: string): Promise<void> {
  try {
    const functions = getFunctions();
    const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');

    const result = await createCheckoutSession({ priceId });
    const { url } = result.data as { url: string };

    // Open Stripe Checkout in new tab
    chrome.tabs.create({ url });
  } catch (error) {
    console.error('Checkout error:', error);
    throw error;
  }
}
```

### 3. Update Upgrade Button

**File:** `src/popup/components/featuresTab.ts:535-539`

```typescript
// BEFORE (current stub):
upgradeBtn.addEventListener('click', () => {
  alert('Upgrade to PRO to unlock this feature!');
});

// AFTER (real implementation):
import { initiateCheckout } from '../../lib/stripe';

upgradeBtn.addEventListener('click', async () => {
  try {
    // Show loading state
    upgradeBtn.disabled = true;
    upgradeBtn.textContent = 'Opening checkout...';

    // Get monthly price ID from config
    const priceId = 'price_xxx'; // TODO: Get from config
    await initiateCheckout(priceId);
  } catch (error) {
    console.error('Upgrade error:', error);
    alert('Failed to start checkout. Please try again.');
  } finally {
    upgradeBtn.disabled = false;
    upgradeBtn.textContent = 'Upgrade to PRO';
  }
});
```

---

## Webhook Handler

### Firebase Cloud Function

**File:** `functions/src/stripeWebhook.ts` (NEW)

```typescript
import * as functions from 'firebase-functions';
import Stripe from 'stripe';
import { getFirestore } from 'firebase-admin/firestore';

const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: '2023-10-16',
});

const webhookSecret = functions.config().stripe.webhook_secret;

export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const db = getFirestore();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.firebaseUID;

        if (!userId) {
          console.error('No Firebase UID in session metadata');
          return res.status(400).send('Missing user ID');
        }

        // Update user to PRO tier
        await db.collection('users').doc(userId).update({
          tier: 'pro',
          stripeSubscriptionId: session.subscription,
          stripeCustomerId: session.customer,
          updatedAt: Date.now(),
        });

        console.log(`User ${userId} upgraded to PRO`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by Stripe customer ID
        const usersSnapshot = await db.collection('users')
          .where('stripeCustomerId', '==', customerId)
          .limit(1)
          .get();

        if (!usersSnapshot.empty) {
          const userDoc = usersSnapshot.docs[0];

          // Downgrade to FREE tier
          await userDoc.ref.update({
            tier: 'free',
            stripeSubscriptionId: null,
            updatedAt: Date.now(),
          });

          console.log(`User ${userDoc.id} downgraded to FREE`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        // Handle plan changes, renewals, etc.
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription updated:', subscription.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Webhook processing failed');
  }
});
```

---

## Customer Portal

### 1. Create Portal Session (Firebase Function)

**File:** `functions/src/createPortalSession.ts` (NEW)

```typescript
import * as functions from 'firebase-functions';
import Stripe from 'stripe';
import { getFirestore } from 'firebase-admin/firestore';

const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: '2023-10-16',
});

export const createPortalSession = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;

    try {
      const db = getFirestore();
      const userDoc = await db.collection('users').doc(userId).get();
      const customerId = userDoc.data()?.stripeCustomerId;

      if (!customerId) {
        throw new functions.https.HttpsError('failed-precondition', 'No Stripe customer found');
      }

      // Create portal session
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: 'https://yourdomain.com/account',
      });

      return { url: session.url };
    } catch (error) {
      console.error('Error creating portal session:', error);
      throw new functions.https.HttpsError('internal', 'Failed to create portal session');
    }
  }
);
```

### 2. Trigger from Extension

**File:** `src/lib/stripe.ts` (add to existing)

```typescript
export async function openCustomerPortal(): Promise<void> {
  try {
    const functions = getFunctions();
    const createPortalSession = httpsCallable(functions, 'createPortalSession');

    const result = await createPortalSession();
    const { url } = result.data as { url: string };

    // Open portal in new tab
    chrome.tabs.create({ url });
  } catch (error) {
    console.error('Portal error:', error);
    throw error;
  }
}
```

---

## Testing Strategy

See [TESTING.md](./TESTING.md) for complete testing documentation.

### Stripe Test Mode

1. **Use test API keys** in development
2. **Test cards** for different scenarios:
   - Success: `4242 4242 4242 4242`
   - Requires authentication: `4000 0025 0000 3155`
   - Declined: `4000 0000 0000 9995`

### Test Checklist

- [ ] Create checkout session
- [ ] Complete payment with test card
- [ ] Webhook receives `checkout.session.completed`
- [ ] Firestore updates `tier: 'pro'`
- [ ] Extension badge updates to PRO
- [ ] PRO features unlock
- [ ] Open customer portal
- [ ] Cancel subscription
- [ ] Webhook receives `customer.subscription.deleted`
- [ ] Firestore updates `tier: 'free'`
- [ ] Extension badge updates to FREE
- [ ] PRO features lock

---

## Implementation Plan

### Phase 1: Setup (Day 1)
- [ ] Create Stripe account
- [ ] Create products and prices
- [ ] Set up Firebase Functions
- [ ] Configure environment variables
- [ ] Deploy initial webhook handler

### Phase 2: Checkout (Day 2-3)
- [ ] Implement `createCheckoutSession` function
- [ ] Create `src/lib/stripe.ts` utility
- [ ] Update upgrade button in `featuresTab.ts`
- [ ] Test checkout flow in test mode
- [ ] Handle success/cancel redirects

### Phase 3: Webhooks (Day 3-4)
- [ ] Complete webhook handler for all events
- [ ] Test webhook locally with Stripe CLI
- [ ] Deploy webhook to production
- [ ] Verify Firestore updates

### Phase 4: Customer Portal (Day 4-5)
- [ ] Implement `createPortalSession` function
- [ ] Add "Manage Billing" button handler
- [ ] Test portal access and subscription management
- [ ] Handle cancellation flow

### Phase 5: UI Integration (Day 5-6)
- [ ] Implement Account Settings modal
- [ ] Add billing management UI
- [ ] Update all upgrade CTAs
- [ ] Add loading states
- [ ] Polish error handling

### Phase 6: Testing (Day 6-7)
- [ ] Complete test suite
- [ ] Test all payment scenarios
- [ ] Test tier changes
- [ ] Test error cases
- [ ] User acceptance testing

---

**Next Steps:** Review this plan, then proceed to [USER_MANAGEMENT.md](../user-management/USER_MANAGEMENT.md) for tier migration and user management details.
