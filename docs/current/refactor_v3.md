# Refactor V3: Project Analysis & Modernization Plan

**Date:** January 2025
**Purpose:** Comprehensive code review, refactoring plan, and rebranding preparation
**New Name:** `pseudonize.com` (from "AI PII Sanitizer")

---

## Executive Summary

**Current State:** Working MVP with profile editor and privacy policy. Basic PII substitution works for ChatGPT.

**Key Issues Found:**
1. ⚠️ **Large monolithic files** (popup-v2.ts: 901 lines, popup-v2.css: 1027 lines)
2. ⚠️ **XSS risk** in innerHTML usage (needs escapeHtml everywhere)
3. ⚠️ **No alias variations** (Greg Barker vs GregBarker vs gregbarker)
4. ⚠️ **Branding scattered** across 30+ files
5. ⚠️ **localStorage used** instead of chrome.storage API
6. ✅ **Strong foundation** (encryption, type safety, profile architecture)

**Recommended Actions:**
- **Phase 1:** Refactor popup-v2.ts into components
- **Phase 2:** Implement alias variations (PRO feature)
- **Phase 3:** Rebrand to Pseudonize
- **Phase 4:** Security hardening

---

## File Inventory & Analysis

### Critical Files (Need Immediate Attention)

| File | Lines | Purpose | Status | Refactor Priority |
|------|-------|---------|--------|-------------------|
| `src/popup/popup-v2.ts` | 901 | Popup UI logic | ⚠️ **Too large** | **HIGH** - Split into components |
| `src/popup/popup-v2.css` | 1027 | Popup styles | ⚠️ **Too large** | **MEDIUM** - Modularize with CSS variables |
| `src/lib/storage.ts` | 618 | Storage manager | ⚠️ **Complex** | **MEDIUM** - Split encryption/storage |
| `src/background/serviceWorker.ts` | 455 | Request interception | ✅ **OK** | **LOW** - Minor cleanup |
| `src/lib/types.ts` | 383 | Type definitions | ✅ **OK** | **LOW** - Organize by feature |
| `src/lib/aliasEngine.ts` | 366 | Core substitution | ⚠️ **Needs variations** | **HIGH** - Add regex matching |

### Core Library Files

| File | Lines | Purpose | Issues |
|------|-------|---------|--------|
| `src/lib/store.ts` | 268 | Zustand state | ✅ Good |
| `src/lib/apiKeyDetector.ts` | 170 | API key detection | ✅ Good (new) |
| `src/content/inject.js` | 219 | Page-level intercept | ✅ Good |
| `src/content/content.ts` | 62 | Message relay | ✅ Good |

### UI Files (Popup V2)

| File | Purpose | Lines | Issues |
|------|---------|-------|--------|
| `popup-v2.html` | Structure | 414 | ✅ Clean, semantic HTML |
| `popup-v2.css` | Styles | 1027 | ⚠️ Needs CSS variables, modularization |
| `popup-v2.ts` | Logic | 901 | ⚠️ **NEEDS REFACTOR** - Too many responsibilities |

**Popup-v2.ts Breakdown:**
- Lines 1-120: Tab navigation & init (120 lines) → `initUI.ts`
- Lines 158-433: Profile modal logic (275 lines) → `profileModal.ts`
- Lines 435-558: Profile rendering (123 lines) → `profileRenderer.ts`
- Lines 560-658: Stats rendering (98 lines) → `statsRenderer.ts`
- Lines 660-764: Activity log (104 lines) → `activityLog.ts`
- Lines 766-850: Minimal mode (84 lines) → `minimalMode.ts`
- Lines 852-901: Utilities (49 lines) → `utils.ts`

---

## Security Audit

### ⚠️ High Priority Issues

#### 1. **XSS Vulnerability in innerHTML** (CRITICAL)
**Files affected:**
- `src/popup/popup-v2.ts:451-516` (profileList.innerHTML)
- `src/popup/popup-v2.ts:738-763` (debugConsole.innerHTML)
- `src/popup/popup.ts:101-120` (aliasItem.innerHTML)

**Issue:** Using innerHTML with template strings that include user data.

**Current mitigation:** `escapeHtml()` function exists but not used consistently.

**Fix:**
```typescript
// BAD (current)
profileList.innerHTML = profiles.map(p => `
  <div>${p.profileName}</div>
