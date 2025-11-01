/**
 * API Key Vault Component
 * Handles rendering and managing API keys in the Features tab
 */

import { APIKey, APIKeyVaultConfig, UserConfig } from '../../lib/types';
import { useAppStore } from '../../lib/store';
import { chromeApi } from '../api/chromeApi';
import { escapeHtml } from './utils';

/**
 * Render API keys list with project grouping
 */
export function renderAPIKeys(config: UserConfig) {
  const keysList = document.getElementById('apiKeysList');
  const emptyState = document.getElementById('apiKeysEmptyState');

  if (!keysList || !emptyState) return;

  const keys = config.apiKeyVault?.keys || [];
  const userTier = config.account?.tier || 'free';

  if (keys.length === 0) {
    keysList.style.display = 'none';
    emptyState.style.display = 'flex';
  } else {
    keysList.style.display = 'block';
    emptyState.style.display = 'none';

    // Group keys by project
    const keysByProject = groupKeysByProject(keys);

    // Render grouped keys with limit indicator
    keysList.innerHTML = renderKeyLimitIndicator(keys.length, userTier) +
                         renderProjectGroups(keysByProject) +
                         renderUpgradeCTA(keys.length, userTier);

    // Add event listeners
    keys.forEach(key => {
      const card = document.querySelector(`[data-key-id="${key.id}"]`);
      if (!card) return;

      // Toggle enable/disable
      const toggleBtn = card.querySelector('.api-key-toggle');
      toggleBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleAPIKey(key.id);
      });

      // Delete key
      const deleteBtn = card.querySelector('.api-key-delete');
      deleteBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteAPIKey(key.id, key.name || 'Unnamed key');
      });

      // Show/hide key value
      const showBtn = card.querySelector('.api-key-show');
      const keyValue = card.querySelector('.api-key-value');
      showBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = keyValue?.getAttribute('data-hidden') === 'true';
        if (isHidden) {
          keyValue?.setAttribute('data-hidden', 'false');
          keyValue!.textContent = key.keyValue;
          const icon = showBtn.querySelector('.show-icon');
          if (icon) icon.textContent = '👁️‍🗨️';
        } else {
          keyValue?.setAttribute('data-hidden', 'true');
          keyValue!.textContent = maskAPIKey(key.keyValue);
          const icon = showBtn.querySelector('.show-icon');
          if (icon) icon.textContent = '👁️';
        }
      });

      // Copy key value
      const copyBtn = card.querySelector('.api-key-copy');
      copyBtn?.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(key.keyValue);

          // Visual feedback
          const icon = copyBtn.querySelector('.copy-icon');
          const originalIcon = icon?.textContent;

          if (icon) icon.textContent = '✓';
          copyBtn.classList.add('copied');

          setTimeout(() => {
            if (icon && originalIcon) icon.textContent = originalIcon;
            copyBtn.classList.remove('copied');
          }, 2000);

          console.log('[API Key Vault] Copied key to clipboard');
        } catch (error) {
          console.error('[API Key Vault] Failed to copy:', error);
          alert('Failed to copy to clipboard.');
        }
      });
    });
  }

  // Update protection mode
  updateProtectionMode(config);

  console.log(`[API Key Vault] Rendered ${keys.length} keys in ${Object.keys(groupKeysByProject(keys)).length} projects`);
}

/**
 * Group keys by project
 */
function groupKeysByProject(keys: APIKey[]): Record<string, APIKey[]> {
  const groups: Record<string, APIKey[]> = {};

  keys.forEach(key => {
    const project = key.project || 'Ungrouped';
    if (!groups[project]) {
      groups[project] = [];
    }
    groups[project].push(key);
  });

  return groups;
}

/**
 * Render key limit indicator
 */
