/**
 * Popup UI Script - V2 (Refactored)
 * Main entry point for tabbed extension popup
 * Components extracted for better organization
 */

import { useAppStore } from '../lib/store';
import { initProfileModal } from './components/profileModal';
import { renderProfiles } from './components/profileRenderer';
import { renderStats } from './components/statsRenderer';
import { initActivityLog, renderActivityLog } from './components/activityLog';
import { initSettingsHandlers, updateSettingsUI, updateThemeUI } from './components/settingsHandlers';
import { initMinimalMode, loadModePreference, updateMinimalView } from './components/minimalMode';
import { initPageStatus } from './components/pageStatus';
import { initFeaturesTab, renderFeaturesHub } from './components/featuresTab';
import { initAPIKeyModal } from './components/apiKeyModal';
import { initAuthModal } from './components/authModal';
import { initUserProfile } from './components/userProfile';
import { initTabNavigation, initKeyboardShortcuts, initTheme } from './init/initUI';
import { updateStatusIndicator } from './components/statusIndicator';
import { initializeBackgroundOnLoad } from './components/backgroundManager';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { SOCIAL_LINKS } from '../config/constants';
// import { testFirebaseConnection } from './test-firebase-popup'; // Disabled - interferes with auth

// ========== DEBUG: Expose sign out globally for console access ==========
(window as any).debugSignOut = async () => {
  await signOut(auth);
  console.log('✅ Signed out successfully!');
  window.location.reload();
};
console.log('[Debug] To sign out, run: debugSignOut()');

// ========== AUTH ISSUE BANNER ==========
/**
 * Show auth issue banner when decryption fails
 * Uses delayed display to avoid flashing during normal sign-in flow
 */
function setupAuthIssueBanner() {
  const banner = document.getElementById('authIssueBanner');
  const bannerText = document.getElementById('authIssueBannerText');
  const resetRetryBtn = document.getElementById('resetAndRetrySignInBtn');

  if (!banner || !bannerText || !resetRetryBtn) return;

  // Store the encryption provider for the retry flow
  let detectedProvider: string | undefined;
  let bannerTimeout: number | undefined;

  // Listen for decryption failure event
  window.addEventListener('auth-decryption-failed', () => {
    const config = useAppStore.getState().config;
    const encryptionProvider = config?.account?.encryptionProvider;
    const encryptionEmail = config?.account?.encryptionEmail;

    // Store for retry button
    detectedProvider = encryptionProvider;

    // Update banner text with helpful message
    if (encryptionProvider && encryptionEmail) {
      bannerText.textContent = `Your data was encrypted with ${encryptionProvider === 'google' ? 'Google' : encryptionProvider === 'github' ? 'GitHub' : encryptionProvider} sign-in (${encryptionEmail}). Please use that provider to unlock your data.`;
    } else if (encryptionProvider) {
      bannerText.textContent = `Your data was encrypted with ${encryptionProvider === 'google' ? 'Google' : encryptionProvider === 'github' ? 'GitHub' : encryptionProvider} sign-in. Please use that provider to unlock your data.`;
    } else {
      bannerText.textContent = 'Sign in with the original provider to unlock your encrypted data.';
    }

    // Clear any existing timeout
    if (bannerTimeout) {
      clearTimeout(bannerTimeout);
    }

    // Delay showing banner by 2 seconds
    // This prevents flash during normal async sign-in flow
    console.log('[Auth Banner] Decryption failed - waiting 2s before showing banner...');
    bannerTimeout = window.setTimeout(() => {
      // Only show if still in failed state (user hasn't signed in successfully)
      if (auth.currentUser) {
        console.log('[Auth Banner] User authenticated during delay - banner cancelled');
        return;
      }

      banner.classList.remove('hidden');
      console.log('[Auth Banner] ⚠️ Showing decryption failure banner');
    }, 2000);
  });

  // Listen for successful auth to cancel pending banner
  auth.onAuthStateChanged((user) => {
    if (user && bannerTimeout) {
      console.log('[Auth Banner] Auth successful - cancelling pending banner');
      clearTimeout(bannerTimeout);
      bannerTimeout = undefined;

      // Also hide banner if it's already showing
      if (!banner.classList.contains('hidden')) {
        console.log('[Auth Banner] Hiding banner after successful auth');
        banner.classList.add('hidden');
      }
    }
  });

  // Handle "Reset & Try Again" button - FULL RESET FLOW
  resetRetryBtn.addEventListener('click', async () => {
    try {
      console.log('[Auth Banner] Starting reset & retry flow...');

      // Step 1: Sign out current user (clear broken auth state)
      await signOut(auth);
      console.log('[Auth Banner] ✅ Signed out current user');

      // Step 2: Hide the banner
      banner.classList.add('hidden');

      // Step 3: Wait a moment for auth state to clear
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 4: Open auth modal with helpful message
      const { openAuthModal } = await import('./components/authModal');

      // Show modal in sign-in mode
      openAuthModal('signin');
      console.log('[Auth Banner] ✅ Opened auth modal for retry');

      // Step 5: Show notification about which provider to use
      if (detectedProvider) {
        const providerName = detectedProvider === 'google' ? 'Google' :
                           detectedProvider === 'github' ? 'GitHub' :
                           detectedProvider === 'microsoft' ? 'Microsoft' :
                           'Email/Password';

        setTimeout(async () => {
          const { showInfo } = await import('./utils/modalUtils');
          showInfo(`💡 Tip: Use ${providerName} sign-in to access your encrypted data.`);
        }, 500);
      }

      console.log('[Auth Banner] Reset & retry flow complete');

    } catch (error) {
      console.error('[Auth Banner] Failed to reset:', error);

      // Fallback: Just reload the page to clear everything
      console.log('[Auth Banner] Falling back to page reload...');
      window.location.reload();
    }
  });
}

