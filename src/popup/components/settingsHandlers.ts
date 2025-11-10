/**
 * Settings Handlers Component
 * Handles settings tab interactions
 */

import { useAppStore } from '../../lib/store';
import { UserConfig } from '../../lib/types';
import { isValidEmail } from './utils';
import { applyChromeTheme } from '../../lib/chromeTheme';
import { updateStatusIndicator } from './statusIndicator';
import { onThemeChange, initializeBackgroundSettings, onClassicThemeSelected } from './backgroundManager';

const DEBUG_MODE = false; // Set to true for development debugging

// Theme name type
type ThemeName =
  | 'chrome-theme'
  | 'classic-light' | 'lavender' | 'sky' | 'fire' | 'leaf' | 'sunlight'
  | 'classic-dark' | 'midnight-purple' | 'deep-ocean' | 'embers' | 'forest' | 'sundown';

/**
 * Initialize settings handlers
 */
export function initSettingsHandlers() {
  const enabledToggle = document.getElementById('enabledToggle') as HTMLInputElement;
  const emailOptInToggle = document.getElementById('emailOptInToggle') as HTMLInputElement;
  const subscribeBtn = document.getElementById('subscribeBtn');
  const clearStatsBtn = document.getElementById('clearStatsBtn');
  const exportProfilesBtn = document.getElementById('exportProfilesBtn');
  const deleteAccountBtn = document.getElementById('deleteAccountBtn');

  // Service toggles
  const chatgptToggle = document.getElementById('chatgptToggle') as HTMLInputElement;
  const claudeToggle = document.getElementById('claudeToggle') as HTMLInputElement;
  const geminiToggle = document.getElementById('geminiToggle') as HTMLInputElement;
  const perplexityToggle = document.getElementById('perplexityToggle') as HTMLInputElement;
  const copilotToggle = document.getElementById('copilotToggle') as HTMLInputElement;

  enabledToggle?.addEventListener('change', handleEnabledToggle);
  emailOptInToggle?.addEventListener('change', handleEmailOptInToggle);
  subscribeBtn?.addEventListener('click', handleSubscribe);
  clearStatsBtn?.addEventListener('click', handleClearStats);
  exportProfilesBtn?.addEventListener('click', handleExportProfiles);
  deleteAccountBtn?.addEventListener('click', handleDeleteAccount);

  // Service toggle handlers
  chatgptToggle?.addEventListener('change', () => handleServiceToggle('chatgpt', chatgptToggle.checked));
  claudeToggle?.addEventListener('change', () => handleServiceToggle('claude', claudeToggle.checked));
  geminiToggle?.addEventListener('change', () => handleServiceToggle('gemini', geminiToggle.checked));
  perplexityToggle?.addEventListener('change', () => handleServiceToggle('perplexity', perplexityToggle.checked));
  copilotToggle?.addEventListener('change', () => handleServiceToggle('copilot', copilotToggle.checked));

  // Theme picker
  initThemePicker();

  // Initialize background manager
  initializeBackgroundSettings();

  console.log('[Settings Handlers] Initialized');
}

/**
 * Update settings UI from config
 */
