/**
 * User Profile Display Component
 * Shows authenticated user info in header
 * Handles sign-out and account management
 */

import { auth } from '../../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useAppStore } from '../../lib/store';
import { openAuthModal, signOutUser } from './authModal';

let currentUser: User | null = null;
let onboardingCheckInProgress = false; // Prevent duplicate checks

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

  // Listen for profile changes to re-check onboarding
  window.addEventListener('profilesUpdated', async () => {
    if (currentUser) {
      // Add delay to allow store to update
      setTimeout(async () => {
        await checkAndShowOnboarding(currentUser!);
      }, 300);
    }
  });

  // Set up onboarding button handlers (one-time setup)
  const quickStartBtn = document.getElementById('onboardingQuickStart');
  const customBtn = document.getElementById('onboardingCustom');

  quickStartBtn?.addEventListener('click', () => {
    if (currentUser) handleQuickStartOnboarding(currentUser);
  });

  customBtn?.addEventListener('click', () => {
    handleCustomOnboarding();
  });

  // Sign-in button
  const signInBtn = document.getElementById('headerSignInBtn');
  signInBtn?.addEventListener('click', () => {
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

  userMenuBtn?.addEventListener('click', () => {
    userDropdown?.classList.toggle('hidden');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!userMenuBtn?.contains(e.target as Node) && !userDropdown?.contains(e.target as Node)) {
      userDropdown?.classList.add('hidden');
    }
  });

  // Helper function to close dropdown
  const closeDropdown = () => {
    userDropdown?.classList.add('hidden');
  };

  // Get Started button - opens promptblocker.com
  const getStartedBtn = document.getElementById('getStartedBtn');
  getStartedBtn?.addEventListener('click', () => {
    closeDropdown();
    chrome.tabs.create({ url: 'https://promptblocker.com' });
    console.log('[User Profile] Opening promptblocker.com');
  });

  // Account settings
  const accountSettingsBtn = document.getElementById('accountSettingsBtn');
  accountSettingsBtn?.addEventListener('click', () => {
    closeDropdown();
    // TODO: Open account settings modal
    console.log('[User Profile] Account settings clicked');
  });

  // Manage billing
  const manageBillingBtn = document.getElementById('manageBillingBtn');
  manageBillingBtn?.addEventListener('click', () => {
    closeDropdown();
    // TODO: Open billing management
    console.log('[User Profile] Manage billing clicked');
  });

  // Sign-out button
  const signOutBtn = document.getElementById('signOutBtn');
  signOutBtn?.addEventListener('click', () => {
    closeDropdown();
    handleSignOut();
  });

  console.log('[User Profile] Initialized');
}

/**
 * Handle user signed in
 */
async function onUserSignedIn(user: User) {
  console.log('[User Profile] User signed in:', user.uid);
  console.log('[User Profile] Full user object:', {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
    providerId: user.providerId
  });

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

    // Check if user needs onboarding (no active profiles)
    await checkAndShowOnboarding(user);
  } catch (error) {
    console.error('[User Profile] Error syncing user:', error);
  }
}

/**
 * Handle user signed out
 */
function onUserSignedOut() {
  console.log('[User Profile] User signed out');

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
    // Fallback to confirm dialog if modal not found
    const confirmed = confirm('Are you sure you want to sign out?');
    if (!confirmed) return;

    try {
      await signOutUser();
      console.log('[User Profile] Signed out successfully');
    } catch (error) {
      console.error('[User Profile] Sign-out error:', error);
      alert('Error signing out. Please try again.');
    }
    return;
  }

  // Show modal
  modal.classList.remove('hidden');

  // Set up modal handlers (one-time setup)
  const closeBtn = document.getElementById('signOutModalClose');
  const cancelBtn = document.getElementById('signOutCancel');
  const confirmBtn = document.getElementById('signOutConfirm');
  const overlay = modal.querySelector('.modal-overlay');

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
      alert('Error signing out. Please try again.');
    }
  };

  // Add event listeners
  closeBtn?.addEventListener('click', closeModal, { once: true });
  cancelBtn?.addEventListener('click', closeModal, { once: true });
  confirmBtn?.addEventListener('click', handleConfirm, { once: true });
  overlay?.addEventListener('click', closeModal, { once: true });
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
 * Check if user needs onboarding and show modal if needed
 * Onboarding is required until user has at least one active profile
 */
