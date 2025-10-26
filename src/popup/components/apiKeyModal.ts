/**
 * API Key Modal Component
 * Handles the add/edit API key modal
 */

import { useAppStore } from '../../lib/store';
import { renderAPIKeys } from './apiKeyVault';
import { chromeApi } from '../api/chromeApi';
import { APIKeyDetector } from '../../lib/apiKeyDetector';

interface ParsedEnvKey {
  name: string;
  value: string;
  format: string;
  selected: boolean;
}

let parsedEnvKeys: ParsedEnvKey[] = [];

/**
 * Initialize API Key modal handlers
 */
export function initAPIKeyModal() {
  setupAPIKeyModalHandlers();
  setupImportMethodTabs();
  setupPasteButton();
  setupEnvParser();
  console.log('[API Key Modal] Initialized with .env import');
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

  // Reset to manual tab
  switchImportMethod('manual');

  // Clear parsed env keys
  parsedEnvKeys = [];
  const envPreview = document.getElementById('envPreview');
  if (envPreview) envPreview.style.display = 'none';

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

  keyValueInput.removeEventListener('input', handleKeyInput);
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
  const manualContent = document.getElementById('manualEntryContent');
  const isManualMode = manualContent?.classList.contains('active');

  if (isManualMode) {
    await handleSaveManualKey();
  } else {
    await handleImportEnvKeys();
  }
}

/**
 * Handle saving manual key entry
 */
async function handleSaveManualKey() {
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
      errorSpan.textContent = 'Please enter a valid API key (minimum 10 characters)';
      errorSpan.classList.remove('hidden');
    }
    return;
  }

  try {
    // Send message to background to add key
    await chromeApi.addAPIKey({
      name: keyName || undefined,
      project: keyProject || undefined,
      keyValue: keyValue,
    });

    // Success - chromeApi throws on error, so we only get here if successful
    // Close modal
    modal?.classList.add('hidden');

    // Reload config and re-render
    const store = useAppStore.getState();
    await store.loadConfig();
    if (store.config) {
      renderAPIKeys(store.config);
    }

    console.log('[API Key Modal] API key added successfully');
  } catch (error) {
    console.error('[API Key Modal] Error saving API key:', error);
    if (errorSpan) {
      errorSpan.textContent = 'Failed to save API key. Please try again.';
      errorSpan.classList.remove('hidden');
    }
  }
}

/**
 * Handle importing keys from .env file
 */
async function handleImportEnvKeys() {
  const modal = document.getElementById('apiKeyModal');
  const projectInput = document.getElementById('envProjectName') as HTMLInputElement;
  const projectName = projectInput?.value.trim();

  const selectedKeys = parsedEnvKeys.filter(k => k.selected);

  if (selectedKeys.length === 0) {
    alert('Please select at least one key to import');
    return;
  }

  try {
    let successCount = 0;
    let failCount = 0;

    for (const key of selectedKeys) {
      try {
        await chromeApi.addAPIKey({
          name: key.name,
          project: projectName || undefined,
          keyValue: key.value,
        });
        successCount++;
      } catch (error) {
        console.error(`[API Key Modal] Failed to import ${key.name}:`, error);
        failCount++;
      }
    }

    if (failCount > 0) {
      alert(`Imported ${successCount} keys.\n${failCount} keys failed.`);
    } else {
      modal?.classList.add('hidden');
    }

    // Reload config and re-render
    const store = useAppStore.getState();
    await store.loadConfig();
    if (store.config) {
      renderAPIKeys(store.config);
    }

    console.log(`[API Key Modal] Bulk import complete: ${successCount} success, ${failCount} failed`);
  } catch (error) {
    console.error('[API Key Modal] Error during bulk import:', error);
    alert('Failed to import keys. Please try again.');
  }
}

/**
 * Setup import method tabs (manual vs .env)
 */
function setupImportMethodTabs() {
  const tabButtons = document.querySelectorAll('.modal-tab-btn');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const method = btn.getAttribute('data-import-method');
      if (method) {
        switchImportMethod(method);
      }
    });
  });
}

/**
 * Switch between import methods
 */
