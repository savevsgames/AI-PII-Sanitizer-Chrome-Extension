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

  // Load user's tier from Firestore
  const store = useAppStore.getState();
  await store.loadUserTier();

  // Update tier badge
  updateTierBadge();
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
  const userAvatar = document.getElementById('userAvatar');
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
  try {
    const confirmed = confirm('Are you sure you want to sign out?');
    if (!confirmed) return;

    await signOutUser();

    console.log('[User Profile] Signed out successfully');
  } catch (error) {
    console.error('[User Profile] Sign-out error:', error);
    alert('Error signing out. Please try again.');
  }
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
