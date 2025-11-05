# UI Implementation Guide

**Status:** 📋 Ready for Implementation
**Priority:** P0 - Required for Monetization
**Estimated Time:** 2-3 days

---

## Overview

This guide provides **exact code patterns** from the existing codebase to reuse for the payment/tier management UI. **Do not invent new patterns** - use what's already built and proven.

---

## Existing Modal Pattern

### Base Modal Structure

**Reference:** Sign-out confirmation modal (`src/popup/components/authModal.ts:194-242`)

**Template to Reuse:**
```typescript
function showConfirmationModal(title: string, message: string, onConfirm: () => void): void {
  const modalHTML = `
    <div class="modal-overlay" id="confirmation-modal">
      <div class="modal-container" style="max-width: 400px;">
        <div class="modal-header">
          <h2>${title}</h2>
          <button class="modal-close" id="close-confirmation">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <p>${message}</p>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" id="cancel-action">Cancel</button>
          <button class="btn btn-danger" id="confirm-action">Confirm</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Event listeners
  document.getElementById('close-confirmation')?.addEventListener('click', closeModal);
  document.getElementById('cancel-action')?.addEventListener('click', closeModal);
  document.getElementById('confirm-action')?.addEventListener('click', () => {
    onConfirm();
    closeModal();
  });

  // Click outside to close
  document.getElementById('confirmation-modal')?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      closeModal();
    }
  });
}
```

### CSS Classes (Already Defined)

**File:** `src/popup/styles/modal.css`

```css
.modal-overlay {
  /* Glassmorphism backdrop - REUSE THIS */
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.modal-container {
  /* Card styling - REUSE THIS */
  background: var(--modal-bg);
  border-radius: 16px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

.modal-header {
  /* Header styling - REUSE THIS */
  padding: 24px 24px 16px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  /* Body styling - REUSE THIS */
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  /* Footer styling - REUSE THIS */
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
```

---

## Existing Button Patterns

### Button Styles

**File:** `src/popup/styles/buttons.css`

**Primary Button (Upgrade, Confirm):**
```css
.btn-primary {
  background: var(--primary-gradient);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
```

**Secondary Button (Cancel, Close):**
```css
.btn-secondary {
  background: var(--secondary-bg);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}
```

**Danger Button (Delete, Sign Out):**
```css
.btn-danger {
  background: var(--danger-color);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}
```

### Button Usage Examples

**From existing codebase:**
```html
<!-- Primary action -->
<button class="btn btn-primary">Upgrade to PRO</button>

<!-- Secondary action -->
<button class="btn btn-secondary">Cancel</button>

<!-- Danger action -->
<button class="btn btn-danger">Delete Account</button>

<!-- Loading state (add this pattern) -->
<button class="btn btn-primary" disabled>
  <span class="spinner"></span>
  Processing...
</button>
```

---

## Tier Badge Pattern

### Existing Implementation

**File:** `src/popup/styles/auth.css:167-187`

```css
.tier-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.2s ease;
}

.free-tier {
  background: rgba(156, 163, 175, 0.1);
  color: #9ca3af;
  border: 1px solid rgba(156, 163, 175, 0.2);
}

.pro-tier {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: #78350f;
  border: none;
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.3);
  animation: pulse 2s ease-in-out infinite;
}
```

### Usage in HTML

**Locations (already implemented):**
1. Header: `popup-v2.html:50`
2. Features tab: `popup-v2.html:190`
3. Templates tab: `popup-v2.html:207`
4. User dropdown: `popup-v2.html:924`

**Pattern:**
```html
<span class="tier-badge free-tier">FREE</span>
<span class="tier-badge pro-tier">PRO</span>
```

**Update Function (already exists):**
```typescript
// src/popup/components/userProfile.ts
export function updateTierBadges(tier: TierLevel): void {
  const badges = document.querySelectorAll('.tier-badge');

  badges.forEach((badge) => {
    badge.classList.remove('free-tier', 'pro-tier');
    badge.classList.add(`${tier}-tier`);
    badge.textContent = tier.toUpperCase();
  });
}
```

---

## Plan Selection Modal (NEW)

### Implementation Using Existing Patterns

**File:** `src/popup/components/planSelection.ts` (CREATE THIS)

```typescript
import { initiateCheckout } from '../../lib/stripe';
import { showNotification } from '../utils/notifications';

// Price IDs (get from Firebase config or environment)
const PRICE_ID_MONTHLY = 'price_xxx'; // TODO: Replace with real price ID
const PRICE_ID_YEARLY = 'price_yyy'; // TODO: Replace with real price ID

export function showPlanSelectionModal(): void {
  const modalHTML = `
    <div class="modal-overlay" id="plan-selection-modal">
      <div class="modal-container" style="max-width: 800px;">
        <div class="modal-header">
          <h2>Choose Your Plan</h2>
          <button class="modal-close" id="close-plan-selection">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <div class="plans-container">
            <!-- Monthly Plan -->
            <div class="plan-card">
              <h3 class="plan-title">Monthly</h3>
              <div class="plan-price">
                <span class="price-amount">$4.99</span>
                <span class="price-period">/month</span>
              </div>
              <ul class="plan-features">
                <li class="feature-item">
                  <svg class="feature-icon">✓</svg>
                  <span>Unlimited alias profiles</span>
                </li>
                <li class="feature-item">
                  <svg class="feature-icon">✓</svg>
                  <span>Unlimited prompt templates</span>
                </li>
                <li class="feature-item">
                  <svg class="feature-icon">✓</svg>
                  <span>Quick Alias Generator (bulk)</span>
                </li>
                <li class="feature-item">
                  <svg class="feature-icon">✓</svg>
                  <span>Custom redaction rules</span>
                </li>
                <li class="feature-item">
                  <svg class="feature-icon">✓</svg>
                  <span>API key vault</span>
                </li>
              </ul>
              <button class="btn btn-primary plan-select-btn" data-price-id="${PRICE_ID_MONTHLY}">
                Select Monthly
              </button>
            </div>

            <!-- Yearly Plan (Popular) -->
            <div class="plan-card plan-card-popular">
              <div class="popular-badge">SAVE 17%</div>
              <h3 class="plan-title">Yearly</h3>
              <div class="plan-price">
                <span class="price-amount">$49</span>
                <span class="price-period">/year</span>
              </div>
              <div class="plan-savings">$10.88 savings vs monthly</div>
              <ul class="plan-features">
                <li class="feature-item">
                  <svg class="feature-icon">✓</svg>
                  <span>Everything in Monthly</span>
                </li>
                <li class="feature-item">
                  <svg class="feature-icon">✓</svg>
                  <span>2 months free</span>
                </li>
              </ul>
              <button class="btn btn-primary plan-select-btn" data-price-id="${PRICE_ID_YEARLY}">
                Select Yearly
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Event listeners
  document.getElementById('close-plan-selection')?.addEventListener('click', closePlanSelectionModal);

  // Click outside to close
  document.getElementById('plan-selection-modal')?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      closePlanSelectionModal();
    }
  });

  // Plan selection buttons
  document.querySelectorAll('.plan-select-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const target = e.target as HTMLElement;
      const priceId = target.dataset.priceId!;

      // Disable button and show loading
      const button = target as HTMLButtonElement;
      button.disabled = true;
      button.textContent = 'Opening checkout...';

      try {
        closePlanSelectionModal();
        showNotification('Opening Stripe checkout...', 'info');
        await initiateCheckout(priceId);
      } catch (error) {
        console.error('Checkout error:', error);
        showNotification('Failed to start checkout. Please try again.', 'error');
        button.disabled = false;
        button.textContent = 'Select Plan';
      }
    });
  });
}

export function closePlanSelectionModal(): void {
  document.getElementById('plan-selection-modal')?.remove();
}
```

### CSS for Plan Cards (ADD TO modal.css)

```css
.plans-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-top: 16px;
}

.plan-card {
  background: var(--secondary-bg);
  border: 2px solid var(--border-color);
  border-radius: 16px;
  padding: 32px 24px;
  position: relative;
  transition: all 0.3s ease;
}

.plan-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

.plan-card-popular {
  border-color: var(--primary-color);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%);
}

.popular-badge {
  position: absolute;
  top: -12px;
  right: 24px;
  background: var(--primary-gradient);
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.plan-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.plan-price {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 8px;
}

.price-amount {
  font-size: 48px;
  font-weight: 700;
  background: var(--primary-gradient);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.price-period {
  font-size: 18px;
  color: var(--text-secondary);
}

.plan-savings {
  color: var(--success-color);
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 24px;
}

.plan-features {
  list-style: none;
  padding: 0;
  margin: 24px 0;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  color: var(--text-primary);
}

.feature-icon {
  color: var(--success-color);
  font-weight: bold;
}

.plan-select-btn {
  width: 100%;
  margin-top: 16px;
}
```

---

## Account Settings Modal (NEW)

### Implementation Using Existing Patterns

**File:** `src/popup/components/accountSettings.ts` (CREATE THIS)

```typescript
import { useAppStore } from '../../lib/store';
import { showPlanSelectionModal } from './planSelection';
import { openCustomerPortal } from '../../lib/stripe';
import { showNotification } from '../utils/notifications';

export function showAccountSettingsModal(): void {
  const config = useAppStore.getState().config;
  if (!config?.account) {
    showNotification('Please sign in first', 'error');
    return;
  }

  const user = config.account;

  const modalHTML = `
    <div class="modal-overlay" id="account-settings-modal">
      <div class="modal-container" style="max-width: 500px;">
        <div class="modal-header">
          <h2>Account Settings</h2>
          <button class="modal-close" id="close-account-settings">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <!-- Profile Section -->
          <div class="settings-section">
            <h3 class="section-title">Profile</h3>
            <div class="user-display">
              <img src="${user.photoURL || ''}" class="user-avatar-large" alt="Avatar" />
              <div class="user-details">
                <div class="user-display-name">${user.displayName || 'User'}</div>
                <div class="user-display-email">${user.email || ''}</div>
              </div>
            </div>
          </div>

          <!-- Subscription Section -->
          <div class="settings-section">
            <h3 class="section-title">Subscription</h3>
            <div class="tier-info">
              <span class="tier-badge ${user.tier}-tier">${user.tier.toUpperCase()}</span>
              ${user.tier === 'free' ? `
                <button class="btn btn-primary" id="upgrade-from-settings">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" fill="currentColor"/>
                  </svg>
                  Upgrade to PRO
                </button>
              ` : `
                <button class="btn btn-secondary" id="manage-billing-from-settings">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3v-6a3 3 0 00-3-3H6a3 3 0 00-3 3v6a3 3 0 003 3z" stroke="currentColor" stroke-width="2"/>
                  </svg>
                  Manage Billing
                </button>
              `}
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" id="close-account-settings-footer">
            Close
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Event listeners
  document.getElementById('close-account-settings')?.addEventListener('click', closeAccountSettingsModal);
  document.getElementById('close-account-settings-footer')?.addEventListener('click', closeAccountSettingsModal);

  document.getElementById('upgrade-from-settings')?.addEventListener('click', () => {
    closeAccountSettingsModal();
    showPlanSelectionModal();
  });

  document.getElementById('manage-billing-from-settings')?.addEventListener('click', async () => {
    try {
      closeAccountSettingsModal();
      showNotification('Opening billing portal...', 'info');
      await openCustomerPortal();
    } catch (error) {
      console.error('Failed to open billing portal:', error);
      showNotification('Failed to open billing portal. Please try again.', 'error');
    }
  });

  // Click outside to close
  document.getElementById('account-settings-modal')?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      closeAccountSettingsModal();
    }
  });
}