export async function updateSettingsUI(config: UserConfig | null) {
  if (!config) return;

  const enabledToggle = document.getElementById('enabledToggle') as HTMLInputElement;
  const emailOptInToggle = document.getElementById('emailOptInToggle') as HTMLInputElement;
  const emailInput = document.getElementById('emailInput') as HTMLInputElement;

  // Service toggles
  const chatgptToggle = document.getElementById('chatgptToggle') as HTMLInputElement;
  const claudeToggle = document.getElementById('claudeToggle') as HTMLInputElement;
  const geminiToggle = document.getElementById('geminiToggle') as HTMLInputElement;
  const perplexityToggle = document.getElementById('perplexityToggle') as HTMLInputElement;
  const copilotToggle = document.getElementById('copilotToggle') as HTMLInputElement;

  if (enabledToggle) enabledToggle.checked = config.settings.enabled;
  if (emailOptInToggle && config.account) {
    emailOptInToggle.checked = config.account.emailOptIn;
    const emailInputGroup = document.getElementById('emailInputGroup');
    if (emailInputGroup) {
      emailInputGroup.style.display = config.account.emailOptIn ? 'flex' : 'none';
    }
  }
  if (emailInput && config.account?.email) {
    emailInput.value = config.account.email;
  }

  // Update service toggles based on protectedDomains
  // Match the same service domain logic used in handleServiceToggle
  const domains = config.settings.protectedDomains || [];
  if (chatgptToggle) {
    chatgptToggle.checked = domains.includes('chat.openai.com') && domains.includes('chatgpt.com');
  }
  if (claudeToggle) {
    claudeToggle.checked = domains.includes('claude.ai');
  }
  if (geminiToggle) {
    geminiToggle.checked = domains.includes('gemini.google.com');
  }
  if (perplexityToggle) {
    perplexityToggle.checked = domains.includes('perplexity.ai');
  }
  if (copilotToggle) {
    copilotToggle.checked = domains.includes('copilot.microsoft.com');
  }

  // Update status indicator
  updateStatusIndicator(config);

  // Update storage usage display
  await updateStorageUsage();
}

/**
 * Handle enabled toggle
 */
async function handleEnabledToggle(event: Event) {
  const checkbox = event.target as HTMLInputElement;
  const store = useAppStore.getState();
  await store.updateSettings({ enabled: checkbox.checked });

  // Update status indicator
  const config = store.config;
  if (config) {
    updateStatusIndicator(config);
  }

  console.log('[Settings] Protection enabled:', checkbox.checked);
}

/**
 * Handle email opt-in toggle
 */
async function handleEmailOptInToggle(event: Event) {
  const checkbox = event.target as HTMLInputElement;
  const emailInputGroup = document.getElementById('emailInputGroup');

  if (emailInputGroup) {
    emailInputGroup.style.display = checkbox.checked ? 'flex' : 'none';
  }

  const store = useAppStore.getState();
  await store.updateAccount({ emailOptIn: checkbox.checked });

  console.log('[Settings] Email opt-in:', checkbox.checked);
}

/**
 * Handle subscribe button
 */
async function handleSubscribe() {
  const emailInput = document.getElementById('emailInput') as HTMLInputElement;
  const email = emailInput?.value.trim();

  if (!email) {
    alert('Please enter your email address');
    return;
  }

  if (!isValidEmail(email)) {
    alert('Please enter a valid email address');
    return;
  }

  const store = useAppStore.getState();
  await store.updateAccount({ email, emailOptIn: true });

  if (DEBUG_MODE) {
    console.log('[Settings] Subscribing email:', email);
  }
  // TODO: Send to Mailchimp API via serverless function
  alert(`Thanks for subscribing! We'll send updates to ${email}`);
}

/**
 * Handle clear stats button
 */
async function handleClearStats() {
  if (!confirm('Are you sure you want to clear all statistics? This cannot be undone.')) {
    return;
  }

  const store = useAppStore.getState();
  const config = store.config;

  if (config) {
    await store.updateConfig({
      stats: {
        totalSubstitutions: 0,
        totalInterceptions: 0,
        totalWarnings: 0,
        successRate: 1.0,
        lastSyncTimestamp: Date.now(),
        byService: {
          chatgpt: { requests: 0, substitutions: 0 },
          claude: { requests: 0, substitutions: 0 },
          gemini: { requests: 0, substitutions: 0 },
          perplexity: { requests: 0, substitutions: 0 },
          copilot: { requests: 0, substitutions: 0 },
        },
        activityLog: [],
      },
    });

    console.log('[Settings] Stats cleared');
    alert('Stats cleared successfully!');
  }
}

/**
 * Handle delete account button (GDPR Right to Erasure)
 * Permanently deletes:
 * - Firestore user document
 * - Firestore subscription document
 * - All local storage data (encrypted profiles, settings, stats)
 * - Firebase Auth account
 */