function switchImportMethod(method: string) {
  const tabButtons = document.querySelectorAll('.modal-tab-btn');
  tabButtons.forEach(btn => {
    if (btn.getAttribute('data-import-method') === method) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  const manualContent = document.getElementById('manualEntryContent');
  const envContent = document.getElementById('envImportContent');
  const saveBtnText = document.getElementById('saveKeyBtnText');

  if (method === 'manual') {
    manualContent?.classList.add('active');
    envContent?.classList.remove('active');
    if (saveBtnText) saveBtnText.textContent = 'Save Key';
  } else {
    manualContent?.classList.remove('active');
    envContent?.classList.add('active');
    if (saveBtnText) saveBtnText.textContent = 'Import Selected Keys';
  }
}

/**
 * Setup paste button
 */
function setupPasteButton() {
  const pasteBtn = document.getElementById('pasteKeyBtn');
  const keyValueInput = document.getElementById('apiKeyValue') as HTMLTextAreaElement;

  pasteBtn?.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && keyValueInput) {
        keyValueInput.value = text;
        // Trigger the input event manually to run detection
        const event = new Event('input', { bubbles: true });
        keyValueInput.dispatchEvent(event);
      }
    } catch (error) {
      console.error('[API Key Modal] Failed to read clipboard:', error);
      alert('Failed to read clipboard. Please paste manually.');
    }
  });
}

/**
 * Setup .env parser
 */
function setupEnvParser() {
  const parseBtn = document.getElementById('parseEnvBtn');
  const envTextarea = document.getElementById('envFileContent') as HTMLTextAreaElement;

  parseBtn?.addEventListener('click', () => {
    const envContent = envTextarea?.value || '';
    if (!envContent.trim()) {
      alert('Please paste your .env file content first');
      return;
    }
    parseEnvFile(envContent);
  });
}

/**
 * Parse .env file and extract API keys
 */
function parseEnvFile(content: string) {
  const lines = content.split('\n');
  const detected: ParsedEnvKey[] = [];

  lines.forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;

    const match = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*["']?(.+?)["']?$/);
    if (!match) return;

    const [, name, value] = match;
    const cleanValue = value.trim();

    const detectedKeys = APIKeyDetector.detect(cleanValue, {
      includeGeneric: false
    });

    if (detectedKeys.length > 0) {
      detected.push({
        name,
        value: cleanValue,
        format: detectedKeys[0].format,
        selected: true
      });
    }
  });

  if (detected.length === 0) {
    alert('No API keys detected in .env file.');
    return;
  }

  parsedEnvKeys = detected;
  renderEnvPreview(detected);
  console.log(`[API Key Modal] Parsed ${detected.length} keys from .env file`);
}

/**
 * Render preview of detected keys
 */
function renderEnvPreview(keys: ParsedEnvKey[]) {
  const preview = document.getElementById('envPreview');
  const detectedKeysContainer = document.getElementById('envDetectedKeys');
  const keyCount = document.getElementById('envKeyCount');

  if (!preview || !detectedKeysContainer) return;

  if (keyCount) {
    keyCount.textContent = `(${keys.length})`;
  }

  detectedKeysContainer.innerHTML = keys.map((key, index) => `
    <label class="env-key-item">
      <input type="checkbox" class="env-key-checkbox" data-index="${index}" ${key.selected ? 'checked' : ''}>
      <div class="env-key-info">
        <div class="env-key-header">
          <span class="env-key-name">${escapeHtml(key.name)}</span>
          <span class="env-key-format">${key.format.toUpperCase()}</span>
        </div>
        <code class="env-key-value">${maskKey(key.value)}</code>
      </div>
    </label>
  `).join('');

  const checkboxes = detectedKeysContainer.querySelectorAll('.env-key-checkbox');
  checkboxes.forEach((checkbox, index) => {
    checkbox.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      parsedEnvKeys[index].selected = target.checked;
    });
  });

  preview.style.display = 'block';
  preview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Mask key for preview
 */
function maskKey(key: string): string {
  if (key.length <= 10) return '***' + key.slice(-4);
  return key.slice(0, 8) + '...' + key.slice(-6);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