`).join('');

// GOOD (use escapeHtml everywhere)
profileList.innerHTML = profiles.map(p => `
  <div>${escapeHtml(p.profileName)}</div>
`).join('');

// BETTER (use DOM methods)
const div = document.createElement('div');
div.textContent = p.profileName; // Auto-escaped
profileList.appendChild(div);
```

**Action:** Audit all `.innerHTML` usage and ensure escaping.

#### 2. **localStorage Usage Instead of chrome.storage**
**File:** `src/popup/popup-v2.ts:814, 832, 841`

**Issue:** Using `localStorage.setItem('popupMode', ...)` for persistence.

**Problem:**
- localStorage not encrypted
- Not synced with chrome.storage
- Less secure than extension storage API

**Fix:**
```typescript
// Replace localStorage with chrome.storage.local
await chrome.storage.local.set({ popupMode: 'minimal' });
const { popupMode } = await chrome.storage.local.get('popupMode');
```

#### 3. **No Input Sanitization on Profile Names**
**Potential:** User could enter `<script>` tags in profile names.

**Current protection:** `escapeHtml()` exists but not used everywhere.

**Fix:** Ensure all user input is escaped before rendering.

### ✅ Good Security Practices

1. ✅ **AES-256-GCM encryption** for sensitive data (storage.ts:200-250)
2. ✅ **No eval() or Function()** usage
3. ✅ **Content Security Policy** in manifest (needs verification)
4. ✅ **Type safety** with TypeScript
5. ✅ **Local-only storage** (no external servers)

---

## Missing Feature: Alias Variations

### Current Implementation
**File:** `src/lib/aliasEngine.ts:70-71`

```typescript
this.realToAliasMap.set(realValue.toLowerCase(), mapping);
```

**Problem:** Only matches exact strings (case-insensitive).

**Example:**
- Matches: "Greg Barker" → "John Smith" ✅
- Misses: "GregBarker", "gregbarker", "gbarker", "gregb", "G.Barker" ❌

### Proposed Solution: Variation Generator (PRO Feature)

**New file:** `src/lib/aliasVariations.ts`

```typescript
/**
 * Generate common variations of a name for better matching
 */
export class AliasVariationGenerator {
  /**
   * Generate variations of a full name
   * @example "Greg Barker" → ["Greg Barker", "GregBarker", "gregbarker", "gbarker", "G.Barker", "G Barker"]
   */
  static generateNameVariations(fullName: string): string[] {
    const variations: Set<string> = new Set([fullName]);
    const parts = fullName.trim().split(/\s+/);

    if (parts.length === 2) {
      const [first, last] = parts;
      const firstInitial = first[0];
      const lastInitial = last[0];

      // Common variations
      variations.add(`${first}${last}`); // GregBarker
      variations.add(`${first.toLowerCase()}${last.toLowerCase()}`); // gregbarker
      variations.add(`${first}${lastInitial}`); // GregB
      variations.add(`${firstInitial}${last}`); // GBarker
      variations.add(`${firstInitial}.${last}`); // G.Barker
      variations.add(`${firstInitial} ${last}`); // G Barker
      variations.add(`${first[0].toLowerCase()}${last.toLowerCase()}`); // gbarker

      // Email-style variations
      variations.add(`${first.toLowerCase()}.${last.toLowerCase()}`); // greg.barker
      variations.add(`${first.toLowerCase()}${lastInitial.toLowerCase()}`); // gregb
    }

    return Array.from(variations);
  }

  /**
   * Generate variations of an email
   * @example "greg@example.com" → ["greg@example.com", "Greg@example.com", "GREG@EXAMPLE.COM"]
   */
  static generateEmailVariations(email: string): string[] {
    const variations: Set<string> = new Set([email]);
    const [localPart, domain] = email.split('@');

    if (localPart && domain) {
      variations.add(email.toLowerCase());
      variations.add(email.toUpperCase());
      variations.add(`${localPart.toLowerCase()}@${domain.toLowerCase()}`);

      // Common capitalization
      variations.add(`${localPart[0].toUpperCase()}${localPart.slice(1).toLowerCase()}@${domain.toLowerCase()}`);
    }

    return Array.from(variations);
  }

  /**
   * Generate variations of phone number
   * @example "(555) 123-4567" → ["5551234567", "(555) 123-4567", "555-123-4567", "+1-555-123-4567"]
   */
  static generatePhoneVariations(phone: string): string[] {
    const variations: Set<string> = new Set([phone]);

    // Extract digits only
    const digitsOnly = phone.replace(/\D/g, '');
    variations.add(digitsOnly);

    if (digitsOnly.length === 10) {
      const area = digitsOnly.slice(0, 3);
      const prefix = digitsOnly.slice(3, 6);
      const line = digitsOnly.slice(6, 10);

      // Common formats
      variations.add(`(${area}) ${prefix}-${line}`); // (555) 123-4567
      variations.add(`${area}-${prefix}-${line}`); // 555-123-4567
      variations.add(`${area}.${prefix}.${line}`); // 555.123.4567
      variations.add(`+1-${area}-${prefix}-${line}`); // +1-555-123-4567
      variations.add(`+1 (${area}) ${prefix}-${line}`); // +1 (555) 123-4567
    }

    return Array.from(variations);
  }

  /**
   * Generate variations of address (less common)
   */
  static generateAddressVariations(address: string): string[] {
    const variations: Set<string> = new Set([address]);

    // Replace common abbreviations
    variations.add(address.replace(/\bStreet\b/gi, 'St'));
    variations.add(address.replace(/\bSt\.?\b/gi, 'Street'));
    variations.add(address.replace(/\bAve(nue)?\b/gi, 'Ave'));
    variations.add(address.replace(/\bRoad\b/gi, 'Rd'));

    return Array.from(variations);
  }
}
```

