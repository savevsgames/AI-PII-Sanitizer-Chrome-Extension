/**
 * API Key Modal Component
 * Handles the add/edit API key modal
 */

import { useAppStore } from '../../lib/store';
import { renderAPIKeys } from './apiKeyVault';

/**
 * Initialize API Key modal handlers
 */
export function initAPIKeyModal() {
  setupAPIKeyModalHandlers();
  console.log('[API Key Modal] Initialized');
}

/**
 * Show add API key modal
 */
export function showAddAPIKeyModal() {
  const modal = document.getElementById('apiKeyModal');
  const modalTitle = document.getElementById('apiKeyModalTitle');
  const form = document.getElementById('apiKeyForm') as HTMLFormElement;
  const keyValueInput = document.getElementById('apiKeyValue') as HTMLTextAreaElement;
  const detectedFormat = document.getElementById('apiKeyDetectedFormat');
  const tierWarning = document.getElementById('apiKeyTierWarning');
  const errorSpan = document.getElementById('apiKeyError');

  if (!modal || !form) return;

  // Reset form
  form.reset();
  if (errorSpan) errorSpan.classList.add('hidden');
  if (tierWarning) tierWarning.style.display = 'none';
  if (detectedFormat) detectedFormat.textContent = '';
  if (modalTitle) modalTitle.textContent = 'Add API Key';

  // Show modal
  modal.classList.remove('hidden');

  // Add key value change listener for auto-detection
  const handleKeyInput = () => {
    const keyValue = keyValueInput.value.trim();
    if (keyValue.length > 10) {
      const format = detectKeyFormatUI(keyValue);
      if (detectedFormat) {
        detectedFormat.textContent = `✓ Detected: ${format.toUpperCase()} key`;
      }

      // Check tier restrictions
      const store = useAppStore.getState();
      const userTier = store.config?.account?.tier || 'free';
      if (userTier === 'free' && format !== 'openai') {
        if (tierWarning) tierWarning.style.display = 'block';
      } else {
        if (tierWarning) tierWarning.style.display = 'none';
      }
    } else {
      if (detectedFormat) detectedFormat.textContent = '';
      if (tierWarning) tierWarning.style.display = 'none';
    }
  };

  keyValueInput.addEventListener('input', handleKeyInput);

  console.log('[API Key Modal] Modal opened');
}

/**
 * Detect API key format (UI version)
 */
function detectKeyFormatUI(key: string): string {
  if (/^sk-(proj-)?[A-Za-z0-9]{48,}/.test(key)) return 'openai';
  if (/^sk-ant-[A-Za-z0-9-]{95}/.test(key)) return 'anthropic';
  if (/^AIza[A-Za-z0-9_-]{35}/.test(key)) return 'google';
  if (/^(AKIA|ASIA)[A-Z0-9]{16}/.test(key)) return 'aws';
  if (/^gh[ps]_[A-Za-z0-9]{36}/.test(key)) return 'github';
  if (/^(sk|pk)_(live|test)_[A-Za-z0-9]{24,}/.test(key)) return 'stripe';
  return 'generic';
}

/**
 * Setup API Key modal handlers
 */
function setupAPIKeyModalHandlers() {
  const modal = document.getElementById('apiKeyModal');
  const closeBtn = document.getElementById('apiKeyModalClose');
  const cancelBtn = document.getElementById('apiKeyModalCancel');
  const saveBtn = document.getElementById('apiKeyModalSave');
  const form = document.getElementById('apiKeyForm') as HTMLFormElement;

  if (!modal) return;

  // Close modal handlers
  [closeBtn, cancelBtn].forEach(btn => {
    btn?.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  });

  // Overlay click to close
  modal.querySelector('.modal-overlay')?.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  // Save handler
  saveBtn?.addEventListener('click', async () => {
    await handleSaveAPIKey();
  });

  // Form submit handler
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleSaveAPIKey();
  });

  console.log('[API Key Modal] Modal handlers setup');
}

/**
 * Handle saving API key
 */
async function handleSaveAPIKey() {
  const keyValueInput = document.getElementById('apiKeyValue') as HTMLTextAreaElement;
  const keyNameInput = document.getElementById('apiKeyName') as HTMLInputElement;
  const keyProjectInput = document.getElementById('apiKeyProject') as HTMLInputElement;
  const errorSpan = document.getElementById('apiKeyError');
  const modal = document.getElementById('apiKeyModal');

  const keyValue = keyValueInput.value.trim();
  const keyName = keyNameInput.value.trim();
  const keyProject = keyProjectInput.value.trim();

  // Validate
  if (!keyValue || keyValue.length < 10) {
    if (errorSpan) {
      errorSpan.textContent = 'Please enter a valid API key';
      errorSpan.classList.remove('hidden');
    }
    return;
  }

  try {
    // Send message to background to add key
    const response = await chrome.runtime.sendMessage({
      type: 'ADD_API_KEY',
      payload: {
        name: keyName || undefined,
        project: keyProject || undefined,
        keyValue: keyValue,
      }
    });

    if (response.success) {
      // Close modal
      modal?.classList.add('hidden');

      // Reload config and re-render
      const store = useAppStore.getState();
      await store.loadConfig();
      if (store.config) {
        renderAPIKeys(store.config);
      }

      console.log('[API Key Modal] API key added successfully');
    } else {
      // Show error
      if (errorSpan) {
        errorSpan.textContent = response.error || 'Failed to save API key';
        errorSpan.classList.remove('hidden');
      }
      console.error('[API Key Modal] Error adding key:', response.error);
    }
  } catch (error) {
    console.error('[API Key Modal] Error saving API key:', error);
    if (errorSpan) {
      errorSpan.textContent = 'Failed to save API key. Please try again.';
      errorSpan.classList.remove('hidden');
    }
  }
}
