/**
 * Authentication Page Script
 * Handles Firebase OAuth redirect flow in a full page context
 * This page opens in a new tab to handle Google Sign-In
 */

import { auth } from '../lib/firebase';
import { signInWithRedirect, getRedirectResult, GoogleAuthProvider } from 'firebase/auth';
import { syncUserToFirestore } from '../lib/firebaseService';

const statusEl = document.getElementById('status') as HTMLElement;
const statusTextEl = document.getElementById('statusText') as HTMLElement;
const messageEl = document.getElementById('message') as HTMLElement;
const closeInfoEl = document.getElementById('closeInfo') as HTMLElement;

async function handleAuth() {
  try {
    // Check if we're coming back from a redirect
    console.log('[Auth Page] Checking for redirect result...');
    const result = await getRedirectResult(auth);

    if (result) {
      // Successfully signed in
      console.log('[Auth Page] Sign-in successful:', result.user.uid);
      showSuccess(result.user.email || 'Unknown user');

      // Sync to Firestore
      await syncUserToFirestore(result.user);

      // Close this tab after a short delay
      setTimeout(() => {
        window.close();
      }, 2000);
    } else {
      // No redirect result, need to initiate sign-in
      console.log('[Auth Page] No redirect result, initiating sign-in...');

      // Get auth provider from session storage
      const { authProvider } = await chrome.storage.session.get('authProvider');

      if (authProvider === 'google') {
        const provider = new GoogleAuthProvider();
        console.log('[Auth Page] Starting Google Sign-In redirect...');

        // This will redirect the page to Google OAuth
        await signInWithRedirect(auth, provider);
      } else {
        showError('Unknown authentication provider');
      }
    }
  } catch (error: any) {
    console.error('[Auth Page] Error:', error);
    showError(error.message || 'Authentication failed');
  }
}

function showSuccess(email: string) {
  if (statusEl) {
    statusEl.innerHTML = '<div class="success">✓</div>';
  }
  if (statusTextEl) {
    statusTextEl.textContent = 'Sign-in successful!';
  }
  if (messageEl) {
    messageEl.textContent = `Signed in as ${email}`;
  }
  if (closeInfoEl) {
    closeInfoEl.textContent = 'This tab will close automatically...';
  }
}

function showError(message: string) {
  if (statusEl) {
    statusEl.innerHTML = '<div class="error">✗</div>';
  }
  if (statusTextEl) {
    statusTextEl.textContent = 'Sign-in failed';
  }
  if (messageEl) {
    messageEl.textContent = message;
  }
  if (closeInfoEl) {
    closeInfoEl.textContent = 'You can close this tab.';
  }
}

// Start authentication flow when page loads
handleAuth();