// ========== FIREBASE AUTH STATE MANAGEMENT ==========

/**
 * Handle Firebase authentication state changes
 * Reloads encrypted data when user signs in
 */
function setupAuthStateListener() {
  auth.onAuthStateChanged(async (user) => {
    console.log('[Auth State] Firebase auth state changed:', user ? `Signed in as ${user.email}` : 'Signed out');

    if (user) {
      // User signed in - reload encrypted data
      try {
        // Reload data now that we have Firebase UID for decryption
        const store = useAppStore.getState();
        await store.initialize();

        // Re-render UI with decrypted data
        const state = useAppStore.getState();
        renderProfiles(state.profiles);
        renderStats(state.config, state.profiles);
        renderActivityLog(state.activityLog);
        updateSettingsUI(state.config);
        updateStatusIndicator(state.config);
        if (state.config) {
          renderFeaturesHub(state.config);
        }

        console.log('[Auth State] ✅ Data reloaded with Firebase UID encryption');

      } catch (error) {
        console.error('[Auth State] Failed to reload data after sign in:', error);
      }
    } else {
      // User signed out - just log it, don't lock UI
      console.log('[Auth State] User signed out - encrypted data unavailable until sign-in');
    }
  });

  console.log('[Auth State] Firebase auth state listener initialized');
}

// ========== INITIALIZATION ==========

/**
 * Wait for Firebase auth to initialize and restore session
 * Firebase auth.currentUser is null initially, even if user is signed in
 */
async function waitForAuthInit(): Promise<void> {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged(() => {
      unsubscribe(); // Unsubscribe after first call
      resolve();
    });
  });
}

/**
 * Initialize social links dynamically from constants
 */
