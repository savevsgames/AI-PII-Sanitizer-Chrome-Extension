/**
 * Authentication Modal Component
 * Handles Google Sign-In and Email/Password authentication
 * Firebase Auth integration
 */

import { auth } from '../../lib/firebase';
import {
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth';
import { useAppStore } from '../../lib/store';

let currentModal: HTMLElement | null = null;
let currentMode: 'signin' | 'signup' | 'reset' = 'signin';

/**
 * Initialize authentication modal
 */
export async function initAuthModal() {
  const modal = document.getElementById('authModal');
  if (!modal) {
    console.error('[Auth Modal] Modal not found');
    return;
  }

  currentModal = modal;

  // Check for redirect result from Google Sign-In
  await checkRedirectResult();

  // Modal close handlers
  const closeBtn = document.getElementById('authModalClose');
  const overlay = modal.querySelector('.modal-overlay');
  const cancelBtn = document.getElementById('authModalCancel');

  closeBtn?.addEventListener('click', closeAuthModal);
  overlay?.addEventListener('click', closeAuthModal);
  cancelBtn?.addEventListener('click', closeAuthModal);

  // Mode switchers
  const showSignInBtn = document.getElementById('showSignIn');
  const showSignUpBtn = document.getElementById('showSignUp');
  const showResetBtn = document.getElementById('showPasswordReset');
  const backToSignInBtn = document.getElementById('backToSignIn');

  showSignInBtn?.addEventListener('click', () => switchMode('signin'));
  showSignUpBtn?.addEventListener('click', () => switchMode('signup'));
  showResetBtn?.addEventListener('click', () => switchMode('reset'));
  backToSignInBtn?.addEventListener('click', () => switchMode('signin'));

  // Auth method buttons
  const googleSignInBtn = document.getElementById('googleSignInBtn');
  const googleSignUpBtn = document.getElementById('googleSignUpBtn');
  const emailSignInBtn = document.getElementById('emailSignInBtn');
  const emailSignUpBtn = document.getElementById('emailSignUpBtn');
  const sendResetEmailBtn = document.getElementById('sendResetEmailBtn');

  googleSignInBtn?.addEventListener('click', handleGoogleSignIn);
  googleSignUpBtn?.addEventListener('click', handleGoogleSignIn); // Same handler
  emailSignInBtn?.addEventListener('click', handleEmailSignIn);
  emailSignUpBtn?.addEventListener('click', handleEmailSignUp);
  sendResetEmailBtn?.addEventListener('click', handlePasswordReset);

  // Enter key submission
  const emailInput = document.getElementById('authEmail') as HTMLInputElement;
  const passwordInput = document.getElementById('authPassword') as HTMLInputElement;
  const resetEmailInput = document.getElementById('resetEmail') as HTMLInputElement;

  emailInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      if (currentMode === 'signin') handleEmailSignIn();
      else if (currentMode === 'signup') handleEmailSignUp();
    }
  });

  passwordInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      if (currentMode === 'signin') handleEmailSignIn();
      else if (currentMode === 'signup') handleEmailSignUp();
    }
  });

  resetEmailInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handlePasswordReset();
  });

  console.log('[Auth Modal] Initialized');
}

/**
 * Open authentication modal
 */
export function openAuthModal(mode: 'signin' | 'signup' = 'signin') {
  if (!currentModal) return;

  currentMode = mode;
  switchMode(mode);
  currentModal.classList.remove('hidden');
}

/**
 * Close authentication modal
 */
export function closeAuthModal() {
  console.log('[Auth] closeAuthModal() called');
  console.log('[Auth] currentModal exists:', !!currentModal);

  if (!currentModal) {
    console.error('[Auth] ERROR: currentModal is null!');
    return;
  }

  console.log('[Auth] Adding hidden class to modal...');
  currentModal.classList.add('hidden');
  console.log('[Auth] Modal hidden class added');

  console.log('[Auth] Clearing auth form...');
  clearAuthForm();
  console.log('[Auth] Clearing error messages...');
  clearErrorMessages();
  console.log('[Auth] Modal fully closed');
}

/**
 * Switch between signin/signup/reset modes
 */
