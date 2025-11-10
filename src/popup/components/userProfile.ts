/**
 * User Profile Display Component
 * Shows authenticated user info in header
 * Handles sign-out and account management
 */

import { auth } from '../../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useAppStore } from '../../lib/store';
import { openAuthModal, signOutUser } from './authModal';
import { listenToUserTier } from '../../lib/firebaseService';
import { handleDowngrade, handleDatabaseUpgrade } from '../../lib/tierMigration';
import { showError, showInfo, showWarning } from '../utils/modalUtils';
import { EventManager } from '../utils/eventManager';

// Event manager for cleanup
const eventManager = new EventManager();

const DEBUG_MODE = false;

let currentUser: User | null = null;
let unsubscribeTierListener: (() => void) | null = null;

/**
 * Initialize user profile display
 */
export function initUserProfile() {
  // Listen for auth state changes
  onAuthStateChanged(auth, async (user) => {
    currentUser = user;

    if (user) {
      await onUserSignedIn(user);
    } else {
      onUserSignedOut();
    }
  });

  // Sign-in button
  const signInBtn = document.getElementById('headerSignInBtn');
  eventManager.add(signInBtn, 'click', () => {
    // Show loading state
    if (signInBtn) {
      signInBtn.classList.add('loading');
      signInBtn.setAttribute('disabled', 'true');
    }
    openAuthModal('signin');
  });

  // User menu toggle
  const userMenuBtn = document.getElementById('userMenuBtn');
  const userDropdown = document.getElementById('userDropdown');

  eventManager.add(userMenuBtn, 'click', () => {
    userDropdown?.classList.toggle('hidden');
  });

  // Close dropdown when clicking outside
  eventManager.add(document, 'click', (e) => {
    if (!userMenuBtn?.contains(e.target as Node) && !userDropdown?.contains(e.target as Node)) {
      userDropdown?.classList.add('hidden');
    }
  });

  // Helper function to close dropdown
  const closeDropdown = () => {
    userDropdown?.classList.add('hidden');
  };

  // Get Started button - opens getting started modal
  const getStartedBtn = document.getElementById('getStartedBtn');
  eventManager.add(getStartedBtn, 'click', () => {
    closeDropdown();
    openGettingStartedModal();
  });

  // Account settings - opens account settings modal
  const accountSettingsBtn = document.getElementById('accountSettingsBtn');
  eventManager.add(accountSettingsBtn, 'click', () => {
    closeDropdown();
    openAccountSettingsModal();
  });

  // Manage billing - opens Stripe Customer Portal
  const manageBillingBtn = document.getElementById('manageBillingBtn');
  eventManager.add(manageBillingBtn, 'click', async () => {
    closeDropdown();
    await handleManageBilling();
  });

  // Sign-out button
  const signOutBtn = document.getElementById('signOutBtn');
  eventManager.add(signOutBtn, 'click', () => {
    closeDropdown();
    handleSignOut();
  });

  console.log('[User Profile] Initialized');
}

/**
 * Handle user signed in
 */
async function onUserSignedIn(user: User) {
  if (DEBUG_MODE) {
    console.log('[User Profile] User signed in:', user.uid);
    console.log('[User Profile] Full user object:', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      providerId: user.providerId
    });
  }

  // Update UI to show user info
  showAuthenticatedUI(user);

  // Sync user to Firestore and load tier
  const store = useAppStore.getState();

  try {
    // First sync user to Firestore (creates document if doesn't exist)
    await store.syncUserToFirestore(user);

    // Then load tier (now Firebase UID will be set)
    await store.loadUserTier();

    // Update tier badge
    updateTierBadge();

    // Start listening for real-time tier changes from Stripe webhooks
    if (unsubscribeTierListener) {
      unsubscribeTierListener(); // Clean up previous listener
    }

    unsubscribeTierListener = listenToUserTier(user.uid, async (tier) => {
      console.log('[User Profile] 🔔 Tier updated from Firestore:', tier);

      const previousTier = store.config?.account?.tier;

      // Update store
      await store.updateAccount({ tier });

      // Handle tier changes
      if (previousTier && previousTier !== tier) {
        if (previousTier === 'pro' && tier === 'free') {
          // DOWNGRADE: PRO → FREE
          await handleDowngrade(user.uid);
          console.log('[User Profile] ⬇️  Downgraded to FREE - data migration complete');
          // TODO: Show downgrade notification modal to user
        } else if (previousTier === 'free' && tier === 'pro') {
          // UPGRADE: FREE → PRO
          const upgradeInfo = await handleDatabaseUpgrade(user.uid);
          console.log('[User Profile] ⬆️  Upgraded to PRO!');

          if (upgradeInfo.hasArchive) {
            // User has archived data - show restoration prompt
            console.log('[User Profile] 📦 Found archived data from:', upgradeInfo.archiveInfo?.archivedAt);
            // TODO: Show restoration modal with option to restore or start fresh
          }
        }
      }

      // Update UI immediately
      updateTierBadge();

      // Show console log for upgrade (first time)
      if (!previousTier && tier === 'pro') {
        console.log('[User Profile] 🎉 Congratulations! Upgraded to PRO!');
      }
    });

    console.log('[User Profile] ✅ Tier listener started for user:', user.uid);
  } catch (error) {
    console.error('[User Profile] Error syncing user:', error);
  }
}

