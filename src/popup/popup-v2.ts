/**
 * Popup UI Script - V2
 * Manages the tabbed extension popup interface
 * Connected to Zustand store for state management
 */

import { useAppStore } from '../lib/store';
import { AliasProfile } from '../lib/types';

// ========== TAB NAVIGATION ==========

document.addEventListener('DOMContentLoaded', async () => {
  initTabNavigation();
  initUI();
  await loadInitialData();
});

/**
 * Initialize tab switching functionality
 */
function initTabNavigation() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');

      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      // Add active class to clicked button and corresponding content
      button.classList.add('active');
      const targetTab = document.getElementById(`${tabName}-tab`);
      if (targetTab) {
        targetTab.classList.add('active');
      }

      console.log(`[Popup V2] Switched to ${tabName} tab`);
    });
  });
}

/**
 * Initialize UI event listeners
 */
function initUI() {
  // Aliases tab
  const addProfileBtn = document.getElementById('addProfileBtn');
  const addProfileBtnEmpty = document.getElementById('addProfileBtnEmpty');

  addProfileBtn?.addEventListener('click', showAddProfileForm);
  addProfileBtnEmpty?.addEventListener('click', showAddProfileForm);

  // Settings tab
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

  // Debug tab
  const clearLogBtn = document.getElementById('clearLogBtn');
  clearLogBtn?.addEventListener('click', handleClearLog);

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
      renderStats(state.config);
      renderActivityLog(state.activityLog);
    });

    // Initial render
    const state = useAppStore.getState();
    renderProfiles(state.profiles);
    renderStats(state.config);
    renderActivityLog(state.activityLog);
    updateSettingsUI(state.config);

    // Poll for activity log updates every 2 seconds
    setInterval(async () => {
      await store.loadConfig();
    }, 2000);

    console.log('[Popup V2] Data loaded successfully');
  } catch (error) {
    console.error('[Popup V2] Error loading data:', error);
  }
}

// ========== ALIASES TAB ==========

function showAddProfileForm() {
  console.log('[Popup V2] Add profile clicked');
  // TODO: Implement profile editor modal
  alert('Profile editor coming soon! This will open a form to create a new identity profile.');
}

/**
 * Render profiles from store
 */
function renderProfiles(profiles: AliasProfile[]) {
  const profileList = document.getElementById('profileList');
  const emptyState = document.getElementById('profilesEmptyState');

  if (!profileList || !emptyState) return;

  if (profiles.length === 0) {
    emptyState.classList.remove('hidden');
    profileList.innerHTML = '';
    return;
  }

  emptyState.classList.add('hidden');
  profileList.innerHTML = profiles
    .map((profile) => {
      const mappings: string[] = [];

      if (profile.real.name && profile.alias.name) {
        mappings.push(`
          <div class="mapping-row">
            <span class="mapping-real">${escapeHtml(profile.real.name)}</span>
            <span class="mapping-arrow">→</span>
            <span class="mapping-alias">${escapeHtml(profile.alias.name)}</span>
          </div>
        `);
      }

      if (profile.real.email && profile.alias.email) {
        mappings.push(`
          <div class="mapping-row">
            <span class="mapping-real">${escapeHtml(profile.real.email)}</span>
            <span class="mapping-arrow">→</span>
            <span class="mapping-alias">${escapeHtml(profile.alias.email)}</span>
          </div>
        `);
      }

      if (profile.real.phone && profile.alias.phone) {
        mappings.push(`
          <div class="mapping-row">
            <span class="mapping-real">${escapeHtml(profile.real.phone)}</span>
            <span class="mapping-arrow">→</span>
            <span class="mapping-alias">${escapeHtml(profile.alias.phone)}</span>
          </div>
        `);
      }

      if (profile.real.address && profile.alias.address) {
        mappings.push(`
          <div class="mapping-row">
            <span class="mapping-real">${escapeHtml(profile.real.address)}</span>
            <span class="mapping-arrow">→</span>
            <span class="mapping-alias">${escapeHtml(profile.alias.address)}</span>
          </div>
        `);
      }

      const lastUsed = profile.metadata.usageStats.lastUsed
        ? formatRelativeTime(profile.metadata.usageStats.lastUsed)
        : 'Never';

      return `
        <div class="profile-card ${!profile.enabled ? 'disabled' : ''}">
          <div class="profile-header">
            <div class="profile-title">👤 ${escapeHtml(profile.profileName)}</div>
            <div class="profile-actions">
              <button class="icon-btn" title="Toggle" data-action="toggle" data-id="${profile.id}">
                ${profile.enabled ? '✓' : '○'}
              </button>
              <button class="icon-btn" title="Edit" data-action="edit" data-id="${profile.id}">✏️</button>
              <button class="icon-btn" title="Delete" data-action="delete" data-id="${profile.id}">🗑️</button>
            </div>
          </div>
          <div class="profile-mappings">
            ${mappings.join('')}
          </div>
          <div class="profile-meta">
            Used: ${profile.metadata.usageStats.totalSubstitutions} times | Last: ${lastUsed}
          </div>
        </div>
      `;
    })
    .join('');

  // Attach event listeners to profile action buttons
  profileList.querySelectorAll('.icon-btn').forEach((btn) => {
    btn.addEventListener('click', handleProfileAction);
  });
}

/**
 * Handle profile action buttons (toggle, edit, delete)
 */
