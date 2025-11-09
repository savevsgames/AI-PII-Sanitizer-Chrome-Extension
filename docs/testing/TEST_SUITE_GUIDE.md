# Test Suite Guide - How to Run and Add Tests

**Date:** 2025-01-08
**Purpose:** Complete guide to running tests and adding new test files

---

## Test Suite Overview

**Testing Framework:** Jest + ts-jest
**Test Environment:** jsdom (browser-like environment)
**Total Tests:** 431 (387 passing, 44 failing)
**Test Files:** 15 files in `/tests` directory

---

## Running Tests

### All Available Test Commands

```bash
# Run all tests (including e2e - will fail if Playwright not configured)
npm test

# Run unit tests only (RECOMMENDED - excludes e2e)
npm run test:unit

# Run e2e tests only (requires Playwright)
npm run test:e2e

# Run e2e tests with UI
npm run test:e2e:ui

# Run full suite (unit + coverage + build)
npm run test:all

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Build + e2e tests
npm run test:e2e:full
```

### Recommended Workflow

**For development:**
```bash
npm run test:unit
```
This excludes e2e tests and runs fast (~6-7 seconds).

**Before commit:**
```bash
npm run test:all
```
This runs unit tests + coverage + production build.

---

## Test Suite Structure

### Configuration Files

**`jest.config.js`** - Main Jest configuration:
```javascript
module.exports = {
  preset: 'ts-jest',              // Use TypeScript
  testEnvironment: 'jsdom',       // Browser-like environment
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  setupFiles: ['<rootDir>/tests/setup.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setupAfterEnv.js'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
  ],
};
```

**`tests/setup.js`** - Global test setup (runs before all tests):
- Mocks Chrome Storage API (`chrome.storage.local`, `chrome.storage.onChanged`)
- Provides Web Crypto API polyfill (`@peculiar/webcrypto`)
- Sets up `TextEncoder` and `TextDecoder`
- Creates mock storage data object

**`tests/setupAfterEnv.js`** - Environment setup (runs after test environment initialized):
- Overrides jsdom's incomplete crypto with full Web Crypto API
- Ensures `crypto.subtle` is available for encryption tests

---

## Current Test Files (15 total)

### ✅ Passing Test Suites (10):

1. **`tests/aliasEngine.test.ts`** - Alias substitution engine
2. **`tests/aliasGenerator.test.ts`** - Quick alias generator
3. **`tests/apiKeyDetector.test.ts`** - API key pattern detection
4. **`tests/redactionEngine.test.ts`** - Custom redaction rules
5. **`tests/serviceWorker.test.ts`** - Background service worker
6. **`tests/templateEngine.test.ts`** - Prompt template variables
7. **`tests/textProcessor.test.ts`** - Text processing utilities
8. **`tests/utils.test.ts`** - Utility functions
9. **`tests/validation.test.ts`** - Form validation
10. **`tests/xss-prevention.test.ts`** - XSS security

### ❌ Failing Test Suites (5):

11. **`tests/firebase.test.ts`** - Firebase auth (44 tests, some failing)
    - Issue: Missing environment variables, mock function errors
12. **`tests/storage.test.ts`** - Storage manager (encryption context issues)
    - Issue: `ENCRYPTION_KEY_UNAVAILABLE` - auth required for encrypted data
13. **`tests/stripe.test.ts`** - Stripe integration
    - Issue: Mock setup issues
14. **`tests/tierSystem.test.ts`** - FREE/PRO tier system
    - Issue: Dependencies on failing firebase/storage tests
15. **`tests/e2e/chatgpt.test.ts`** - End-to-end ChatGPT
    - Issue: `TransformStream is not defined` (Playwright not compatible with Jest)

---

## How to Exclude E2E Tests

E2E tests use Playwright which is incompatible with Jest's environment.

### Method 1: Use `test:unit` script (RECOMMENDED)

```bash
npm run test:unit
```

This uses: `jest --testPathIgnorePatterns=e2e`

### Method 2: Update jest.config.js (if needed)

Add to `jest.config.js`:
```javascript
module.exports = {
  // ... other config
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
};
```

### Method 3: Run specific test file

```bash
npm test -- tests/aliasEngine.test.ts
```

---

## How to Write a New Test File

### Step 1: Create Test File

Create file in `/tests` directory with `.test.ts` extension:

```
tests/
  aliasVariations.test.ts   (NEW)
```

### Step 2: Basic Test Template

```typescript
/**
 * Tests for [Feature Name]
 */

import { functionToTest } from '../src/lib/yourModule';

describe('[Module Name]', () => {
  describe('[Function or Feature]', () => {
    it('should [expected behavior]', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = functionToTest(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Step 3: Use Chrome API Mocks

The Chrome Storage API is automatically mocked in `tests/setup.js`:

```typescript
import { mockStorageData } from './setup';