**Integration with AliasEngine:**

```typescript
// In buildLookupMaps()
private buildLookupMaps(): void {
  this.realToAliasMap.clear();
  this.aliasToRealMap.clear();

  for (const profile of this.profiles) {
    if (!profile.enabled) continue;

    // Name variations (PRO feature)
    if (profile.real.name && profile.alias.name) {
      const realVariations = AliasVariationGenerator.generateNameVariations(profile.real.name);
      const aliasVariations = AliasVariationGenerator.generateNameVariations(profile.alias.name);

      for (const realVar of realVariations) {
        this.realToAliasMap.set(realVar.toLowerCase(), {...});
      }
      for (const aliasVar of aliasVariations) {
        this.aliasToRealMap.set(aliasVar.toLowerCase(), {...});
      }
    }

    // Email variations
    if (profile.real.email && profile.alias.email) {
      const realEmailVars = AliasVariationGenerator.generateEmailVariations(profile.real.email);
      const aliasEmailVars = AliasVariationGenerator.generateEmailVariations(profile.alias.email);
      // ... same pattern
    }

    // Phone variations
    // ... etc
  }
}
```

**UI Feature:**
- Add "Generate Variations" button in profile editor
- Show preview of variations before saving
- PRO badge on feature (free tier gets 1 variation only)

---

## Branding Change: AI PII Sanitizer → Pseudonize

### Files Requiring Name Change

**Total files affected:** ~30 files

#### 1. Package & Manifest Files (CRITICAL)
- [ ] `package.json:2` → `"name": "pseudonize"`
- [ ] `package.json:4` → Update description
- [ ] `src/manifest.json:3` → `"name": "Pseudonize"`
- [ ] `src/manifest.json:5` → Update description

#### 2. HTML Files
- [ ] `src/popup/popup-v2.html:6` → `<title>Pseudonize</title>`
- [ ] `src/popup/popup-v2.html:33` → `<h1>🛡️ Pseudonize</h1>`
- [ ] `src/popup/popup.html` → Update header
- [ ] `privacy-policy.html:6,18,20` → Update all instances

#### 3. Documentation Files
- [ ] `docs/current/launch_roadmap.md` → Update name references
- [ ] `docs/current/marketing.md` → Update branding
- [ ] `docs/current/technical_architecture.md:1` → Update title
- [ ] `docs/current/building_a_trusted_extension.md` → Update examples
- [ ] `docs/features/*.md` → Update feature specs
- [ ] `docs/testing/*.md` → Update test instructions
- [ ] `PRIVACY_POLICY.md:1` → `# Privacy Policy for Pseudonize`
- [ ] `README.md` (main) → Update throughout

#### 4. Source Code Comments/Logs
- [ ] Search all `.ts` files for "PII Sanitizer" in comments
- [ ] Search all `.js` files for "PII Sanitizer" in console.logs
- [ ] Update all console.log prefixes to use new name