async function checkAndShowOnboarding(user: User) {
  // Prevent duplicate checks
  if (onboardingCheckInProgress) {
    console.log('[User Profile] Onboarding check already in progress, skipping');
    return;
  }

  onboardingCheckInProgress = true;

  try {
    // Check if user has already completed onboarding (persisted in chrome.storage)
    const result = await chrome.storage.local.get('onboardingCompleted');
    if (result.onboardingCompleted) {
      console.log('[User Profile] Onboarding already completed (from storage), skipping');
      onboardingCheckInProgress = false;
      return;
    }

    const store = useAppStore.getState();
    const profiles = store.config?.profiles || [];
    const activeProfiles = profiles.filter(p => p.enabled);

    console.log('[User Profile] Checking onboarding...', {
      totalProfiles: profiles.length,
      activeProfiles: activeProfiles.length
    });

    // If user has at least one active profile, mark onboarding as complete
    if (activeProfiles.length > 0) {
      console.log('[User Profile] User has active profiles, marking onboarding complete');
      await chrome.storage.local.set({ onboardingCompleted: true });
      // Hide modal if it's currently showing
      const modal = document.getElementById('onboardingModal');
      modal?.classList.add('hidden');
      onboardingCheckInProgress = false;
      return;
    }

    // Show onboarding modal (doesn't go away until they create a profile)
    console.log('[User Profile] No active profiles - showing onboarding');
    showOnboardingModal(user);
    onboardingCheckInProgress = false;
  } catch (error) {
    console.error('[User Profile] Error checking onboarding:', error);
    onboardingCheckInProgress = false;
  }
}

/**
 * Show onboarding modal with Google info pre-fill option
 */
function showOnboardingModal(user: User) {
  const modal = document.getElementById('onboardingModal');
  if (!modal) {
    console.error('[User Profile] Onboarding modal not found');
    return;
  }

  // Show modal immediately with loading state
  modal.classList.remove('hidden');

  // Show loading state initially
  const loadingState = document.getElementById('onboardingLoadingState');
  const loadedState = document.getElementById('onboardingLoadedState');
  const quickStartBtn = document.getElementById('onboardingQuickStart') as HTMLButtonElement;
  const customBtn = document.getElementById('onboardingCustom') as HTMLButtonElement;

  if (loadingState) loadingState.classList.remove('hidden');
  if (loadedState) loadedState.classList.add('hidden');

  // Disable buttons while loading
  if (quickStartBtn) quickStartBtn.disabled = true;
  if (customBtn) customBtn.disabled = true;

  // Simulate loading delay, then show user info
  setTimeout(() => {
    // Pre-fill Google user info in modal
    const userName = document.getElementById('onboardingUserName');
    const userEmail = document.getElementById('onboardingUserEmail');

    if (userName) userName.textContent = user.displayName || user.email?.split('@')[0] || 'User';
    if (userEmail) userEmail.textContent = user.email || '';

    // Switch to loaded state
    if (loadingState) loadingState.classList.add('hidden');
    if (loadedState) loadedState.classList.remove('hidden');

    // Enable buttons
    if (quickStartBtn) {
      quickStartBtn.disabled = false;
      // Update button text to indicate ready state
      const buttonSpan = quickStartBtn.querySelector('span:last-child');
      if (buttonSpan) buttonSpan.textContent = 'Continue with Google Info';
    }
    if (customBtn) customBtn.disabled = false;

    console.log('[User Profile] User info loaded, onboarding ready');
  }, 100); // Small delay to show spinner briefly

  console.log('[User Profile] Onboarding modal displayed');
}

/**
 * Handle Quick Start onboarding - pre-fill with Google account info
 */