function renderKeyLimitIndicator(keyCount: number, userTier: string): string {
  const maxKeys = userTier === 'free' ? 10 : Infinity;
  const percentage = userTier === 'free' ? Math.min((keyCount / maxKeys) * 100, 100) : 0;
  const isNearLimit = userTier === 'free' && keyCount >= maxKeys * 0.7;
  const isAtLimit = userTier === 'free' && keyCount >= maxKeys;

  if (userTier !== 'free') {
    return `
      <div class="key-limit-indicator unlimited">
        <div class="limit-text">
          <span class="limit-icon">✓</span>
          <span><strong>${keyCount}</strong> ${keyCount === 1 ? 'key' : 'keys'} protected</span>
          <span class="limit-badge pro">PRO - Unlimited</span>
        </div>
      </div>
    `;
  }

  return `
    <div class="key-limit-indicator ${isAtLimit ? 'at-limit' : isNearLimit ? 'near-limit' : ''}">
      <div class="limit-text">
        <span class="limit-icon">${isAtLimit ? '⚠️' : '🔑'}</span>
        <span><strong>${keyCount} / ${maxKeys}</strong> keys used</span>
        <span class="limit-badge free">FREE Tier</span>
      </div>
      <div class="limit-bar">
        <div class="limit-bar-fill" style="width: ${percentage}%"></div>
      </div>
      ${isAtLimit ? '<p class="limit-warning">You\'ve reached the FREE tier limit. Upgrade to PRO for unlimited keys.</p>' : ''}
    </div>
  `;
}

/**
 * Render project groups
 */
function renderProjectGroups(keysByProject: Record<string, APIKey[]>): string {
  return Object.entries(keysByProject)
    .sort(([a], [b]) => {
      // Sort: Ungrouped last, others alphabetically
      if (a === 'Ungrouped') return 1;
      if (b === 'Ungrouped') return -1;
      return a.localeCompare(b);
    })
    .map(([projectName, keys]) => `
      <div class="project-group">
        <div class="project-header">
          <h4 class="project-name">${escapeHtml(projectName)}</h4>
          <span class="project-count">${keys.length} ${keys.length === 1 ? 'key' : 'keys'}</span>
        </div>
        <div class="project-keys">
          ${keys.map(key => renderAPIKeyCard(key)).join('')}
        </div>
      </div>
    `).join('');
}

/**
 * Render upgrade CTA
 */
function renderUpgradeCTA(keyCount: number, userTier: string): string {
  if (userTier !== 'free') return '';

  const maxKeys = 10;
  const isNearLimit = keyCount >= maxKeys * 0.7;

  if (!isNearLimit) return '';

  return `
    <div class="upgrade-cta-card">
      <div class="upgrade-cta-icon">🚀</div>
      <div class="upgrade-cta-content">
        <h4 class="upgrade-cta-title">Need more API key protection?</h4>
        <p class="upgrade-cta-description">
          Upgrade to PRO for <strong>unlimited API key storage</strong>, plus advanced protection features and priority support.
        </p>
        <button class="btn btn-primary upgrade-btn" id="upgradeBtn">
          <span class="upgrade-icon">⬆️</span>
          Upgrade to PRO
        </button>
      </div>
    </div>
  `;
}

/**
 * Render a single API key card
 */
