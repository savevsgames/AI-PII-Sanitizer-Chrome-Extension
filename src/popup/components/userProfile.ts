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
  signInBtn?.addEventListener('click', () => openAuthModal('signin'));

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

  // Get Started button - opens promptblocker.com
  const getStartedBtn = document.getElementById('getStartedBtn');
  getStartedBtn?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://promptblocker.com' });
    console.log('[User Profile] Opening promptblocker.com');
  });

  // Account settings
  const accountSettingsBtn = document.getElementById('accountSettingsBtn');
  accountSettingsBtn?.addEventListener('click', () => {
    // TODO: Open account settings modal
    console.log('[User Profile] Account settings clicked');
  });

  // Sign-out button
  const signOutBtn = document.getElementById('signOutBtn');
  signOutBtn?.addEventListener('click', handleSignOut);

  console.log('[User Profile] Initialized');
}

/**
 * Handle user signed in
 */
async function onUserSignedIn(user: User) {
  console.log('[User Profile] User signed in:', user.uid);

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

    // Check if this is first sign-in (show welcome page)
    showWelcomePrompt();
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
 * Show welcome prompt after sign-in with link to promptblocker.com
 */
function showWelcomePrompt() {
  // Check if we've shown this before (don't spam on every sign-in)
  const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');

  if (hasSeenWelcome) return;

  // Show a friendly notification
  const showWelcomePage = confirm(
    '🎉 Welcome to PromptBlocker!\n\n' +
    'Visit our homepage to:\n' +
    '• Quick access to all supported AI platforms\n' +
    '• Learn more about protecting your privacy\n' +
    '• Explore PRO features\n\n' +
    'Open PromptBlocker.com now?'
  );

  if (showWelcomePage) {
    chrome.tabs.create({ url: 'https://promptblocker.com' });
  }

  // Mark as seen so we don't show again
  localStorage.setItem('hasSeenWelcome', 'true');
}
