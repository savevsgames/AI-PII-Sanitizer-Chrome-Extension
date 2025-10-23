# API Key Vault UI Upgrades - Implementation Guide

## 🎯 Overview

This document contains **step-by-step instructions** to upgrade the API Key Vault UI with:
- ✅ .env file import (paste entire file, auto-extract keys)
- ✅ Paste button for clipboard integration
- ✅ Copy button on each key card
- ✅ Show/Hide toggle for key values
- ✅ Improved vertical form layout

---

## 📋 Step 1: Update `apiKeyModal.ts`

### Add new imports at the top (after existing imports):

```typescript
import { APIKeyDetector } from '../../lib/apiKeyDetector';

interface ParsedEnvKey {
  name: string;
  value: string;
  format: string;
  selected: boolean;
}

let parsedEnvKeys: ParsedEnvKey[] = [];
```

### Update `initAPIKeyModal()` function:

**Find:**
```typescript
export function initAPIKeyModal() {
  setupAPIKeyModalHandlers();
  console.log('[API Key Modal] Initialized');
}
```

**Replace with:**
```typescript
export function initAPIKeyModal() {
  setupAPIKeyModalHandlers();
  setupImportMethodTabs();
  setupPasteButton();
  setupEnvParser();
  console.log('[API Key Modal] Initialized with .env import');
}
```

### Update `showAddAPIKeyModal()` function:

**Find the line:**
```typescript
  // Show modal
  modal.classList.remove('hidden');
```

**Add BEFORE it:**
```typescript
  // Reset to manual tab
  switchImportMethod('manual');

  // Clear parsed env keys
  parsedEnvKeys = [];
  const envPreview = document.getElementById('envPreview');
  if (envPreview) envPreview.style.display = 'none';
```

**Also update the event listener line from:**
```typescript
  keyValueInput.addEventListener('input', handleKeyInput);
```

**To:**
```typescript
  keyValueInput.removeEventListener('input', handleKeyInput);
  keyValueInput.addEventListener('input', handleKeyInput);
```

### Add new helper functions at the end of the file (before the closing brace):

```typescript
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
        handleKeyInput();
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

function maskKey(key: string): string {
  if (key.length <= 10) return '***' + key.slice(-4);
  return key.slice(0, 8) + '...' + key.slice(-6);
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

### Update `handleSaveAPIKey()` function:

**Replace entire function with:**
```typescript
async function handleSaveAPIKey() {
  const manualContent = document.getElementById('manualEntryContent');
  const isManualMode = manualContent?.classList.contains('active');

  if (isManualMode) {
    await handleSaveManualKey();
  } else {
    await handleImportEnvKeys();
  }
}

async function handleSaveManualKey() {
  const keyValueInput = document.getElementById('apiKeyValue') as HTMLTextAreaElement;
  const keyNameInput = document.getElementById('apiKeyName') as HTMLInputElement;
  const keyProjectInput = document.getElementById('apiKeyProject') as HTMLInputElement;
  const errorSpan = document.getElementById('apiKeyError');
  const modal = document.getElementById('apiKeyModal');

  const keyValue = keyValueInput.value.trim();
  const keyName = keyNameInput.value.trim();
  const keyProject = keyProjectInput.value.trim();

  if (!keyValue || keyValue.length < 10) {
    if (errorSpan) {
      errorSpan.textContent = 'Please enter a valid API key (minimum 10 characters)';
      errorSpan.classList.remove('hidden');
    }
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'ADD_API_KEY',
      payload: {
        name: keyName || undefined,
        project: keyProject || undefined,
        keyValue: keyValue,
      }
    });

    if (response.success) {
      modal?.classList.add('hidden');
      const store = useAppStore.getState();
      await store.loadConfig();
      if (store.config) {
        renderAPIKeys(store.config);
      }
      console.log('[API Key Modal] API key added successfully');
    } else {
      if (errorSpan) {
        errorSpan.textContent = response.error || response.message || 'Failed to save API key';
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
        const response = await chrome.runtime.sendMessage({
          type: 'ADD_API_KEY',
          payload: {
            name: key.name,
            project: projectName || undefined,
            keyValue: key.value,
          }
        });

        if (response.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        failCount++;
      }
    }

    if (failCount > 0) {
      alert(`Imported ${successCount} keys.\n${failCount} keys failed.`);
    } else {
      modal?.classList.add('hidden');
    }

    const store = useAppStore.getState();
    await store.loadConfig();
    if (store.config) {
      renderAPIKeys(store.config);
    }
  } catch (error) {
    console.error('[API Key Modal] Error during bulk import:', error);
    alert('Failed to import keys. Please try again.');
  }
}
```

---

## 📋 Step 2: Update `apiKeyVault.ts`

### Find the `renderAPIKeys()` function and update the event listener attachment:

**Find this section (around line 36-70):**
```typescript
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
          showBtn.textContent = '👁️‍🗨️';
        } else {
          keyValue?.setAttribute('data-hidden', 'true');
          keyValue!.textContent = maskAPIKey(key.keyValue);
          showBtn.textContent = '👁️';
        }
      });
    });
