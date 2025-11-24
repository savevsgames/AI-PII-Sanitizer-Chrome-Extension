# Comprehensive E2E Test Plan - With Auth Flow

**Created:** 2025-01-14
**Status:** In Development
**Auth Flow:** ✅ COMPLETED (signInTestUser, createTestProfile, deleteTestProfile, signOutTestUser)

---

## Test Flow Pattern

**ALL tests follow this enterprise-grade pattern:**

```typescript
test('Feature X test', async () => {
  // 1. Setup platform page (ChatGPT)
  const chatPage = await harness.setupPlatformPage();

  // 2. Open popup
  const popupPage = await harness.openPopup();

  // 3. Sign in with Google OAuth (automated!)
  await harness.signInTestUser(popupPage);

  // 4. Create test profile
  await harness.createTestProfile(popupPage, TEST_PROFILE);

  // 5. RUN YOUR TEST HERE
  // ...test code...

  // 6. Delete profile
  await harness.deleteTestProfile(popupPage, TEST_PROFILE.profileName);

  // 7. Sign out
  await harness.signOutTestUser(popupPage);
});
```

---

## Phase 1: Core Substitution Tests

**File:** `tests/e2e-puppeteer/features/05-profile-substitution.test.ts`

### Test 1: Basic Name Substitution
```typescript
test('substitutes real name with alias in ChatGPT request', async () => {
  await harness.signInTestUser(popupPage);
  await harness.createTestProfile(popupPage, {
    profileName: 'Substitution Test',
    realName: 'John Smith',
    aliasName: 'Alex Johnson',
    realEmail: 'john@test.com',
    aliasEmail: 'alex@test.com'
  });

  // Enable request interception
  let capturedRequest = null;
  await chatPage.setRequestInterception(true);

  chatPage.on('request', req => {
    if (req.url().includes('/backend-api/conversation')) {
      capturedRequest = req.postData();
    }
    req.continue();
  });

  // Send message with real name
  await chatPage.type('textarea', 'My name is John Smith');
  await chatPage.click('[data-testid="send-button"]');

  // Wait for request
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Verify substitution
  expect(capturedRequest).toContain('Alex Johnson');
  expect(capturedRequest).not.toContain('John Smith');

  await harness.deleteTestProfile(popupPage, 'Substitution Test');
  await harness.signOutTestUser(popupPage);
});
```

### Test 2: Multi-Field Substitution
Tests that name, email, and phone are all substituted in same message.

### Test 3: Profile Toggle
- Disable profile → verify NO substitution
- Re-enable → verify substitution resumes

### Test 4: Multiple Profiles
- Create 2 profiles with different data
- Switch between them
- Verify correct aliases used

---

## Phase 2: API Key Vault Tests

**File:** `tests/e2e-puppeteer/features/06-api-key-vault.test.ts`

**Implementation Status:** Backend complete, UI needed (see feature_api_key_vault.md)

### Test 1: Add API Key
```typescript
test('adds API key to vault and saves encrypted', async () => {
  await harness.signInTestUser(popupPage);

  // Navigate to Settings → API Keys
  await popupPage.click('[data-tab="settings"]');
  await popupPage.waitForSelector('#apiKeyVaultSection');

  // Click "Add API Key"
  await popupPage.click('#addApiKeyBtn');

  // Fill modal
  await popupPage.type('#apiKeyName', 'Test OpenAI Key');
  await popupPage.type('#apiKeyValue', 'sk-proj-test123456789');

  // Save
  await popupPage.click('#saveApiKey');

  // Verify key card appears
  await popupPage.waitForSelector('.api-key-card');
  const keyText = await popupPage.$eval('.api-key-card', el => el.textContent);
  expect(keyText).toContain('Test OpenAI Key');
  expect(keyText).toContain('sk-proj-••••••••••••');

  await harness.signOutTestUser(popupPage);
});
```

### Test 2: API Key Detection
- Create key in vault
- Send message with that key in ChatGPT
- Verify warning modal appears (warn-first mode)
- Confirm redaction
- Verify request has `[OPENAI_API_KEY]` instead of real key

### Test 3: Auto-Redact Mode
- Set mode to auto-redact
- Send message with API key
- Verify NO warning (silent redaction)
- Verify request redacted