/**
 * Handle user signed out
 */
function onUserSignedOut() {
  console.log('[User Profile] User signed out');

  // Stop tier listener
  if (unsubscribeTierListener) {
    unsubscribeTierListener();
    unsubscribeTierListener = null;
    console.log('[User Profile] Tier listener stopped');
  }

  // Update UI to show sign-in button
  showUnauthenticatedUI();

  // Reset tier to free
  const store = useAppStore.getState();
  store.updateAccount({ tier: 'free' });
  updateTierBadge();
}

/**
 * Show authenticated user UI
 */
function showAuthenticatedUI(user: User) {
  const signInContainer = document.getElementById('headerSignInContainer');
  const userProfileContainer = document.getElementById('headerUserProfileContainer');
  const signInBtn = document.getElementById('headerSignInBtn');

  // Remove loading state from sign-in button
  if (signInBtn) {
    signInBtn.classList.remove('loading');
    signInBtn.removeAttribute('disabled');
  }

  signInContainer?.classList.add('hidden');
  userProfileContainer?.classList.remove('hidden');

  // Update user info
  const userEmail = document.getElementById('userEmail');
  const userAvatar = document.getElementById('userAvatar') as HTMLImageElement;
  const userInitials = document.getElementById('userInitials');

  if (userEmail) userEmail.textContent = user.email || 'Unknown';

  // Show avatar or initials
  if (user.photoURL && userAvatar) {
    userAvatar.src = user.photoURL;
    userAvatar.classList.remove('hidden');
    userInitials?.classList.add('hidden');
  } else if (userInitials) {
    userInitials.textContent = getInitials(user.displayName || user.email || 'U');
    userInitials.classList.remove('hidden');
    userAvatar?.classList.add('hidden');
  }

  // Show Quick Start buttons when authenticated
  showQuickStartButtons();
}

/**
 * Show unauthenticated UI (sign-in button)
 */
function showUnauthenticatedUI() {
  const signInContainer = document.getElementById('headerSignInContainer');
  const userProfileContainer = document.getElementById('headerUserProfileContainer');
  const signInBtn = document.getElementById('headerSignInBtn');

  // Remove loading state from sign-in button (in case modal was closed)
  if (signInBtn) {
    signInBtn.classList.remove('loading');
    signInBtn.removeAttribute('disabled');
  }

  signInContainer?.classList.remove('hidden');
  userProfileContainer?.classList.add('hidden');

  // Hide Quick Start buttons when not authenticated
  hideQuickStartButtons();
}

/**
 * Update tier badge in UI
 */
export function updateTierBadge() {
  const store = useAppStore.getState();
  const tier = store.config?.account?.tier || 'free';

  // Update tier badges
  const tierBadges = document.querySelectorAll('.user-tier-badge');
  tierBadges.forEach((badge) => {
    badge.textContent = tier.toUpperCase();
    badge.className = 'user-tier-badge';
    badge.classList.add(`tier-${tier}`);
  });

  // Update header tier badge
  const headerTierBadge = document.getElementById('currentTierBadge');
  if (headerTierBadge) {
    headerTierBadge.textContent = tier.toUpperCase();
    headerTierBadge.className = 'tier-badge';
    headerTierBadge.classList.add(`tier-${tier}`);
  }
}

/**
 * Handle sign-out
 */