export function closeAccountSettingsModal(): void {
  document.getElementById('account-settings-modal')?.remove();
}
```

### CSS for Account Settings (ADD TO modal.css)

```css
.settings-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 16px;
}

.user-display {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--secondary-bg);
  border-radius: 12px;
}

.user-avatar-large {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 3px solid var(--border-color);
}

.user-details {
  flex: 1;
}

.user-display-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.user-display-email {
  font-size: 14px;
  color: var(--text-secondary);
}

.tier-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: var(--secondary-bg);
  border-radius: 12px;
}

.tier-info .tier-badge {
  font-size: 14px;
  padding: 6px 16px;
}
```

---

## Notification System (NEW)

### Implementation

**File:** `src/popup/utils/notifications.ts` (CREATE THIS)

```typescript
export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export function showNotification(message: string, type: NotificationType = 'info'): void {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;

  // Icon based on type
  const icon = getIconForType(type);
  notification.innerHTML = `
    <div class="notification-icon">${icon}</div>
    <div class="notification-message">${message}</div>
  `;

  document.body.appendChild(notification);

  // Animate in
  requestAnimationFrame(() => {
    notification.classList.add('show');
  });

  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function getIconForType(type: NotificationType): string {
  switch (type) {
    case 'success':
      return '✓';
    case 'error':
      return '✗';
    case 'warning':
      return '⚠';
    case 'info':
    default:
      return 'ℹ';
  }
}
```

### CSS for Notifications (ADD TO modal.css)

```css
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 12px;
  background: var(--modal-bg);
  box-shadow: var(--shadow-xl);
  backdrop-filter: blur(12px);
  border-left: 4px solid var(--primary-color);
  opacity: 0;
  transform: translateX(100px);
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  z-index: 10000;
  max-width: 300px;
}