function initializeSocialLinks() {
  const container = document.getElementById('socialLinksContainer');
  if (!container) {
    console.warn('[Social Links] Container not found');
    return;
  }

  // Clear any existing content
  container.innerHTML = '';

  // Create link for each social platform
  Object.entries(SOCIAL_LINKS).forEach(([platform, config]) => {
    const link = document.createElement('a');
    link.href = config.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'social-link';
    link.setAttribute('data-platform', platform);
    link.setAttribute('aria-label', config.ariaLabel);

    // Icon
    const icon = document.createElement('span');
    icon.className = 'social-link-icon';
    icon.textContent = config.icon;

    // Label
    const label = document.createElement('span');
    label.textContent = config.label;

    link.appendChild(icon);
    link.appendChild(label);
    container.appendChild(link);
  });

  console.log('[Social Links] ✅ Social links initialized');
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[Popup Init] 🎨 DOMContentLoaded event fired');

  initTabNavigation();
  initKeyboardShortcuts();
  setupAuthIssueBanner();
  initializeSocialLinks();

  // Wait for Firebase to initialize and restore auth session
  console.log('[Popup Init] Waiting for Firebase auth to initialize...');
  await waitForAuthInit();
  console.log('[Popup Init] Firebase auth initialized, currentUser:', auth.currentUser?.email || 'Not signed in');

  // Setup Firebase auth state listener for future changes
  setupAuthStateListener();

  // User is authenticated OR not - either way, initialize UI
  console.log('[Popup Init] User state:', auth.currentUser ? `Authenticated (${auth.currentUser.email})` : 'Not authenticated');

  // Load config to get saved theme before any UI renders
  const store = useAppStore.getState();
  console.log('[Theme Debug] 📦 Store state before initialize:', {
    hasConfig: !!store.config,
    theme: store.config?.settings?.theme || 'none'
  });

  await store.initialize();

  // IMPORTANT: Get fresh store state after initialization
  const freshState = useAppStore.getState();
  console.log('[Theme Debug] ✅ Store initialized, config loaded:', {
    hasConfig: !!freshState.config,
    theme: freshState.config?.settings?.theme || 'none'
  });

  // Now apply theme BEFORE showing UI (prevents white->black flash)
  initTheme();
  updateThemeUI(freshState.config);

  console.log('[Theme Debug] 🎨 Theme applied from config:', freshState.config?.settings?.theme);

  // Apply background if configured
  await initializeBackgroundOnLoad();

  await initUI(); // Wait for auth redirect check
  await loadInitialData();

  // All data now loaded directly in service worker via Firebase auth/web-extension
  console.log('[Popup] Service worker can now load profiles directly with Firebase auth');

  // TEMPORARY: Test Firebase connection
  // TODO: Remove after verification
  // DISABLED: Interferes with authentication flow
  // if (process.env.NODE_ENV === 'development') {
  //   setTimeout(() => {
  //     console.log('\n🔥 Running Firebase connection test...\n');
  //     testFirebaseConnection();
  //   }, 2000); // Wait 2 seconds for popup to fully load
  // }
});

/**
 * Initialize UI components
 */
async function initUI() {
  initProfileModal();
  initActivityLog();
  initSettingsHandlers();
  initMinimalMode();
  initPageStatus();
  initFeaturesTab();
  initAPIKeyModal();
  await initAuthModal(); // Check for Google Sign-In redirect
  initUserProfile();

  console.log('[Popup V2] UI initialized');
}

/**
 * Load initial data from storage
 */
async function loadInitialData() {
  try {
    const store = useAppStore.getState();

    // Store already initialized in DOMContentLoaded - skip re-initialization

    // Subscribe to store updates with selective rendering
    let previousProfiles = useAppStore.getState().profiles;
    let previousConfig = useAppStore.getState().config;
    let previousActivityLog = useAppStore.getState().activityLog;

    useAppStore.subscribe((state) => {
      // Only re-render if the relevant data actually changed
      if (state.profiles !== previousProfiles) {
        renderProfiles(state.profiles);
        previousProfiles = state.profiles;
      }

      if (state.config !== previousConfig) {
        renderStats(state.config, state.profiles);
        updateMinimalView(state.config);
        updateStatusIndicator(state.config);
        if (state.config) {
          renderFeaturesHub(state.config);
        }
        previousConfig = state.config;
      }

      if (state.activityLog !== previousActivityLog) {
        renderActivityLog(state.activityLog);
        previousActivityLog = state.activityLog;
      }
    });

    // Initial render
    const state = useAppStore.getState();
    renderProfiles(state.profiles);
    renderStats(state.config, state.profiles);
    renderActivityLog(state.activityLog);
    updateSettingsUI(state.config);
    updateStatusIndicator(state.config);
    // Theme already applied in DOMContentLoaded - skip duplicate call
    updateMinimalView(state.config);
    if (state.config) {
      renderFeaturesHub(state.config);
    }

    // Load saved mode preference
    await loadModePreference();

    // Listen for storage changes instead of polling (fixes memory leak)
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes.userConfig) {
        store.loadConfig();
      }
    });

    console.log('[Popup V2] Data loaded successfully');
  } catch (error) {
    console.error('[Popup V2] Error loading data:', error);
  }
}

// ========== MESSAGE HANDLER REMOVED ==========
// Service worker now encrypts activity logs directly with Firebase auth/web-extension

// ========== EXPORTS FOR CONSOLE DEBUGGING ==========
(window as any).popupV2 = {
  renderProfiles,
  renderStats,
  renderActivityLog,
  store: useAppStore,
};

console.log('[Popup V2] Script loaded successfully');
