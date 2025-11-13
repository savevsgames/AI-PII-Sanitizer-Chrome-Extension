# Puppeteer E2E Tests

Enterprise-grade end-to-end tests for PromptBlocker Chrome extension.

## ⚠️ CRITICAL: Platform Page Requirement

**PromptBlocker uses a three-context architecture that REQUIRES an AI platform page to function.**

All tests MUST follow this pattern:
```typescript
// 1. Setup harness
await harness.setup();

// 2. Open platform page FIRST (establishes message chain)
const chatPage = await harness.setupPlatformPage();

// 3. NOW open popup (will have active message chain)
const popupPage = await harness.openPopup();
```

**Why?** The extension relies on this message flow:
```
inject.js (page context)
    ↓ window.postMessage
content.ts (isolated world)
    ↓ chrome.runtime.sendMessage
background (service worker)
```

Without a platform page, there's no inject.js, no content script, and no message chain.
The popup will fail to function properly.

---

## Quick Start

```bash
# 1. Build the extension first (REQUIRED)
npm run build

# 2. Run all E2E tests
npm run test:e2e

# 3. Run specific test file
npm run test:e2e -- core/01-extension-loading.test.ts

# 4. Run in watch mode (re-run on changes)
npm run test:e2e -- --watch

# 5. Run with coverage
npm run test:e2e -- --coverage
```

## Directory Structure

```
tests/e2e-puppeteer/
├── setup/                          # Test infrastructure
│   ├── ExtensionTestHarness.ts     # Core harness (700+ lines)
│   ├── PageObjectModels.ts         # Page interaction classes
│   └── TestHelpers.ts              # Utility functions
│
├── core/                           # Core functionality tests
│   ├── 01-extension-loading.test.ts
│   ├── 02-popup-ui.test.ts
│   ├── 03-profile-crud.test.ts
│   └── 04-profile-toggle.test.ts
│
├── platforms/                      # Platform-specific tests
│   ├── 05-chatgpt.test.ts
│   ├── 06-claude.test.ts
│   ├── 07-gemini.test.ts
│   ├── 08-perplexity.test.ts
│   └── 09-copilot.test.ts
│
├── features/                       # Advanced feature tests
│   ├── 10-api-key-vault.test.ts
│   ├── 11-custom-rules.test.ts
│   ├── 12-prompt-templates.test.ts
│   ├── 13-document-analysis.test.ts
│   ├── 14-quick-generator.test.ts
│   └── 15-minimal-mode.test.ts
│
├── screenshots/                    # Auto-captured screenshots
└── README.md                       # This file
```

## Test Categories

### Core Tests (4 tests, ~40 minutes)
- Extension loading and service worker initialization
- Popup UI rendering and navigation
- Profile CRUD operations (Create, Read, Update, Delete)
- Profile enable/disable toggle

### Platform Tests (5 tests, ~60 minutes)
- ChatGPT PII substitution
- Claude PII substitution
- Gemini PII substitution
- Perplexity PII substitution
- Copilot PII substitution

### Advanced Features (6 tests, ~60 minutes)
- API Key Vault detection and redaction
- Custom redaction rules
- Prompt templates
- Document analysis
- Quick alias generator
- Minimal mode toggle

**Total: 15 tests, ~2 hours runtime**

## Prerequisites

### 1. Extension Must Be Built

```bash
npm run build
# Verify dist/ folder exists and contains:
# - manifest.json
# - background.js
# - content.js
# - popup-v2.html
# - etc.
```

### 2. Chrome/Chromium Installed

Puppeteer will download Chromium automatically, but you can use system Chrome:

```bash
# Set environment variable to use system Chrome
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH=/path/to/chrome
```

### 3. Dependencies Installed

```bash
npm install
# Puppeteer, @types/puppeteer should be installed
```

## Writing Tests

### Basic Test Structure

