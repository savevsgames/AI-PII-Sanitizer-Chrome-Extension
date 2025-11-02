/**
 * Authentication Page Script
 * Handles Firebase OAuth redirect flow in a full page context
 * This page opens in a new tab to handle Google Sign-In
 */

import { auth } from '../lib/firebase';
import { syncUserToFirestore } from '../lib/firebaseService';

const statusEl = document.getElementById('status') as HTMLElement;
const statusTextEl = document.getElementById('statusText') as HTMLElement;
const messageEl = document.getElementById('message') as HTMLElement;
const closeInfoEl = document.getElementById('closeInfo') as HTMLElement;

async function handleAuth() {
  try {
    console.log('[Auth Page] Checking authentication status...');
    console.log('[Auth Page] Current URL:', window.location.href);

    // Check if we're returning from promptblocker.com with success
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const uid = urlParams.get('uid');

    if (success === 'true' && uid) {
      console.log('[Auth Page] Returned from promptblocker.com with UID:', uid);

      // Wait for auth state to update
      showSuccess('Completing sign-in...');

      // Listen for auth state change
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          console.log('[Auth Page] Auth state updated:', user.uid);
          console.log('[Auth Page] User email:', user.email);

          showSuccess(user.email || 'Unknown user');

          // Sync to Firestore
          console.log('[Auth Page] Syncing to Firestore...');
          await syncUserToFirestore(user);
          console.log('[Auth Page] Sync complete');

          // Clean up listener
          unsubscribe();

          // Close this tab after a short delay
          setTimeout(() => {
            console.log('[Auth Page] Closing tab...');
            window.close();
          }, 2000);
        }
      });

      // If auth state doesn't update within 5 seconds, show error
      setTimeout(() => {
        unsubscribe();
        showError('Authentication timeout. Please try signing in again.');
      }, 5000);

    } else {
      // This page shouldn't be accessed directly
      showError('Invalid authentication request. Please use the extension popup to sign in.');
    }
  } catch (error: any) {
    console.error('[Auth Page] Error:', error);
    console.error('[Auth Page] Error code:', error.code);
    console.error('[Auth Page] Error message:', error.message);
    showError(error.message || 'Authentication failed. Please try again.');
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