function handleQuickStartOnboarding(user: User) {
  console.log('[User Profile] Quick start onboarding selected');

  // Hide onboarding modal immediately
  const onboardingModal = document.getElementById('onboardingModal');
  onboardingModal?.classList.add('hidden');

  // Show loading state in onboarding modal buttons (for if user cancels and comes back)
  const quickStartBtn = document.getElementById('onboardingQuickStart') as HTMLButtonElement;
  const customBtn = document.getElementById('onboardingCustom') as HTMLButtonElement;

  if (quickStartBtn) {
    quickStartBtn.disabled = true;
    quickStartBtn.classList.add('loading');
    quickStartBtn.textContent = 'Loading...';
  }

  if (customBtn) {
    customBtn.disabled = true;
    customBtn.style.opacity = '0.5';
  }

  // Open profile modal with pre-filled Google info
  const addProfileBtn = document.getElementById('addProfileBtn');
  if (!addProfileBtn) {
    console.error('[User Profile] Add profile button not found');

    // Reset buttons on error
    if (quickStartBtn) {
      quickStartBtn.disabled = false;
      quickStartBtn.classList.remove('loading');
      quickStartBtn.textContent = '⚡ Use My Google Info (Quick Start)';
    }
    if (customBtn) {
      customBtn.disabled = false;
      customBtn.style.opacity = '1';
    }
    return;
  }

  // Trigger the add profile modal
  addProfileBtn.click();

  // Pre-fill the form with Google account info AND branded fake alias data
  // Use longer delay to ensure modal is fully rendered
  setTimeout(() => {
    console.log('[User Profile] Starting auto-fill...');
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
        console.log('[User Profile] 📧 Extracted name from email:', name);
      }

      if (name) {
        realNameInput.value = name;
        realNameInput.dispatchEvent(new Event('input', { bubbles: true }));
        console.log('[User Profile] ✅ Set real name to:', name);
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
        console.log('[User Profile] ✅ Set real email to:', user.email);
      }
    } else {
      console.error('[User Profile] ❌ realEmailInput not found');
    }

    // Pre-fill ALIAS information with branded fake data
    if (aliasNameInput) {
      aliasNameInput.value = 'Alias Personname';
      aliasNameInput.dispatchEvent(new Event('input', { bubbles: true }));
      console.log('[User Profile] ✅ Set alias name');
    } else {
      console.error('[User Profile] ❌ aliasNameInput not found');
    }

    if (aliasEmailInput) {
      aliasEmailInput.value = 'blocked-email@promptblocker.com';
      aliasEmailInput.dispatchEvent(new Event('input', { bubbles: true }));
      console.log('[User Profile] ✅ Set alias email');
    } else {
      console.error('[User Profile] ❌ aliasEmailInput not found');
    }

    if (aliasPhoneInput) {
      aliasPhoneInput.value = '(555) 555-5555';
      aliasPhoneInput.dispatchEvent(new Event('input', { bubbles: true }));
      console.log('[User Profile] ✅ Set alias phone');
    } else {
      console.error('[User Profile] ❌ aliasPhoneInput not found');
    }

    if (aliasAddressInput) {
      aliasAddressInput.value = '123 Address St, Sometown, STATE, USA';
      aliasAddressInput.dispatchEvent(new Event('input', { bubbles: true }));
      console.log('[User Profile] ✅ Set alias address');
    } else {
      console.error('[User Profile] ❌ aliasAddressInput not found');
    }

    console.log('[User Profile] Auto-fill complete');
  }, 500); // Longer delay to ensure modal is fully rendered
}

/**
 * Handle Custom onboarding - open empty profile editor
 */
function handleCustomOnboarding() {
  console.log('[User Profile] Custom onboarding selected');

  // Show loading state
  const customBtn = document.getElementById('onboardingCustom') as HTMLButtonElement;
  const quickStartBtn = document.getElementById('onboardingQuickStart') as HTMLButtonElement;

  if (customBtn) {
    customBtn.disabled = true;
    customBtn.classList.add('loading');
    customBtn.textContent = 'Loading...';
  }

  if (quickStartBtn) {
    quickStartBtn.disabled = true;
    quickStartBtn.style.opacity = '0.5';
  }

  // Open profile modal (empty)
  const addProfileBtn = document.getElementById('addProfileBtn');
  addProfileBtn?.click();

  // Keep onboarding modal visible with loading state
  // It will be hidden by checkAndShowOnboarding once profile is saved
}

/**
 * Reset onboarding modal button states (called when profile modal is closed without saving)
 */
export function resetOnboardingButtons() {
  const quickStartBtn = document.getElementById('onboardingQuickStart') as HTMLButtonElement;
  const customBtn = document.getElementById('onboardingCustom') as HTMLButtonElement;

  if (quickStartBtn) {
    quickStartBtn.disabled = false;
    quickStartBtn.classList.remove('loading');
    quickStartBtn.textContent = '⚡ Use My Google Info (Quick Start)';
    quickStartBtn.style.opacity = '1';
  }

  if (customBtn) {
    customBtn.disabled = false;
    customBtn.classList.remove('loading');
    customBtn.textContent = '✏️ Create Custom Profile';
    customBtn.style.opacity = '1';
  }

  console.log('[User Profile] Onboarding buttons reset');
}
