# Plan to Fix Failing Tests

**Date:** 2025-01-08
**Current Status:** 707/752 passing (94.0%)
**Failing Tests:** 45 tests across 5 test files
**Goal:** Achieve 100% pass rate on all unit tests

---

## Summary of Current Situation

### ✅ What's Working
- **321 new tests added** across 8 files (all passing 100%)
- **94% overall pass rate**
- All new functionality is well-tested
- Core business logic has excellent coverage

### ❌ What's Failing (45 tests)
All failures are **pre-existing** issues in:
1. `storage.test.ts` - 33 tests failing (encryption key issues)
2. `stripe.test.ts` - 7 tests failing (mock setup issues)
3. `firebase.test.ts` - Some tests failing (auth mocking)
4. `aliasGenerator.test.ts` - Some tests failing
5. `tierSystem.test.ts` - Tests failing (depends on storage/firebase)

---

## Root Causes Identified (from docs)

### 1. Storage Tests - ENCRYPTION_KEY_UNAVAILABLE Error

**Issue:** Tests require Firebase auth to access encryption keys, but no auth user is mocked.

**From test-modernization-plan.md:**
> "Encryption mocking in setup.js doesn't match real crypto.subtle API"

**From TEST_SUITE_GUIDE.md:**
> "Issue: `ENCRYPTION_KEY_UNAVAILABLE` - auth required for encrypted data"

**Root Cause:**
- `StorageManager.getEncryptionKey()` calls `StorageManager.getFirebaseKeyMaterial()`
- This requires `auth.currentUser` to be set
- Tests don't mock Firebase auth properly

**Solution Options:**

**Option A: Mock Firebase Auth in storage tests** (RECOMMENDED)
```typescript
// In storage.test.ts beforeEach()
jest.mock('../src/lib/firebase', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-123',
      email: 'test@example.com',
    }
  },
  db: { _type: 'firestore' },
}));
```

**Option B: Update StorageManager to handle missing auth gracefully in tests**
- Add test mode flag
- Skip encryption when flag is set
- Not recommended (changes production code for tests)

**Files to Update:**
- `tests/storage.test.ts` - Add auth mock
- `tests/setup.js` - Possibly add global auth mock

---

### 2. Stripe Tests - Mock Setup Issues

**Issue:** Firebase Functions mocking incomplete

**From stripe.test.ts code:**
- Tests mock `firebase/functions` but calls are failing
- Mock responses not matching actual API

**Solution:**
```typescript
// Better mock setup needed
jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({ /* mock functions object */ })),
  httpsCallable: jest.fn((functions, name) => {
    return jest.fn(async (data) => {
      // Return mock responses based on function name
      if (name === 'createCheckoutSession') {
        return { data: { url: 'https://checkout.stripe.com/test' } };
      }
      if (name === 'createPortalSession') {
        return { data: { url: 'https://billing.stripe.com/test' } };
      }
    });
  }),
}));
```

**Files to Update:**
- `tests/stripe.test.ts` - Improve Firebase Functions mocking

---

### 3. TierSystem Tests - Depends on Storage/Firebase

**Issue:** TierSystem tests fail because they use StorageManager which requires auth

**Solution:**
- Fix storage tests first (Option A above)
- TierSystem tests should pass automatically once storage encryption works

**Files to Update:**
- None (will be fixed by storage test fixes)

---

### 4. Firebase Tests - Auth Mocking Issues

**Issue:** Similar to storage - Firebase auth not properly mocked

**Solution:**
- Add comprehensive Firebase auth mock in setup.js
- Mock `signInWithPopup`, `onAuthStateChanged`, etc.

---

### 5. AliasGenerator Tests - Minor Issues

**Issue:** Unknown - need to investigate

**Action:** Run tests to see specific failures

---

## Detailed Action Plan

### Phase 1: Fix Storage Tests (33 tests) 🔴 HIGH PRIORITY

**Estimated Time:** 2-3 hours

**Steps:**

1. **Add Firebase Auth Mock to storage tests**
   ```typescript
   // In tests/storage.test.ts at the top
   jest.mock('../src/lib/firebase', () => ({
     auth: {
       currentUser: {
         uid: 'test-user-123',
         email: 'test@example.com',
       }
     },
     db: {},
   }));
   ```

2. **Verify crypto polyfill is working**
   - Check that `@peculiar/webcrypto` is installed
   - Verify `tests/setup.js` has crypto setup
   - Should already be working from previous phases

3. **Run storage tests and fix any remaining issues**
   ```bash
   npm test -- tests/storage.test.ts
   ```

4. **Update test expectations if behavior changed**
   - One test expects `null` config but gets default config
   - Change expectation to match new (better) behavior

**Expected Result:** 33 tests fixed → 740/752 passing (98.4%)

---

### Phase 2: Fix Stripe Tests (7 tests) 🟡 MEDIUM PRIORITY

**Estimated Time:** 1-2 hours

**Steps:**

1. **Improve Firebase Functions mocking**
   - Create comprehensive mock that returns proper responses
   - Mock both success and error cases

