# Test Suite Modernization Plan

**Status:** Phase 1 - Post-MVP Test Updates
**Date:** 2025-11-03

---

## Current Test Status

**Unit Tests:** 195 passing, 15 failing (storage.test.ts)
- ✅ aliasEngine.test.ts - PASSING
- ✅ apiKeyDetector.test.ts - PASSING
- ✅ redactionEngine.test.ts - PASSING
- ✅ validation.test.ts - PASSING
- ✅ xss-prevention.test.ts - PASSING
- ✅ utils.test.ts - PASSING
- ❌ storage.test.ts - 15 FAILING (encryption mocking issues)

**E2E Tests:** 1 file (ChatGPT only)
- ✅ chatgpt.test.ts - Tests profile CRUD, substitution flow

**Missing Platform Tests:** Gemini, Perplexity, Copilot (added after tests were written)

---

## Phase 1: Add Missing Platform Tests

### 1.1 textProcessor Platform Format Tests

**File:** `tests/textProcessor.test.ts` (CREATE NEW)

**Test Coverage Needed:**
- [ ] ChatGPT format detection and substitution
- [ ] Claude format detection and substitution
- [ ] Gemini format detection and substitution (form-encoded batchexecute)
- [ ] Perplexity format detection and substitution (dual-field: query_str + dsl_query)
- [ ] Copilot format detection and substitution (WebSocket content array)
- [ ] Unknown format handling
- [ ] Edge cases (empty body, malformed JSON, etc.)

**Priority:** 🔴 HIGHEST (core functionality)

---

### 1.2 serviceWorker Platform Detection Tests

**File:** `tests/serviceWorker.test.ts` (CREATE NEW)

**Test Coverage Needed:**
- [ ] detectService() for all 5 platforms
- [ ] Message passing (page context → service worker)
- [ ] Activity logging for each platform
- [ ] Stats tracking
- [ ] Error handling

**Priority:** 🔴 HIGH

---

### 1.3 Integration Tests for New Interception Methods

**File:** `tests/integration/interception.test.ts` (CREATE NEW)

**Test Coverage Needed:**
- [ ] fetch() interception (ChatGPT, Claude, Perplexity)
- [ ] XHR interception (Gemini) - page context
- [ ] WebSocket interception (Copilot) - page context
- [ ] inject.js script injection
- [ ] content.ts message passing

**Priority:** 🟡 MEDIUM (requires more complex setup)

---

## Phase 2: UI Flow Tests (Now that UI is polished)

### 2.1 Popup v2 Flow Tests

**File:** `tests/e2e/popup-flows.test.ts` (CREATE NEW)

**Test Coverage Needed:**
- [ ] Tab navigation (Profiles, Stats, Settings, Features, Activity Log)
- [ ] Profile creation modal flow
- [ ] Profile edit modal flow
- [ ] Profile delete confirmation flow
- [ ] Profile enable/disable toggle
- [ ] Empty states display
- [ ] Error states display
- [ ] Loading states display

**Priority:** 🟡 MEDIUM

---

### 2.2 API Key Vault Flow Tests

**File:** `tests/e2e/api-key-vault.test.ts` (CREATE NEW)

**Test Coverage Needed:**
- [ ] Add API key modal flow
- [ ] Edit API key flow
- [ ] Delete API key confirmation
- [ ] API key detection in profile text
- [ ] Protection mode toggle (auto-redact, warn, log-only)
- [ ] Usage stats display

**Priority:** 🟡 MEDIUM

---

### 2.3 Custom Rules Flow Tests

**File:** `tests/e2e/custom-rules.test.ts` (CREATE NEW)

**Test Coverage Needed:**
- [ ] Add custom rule modal flow
- [ ] Template selection
- [ ] Pattern testing (live preview)
- [ ] Edit rule flow
- [ ] Delete rule confirmation
- [ ] Enable/disable rule toggle
- [ ] Priority ordering
- [ ] Match count tracking

**Priority:** 🟡 MEDIUM

---

## Phase 3: Platform-Specific E2E Tests

### 3.1 Gemini E2E Test

**File:** `tests/e2e/gemini.test.ts` (CREATE NEW)

**Test Coverage Needed:**
- [ ] Profile creation → Gemini visit → XHR interception
- [ ] Form-encoded batchexecute format substitution
- [ ] Verify PII replaced in f.req parameter
- [ ] Activity log shows Gemini service
- [ ] Stats increment for Gemini

**Priority:** 🔴 HIGH

---

### 3.2 Perplexity E2E Test

**File:** `tests/e2e/perplexity.test.ts` (CREATE NEW)

**Test Coverage Needed:**
- [ ] Profile creation → Perplexity visit → fetch() interception
- [ ] Dual-field substitution (query_str AND dsl_query)
- [ ] Verify both fields substituted
- [ ] Activity log shows Perplexity service
- [ ] Stats increment for Perplexity

**Priority:** 🔴 HIGH

---

### 3.3 Copilot E2E Test

**File:** `tests/e2e/copilot.test.ts` (CREATE NEW)

**Test Coverage Needed:**
- [ ] Profile creation → Copilot visit → WebSocket interception
- [ ] Content array format substitution
- [ ] Verify text substituted in content[].text
- [ ] Activity log shows Copilot service
- [ ] Stats increment for Copilot

**Priority:** 🔴 HIGH

---

### 3.4 Claude E2E Test

**File:** `tests/e2e/claude.test.ts` (CREATE NEW)

**Test Coverage Needed:**
- [ ] Profile creation → Claude visit → fetch() interception
- [ ] JSON prompt format substitution
- [ ] Activity log shows Claude service
- [ ] Stats increment for Claude

**Priority:** 🟡 MEDIUM (similar to ChatGPT)

---

## Phase 4: Code Cleanup Issues Found

### Issues to Document as We Go:

**Format:** `// TODO-CLEANUP: [Brief description] - Found in [file]:[line]`

**Track in:** `CODE_CLEANUP_PLAN.md` (create as we find issues)

**Common Issues to Watch For:**
- Old commented-out code
- Unused imports
- Dead code paths
- Inconsistent naming
- Console.logs that should be removed
- Duplicate logic that should be DRYed up
- popup-v2.ts is 901 lines (needs refactoring)

---

## Phase 5: Fix Failing Tests

### 5.1 Storage Tests (15 failing)

**File:** `tests/storage.test.ts`

**Issue:** Encryption mocking in setup.js doesn't match real crypto.subtle API

**Fix Needed:**
- [ ] Update setup.js crypto mocks to properly simulate encryption/decryption
- [ ] Or update storage.test.ts to use real crypto in tests
- [ ] Ensure all 15 tests pass

**Priority:** 🟡 MEDIUM (not blocking, but should be fixed)

---

## Execution Order

1. **Week 1:** Phase 1 (Missing platform tests) + Phase 5 (Fix failing tests)
2. **Week 2:** Phase 3 (Platform E2E tests)
3. **Week 3:** Phase 2 (UI flow tests)
4. **Ongoing:** Phase 4 (Code cleanup tracking)

---

## Success Criteria

- [ ] All unit tests passing (210/210)
- [ ] textProcessor tests cover all 5 platform formats
- [ ] E2E tests for all 5 platforms
- [ ] UI flow tests for all major features
- [ ] Test coverage >80% for core functionality
- [ ] CODE_CLEANUP_PLAN.md documents all issues found

---

**Next Action:** Start with textProcessor.test.ts to add Gemini, Perplexity, Copilot format tests