async function handleDeleteAccount() {
  // First confirmation
  const confirmed = confirm(
    '⚠️ DELETE ACCOUNT?\n\n' +
    'This will PERMANENTLY delete:\n' +
    '• All profiles and aliases\n' +
    '• Activity logs and statistics\n' +
    '• Account information\n' +
    '• Subscription data (if any)\n\n' +
    'This action CANNOT be undone.\n\n' +
    'Click OK to continue'
  );

  if (!confirmed) {
    console.log('[Settings] Account deletion cancelled by user (first prompt)');
    return;
  }

  // Second confirmation (requires typing "DELETE")
  const confirmText = prompt(
    'Type DELETE in ALL CAPS to confirm account deletion:\n\n' +
    'This will permanently erase all your data.'
  );

  if (confirmText !== 'DELETE') {
    console.log('[Settings] Account deletion cancelled - confirmation text did not match');
    alert('Account deletion cancelled.');
    return;
  }

  try {
    // Import Firebase modules
    const { auth } = await import('../../lib/firebase');
    const { deleteUser } = await import('firebase/auth');
    const { deleteUserAccount } = await import('../../lib/firebaseService');

    const user = auth.currentUser;

    if (!user) {
      throw new Error('Not authenticated - please sign in first');
    }

    console.log('[Settings] Starting account deletion for user:', user.uid);

    // Step 1: Delete Firestore data (user document + subscription document)
    await deleteUserAccount(user.uid);
    console.log('[Settings] ✅ Firestore data deleted');

    // Step 2: Delete all local storage data
    await chrome.storage.local.clear();
    console.log('[Settings] ✅ Local storage cleared');

    // Step 3: Delete Firebase Auth account
    await deleteUser(user);
    console.log('[Settings] ✅ Firebase Auth account deleted');

    // Step 4: Show confirmation and close popup
    alert(
      '✅ Your account has been permanently deleted.\n\n' +
      'All your data has been erased:\n' +
      '• Profiles and aliases\n' +
      '• Activity logs and statistics\n' +
      '• Account information\n' +
      '• Subscription data\n\n' +
      'Thank you for using Prompt Blocker.'
    );

    console.log('[Settings] ✅ Account deletion complete');

    // Close popup
    window.close();

  } catch (error) {
    console.error('[Settings] ❌ Failed to delete account:', error);

    // Show user-friendly error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    alert(
      '❌ Failed to delete account\n\n' +
      `Error: ${errorMessage}\n\n` +
      'Please try again or contact support@promptblocker.com'
    );
  }
}

/**
 * Handle service toggle change
 */
async function handleServiceToggle(service: string, enabled: boolean) {
  const store = useAppStore.getState();
  const config = store.config;
  if (!config) return;

  // Define domain mappings for each service
  const serviceDomains: Record<string, string[]> = {
    chatgpt: ['chat.openai.com', 'chatgpt.com'],
    claude: ['claude.ai'],
    gemini: ['gemini.google.com'],
    perplexity: ['perplexity.ai'],
    copilot: ['copilot.microsoft.com'],
  };

  let updatedDomains = [...config.settings.protectedDomains];
  const domainsToModify = serviceDomains[service] || [];

  if (enabled) {
    // Add domains if not present
    domainsToModify.forEach(domain => {
      if (!updatedDomains.includes(domain)) {
        updatedDomains.push(domain);
      }
    });
  } else {
    // Remove domains
    updatedDomains = updatedDomains.filter(d => !domainsToModify.includes(d));
  }

  console.log(`[Settings] ${service} ${enabled ? 'enabled' : 'disabled'}`, { updatedDomains });

  // Update config
  await store.updateSettings({ protectedDomains: updatedDomains });

  // Refresh the entire settings UI to update all toggles and status
  setTimeout(() => {
    const updatedConfig = useAppStore.getState().config;
    if (updatedConfig) {
      updateSettingsUI(updatedConfig);
    }
  }, 0);
}

/**
 * Handle export profiles button (GDPR-compliant complete data export)
 * Exports ALL user data: profiles, activity logs, stats, account metadata, settings
 */
