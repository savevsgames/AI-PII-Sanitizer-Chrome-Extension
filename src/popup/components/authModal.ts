/**
 * Authentication Modal Component
 * Handles Google Sign-In and Email/Password authentication
 * Firebase Auth integration with multi-provider support
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
import { detectPlatform, getPlatformGuidance, getProviderErrorGuidance } from '../../lib/authProviders';
import { showAuthErrorModal } from './errorModal';

const DEBUG_MODE = false;

// Platform detection for better UX
const currentPlatform = detectPlatform();

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
  const githubSignInBtn = document.getElementById('githubSignInBtn');
  const githubSignUpBtn = document.getElementById('githubSignUpBtn');
  const emailSignInBtn = document.getElementById('emailSignInBtn');
  const emailSignUpBtn = document.getElementById('emailSignUpBtn');
  const sendResetEmailBtn = document.getElementById('sendResetEmailBtn');

  googleSignInBtn?.addEventListener('click', handleGoogleSignIn);
  googleSignUpBtn?.addEventListener('click', handleGoogleSignIn); // Same handler
  githubSignInBtn?.addEventListener('click', handleGitHubSignIn);
  githubSignUpBtn?.addEventListener('click', handleGitHubSignIn); // Same handler
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

  // Show platform-specific guidance
  showPlatformGuidance();

  console.log('[Auth Modal] Initialized for platform:', currentPlatform);
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

    if (DEBUG_MODE) {
      console.log('[Auth] Firebase sign-in successful:', result.user.uid);
    }

    console.log('[Auth] Starting onAuthSuccess...');
    // Update account and sync to Firestore
    await onAuthSuccess(result.user);
    console.log('[Auth] onAuthSuccess completed');
    console.log('[Auth] Sign-in flow complete!');

  } catch (error: any) {
    console.error('[Auth] Google sign-in error:', error);
    console.error('[Auth] Error message:', error.message);

    setLoading(googleSignInBtn, false, 'Continue with Google');

    // Detect error type
    let errorCode: string | undefined;
    if (error.message?.includes('popup')) {
      errorCode = 'popup-blocked';
    } else if (error.message?.includes('cancelled') || error.message?.includes('closed')) {
      errorCode = 'popup-closed-by-user';
    }

    // Get provider-specific error guidance
    const guidance = getProviderErrorGuidance('google', errorCode);

    // Show professional error modal with fallback option
    showAuthErrorModal(
      guidance.title,
      guidance.message,
      guidance.showEmailFallback ? switchToEmailPasswordMode : undefined
    );
  }
}

/**
 * Handle GitHub Sign-In (uses Chrome Identity API + Firebase)
 * Same pattern as Google Sign-In to avoid CSP issues
 */
