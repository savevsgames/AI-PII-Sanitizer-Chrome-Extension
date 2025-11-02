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
  if (!currentModal) return;

  currentModal.classList.add('hidden');
  clearAuthForm();
  clearErrorMessages();
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
 * Handle Google Sign-In (opens auth.html in new tab)
 */
async function handleGoogleSignIn() {
  const googleSignInBtn = document.getElementById('googleSignInBtn') as HTMLButtonElement;

  try {
    console.log('[Auth] Starting Google Sign-In in new tab...');
    setLoading(googleSignInBtn, true, 'Opening sign-in...');
    clearErrorMessages();

    // Open extension's auth.html in new tab to handle redirect
    const authUrl = chrome.runtime.getURL('auth.html');
    console.log('[Auth] Opening auth page:', authUrl);

    // Store auth provider in session storage
    await chrome.storage.session.set({ authProvider: 'google' });

    // Open in new tab
    chrome.tabs.create({ url: authUrl });

    // Close the popup
    window.close();
  } catch (error: any) {
    console.error('[Auth] Google sign-in error:', error);
    console.error('[Auth] Error code:', error.code);
    console.error('[Auth] Error message:', error.message);
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
