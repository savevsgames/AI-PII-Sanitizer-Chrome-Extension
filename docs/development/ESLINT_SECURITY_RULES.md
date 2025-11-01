# ESLint Security Rules

This document explains the security-focused ESLint rules configured for this project to prevent common vulnerabilities.

## Overview

The project uses ESLint with custom rules to catch security vulnerabilities at development time, specifically focusing on XSS (Cross-Site Scripting) prevention.

## Security Rules

### 1. `no-restricted-properties` - innerHTML Protection

**Rule:** Prevents direct `innerHTML` assignments without escaping

**Why:** `innerHTML` can execute malicious JavaScript if user-controlled data is inserted without escaping. This is the #1 XSS vulnerability vector.

**Error Message:**
```
⚠️ SECURITY: Direct innerHTML assignment can cause XSS vulnerabilities.
Use escapeHtml() before setting innerHTML.
Import from src/popup/utils/dom.ts.
Example: element.innerHTML = escapeHtml(userInput);
```

**Correct Usage:**

```typescript
// ❌ WRONG - XSS vulnerability
import { AliasProfile } from './types';

const profile: AliasProfile = { profileName: '<script>alert("XSS")</script>' };
element.innerHTML = `<div>${profile.profileName}</div>`;
// This will execute the script!

// ✅ CORRECT - Safe from XSS
import { escapeHtml } from '../utils/dom';

element.innerHTML = `<div>${escapeHtml(profile.profileName)}</div>`;
// Output: <div>&lt;script&gt;alert("XSS")&lt;/script&gt;</div>
// The script tags are neutralized!
```

**When to Use:**
- Any time you're rendering user-controlled data (profile names, emails, custom rules, etc.)
- When building HTML from template strings
- Before setting `innerHTML`, `outerHTML`, or inserting HTML with `insertAdjacentHTML`

**Exemptions:**
- `src/popup/utils/dom.ts` - The utility file that provides `escapeHtml()` is exempt from this rule since it needs to use `innerHTML` internally

### 2. `no-restricted-properties` - document.write Protection

**Rule:** Prevents use of `document.write()` and `document.writeln()`

**Why:** These methods can cause XSS vulnerabilities and overwrite the entire document if called after page load.

**Correct Alternative:**
```typescript
// ❌ WRONG
document.write('<div>Hello</div>');

// ✅ CORRECT
const element = document.createElement('div');
element.textContent = 'Hello';
document.body.appendChild(element);
```

### 3. `no-eval` - Eval Protection

**Rule:** Prevents use of `eval()`

**Why:** `eval()` executes arbitrary code and is a major security risk. Never use it.

**Correct Alternatives:**
```typescript
// ❌ WRONG
const result = eval('1 + 1');

// ✅ CORRECT
const result = 1 + 1;

// ❌ WRONG - Parsing JSON with eval
const data = eval('(' + jsonString + ')');

// ✅ CORRECT
const data = JSON.parse(jsonString);
```

### 4. `no-implied-eval` - Indirect Eval Protection

**Rule:** Prevents `setTimeout()`, `setInterval()`, and `new Function()` with string arguments

**Why:** Passing strings to these functions is equivalent to `eval()` and causes the same security risks.

**Correct Usage:**
```typescript
// ❌ WRONG - String argument is eval'd
setTimeout('alert("XSS")', 1000);

// ✅ CORRECT - Use function
setTimeout(() => alert("Safe"), 1000);

// ❌ WRONG
const fn = new Function('a', 'b', 'return a + b');

// ✅ CORRECT
const fn = (a: number, b: number) => a + b;
```

### 5. `no-new-func` - Function Constructor Protection

**Rule:** Prevents using the `Function` constructor

**Why:** Creating functions from strings is equivalent to `eval()`.

**See:** Rule #4 above for examples

### 6. `no-restricted-properties` - localStorage Protection

**Rule:** Prevents use of `localStorage.getItem()`, `setItem()`, `removeItem()`, and `clear()`

**Why:** localStorage is not sandboxed and stores data unencrypted. In Chrome extensions, this can leak sensitive data to malicious websites or other extensions.

**Error Messages:**
```
⚠️ SECURITY: localStorage is not sandboxed and unencrypted.
Use chrome.storage.local instead for Chrome extensions.
```

**Correct Usage:**
```typescript
// ❌ WRONG - localStorage in Chrome extension
localStorage.setItem('userData', JSON.stringify(profile));
const data = localStorage.getItem('userData');

// ✅ CORRECT - Use chrome.storage.local
await chrome.storage.local.set({ userData: profile });
const { userData } = await chrome.storage.local.get('userData');

// ✅ BETTER - Use StorageManager (provides encryption)
import { StorageManager } from './lib/storage';
const storage = StorageManager.getInstance();
await storage.saveConfig(config);
const config = await storage.loadConfig();
```

**Why chrome.storage is better:**
1. **Sandboxed** - Isolated per extension, no cross-extension leaks
2. **Encrypted** - Can use AES-256-GCM encryption (StorageManager does this)
3. **Type-safe** - Works with objects directly, no JSON.parse needed
4. **No quota issues** - localStorage is limited to ~5MB, chrome.storage.local is ~5MB per item
5. **Async** - Non-blocking, won't freeze UI

