# E2E Substitution Test Framework

## Overview

This document outlines the core testing framework for PII substitution in AI chat platforms. **This framework is foundational** and required for testing almost all feature tests going forward.

## Core Flow

All substitution tests follow this pattern:

```
1. Sign in with test_user@promptblocker.com
2. Create alias profile with real/alias data
3. Enable profile
4. Navigate to ChatGPT/Claude
5. Send message containing real PII
6. Intercept outgoing request
7. Verify substitution:
   - Real data NOT present in request
   - Alias data IS present in request
8. Clean up (delete profile, sign out)
```

## Implementation Priority

### Phase 1: Core Substitution Framework (NEXT)
**File:** `tests/e2e-puppeteer/core/04-profile-substitution.test.ts`

**Purpose:** Build reusable framework for all future substitution tests

**Test Scenarios:**
1. ✅ **Prerequisites check**
   - Test user authentication works
   - Profile creation works
   - ChatGPT page loads correctly

2. 🔧 **Basic substitution flow**
   - Create profile with name + email
   - Enable profile
   - Send message with real name
   - Verify alias name in intercepted request

3. 🔧 **Multi-field substitution**
   - Create profile with name, email, phone
   - Test all fields are substituted in same message

4. 🔧 **Profile toggle**
   - Disable profile
   - Verify NO substitution occurs
   - Re-enable profile
   - Verify substitution resumes

5. 🔧 **Multiple profiles**
   - Create 2 profiles
   - Enable profile #1 → verify substitution
   - Switch to profile #2 → verify different substitution

**Key Components to Build:**
- `signInTestUser()` helper - Automate Google OAuth
- `createTestProfile()` helper - Create profile via UI
- `interceptChatRequest()` helper - Capture outgoing API calls
- `verifySubstitution()` helper - Assert alias present, real absent
- `cleanupTestProfile()` helper - Delete test profiles

**Integration with Existing Code:**
- Reuse `setupIntegrationTests()` pattern from integration tests
- Use test_user credentials from `.env.test.local`
- Follow harness pattern from `ExtensionTestHarness.ts`

---

## Phase 2: Feature-Specific Substitution Tests

Once Phase 1 framework is built, these tests become straightforward:

### Google Quick Start + Substitution
**File:** `tests/e2e-puppeteer/features/03-google-quick-start.test.ts` (expand existing)

**Flow:**
1. Sign in
2. Click "Quick Start" button
3. Verify modal pre-filled
4. Save profile
5. **USE FRAMEWORK:** Test substitution with quick-generated profile

### Document Analysis + Substitution
**File:** `tests/e2e-puppeteer/features/05-document-analysis.test.ts`

**Flow:**
1. Upload document (PDF/DOCX with PII)
2. Extract PII from document → populate profile
3. **USE FRAMEWORK:** Test document content is substituted in chat

### Prompt Templates + Substitution
**File:** `tests/e2e-puppeteer/features/06-prompt-templates.test.ts`

**Flow:**
1. Create template with PII placeholders
2. Use template in chat
3. **USE FRAMEWORK:** Verify placeholders replaced with aliases

### Custom Rules + Substitution
**File:** `tests/e2e-puppeteer/features/07-custom-rules.test.ts`

**Flow:**
1. Create custom regex rule (e.g., employee ID pattern)
2. Send message with employee ID
3. **USE FRAMEWORK:** Verify custom rule applied

---

## Technical Architecture

### Request Interception

```typescript
// Puppeteer request interception
await chatPage.setRequestInterception(true);

chatPage.on('request', (request) => {
  const url = request.url();

  if (url.includes('/backend-api/conversation')) {
    const postData = request.postData();
    const body = JSON.parse(postData);

    // Verify substitution
    expect(body.messages[0].content).toContain(aliasName);
    expect(body.messages[0].content).not.toContain(realName);

    capturedRequest = body;
  }

  request.continue();
});
```

### Authentication Helper