async function handleSignOut() {
  // Show custom confirmation modal
  const modal = document.getElementById('signOutModal');
  if (!modal) {
    // Fallback - modal should normally be used
    showWarning('Sign-out modal not found. Please refresh the page and try again.');
    return;

    try {
      await signOutUser();
      console.log('[User Profile] Signed out successfully');
    } catch (error) {
      console.error('[User Profile] Sign-out error:', error);
      showError('Error signing out. Please try again.');
    }
    return;
  }

  // Show modal
  modal.classList.remove('hidden');

  // Set up modal handlers (one-time setup)
  const closeBtn = document.getElementById('signOutModalClose');
  const cancelBtn = document.getElementById('signOutCancel');
  const confirmBtn = document.getElementById('signOutConfirm');
  const overlay = modal.querySelector('.modal-overlay') as HTMLElement;

  const closeModal = () => {
    modal.classList.add('hidden');
  };

  const handleConfirm = async () => {
    try {
      closeModal();
      await signOutUser();
      console.log('[User Profile] Signed out successfully');
    } catch (error) {
      console.error('[User Profile] Sign-out error:', error);
      showError('Error signing out. Please try again.');
    }
  };

  // Add event listeners
  eventManager.add(closeBtn, 'click', closeModal);
  eventManager.add(cancelBtn, 'click', closeModal);
  eventManager.add(confirmBtn, 'click', handleConfirm);
  eventManager.add(overlay, 'click', closeModal);
}

/**
 * Get initials from name or email
 */