#### 5. Git Commit Footer
- [ ] Update commit template to reference pseudonize.com

**Search Command:**
```bash
# Find all references
grep -r "AI PII Sanitizer\|pii-sanitizer\|pii_sanitizer" \
  --include="*.ts" --include="*.js" --include="*.json" --include="*.html" --include="*.md" \
  --exclude-dir=node_modules --exclude-dir=dist \
  .
```

---

## Icon Injection Points

**New icons will be placed in:** `src/assets/icons/`

**Files to update:**

1. **Manifest** (`src/manifest.json:57-66`)
   ```json
   {
     "action": {
       "default_icon": {
         "16": "icons/icon16.png",
         "48": "icons/icon48.png",
         "128": "icons/icon128.png"
       }
     },
     "icons": {
       "16": "icons/icon16.png",
       "48": "icons/icon48.png",
       "128": "icons/icon128.png"
     }
   }
   ```

2. **Webpack Config** (`webpack.config.js`)
   - Ensure `CopyWebpackPlugin` copies from `src/assets/icons/*.png` to `dist/icons/*.png`

3. **Icon Sizes Needed:**
   - `icon16.png` (16×16) - Toolbar icon
   - `icon48.png` (48×48) - Extension management
   - `icon128.png` (128×128) - Chrome Web Store
   - `icon512.png` (512×512) - Store promotional assets

**Design Guidelines:**
- Theme: Shield + pseudonym/mask motif
- Colors: Match purple gradient (`#667eea` to `#764ba2`)
- Style: Modern, clean, recognizable at 16px
- Format: PNG with transparency

---

## Roadmap Progress Report

### ✅ Phase 1: Profile Editor UI (COMPLETE)
- [x] Modal component
- [x] Form validation
- [x] CRUD operations
- [x] Professional UX

**Status:** Shipped ✅

### ✅ Phase 2A: Privacy Policy (COMPLETE)
- [x] GDPR/CCPA compliant
- [x] Markdown + HTML versions
- [ ] **TODO:** Host on GitHub Pages

**Status:** 95% complete (needs hosting)

### 🚧 Phase 2B: Visual Assets (NOT STARTED)
- [ ] Professional icons (16, 48, 128, 512px)
- [ ] Chrome Web Store screenshots (5 images)
- [ ] Promotional tile (440×280)

**Status:** Blocked - waiting for icons

### 🚧 Phase 3: API Key Vault (25% COMPLETE)
- [x] APIKeyDetector class
- [x] Type definitions
- [ ] ServiceWorker integration
- [ ] Vault UI
- [ ] Stats tracking
- [ ] Warn-first mode

**Status:** Foundation laid, needs integration

### ❌ Phase 4: Service Testing (NOT STARTED)
- [ ] Test ChatGPT (only one tested so far)
- [ ] Test Claude, Gemini, Perplexity, Poe, Copilot, You.com

**Status:** Needs manual testing across 7 services

### ❌ Phase 5: Image Scanning (SKIPPED)
- Deferred until user demand

**Overall Progress:** ~40% complete toward launch

---

## Recommended Refactoring Plan

### Phase 1: Componentize Popup UI (Week 1)

**Goal:** Break `popup-v2.ts` (901 lines) into modular files.

**New Structure:**
```
src/popup/
├── popup-v2.html
├── popup-v2.css
├── popup-v2.ts (main entry point, 100 lines)
├── components/
│   ├── profileModal.ts (250 lines)
│   ├── profileRenderer.ts (120 lines)
│   ├── statsRenderer.ts (100 lines)
│   ├── activityLog.ts (100 lines)
│   ├── minimalMode.ts (80 lines)
│   └── utils.ts (50 lines)
└── styles/
    ├── variables.css (colors, spacing)
    ├── modal.css
    ├── profile-card.css
    ├── stats.css
    └── debug.css
```

**Benefits:**
- Easier to test individual components
- Better code organization
- Faster development (parallel work on components)
- Easier onboarding for contributors

**Implementation:**
```typescript
// popup-v2.ts (main entry point)
import { initProfileModal } from './components/profileModal';
import { initStatsRenderer } from './components/statsRenderer';
import { initActivityLog } from './components/activityLog';

document.addEventListener('DOMContentLoaded', async () => {
  await initUI();
  await loadInitialData();
});

async function initUI() {
  initProfileModal();
  initStatsRenderer();
  initActivityLog();
  // ... etc
}
```