describe('Storage Test', () => {
  beforeEach(() => {
    // Clear mock storage before each test
    Object.keys(mockStorageData).forEach(key => delete mockStorageData[key]);
  });

  it('should save to chrome.storage', async () => {
    await chrome.storage.local.set({ key: 'value' });

    const result = await chrome.storage.local.get('key');
    expect(result.key).toBe('value');
  });
});
```

### Step 4: Test Async Functions

Use `async/await` or return the Promise:

```typescript
it('should handle async operations', async () => {
  const result = await someAsyncFunction();
  expect(result).toBeDefined();
});
```

### Step 5: Mock External Dependencies

```typescript
// Mock Firebase
jest.mock('../src/lib/firebase', () => ({
  auth: {
    currentUser: { uid: 'test-uid' },
  },
  db: jest.fn(),
}));

// Mock Stripe
jest.mock('../src/lib/stripe', () => ({
  createCheckoutSession: jest.fn().mockResolvedValue({ url: 'test-url' }),
}));
```

---

## Example: Adding Alias Variations Tests

### Create `tests/aliasVariations.test.ts`:

```typescript
/**
 * Tests for Alias Variations Engine
 */

import {
  generateNameVariations,
  generateEmailVariations,
  generatePhoneVariations,
  generateIdentityVariations,
  containsVariation,
  findVariations,
} from '../src/lib/aliasVariations';

