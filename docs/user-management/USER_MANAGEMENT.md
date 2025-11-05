# User & Tier Management

**Status:** 📋 Planned
**Priority:** P0 - Required for Monetization
**Estimated Time:** 3-4 days
**Target Release:** v1.1.0

---

## Table of Contents

1. [Overview](#overview)
2. [Current State](#current-state)
3. [Tier Migration Logic](#tier-migration-logic)
4. [Account Settings](#account-settings)
5. [Billing Management](#billing-management)
6. [User Profile UI](#user-profile-ui)
7. [Implementation Guide](#implementation-guide)

---

## Overview

This document covers user account management, tier upgrades/downgrades, and the UI components for managing subscriptions.

---

## Current State

### ✅ Existing User System

#### 1. **Firebase Auth Integration** (`src/lib/store.ts:158-190`)

Current authentication flow:
```typescript
// Sign in with Google (Chrome Identity API)
const user = await signInWithCredential(auth, credential);

// Check if user exists in Firestore
const userDoc = await getDoc(doc(db, 'users', user.uid));

if (!userDoc.exists()) {
  // Create new user document
  await setDoc(doc(db, 'users', user.uid), {
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    tier: 'free',  // ← Default tier
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}

// Load tier from Firestore
const userData = userDoc.data();
tier: (userData?.tier as TierLevel) || 'free'
```

#### 2. **User Dropdown Menu** (`popup-v2.html:920-950`)

Current structure:
```html
<div id="user-profile" class="user-profile hidden">
  <!-- Avatar -->
  <img id="user-avatar" class="user-avatar" />

  <!-- Info -->
  <div class="user-info">
    <div id="user-name" class="user-name"></div>
    <div id="user-email" class="user-email"></div>
  </div>

  <!-- Tier Badge -->
  <span id="user-tier-badge" class="tier-badge free-tier">FREE</span>

  <!-- Dropdown Icon -->
  <svg class="dropdown-icon">...</svg>
</div>

<!-- Dropdown Menu -->
<div id="user-dropdown" class="user-dropdown hidden">
  <button id="account-settings-btn" class="dropdown-item">
    <svg>...</svg>
    <span>Account Settings</span>
  </button>

  <button id="manage-billing-btn" class="dropdown-item">
    <svg>...</svg>
    <span>Manage Billing</span>
  </button>

  <div class="dropdown-divider"></div>

  <button id="sign-out-btn" class="dropdown-item danger">
    <svg>...</svg>
    <span>Sign Out</span>
  </button>
</div>
```

#### 3. **Current Handlers** (`src/popup/components/userProfile.ts`)

```typescript
// ✅ Sign Out - WORKING
document.getElementById('sign-out-btn')?.addEventListener('click', async () => {
  showSignOutModal();
});

// ⏳ Account Settings - STUB
document.getElementById('account-settings-btn')?.addEventListener('click', () => {
  console.log('Account settings clicked');
  // TODO: Implement account settings modal
});

// ⏳ Manage Billing - STUB
document.getElementById('manage-billing-btn')?.addEventListener('click', () => {
  console.log('Manage billing clicked');
  // TODO: Implement billing management
});
```

---

## Tier Migration Logic

### Upgrade Flow (FREE → PRO)

**Trigger Points:**
1. User clicks "Upgrade to PRO" in features tab
2. User clicks locked PRO feature
3. User clicks tier badge in header

**Flow:**
```
User Clicks Upgrade
      ↓
Show Plan Selection Modal
  - Monthly $4.99/month
  - Yearly $49/year (save 17%)
      ↓
User Selects Plan
      ↓
Create Stripe Checkout Session
  (Firebase Function)
      ↓
Open Checkout in New Tab
      ↓
User Completes Payment
      ↓
Stripe Webhook Fired
      ↓
Update Firestore: tier = 'pro'
      ↓
Extension Listens to Firestore
  (onSnapshot listener)
      ↓
Update Local State & UI
  - Tier badge → PRO (gold)
  - Unlock PRO features
  - Show success notification
```

### Downgrade Flow (PRO → FREE)

**Trigger Points:**
1. User cancels subscription in Stripe Portal
2. Subscription expires (non-payment)
3. Admin manual downgrade

**Flow:**
```
Subscription Cancelled
      ↓
Stripe Webhook: subscription.deleted
      ↓
Update Firestore: tier = 'free'
      ↓
Extension Listens to Firestore
      ↓
Update Local State & UI
  - Tier badge → FREE (gray)
  - Lock PRO features
  - Show migration modal
      ↓
Migrate User Data
  - Keep first 5 profiles (delete rest)
  - Keep first 5 templates (delete rest)
  - Disable PRO features
      ↓
Show Success Message
  "You've been downgraded to FREE"
```

### Firestore Tier Listener

**File:** `src/lib/store.ts` (add to existing)

```typescript
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

export function listenToTierChanges(userId: string): () => void {
  const userRef = doc(db, 'users', userId);

  const unsubscribe = onSnapshot(userRef, (snapshot) => {
    if (snapshot.exists()) {
      const userData = snapshot.data();
      const newTier = userData.tier as TierLevel;

      const currentTier = useAppStore.getState().config?.account?.tier;

      if (newTier !== currentTier) {
        console.log(`Tier changed: ${currentTier} → ${newTier}`);

        // Update local state
        useAppStore.setState((state) => ({
          config: {
            ...state.config!,
            account: {
              ...state.config!.account,
              tier: newTier,
            },
          },
        }));

        // Update badge UI
        updateTierBadges(newTier);

        // Handle tier change
        if (newTier === 'free' && currentTier === 'pro') {
          handleDowngrade();
        } else if (newTier === 'pro' && currentTier === 'free') {
          handleUpgrade();
        }
      }
    }
  });

  return unsubscribe;
}
```

### Downgrade Data Migration

**File:** `src/lib/tierMigration.ts` (NEW)

```typescript
import { StorageManager } from './storage';

export async function handleDowngrade(): Promise<void> {
  const storage = StorageManager.getInstance();

  // Show migration modal
  showMigrationModal('Downgrading to FREE tier...');

  try {
    // 1. Limit profiles to 5
    const profiles = await storage.getAllProfiles();
    if (profiles.length > 5) {
      const profilesToDelete = profiles.slice(5);
      for (const profile of profilesToDelete) {
        await storage.deleteProfile(profile.id);
      }
      console.log(`Deleted ${profilesToDelete.length} profiles (FREE limit: 5)`);
    }

    // 2. Limit templates to 5
    const templates = await storage.getPromptTemplates();
    if (templates.length > 5) {
      const templatesToDelete = templates.slice(5);
      for (const template of templatesToDelete) {
        await storage.deletePromptTemplate(template.id);
      }
      console.log(`Deleted ${templatesToDelete.length} templates (FREE limit: 5)`);
    }

    // 3. Disable PRO features
    const config = await storage.loadConfig();
    config.features = {
      ...config.features,
      customRules: { ...config.features.customRules, enabled: false },
      apiKeyVault: { ...config.features.apiKeyVault, enabled: false },
    };
    await storage.saveConfig(config);

    // Show success
    closeMigrationModal();
    showNotification('Downgraded to FREE tier', 'success');
  } catch (error) {
    console.error('Downgrade migration error:', error);
    showNotification('Downgrade failed. Please contact support.', 'error');
  }
}

export async function handleUpgrade(): Promise<void> {
  // Show success notification
  showNotification('Upgraded to PRO! All features unlocked.', 'success');

  // Refresh UI to show unlocked features
  // (features will automatically unlock due to tier check)
}
```

---

## Account Settings

### Account Settings Modal

**File:** `src/popup/components/accountSettings.ts` (NEW)

Modal should reuse existing modal pattern (`modal.css`) with this structure:

```typescript
export function showAccountSettingsModal(): void {
  const user = useAppStore.getState().config?.account;

  const modalHTML = `
    <div class="modal-overlay" id="account-settings-modal">
      <div class="modal-container">
        <div class="modal-header">
          <h2>Account Settings</h2>
          <button class="modal-close" id="close-account-settings">
            <svg>...</svg>
          </button>
        </div>

        <div class="modal-body">
          <!-- User Info Section -->
          <div class="settings-section">
            <h3>Profile</h3>
            <div class="user-info-display">
              <img src="${user.photoURL}" class="avatar-large" />
              <div>
                <div class="display-name">${user.displayName}</div>
                <div class="email">${user.email}</div>
              </div>
            </div>
          </div>

          <!-- Tier Info Section -->
          <div class="settings-section">
            <h3>Subscription</h3>
            <div class="tier-display">
              <span class="tier-badge ${user.tier}-tier">${user.tier.toUpperCase()}</span>
              ${user.tier === 'free' ? `
                <button class="btn btn-primary" id="upgrade-from-settings">
                  Upgrade to PRO
                </button>
              ` : `
                <button class="btn btn-secondary" id="manage-billing-from-settings">
                  Manage Billing
                </button>
              `}
            </div>
          </div>

          <!-- Account Actions -->
          <div class="settings-section">
            <h3>Account</h3>
            <button class="btn btn-danger" id="delete-account-btn">
              Delete Account
            </button>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" id="cancel-account-settings">
            Close
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Event listeners
  document.getElementById('close-account-settings')?.addEventListener('click', closeAccountSettingsModal);
  document.getElementById('cancel-account-settings')?.addEventListener('click', closeAccountSettingsModal);
  document.getElementById('upgrade-from-settings')?.addEventListener('click', () => {
    closeAccountSettingsModal();
    showPlanSelectionModal();
  });
  document.getElementById('manage-billing-from-settings')?.addEventListener('click', () => {
    closeAccountSettingsModal();
    openCustomerPortal();
  });
}
```

### Update Handler

**File:** `src/popup/components/userProfile.ts:71-76`

```typescript
// BEFORE (stub):
document.getElementById('account-settings-btn')?.addEventListener('click', () => {
  console.log('Account settings clicked');
});

// AFTER:
import { showAccountSettingsModal } from './accountSettings';

document.getElementById('account-settings-btn')?.addEventListener('click', () => {
  showAccountSettingsModal();
});
```

---

## Billing Management

### Manage Billing Button

**File:** `src/popup/components/userProfile.ts:78-84`

```typescript
// BEFORE (stub):
document.getElementById('manage-billing-btn')?.addEventListener('click', () => {
  console.log('Manage billing clicked');
});

// AFTER:
import { openCustomerPortal } from '../../lib/stripe';

document.getElementById('manage-billing-btn')?.addEventListener('click', async () => {
  try {
    await openCustomerPortal();
  } catch (error) {
    console.error('Failed to open billing portal:', error);
    showNotification('Failed to open billing portal. Please try again.', 'error');
  }
});
```

### Plan Selection Modal

**File:** `src/popup/components/planSelection.ts` (NEW)

```typescript
export function showPlanSelectionModal(): void {
  const modalHTML = `
    <div class="modal-overlay" id="plan-selection-modal">
      <div class="modal-container">
        <div class="modal-header">
          <h2>Choose Your Plan</h2>
          <button class="modal-close" id="close-plan-selection">×</button>
        </div>

        <div class="modal-body">
          <div class="plans-grid">
            <!-- Monthly Plan -->
            <div class="plan-card">
              <h3>Monthly</h3>
              <div class="plan-price">
                <span class="price">$4.99</span>
                <span class="period">/month</span>
              </div>
              <ul class="plan-features">
                <li>✓ Unlimited profiles</li>
                <li>✓ Unlimited templates</li>
                <li>✓ Quick alias generator</li>
                <li>✓ Custom redaction rules</li>
                <li>✓ API key vault</li>
              </ul>
              <button class="btn btn-primary" data-price-id="${PRICE_ID_MONTHLY}">
                Select Monthly
              </button>
            </div>

            <!-- Yearly Plan -->
            <div class="plan-card popular">
              <div class="popular-badge">SAVE 17%</div>
              <h3>Yearly</h3>
              <div class="plan-price">
                <span class="price">$49</span>
                <span class="period">/year</span>
              </div>
              <div class="savings">$10.88 off vs monthly</div>
              <ul class="plan-features">
                <li>✓ Everything in Monthly</li>
                <li>✓ 2 months free</li>
              </ul>
              <button class="btn btn-primary" data-price-id="${PRICE_ID_YEARLY}">
                Select Yearly
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Event listeners for plan selection
  document.querySelectorAll('[data-price-id]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const priceId = (e.target as HTMLElement).dataset.priceId!;
      await handlePlanSelection(priceId);
    });
  });
}

async function handlePlanSelection(priceId: string): Promise<void> {
  try {
    closePlanSelectionModal();
    showNotification('Opening checkout...', 'info');
    await initiateCheckout(priceId);
  } catch (error) {
    console.error('Checkout error:', error);
    showNotification('Failed to start checkout. Please try again.', 'error');
  }
}
```

---

## User Profile UI

### Tier Badge Updates

**File:** `src/popup/components/userProfile.ts` (add function)

```typescript
export function updateTierBadges(tier: TierLevel): void {
  const badges = document.querySelectorAll('.tier-badge');

  badges.forEach((badge) => {
    // Remove old classes
    badge.classList.remove('free-tier', 'pro-tier');

    // Add new class
    badge.classList.add(`${tier}-tier`);

    // Update text
    badge.textContent = tier.toUpperCase();
  });

  console.log(`Updated ${badges.length} tier badges to ${tier.toUpperCase()}`);
}
```

### Notification System

Reuse existing notification pattern from sign-out confirmation:

**File:** `src/popup/utils/notifications.ts` (NEW)

```typescript
export function showNotification(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info'): void {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => notification.classList.add('show'), 10);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
```

**CSS:** (Add to existing `modal.css`)

```css
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 8px;
  background: var(--modal-bg);
  color: var(--text-primary);
  box-shadow: var(--shadow-lg);
  opacity: 0;
  transform: translateY(-20px);
  transition: all 0.3s ease;
  z-index: 10000;
}

.notification.show {
  opacity: 1;
  transform: translateY(0);
}

.notification-success {
  border-left: 4px solid var(--success-color);
}

.notification-error {
  border-left: 4px solid var(--danger-color);
}

.notification-info {
  border-left: 4px solid var(--primary-color);
}

.notification-warning {
  border-left: 4px solid var(--warning-color);
}
```

---

## Implementation Guide

### Phase 1: Setup Tier Listener (Day 1)

**Files to modify:**
1. `src/lib/store.ts` - Add `listenToTierChanges()` function
2. `src/popup/popup-v2.ts` - Start listener after auth
3. `src/popup/components/userProfile.ts` - Add `updateTierBadges()` function

**Implementation:**
```typescript
// In popup-v2.ts, after user signs in:
if (user) {
  const unsubscribe = listenToTierChanges(user.uid);
  // Store unsubscribe function to cleanup on popup close
}
```

### Phase 2: Account Settings Modal (Day 1-2)

**New files:**
1. `src/popup/components/accountSettings.ts`
2. `src/popup/utils/notifications.ts`

**Files to modify:**
1. `src/popup/components/userProfile.ts:71-76` - Implement handler

**CSS:** Reuse `modal.css` pattern

### Phase 3: Plan Selection & Upgrade (Day 2-3)

**New files:**
1. `src/popup/components/planSelection.ts`
2. `src/lib/stripe.ts` (from Stripe Integration doc)

**Files to modify:**
1. `src/popup/components/featuresTab.ts:535-539` - Real upgrade flow
2. `src/popup/components/userProfile.ts:78-84` - Billing handler

### Phase 4: Tier Migration (Day 3-4)

**New files:**
1. `src/lib/tierMigration.ts`

**Functions needed:**
- `handleDowngrade()` - Migrate data on FREE downgrade
- `handleUpgrade()` - Show success on PRO upgrade

### Phase 5: Testing (Day 4)

**Test scenarios:**
- [ ] Click Account Settings → Modal opens
- [ ] Click Upgrade → Plan selection modal
- [ ] Select plan → Stripe checkout opens
- [ ] Complete payment → Tier updates to PRO
- [ ] Badge changes to gold PRO
- [ ] Features unlock
- [ ] Click Manage Billing → Portal opens
- [ ] Cancel subscription → Tier downgrades to FREE
- [ ] Data migrated (profiles/templates limited to 5)
- [ ] Features lock

---

**Next Steps:** Review both docs, then proceed to implementation starting with Stripe setup.
