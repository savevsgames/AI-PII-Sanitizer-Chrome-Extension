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
import { initAuthModal, openAuthModal } from './components/authModal';
import { initUserProfile } from './components/userProfile';
import { initTabNavigation, initKeyboardShortcuts, initTheme } from './init/initUI';
import { updateStatusIndicator } from './components/statusIndicator';
import { auth } from '../lib/firebase';
// import { testFirebaseConnection } from './test-firebase-popup'; // Disabled - interferes with auth

// ========== FIREBASE AUTH STATE MANAGEMENT ==========

/**
 * Show locked state overlay when user is signed out
 * Data is encrypted with Firebase UID and cannot be accessed without authentication
 */
function showLockedState() {
  const lockedOverlay = document.getElementById('lockedOverlay');
  if (!lockedOverlay) return;

  lockedOverlay.classList.remove('hidden');

  // Setup sign-in button handler (remove old listener first to avoid duplicates)
  const signInBtn = document.getElementById('lockedSignInBtn');
  if (signInBtn) {
    // Clone node to remove all existing event listeners
    const newSignInBtn = signInBtn.cloneNode(true) as HTMLElement;
    signInBtn.parentNode?.replaceChild(newSignInBtn, signInBtn);

    newSignInBtn.addEventListener('click', () => {
      console.log('[Locked State] User clicked Sign In to Unlock');
      openAuthModal('signin');
    });
  }

  console.log('[Locked State] 🔒 Data locked - authentication required');
}

/**
 * Hide locked state overlay when user is authenticated
 */
function hideLockedState() {
  const lockedOverlay = document.getElementById('lockedOverlay');
  if (!lockedOverlay) return;

  lockedOverlay.classList.add('hidden');
  console.log('[Locked State] 🔓 Data unlocked - user authenticated');
}

/**
 * Handle Firebase authentication state changes
 * Shows/hides locked overlay based on auth state
 */
function setupAuthStateListener() {
  auth.onAuthStateChanged(async (user) => {
    console.log('[Auth State] Firebase auth state changed:', user ? `Signed in as ${user.email}` : 'Signed out');

    if (!user) {
      // User signed out - show locked state
      showLockedState();
    } else {
      // User signed in - hide locked state and reload data
      hideLockedState();

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

  // Check auth state - if not signed in, show locked state
  if (!auth.currentUser) {
    console.log('[Popup Init] User not authenticated - showing locked state');
    showLockedState();
    // Don't initialize store yet - wait for sign-in
    await initUI(); // Initialize UI components only
    return; // Stop here until user signs in
  }

  // User is authenticated - proceed with normal initialization
  console.log('[Popup Init] User authenticated - loading data');

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

  await initUI(); // Wait for auth redirect check
  await loadInitialData();

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