### Test 4: Delete API Key
- Add key
- Click delete button
- Confirm deletion
- Verify key removed from list

---

## Phase 3: Custom Rules Tests

**File:** `tests/e2e-puppeteer/features/07-custom-rules.test.ts`

### Test 1: Create Custom Regex Rule
```typescript
test('creates custom regex rule for employee ID pattern', async () => {
  await harness.signInTestUser(popupPage);

  // Navigate to Features → Custom Rules
  await popupPage.click('[data-tab="features"]');
  await popupPage.click('#customRulesTab');

  // Click "Add Rule"
  await popupPage.click('#addRuleBtn');

  // Fill form
  await popupPage.type('#ruleName', 'Employee ID');
  await popupPage.type('#rulePattern', 'EMP-\\d{6}');
  await popupPage.type('#ruleReplacement', 'EMPLOYEE_ID');

  // Save
  await popupPage.click('#saveRule');

  // Verify rule card appears
  await popupPage.waitForSelector('.rule-card');
  const ruleText = await popupPage.$eval('.rule-card', el => el.textContent);
  expect(ruleText).toContain('Employee ID');
  expect(ruleText).toContain('EMP-\\d{6}');

  await harness.signOutTestUser(popupPage);
});
```

### Test 2: Test Custom Rule Substitution
- Create rule (e.g., employee ID pattern)
- Send message in ChatGPT with matching pattern
- Intercept request
- Verify pattern replaced with substitution

### Test 3: Enable/Disable Rule
- Create rule, enable it
- Verify substitution works
- Disable rule
- Verify substitution doesn't occur
- Re-enable
- Verify works again

### Test 4: Edit Custom Rule
- Create rule
- Click edit
- Modify pattern/replacement
- Save
- Verify changes applied

---

## Phase 4: Prompt Templates Tests

**File:** `tests/e2e-puppeteer/features/08-prompt-templates.test.ts`

### Test 1: Create Template with Placeholders
```typescript
test('creates template with {{name}} and {{email}} placeholders', async () => {
  await harness.signInTestUser(popupPage);
  await harness.createTestProfile(popupPage, TEST_PROFILE);

  // Navigate to Features → Templates
  await popupPage.click('[data-tab="features"]');
  await popupPage.click('#promptTemplatesTab');

  // Click "New Template"
  await popupPage.click('#newTemplateBtn');

  // Fill form
  await popupPage.type('#templateName', 'Introduction');
  await popupPage.type('#templateContent',
    'Hi, my name is {{name}} and you can reach me at {{email}}.'
  );
  await popupPage.select('#templateCategory', 'Personal');

  // Save
  await popupPage.click('#saveTemplate');

  // Verify template card appears
  await popupPage.waitForSelector('.template-card');
  const templateText = await popupPage.$eval('.template-card', el => el.textContent);
  expect(templateText).toContain('Introduction');

  await harness.deleteTestProfile(popupPage, TEST_PROFILE.profileName);
  await harness.signOutTestUser(popupPage);
});
```

### Test 2: Use Template - Placeholder Replacement
- Create profile with name/email
- Create template with `{{name}}` and `{{email}}`
- Click "Use Template" button
- Verify ChatGPT textarea filled with ALIAS data
- Verify formatting (newlines) preserved

### Test 3: Template with All Placeholders
- Test all placeholders: `{{name}}`, `{{email}}`, `{{phone}}`, `{{address}}`, `{{company}}`
- Verify all replaced correctly

### Test 4: Delete Template
- Create template
- Click delete
- Confirm
- Verify removed from list

---

## Phase 5: Theme & Background Tests

**File:** `tests/e2e-puppeteer/features/09-theme-customization.test.ts`