function renderAPIKeyCard(key: APIKey): string {
  const maskedKey = maskAPIKey(key.keyValue);
  const lastUsedText = key.lastUsed ? formatDate(key.lastUsed) : 'Never';

  return `
    <div class="api-key-card ${key.enabled ? '' : 'disabled'}" data-key-id="${key.id}">
      <div class="api-key-header">
        <span class="api-key-format-badge">${key.format.toUpperCase()}</span>
        <h4 class="api-key-name">${escapeHtml(key.name || 'Unnamed Key')}</h4>
        <label class="api-key-toggle-label">
          <input type="checkbox" class="api-key-toggle" ${key.enabled ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
        <button class="api-key-delete icon-button" title="Delete key">🗑️</button>
      </div>
      <div class="api-key-value-row">
        <code class="api-key-value" data-hidden="true">${maskedKey}</code>
        <button class="api-key-show icon-button" title="Show/Hide key">
          <span class="show-icon">👁️</span>
        </button>
        <button class="api-key-copy icon-button" title="Copy to clipboard">
          <span class="copy-icon">📋</span>
        </button>
      </div>
      <div class="api-key-stats">
        <div class="api-key-stat">
          <span class="api-key-stat-icon">🛡️</span>
          <span class="api-key-stat-value">${key.protectionCount}</span>
          <span class="api-key-stat-label">protected</span>
        </div>
        <div class="api-key-stat">
          <span class="api-key-stat-icon">🕐</span>
          <span class="api-key-stat-value">${lastUsedText}</span>
          <span class="api-key-stat-label">last used</span>
        </div>
        <div class="api-key-stat">
          <span class="api-key-stat-icon">📅</span>
          <span class="api-key-stat-value">${formatDate(key.createdAt)}</span>
          <span class="api-key-stat-label">created</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Mask API key for display
 */
function maskAPIKey(key: string): string {
  if (key.length <= 10) return '***' + key.slice(-4);
  return key.slice(0, 3) + '...' + key.slice(-6);
}

/**
 * Format timestamp to readable date
 */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = Date.now();
  const diff = now - timestamp;

  // Less than 1 minute
  if (diff < 60 * 1000) return 'Just now';

  // Less than 1 hour
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `${minutes}m ago`;
  }

  // Less than 1 day
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return `${hours}h ago`;
  }

  // Less than 7 days
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return `${days}d ago`;
  }

  // Format as date
  return date.toLocaleDateString();
}

// escapeHtml now imported from './utils'

/**
 * Toggle API key enabled state
 */
async function toggleAPIKey(keyId: string) {
  try {
    const store = useAppStore.getState();
    const key = store.config?.apiKeyVault?.keys.find(k => k.id === keyId);
    if (!key) return;

    // Update key enabled state
    await chromeApi.updateAPIKey(keyId, { enabled: !key.enabled });

    // Reload config
    await store.loadConfig();

    console.log(`[API Key Vault] Toggled key ${keyId} to ${!key.enabled}`);
  } catch (error) {
    console.error('[API Key Vault] Error toggling key:', error);
    alert('Failed to toggle key. Please try again.');
  }
}

/**
 * Delete API key
 */
async function deleteAPIKey(keyId: string, keyName: string) {
  const confirmed = confirm(`Are you sure you want to delete "${keyName}"?\n\nThis action cannot be undone.`);
  if (!confirmed) return;

  try {
    // Send delete message to background
    await chromeApi.removeAPIKey(keyId);

    // Reload config
    const store = useAppStore.getState();
    await store.loadConfig();

    console.log(`[API Key Vault] Deleted key ${keyId}`);
  } catch (error) {
    console.error('[API Key Vault] Error deleting key:', error);
    alert('Failed to delete key. Please try again.');
  }
}

/**
 * Update protection mode UI
 */
function updateProtectionMode(config: UserConfig) {
  const modeInputs = document.querySelectorAll('input[name="apiKeyMode"]');
  const currentMode = config.apiKeyVault?.mode || 'warn-first';

  modeInputs.forEach(input => {
    const radioInput = input as HTMLInputElement;
    radioInput.checked = radioInput.value === currentMode;

    // Add change listener
    radioInput.addEventListener('change', async () => {
      if (radioInput.checked) {
        await updateProtectionModeSetting(radioInput.value as APIKeyVaultConfig['mode']);
      }
    });
  });
}

/**
 * Update protection mode setting
 */
async function updateProtectionModeSetting(mode: APIKeyVaultConfig['mode']) {
  try {
    await chromeApi.updateAPIKeyVaultSettings({ mode });

    // Reload config
    const store = useAppStore.getState();
    await store.loadConfig();

    console.log(`[API Key Vault] Updated protection mode to ${mode}`);
  } catch (error) {
    console.error('[API Key Vault] Error updating protection mode:', error);
    alert('Failed to update protection mode. Please try again.');
  }
}

/**
 * Initialize API Key Vault UI handlers
 */
export function initAPIKeyVaultUI() {
  // Dynamic import to avoid circular dependency
  import('./apiKeyModal').then(({ showAddAPIKeyModal }) => {
    // Add API Key button handlers
    const addKeyBtn = document.getElementById('addAPIKeyBtn');
    const addKeyBtnEmpty = document.getElementById('addAPIKeyBtnEmpty');

    addKeyBtn?.addEventListener('click', () => {
      showAddAPIKeyModal();
    });

    addKeyBtnEmpty?.addEventListener('click', () => {
      showAddAPIKeyModal();
    });

    console.log('[API Key Vault] UI handlers initialized');
  });
}