```

**Add AFTER the show/hide listener (before the closing brace):**
```typescript
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
        } catch (error) {
          console.error('[API Key Vault] Failed to copy:', error);
          alert('Failed to copy to clipboard.');
        }
      });
```

### Update `renderAPIKeyCard()` function:

**Find this section (around line 200-202):**
```typescript
          <div class="api-key-value-row">
            <code class="api-key-value" data-hidden="true">${maskedKey}</code>
            <button class="api-key-show icon-button" title="Show/Hide key">👁️</button>
          </div>
```

**Replace with:**
```typescript
          <div class="api-key-value-row">
            <code class="api-key-value" data-hidden="true">${maskedKey}</code>
            <div class="api-key-value-actions">
              <button class="api-key-show icon-button" title="Show/Hide key">
                <span class="show-icon">👁️</span>
              </button>
              <button class="api-key-copy icon-button" title="Copy to clipboard">
                <span class="copy-icon">📋</span>
              </button>
            </div>
          </div>
```

### Update stats display (around line 213-225):

**Find:**
```typescript
      <div class="api-key-stats">
        <div class="api-key-stat">
          <span class="api-key-stat-label">Protected</span>
          <span class="api-key-stat-value">${key.protectionCount} times</span>
        </div>
        <div class="api-key-stat">
          <span class="api-key-stat-label">Last used</span>
          <span class="api-key-stat-value">${lastUsedText}</span>
        </div>
        <div class="api-key-stat">
          <span class="api-key-stat-label">Added</span>
          <span class="api-key-stat-value">${formatDate(key.createdAt)}</span>
        </div>
      </div>
```

**Replace with:**
```typescript
      <div class="api-key-stats">
        <div class="api-key-stat">
          <span class="api-key-stat-icon">🛡️</span>
          <div class="api-key-stat-content">
            <span class="api-key-stat-value">${key.protectionCount}</span>
            <span class="api-key-stat-label">protected</span>
          </div>
        </div>
        <div class="api-key-stat">
          <span class="api-key-stat-icon">🕐</span>
          <div class="api-key-stat-content">
            <span class="api-key-stat-value">${lastUsedText}</span>
            <span class="api-key-stat-label">last used</span>
          </div>
        </div>
        <div class="api-key-stat">
          <span class="api-key-stat-icon">📅</span>
          <div class="api-key-stat-content">
            <span class="api-key-stat-value">${formatDate(key.createdAt)}</span>
            <span class="api-key-stat-label">created</span>
          </div>
        </div>
      </div>
```

---

## 📋 Step 3: Update `popup-v2.html` - Modal Structure

**Find the modal section (around line 440-491) that starts with:**
```html
  <div class="modal hidden" id="apiKeyModal">
