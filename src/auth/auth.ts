/**
 * Authentication Page Script
 * Handles Firebase OAuth redirect flow in a full page context
 * This page opens in a new tab to handle Google Sign-In
 */

import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { syncUserToFirestore } from '../lib/firebaseService';

const DEBUG_MODE = false;

const statusEl = document.getElementById('status') as HTMLElement;
const statusTextEl = document.getElementById('statusText') as HTMLElement;
const messageEl = document.getElementById('message') as HTMLElement;
const closeInfoEl = document.getElementById('closeInfo') as HTMLElement;

async function handleAuth() {
  try {
    console.log('==========================================');
    console.log('[Auth Page] EXTENSION AUTH PAGE LOADED');
    console.log('[Auth Page] Current URL:', window.location.href);
    console.log('==========================================');

    // Check if we're coming back from a redirect
    console.log('[Auth Page] Checking for redirect result...');
    const result = await getRedirectResult(auth);

    if (result) {
      // Successfully signed in - returning from Google OAuth
      console.log('[Auth Page] ✅ Sign-in successful!');
      if (DEBUG_MODE) {
        console.log('[Auth Page] User UID:', result.user.uid);
        console.log('[Auth Page] User email:', result.user.email);
        console.log('[Auth Page] User displayName:', result.user.displayName);
      }

      showSuccess(result.user.email || 'Unknown user');

      // Sync to Firestore
      console.log('[Auth Page] Syncing to Firestore...');
      await syncUserToFirestore(result.user);
      console.log('[Auth Page] Sync complete');

      // Close this tab after a short delay
      setTimeout(() => {
        console.log('[Auth Page] Closing tab...');
        window.close();
      }, 2000);

    } else {
      // No redirect result, need to initiate sign-in
      console.log('[Auth Page] No redirect result, checking session storage...');

      const { authProvider } = await chrome.storage.session.get('authProvider');
      console.log('[Auth Page] Auth provider:', authProvider);

      if (authProvider === 'google') {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
          prompt: 'select_account'
        });

        console.log('[Auth Page] Starting Google Sign-In redirect...');
        await signInWithRedirect(auth, provider);
      } else {
        console.error('[Auth Page] Unknown provider:', authProvider);
        showError('Unknown authentication provider');
      }
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