function getInitials(text: string): string {
  const words = text.split(/[\s@.]+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return text.substring(0, 2).toUpperCase();
}

/**
 * Get current authenticated user
 */
export function getCurrentUser(): User | null {
  return currentUser;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return currentUser !== null;
}

/**
 * Handle Quick Start with Google - pre-fill profile with Google account info
 * This function is exported to be used by the Quick Start button in the UI
 */
export function handleGoogleQuickStart() {
  if (!currentUser) {
    console.error('[User Profile] No user signed in for Quick Start');
    return;
  }

  console.log('[User Profile] Google Quick Start selected');

  // Open profile modal with pre-filled Google info
  const addProfileBtn = document.getElementById('addProfileBtn');
  if (!addProfileBtn) {
    console.error('[User Profile] Add profile button not found');
    return;
  }

  // Trigger the add profile modal
  addProfileBtn.click();

  // Pre-fill the form with Google account info AND branded fake alias data
  // Use longer delay to ensure modal is fully rendered
  setTimeout(() => {
    console.log('[User Profile] Starting auto-fill...');
    const user = currentUser!;

    // Profile configuration
    const profileNameInput = document.getElementById('profileName') as HTMLInputElement;
    const profileDescInput = document.getElementById('profileDescription') as HTMLInputElement;

    // Real information (from Google)
    const realNameInput = document.getElementById('realName') as HTMLInputElement;
    const realEmailInput = document.getElementById('realEmail') as HTMLInputElement;

    // Alias information (branded fake data)
    const aliasNameInput = document.getElementById('aliasName') as HTMLInputElement;
    const aliasEmailInput = document.getElementById('aliasEmail') as HTMLInputElement;
    const aliasPhoneInput = document.getElementById('aliasPhone') as HTMLInputElement;
    const aliasAddressInput = document.getElementById('aliasAddress') as HTMLInputElement;

    // Pre-fill profile name
    if (profileNameInput) {
      profileNameInput.value = 'My Gmail Profile';
      profileNameInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Pre-fill description
    if (profileDescInput) {
      profileDescInput.value = 'My PromptBlocker Gmail alias';
      profileDescInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Pre-fill REAL information from Google
    if (realNameInput) {
      // Try to use displayName, or extract from email as fallback
      let name = user.displayName;
      if (!name && user.email) {
        // Extract username from email (before @)
        const emailPrefix = user.email.split('@')[0];
        name = emailPrefix;
        if (DEBUG_MODE) {
          console.log('[User Profile] 📧 Extracted name from email:', name);
        }
      }

      if (name) {
        realNameInput.value = name;
        realNameInput.dispatchEvent(new Event('input', { bubbles: true }));
        if (DEBUG_MODE) {
          console.log('[User Profile] ✅ Set real name to:', name);
        }
      } else {
        console.warn('[User Profile] ❌ No displayName or email available');
      }
    } else {
      console.error('[User Profile] ❌ realNameInput not found');
    }

    if (realEmailInput) {
      if (user.email) {
        realEmailInput.value = user.email;
        realEmailInput.dispatchEvent(new Event('input', { bubbles: true }));
        if (DEBUG_MODE) {
          console.log('[User Profile] ✅ Set real email to:', user.email);
        }
      }
    } else {
      console.error('[User Profile] ❌ realEmailInput not found');
    }

    // Pre-fill ALIAS information with branded fake data
    if (aliasNameInput) {
      aliasNameInput.value = 'Alias Personname';
      aliasNameInput.dispatchEvent(new Event('input', { bubbles: true }));
      if (DEBUG_MODE) {
        console.log('[User Profile] ✅ Set alias name');
      }
    } else {
      console.error('[User Profile] ❌ aliasNameInput not found');
    }

    if (aliasEmailInput) {
      aliasEmailInput.value = 'blocked-email@promptblocker.com';
      aliasEmailInput.dispatchEvent(new Event('input', { bubbles: true }));
      if (DEBUG_MODE) {
        console.log('[User Profile] ✅ Set alias email');
      }
    } else {
      console.error('[User Profile] ❌ aliasEmailInput not found');
    }

    if (aliasPhoneInput) {
      aliasPhoneInput.value = '(555) 555-5555';
      aliasPhoneInput.dispatchEvent(new Event('input', { bubbles: true }));
      if (DEBUG_MODE) {
        console.log('[User Profile] ✅ Set alias phone');
      }
    } else {
      console.error('[User Profile] ❌ aliasPhoneInput not found');
    }

    if (aliasAddressInput) {
      aliasAddressInput.value = '123 Address St, Sometown, STATE, USA';
      aliasAddressInput.dispatchEvent(new Event('input', { bubbles: true }));
      if (DEBUG_MODE) {
        console.log('[User Profile] ✅ Set alias address');
      }
    } else {
      console.error('[User Profile] ❌ aliasAddressInput not found');
    }

    console.log('[User Profile] Auto-fill complete');
  }, 500); // Longer delay to ensure modal is fully rendered
}

/**
 * Show Quick Start buttons (when user is authenticated)
 */
function showQuickStartButtons() {
  const googleQuickStartBtn = document.getElementById('googleQuickStartBtn');
  const googleQuickStartBtnEmpty = document.getElementById('googleQuickStartBtnEmpty');

  if (googleQuickStartBtn) {
    googleQuickStartBtn.classList.remove('hidden');
    googleQuickStartBtn.style.display = '';
  }

  if (googleQuickStartBtnEmpty) {
    googleQuickStartBtnEmpty.classList.remove('hidden');
    googleQuickStartBtnEmpty.style.display = '';
  }

  console.log('[User Profile] Quick Start buttons shown');
}

/**
 * Hide Quick Start buttons (when user is not authenticated)
 */
function hideQuickStartButtons() {
  const googleQuickStartBtn = document.getElementById('googleQuickStartBtn');
  const googleQuickStartBtnEmpty = document.getElementById('googleQuickStartBtnEmpty');

  if (googleQuickStartBtn) {
    googleQuickStartBtn.classList.add('hidden');
  }

  if (googleQuickStartBtnEmpty) {
    googleQuickStartBtnEmpty.classList.add('hidden');
  }

  console.log('[User Profile] Quick Start buttons hidden');
}

/**
 * Handle Upgrade - opens Stripe checkout for monthly subscription
 */
async function handleUpgrade() {
  try {
    // Import Stripe utilities
    const { upgradeToMonthly } = await import('../../lib/stripe');

    // Open Stripe Checkout in new tab
    await upgradeToMonthly();
    console.log('[User Profile] Opened Stripe Checkout for monthly subscription');
  } catch (error) {
    console.error('[User Profile] Failed to open checkout:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to open checkout. Please make sure you are signed in and try again.';
    showError(errorMessage);
  }
}

/**
 * Handle Manage Billing - opens Stripe Customer Portal
 */
async function handleManageBilling() {
  // Check if user has a tier (signed in)
  if (!currentUser) {
    showWarning('Please sign in to manage billing.');
    return;
  }

  // Check if user is already a PRO subscriber
  const store = useAppStore.getState();
  const tier = store.config?.account?.tier || 'free';

  if (tier === 'free') {
    // User is on free tier - show info and don't proceed
    showInfo('You are currently on the FREE tier.\n\nTo manage billing, you need an active PRO subscription.\n\nClick "Upgrade to PRO" to get started.');
    return;
  }

  // User is PRO - open billing portal
  try {
    // Import Stripe utilities
    const { openCustomerPortal } = await import('../../lib/stripe');

    // Open Stripe Customer Portal in new tab
    await openCustomerPortal();
    console.log('[User Profile] Opened Stripe Customer Portal');
  } catch (error) {
    console.error('[User Profile] Failed to open billing portal:', error);

    // Show custom error modal instead of browser alert
    showCustomError(
      'Unable to Open Billing Portal',
      'We couldn\'t open the billing portal at this time. This could be due to a temporary network issue.\n\n' +
      'Please try again in a few moments. If the problem persists, contact support at support@promptblocker.com'
    );
  }
}

/**
 * Show custom error modal
 */
function showCustomError(title: string, message: string) {
  // Create modal elements
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'modal-overlay';
  modalOverlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 10000;';

  const modalContent = document.createElement('div');
  modalContent.style.cssText = 'background: var(--card-bg); border-radius: 16px; padding: 2rem; max-width: 400px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);';

  const modalTitle = document.createElement('h3');
  modalTitle.textContent = title;
  modalTitle.style.cssText = 'margin: 0 0 1rem 0; color: var(--text-primary); font-size: 1.25rem;';

  const modalMessage = document.createElement('p');
  modalMessage.textContent = message;
  modalMessage.style.cssText = 'margin: 0 0 1.5rem 0; color: var(--text-secondary); line-height: 1.6; white-space: pre-line;';

  const okButton = document.createElement('button');
  okButton.textContent = 'OK';
  okButton.className = 'btn btn-primary';
  okButton.style.width = '100%';
  okButton.onclick = () => document.body.removeChild(modalOverlay);

  modalContent.appendChild(modalTitle);
  modalContent.appendChild(modalMessage);
  modalContent.appendChild(okButton);
  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);

  // Close on overlay click
  modalOverlay.onclick = (e) => {
    if (e.target === modalOverlay) {
      document.body.removeChild(modalOverlay);
    }
  };
}

/**
 * Open Account Settings Modal
 */
function openAccountSettingsModal() {
  const modal = document.getElementById('accountSettingsModal');
  if (!modal) {
    console.error('[User Profile] Account Settings modal not found');
    return;
  }

  // Update modal with current user data
  const store = useAppStore.getState();
  const user = currentUser;
  const tier = store.config?.account?.tier || 'free';

  // Update email display
  const emailDisplay = document.getElementById('accountEmailDisplay');
  if (emailDisplay && user?.email) {
    emailDisplay.textContent = user.email;
  }

  // Update tier badge
  const tierBadge = document.getElementById('accountTierBadge');
  if (tierBadge) {
    tierBadge.textContent = tier.toUpperCase();
    tierBadge.className = 'user-tier-badge';
    tierBadge.classList.add(`tier-${tier}`);
  }

  // Show/hide appropriate sections based on tier
  const upgradeSection = document.getElementById('accountUpgradeSection');
  const billingSection = document.getElementById('accountManageBillingSection');
  const accountUpgradeBtn = document.getElementById('accountUpgradeBtn');
  const accountManageBillingBtn = document.getElementById('accountManageBillingBtn');

  if (tier === 'pro') {
    // PRO user - show Manage Billing section only
    if (upgradeSection) upgradeSection.style.display = 'none';
    if (billingSection) billingSection.style.display = 'block';
    if (accountManageBillingBtn) {
      accountManageBillingBtn.onclick = async () => {
        modal.classList.add('hidden');
        await handleManageBilling();
      };
    }
  } else {
    // FREE user - show Upgrade section
    if (upgradeSection) upgradeSection.style.display = 'block';
    if (billingSection) billingSection.style.display = 'none';
    if (accountUpgradeBtn) {
      accountUpgradeBtn.onclick = async () => {
        modal.classList.add('hidden');
        await handleUpgrade();
      };
    }
  }

  // Wire up close buttons
  const closeBtn = modal.querySelector('.modal-close') as HTMLElement;
  const closeButton = document.getElementById('accountSettingsCloseBtn') as HTMLElement;
  const overlay = modal.querySelector('.modal-overlay') as HTMLElement;

  const closeModal = () => modal.classList.add('hidden');

  if (closeBtn) {
    closeBtn.onclick = closeModal;
  }
  if (closeButton) {
    closeButton.onclick = closeModal;
  }
  if (overlay) {
    overlay.onclick = closeModal;
  }

  // Show modal
  modal.classList.remove('hidden');
  console.log('[User Profile] Account Settings modal opened');
}

/**
 * Open Getting Started Modal
 */
function openGettingStartedModal() {
  const modal = document.getElementById('gettingStartedModal');
  if (modal) {
    modal.classList.remove('hidden');
    console.log('[User Profile] Getting Started modal opened');
  } else {
    console.error('[User Profile] Getting Started modal not found');
  }
}
