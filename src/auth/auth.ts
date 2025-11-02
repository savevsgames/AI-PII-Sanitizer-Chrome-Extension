/**
 * Authentication Page Script
 * Handles Firebase OAuth redirect flow in a full page context
 * This page opens in a new tab to handle Google Sign-In
 */

import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
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
    const token = urlParams.get('token');

    if (success === 'true' && uid && token) {
      console.log('[Auth Page] Returned from promptblocker.com with UID:', uid);
      console.log('[Auth Page] Received ID token');

      showSuccess('Completing sign-in...');

      try {
        // Create credential from ID token
        const decodedToken = decodeURIComponent(token);
        const credential = GoogleAuthProvider.credential(decodedToken);

        // Sign in with the credential
        console.log('[Auth Page] Signing in with credential...');
        const result = await signInWithCredential(auth, credential);

        console.log('[Auth Page] Sign-in successful:', result.user.uid);
        console.log('[Auth Page] User email:', result.user.email);

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

      } catch (error: any) {
        console.error('[Auth Page] Credential sign-in error:', error);
        console.error('[Auth Page] Error code:', error.code);
        showError('Failed to complete sign-in. Please try again.');
      }

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