describe('Alias Variations', () => {
  describe('generateNameVariations', () => {
    it('should generate variations for two-part name', () => {
      const variations = generateNameVariations('Greg Barker');

      expect(variations).toContain('Greg Barker');    // Original
      expect(variations).toContain('GregBarker');     // No space
      expect(variations).toContain('gregbarker');     // Lowercase no space
      expect(variations).toContain('gbarker');        // First initial + last
      expect(variations).toContain('G.Barker');       // Abbreviated
      expect(variations).toContain('G Barker');       // Abbreviated with space
      expect(variations).toContain('greg.barker');    // Email-style
    });

    it('should handle single word name', () => {
      const variations = generateNameVariations('Madonna');

      expect(variations).toContain('Madonna');
      expect(variations).toContain('madonna');
      expect(variations).toContain('MADONNA');
    });

    it('should handle three-part name', () => {
      const variations = generateNameVariations('John Paul Smith');

      expect(variations).toContain('John Paul Smith');
      expect(variations).toContain('JohnSmith');      // Skip middle
      expect(variations).toContain('John Smith');     // Skip middle
      expect(variations).toContain('J.P.Smith');      // Initials
    });

    it('should return empty array for empty string', () => {
      const variations = generateNameVariations('');
      expect(variations).toEqual([]);
    });
  });

  describe('generateEmailVariations', () => {
    it('should generate email variations', () => {
      const variations = generateEmailVariations('greg.barker@example.com');

      expect(variations).toContain('greg.barker@example.com');  // Original
      expect(variations).toContain('gregbarker@example.com');   // No dots
      expect(variations).toContain('Greg.Barker@example.com');  // Title case
    });

    it('should handle invalid email', () => {
      const variations = generateEmailVariations('not-an-email');
      expect(variations).toEqual([]);
    });
  });

  describe('generatePhoneVariations', () => {
    it('should generate US phone variations', () => {
      const variations = generatePhoneVariations('(555) 123-4567');

      expect(variations).toContain('(555) 123-4567');   // Original
      expect(variations).toContain('5551234567');       // Digits only
      expect(variations).toContain('555-123-4567');     // Dashes
      expect(variations).toContain('555.123.4567');     // Dots
      expect(variations).toContain('+1-555-123-4567');  // Country code
    });
  });

  describe('containsVariation', () => {
    it('should find variation in text', () => {
      const variations = ['GregBarker', 'gregbarker', 'gbarker'];
      const text = 'My username is gregbarker123';

      expect(containsVariation(text, variations)).toBe(true);
    });

    it('should not find variation in text', () => {
      const variations = ['GregBarker', 'gregbarker'];
      const text = 'My name is John Smith';

      expect(containsVariation(text, variations)).toBe(false);
    });
  });

  describe('findVariations', () => {
    it('should find all matching variations', () => {
      const variations = ['Greg Barker', 'GregBarker', 'gregbarker', 'gbarker'];
      const text = 'User gregbarker logged in as GregBarker';

      const found = findVariations(text, variations);
      expect(found).toContain('gregbarker');
      expect(found).toContain('GregBarker');
      expect(found.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('generateIdentityVariations', () => {
    it('should generate variations for all identity fields', () => {
      const identity = {
        name: 'Greg Barker',
        email: 'greg.barker@example.com',
        phone: '(555) 123-4567',
      };

      const variations = generateIdentityVariations(identity);

      expect(variations.name).toBeDefined();
      expect(variations.email).toBeDefined();
      expect(variations.phone).toBeDefined();

      expect(variations.name.length).toBeGreaterThan(5);
      expect(variations.email.length).toBeGreaterThan(3);
      expect(variations.phone.length).toBeGreaterThan(5);
    });
  });
});
```

### Run the new test:

```bash
# Run all tests including new one
npm run test:unit

# Run only the new test file
npm test -- tests/aliasVariations.test.ts

# Run with watch mode (auto-reruns on changes)
npm run test:watch -- tests/aliasVariations.test.ts
```

---

## Common Testing Patterns

### 1. Testing with Chrome Storage

```typescript
it('should save and retrieve data', async () => {
  const data = { profiles: [{ id: '1', name: 'Test' }] };

  await chrome.storage.local.set(data);
  const result = await chrome.storage.local.get('profiles');

  expect(result.profiles).toEqual(data.profiles);
});
```

### 2. Testing Encryption (Web Crypto API available)

```typescript
it('should encrypt and decrypt data', async () => {
  const plaintext = 'secret data';
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  // Test encryption/decryption logic
});
```

### 3. Testing with Mocks

```typescript
// Mock a module
jest.mock('../src/lib/firebase');

// Mock a function
const mockFn = jest.fn().mockResolvedValue('success');

// Verify mock was called
expect(mockFn).toHaveBeenCalledWith('expected-arg');
expect(mockFn).toHaveBeenCalledTimes(1);
```

### 4. Testing Error Cases

```typescript
it('should throw error for invalid input', () => {
  expect(() => functionUnderTest(null)).toThrow('Invalid input');
});

it('should handle async errors', async () => {
  await expect(asyncFunction()).rejects.toThrow('Error message');
});
```

### 5. Setup and Teardown

```typescript
describe('Feature', () => {
  beforeEach(() => {
    // Runs before each test
    // Reset state, clear mocks
  });

  afterEach(() => {
    // Runs after each test
    // Cleanup
  });

  beforeAll(() => {
    // Runs once before all tests in this describe block
  });

  afterAll(() => {
    // Runs once after all tests in this describe block
  });
});
```

---

## Debugging Tests

### Run single test file

```bash
npm test -- tests/yourTest.test.ts
```

### Run single test case

```typescript
it.only('should run only this test', () => {
  // This is the only test that will run
});
```

### Skip a test

```typescript
it.skip('should be skipped', () => {
  // This test won't run
});
```

### Debug with console.log

```typescript
it('should debug', () => {
  const result = functionUnderTest();
  console.log('Debug output:', result);
  expect(result).toBeDefined();
});
```

### Run with verbose output

```bash
npm test -- --verbose
```

---

## Test Coverage

### Generate coverage report

```bash
npm run test:coverage
```

This creates a coverage report in `/coverage` directory.

### View coverage

Open `coverage/lcov-report/index.html` in browser for detailed coverage report.

### Coverage thresholds (not currently configured)

Can add to `jest.config.js`:
```javascript
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80
  }
}
```

---

## Current Test Status Summary

```
Test Suites: 4 failed, 10 passed, 14 total (excludes e2e)
Tests:       44 failed, 387 passed, 431 total
Time:        ~6-7 seconds
```

**Failing Suites:**
1. `firebase.test.ts` - Environment variable issues, mock errors
2. `storage.test.ts` - Encryption key unavailable (needs auth mock)
3. `stripe.test.ts` - Mock setup issues
4. `tierSystem.test.ts` - Dependencies on firebase/storage

**E2E Suite:**
- `e2e/chatgpt.test.ts` - Excluded from unit tests (uses Playwright)

---

## Next Steps

1. **Fix failing tests** - Get to 100% pass rate on existing tests
2. **Add missing tests** - Use TEST_COVERAGE_ANALYSIS_2025-01-08.md as guide
3. **Target: 450-550 new tests** over 3-4 weeks

---

## Quick Reference

```bash
# Most common commands
npm run test:unit              # Run all unit tests (no e2e)
npm test -- path/to/test.ts    # Run specific test file
npm run test:watch             # Watch mode
npm run test:coverage          # Coverage report
```

**Test file naming:** `*.test.ts` or `*.spec.ts`
**Test location:** `/tests` directory
**Setup files:** `tests/setup.js`, `tests/setupAfterEnv.js`
**Mocks:** Chrome Storage API, Web Crypto API automatically available