### Test 1: Switch Between Themes
```typescript
test('switches between light and dark themes', async () => {
  await harness.signInTestUser(popupPage);

  // Navigate to Settings → Theme
  await popupPage.click('[data-tab="settings"]');

  // Start with light theme
  await popupPage.click('[data-theme="classic-light"]');
  await new Promise(resolve => setTimeout(resolve, 500));

  // Verify light theme applied
  const bgColorLight = await popupPage.$eval('body',
    el => window.getComputedStyle(el).backgroundColor
  );
  expect(bgColorLight).toContain('rgb(255, 255, 255)'); // White-ish

  // Switch to dark theme
  await popupPage.click('[data-theme="classic-dark"]');
  await new Promise(resolve => setTimeout(resolve, 500));

  // Verify dark theme applied
  const bgColorDark = await popupPage.$eval('body',
    el => window.getComputedStyle(el).backgroundColor
  );
  expect(bgColorDark).toContain('rgb(15, 23, 42)'); // Dark slate

  await harness.signOutTestUser(popupPage);
});
```

### Test 2: Custom Background Upload (PRO)
- Sign in
- Navigate to Settings → Background
- Click "Upload Custom Background"
- Select test image file
- Verify background appears
- Take screenshot to verify visually

### Test 3: Background Transparency Slider
- Select background
- Drag transparency slider to 50%
- Verify container opacity changes
- Take screenshot at 0%, 50%, 100%

### Test 4: Blur Effect Toggle
- Select background
- Enable blur toggle
- Verify `data-bg-blur="true"` on body
- Verify blur applied visually (screenshot)
- Disable blur
- Verify blur removed

### Test 5: Theme Color Readability (Visual Regression)
- For each theme (12 total):
  - Apply theme
  - Take screenshot
  - Verify text readable (manual or automated contrast check)

---

## Phase 6: Document Analysis Tests

**File:** `tests/e2e-puppeteer/features/10-document-analysis.test.ts`

### Test 1: Upload PDF with PII
- Sign in
- Navigate to Features → Document Analysis
- Upload test PDF with name/email
- Verify extraction completes
- Verify extracted data shown in UI

### Test 2: Generate Profile from Document
- Upload document
- Click "Create Profile from Document"
- Verify profile modal pre-filled with extracted data
- Save profile
- Verify profile created

### Test 3: Document Queue
- Upload multiple documents
- Verify queue shows all documents
- Verify processing status updates

---

## Phase 7: Google Quick Start Tests

**File:** `tests/e2e-puppeteer/features/03-google-quick-start.test.ts` (expand existing)

### Test 1: Quick Start Button Appears After Sign-In
```typescript
test('Quick Start button visible after Google sign-in', async () => {
  await harness.signInTestUser(popupPage);

  // Navigate to Aliases tab
  await popupPage.click('[data-tab="aliases"]');

  // Verify Quick Start buttons now visible
  const headerBtn = await popupPage.$('#googleQuickStartBtn');
  expect(headerBtn).toBeTruthy();

  const headerBtnVisible = await popupPage.$eval('#googleQuickStartBtn',
    el => !el.classList.contains('hidden')
  );
  expect(headerBtnVisible).toBe(true);

  await harness.signOutTestUser(popupPage);
});
```

### Test 2: Quick Start Pre-Fills Profile
- Sign in
- Click "Quick Start"
- Verify modal opens
- Verify real name from Google account pre-filled
- Verify real email from Google account pre-filled
- Verify alias name auto-generated
- Verify alias email auto-generated

### Test 3: Quick Start + Substitution
- Use Quick Start to create profile
- Send message with real name in ChatGPT
- Verify alias substituted

---

## Phase 8: Advanced Features Tests

**File:** `tests/e2e-puppeteer/features/11-advanced-features.test.ts`

### Test 1: Minimal Mode Toggle
- Start in full mode
- Click minimize button
- Verify `#minimalView` visible
- Verify `#fullView` hidden
- Click expand button
- Verify full mode restored

### Test 2: Keyboard Shortcuts
- Press `Ctrl+Shift+P` (or configured shortcut)
- Verify popup opens
- Press `Esc`
- Verify popup closes

### Test 3: Stats Tab
- Sign in
- Navigate to Stats tab
- Verify metrics shown (substitutions count, etc.)
- Create profile + send message
- Verify count increases

---

## Test Data

### Standard Test Profile
```typescript
const TEST_PROFILE: ProfileData = {
  profileName: 'E2E Test Profile',
  realName: 'John Smith',
  aliasName: 'Alex Johnson',
  realEmail: 'john.smith@test.com',
  aliasEmail: 'alex.johnson@test.com',
  realPhone: '+1 555-0100',
  aliasPhone: '+1 555-0999',
  realAddress: '123 Main St, Anytown, CA 90210',
  aliasAddress: '456 Oak Ave, Somewhere, NY 10001',
  realCompany: 'Test Corp Inc',
  aliasCompany: 'Sample LLC'
};
```