.notification.show {
  opacity: 1;
  transform: translateX(0);
}

.notification-icon {
  font-size: 20px;
  font-weight: bold;
}

.notification-message {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
}

.notification-success {
  border-left-color: var(--success-color);
}

.notification-success .notification-icon {
  color: var(--success-color);
}

.notification-error {
  border-left-color: var(--danger-color);
}

.notification-error .notification-icon {
  color: var(--danger-color);
}

.notification-warning {
  border-left-color: var(--warning-color);
}

.notification-warning .notification-icon {
  color: var(--warning-color);
}

.notification-info {
  border-left-color: var(--primary-color);
}

.notification-info .notification-icon {
  color: var(--primary-color);
}
```

---

## Implementation Checklist

### Phase 1: Setup Utilities (Day 1)
- [ ] Create `src/popup/utils/notifications.ts`
- [ ] Add notification CSS to `modal.css`
- [ ] Test notification system

### Phase 2: Account Settings (Day 1-2)
- [ ] Create `src/popup/components/accountSettings.ts`
- [ ] Add account settings CSS to `modal.css`
- [ ] Update `userProfile.ts:71-76` handler
- [ ] Test modal opens and displays user info

### Phase 3: Plan Selection (Day 2)
- [ ] Create `src/popup/components/planSelection.ts`
- [ ] Add plan card CSS to `modal.css`
- [ ] Test modal displays plans correctly
- [ ] Test plan selection buttons

### Phase 4: Billing Management (Day 2-3)
- [ ] Update `userProfile.ts:78-84` handler
- [ ] Test Customer Portal opens in new tab
- [ ] Test billing management flow

### Phase 5: Upgrade CTAs (Day 3)
- [ ] Update `featuresTab.ts:535-539` with real upgrade flow
- [ ] Test upgrade button triggers plan selection
- [ ] Test checkout flow completes

---

**Key Principle:** Every component here reuses existing patterns (modal structure, button styles, tier badges, glassmorphism). No new CSS frameworks, no new design patterns. Just connect existing UI to Stripe backend.