function switchMode(mode: 'signin' | 'signup' | 'reset') {
  currentMode = mode;

  const signInView = document.getElementById('signInView');
  const signUpView = document.getElementById('signUpView');
  const resetView = document.getElementById('passwordResetView');
  const modalTitle = document.getElementById('authModalTitle');

  // Hide all views
  signInView?.classList.add('hidden');
  signUpView?.classList.add('hidden');
  resetView?.classList.add('hidden');

  // Show selected view
  if (mode === 'signin') {
    signInView?.classList.remove('hidden');
    if (modalTitle) modalTitle.textContent = 'Sign In';
  } else if (mode === 'signup') {
    signUpView?.classList.remove('hidden');
    if (modalTitle) modalTitle.textContent = 'Create Account';
  } else if (mode === 'reset') {
    resetView?.classList.remove('hidden');
    if (modalTitle) modalTitle.textContent = 'Reset Password';
  }

  clearAuthForm();
  clearErrorMessages();
}

/**
 * Handle Google Sign-In (uses Chrome Identity API + Firebase)
 */
async function handleGoogleSignIn() {
  const googleSignInBtn = document.getElementById('googleSignInBtn') as HTMLButtonElement;

  try {
    console.log('[Auth] Starting Google Sign-In with Chrome Identity API...');
    setLoading(googleSignInBtn, true, 'Signing in...');
    clearErrorMessages();

    // Use Chrome's Identity API to get OAuth token
    console.log('[Auth] Launching Chrome web auth flow...');

    const redirectURL = chrome.identity.getRedirectURL();
    console.log('[Auth] Redirect URL:', redirectURL);

    // OAuth Client ID from Google Cloud Console
    const clientId = '861822607891-l9ibauv7lhok7eejnml3t403mvhdgf4r.apps.googleusercontent.com';
    const scopes = ['email', 'profile'];

    const authUrl = `https://accounts.google.com/o/oauth2/auth?` +
      `client_id=${clientId}&` +
      `response_type=id_token&` +
      `redirect_uri=${encodeURIComponent(redirectURL)}&` +
      `scope=${encodeURIComponent(scopes.join(' '))}`;

    // Show helper message about popup
    setLoading(googleSignInBtn, true, 'Opening popup...');
    showInfo('googleSignInInfo', 'A popup window will open. Please select your Google account.');

    // Close the modal immediately - user will interact with OAuth popup
    console.log('[Auth] Closing modal before OAuth popup opens');
    setTimeout(() => {
      closeAuthModal();
    }, 200); // Small delay to let user see the info message

    const responseUrl = await new Promise<string>((resolve, reject) => {
      chrome.identity.launchWebAuthFlow(
        {
          url: authUrl,
          interactive: true
        },
        (redirectUrl) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else if (redirectUrl) {
            resolve(redirectUrl);
          } else {
            reject(new Error('No redirect URL received'));
          }
        }
      );
    });

    console.log('[Auth] OAuth completed, response URL received');

    // Extract ID token from redirect URL
    const url = new URL(responseUrl);
    const hash = url.hash.substring(1);
    const params = new URLSearchParams(hash);
    const idToken = params.get('id_token');

    if (!idToken) {
      throw new Error('No ID token in response');
    }

    console.log('[Auth] ID token received, signing into Firebase...');

    // Sign into Firebase with the ID token
    const { GoogleAuthProvider, signInWithCredential } = await import('firebase/auth');
    const { auth } = await import('../../lib/firebase');

    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);

    console.log('[Auth] Firebase sign-in successful:', result.user.uid);

    console.log('[Auth] Starting onAuthSuccess...');
    // Update account and sync to Firestore
    await onAuthSuccess(result.user);
    console.log('[Auth] onAuthSuccess completed');
    console.log('[Auth] Sign-in flow complete!');

  } catch (error: any) {
    console.error('[Auth] Google sign-in error:', error);
    console.error('[Auth] Error message:', error.message);

    // Re-open modal to show error
    openAuthModal('signin');
    showError('googleSignInError', getAuthErrorMessage(error));
    setLoading(googleSignInBtn, false, 'Continue with Google');
  }
}

/**
 * Handle Email/Password Sign-In
 */