```typescript
import { ExtensionTestHarness } from '../setup/ExtensionTestHarness';
import { Page } from 'puppeteer';

describe('My Test Suite', () => {
  let harness: ExtensionTestHarness;
  let popupPage: Page;

  // Setup: Runs once before all tests
  beforeAll(async () => {
    harness = new ExtensionTestHarness();
    await harness.setup();
  }, 30000); // 30 second timeout

  // Cleanup: Runs once after all tests
  afterAll(async () => {
    await harness.cleanup();
  });

  // Before each test: Open fresh popup
  beforeEach(async () => {
    popupPage = await harness.openPopup();
  });

  test('my test', async () => {
    // Test logic here
    await popupPage.waitForSelector('#app');
    // ... assertions ...
  }, 60000); // 60 second timeout per test
});
```

### Using Page Object Models

```typescript
import { PopupPage } from '../setup/PageObjectModels';

test('navigate to stats tab', async () => {
  const popup = new PopupPage(popupPage);

  await popup.waitForLoad();
  await popup.navigateToTab('stats');

  const isActive = await popup.isActive();
  expect(isActive).toBe(true);
});
```

### Using Test Helpers

```typescript
import {
  waitForElement,
  fillForm,
  verifySubstitution
} from '../setup/TestHelpers';

test('fill profile form', async () => {
  await fillForm(popupPage, {
    '#profileName': 'Test Profile',
    '#realName': 'John Smith',
    '#aliasName': 'Alex Johnson'
  });

  await popupPage.click('#modalSave');

  const success = await waitForElement(popupPage, '.profile-card');
  expect(success).toBeTruthy();
});
```

## Debugging

### 1. Enable Headful Mode

```typescript
const harness = new ExtensionTestHarness({
  headless: false, // See the browser
  devtools: true,  // Open DevTools
  slowMo: 100      // Slow down by 100ms per action
});
```

### 2. Screenshots on Failure

Screenshots are automatically captured on errors and saved to `screenshots/`.

Manual screenshot:
```typescript
await harness.captureScreenshot(popupPage, 'my-debug-screenshot');
```

### 3. Console Logs

```typescript
// Check for errors
const errors = harness.getErrorLogs();
console.log('Errors:', errors);

// Get all logs
const allLogs = harness.getCapturedLogs();
```

### 4. Inspect Extension

After launching tests, inspect the extension manually:
```
chrome://extensions
→ Find "PromptBlocker"
→ Click "Inspect views: background page"
```

## Troubleshooting

### Extension Not Loading

**Symptom:** `Service worker failed to load`

**Solution:**
1. Verify extension is built: `npm run build`
2. Check manifest.json exists in dist/
3. Look for syntax errors in background.js

### Popup Not Opening

**Symptom:** `Popup page failed to appear`

**Solution:**
1. Make sure popup-v2.html exists in dist/
2. Check for JavaScript errors in popup
3. Try headful mode to see what's happening

### Tests Timing Out

**Symptom:** Tests exceed 120 second timeout

**Solution:**
1. Increase timeout in jest.config.js
2. Check for infinite loops or missing awaits
3. Verify network requests aren't hanging

### Element Not Found

**Symptom:** `Element not found: #selector`

**Solution:**
1. Verify selector is correct (check HTML)
2. Wait for element with `waitForSelector`
3. Take screenshot to see page state

## CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Build extension
        run: npm run build

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload screenshots on failure
        if: failure()
        uses: actions/upload-artifact@v2
        with:
          name: screenshots
          path: tests/e2e-puppeteer/screenshots/
```

## Best Practices

1. **Always build before testing:** `npm run build`
2. **Use Page Object Models:** Don't interact with selectors directly in tests
3. **Explicit waits:** Use `waitForSelector`, not arbitrary timeouts
4. **Cleanup resources:** Always call `harness.cleanup()` in `afterAll()`
5. **Test isolation:** Each test should work independently
6. **Descriptive names:** Test names should clearly describe what's being tested
7. **Screenshot on failure:** Capture state for debugging
8. **Check console errors:** Use `harness.hasErrors()` to verify no errors

## Support

- **Documentation:** See `docs/testing/PUPPETEER_E2E_PLAN.md`
- **Issues:** Report at GitHub issues
- **Questions:** Ask in team chat

---

**Last Updated:** 2025-01-12
**Status:** Production Ready
**Test Count:** 15 comprehensive E2E tests