### Test Messages
```typescript
const TEST_MESSAGES = {
  nameOnly: 'My name is John Smith',
  emailOnly: 'Contact me at john.smith@test.com',
  phoneOnly: 'Call me at +1 555-0100',
  multiField: 'I am John Smith, email john.smith@test.com, phone +1 555-0100',
  allFields: 'Hi, I\'m John Smith from Test Corp Inc. Reach me at john.smith@test.com or +1 555-0100. Address: 123 Main St, Anytown, CA 90210.'
};
```

### Test API Keys
```typescript
const TEST_API_KEYS = {
  openai: 'sk-proj-' + 'A'.repeat(48),
  github: 'ghp_' + 'B'.repeat(36),
  aws: 'AKIA' + 'C'.repeat(16),
};
```

---

## Screenshot Testing Strategy

### Visual Regression Tests

**Tool:** Puppeteer screenshot + manual review (or Percy/Chromatic later)

**Scenarios:**
1. **All 12 themes** - Screenshot each theme
2. **Light vs Dark** - Compare readability
3. **Backgrounds** - Test transparency at 0%, 50%, 100%
4. **Blur effect** - Before/after screenshots
5. **Minimal mode** - Compact UI screenshot
6. **Error states** - Empty states, loading states
7. **Modal dialogs** - Profile modal, delete confirmation, etc.

**Storage:**
```
tests/e2e-puppeteer/screenshots/
├── themes/
│   ├── classic-light.png
│   ├── classic-dark.png
│   ├── ocean.png
│   └── ... (12 total)
├── backgrounds/
│   ├── mountains-0.png
│   ├── mountains-50.png
│   ├── mountains-100.png
│   └── blur-effect.png
└── features/
    ├── minimal-mode.png
    ├── profile-modal.png
    └── api-key-vault.png
```

---

## Test Execution Plan

### Daily CI/CD
- ✅ Core tests (extension loading, popup UI)
- ✅ Auth lifecycle test
- ⏸️ Basic substitution (once implemented)

### Weekly Full Suite
- All substitution tests
- All feature tests
- Visual regression tests

### Pre-Release
- Full suite
- Manual QA on all scenarios
- Screenshot comparison review

---

## Success Metrics

### Phase 1 Complete When:
- ✅ Auth flow works (DONE!)
- ✅ 5 core substitution tests pass
- ✅ Request interception captures API calls
- ✅ All assertions pass consistently

### Phase 2 Complete When:
- ✅ API Key Vault UI implemented
- ✅ 4 API key tests pass
- ✅ Custom rules tests pass
- ✅ Template tests pass

### Phase 3 Complete When:
- ✅ All theme tests pass
- ✅ Background tests pass
- ✅ Visual regression baseline established
- ✅ 90%+ test coverage on features

---

## Timeline Estimate

| Phase | Duration | Status |
|-------|----------|--------|
| Auth Flow | 4-6 hours | ✅ DONE |
| Core Substitution | 4-6 hours | ⏳ Next |
| API Key Vault | 4-6 hours | ⏸️ Needs UI |
| Custom Rules | 3-4 hours | ⏸️ Pending |
| Prompt Templates | 3-4 hours | ⏸️ Pending |
| Themes/Backgrounds | 4-6 hours | ⏸️ Pending |
| Document Analysis | 3-4 hours | ⏸️ Pending |
| Advanced Features | 2-3 hours | ⏸️ Pending |
| **TOTAL** | **27-39 hours** | **~6% Done** |

---

## Next Steps

1. ✅ **Complete auth lifecycle test** (DONE!)
2. **Implement core substitution test** (`05-profile-substitution.test.ts`)
3. **Build request interception helper** (`interceptChatRequest()`)
4. **Create verification helper** (`verifySubstitution()`)
5. **Add visual regression testing framework**
6. **Document all test scenarios with examples**

---

**Last Updated:** 2025-01-14
**Auth Flow Status:** ✅ Production Ready
**Next Milestone:** Core Substitution Tests
