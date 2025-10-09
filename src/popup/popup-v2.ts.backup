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
  // Mode toggle buttons
  const minimizeBtn = document.getElementById('minimizeBtn');
  const expandBtn = document.getElementById('expandBtn');

  minimizeBtn?.addEventListener('click', switchToMinimalMode);
  expandBtn?.addEventListener('click', switchToFullMode);

  // Aliases tab - Profile Editor Modal
  const addProfileBtn = document.getElementById('addProfileBtn');
  const addProfileBtnEmpty = document.getElementById('addProfileBtnEmpty');

  addProfileBtn?.addEventListener('click', () => openProfileModal('create'));
  addProfileBtnEmpty?.addEventListener('click', () => openProfileModal('create'));

  // Profile Editor Modal handlers
  const modalClose = document.getElementById('modalClose');
  const modalCancel = document.getElementById('modalCancel');
  const modalSave = document.getElementById('modalSave');
  const modalDelete = document.getElementById('modalDelete');

  modalClose?.addEventListener('click', closeProfileModal);
  modalCancel?.addEventListener('click', closeProfileModal);
  modalSave?.addEventListener('click', saveProfile);
  modalDelete?.addEventListener('click', showDeleteConfirmation);

  // Close modal on overlay click
  const modalOverlay = document.querySelector('#profileModal .modal-overlay');
  modalOverlay?.addEventListener('click', closeProfileModal);

  // Delete Confirmation Modal handlers
  const deleteModalClose = document.getElementById('deleteModalClose');
  const deleteCancel = document.getElementById('deleteCancel');
  const deleteConfirm = document.getElementById('deleteConfirm');

  deleteModalClose?.addEventListener('click', closeDeleteModal);
  deleteCancel?.addEventListener('click', closeDeleteModal);
  deleteConfirm?.addEventListener('click', confirmDeleteProfile);

  // Close delete modal on overlay click
  const deleteModalOverlay = document.querySelector('#deleteModal .modal-overlay');
  deleteModalOverlay?.addEventListener('click', closeDeleteModal);

  // Email validation on blur
  const realEmailInput = document.getElementById('realEmail') as HTMLInputElement;
  const aliasEmailInput = document.getElementById('aliasEmail') as HTMLInputElement;

  realEmailInput?.addEventListener('blur', () => validateEmailField(realEmailInput));
  aliasEmailInput?.addEventListener('blur', () => validateEmailField(aliasEmailInput));

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
      updateMinimalView(state.config);
    });

    // Initial render
    const state = useAppStore.getState();
    renderProfiles(state.profiles);
    renderStats(state.config);
    renderActivityLog(state.activityLog);
    updateSettingsUI(state.config);
    updateMinimalView(state.config);

    // Load saved mode preference
    loadModePreference();

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

// Track currently editing profile ID
let currentEditingProfileId: string | null = null;

/**
 * Open profile editor modal
 */
