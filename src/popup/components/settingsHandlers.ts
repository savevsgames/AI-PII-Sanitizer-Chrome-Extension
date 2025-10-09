/**
 * Settings Handlers Component
 * Handles settings tab interactions
 */

import { useAppStore } from '../../lib/store';
import { UserConfig } from '../../lib/types';
import { isValidEmail } from './utils';

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