```

**Replace the ENTIRE modal (from opening `<div class="modal hidden" id="apiKeyModal">` to its closing `</div>`) with:**

```html
  <!-- API Key Modal with .env Import -->
  <div class="modal hidden" id="apiKeyModal">
    <div class="modal-overlay"></div>
    <div class="modal-content modal-large">
      <div class="modal-header">
        <h3 id="apiKeyModalTitle">Add API Key</h3>
        <button class="modal-close" id="apiKeyModalClose">&times;</button>
      </div>

      <!-- Import Method Tabs -->
      <div class="modal-tabs">
        <button class="modal-tab-btn active" data-import-method="manual">
          <span class="tab-icon">✏️</span>
          Manual Entry
        </button>
        <button class="modal-tab-btn" data-import-method="env">
          <span class="tab-icon">📄</span>
          Import from .env
        </button>
      </div>

      <form class="modal-body" id="apiKeyForm">
        <!-- MANUAL ENTRY TAB -->
        <div class="import-method-content active" id="manualEntryContent">
          <div class="form-section form-vertical">

            <div class="form-group">
              <label for="apiKeyValue">
                API Key <span class="required-label">*</span>
              </label>
              <div class="input-with-button">
                <textarea
                  id="apiKeyValue"
                  name="keyValue"
                  placeholder="Paste your API key here..."
                  required
                  rows="4"
                  class="api-key-textarea"></textarea>
                <button type="button" class="btn-icon-overlay" id="pasteKeyBtn" title="Paste from clipboard">
                  📋 Paste
                </button>
              </div>
              <div class="form-feedback">
                <span class="form-hint detected" id="apiKeyDetectedFormat"></span>
                <span class="form-error hidden" id="apiKeyError"></span>
              </div>
            </div>

            <div class="form-group">
              <label for="apiKeyName">
                Nickname <span class="optional-label">(optional)</span>
              </label>
              <input
                type="text"
                id="apiKeyName"
                name="name"
                placeholder="e.g., Production OpenAI Key"
                maxlength="50">
              <span class="form-hint">Give this key a friendly name</span>
            </div>

            <div class="form-group">
              <label for="apiKeyProject">
                Project <span class="optional-label">(optional)</span>
              </label>
              <input
                type="text"
                id="apiKeyProject"
                name="project"
                placeholder="e.g., Work, Personal"
                maxlength="50"
                list="projectSuggestions">
              <datalist id="projectSuggestions"></datalist>
              <span class="form-hint">Group keys by project</span>
            </div>

            <div class="form-group tier-warning-group" id="apiKeyTierWarning" style="display: none;">
              <div class="tier-warning">
                <span class="tier-warning-icon">⚠️</span>
                <div class="tier-warning-text">
                  <strong>FREE Tier Limitation</strong>
                  <p>FREE tier only protects OpenAI keys. Upgrade to PRO for GitHub, AWS, Stripe, and more.</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- .ENV IMPORT TAB -->
        <div class="import-method-content" id="envImportContent">
          <div class="form-section">

            <div class="env-instructions">
              <h4>📄 Import keys from your .env file</h4>
              <p>Paste your .env file contents below. We'll automatically detect and extract all API keys.</p>
            </div>

            <div class="form-group">
              <label for="envFileContent">.env File Content</label>
              <textarea
                id="envFileContent"
                name="envContent"
                placeholder="OPENAI_API_KEY=sk-proj-...&#10;GITHUB_TOKEN=ghp_...&#10;AWS_ACCESS_KEY_ID=AKIA..."
                rows="12"
                class="env-textarea"></textarea>
            </div>

            <button type="button" class="btn btn-secondary btn-block btn-parse" id="parseEnvBtn">
              <span class="btn-icon">🔍</span>
              Parse .env File
            </button>

            <div class="env-preview" id="envPreview" style="display: none;">
              <h4>✅ Detected Keys <span id="envKeyCount" class="env-count"></span></h4>
              <div id="envDetectedKeys" class="env-detected-keys"></div>

              <div class="form-group">
                <label for="envProjectName">
                  Assign to Project <span class="optional-label">(optional)</span>
                </label>
                <input
                  type="text"
                  id="envProjectName"
                  placeholder="e.g., Production"
                  maxlength="50">
                <span class="form-hint">All imported keys will be grouped under this project</span>
              </div>
            </div>

          </div>
        </div>
      </form>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" id="apiKeyModalCancel">Cancel</button>
        <button type="button" class="btn btn-primary" id="apiKeyModalSave">
          <span id="saveKeyBtnText">Save Key</span>
        </button>
      </div>
    </div>
  </div>
```

---

## 📋 Step 4: Add CSS Styles

**Add to `src/popup/styles/features.css` (or create new `apiKeyVault.css`):**

See the complete CSS in `VAULT_UI_IMPROVEMENTS.md` section "Required CSS Updates"

Key styles needed:
- `.modal-tabs` and `.modal-tab-btn` - Tab navigation
- `.import-method-content` - Tab content switching
- `.form-vertical` - Vertical form layout
- `.input-with-button` and `.btn-icon-overlay` - Paste button
- `.env-*` classes - .env preview styles
- `.api-key-value-actions` - Copy/show buttons
- `.api-key-stat-icon` and `.api-key-stat-content` - Icon stats layout

---

## 📋 Step 5: Build & Test

```bash
npm run build
```

### Test Checklist:

- [ ] Manual entry works (vertical layout, paste button)
- [ ] .env import tab appears
- [ ] .env parser detects keys
- [ ] Bulk import works
- [ ] Copy button copies to clipboard
- [ ] Show/hide toggle works
- [ ] Stats display with icons

---

## 🎯 Summary

**Files to modify:**
1. `src/popup/components/apiKeyModal.ts` - Add .env import logic
2. `src/popup/components/apiKeyVault.ts` - Add copy button
3. `src/popup/popup-v2.html` - Update modal HTML
4. `src/popup/styles/features.css` - Add new styles

**Total changes:** ~500 lines added/modified

**Time estimate:** 30-45 minutes

---

Good luck! Test each step as you go. 🚀