function openProfileModal(mode: 'create' | 'edit', profile?: AliasProfile) {
  const modal = document.getElementById('profileModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalDelete = document.getElementById('modalDelete');
  const form = document.getElementById('profileForm') as HTMLFormElement;

  if (!modal || !modalTitle || !modalDelete || !form) return;

  // Set editing mode
  currentEditingProfileId = profile?.id || null;

  // Update modal UI based on mode
  if (mode === 'create') {
    modalTitle.textContent = 'Create Profile';
    modalDelete.classList.add('hidden');
    form.reset();
    // Default enable toggle to checked
    (document.getElementById('profileEnabled') as HTMLInputElement).checked = true;
  } else {
    modalTitle.textContent = 'Edit Profile';
    modalDelete.classList.remove('hidden');
    if (profile) {
      populateForm(profile);
    }
  }

  // Clear any validation errors
  clearFormErrors();

  // Show modal
  modal.classList.remove('hidden');
  console.log(`[Popup V2] Opened profile modal in ${mode} mode`);
}

/**
 * Close profile editor modal
 */
function closeProfileModal() {
  const modal = document.getElementById('profileModal');
  if (!modal) return;

  modal.classList.add('hidden');
  currentEditingProfileId = null;
  clearFormErrors();
  console.log('[Popup V2] Closed profile modal');
}

/**
 * Populate form with profile data for editing
 */
function populateForm(profile: AliasProfile) {
  // Profile info
  (document.getElementById('profileName') as HTMLInputElement).value = profile.profileName || '';
  (document.getElementById('profileDescription') as HTMLInputElement).value = profile.description || '';

  // Real information
  (document.getElementById('realName') as HTMLInputElement).value = profile.real.name || '';
  (document.getElementById('realEmail') as HTMLInputElement).value = profile.real.email || '';
  (document.getElementById('realPhone') as HTMLInputElement).value = profile.real.phone || '';
  (document.getElementById('realCellPhone') as HTMLInputElement).value = profile.real.cellPhone || '';
  (document.getElementById('realAddress') as HTMLInputElement).value = profile.real.address || '';
  (document.getElementById('realCompany') as HTMLInputElement).value = profile.real.company || '';

  // Alias information
  (document.getElementById('aliasName') as HTMLInputElement).value = profile.alias.name || '';
  (document.getElementById('aliasEmail') as HTMLInputElement).value = profile.alias.email || '';
  (document.getElementById('aliasPhone') as HTMLInputElement).value = profile.alias.phone || '';
  (document.getElementById('aliasCellPhone') as HTMLInputElement).value = profile.alias.cellPhone || '';
  (document.getElementById('aliasAddress') as HTMLInputElement).value = profile.alias.address || '';
  (document.getElementById('aliasCompany') as HTMLInputElement).value = profile.alias.company || '';

  // Enable toggle
  (document.getElementById('profileEnabled') as HTMLInputElement).checked = profile.enabled;
}

/**
 * Get form data
 */
function getFormData() {
  return {
    profileName: (document.getElementById('profileName') as HTMLInputElement).value.trim(),
    description: (document.getElementById('profileDescription') as HTMLInputElement).value.trim(),
    real: {
      name: (document.getElementById('realName') as HTMLInputElement).value.trim(),
      email: (document.getElementById('realEmail') as HTMLInputElement).value.trim(),
      phone: (document.getElementById('realPhone') as HTMLInputElement).value.trim(),
      cellPhone: (document.getElementById('realCellPhone') as HTMLInputElement).value.trim(),
      address: (document.getElementById('realAddress') as HTMLInputElement).value.trim(),
      company: (document.getElementById('realCompany') as HTMLInputElement).value.trim(),
      custom: {},
    },
    alias: {
      name: (document.getElementById('aliasName') as HTMLInputElement).value.trim(),
      email: (document.getElementById('aliasEmail') as HTMLInputElement).value.trim(),
      phone: (document.getElementById('aliasPhone') as HTMLInputElement).value.trim(),
      cellPhone: (document.getElementById('aliasCellPhone') as HTMLInputElement).value.trim(),
      address: (document.getElementById('aliasAddress') as HTMLInputElement).value.trim(),
      company: (document.getElementById('aliasCompany') as HTMLInputElement).value.trim(),
      custom: {},
    },
    enabled: (document.getElementById('profileEnabled') as HTMLInputElement).checked,
  };
}

/**
 * Validate form
 */
function validateForm(): boolean {
  let isValid = true;

  // Check required field: profileName
  const profileNameInput = document.getElementById('profileName') as HTMLInputElement;
  if (!profileNameInput.value.trim()) {
    profileNameInput.classList.add('error');
    isValid = false;
  } else {
    profileNameInput.classList.remove('error');
  }

  // Validate email fields if they have values
  const realEmailInput = document.getElementById('realEmail') as HTMLInputElement;
  const aliasEmailInput = document.getElementById('aliasEmail') as HTMLInputElement;

  if (realEmailInput.value.trim() && !isValidEmail(realEmailInput.value.trim())) {
    isValid = false;
  }

  if (aliasEmailInput.value.trim() && !isValidEmail(aliasEmailInput.value.trim())) {
    isValid = false;
  }

  return isValid;
}

/**
 * Validate individual email field
 */
function validateEmailField(input: HTMLInputElement): boolean {
  const errorSpan = document.getElementById(`${input.id}Error`);
  const value = input.value.trim();

  if (value && !isValidEmail(value)) {
    input.classList.add('error');
    errorSpan?.classList.remove('hidden');
    return false;
  } else {
    input.classList.remove('error');
    errorSpan?.classList.add('hidden');
    return true;
  }
}

/**
 * Clear all form validation errors
 */
function clearFormErrors() {
  const inputs = document.querySelectorAll('.form-group input');
  const errors = document.querySelectorAll('.form-error');

  inputs.forEach((input) => input.classList.remove('error'));
  errors.forEach((error) => error.classList.add('hidden'));
}

/**
 * Save profile (create or update)
 */
async function saveProfile() {
  console.log('[Popup V2] Saving profile...');

  // Validate form
  if (!validateForm()) {
    console.log('[Popup V2] Form validation failed');
    alert('Please fix the errors before saving');
    return;
  }

  // Get form data
  const formData = getFormData();

  // Validate at least one real/alias pair exists
  const hasData =
    (formData.real?.name && formData.alias?.name) ||
    (formData.real?.email && formData.alias?.email) ||
    (formData.real?.phone && formData.alias?.phone) ||
    (formData.real?.cellPhone && formData.alias?.cellPhone) ||
    (formData.real?.address && formData.alias?.address) ||
    (formData.real?.company && formData.alias?.company);

  if (!hasData) {
    alert('Please add at least one real and alias pair (e.g., real name and alias name)');
    return;
  }

  try {
    const store = useAppStore.getState();

    if (currentEditingProfileId) {
      // Update existing profile
      await store.updateProfile(currentEditingProfileId, formData);
      console.log('[Popup V2] Profile updated:', currentEditingProfileId);
    } else {
      // Create new profile
      await store.addProfile(formData);
      console.log('[Popup V2] New profile created');
    }

    // Close modal
    closeProfileModal();
  } catch (error) {
    console.error('[Popup V2] Error saving profile:', error);
    alert('Error saving profile. Please try again.');
  }
}

/**
 * Show delete confirmation modal
 */
function showDeleteConfirmation() {
  if (!currentEditingProfileId) return;

  const store = useAppStore.getState();
  const profile = store.profiles.find((p) => p.id === currentEditingProfileId);

  if (!profile) return;

  // Close profile modal first
  closeProfileModal();

  // Show delete confirmation modal
  const deleteModal = document.getElementById('deleteModal');
  const deleteProfileName = document.getElementById('deleteProfileName');

  if (deleteModal && deleteProfileName) {
    deleteProfileName.textContent = profile.profileName;
    deleteModal.classList.remove('hidden');
    console.log('[Popup V2] Showing delete confirmation for:', profile.profileName);
  }
}

/**
 * Close delete confirmation modal
 */
function closeDeleteModal() {
  const deleteModal = document.getElementById('deleteModal');
  if (!deleteModal) return;

  deleteModal.classList.add('hidden');
  currentEditingProfileId = null;
  console.log('[Popup V2] Closed delete confirmation modal');
}

/**
 * Confirm and delete profile
 */
async function confirmDeleteProfile() {
  if (!currentEditingProfileId) return;

  try {
    const store = useAppStore.getState();
    await store.deleteProfile(currentEditingProfileId);
    console.log('[Popup V2] Profile deleted:', currentEditingProfileId);

    closeDeleteModal();
  } catch (error) {
    console.error('[Popup V2] Error deleting profile:', error);
    alert('Error deleting profile. Please try again.');
  }
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
  const profile = store.profiles.find((p) => p.id === profileId);

  if (!profile) return;

  switch (action) {
    case 'toggle':
      await store.toggleProfile(profileId);
      break;

    case 'edit':
      openProfileModal('edit', profile);
      break;

    case 'delete':
      // Set the profile ID and show delete confirmation
      currentEditingProfileId = profileId;
      showDeleteConfirmation();
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
          perplexity: { requests: 0, substitutions: 0 },
          poe: { requests: 0, substitutions: 0 },
          copilot: { requests: 0, substitutions: 0 },
          you: { requests: 0, substitutions: 0 },
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

// ========== MINIMAL MODE ==========

/**
 * Switch to minimal mode
 */
function switchToMinimalMode() {
  const minimalView = document.getElementById('minimalView');
  const fullView = document.getElementById('fullView');

  if (minimalView && fullView) {
    minimalView.classList.remove('hidden');
    fullView.classList.add('hidden');
    document.body.classList.add('minimal-mode');

    // Save preference
    localStorage.setItem('popupMode', 'minimal');
    console.log('[Popup V2] Switched to minimal mode');
  }
}

/**
 * Switch to full mode
 */
function switchToFullMode() {
  const minimalView = document.getElementById('minimalView');
  const fullView = document.getElementById('fullView');

  if (minimalView && fullView) {
    minimalView.classList.add('hidden');
    fullView.classList.remove('hidden');
    document.body.classList.remove('minimal-mode');

    // Save preference
    localStorage.setItem('popupMode', 'full');
    console.log('[Popup V2] Switched to full mode');
  }
}

/**
 * Load saved mode preference
 */
function loadModePreference() {
  const savedMode = localStorage.getItem('popupMode') || 'full';

  if (savedMode === 'minimal') {
    switchToMinimalMode();
  } else {
    switchToFullMode();
  }
}

/**
 * Update minimal view with latest stats and activity
 */
function updateMinimalView(config: any) {
  if (!config) return;

  const minimalCount = document.getElementById('minimalCount');
  const minimalActivity = document.getElementById('minimalActivity');
  const pulseDot = document.querySelector('.pulse-dot');
  const activityIcon = document.querySelector('.activity-icon');

  if (minimalCount) {
    const todayCount = config.stats.totalSubstitutions || 0;
    minimalCount.textContent = todayCount.toString();
  }

  if (minimalActivity) {
    const latestLog = config.stats.activityLog?.[0];

    if (latestLog) {
      const timeAgo = formatRelativeTime(latestLog.timestamp);
      const count = latestLog.details.substitutionCount || 0;

      minimalActivity.textContent = `${count} items replaced (${timeAgo})`;

      // Trigger pulse animation if recent (< 5 seconds)
      const secondsAgo = Math.floor((Date.now() - latestLog.timestamp) / 1000);
      if (secondsAgo < 5) {
        pulseDot?.classList.add('active');
        activityIcon?.classList.add('active');

        setTimeout(() => {
          pulseDot?.classList.remove('active');
          activityIcon?.classList.remove('active');
        }, 1500);
      }
    } else {
      minimalActivity.textContent = 'No activity yet';
    }
  }
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