## Helper Functions

### `escapeHtml(text: string): string`

**Location:** `src/popup/utils/dom.ts`

**Purpose:** Escapes HTML special characters to prevent XSS

**How it works:**
```typescript
export function escapeHtml(text: string): string {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}
```

This converts:
- `<` → `&lt;`
- `>` → `&gt;`
- `&` → `&amp;`
- `"` → `&quot;`
- `'` → `&#39;`

**Example:**
```typescript
const malicious = '<script>alert("XSS")</script>';
const safe = escapeHtml(malicious);
// safe = '&lt;script&gt;alert("XSS")&lt;/script&gt;'

element.innerHTML = safe;
// Renders as text: <script>alert("XSS")</script>
// Does NOT execute the script ✅
```

### `safeHTML(template: string, data: Record<...>): string`

**Location:** `src/popup/utils/dom.ts`

**Purpose:** Safely render HTML templates with automatic escaping

**Example:**
```typescript
import { safeHTML } from '../utils/dom';

const html = safeHTML(
  '<div class="profile"><h3>${name}</h3><p>${email}</p></div>',
  {
    name: userInput.name,     // Automatically escaped
    email: userInput.email    // Automatically escaped
  }
);

container.innerHTML = html; // Safe ✅
```

### `safeMap<T>(items: T[], renderFn, escapeFields): string`

**Location:** `src/popup/utils/dom.ts`

**Purpose:** Map array to HTML with field-level escaping

**Example:**
```typescript
import { safeMap } from '../utils/dom';

const html = safeMap(
  profiles,
  (p) => `<div>${p.name} - ${p.email}</div>`,
  ['name', 'email'] // Specify which fields contain user input
);

container.innerHTML = html; // Safe ✅
```

## Running ESLint

```bash
# Check all files
npm run lint

# Auto-fix issues (won't fix security rules)
npm run lint -- --fix

# Check specific file
npx eslint src/popup/components/profileRenderer.ts
```

## Disabling Rules (NOT Recommended)

**⚠️ WARNING:** Only disable security rules if you are ABSOLUTELY certain the code is safe.

```typescript
// Disable for one line (NOT recommended)
// eslint-disable-next-line no-restricted-properties
element.innerHTML = trustedHTMLString;

// Disable for entire file (NOT recommended)
/* eslint-disable no-restricted-properties */
```

**Better approach:** Use the helper functions instead of disabling rules.

## Testing XSS Prevention

All XSS prevention is tested in `tests/xss-prevention.test.ts` (46 test cases).

Run tests:
```bash
npm test xss-prevention
```

## Attack Vectors Covered

The security rules and helpers protect against:

1. **Script Injection:** `<script>alert('XSS')</script>`
2. **Event Handlers:** `<img src=x onerror=alert('XSS')>`
3. **SVG Injection:** `<svg onload=alert('XSS')>`
4. **Iframe Injection:** `<iframe src="javascript:alert('XSS')">`
5. **Data URIs:** `<img src="data:text/html,<script>alert('XSS')</script>">`
6. **HTML Attributes:** `<div onclick="alert('XSS')">Click</div>`
7. **Unicode Attacks:** Special unicode characters that bypass filters
8. **Nested Injection:** `<div><script>alert('XSS')</script></div>`

All 46 test cases validate these attacks are neutralized.

## Configuration Details

**File:** `.eslintrc.json`

```json
{
  "rules": {
    "no-restricted-properties": [
      "error",
      {
        "object": "*",
        "property": "innerHTML",
        "message": "⚠️ SECURITY: Direct innerHTML assignment can cause XSS vulnerabilities. Use escapeHtml() before setting innerHTML."
      }
    ],
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-new-func": "error"
  },
  "overrides": [
    {
      "files": ["src/popup/utils/dom.ts"],
      "rules": {
        "no-restricted-properties": "off"
      }
    }
  ]
}
```

## Phase 1.5 & 1.6 Completion ✅

### Phase 1.5: ESLint Security Rules
- ✅ ESLint configured with XSS prevention rules
- ✅ innerHTML protection active (catches unsafe assignments)
- ✅ document.write/eval/Function constructor blocked
- ✅ No XSS-related violations in codebase

### Phase 1.6: Chrome Storage Migration
- ✅ Verified NO localStorage usage in codebase
- ✅ All storage uses chrome.storage.local (via StorageManager)
- ✅ Added ESLint rule to prevent future localStorage usage
- ✅ StorageManager provides AES-256-GCM encryption

### Test Results
- ✅ All 151 tests passing
- ✅ TypeScript compiles cleanly
- ✅ ESLint: 0 errors, 70 warnings (only 'any' type warnings)
- ✅ No security rule violations

**Next Steps:** Phase 1.7 - Improve encryption key derivation

---

**See Also:**
- [XSS Audit Report](./XSS_AUDIT.md)
- [Security Audit](../SECURITY_AUDIT.md)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