async function handleExportProfiles() {
  try {
    const store = useAppStore.getState();

    // Get Firebase user data
    const { auth } = await import('../../lib/firebase');
    const user = auth.currentUser;

    // Prepare complete data export
    const exportData = {
      // Export metadata
      version: 3, // Incremented from v2 to v3 (complete export)
      exportDate: new Date().toISOString(),
      exportType: 'complete', // 'complete' vs 'profiles-only' (legacy)

      // User profiles (core data)
      profiles: store.profiles || [],

      // Activity logs (debugging/audit trail)
      activityLog: store.activityLog || [],

      // Usage statistics
      stats: {
        totalSubstitutions: store.config?.stats?.totalSubstitutions || 0,
        totalInterceptions: store.config?.stats?.totalInterceptions || 0,
        totalWarnings: store.config?.stats?.totalWarnings || 0,
        successRate: store.config?.stats?.successRate || 0,
        lastSyncTimestamp: store.config?.stats?.lastSyncTimestamp || 0,
        byService: store.config?.stats?.byService || {},
      },

      // Account metadata
      account: {
        uid: user?.uid || null,
        email: user?.email || null,
        displayName: user?.displayName || null,
        photoURL: user?.photoURL || null,
        provider: user?.providerData?.[0]?.providerId || null,
        createdAt: user?.metadata?.creationTime || null,
        lastSignIn: user?.metadata?.lastSignInTime || null,
        tier: store.config?.account?.tier || 'free',
        emailOptIn: store.config?.account?.emailOptIn || false,
        encryptionProvider: store.config?.account?.encryptionProvider || null,
        encryptionEmail: store.config?.account?.encryptionEmail || null,
      },

      // Settings (non-sensitive)
      settings: {
        enabled: store.config?.settings?.enabled,
        theme: store.config?.settings?.theme,
        protectedDomains: store.config?.settings?.protectedDomains || [],
        excludedDomains: store.config?.settings?.excludedDomains || [],
        defaultMode: store.config?.settings?.defaultMode,
        decodeResponses: store.config?.settings?.decodeResponses,
        showNotifications: store.config?.settings?.showNotifications,
        cloudSync: store.config?.settings?.cloudSync,
      },
    };

    // Download as JSON
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `promptblocker-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    URL.revokeObjectURL(url);

    console.log('[Settings] ✅ Complete data export successful:', {
      profiles: exportData.profiles.length,
      activityLogs: exportData.activityLog.length,
      totalSubstitutions: exportData.stats.totalSubstitutions,
    });

    // Show success message
    const profileCount = exportData.profiles.length;
    const logCount = exportData.activityLog.length;
    alert(`✅ Data exported successfully!\n\n` +
          `Profiles: ${profileCount}\n` +
          `Activity logs: ${logCount}\n` +
          `Stats: ${exportData.stats.totalSubstitutions} total substitutions\n\n` +
          `File saved as: promptblocker-data-${new Date().toISOString().split('T')[0]}.json`);

  } catch (error) {
    console.error('[Settings] ❌ Failed to export data:', error);
    alert('❌ Failed to export data. Please try again or contact support@promptblocker.com');
  }
}

/**
 * Initialize theme picker
 */
function initThemePicker() {
  const themeSwatches = document.querySelectorAll('.theme-swatch, .theme-card');

  themeSwatches.forEach((swatch) => {
    swatch.addEventListener('click', async () => {
      const theme = swatch.getAttribute('data-theme') as ThemeName;
      if (theme) {
        await handleThemeChange(theme);
      }
    });
  });

  // Initialize background transparency slider
  const bgTransparencySlider = document.getElementById('bgTransparencySlider') as HTMLInputElement;
  const bgTransparencyValue = document.getElementById('bgTransparencyValue');

  if (bgTransparencySlider && bgTransparencyValue) {
    // Load saved value
    chrome.storage.local.get('bgTransparency', (result) => {
      const transparency = result.bgTransparency || 0;
      bgTransparencySlider.value = transparency.toString();
      bgTransparencyValue.textContent = `${transparency}%`;
      applyBackgroundTransparency(transparency);
    });

    // Update display while dragging
    bgTransparencySlider.oninput = () => {
      const value = parseInt(bgTransparencySlider.value);
      bgTransparencyValue.textContent = `${value}%`;
    };

    // Save and apply when released
    bgTransparencySlider.onchange = async () => {
      const value = parseInt(bgTransparencySlider.value);
      await chrome.storage.local.set({ bgTransparency: value });
      applyBackgroundTransparency(value);
      console.log('[Theme] Background transparency set to:', value);
    };

    // Listen for background changes and reapply transparency
    window.addEventListener('bgTransparencyUpdate', ((event: CustomEvent) => {
      const transparency = event.detail;
      applyBackgroundTransparency(transparency);
    }) as EventListener);
  }

  console.log('[Theme Picker] Initialized');
}

/**
 * Apply background transparency to the extension UI
 * Only affects the main .container background, NOT individual cards
 * This allows the background image to show through the main panel
 */
function applyBackgroundTransparency(transparency: number) {
  const body = document.body;
  const container = document.querySelector('.container') as HTMLElement;

  if (!container) {
    console.warn('[Theme] Container not found for background transparency');
    return;
  }

  // Only apply transparency if a custom background is active
  const hasCustomBg = body.hasAttribute('data-custom-bg');

  if (!hasCustomBg) {
    // No custom background, reset to normal
    container.style.backgroundColor = '';
    return;
  }

  // Convert transparency percentage to alpha value (0-1)
  // 0% transparency = fully opaque background (alpha 1, hides image)
  // 100% transparency = fully transparent background (alpha 0, shows image)
  const alpha = 1 - (transparency / 100);

  // Get theme mode
  const isDarkMode = body.getAttribute('data-theme-mode') === 'dark';

  // Apply background color with transparency to .container only
  // This creates a colored overlay over the background image
  const bgColor = isDarkMode ? `rgba(26, 26, 46, ${alpha})` : `rgba(255, 255, 255, ${alpha})`;

  container.style.backgroundColor = bgColor;

  console.log('[Theme] Applied background transparency:', transparency, '% (alpha:', alpha.toFixed(2), ')');
}

/**
 * Theme mode classification map - determines if theme is dark or light
 */
const THEME_MODES: Record<string, 'dark' | 'light'> = {
  // Light mode themes (light backgrounds + white cards + black text)
  'classic-light': 'light',
  'lavender': 'light',
  'sky': 'light',
  'fire': 'light',
  'leaf': 'light',
  'sunlight': 'light',

  // Dark mode themes (dark backgrounds + dark cards + white text)
  'classic-dark': 'dark',
  'midnight-purple': 'dark',
  'deep-ocean': 'dark',
  'embers': 'dark',
  'forest': 'dark',
  'sundown': 'dark',
};

// ThemeName type defined at top of file

/**
 * Handle theme change
 */
async function handleThemeChange(theme: ThemeName) {
  console.log('[Theme Debug] 💾 User selected theme:', theme);

  const store = useAppStore.getState();
  console.log('[Theme Debug] 📦 Current config before save:', {
    hasConfig: !!store.config,
    currentTheme: store.config?.settings?.theme
  });

  await store.updateSettings({ theme });

  console.log('[Theme Debug] ✅ Theme saved to storage:', theme);

  // Bidirectional sync: Selecting classic theme sets matching background + 100% opacity
  if (theme === 'classic-dark' || theme === 'classic-light') {
    await onClassicThemeSelected(theme);
  }

  // Apply theme immediately
  applyTheme(theme);

  console.log('[Theme] Changed to:', theme);
}

/**
 * Legacy theme name migration map
 * Maps old 6-theme names to new 12-theme names for backwards compatibility
 */
const LEGACY_THEME_MAP: Record<string, ThemeName> = {
  'dark': 'classic-dark',
  'blue': 'deep-ocean',
  'green': 'forest',
  'purple': 'lavender',
  'amber': 'sunlight',
  'neutral': 'classic-light',
};

/**
 * Apply theme to CSS variables and set theme mode
 */
export async function applyTheme(themeInput: ThemeName | string) {
  const root = document.documentElement;
  const body = document.body;

  // Migrate legacy theme names to new names
  const theme = (LEGACY_THEME_MAP[themeInput] || themeInput) as ThemeName;

  // Handle Chrome theme dynamically
  if (theme === 'chrome-theme') {
    const success = await applyChromeTheme();
    if (!success) {
      console.warn('[Theme] Chrome theme not available, falling back to classic-dark');
      // Fallback to classic-dark if Chrome theme fails
      await applyTheme('classic-dark');
      return;
    }
  } else {
    // Get theme mode (dark or light)
    const themeMode = THEME_MODES[theme] || 'dark';
    const isDarkMode = themeMode === 'dark';

    // Check if theme mode is changing (for transparency adjustment)
    const previousMode = body.getAttribute('data-theme-mode');
    const modeIsChanging = previousMode && previousMode !== themeMode;

    // Set data attribute for light mode CSS variable overrides
    body.setAttribute('data-theme-mode', themeMode);

    // Convert theme name to CSS variable format (e.g., 'midnight-blue' -> '--theme-midnight-blue')
    const themeBgVar = `var(--theme-${theme})`;
    const themeHeaderVar = `var(--theme-${theme}-header)`;

    // Update CSS variables
    root.style.setProperty('--theme-bg-gradient', themeBgVar);
    root.style.setProperty('--theme-header-gradient', themeHeaderVar);

    // Adjust transparency when switching between light and dark modes
    if (modeIsChanging) {
      const bgTransparencySlider = document.getElementById('bgTransparencySlider') as HTMLInputElement;
      const bgTransparencyValue = document.getElementById('bgTransparencyValue');

      // Light theme needs less background showing (more opaque overlay) = 20% transparency
      // Dark theme needs more background showing (more transparent overlay) = 80% transparency
      const newTransparency = isDarkMode ? 80 : 20;

      if (bgTransparencySlider && bgTransparencyValue) {
        bgTransparencySlider.value = newTransparency.toString();
        bgTransparencyValue.textContent = `${newTransparency}%`;
        chrome.storage.local.set({ bgTransparency: newTransparency });
        applyBackgroundTransparency(newTransparency);
        console.log(`[Theme] Mode changed to ${themeMode}, adjusted transparency to ${newTransparency}%`);
      }
    }

    // Notify background manager of theme change
    onThemeChange(isDarkMode);
  }

  // Update active state on theme swatches (supports both old and new selectors)
  document.querySelectorAll('.theme-swatch, .theme-card').forEach((swatch) => {
    const swatchTheme = swatch.getAttribute('data-theme');
    // Check if this swatch matches either the input theme or the migrated theme
    if (swatchTheme === themeInput || swatchTheme === theme) {
      swatch.classList.add('active');
    } else {
      swatch.classList.remove('active');
    }
  });

  console.log(`[Theme] Applied ${theme}${themeInput !== theme ? ` [migrated from ${themeInput}]` : ''}`);
}

/**
 * Update theme UI from config
 */
export function updateThemeUI(config: UserConfig | null) {
  console.log('[Theme Debug] 🔄 updateThemeUI called:', {
    hasConfig: !!config,
    theme: config?.settings?.theme || 'none'
  });

  if (!config) {
    console.warn('[Theme Debug] ⚠️ No config provided to updateThemeUI');
    return;
  }

  const theme = (config.settings.theme || 'classic-dark') as ThemeName;
  console.log('[Theme Debug] 🎨 Applying theme from config:', theme);
  applyTheme(theme);
}

/**
 * Update storage usage display
 * We have unlimitedStorage permission - just show how much space is being used
 */
async function updateStorageUsage() {
  try {
    const bytesInUse = await chrome.storage.local.getBytesInUse();
    const formattedUsage = formatBytes(bytesInUse);

    const usedEl = document.getElementById('storageUsed');
    const hintEl = document.getElementById('storageHint');

    if (usedEl) {
      usedEl.textContent = formattedUsage;
    }

    if (hintEl) {
      hintEl.textContent = '✓ Unlimited local storage';
      hintEl.style.color = 'var(--text-secondary)';
    }
  } catch (error) {
    console.error('[Settings] Error loading storage usage:', error);
  }
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