```typescript
async function signInTestUser(popupPage: Page): Promise<void> {
  // Click sign-in button
  await popupPage.click('#headerSignInBtn');
  await wait(500);

  // Auth modal opens
  await popupPage.waitForSelector('#authModal', { visible: true });

  // Click Google sign-in
  await popupPage.click('#googleSignInBtn');

  // Google OAuth popup opens (new window)
  const pages = await browser.pages();
  const googleAuthPage = pages[pages.length - 1];

  // Fill Google credentials
  await googleAuthPage.type('input[type="email"]', process.env.TEST_USER_EMAIL!);
  await googleAuthPage.click('#identifierNext');
  await wait(1000);

  await googleAuthPage.type('input[type="password"]', process.env.TEST_USER_PASSWORD!);
  await googleAuthPage.click('#passwordNext');
  await wait(2000);

  // Wait for auth to complete
  await popupPage.waitForSelector('#headerUserProfileContainer', { visible: true });

  console.log('✅ Test user signed in');
}
```

### Profile Creation Helper

```typescript
async function createTestProfile(
  popup: PopupPage,
  data: ProfileData
): Promise<string> {
  // Click New Profile
  await popup.clickNewProfile();

  // Fill form
  await popup.fillProfileForm(data);

  // Save
  await popup.saveProfile();

  // Get profile ID (from profile list)
  const profileCount = await popup.getProfileCount();
  expect(profileCount).toBeGreaterThan(0);

  console.log(`✅ Profile created: ${data.profileName}`);

  return data.profileName!;
}
```

---

## Test Data Strategy

### Standard Test Profile
```typescript
const STANDARD_TEST_PROFILE: ProfileData = {
  profileName: 'E2E Test Profile',
  realName: 'John Test Doe',
  aliasName: 'Alice Testington',
  realEmail: 'john.test@real.com',
  aliasEmail: 'alice.test@alias.com',
  realPhone: '555-1234',
  aliasPhone: '555-9999'
};
```

### Test Message Templates
```typescript
const TEST_MESSAGES = {
  simple: 'My name is {realName}',
  email: 'Contact me at {realEmail}',
  multiField: 'I am {realName}, email {realEmail}, phone {realPhone}',
  complex: 'Hi, I\'m {realName} from {realAddress}. You can reach me at {realEmail} or {realPhone}.'
};
```

---

## Success Criteria

### Phase 1 Complete When:
- ✅ Test user can sign in via OAuth automation
- ✅ Profile can be created via UI
- ✅ Request interception captures ChatGPT API calls
- ✅ Substitution verification works reliably
- ✅ All 5 core scenarios pass
- ✅ Framework is reusable for other tests

### Phase 2 Complete When:
- ✅ All feature tests use substitution framework
- ✅ Document analysis extracts and substitutes PII
- ✅ Prompt templates work with aliases
- ✅ Custom rules apply correctly
- ✅ Full coverage of substitution edge cases

---

## Timeline Estimate

- **Phase 1 (Core Framework):** 4-6 hours
  - OAuth automation: 2 hours
  - Profile helpers: 1 hour
  - Request interception: 1 hour
  - Test scenarios: 2 hours

- **Phase 2 (Feature Tests):** 6-8 hours
  - Google Quick Start expansion: 1 hour
  - Document Analysis: 2 hours
  - Prompt Templates: 2 hours
  - Custom Rules: 2 hours
  - Edge cases & polish: 1 hour

**Total:** 10-14 hours for complete substitution test coverage

---

## Notes

- OAuth automation is the most complex part - may need fallback for manual testing
- Request interception must handle async timing correctly
- Clean up test profiles after each test to avoid quota issues
- Consider PRO tier testing (requires Stripe subscription handling)

---

**Status:** Phase 1 ready to begin
**Dependencies:** Test user restored ✅, E2E harness working ✅
**Next Step:** Implement `04-profile-substitution.test.ts`
