# Code Cleanup Plan

**Created:** 2025-11-03
**Purpose:** Track code quality issues found during test suite modernization

---

## Issues Found

### 1. textProcessor.ts - Missing Null Safety Guards

**File:** `src/lib/textProcessor.ts`
**Lines:** 12, 49, 76
**Severity:** Medium (potential runtime errors)

**Issue:**
- `extractAllText()` doesn't check if `data` is null/undefined before accessing properties
- Causes `TypeError: Cannot read properties of null` when called with null/undefined
- Also crashes when array elements are null in ChatGPT messages or Gemini contents

**Found By:** textProcessor.test.ts edge case tests

**Fix Needed:**
```typescript
export function extractAllText(data: any): string {
  // ADD NULL CHECK AT TOP
  if (!data || typeof data !== 'object') {
    return '';
  }

  // Copilot format check...
  if (data.event === 'send' && Array.isArray(data.content)) {
    // ...existing code
  }

  // ChatGPT format - ADD FILTER for null/undefined messages
  if (data.messages && Array.isArray(data.messages)) {
    return data.messages
      .filter(m => m && typeof m === 'object') // ADD THIS
      .map((m: any) => {
        // ...existing code
      })
      // ...
  }

  // Gemini format - ADD NULL CHECK in flatMap
  if (data.contents && Array.isArray(data.contents)) {
    return data.contents
      .filter(c => c && typeof c === 'object') // ADD THIS
      .flatMap((c: any) => c.parts?.map((p: any) => p.text) || [])
      // ...
  }
}
```

**Priority:** 🟡 Medium (implement before MVP launch)

**Test Coverage:** Already has tests that will pass after fix

---

## Future Cleanup Tasks

### Pattern to Watch For

As we add more tests, look for:

1. **Missing null/undefined checks** (like above)
2. **Commented-out code** that should be removed
3. **Console.logs** that should be removed (or use proper logging)
4. **Dead code paths** that are never executed
5. **Duplicate logic** that should be DRYed up
6. **Inconsistent naming** (camelCase vs snake_case)
7. **Large files** that should be split (popup-v2.ts is 901 lines!)

---

## Cleanup Sessions

### Session 1: Test Suite Modernization (Current)

**Date:** 2025-11-03
**Focus:** Add tests, find issues
**Issues Found:** 1 (textProcessor null safety)

### Session 2: (TBD)

**Focus:** TBD

---

## Summary Stats

- **Total Issues Found:** 1
- **Issues Fixed:** 0
- **Issues Deferred:** 1 (to be fixed before MVP launch)