### Phase 2: Implement Alias Variations (Week 2)

**Goal:** Add regex matching for name/email/phone variations.

**New Files:**
- `src/lib/aliasVariations.ts` (variation generator)
- `src/lib/variationMatcher.ts` (regex-based matching)

**Updates:**
- `src/lib/aliasEngine.ts` → Use variation generator
- `src/popup/popup-v2.html` → Add "Generate Variations" button
- `src/lib/types.ts` → Add `variations?: string[]` to IdentityData

**UI Mockup:**
```
Profile Editor:
┌──────────────────────────────┐
│ Real Name: Greg Barker       │
│ Alias Name: John Smith       │
│                              │
│ [Generate Variations] (PRO)  │
│                              │
│ Will also match:             │
│ • GregBarker                 │
│ • gregbarker                 │
│ • gbarker                    │
│ • G.Barker                   │
│ • G Barker                   │
│ (+ 3 more)                   │
└──────────────────────────────┘
```

**PRO Tier Logic:**
```typescript
// Free tier: 1 variation per field (exact match only)
// PRO tier: Unlimited variations
```

### Phase 3: Security Hardening (Week 3)

**Tasks:**
1. Replace all `.innerHTML` with safe DOM methods or `escapeHtml()`
2. Replace `localStorage` with `chrome.storage.local`
3. Add Content-Security-Policy to manifest
4. Audit all user input points
5. Add input length limits (prevent DoS with huge profiles)

**CSP for manifest.json:**
```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

### Phase 4: Rebrand to Pseudonize (Week 4)

**Tasks:**
1. Run global find/replace for "AI PII Sanitizer" → "Pseudonize"
2. Update package.json, manifest.json
3. Update all documentation
4. Create new README.md with branding
5. Update privacy policy URLs
6. Replace icons (when ready)
7. Update commit footer template

**Script for bulk rename:**
```bash
# Create backup first
git branch backup-before-rebrand