2. **Add Firebase auth mock** (if not already in setup.js)
   - Needed for `auth.currentUser.getIdToken()`

3. **Run stripe tests**
   ```bash
   npm test -- tests/stripe.test.ts
   ```

**Expected Result:** 7 tests fixed → 747/752 passing (99.3%)

---

### Phase 3: Fix Firebase Tests 🟡 MEDIUM PRIORITY

**Estimated Time:** 1-2 hours

**Steps:**

1. **Add comprehensive Firebase auth mocks**
   - `signInWithPopup`
   - `onAuthStateChanged`
   - `signOut`

2. **Run firebase tests**
   ```bash
   npm test -- tests/firebase.test.ts
   ```

**Expected Result:** Fix remaining firebase test failures

---

### Phase 4: Fix TierSystem Tests 🟢 AUTO-FIX

**Estimated Time:** 0 hours (depends on Phase 1)

**Steps:**
1. Run tierSystem tests after storage tests are fixed
   ```bash
   npm test -- tests/tierSystem.test.ts
   ```

**Expected Result:** Should pass automatically once storage encryption works

---

### Phase 5: Fix AliasGenerator Tests 🟢 LOW PRIORITY

**Estimated Time:** 30 minutes

**Steps:**
1. Run tests to identify issues
   ```bash
   npm test -- tests/aliasGenerator.test.ts
   ```

2. Fix based on error messages

---

## Quick Wins

### 1. Fix "missing config" Test (5 minutes)

**File:** `tests/storage.test.ts:370`

**Change:**
```typescript
// Before:
expect(config).toBeNull();

// After:
expect(config).toBeDefined();
expect(config.settings).toBeDefined();
expect(config.profiles).toEqual([]);
```

### 2. Exclude E2E Tests (Already Done ✅)

Using `npm run test:unit` already excludes e2e tests.

---

## Implementation Priority

### Must Fix (Before Launch):
1. ✅ Storage tests (33 tests) - **BLOCKING**
2. ✅ Stripe tests (7 tests) - **PAYMENT CRITICAL**
3. ✅ TierSystem tests - **REVENUE CRITICAL**

### Should Fix (Quality):
4. Firebase tests - **AUTH CRITICAL**
5. AliasGenerator tests - **QUALITY**

### Can Defer:
- E2E tests (run separately)
- UI component tests (manual QA)

---

## Testing the Fixes

After each phase, run:

```bash
# Run specific test file
npm test -- tests/storage.test.ts

# Run all unit tests
npm run test:unit

# Check overall pass rate
npm run test:coverage
```

**Target:** 100% pass rate (752/752 tests)

---

## Notes from Documentation

### From test-modernization-plan.md:
> "Update setup.js crypto mocks to properly simulate encryption/decryption
> OR update storage.test.ts to use real crypto in tests"

**Decision:** Use real crypto (already have @peculiar/webcrypto), just need proper auth mocking.

### From test-suite-status.md:
> "Storage tests: 56 total (23 passing, 33 failing)
> Issue: Chrome API mock issues - pre-existing"

**Clarification:** Not Chrome API - it's Firebase auth missing.

### From TEST_SUITE_GUIDE.md:
> "11. tests/firebase.test.ts - Firebase auth (44 tests, some failing)
>     - Issue: Missing environment variables, mock function errors
> 12. tests/storage.test.ts - Storage manager (encryption context issues)
>     - Issue: ENCRYPTION_KEY_UNAVAILABLE - auth required for encrypted data"

**Action:** Add Firebase auth mock globally in setup.js.

---

## Success Criteria

- [ ] All storage tests passing (33/33)
- [ ] All stripe tests passing (7/7)
- [ ] All tierSystem tests passing (15/15)
- [ ] All firebase tests passing
- [ ] All aliasGenerator tests passing
- [ ] **Overall: 752/752 tests passing (100%)**

---

## Files That Need Updates

1. **tests/setup.js** - Add Firebase auth mock globally
2. **tests/storage.test.ts** - Import and use auth mock
3. **tests/stripe.test.ts** - Improve Firebase Functions mock
4. **tests/firebase.test.ts** - Comprehensive auth mocks
5. **tests/aliasGenerator.test.ts** - TBD based on errors

---

## Timeline Estimate

| Phase | Task | Time | Priority |
|-------|------|------|----------|
| 1 | Fix storage tests | 2-3h | 🔴 HIGH |
| 2 | Fix stripe tests | 1-2h | 🟡 MEDIUM |
| 3 | Fix firebase tests | 1-2h | 🟡 MEDIUM |
| 4 | Fix tierSystem tests | Auto | 🟢 AUTO |
| 5 | Fix aliasGenerator | 30min | 🟢 LOW |
| **TOTAL** | **All fixes** | **5-8 hours** | |

---

## Next Steps

1. Start with Phase 1 (storage tests)
2. Add Firebase auth mock to tests/setup.js
3. Run storage tests and iterate
4. Move to Phase 2 (stripe)
5. Continue until 100% pass rate achieved

---

**Last Updated:** 2025-01-08
**Created By:** Claude Code Test Coverage Analysis