async function handleGitHubSignIn() {
  const githubSignInBtn = (document.getElementById('githubSignInBtn') || document.getElementById('githubSignUpBtn')) as HTMLButtonElement;
  if (!githubSignInBtn) return;

  try {
    console.log('[Auth] Starting GitHub Sign-In with Chrome Identity API...');
    setLoading(githubSignInBtn, true, 'Signing in...');
    clearErrorMessages();

    // Use Chrome's Identity API to get OAuth token
    console.log('[Auth] Launching GitHub OAuth flow...');

    const redirectURL = chrome.identity.getRedirectURL();

    // GitHub OAuth App credentials (from GitHub Developer Settings)
    // TODO: Replace with your actual GitHub OAuth App Client ID
    const githubClientId = 'Ov23li8pSP8uzrl6DN7A'; // Your GitHub OAuth App Client ID
    const scopes = ['user:email', 'read:user'];

    const authUrl = `https://github.com/login/oauth/authorize?` +
      `client_id=${githubClientId}&` +
      `redirect_uri=${encodeURIComponent(redirectURL)}&` +
      `scope=${encodeURIComponent(scopes.join(' '))}`;

    // Show helper message about popup
    setLoading(githubSignInBtn, true, 'Opening popup...');
    showInfo('githubSignInInfo', 'A popup window will open. Please authorize with GitHub.');

    // Close the modal immediately - user will interact with OAuth popup
    console.log('[Auth] Closing modal before OAuth popup opens');
    setTimeout(() => {
      closeAuthModal();
    }, 200);

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

    console.log('[Auth] GitHub OAuth completed, response URL received');

    // Extract authorization code from redirect URL
    const url = new URL(responseUrl);
    const code = url.searchParams.get('code');

    if (!code) {
      throw new Error('No authorization code in response');
    }

    console.log('[Auth] Authorization code received, calling Cloud Function...');

    // Call Cloud Function to exchange code for Firebase custom token
    const { getFunctions, httpsCallable } = await import('firebase/functions');
    const functions = getFunctions();
    const githubAuth = httpsCallable(functions, 'githubAuth');

    const result = await githubAuth({ code });
    const { token } = result.data as { token: string; user: any };

    console.log('[Auth] Custom token received, signing into Firebase...');

    // Sign in with custom token
    const { signInWithCustomToken } = await import('firebase/auth');
    const { auth } = await import('../../lib/firebase');

    const firebaseResult = await signInWithCustomToken(auth, token);

    if (DEBUG_MODE) {
      console.log('[Auth] GitHub sign-in successful:', firebaseResult.user.uid);
    }

    console.log('[Auth] Starting onAuthSuccess...');
    await onAuthSuccess(firebaseResult.user);
    console.log('[Auth] onAuthSuccess completed');
    console.log('[Auth] GitHub sign-in flow complete!');

  } catch (error: any) {
    console.error('[Auth] GitHub sign-in error:', error);
    console.error('[Auth] Error message:', error.message);

    setLoading(githubSignInBtn, false, 'Continue with GitHub');

    // Detect error type
    let errorCode: string | undefined;
    if (error.message?.includes('popup')) {
      errorCode = 'popup-blocked';
    } else if (
      error.message?.includes('cancelled') ||
      error.message?.includes('closed') ||
      error.message?.includes('did not approve') ||
      error.message?.includes('user denied')
    ) {
      errorCode = 'popup-closed-by-user';
    }

    // Get provider-specific error guidance
    const guidance = getProviderErrorGuidance('github', errorCode);

    // Show professional error modal with fallback option
    showAuthErrorModal(
      guidance.title,
      guidance.message,
      guidance.showEmailFallback ? switchToEmailPasswordMode : undefined
    );
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

    if (DEBUG_MODE) {
      console.log('[Auth] Email sign-in successful:', result.user.uid);
    }

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

    if (DEBUG_MODE) {
      console.log('[Auth] Email sign-up successful:', result.user.uid);
    }

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

    if (DEBUG_MODE) {
      console.log('[Auth] Password reset email sent to:', email);
    }

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

  // Detect provider from UID format
  let provider: 'google' | 'github' | 'microsoft' | 'email' = 'email';
  if (user.uid.startsWith('google:')) {
    provider = 'google';
  } else if (user.uid.startsWith('github:')) {
    provider = 'github';
  } else if (user.uid.startsWith('microsoft:')) {
    provider = 'microsoft';
  }

  // Check if this is first-time encryption (no encryptionProvider set)
  const currentConfig = store.config;
  const isFirstEncryption = !currentConfig?.account?.encryptionProvider;

  if (isFirstEncryption) {
    console.log(`[Auth] 🔐 First-time encryption - tracking provider: ${provider}`);
  }

  // Update account in config with Firebase user info
  await store.updateAccount({
    email: user.email || undefined,
    firebaseUid: user.uid,
    displayName: user.displayName || undefined,
    photoURL: user.photoURL || undefined,
    // Track encryption provider on first sign-in
    encryptionProvider: isFirstEncryption ? provider : (currentConfig?.account?.encryptionProvider || provider),
    encryptionEmail: isFirstEncryption ? (user.email || undefined) : currentConfig?.account?.encryptionEmail,
  });

  // Create/update user document in Firestore
  await store.syncUserToFirestore(user);

  if (DEBUG_MODE) {
    console.log('[Auth] User authenticated and synced:', user.uid);
    console.log('[Auth] Encryption provider:', provider);
  }
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
      if (DEBUG_MODE) {
        console.log('[Auth] Google sign-in successful via redirect:', result.user.uid);
        console.log('[Auth] User email:', result.user.email);
      }

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

/**
 * Show platform-specific guidance
 */
function showPlatformGuidance() {
  const guidance = getPlatformGuidance(currentPlatform);
  if (!guidance) return;

  // Show guidance message in the auth modal
  const signInView = document.getElementById('authSignInView');
  if (!signInView) return;

  // Check if guidance already exists
  if (document.getElementById('platformGuidance')) return;

  // Create guidance element
  const guidanceEl = document.createElement('div');
  guidanceEl.id = 'platformGuidance';
  guidanceEl.className = 'platform-guidance';
  guidanceEl.innerHTML = `
    <div class="info-message">
      <span class="info-icon">ℹ️</span>
      <span class="info-text">${guidance}</span>
    </div>
  `;

  // Insert at the top of sign-in view
  signInView.insertBefore(guidanceEl, signInView.firstChild);
}

/**
 * Switch to email/password mode (fallback for auth errors)
 */
function switchToEmailPasswordMode() {
  // Open modal in sign-in mode
  openAuthModal('signin');

  // Hide Google button, show email/password form
  const googleBtn = document.getElementById('googleSignInBtn');
  const emailForm = document.querySelectorAll('.email-password-section');

  if (googleBtn) {
    googleBtn.style.display = 'none';
  }

  emailForm.forEach(form => {
    (form as HTMLElement).style.display = 'block';
  });

  // Focus email input
  const emailInput = document.getElementById('authEmail') as HTMLInputElement;
  setTimeout(() => emailInput?.focus(), 100);

  console.log('[Auth] Switched to email/password mode');
}