# Run replacements
find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.json" -o -name "*.html" -o -name "*.md" \) \
  ! -path "*/node_modules/*" ! -path "*/dist/*" \
  -exec sed -i 's/AI PII Sanitizer/Pseudonize/g' {} +

find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.json" -o -name "*.html" -o -name "*.md" \) \
  ! -path "*/node_modules/*" ! -path "*/dist/*" \
  -exec sed -i 's/pii-sanitizer/pseudonize/g' {} +

find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.json" -o -name "*.html" -o -name "*.md" \) \
  ! -path "*/node_modules/*" ! -path "*/dist/*" \
  -exec sed -i 's/pii_sanitizer/pseudonize/g' {} +
```

---

## Privacy Policy Location

### Current State
- `PRIVACY_POLICY.md` (root)
- `privacy-policy.html` (root)

### Recommendation: **Keep in root**

**Reasons:**
1. ✅ Easier to find (GitHub convention)
2. ✅ Standard location for open source projects
3. ✅ Can link from manifest: `"privacy_policy": "https://pseudonize.com/privacy"`
4. ✅ Separate from code documentation

**Files in root should be:**
- `README.md` (project overview)
- `LICENSE` (legal)
- `PRIVACY_POLICY.md` (privacy)
- `CONTRIBUTING.md` (contributor guide)
- `CHANGELOG.md` (version history)

**Files in docs/ should be:**
- Technical architecture
- Feature specs
- Development guides
- Roadmap

**Action:** Keep PRIVACY_POLICY.md in root ✅

---

## License Recommendation

### Current: MIT License

**Problem with MIT:**
- ❌ No attribution requirement (can fork without credit)
- ❌ No patent protection
- ❌ Less "enterprise-friendly" for large acquisitions

### Recommended: Apache License 2.0

**Why Apache 2.0:**
1. ✅ **Requires attribution** - Must give credit to original authors
2. ✅ **Patent protection** - Contributors grant patent rights
3. ✅ **Enterprise-friendly** - Used by Google, Facebook, Apache Foundation
4. ✅ **Acquisition-ready** - Clear IP provenance for M&A
5. ✅ **Compatible** - Works with most other open source licenses
6. ✅ **Contributor License Agreement** - Clear contribution terms

**Used by:**
- Android (Google)
- Kubernetes (Google/CNCF)
- Apache projects (Kafka, Spark, Hadoop)
- Swift (Apple)

**Key Differences from MIT:**

| Feature | MIT | Apache 2.0 |
|---------|-----|------------|
| Attribution required | ❌ Optional | ✅ Required |
| Patent grant | ❌ No | ✅ Yes |
| Trademark protection | ❌ No | ✅ Yes |
| Explicit contributor agreement | ❌ No | ✅ Yes |
| Enterprise M&A friendly | ⚠️ Okay | ✅ Excellent |

**Alternative: Dual License (for PRO features)**

If you want to charge for PRO features:
```
- Free tier: Apache 2.0 (open source)
- PRO tier: Commercial license (closed source add-ons)
```

**Example:**
- Core substitution: Open source (Apache 2.0)
- API Key Vault: Commercial license for enterprises
- Image scanning: Commercial license

This is the "Open Core" model used by:
- GitLab
- MongoDB
- Elastic

### Recommended Action

**Step 1:** Replace MIT with Apache 2.0
```bash
# Download Apache 2.0 license
curl https://www.apache.org/licenses/LICENSE-2.0.txt > LICENSE

# Add NOTICE file (required by Apache 2.0)
cat > NOTICE << 'EOF'
Pseudonize
Copyright 2025 [Your Name/Company]

This product includes software developed by [Your Name/Company].
EOF
```

**Step 2:** Add header to all source files
```typescript
/**
 * Copyright 2025 [Your Name/Company]
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
```

**Step 3:** Update package.json
```json
{
  "license": "Apache-2.0",
  "author": "Your Name <email@example.com>",
  "contributors": []
}
```

**Step 4:** Add CONTRIBUTING.md with CLA
```markdown
# Contributing to Pseudonize

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.

You represent that you are legally entitled to grant the above license.
```

---

## Design Issues & Anti-Patterns

### 1. **Tight Coupling** (Medium Priority)

**Issue:** `popup-v2.ts` directly calls `useAppStore.getState()` everywhere.

**Problem:** Hard to test, hard to swap implementations.

**Fix:** Dependency injection
```typescript
// BAD (current)
async function saveProfile() {
  const store = useAppStore.getState();
  await store.addProfile(data);
}

// GOOD (testable)
export class ProfileManager {
  constructor(private store: AppStore) {}

  async saveProfile(data: ProfileData) {
    await this.store.addProfile(data);
  }
}

// In tests
const mockStore = { addProfile: jest.fn() };
const manager = new ProfileManager(mockStore);
```

### 2. **Magic Strings** (Low Priority)

**Issue:** Tab names, storage keys as raw strings.

**Example:** `document.getElementById('aliases-tab')`

**Fix:** Constants file
```typescript
// src/popup/constants.ts
export const TAB_IDS = {
  ALIASES: 'aliases-tab',
  STATS: 'stats-tab',
  SETTINGS: 'settings-tab',
  DEBUG: 'debug-tab',
} as const;

export const STORAGE_KEYS = {
  POPUP_MODE: 'popupMode',
  CONFIG: 'user_config',
  PROFILES: 'profiles',
} as const;
```

### 3. **No Error Boundaries** (Medium Priority)

**Issue:** Errors in one tab can crash entire popup.

**Fix:** Try-catch around tab rendering
```typescript
function renderTab(tabName: string) {
  try {
    switch(tabName) {
      case 'aliases':
        renderProfiles();
        break;
      // ...
    }
  } catch (error) {
    console.error(`Error rendering ${tabName}:`, error);
    showErrorState(tabName, error);
  }
}
```

### 4. **Inconsistent Null Checks** (Low Priority)

**Issue:** Some places use optional chaining, others don't.

**Example:**
```typescript
// Inconsistent
const btn = document.getElementById('addBtn');
btn?.addEventListener('click', handler); // Optional chaining

const list = document.getElementById('profileList');
list.innerHTML = ''; // No check!
```

**Fix:** Be consistent - either check everywhere or assume elements exist.

---

## Performance Issues

### 1. **Re-rendering Entire Lists** (Low Impact)

**Issue:** `renderProfiles()` rebuilds entire HTML string and replaces innerHTML.

**Current:**
```typescript
profileList.innerHTML = profiles.map(p => `<div>...</div>`).join('');
```

**Problem:** Loses scroll position, re-renders all items even if only 1 changed.

**Fix:** Virtual DOM or incremental updates (overkill for now, but note for future).

### 2. **No Debouncing on Form Inputs** (Low Impact)

**Issue:** Email validation runs on every blur event.

**Fix:** Debounce validation
```typescript
const debouncedValidate = debounce((input) => validateEmailField(input), 300);
emailInput.addEventListener('input', () => debouncedValidate(emailInput));
```

---

## Testing Gaps

**Current Test Coverage:**
- ✅ `tests/aliasEngine.test.ts` (127 lines)
- ❌ No popup UI tests
- ❌ No integration tests
- ❌ No e2e tests

**Recommended:**
1. Add unit tests for `profileModal.ts` (after refactor)
2. Add integration tests for storage encryption
3. Add e2e tests with Playwright (simulate ChatGPT interaction)

---

## Deployment Checklist

Before submitting to Chrome Web Store:

### Code Quality
- [ ] Remove all `console.log` (or make conditional on debugMode)
- [ ] Replace all `alert()` (done ✅)
- [ ] Fix XSS vulnerabilities (innerHTML escaping)
- [ ] Replace localStorage with chrome.storage
- [ ] Add error boundaries to UI
- [ ] Test on slow connections (loading states)

### Assets
- [ ] Add professional icons (16, 48, 128, 512px)
- [ ] Take 5 screenshots for store
- [ ] Create promotional tile (440×280)
- [ ] Record demo video (2-3 minutes)

### Legal
- [ ] Host privacy policy (GitHub Pages)
- [ ] Add privacy policy URL to manifest
- [ ] Add license header to all source files
- [ ] Update README with usage instructions

### Testing
- [ ] Test all 7 AI services (ChatGPT, Claude, Gemini, etc.)
- [ ] Test on Windows, Mac, Linux
- [ ] Test with different Chrome versions
- [ ] Test with other extensions installed (conflicts?)
- [ ] Test with slow network (timeout handling)
- [ ] Test with storage quota exceeded

### Security
- [ ] Run security audit (npm audit)
- [ ] Review all permissions in manifest
- [ ] Test CSP (no inline scripts)
- [ ] Test on malicious input (script tags in profile names)

### Branding
- [ ] Replace all "AI PII Sanitizer" → "Pseudonize"
- [ ] Update package.json name
- [ ] Update manifest name
- [ ] Update documentation
- [ ] Update commit footer template

---

## Priority Matrix

| Task | Impact | Effort | Priority | Timeline |
|------|--------|--------|----------|----------|
| **Refactor popup-v2.ts** | High | High | **P0** | Week 1 |
| **Fix XSS vulnerabilities** | High | Low | **P0** | 1-2 days |
| **Implement alias variations** | High | Medium | **P1** | Week 2 |
| **Rebrand to Pseudonize** | Medium | Low | **P1** | 1 day |
| **Change to Apache 2.0 license** | Medium | Low | **P1** | 1 hour |
| **Create icons** | High | Medium | **P0** | External (design) |
| **Host privacy policy** | High | Low | **P0** | 1 hour |
| **Test 7 AI services** | High | High | **P1** | Week 3 |
| **Replace localStorage** | Medium | Low | **P2** | 1 day |
| **Modularize CSS** | Low | Medium | **P3** | Week 4 |

**Legend:**
- **P0:** Blocker for launch (must have)
- **P1:** Important for quality (should have)
- **P2:** Nice to have (could have)
- **P3:** Future improvement (won't have now)

---

## Conclusion

**Ready to Launch?** Not yet. Need:
1. Icons (blocking)
2. XSS fixes (blocking)
3. Alias variations (high value)
4. Service testing (quality)

**Estimated Time to Launch:** 3-4 weeks

**Recommended Order:**
1. Week 1: Fix XSS + Refactor popup
2. Week 2: Alias variations + Rebrand
3. Week 3: Service testing + Privacy policy hosting
4. Week 4: Polish + Submit to store

**Next Steps:**
1. Create icons (design task)
2. Start refactoring popup-v2.ts
3. Implement alias variations
4. Change license to Apache 2.0

---

**Document Version:** 1.0
**Last Updated:** January 2025
**Next Review:** After Phase 1 refactor complete
