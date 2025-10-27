/**
 * Settings Handlers Component
 * Handles settings tab interactions
 */

import { useAppStore } from '../../lib/store';
import { UserConfig } from '../../lib/types';
import { isValidEmail } from './utils';
import { applyChromeTheme } from '../../lib/chromeTheme';

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

  enabledToggle?.addEventListener('change', handleEnabledToggle);
  emailOptInToggle?.addEventListener('change', handleEmailOptInToggle);
  subscribeBtn?.addEventListener('click', handleSubscribe);
  clearStatsBtn?.addEventListener('click', handleClearStats);
  exportProfilesBtn?.addEventListener('click', handleExportProfiles);

  // Theme picker
  initThemePicker();

  console.log('[Settings Handlers] Initialized');
}

/**
 * Update settings UI from config
 */
export function updateSettingsUI(config: UserConfig | null) {
  if (!config) return;

  const enabledToggle = document.getElementById('enabledToggle') as HTMLInputElement;
  const emailOptInToggle = document.getElementById('emailOptInToggle') as HTMLInputElement;
  const emailInput = document.getElementById('emailInput') as HTMLInputElement;

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
}

/**
 * Handle enabled toggle
 */
async function handleEnabledToggle(event: Event) {
  const checkbox = event.target as HTMLInputElement;
  const store = useAppStore.getState();
  await store.updateSettings({ enabled: checkbox.checked });
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

  console.log('[Settings] Subscribing email:', email);
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
          poe: { requests: 0, substitutions: 0 },
          copilot: { requests: 0, substitutions: 0 },
          you: { requests: 0, substitutions: 0 },
        },
        activityLog: [],
      },
    });

    console.log('[Settings] Stats cleared');
    alert('Stats cleared successfully!');
  }
}

/**
 * Handle export profiles button
 */
async function handleExportProfiles() {
  const store = useAppStore.getState();
  const profiles = store.profiles;

  const exportData = {
    version: 2,
    exportDate: new Date().toISOString(),
    profiles: profiles,
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `ai-pii-sanitizer-profiles-${Date.now()}.json`;
  link.click();

  URL.revokeObjectURL(url);
  console.log('[Settings] Exported', profiles.length, 'profiles');
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

  console.log('[Theme Picker] Initialized');
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
  const store = useAppStore.getState();
  await store.updateSettings({ theme });

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

    // Set data attribute for light mode CSS variable overrides
    body.setAttribute('data-theme-mode', themeMode);

    // Convert theme name to CSS variable format (e.g., 'midnight-blue' -> '--theme-midnight-blue')
    const themeBgVar = `var(--theme-${theme})`;
    const themeHeaderVar = `var(--theme-${theme}-header)`;

    // Update CSS variables
    root.style.setProperty('--theme-bg-gradient', themeBgVar);
    root.style.setProperty('--theme-header-gradient', themeHeaderVar);
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
  if (!config) return;

  const theme = (config.settings.theme || 'classic-dark') as ThemeName;
  applyTheme(theme);
}
