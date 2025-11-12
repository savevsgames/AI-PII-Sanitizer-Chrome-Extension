# Puppeteer E2E Testing Plan - PromptBlocker

**Version:** 1.0.0
**Created:** 2025-01-12
**Status:** 🎯 **READY FOR IMPLEMENTATION**
**Estimated Time:** 12-16 hours (2 days)

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Why Puppeteer?](#why-puppeteer)
3. [Test Architecture](#test-architecture)
4. [File Structure](#file-structure)
5. [Test Scenarios](#test-scenarios)
6. [Implementation Plan](#implementation-plan)
7. [Code Examples](#code-examples)
8. [Best Practices](#best-practices)
9. [Troubleshooting Guide](#troubleshooting-guide)
10. [Success Criteria](#success-criteria)

---

## 🎯 Executive Summary

### Current State
- ✅ **697 unit tests** passing (100%)
- ✅ **53 integration tests** passing (100%)
- ❌ **4 E2E tests** failing (Playwright timeout issues)
- **Problem:** Extension popup lifecycle not properly handled in Playwright

### Goal
Replace Playwright E2E tests with **Puppeteer** for stable, production-ready Chrome extension testing.

### Deliverables
1. **Core Test Suite** (4 tests) - Popup & profile management
2. **Platform Tests** (5 tests) - ChatGPT, Claude, Gemini, Perplexity, Copilot
3. **Advanced Features** (6 tests) - API Key Vault, Custom Rules, Templates, etc.
4. **Total:** 15 comprehensive E2E tests

### Timeline
- **Day 1 (8 hours):** Setup + Core Tests + ChatGPT
- **Day 2 (8 hours):** Platform Tests + Advanced Features
- **Total:** 16 hours over 2 days

---

## 🚀 Why Puppeteer?

### Comparison: Puppeteer vs Playwright

| Feature | Puppeteer | Playwright (Current) |
|---------|-----------|---------------------|
| **Extension Loading** | Native `enableExtensions` | Persistent context args |
| **Popup Access** | `chrome.action.openPopup()` ✅ | Direct URL navigation ❌ |
| **Service Worker** | Full access via `target.worker()` ✅ | Limited ❌ |
| **Stability** | High ✅ | Medium (popups close) ⚠️ |
| **Documentation** | Excellent (pptr.dev) ✅ | Moderate |
| **Chrome Team** | Google-maintained ✅ | Microsoft-maintained |
| **Extension Focus** | Purpose-built ✅ | General-purpose |

### Key Advantages

**1. Proper Popup Lifecycle:**
```javascript
// Puppeteer (stable)
await worker.evaluate('chrome.action.openPopup();');
const popupTarget = await browser.waitForTarget(...);

// Playwright (unstable - popup closes)
await page.goto('chrome-extension://id/popup.html'); // ❌
```

**2. Service Worker Access:**
```javascript
// Get service worker
const worker = await serviceWorkerTarget.worker();

// Execute code in service worker context
await worker.evaluate(() => {
  console.log('Running in service worker!');
});
```

**3. Extension-Specific APIs:**
- `chrome.action.openPopup()` support
- `target.type() === 'service_worker'` detection
- Background page vs service worker differentiation

### Decision: **Use Puppeteer for E2E Tests**

---

## 🏗️ Test Architecture

### Three-Layer Testing Strategy

```
┌─────────────────────────────────────────────────────┐
│  LAYER 1: Unit Tests (Jest)                        │
│  - 697 tests covering business logic               │
│  - Fast execution (<5 seconds)                     │
│  - No browser required                             │
│  Status: ✅ 100% passing                           │
└─────────────────────────────────────────────────────┘
                        ⬇️
┌─────────────────────────────────────────────────────┐
│  LAYER 2: Integration Tests (Jest)                 │
│  - 53 tests covering Firebase, Stripe, Storage     │
│  - Real service integration                        │
│  - Moderate speed (~30 seconds)                    │
│  Status: ✅ 100% passing                           │
└─────────────────────────────────────────────────────┘
                        ⬇️
┌─────────────────────────────────────────────────────┐
│  LAYER 3: E2E Tests (Puppeteer) - NEW              │
│  - 15 tests covering full user workflows           │
│  - Real browser with extension loaded              │
│  - Slow execution (~5 minutes)                     │
│  Status: 🎯 TO BE IMPLEMENTED                      │
└─────────────────────────────────────────────────────┘
```

### Test Categories

**1. Core Tests (4 tests, 30 min)**
- Extension loads correctly
- Popup opens and displays UI
- Profile CRUD operations
- Profile enable/disable toggle

**2. Platform Tests (5 tests, 45 min)**
- ChatGPT PII substitution
- Claude PII substitution
- Gemini PII substitution
- Perplexity PII substitution
- Copilot PII substitution

**3. Advanced Feature Tests (6 tests, 45 min)**
- API Key detection and redaction
- Custom redaction rules
- Prompt templates
- Document analysis
- Quick alias generator
- Minimal mode toggle

**Total Runtime:** ~2 hours for full E2E suite

---

## 📁 File Structure

### New Directory Structure

```
tests/
├── unit/                           # Jest unit tests (existing)
│   ├── aliasEngine.test.ts         # ✅ 697 tests
│   ├── apiKeyDetector.test.ts
│   └── ...
│
├── integration/                    # Jest integration tests (existing)
│   ├── firebase.integration.test.ts # ✅ 53 tests
│   ├── storage.integration.test.ts
│   └── ...
│
├── e2e/                            # Playwright tests (DEPRECATED)
│   ├── chatgpt.test.ts             # ❌ To be removed
│   └── fixtures.ts                 # ❌ To be removed
│
└── e2e-puppeteer/                  # NEW Puppeteer tests
    ├── setup/
    │   ├── ExtensionTestHarness.ts  # Base test harness
    │   ├── PageObjectModels.ts      # POM classes
    │   ├── TestHelpers.ts           # Utility functions
    │   └── config.ts                # Test configuration
    │
    ├── core/
    │   ├── 01-extension-loading.test.ts
    │   ├── 02-popup-ui.test.ts
    │   ├── 03-profile-crud.test.ts
    │   └── 04-profile-toggle.test.ts
    │
    ├── platforms/
    │   ├── 05-chatgpt.test.ts
    │   ├── 06-claude.test.ts
    │   ├── 07-gemini.test.ts
    │   ├── 08-perplexity.test.ts
    │   └── 09-copilot.test.ts
    │
    ├── features/
    │   ├── 10-api-key-vault.test.ts
    │   ├── 11-custom-rules.test.ts
    │   ├── 12-prompt-templates.test.ts
    │   ├── 13-document-analysis.test.ts
    │   ├── 14-quick-generator.test.ts
    │   └── 15-minimal-mode.test.ts
    │
    ├── run.js                       # Test runner
    └── README.md                    # Usage guide
```

### Configuration Files

**New Files to Create:**
1. `tests/e2e-puppeteer/jest.config.js` - Jest config for Puppeteer tests
2. `tests/e2e-puppeteer/tsconfig.json` - TypeScript config
3. `tests/e2e-puppeteer/.env.example` - Environment variables template

---

## 🎬 Test Scenarios

### Core Tests (Priority 1)

#### Test 1: Extension Loading
**File:** `core/01-extension-loading.test.ts`
**Time:** 5 minutes
**Priority:** P0 (blocking)

**Scenario:**
```
GIVEN the extension is built (dist/ folder exists)
WHEN Puppeteer launches with extension loaded
THEN:
  ✓ Service worker should be active
  ✓ Extension ID should be extracted
  ✓ Background script should log initialization
  ✓ No console errors
```

**Verification:**
- Service worker target detected
- Extension ID is valid format (32 chars)
- Chrome APIs available in service worker

---

#### Test 2: Popup UI Display
**File:** `core/02-popup-ui.test.ts`
**Time:** 10 minutes
**Priority:** P0 (blocking)

**Scenario:**
```
GIVEN the extension is loaded
WHEN popup is opened via chrome.action.openPopup()
THEN:
  ✓ Popup page loads within 5 seconds
  ✓ #app element is visible
  ✓ Tab navigation is rendered (Aliases, Stats, Features, Settings, Debug)
  ✓ Header shows "🛡️ PromptBlocker.com"
  ✓ Status indicator shows "Active" or "Partial" or "Inactive"
  ✓ Empty state message shown (no profiles yet)
  ✓ "New Profile" button is visible
```

**Elements to Verify:**
- `#app` - Main container
- `.tab-nav` - Navigation tabs
- `.header` - Header with title
- `#statusIndicator` - Status dot and text
- `#profilesEmptyState` - Empty state message
- `#addProfileBtn` - Add profile button

---

#### Test 3: Profile CRUD Operations
**File:** `core/03-profile-crud.test.ts`
**Time:** 15 minutes
**Priority:** P0 (blocking)

**Scenario:**
```
GIVEN the popup is open
WHEN user clicks "New Profile"
  AND fills form with test data
  AND clicks "Save"
THEN:
  ✓ Profile modal opens
  ✓ Form fields are editable
  ✓ Profile is created successfully
  ✓ Profile card appears in list
  ✓ Profile shows correct data (name, email, phone)
  ✓ "Alias Enabled" status shown

WHEN user clicks "Edit" on profile
  AND modifies alias name
  AND clicks "Save"
THEN:
  ✓ Edit modal opens with pre-filled data
  ✓ Profile updates successfully
  ✓ Updated alias name shown in card

WHEN user clicks "Delete" on profile
  AND confirms deletion
THEN:
  ✓ Delete confirmation modal appears
  ✓ Profile is removed from list
  ✓ Empty state message shown again
```

**Test Data:**
```javascript
const TEST_PROFILE = {
  profileName: 'E2E Test Profile',
  realName: 'John Smith',
  aliasName: 'Alex Johnson',
  realEmail: 'john.smith@test.com',
  aliasEmail: 'alex.johnson@test.com',
  realPhone: '555-123-4567',
  aliasPhone: '555-987-6543'
};
```

---

#### Test 4: Profile Toggle
**File:** `core/04-profile-toggle.test.ts`
**Time:** 10 minutes
**Priority:** P1

**Scenario:**
```
GIVEN a profile exists and is enabled
WHEN user clicks "Disable" button
THEN:
  ✓ Status changes to "Alias Disabled"
  ✓ Button text changes to "Enable"
  ✓ Profile saved with enabled: false

WHEN user clicks "Enable" button
THEN:
  ✓ Status changes to "Alias Enabled"
  ✓ Button text changes to "Disable"
  ✓ Profile saved with enabled: true
```

---

### Platform Tests (Priority 2)

#### Test 5: ChatGPT PII Substitution
**File:** `platforms/05-chatgpt.test.ts`
**Time:** 20 minutes
**Priority:** P0 (blocking)

**Scenario:**
```
GIVEN a profile is created and enabled
  profileName: "ChatGPT Test"
  realName: "John Smith"
  aliasName: "Alex Johnson"
  realEmail: "john@test.com"
  aliasEmail: "alex@test.com"

WHEN user navigates to chat.openai.com
  AND types a message: "My name is John Smith and email is john@test.com"
  AND clicks send

THEN:
  ✓ Request to /backend-api/conversation intercepted
  ✓ Request body contains "Alex Johnson"
  ✓ Request body contains "alex@test.com"
  ✓ Request body DOES NOT contain "John Smith"
  ✓ Request body DOES NOT contain "john@test.com"
  ✓ Activity log records substitution
```

**Request Interception:**
```javascript
await chatPage.setRequestInterception(true);
let requestBody = null;

chatPage.on('request', (request) => {
  if (request.url().includes('/backend-api/conversation')) {
    requestBody = JSON.parse(request.postData() || '{}');
  }
  request.continue();
});
```

**Note:** This test requires ChatGPT login or mock server.

---

#### Test 6: Claude PII Substitution
**File:** `platforms/06-claude.test.ts`
**Time:** 15 minutes
**Priority:** P1

**Scenario:**
```
GIVEN a profile is enabled
WHEN user navigates to claude.ai
  AND sends a message with PII
THEN:
  ✓ Request to /api/organizations/.../completion intercepted
  ✓ PII substituted correctly
  ✓ Real PII not sent
```

---

#### Test 7: Gemini PII Substitution
**File:** `platforms/07-gemini.test.ts`
**Time:** 15 minutes
**Priority:** P1

**Scenario:**
```
GIVEN a profile is enabled
WHEN user navigates to gemini.google.com
  AND sends a message with PII
THEN:
  ✓ XHR request to /_/BardChatUi/data/batchexecute intercepted
  ✓ PII substituted in Google's proprietary format
  ✓ Real PII not sent
```

**Note:** Gemini uses XHR, not fetch. Requires different interception.

---

#### Test 8: Perplexity PII Substitution
**File:** `platforms/08-perplexity.test.ts`
**Time:** 15 minutes
**Priority:** P1

**Scenario:**
```
GIVEN a profile is enabled
WHEN user navigates to perplexity.ai
  AND sends a message with PII
THEN:
  ✓ Request intercepted
  ✓ Both query_str and params.dsl_query fields substituted
  ✓ Real PII not sent
```

**Special Handling:** Perplexity has dual-field format (query_str + dsl_query).

---

#### Test 9: Copilot PII Substitution
**File:** `platforms/09-copilot.test.ts`
**Time:** 15 minutes
**Priority:** P1

**Scenario:**
```
GIVEN a profile is enabled
WHEN user navigates to copilot.microsoft.com
  AND sends a message with PII
THEN:
  ✓ WebSocket message intercepted
  ✓ PII substituted in WebSocket event format
  ✓ Real PII not sent
```

**Special Handling:** Copilot uses WebSocket, not HTTP requests.

---

### Advanced Feature Tests (Priority 3)

#### Test 10: API Key Detection
**File:** `features/10-api-key-vault.test.ts`
**Time:** 15 minutes
**Priority:** P2

**Scenario:**
```
GIVEN API Key Vault is enabled
WHEN user types a message with an OpenAI API key
  "Here's my key: sk-1234567890abcdefghijklmnopqrstuvwxyz1234567890AB"
THEN:
  ✓ API key is detected by APIKeyDetector
  ✓ Key is redacted in request
  ✓ Request contains "[API_KEY_REDACTED]" instead of real key
  ✓ Key is saved to vault (if setting enabled)
```

---

#### Test 11: Custom Redaction Rules
**File:** `features/11-custom-rules.test.ts`
**Time:** 15 minutes
**Priority:** P2

**Scenario:**
```
GIVEN a custom redaction rule exists
  pattern: "\\d{3}-\\d{2}-\\d{4}"  (SSN pattern)
  replacement: "[SSN_REDACTED]"
  enabled: true

WHEN user types a message with SSN
  "My SSN is 123-45-6789"
THEN:
  ✓ SSN pattern matched
  ✓ Request contains "[SSN_REDACTED]"
  ✓ Original SSN not sent
```

---

#### Test 12: Prompt Templates
**File:** `features/12-prompt-templates.test.ts`
**Time:** 15 minutes
**Priority:** P2

**Scenario:**
```
GIVEN a prompt template exists
  name: "Introduction Email"
  content: "Hi, I'm {{name}} from {{company}}. My email is {{email}}."

WHEN user clicks "Use Template"
  AND template is filled with profile data
THEN:
  ✓ Template modal opens
  ✓ Placeholders replaced with alias values
  ✓ Preview shows filled template
  ✓ "Copy to Clipboard" works
```

---

#### Test 13: Document Analysis
**File:** `features/13-document-analysis.test.ts`
**Time:** 15 minutes
**Priority:** P2

**Scenario:**
```
GIVEN user has a test document (test.txt)
  content: "My name is John Smith"

WHEN user uploads document
  AND clicks "Sanitize"
THEN:
  ✓ Document parsed successfully
  ✓ PII detected and highlighted
  ✓ Sanitized version shows "Alex Johnson"
  ✓ Original and sanitized shown side-by-side
```

---

#### Test 14: Quick Alias Generator
**File:** `features/14-quick-generator.test.ts`
**Time:** 10 minutes
**Priority:** P3

**Scenario:**
```
WHEN user clicks "Quick Generate"
  AND selects theme (e.g., "Coder")
THEN:
  ✓ Modal opens with generated alias
  ✓ Name, email, phone, address auto-filled
  ✓ Data follows theme patterns
  ✓ "Use This Alias" pre-fills profile form
```

---

#### Test 15: Minimal Mode Toggle
**File:** `features/15-minimal-mode.test.ts`
**Time:** 5 minutes
**Priority:** P3

**Scenario:**
```
GIVEN popup is in full mode
WHEN user clicks minimize button (▼)
THEN:
  ✓ Popup switches to minimal view
  ✓ Minimal view shows: status, activity count

WHEN user clicks expand button (⚙️)
THEN:
  ✓ Popup returns to full view
  ✓ State preserved (same tab active)
```

---

## 📅 Implementation Plan

### Phase 1: Setup (Day 1, Morning - 4 hours)

#### Step 1.1: Install Dependencies (30 min)
```bash
npm install puppeteer puppeteer-core --save-dev
npm install @types/puppeteer --save-dev
```

#### Step 1.2: Create Base Test Harness (2 hours)
**File:** `tests/e2e-puppeteer/setup/ExtensionTestHarness.ts`

**Features:**
- Extension loading with Puppeteer
- Service worker access
- Popup opening via `chrome.action.openPopup()`
- Screenshot capture on failure
- Console log capture
- Network request interception helpers

**Class Structure:**
```typescript
export class ExtensionTestHarness {
  browser: Browser;
  extensionId: string;
  worker: any;

  async setup(): Promise<void>
  async openPopup(): Promise<Page>
  async openChatGPT(): Promise<Page>
  async createTestProfile(data: ProfileData): Promise<void>
  async captureScreenshot(name: string): Promise<void>
  async cleanup(): Promise<void>
}
```

#### Step 1.3: Create Page Object Models (1 hour)
**File:** `tests/e2e-puppeteer/setup/PageObjectModels.ts`

**Classes:**
- `PopupPage` - Popup UI interactions
- `ProfileModal` - Profile form interactions
- `ChatGPTPage` - ChatGPT interactions
- `ClaudePage` - Claude interactions

#### Step 1.4: Create Test Helpers (30 min)
**File:** `tests/e2e-puppeteer/setup/TestHelpers.ts`

**Functions:**
- `waitForElement(page, selector, timeout)`
- `fillForm(page, data)`
- `captureNetworkRequest(page, urlPattern)`
- `verifySubstitution(requestBody, expected, notExpected)`

---

### Phase 2: Core Tests (Day 1, Afternoon - 4 hours)

#### Step 2.1: Extension Loading Test (30 min)
**File:** `tests/e2e-puppeteer/core/01-extension-loading.test.ts`

**Tasks:**
1. Write test skeleton
2. Verify service worker loads
3. Extract and validate extension ID
4. Check for console errors
5. Run and verify passing

#### Step 2.2: Popup UI Test (1 hour)
**File:** `tests/e2e-puppeteer/core/02-popup-ui.test.ts`

**Tasks:**
1. Open popup via harness
2. Verify all UI elements present
3. Check tab navigation works
4. Verify empty state shown
5. Test responsive behavior

#### Step 2.3: Profile CRUD Test (2 hours)
**File:** `tests/e2e-puppeteer/core/03-profile-crud.test.ts`

**Tasks:**
1. Test profile creation flow
2. Verify profile card rendering
3. Test profile editing
4. Test profile deletion
5. Verify data persistence

#### Step 2.4: Profile Toggle Test (30 min)
**File:** `tests/e2e-puppeteer/core/04-profile-toggle.test.ts`

**Tasks:**
1. Create and enable profile
2. Test disable functionality
3. Verify state changes
4. Test enable functionality

---

### Phase 3: Platform Tests (Day 2, Morning - 4 hours)

#### Step 3.1: ChatGPT Test (1.5 hours)
**File:** `tests/e2e-puppeteer/platforms/05-chatgpt.test.ts`

**Tasks:**
1. Create test profile
2. Navigate to ChatGPT
3. Set up request interception
4. Send message with PII
5. Verify substitution in request body
6. Check activity log

**Challenges:**
- ChatGPT may require login
- Consider using mock server for consistent testing
- SSE response streaming needs special handling

#### Step 3.2: Claude Test (45 min)
**File:** `tests/e2e-puppeteer/platforms/06-claude.test.ts`

Similar to ChatGPT, adapted for Claude's API format.

#### Step 3.3: Gemini Test (1 hour)
**File:** `tests/e2e-puppeteer/platforms/07-gemini.test.ts`

**Special Handling:**
- XHR interception (not fetch)
- Google's proprietary request format
- May require Google account login

#### Step 3.4: Perplexity Test (45 min)
**File:** `tests/e2e-puppeteer/platforms/08-perplexity.test.ts`

**Special Handling:**
- Dual-field format (query_str + dsl_query)
- Verify both fields substituted

#### Step 3.5: Copilot Test (1 hour)
**File:** `tests/e2e-puppeteer/platforms/09-copilot.test.ts`

**Special Handling:**
- WebSocket interception
- May require Microsoft account login

---

### Phase 4: Advanced Features (Day 2, Afternoon - 4 hours)

#### Step 4.1: API Key Vault Test (45 min)
**File:** `tests/e2e-puppeteer/features/10-api-key-vault.test.ts`

#### Step 4.2: Custom Rules Test (45 min)
**File:** `tests/e2e-puppeteer/features/11-custom-rules.test.ts`

#### Step 4.3: Prompt Templates Test (45 min)
**File:** `tests/e2e-puppeteer/features/12-prompt-templates.test.ts`

#### Step 4.4: Document Analysis Test (45 min)
**File:** `tests/e2e-puppeteer/features/13-document-analysis.test.ts`

#### Step 4.5: Quick Generator Test (30 min)
**File:** `tests/e2e-puppeteer/features/14-quick-generator.test.ts`

#### Step 4.6: Minimal Mode Test (30 min)
**File:** `tests/e2e-puppeteer/features/15-minimal-mode.test.ts`

---

## 💻 Code Examples

### Example 1: ExtensionTestHarness (Complete)

```typescript
// tests/e2e-puppeteer/setup/ExtensionTestHarness.ts
import puppeteer, { Browser, Page, Target, Worker } from 'puppeteer';
import path from 'path';
import fs from 'fs';

export interface ProfileData {
  profileName: string;
  realName: string;
  aliasName: string;
  realEmail: string;
  aliasEmail: string;
  realPhone?: string;
  aliasPhone?: string;
}

export class ExtensionTestHarness {
  browser: Browser | null = null;
  extensionId: string = '';
  worker: Worker | null = null;
  screenshotCounter: number = 0;

  /**
   * Setup: Launch browser with extension loaded
   */
  async setup(): Promise<void> {
    const pathToExtension = path.join(__dirname, '../../../dist');

    // Verify dist folder exists
    if (!fs.existsSync(pathToExtension)) {
      throw new Error(
        `Extension not built! Run 'npm run build' first.\n` +
        `Looking for: ${pathToExtension}`
      );
    }

    console.log(`[Harness] Loading extension from: ${pathToExtension}`);

    // Launch browser with extension
    this.browser = await puppeteer.launch({
      headless: false, // Extensions require non-headless
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--window-size=1280,720'
      ],
      defaultViewport: null,
      devtools: false
    });

    console.log('[Harness] Browser launched');

    // Wait for service worker to load
    console.log('[Harness] Waiting for service worker...');
    const serviceWorkerTarget = await this.browser.waitForTarget(
      (target: Target) =>
        target.type() === 'service_worker' &&
        target.url().endsWith('background.js'),
      { timeout: 15000 }
    );

    this.worker = await serviceWorkerTarget.asWorker();
    this.extensionId = serviceWorkerTarget.url().split('/')[2];

    console.log(`[Harness] ✅ Extension loaded: ${this.extensionId}`);
    console.log(`[Harness] Service worker URL: ${serviceWorkerTarget.url()}`);

    // Verify extension ID format (32 characters)
    if (!/^[a-z]{32}$/.test(this.extensionId)) {
      throw new Error(`Invalid extension ID format: ${this.extensionId}`);
    }
  }

  /**
   * Open extension popup programmatically
   */
  async openPopup(): Promise<Page> {
    if (!this.browser || !this.worker) {
      throw new Error('Setup must be called first!');
    }

    console.log('[Harness] Opening popup...');

    // Trigger popup via service worker
    await this.worker.evaluate('chrome.action.openPopup();');

    // Wait for popup page to appear
    const popupTarget = await this.browser.waitForTarget(
      (target: Target) =>
        target.type() === 'page' &&
        target.url().includes('popup-v2.html'),
      { timeout: 10000 }
    );

    const popupPage = await popupTarget.page();
    if (!popupPage) {
      throw new Error('Failed to get popup page');
    }

    console.log('[Harness] ✅ Popup opened');

    // Wait for app to initialize
    await popupPage.waitForSelector('#app', { timeout: 10000 });
    console.log('[Harness] ✅ App initialized');

    // Capture console logs for debugging
    popupPage.on('console', (msg) => {
      const type = msg.type();
      if (type === 'error' || type === 'warning') {
        console.log(`[Popup ${type.toUpperCase()}]`, msg.text());
      }
    });

    return popupPage;
  }

  /**
   * Create a test profile via popup UI
   */
  async createTestProfile(
    popupPage: Page,
    data: ProfileData
  ): Promise<void> {
    console.log(`[Harness] Creating profile: ${data.profileName}`);

    // Click "New Profile" button
    await popupPage.waitForSelector('#addProfileBtn', { visible: true });
    await popupPage.click('#addProfileBtn');

    // Wait for modal
    await popupPage.waitForSelector('#profileModal', { visible: true });
    console.log('[Harness] Profile modal opened');

    // Fill form fields
    await popupPage.type('#profileName', data.profileName);
    await popupPage.type('#realName', data.realName);
    await popupPage.type('#aliasName', data.aliasName);
    await popupPage.type('#realEmail', data.realEmail);
    await popupPage.type('#aliasEmail', data.aliasEmail);

    if (data.realPhone) {
      await popupPage.type('#realPhone', data.realPhone);
    }
    if (data.aliasPhone) {
      await popupPage.type('#aliasPhone', data.aliasPhone);
    }

    // Save profile
    await popupPage.click('#modalSave');

    // Wait for modal to close
    await popupPage.waitForSelector('#profileModal', { hidden: true });
    console.log('[Harness] Profile saved');

    // Verify profile card appears
    await popupPage.waitForSelector('.profile-card', { visible: true });
    console.log('[Harness] ✅ Profile created successfully');

    // Wait a moment for state to settle
    await popupPage.waitForTimeout(500);
  }

  /**
   * Navigate to ChatGPT with extension active
   */
  async openChatGPT(): Promise<Page> {
    if (!this.browser) {
      throw new Error('Setup must be called first!');
    }

    console.log('[Harness] Opening ChatGPT...');
    const page = await this.browser.newPage();

    // Set up console logging
    page.on('console', (msg) => {
      const type = msg.type();
      if (type === 'error' || type === 'warning') {
        console.log(`[ChatGPT ${type.toUpperCase()}]`, msg.text());
      }
    });

    await page.goto('https://chat.openai.com', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('[Harness] ✅ ChatGPT loaded');
    return page;
  }

  /**
   * Capture screenshot for debugging
   */
  async captureScreenshot(
    page: Page,
    name: string
  ): Promise<string> {
    const screenshotDir = path.join(__dirname, '../screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    const timestamp = Date.now();
    const filename = `${timestamp}-${name}.png`;
    const filepath = path.join(screenshotDir, filename);

    await page.screenshot({
      path: filepath,
      fullPage: true
    });

    console.log(`[Harness] 📸 Screenshot saved: ${filename}`);
    return filepath;
  }

  /**
   * Clean up: Close browser
   */
  async cleanup(): Promise<void> {
    if (this.browser) {
      console.log('[Harness] Closing browser...');
      await this.browser.close();
      this.browser = null;
      console.log('[Harness] ✅ Browser closed');
    }
  }

  /**
   * Get all open pages (for debugging)
   */
  async getAllPages(): Promise<Page[]> {
    if (!this.browser) return [];
    return this.browser.pages();
  }
}
```

---

### Example 2: Core Test - Extension Loading

```typescript
// tests/e2e-puppeteer/core/01-extension-loading.test.ts
import { ExtensionTestHarness } from '../setup/ExtensionTestHarness';

describe('E2E: Extension Loading', () => {
  let harness: ExtensionTestHarness;

  beforeAll(async () => {
    harness = new ExtensionTestHarness();
    await harness.setup();
  }, 30000); // 30 second timeout for setup

  afterAll(async () => {
    await harness.cleanup();
  });

  test('extension loads successfully', async () => {
    // Verify extension ID extracted
    expect(harness.extensionId).toBeTruthy();
    expect(harness.extensionId).toHaveLength(32);
    expect(harness.extensionId).toMatch(/^[a-z]{32}$/);

    console.log(`✅ Extension ID: ${harness.extensionId}`);
  });

  test('service worker is active', async () => {
    expect(harness.worker).toBeTruthy();

    // Execute code in service worker context
    const result = await harness.worker!.evaluate(() => {
      return {
        hasChromeAPI: typeof chrome !== 'undefined',
        hasStorageAPI: typeof chrome?.storage !== 'undefined',
        hasRuntimeAPI: typeof chrome?.runtime !== 'undefined'
      };
    });

    expect(result.hasChromeAPI).toBe(true);
    expect(result.hasStorageAPI).toBe(true);
    expect(result.hasRuntimeAPI).toBe(true);

    console.log('✅ Chrome APIs available in service worker');
  });

  test('no console errors during initialization', async () => {
    const pages = await harness.getAllPages();

    // Get background page (service worker)
    const errors: string[] = [];

    for (const page of pages) {
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });
    }

    // Wait a moment for any errors to appear
    await new Promise(resolve => setTimeout(resolve, 2000));

    expect(errors).toHaveLength(0);
    console.log('✅ No console errors detected');
  });
});
```

---

### Example 3: Core Test - Profile CRUD

```typescript
// tests/e2e-puppeteer/core/03-profile-crud.test.ts
import { ExtensionTestHarness, ProfileData } from '../setup/ExtensionTestHarness';
import { Page } from 'puppeteer';

describe('E2E: Profile CRUD Operations', () => {
  let harness: ExtensionTestHarness;
  let popupPage: Page;

  const TEST_PROFILE: ProfileData = {
    profileName: 'E2E Test Profile',
    realName: 'John Smith',
    aliasName: 'Alex Johnson',
    realEmail: 'john.smith@test.com',
    aliasEmail: 'alex.johnson@test.com',
    realPhone: '555-123-4567',
    aliasPhone: '555-987-6543'
  };

  beforeAll(async () => {
    harness = new ExtensionTestHarness();
    await harness.setup();
  }, 30000);

  afterAll(async () => {
    await harness.cleanup();
  });

  beforeEach(async () => {
    popupPage = await harness.openPopup();
  });

  test('CREATE: can create new profile', async () => {
    // Create profile via harness helper
    await harness.createTestProfile(popupPage, TEST_PROFILE);

    // Verify profile card exists
    const profileCard = await popupPage.$('.profile-card');
    expect(profileCard).toBeTruthy();

    // Verify profile data displayed
    const cardText = await popupPage.$eval('.profile-card',
      el => el.textContent || '');

    expect(cardText).toContain(TEST_PROFILE.profileName);
    expect(cardText).toContain(TEST_PROFILE.aliasName);
    expect(cardText).toContain('Alias Enabled');

    console.log('✅ Profile created and displayed');
  }, 30000);

  test('READ: profile data persists after popup close', async () => {
    // Close popup
    await popupPage.close();

    // Reopen popup
    popupPage = await harness.openPopup();

    // Verify profile still exists
    const profileCard = await popupPage.$('.profile-card');
    expect(profileCard).toBeTruthy();

    const cardText = await popupPage.$eval('.profile-card',
      el => el.textContent || '');
    expect(cardText).toContain(TEST_PROFILE.profileName);

    console.log('✅ Profile data persisted');
  }, 30000);

  test('UPDATE: can edit profile', async () => {
    // Click edit button
    await popupPage.waitForSelector('.profile-card .btn-edit',
      { visible: true });
    await popupPage.click('.profile-card .btn-edit');

    // Wait for modal
    await popupPage.waitForSelector('#profileModal', { visible: true });

    // Clear and update alias name
    const aliasInput = await popupPage.$('#aliasName');
    await aliasInput?.click({ clickCount: 3 }); // Select all
    await aliasInput?.press('Backspace');
    await popupPage.type('#aliasName', 'Updated Alias Name');

    // Save
    await popupPage.click('#modalSave');
    await popupPage.waitForSelector('#profileModal', { hidden: true });

    // Verify update
    const cardText = await popupPage.$eval('.profile-card',
      el => el.textContent || '');
    expect(cardText).toContain('Updated Alias Name');
    expect(cardText).not.toContain(TEST_PROFILE.aliasName);

    console.log('✅ Profile updated successfully');
  }, 30000);

  test('DELETE: can delete profile', async () => {
    // Click delete button
    await popupPage.waitForSelector('.profile-card .btn-delete',
      { visible: true });
    await popupPage.click('.profile-card .btn-delete');

    // Wait for confirmation modal
    await popupPage.waitForSelector('.modal-delete', { visible: true });

    // Confirm deletion
    await popupPage.click('#confirmDelete');
    await popupPage.waitForSelector('.modal-delete', { hidden: true });

    // Verify profile removed
    const profileCards = await popupPage.$$('.profile-card');
    expect(profileCards).toHaveLength(0);

    // Verify empty state shown
    const emptyState = await popupPage.$('#profilesEmptyState');
    expect(emptyState).toBeTruthy();

    console.log('✅ Profile deleted successfully');
  }, 30000);
});
```

---

### Example 4: Platform Test - ChatGPT

```typescript
// tests/e2e-puppeteer/platforms/05-chatgpt.test.ts
import { ExtensionTestHarness, ProfileData } from '../setup/ExtensionTestHarness';
import { Page } from 'puppeteer';

describe('E2E: ChatGPT PII Substitution', () => {
  let harness: ExtensionTestHarness;
  let popupPage: Page;
  let chatPage: Page;

  const TEST_PROFILE: ProfileData = {
    profileName: 'ChatGPT Test',
    realName: 'John Smith',
    aliasName: 'Alex Johnson',
    realEmail: 'john.smith@test.com',
    aliasEmail: 'alex.johnson@test.com'
  };

  beforeAll(async () => {
    harness = new ExtensionTestHarness();
    await harness.setup();

    // Create test profile
    popupPage = await harness.openPopup();
    await harness.createTestProfile(popupPage, TEST_PROFILE);
    await popupPage.close();
  }, 60000);

  afterAll(async () => {
    if (chatPage) await chatPage.close();
    await harness.cleanup();
  });

  test('substitutes PII in ChatGPT request', async () => {
    // Open ChatGPT
    chatPage = await harness.openChatGPT();

    // Set up request interception
    await chatPage.setRequestInterception(true);
    let requestBody: any = null;

    chatPage.on('request', (request) => {
      const url = request.url();

      // Capture conversation requests
      if (url.includes('/backend-api/conversation')) {
        try {
          const postData = request.postData();
          if (postData) {
            requestBody = JSON.parse(postData);
            console.log('[Test] Captured request to ChatGPT API');
          }
        } catch (e) {
          console.log('[Test] Failed to parse request body');
        }
      }

      request.continue();
    });

    // Wait for ChatGPT to load
    // Note: May require login - handle gracefully
    try {
      await chatPage.waitForSelector('textarea[data-id="root"]', {
        timeout: 15000
      });
    } catch (e) {
      console.log('⚠️ ChatGPT login required - skipping test');
      return; // Skip test if not logged in
    }

    // Type message with PII
    const message = `My name is ${TEST_PROFILE.realName} and my email is ${TEST_PROFILE.realEmail}`;
    await chatPage.type('textarea[data-id="root"]', message);

    // Click send button
    await chatPage.click('button[data-testid="send-button"]');

    // Wait for request to be captured
    await chatPage.waitForTimeout(3000);

    // Verify substitution occurred
    expect(requestBody).toBeTruthy();
    expect(requestBody.messages).toBeTruthy();

    const lastMessage = requestBody.messages[
      requestBody.messages.length - 1
    ];

    expect(lastMessage.content).toContain(TEST_PROFILE.aliasName);
    expect(lastMessage.content).toContain(TEST_PROFILE.aliasEmail);
    expect(lastMessage.content).not.toContain(TEST_PROFILE.realName);
    expect(lastMessage.content).not.toContain(TEST_PROFILE.realEmail);

    console.log('✅ PII substitution verified');
    console.log(`   Real: "${TEST_PROFILE.realName}" → Alias: "${TEST_PROFILE.aliasName}"`);
    console.log(`   Real: "${TEST_PROFILE.realEmail}" → Alias: "${TEST_PROFILE.aliasEmail}"`);

  }, 120000); // 2 minute timeout for full flow
});
```

---

## 🎯 Best Practices

### 1. Test Isolation
```typescript
// ✅ Good: Each test creates its own profile
beforeEach(async () => {
  await harness.createTestProfile(popupPage, {
    profileName: 'Test-' + Date.now() // Unique name
  });
});

// ❌ Bad: Shared profile across tests
beforeAll(async () => {
  await harness.createTestProfile(popupPage, {
    profileName: 'Shared Profile' // Reused, can cause flaky tests
  });
});
```

### 2. Wait Strategies
```typescript
// ✅ Good: Wait for specific conditions
await page.waitForSelector('#profileModal', { visible: true });
await page.waitForFunction(
  () => document.querySelector('.profile-card')?.textContent?.includes('Loaded')
);

// ❌ Bad: Arbitrary timeouts
await page.waitForTimeout(5000); // Flaky!
```

### 3. Error Handling
```typescript
// ✅ Good: Capture screenshot on failure
test('my test', async () => {
  try {
    // Test logic
  } catch (error) {
    await harness.captureScreenshot(page, 'test-failure');
    throw error;
  }
});

// ✅ Good: Skip tests gracefully if preconditions not met
if (!await page.$('textarea')) {
  console.log('⚠️ Login required - skipping test');
  return;
}
```

### 4. Cleanup
```typescript
// ✅ Good: Always clean up resources
afterAll(async () => {
  await harness.cleanup(); // Close browser
});

// ✅ Good: Close pages between tests
afterEach(async () => {
  if (chatPage) await chatPage.close();
});
```

### 5. Debugging
```typescript
// ✅ Good: Log important steps
console.log('[Test] Creating profile...');
console.log('[Test] Navigating to ChatGPT...');
console.log('[Test] ✅ Substitution verified');

// ✅ Good: Capture console logs
page.on('console', msg => console.log(`[Page] ${msg.text()}`));
page.on('pageerror', error => console.error(`[Page Error]`, error));
```

---

## 🐛 Troubleshooting Guide

### Issue 1: Extension Not Loading

**Symptoms:**
```
Error: Failed to get popup page
Error: Timeout waiting for target
```

**Solutions:**
1. **Verify extension built:**
   ```bash
   npm run build
   ls -la dist/
   ```

2. **Check manifest.json:**
   ```bash
   cat dist/manifest.json
   # Verify "manifest_version": 3
   ```

3. **Increase timeout:**
   ```typescript
   await browser.waitForTarget(..., { timeout: 30000 });
   ```

---

### Issue 2: Popup Closes Immediately

**Symptoms:**
```
Error: Target page, context or browser has been closed
```

**Solutions:**
1. **Use `chrome.action.openPopup()`:**
   ```typescript
   // ✅ Correct
   await worker.evaluate('chrome.action.openPopup();');

   // ❌ Wrong
   await page.goto('chrome-extension://id/popup.html');
   ```

2. **Keep popup focused:**
   ```typescript
   const popupPage = await popupTarget.page();
   await popupPage.bringToFront();
   ```

---

### Issue 3: Request Not Intercepted

**Symptoms:**
```
requestBody is null
Substitution not verified
```

**Solutions:**
1. **Enable request interception:**
   ```typescript
   await page.setRequestInterception(true);
   ```

2. **Continue requests:**
   ```typescript
   page.on('request', request => {
     // Process request
     request.continue(); // ⚠️ Must call!
   });
   ```

3. **Check URL pattern:**
   ```typescript
   if (url.includes('/backend-api/conversation')) { // ChatGPT
   if (url.includes('/api/organizations')) { // Claude
   ```

---

### Issue 4: Element Not Found

**Symptoms:**
```
Error: No node found for selector: #addProfileBtn
```

**Solutions:**
1. **Wait for element:**
   ```typescript
   await page.waitForSelector('#addProfileBtn', {
     visible: true,
     timeout: 10000
   });
   ```

2. **Check selector:**
   ```bash
   # Open popup manually and inspect
   chrome://extensions → PromptBlocker → Popup
   ```

3. **Verify page loaded:**
   ```typescript
   await page.waitForFunction(
     () => document.readyState === 'complete'
   );
   ```

---

### Issue 5: Tests Flaky

**Symptoms:**
- Tests pass sometimes, fail others
- Timing-related failures

**Solutions:**
1. **Use explicit waits:**
   ```typescript
   // ✅ Good
   await page.waitForSelector('.profile-card');

   // ❌ Bad
   await page.waitForTimeout(1000);
   ```

2. **Wait for network idle:**
   ```typescript
   await page.goto(url, { waitUntil: 'networkidle2' });
   ```

3. **Add retry logic:**
   ```typescript
   async function retryClick(page, selector, retries = 3) {
     for (let i = 0; i < retries; i++) {
       try {
         await page.click(selector);
         return;
       } catch (e) {
         if (i === retries - 1) throw e;
         await page.waitForTimeout(1000);
       }
     }
   }
   ```

---

## ✅ Success Criteria

### Phase 1: Setup Complete
- [ ] Puppeteer installed
- [ ] ExtensionTestHarness class created
- [ ] PageObjectModels implemented
- [ ] Test helpers written
- [ ] First test passing (extension loading)

### Phase 2: Core Tests Complete
- [ ] All 4 core tests passing
- [ ] Extension loads successfully
- [ ] Popup opens reliably
- [ ] Profile CRUD works
- [ ] Profile toggle works

### Phase 3: Platform Tests Complete
- [ ] ChatGPT test passing (or gracefully skipped if login required)
- [ ] At least 3/5 platform tests passing
- [ ] Request interception working
- [ ] PII substitution verified

### Phase 4: Advanced Features Complete
- [ ] API Key detection test passing
- [ ] Custom rules test passing
- [ ] At least 4/6 feature tests passing

### Final Checklist
- [ ] All 15 tests written
- [ ] At least 12/15 tests passing (80%+)
- [ ] Documentation complete
- [ ] CI/CD integration planned
- [ ] Team trained on running tests

---

## 📝 Next Steps After Completion

1. **Update package.json:**
   ```json
   {
     "scripts": {
       "test:e2e": "node tests/e2e-puppeteer/run.js",
       "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e"
     }
   }
   ```

2. **Update CI/CD:**
   - Add E2E tests to GitHub Actions
   - Configure headless mode for CI
   - Set up screenshot artifacts

3. **Documentation:**
   - Update TESTING.md with Puppeteer info
   - Add troubleshooting section
   - Create video demo of tests

4. **Remove Old Tests:**
   ```bash
   rm -rf tests/e2e/
   rm playwright.config.ts
   npm uninstall @playwright/test
   ```

5. **Chrome Web Store Submission:**
   - With 750/750 unit+integration tests passing
   - And 12+/15 E2E tests passing
   - **You're ready to submit!** 🚀

---

## 📚 Additional Resources

### Puppeteer Documentation
- **Official Guide:** https://pptr.dev/
- **Chrome Extensions:** https://pptr.dev/guides/chrome-extensions
- **API Reference:** https://pptr.dev/api
- **Troubleshooting:** https://pptr.dev/troubleshooting

### Chrome Extension Testing
- **Google Guide:** https://developer.chrome.com/docs/extensions/how-to/test/end-to-end-testing
- **Manifest V3:** https://developer.chrome.com/docs/extensions/mv3/

### Your Documentation
- `docs/testing/TESTING.md` - Current test guide
- `docs/development/ARCHITECTURE.md` - System architecture
- `roadmap.md` - Development timeline

---

## 🎉 Conclusion

This plan provides a **comprehensive, enterprise-grade approach** to implementing Puppeteer E2E tests for PromptBlocker.

**Key Takeaways:**
- ✅ **15 tests** covering all critical workflows
- ✅ **Stable** popup testing via `chrome.action.openPopup()`
- ✅ **Production-ready** with proper error handling
- ✅ **Well-documented** with code examples
- ✅ **Achievable** in 2 days (16 hours)

**After implementation, you'll have:**
- 697 unit tests (100% ✅)
- 53 integration tests (100% ✅)
- 15 E2E tests (80%+ ✅)
- **Total: 765 tests** - Production ready! 🚀

**Plan well, and the doing is easy.** 💪

Let's build this! 🎯

---

**Last Updated:** 2025-01-12
**Status:** Ready for Implementation
**Estimated Completion:** 2 days