async function handleProfileAction(event: Event) {
  const btn = event.currentTarget as HTMLButtonElement;
  const action = btn.getAttribute('data-action');
  const profileId = btn.getAttribute('data-id');

  if (!profileId) return;

  const store = useAppStore.getState();

  switch (action) {
    case 'toggle':
      await store.toggleProfile(profileId);
      break;

    case 'edit':
      console.log('[Popup V2] Edit profile:', profileId);
      alert('Profile editor coming soon!');
      break;

    case 'delete':
      if (confirm('Are you sure you want to delete this profile?')) {
        await store.deleteProfile(profileId);
      }
      break;
  }
}

// ========== STATS TAB ==========

/**
 * Render stats from config
 */
function renderStats(config: any) {
  if (!config) return;

  const stats = config.stats;

  // Update total stats
  const totalSubsEl = document.getElementById('totalSubstitutions');
  const totalInterceptionsEl = document.getElementById('totalInterceptions');
  const successRateEl = document.getElementById('successRate');

  if (totalSubsEl) totalSubsEl.textContent = stats.totalSubstitutions.toString();
  if (totalInterceptionsEl) totalInterceptionsEl.textContent = stats.totalInterceptions.toString();
  if (successRateEl) successRateEl.textContent = `${(stats.successRate * 100).toFixed(1)}%`;

  // Update service stats
  const chatgptEl = document.getElementById('chatgptSubs');
  const claudeEl = document.getElementById('claudeSubs');
  const geminiEl = document.getElementById('geminiSubs');

  if (chatgptEl) chatgptEl.textContent = stats.byService.chatgpt.substitutions.toString();
  if (claudeEl) claudeEl.textContent = stats.byService.claude.substitutions.toString();
  if (geminiEl) geminiEl.textContent = stats.byService.gemini.substitutions.toString();
}

// ========== SETTINGS TAB ==========

/**
 * Update settings UI from config
 */
function updateSettingsUI(config: any) {
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

async function handleEnabledToggle(event: Event) {
  const checkbox = event.target as HTMLInputElement;
  const store = useAppStore.getState();
  await store.updateSettings({ enabled: checkbox.checked });
  console.log('[Popup V2] Protection enabled:', checkbox.checked);
}

async function handleEmailOptInToggle(event: Event) {
  const checkbox = event.target as HTMLInputElement;
  const emailInputGroup = document.getElementById('emailInputGroup');

  if (emailInputGroup) {
    emailInputGroup.style.display = checkbox.checked ? 'flex' : 'none';
  }

  const store = useAppStore.getState();
  await store.updateAccount({ emailOptIn: checkbox.checked });

  console.log('[Popup V2] Email opt-in:', checkbox.checked);
}

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

  console.log('[Popup V2] Subscribing email:', email);
  // TODO: Send to Mailchimp API via serverless function
  alert(`Thanks for subscribing! We'll send updates to ${email}`);
}

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
        },
        activityLog: [],
      },
    });

    console.log('[Popup V2] Stats cleared');
    alert('Stats cleared successfully!');
  }
}

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
  console.log('[Popup V2] Exported', profiles.length, 'profiles');
}

// ========== DEBUG CONSOLE TAB ==========

async function handleClearLog() {
  const store = useAppStore.getState();
  await store.clearActivityLog();
  console.log('[Popup V2] Debug log cleared');
}

/**
 * Render activity log from store
 */
function renderActivityLog(activityLog: any[]) {
  const debugConsole = document.getElementById('debugConsole');
  const emptyState = document.getElementById('debugEmptyState');

  if (!debugConsole || !emptyState) return;

  if (activityLog.length === 0) {
    emptyState.classList.remove('hidden');
    debugConsole.innerHTML = '';
    return;
  }

  emptyState.classList.add('hidden');
  debugConsole.innerHTML = activityLog
    .map((entry) => {
      const timestamp = new Date(entry.timestamp).toLocaleTimeString();
      const typeIcon = entry.type === 'substitution' ? '✓' : entry.type === 'warning' ? '⚠' : '✗';
      const typeClass = entry.type === 'substitution' ? 'success' : entry.type === 'warning' ? 'warning' : 'error';

      const details = [
        `URL: ${entry.details.url}`,
        entry.details.profilesUsed?.length > 0
          ? `Profiles: ${entry.details.profilesUsed.join(', ')}`
          : '',
        entry.details.piiTypesFound?.length > 0
          ? `PII Types: ${entry.details.piiTypesFound.join(', ')}`
          : '',
        `Substitutions: ${entry.details.substitutionCount}`,
        entry.details.error ? `Error: ${entry.details.error}` : '',
      ]
        .filter(Boolean)
        .join('<br>');

      return `
        <div class="debug-entry">
          <span class="debug-timestamp">[${timestamp}]</span>
          <span class="debug-type ${typeClass}">${typeIcon}</span>
          <span class="debug-message">${escapeHtml(entry.message)}</span>
          <div class="debug-details">
            ${details}
          </div>
        </div>
      `;
    })
    .join('');
}

// ========== UTILITIES ==========

function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Format timestamp as relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days ago`;

  return new Date(timestamp).toLocaleDateString();
}

// ========== EXPORTS ==========
// For testing in console
(window as any).popupV2 = {
  renderProfiles,
  renderStats,
  renderActivityLog,
  store: useAppStore,
};

console.log('[Popup V2] Script loaded successfully');
