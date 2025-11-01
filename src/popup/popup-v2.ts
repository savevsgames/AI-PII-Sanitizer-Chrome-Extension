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
import { testFirebaseConnection } from './test-firebase-popup';

// ========== INITIALIZATION ==========

document.addEventListener('DOMContentLoaded', async () => {
  initTabNavigation();
  initKeyboardShortcuts();
  initTheme();
  initUI();
  await loadInitialData();

  // TEMPORARY: Test Firebase connection
  // TODO: Remove after verification
  if (process.env.NODE_ENV === 'development') {
    setTimeout(() => {
      console.log('\n🔥 Running Firebase connection test...\n');
      testFirebaseConnection();
    }, 2000); // Wait 2 seconds for popup to fully load
  }
});

/**
 * Initialize UI components
 */
function initUI() {
  initProfileModal();
  initActivityLog();
  initSettingsHandlers();
  initMinimalMode();
  initPageStatus();
  initFeaturesTab();
  initAPIKeyModal();
  initAuthModal();
  initUserProfile();

  console.log('[Popup V2] UI initialized');
}

/**
 * Load initial data from storage
 */
async function loadInitialData() {
  try {
    const store = useAppStore.getState();

    // Initialize store
    await store.initialize();

    // Subscribe to store updates
    useAppStore.subscribe((state) => {
      renderProfiles(state.profiles);
      renderStats(state.config, state.profiles);
      renderActivityLog(state.activityLog);
      updateMinimalView(state.config);
      if (state.config) {
        renderFeaturesHub(state.config);
      }
    });

    // Initial render
    const state = useAppStore.getState();
    renderProfiles(state.profiles);
    renderStats(state.config, state.profiles);
    renderActivityLog(state.activityLog);
    updateSettingsUI(state.config);
    updateThemeUI(state.config);  // Apply saved theme on load
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
