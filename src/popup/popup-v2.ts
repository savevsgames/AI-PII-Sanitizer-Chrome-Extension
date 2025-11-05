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
// import { testFirebaseConnection } from './test-firebase-popup'; // Disabled - interferes with auth

// ========== INITIALIZATION ==========

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[Theme Debug] 🎨 DOMContentLoaded event fired');

  initTabNavigation();
  initKeyboardShortcuts();

  // Load config FIRST to get saved theme before any UI renders
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
