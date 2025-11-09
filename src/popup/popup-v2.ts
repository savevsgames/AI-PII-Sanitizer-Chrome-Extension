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
// import { testFirebaseConnection } from './test-firebase-popup'; // Disabled - interferes with auth

// ========== FIREBASE AUTH STATE MANAGEMENT ==========

/**
 * Handle Firebase authentication state changes
 * Reloads encrypted data when user signs in
 * NOTE: This listener is for FUTURE auth state changes only.
 * Initial auth state is already handled by waitForAuthInit() + DOMContentLoaded initialization.
 */
function setupAuthStateListener() {
  let previousAuthState = auth.currentUser !== null;

  auth.onAuthStateChanged(async (user) => {
    const currentAuthState = user !== null;

    console.log('[Auth State] Firebase auth state changed:', user ? `Signed in as ${user.email}` : 'Signed out');

    // Only reload data if transitioning from signed-out to signed-in
    // Skip if we're already authenticated (prevents race condition during initial load)
    if (currentAuthState && !previousAuthState) {
      console.log('[Auth State] Auth state transition: signed-out → signed-in');

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

        // Send decrypted profiles to background worker (service worker can't decrypt)
        console.log('[Popup] Sending', state.profiles.length, 'profiles to background worker');
        chrome.runtime.sendMessage({
          type: 'SET_PROFILES',
          payload: state.profiles
        }).catch(err => console.error('[Popup] Failed to send profiles to background:', err));

        console.log('[Auth State] ✅ Data reloaded with Firebase UID encryption');

      } catch (error) {
        console.error('[Auth State] Failed to reload data after sign in:', error);
      }
    } else if (!currentAuthState && previousAuthState) {
      console.log('[Auth State] Auth state transition: signed-in → signed-out');
      console.log('[Auth State] Encrypted data unavailable until sign-in');
    } else if (currentAuthState && previousAuthState) {
      console.log('[Auth State] Auth state unchanged (already signed in) - skipping re-initialization');
    } else {
      console.log('[Auth State] Auth state unchanged (not signed in)');
    }

    // Update previous state for next change
    previousAuthState = currentAuthState;
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

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[Popup Init] 🎨 DOMContentLoaded event fired');

  initTabNavigation();
  initKeyboardShortcuts();

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

  // Send decrypted profiles to background worker after initial load
  const finalState = useAppStore.getState();
  if (finalState.profiles.length > 0) {
    console.log('[Popup] Sending', finalState.profiles.length, 'profiles to background worker');
    chrome.runtime.sendMessage({
      type: 'SET_PROFILES',
      payload: finalState.profiles
    }).catch(err => console.error('[Popup] Failed to send profiles to background:', err));
  }

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

// ========== EXPORTS FOR CONSOLE DEBUGGING ==========
(window as any).popupV2 = {
  renderProfiles,
  renderStats,
  renderActivityLog,
  store: useAppStore,
};

console.log('[Popup V2] Script loaded successfully');