async function handleEmailSignIn() {
  const emailInput = document.getElementById('authEmail') as HTMLInputElement;
  const passwordInput = document.getElementById('authPassword') as HTMLInputElement;
  const signInBtn = document.getElementById('emailSignInBtn') as HTMLButtonElement;

  const email = emailInput?.value.trim();
  const password = passwordInput?.value;

  if (!validateEmailForm(email, password)) return;

  try {
    setLoading(signInBtn, true, 'Signing in...');
    clearErrorMessages();

    const result = await signInWithEmailAndPassword(auth, email, password);

    console.log('[Auth] Email sign-in successful:', result.user.uid);

    await onAuthSuccess(result.user);

    closeAuthModal();
  } catch (error: any) {
    console.error('[Auth] Email sign-in error:', error);
    showError('emailSignInError', getAuthErrorMessage(error));
  } finally {
    setLoading(signInBtn, false, 'Sign In');
  }
}

/**
 * Handle Email/Password Sign-Up
 */
async function handleEmailSignUp() {
  const emailInput = document.getElementById('signUpEmail') as HTMLInputElement;
  const passwordInput = document.getElementById('signUpPassword') as HTMLInputElement;
  const confirmPasswordInput = document.getElementById('signUpConfirmPassword') as HTMLInputElement;
  const signUpBtn = document.getElementById('emailSignUpBtn') as HTMLButtonElement;

  const email = emailInput?.value.trim();
  const password = passwordInput?.value;
  const confirmPassword = confirmPasswordInput?.value;

  if (!validateSignUpForm(email, password, confirmPassword)) return;

  try {
    setLoading(signUpBtn, true, 'Creating account...');
    clearErrorMessages();

    const result = await createUserWithEmailAndPassword(auth, email, password);

    console.log('[Auth] Email sign-up successful:', result.user.uid);

    await onAuthSuccess(result.user);

    closeAuthModal();
  } catch (error: any) {
    console.error('[Auth] Email sign-up error:', error);
    showError('emailSignUpError', getAuthErrorMessage(error));
  } finally {
    setLoading(signUpBtn, false, 'Create Account');
  }
}

/**
 * Handle Password Reset
 */
async function handlePasswordReset() {
  const emailInput = document.getElementById('resetEmail') as HTMLInputElement;
  const resetBtn = document.getElementById('sendResetEmailBtn') as HTMLButtonElement;

  const email = emailInput?.value.trim();

  if (!email) {
    showError('resetEmailError', 'Please enter your email address');
    return;
  }

  if (!isValidEmail(email)) {
    showError('resetEmailError', 'Please enter a valid email address');
    return;
  }

  try {
    setLoading(resetBtn, true, 'Sending...');
    clearErrorMessages();

    await sendPasswordResetEmail(auth, email);

    console.log('[Auth] Password reset email sent to:', email);

    showSuccess('resetEmailSuccess', `Password reset email sent to ${email}. Check your inbox.`);

    // Switch back to sign-in after 3 seconds
    setTimeout(() => switchMode('signin'), 3000);
  } catch (error: any) {
    console.error('[Auth] Password reset error:', error);
    showError('resetEmailError', getAuthErrorMessage(error));
  } finally {
    setLoading(resetBtn, false, 'Send Reset Email');
  }
}

/**
 * Handle successful authentication
 */
async function onAuthSuccess(user: User) {
  const store = useAppStore.getState();

  // Update account in config with Firebase user info
  await store.updateAccount({
    email: user.email || undefined,
    firebaseUid: user.uid,
    displayName: user.displayName || undefined,
    photoURL: user.photoURL || undefined,
  });

  // Create/update user document in Firestore
  await store.syncUserToFirestore(user);

  console.log('[Auth] User authenticated and synced:', user.uid);
}

/**
 * Sign out current user
 */
export async function signOutUser() {
  try {
    await firebaseSignOut(auth);

    const store = useAppStore.getState();
    await store.clearAuthState();

    console.log('[Auth] User signed out successfully');
  } catch (error) {
    console.error('[Auth] Sign-out error:', error);
    throw error;
  }
}

/**
 * Validate email/password form
 */
function validateEmailForm(email: string, password: string): boolean {
  clearErrorMessages();

  if (!email) {
    showError('emailSignInError', 'Please enter your email address');
    return false;
  }

  if (!isValidEmail(email)) {
    showError('emailSignInError', 'Please enter a valid email address');
    return false;
  }

  if (!password) {
    showError('emailSignInError', 'Please enter your password');
    return false;
  }

  return true;
}

/**
 * Validate sign-up form
 */
function validateSignUpForm(email: string, password: string, confirmPassword: string): boolean {
  clearErrorMessages();

  if (!email) {
    showError('emailSignUpError', 'Please enter your email address');
    return false;
  }

  if (!isValidEmail(email)) {
    showError('emailSignUpError', 'Please enter a valid email address');
    return false;
  }

  if (!password) {
    showError('emailSignUpError', 'Please enter a password');
    return false;
  }

  if (password.length < 6) {
    showError('emailSignUpError', 'Password must be at least 6 characters');
    return false;
  }

  if (password !== confirmPassword) {
    showError('emailSignUpError', 'Passwords do not match');
    return false;
  }

  return true;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Show error message
 */
function showError(elementId: string, message: string) {
  const errorEl = document.getElementById(elementId);
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
  }
}

/**
 * Show success message
 */
function showSuccess(elementId: string, message: string) {
  const successEl = document.getElementById(elementId);
  if (successEl) {
    successEl.textContent = message;
    successEl.classList.remove('hidden');
  }
}

/**
 * Show info message
 */
function showInfo(elementId: string, message: string) {
  const infoEl = document.getElementById(elementId);
  if (infoEl) {
    infoEl.textContent = message;
    infoEl.classList.remove('hidden');
  }
}

/**
 * Clear all error/success messages
 */
function clearErrorMessages() {
  const errorElements = [
    'googleSignInError',
    'emailSignInError',
    'emailSignUpError',
    'resetEmailError',
    'resetEmailSuccess',
  ];

  errorElements.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = '';
      el.classList.add('hidden');
    }
  });
}

/**
 * Clear auth form inputs
 */
function clearAuthForm() {
  const inputs = [
    'authEmail',
    'authPassword',
    'signUpEmail',
    'signUpPassword',
    'signUpConfirmPassword',
    'resetEmail',
  ];

  inputs.forEach((id) => {
    const input = document.getElementById(id) as HTMLInputElement;
    if (input) input.value = '';
  });
}

/**
 * Set loading state on button
 */
function setLoading(button: HTMLButtonElement | null, loading: boolean, text?: string) {
  if (!button) return;

  button.disabled = loading;
  if (loading) {
    button.classList.add('loading');
    if (text) button.textContent = text;
  } else {
    button.classList.remove('loading');
    if (text) button.textContent = text;
  }
}

/**
 * Get user-friendly error message
 */
function getAuthErrorMessage(error: any): string {
  const code = error.code || '';

  const errorMessages: Record<string, string> = {
    'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
    'auth/invalid-email': 'Invalid email address format.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Try again or reset your password.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Check your internet connection.',
    'auth/popup-closed-by-user': 'Sign-in cancelled. Please try again.',
    'auth/cancelled-popup-request': 'Sign-in cancelled. Please try again.',
  };

  return errorMessages[code] || 'Authentication error. Please try again.';
}

/**
 * Check for redirect result after Google Sign-In
 */
async function checkRedirectResult() {
  try {
    console.log('[Auth] Checking for redirect result...');
    const result = await getRedirectResult(auth);

    if (result) {
      console.log('[Auth] Google sign-in successful via redirect:', result.user.uid);
      console.log('[Auth] User email:', result.user.email);

      // Update store with user info
      await onAuthSuccess(result.user);

      console.log('[Auth] User authenticated and synced');
    } else {
      console.log('[Auth] No redirect result found');
    }
  } catch (error: any) {
    console.error('[Auth] Redirect result error:', error);
    console.error('[Auth] Error code:', error.code);
    console.error('[Auth] Error message:', error.message);

    // Show error in modal if it's open
    if (currentModal && !currentModal.classList.contains('hidden')) {
      showError('googleSignInError', getAuthErrorMessage(error));
    }
  }
}
