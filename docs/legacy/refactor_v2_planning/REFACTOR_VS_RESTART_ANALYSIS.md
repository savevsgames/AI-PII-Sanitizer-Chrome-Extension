# Refactor vs Restart: Comprehensive Analysis
## AI PII Sanitizer Browser Extension

**Analysis Date:** October 23, 2025
**Extension:** PromptBlocker.com (AI PII Sanitizer)
**Current Status:** Proof-of-concept transitioning to production

---

## Executive Summary

**RECOMMENDATION: REFACTOR INCREMENTALLY** ✅

Your extension has a **well-architected foundation** with production-ready core logic (70% salvageable), but presentation-layer issues that need modernization. Starting over would waste 3-4 weeks of solid engineering work already in place.

### Key Findings:
- ✅ **Core library is excellent** - Type-safe, well-tested, modular
- ✅ **Architecture patterns are sound** - Clean separation of concerns
- ⚠️ **UI layer needs modernization** - String templates should become components
- ⚠️ **Monetization infrastructure is incomplete** - Client-side only, no server validation
- 🎨 **Glassmorphism UI upgrade: EASY** - 2-3 hours of CSS work

---

## 1. Codebase Metrics

### Size & Organization
```
Total Source Code:     5,191 lines
├─ Core Business Logic:  536 lines  (aliasEngine, apiKeyDetector)
├─ Storage & Types:    1,460 lines  (storage.ts, types.ts)
├─ Infrastructure:     1,147 lines  (serviceWorker, content scripts)
└─ UI Components:      2,048 lines  (popup-v2, modals, tabs)

CSS Styling:           2,063 lines  (9 modular files)
Tests:                 1,118 lines  (unit + E2E)
Configuration:           324 lines  (webpack, tsconfig, manifest)
```

### Tech Stack
- **Language:** TypeScript 5.4 (strict mode)
- **State Management:** Zustand (vanilla, no React)
- **Build System:** Webpack 5
- **Testing:** Jest + Playwright
- **Styling:** Vanilla CSS with design tokens
- **Dependencies:** 1 production (zustand), 12 dev dependencies

### Code Quality Score: **7.5/10**
- Type Safety: 9/10 (excellent interfaces, strict mode)
- Architecture: 8/10 (clean separation, minor monolith issue)
- UI Code: 5/10 (string templates, manual DOM management)
- Security: 6/10 (encryption exists but needs hardening)
- Test Coverage: 6/10 (~20% coverage, good foundation)

---

## 2. Architecture Assessment

### ✅ What's Working Well

#### A. Excellent Core Library (`src/lib/`)
```
lib/
├── aliasEngine.ts     (366 lines) - PRODUCTION-READY
├── storage.ts         (792 lines) - PRODUCTION-READY
├── apiKeyDetector.ts  (170 lines) - PRODUCTION-READY
├── types.ts           (193 lines) - EXCELLENT
└── store.ts           (61 lines)  - GOOD
```

**Strengths:**
- Clean substitution logic with case preservation (JOE → JOHN, Joe → John)
- Possessive handling (Joe's → John's)
- AES-GCM encryption with PBKDF2 key derivation
- 8 supported AI services (ChatGPT, Claude, Gemini, etc.)
- Pattern matching for 7+ API key formats
- Discriminated unions for type safety

**Evidence of Quality:**
```typescript
// aliasEngine.ts - Clean, testable logic
export function substituteText(
  text: string,
  aliases: Alias[],
  direction: 'encode' | 'decode'
): string {
  // Case-preserving regex substitution
  // Handles possessives correctly
  // 100% unit tested
}
```

#### B. Solid Architecture Pattern
```
User Input → Popup UI (Zustand state)
     ↓
Background Service Worker (message routing)
     ↓
Content Script (relay layer)
     ↓
Injected Script (fetch interception)
     ↓
Response Processing → Background → Popup Update
```

This MV3-compliant architecture is **correctly structured** for a Chrome extension.

#### C. Excellent CSS Organization
```css
/* variables.css - Design tokens system */
:root {
  --color-primary: #667eea;
  --color-success: #48bb78;
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --z-modal: 1000;
  --z-tooltip: 1200;
}
```

9 modular CSS files, semantic naming, no monoliths. **Perfect for glassmorphism upgrade.**

---

### ⚠️ What Needs Improvement

#### A. CRITICAL: String-Based HTML Rendering

**Problem:** All popup components use `innerHTML` with string concatenation.

**Example (profileRenderer.ts:27-101):**
```typescript
function renderProfiles(profiles: Profile[]): string {
  return profiles.map(profile => `
    <div class="profile-card" data-profile-id="${profile.id}">
      <div class="profile-header">
        <h3>${profile.name}</h3>
        <button onclick="handleEdit('${profile.id}')">Edit</button>
      </div>
      <!-- 70+ more lines of string templates -->
    </div>
  `).join('');
}

// Later in code:
document.getElementById('profiles').innerHTML = renderProfiles(profiles);
```

**Issues:**
- **XSS Risk:** Missing escaping on user input (low risk since only owner edits profiles)
- **Brittle Selectors:** `document.getElementById()` everywhere, breaks on refactors
- **No Component Reusability:** Copy-pasted modal code in 4 places
- **Hard to Test:** Can't unit test DOM generation logic

**Impact:** 16+ files affected, ~2,000 lines of UI code

**Solution:** Migrate to Lit-HTML (lightweight, no JSX) or similar component framework

---

#### B. MAJOR: Monolithic Service Worker

**File:** `src/background/serviceWorker.ts` (772 lines)

**Problem:** `handleSubstituteRequest()` function is 200+ lines with nested logic.

```typescript
// serviceWorker.ts:129-329
async function handleSubstituteRequest(message: SubstituteRequestMessage) {
  // 200+ lines of:
  // - Text extraction (repeated 3 times for different scenarios)
  // - Profile loading
  // - Alias application
  // - Response reconstruction
  // - Error handling
  // - Logging
}
```

**Issues:**
- Duplicated `extractAllText()` logic (3 copies)
- Hard to unit test (needs full Chrome API mocking)
- Difficult to extend (adding new substitution modes requires editing monolith)

**Solution:** Extract into separate modules:
```
lib/textProcessor.ts   - extractText, replaceText logic
lib/responseHandler.ts - HTTP response reconstruction
background/handlers/   - Message handler routing
```

---

#### C. MEDIUM: Memory Leaks

**popup-v2.ts:104-106:**
```typescript
setInterval(() => {
  // Poll for state updates every 100ms
  updateUI();
}, 100);

// ❌ Interval never cleared, runs forever
// ❌ Memory leak if popup reopened multiple times
```

**Solution:** Use `chrome.storage.onChanged` listener instead of polling.

---

#### D. MEDIUM: Client-Side Only Monetization

**Current Implementation:**
```typescript
// storage.ts:343-355
export async function addApiKey(key: ApiKey): Promise<void> {
  const config = await getUserConfig();

  // ❌ No server validation
  if (config.account.tier === 'free' && keys.length >= 10) {
    throw new Error('FREE tier limited to 10 keys');
  }

  // User could manually change tier in Chrome storage
  // User could patch this validation in DevTools
}
```

**What Exists:**
- ✅ Tier field (`free` | `pro`)
- ✅ License key field (stored but never validated)
- ✅ Feature gating logic (10-key limit, OpenAI-only detection)

**What's Missing:**
- ❌ Server-side license validation
- ❌ Authentication system
- ❌ Rate limiting enforcement
- ❌ Usage metering for billing
- ❌ Upgrade flow / payment integration

**Security Grade: D** (suitable for casual users only)

---

#### E. LOW: Dead Code

**Files to Delete (225 lines):**
```
src/popup/popup.ts         (unused, v2 exists)
src/popup/popup.html       (unused, v2 exists)
src/popup/popup.css        (unused, v2 exists)
src/popup/popup.ts.backup  (incomplete refactor)
src/popup/apiKeyModal.ts.backup
src/content/content_plain.js  (92 lines, unused)
```

**Time to Delete:** 30 minutes

---

## 3. Feature Completeness Analysis

### Production-Ready Features (80%)
- ✅ Profile-based PII substitution
- ✅ Bidirectional aliasing (encode/decode)
- ✅ 8 AI services supported
- ✅ Case-preserving substitution
- ✅ Possessive handling
- ✅ Storage encryption
- ✅ v1→v2 data migration
- ✅ Profile usage statistics

### Beta/POC Features (15%)
- 🟡 **API Key Vault** - UI complete, encryption functional, validation incomplete
- 🟡 **Custom Redaction Rules** - UI skeleton only (featuresTab.ts:87-115)
- 🟡 **Prompt Templates** - UI skeleton only (featuresTab.ts:117-145)

### Incomplete/TODO (5%)
```typescript
// serviceWorker.ts:292 - Warn-first dialog not implemented
// featuresTab.ts:147 - Upgrade modal not implemented
// settingsHandlers.ts:94 - Mailchimp newsletter signup not done
```

---

## 4. Refactor vs Restart Comparison

| Aspect | Refactor | Restart | Winner |
|--------|----------|---------|--------|
| **Time Investment** | 130-180h (4-5 weeks) | 200-250h (6-7 weeks) | Refactor (-30%) |
| **Risk Level** | LOW (incremental) | HIGH (all-or-nothing) | Refactor |
| **Core Library Reuse** | 100% (1,460 lines) | 70% (copy-paste) | Refactor |
| **CSS Reuse** | 100% (2,063 lines) | 90% (minor changes) | Refactor |
| **UI Code Reuse** | 20% (needs rewrite) | 0% (start fresh) | Restart |
| **Test Coverage** | Keep 1,118 lines | Rebuild from 0 | Refactor |
| **Learning Curve** | Minimal (same codebase) | HIGH (new patterns) | Refactor |
| **Architecture Quality** | Keep solid foundation | Risk of new mistakes | Refactor |

### Time Breakdown

#### Refactor Path (130-180h)
```
Phase 1: Foundation (30-40h)
  - Extract text processing from serviceWorker
  - Create centralized Chrome API client
  - Fix memory leaks
  - Delete dead code

Phase 2: Security (20-30h)
  - Improve encryption key derivation
  - Add server validation stub
  - Document security assumptions

Phase 3: UI Modernization (60-80h)
  - Migrate to Lit-HTML components
  - Convert popup to reusable modules
  - Update modals with lifecycle management
  - Apply glassmorphism styling

Phase 4: Testing & Polish (20-30h)
  - Unit tests for new API layer
  - UI component tests
  - Full E2E testing
```

#### Restart Path (200-250h)
```
Phase 1: Setup & Copy Core (40-50h)
  - New repo setup
  - Copy lib/ files (with improvements)
  - Rewrite Chrome API client
  - New build configuration

Phase 2: Rebuild Background (50-60h)
  - Rewrite message routing
  - Recreate substitution handlers
  - New content script injection
  - Storage migration logic

Phase 3: Build New UI (80-100h)
  - Choose UI framework
  - Build component library
  - Recreate all popup screens
  - Implement glassmorphism from scratch
  - Rebuild modals and forms

Phase 4: Testing (30-40h)
  - Write all tests from scratch
  - E2E coverage
  - Bug fixing
```

**Verdict:** Refactor saves 70-100 hours and reduces risk.

---

## 5. Glassmorphism UI Upgrade Feasibility

### Current Styling Architecture
Your CSS is **perfectly positioned** for glassmorphism:

```css
/* variables.css - Already has modular tokens */
:root {
  --color-bg-primary: #ffffff;
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
```

### Glassmorphism Implementation (2-3 hours)

**Step 1: Add New CSS Variables**
```css
/* variables.css - Add frosted glass tokens */
:root {
  /* Glass backgrounds */
  --glass-bg-light: rgba(255, 255, 255, 0.1);
  --glass-bg-medium: rgba(255, 255, 255, 0.2);
  --glass-bg-heavy: rgba(255, 255, 255, 0.3);

  /* Blur levels */
  --blur-light: blur(10px);
  --blur-medium: blur(20px);
  --blur-heavy: blur(40px);

  /* Border styles */
  --glass-border: 1px solid rgba(255, 255, 255, 0.2);

  /* Shadows for depth */
  --glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
}
```

**Step 2: Update 2-3 Component Styles**
```css
/* popup.css - Apply to cards */
.profile-card {
  background: var(--glass-bg-medium);
  backdrop-filter: var(--blur-medium);
  -webkit-backdrop-filter: var(--blur-medium);
  border: var(--glass-border);
  box-shadow: var(--glass-shadow);
  border-radius: 12px;
}

/* Modal backgrounds */
.modal-overlay {
  background: var(--glass-bg-light);
  backdrop-filter: var(--blur-heavy);
}
```

**Step 3: Add Gradient Background**
```css
body {
  background: linear-gradient(135deg,
    rgba(102, 126, 234, 0.8) 0%,
    rgba(118, 75, 162, 0.8) 100%
  );
}
```

**Browser Support:** 95% (all modern browsers support `backdrop-filter`)

**Difficulty:** ⭐ EASY - Just CSS changes, no JavaScript refactoring needed

---

## 6. Monetization Readiness Assessment

### Current State: Grade D

**What You Have:**
```typescript
// types.ts
interface UserAccount {
  tier: 'free' | 'pro';  // ✅ Tier system exists
  licenseKey?: string;   // ✅ Field exists (not validated)
}

// storage.ts - Feature gating
if (config.account.tier === 'free' && keys.length >= 10) {
  throw new Error('FREE tier limited to 10 keys');
}
```

**Vulnerabilities:**
1. **Client-Side Only** - User can edit `chrome.storage.local`:
   ```javascript
   // User opens DevTools console:
   chrome.storage.local.get('userConfig', (data) => {
     data.userConfig.account.tier = 'pro';
     chrome.storage.local.set(data);
   });
   // Now has PRO features for free
   ```

2. **No Server Validation** - License key is stored but never checked against a server

3. **No Rate Limiting** - Unlimited substitution requests (could DOS your service if you add backend)

4. **No Usage Metering** - Stats collected but never sent for billing

### What Production SaaS Needs

**Minimum Viable Monetization (40-60h):**
```
1. Backend API (20-30h)
   - License key validation endpoint
   - User authentication (OAuth or JWT)
   - Rate limiting per tier (10 req/min free, 100 req/min pro)

2. Extension Changes (15-20h)
   - Add API client to validate license on startup
   - Implement token refresh logic
   - Add upgrade flow UI (payment link)
   - Usage tracking beacon (send stats to server)

3. Security Hardening (5-10h)
   - Code obfuscation (webpack-obfuscator)
   - License key encryption in storage
   - Tamper detection (checksum validation)
```

**Realistic Protection Level:**
- Casual users: 95% protected
- Determined hackers: 20% protected (client-side is inherently bypassable)

**Recommendation:** Implement basic server validation before charging. Accept that 5-10% of users may bypass payment (industry standard for browser extensions).

---

## 7. Refactoring Roadmap (Recommended)

### Phase 1: Foundation (Week 1, 30-40h)

**Goals:** Eliminate technical debt, improve maintainability

**Tasks:**
1. **Delete Dead Code (2h)**
   - Remove popup.ts, popup.html, popup.css (v1)
   - Delete *.backup files
   - Remove content_plain.js

2. **Extract Text Processing (12h)**
   ```
   Create lib/textProcessor.ts:
   - extractAllText(data: any): string
   - replaceAllText(data: any, replacements: Map): any
   - Move duplicated logic from serviceWorker.ts
   ```

3. **Create Chrome API Client (16h)**
   ```
   Create popup/api.ts:
   - sendMessage<T>(type: string, payload: any): Promise<T>
   - subscribeToStorage(callback: Function): void
   - Centralize all chrome.runtime.sendMessage() calls
   ```

4. **Fix Memory Leaks (4h)**
   - Replace polling with `chrome.storage.onChanged` listener
   - Add cleanup in modal close handlers
   - Use AbortController for fetch listeners

**Deliverable:** Clean, maintainable codebase ready for UI modernization

---

### Phase 2: Security (Week 2, 20-30h)

**Goals:** Prepare for production monetization

**Tasks:**
1. **Improve Encryption (10h)**
   ```typescript
   // storage.ts - Add user-based key material
   async function deriveEncryptionKey(userId: string): Promise<CryptoKey> {
     // Use userId + extension ID (not just extension ID)
     const keyMaterial = await crypto.subtle.importKey(
       'raw',
       new TextEncoder().encode(userId + chrome.runtime.id),
       'PBKDF2',
       false,
       ['deriveKey']
     );

     return crypto.subtle.deriveKey(
       {
         name: 'PBKDF2',
         salt: new TextEncoder().encode('ai-pii-sanitizer'),
         iterations: 310000, // Updated to 2024 OWASP recommendation
         hash: 'SHA-256'
       },
       keyMaterial,
       { name: 'AES-GCM', length: 256 },
       false,
       ['encrypt', 'decrypt']
     );
   }
   ```

2. **Add Server Validation Stub (8h)**
   ```typescript
   // lib/licensing.ts
   export async function validateLicense(key: string): Promise<boolean> {
     try {
       const response = await fetch('https://api.promptblocker.com/validate', {
         method: 'POST',
         body: JSON.stringify({ licenseKey: key }),
         headers: { 'Content-Type': 'application/json' }
       });
       return response.ok;
     } catch {
       return false; // Fail closed
     }
   }
   ```

3. **Document Security Assumptions (2h)**
   - Create SECURITY.md
   - Document threat model
   - List known limitations

**Deliverable:** Extension ready for paid tier launch

---

### Phase 3: UI Modernization (Weeks 3-4, 60-80h)

**Goals:** Replace string templates with components, apply glassmorphism

**Tasks:**
1. **Choose & Setup Lit-HTML (8h)**
   ```bash
   npm install lit-html
   ```

   Why Lit-HTML?
   - Tiny (5kb gzipped)
   - No build step changes needed
   - Uses native template literals
   - Works with existing Zustand state

2. **Convert Popup Components (30-40h)**
   ```
   Migrate these files to Lit-HTML:
   - popup/profileRenderer.ts     (15h)
   - popup/apiKeyVault.ts         (12h)
   - popup/featuresTab.ts         (8h)
   - popup/settingsTab.ts         (5h)
   ```

   **Before (String Templates):**
   ```typescript
   function renderProfile(profile: Profile): string {
     return `<div class="profile">${profile.name}</div>`;
   }
   element.innerHTML = renderProfile(profile);
   ```

   **After (Lit-HTML):**
   ```typescript
   import { html, render } from 'lit-html';

   function renderProfile(profile: Profile) {
     return html`<div class="profile">${profile.name}</div>`;
   }
   render(renderProfile(profile), element);
   ```

3. **Rebuild Modals (15-20h)**
   ```
   Create reusable modal components:
   - components/Modal.ts (base class)
   - components/ConfirmDialog.ts (extends Modal)
   - components/FormModal.ts (extends Modal)

   Replace 4 duplicate modal implementations
   ```

4. **Apply Glassmorphism (3-5h)**
   - Add CSS variables from Section 5
   - Update popup.css, modal.css, profile.css
   - Add gradient background
   - Test on different backgrounds

**Deliverable:** Modern, maintainable UI with Apple-inspired aesthetics

---

### Phase 4: Testing & Polish (Week 5, 20-30h)

**Goals:** Production-ready quality assurance

**Tasks:**
1. **Unit Tests for New Code (12h)**
   ```
   - textProcessor.test.ts (5h)
   - api.test.ts (4h)
   - licensing.test.ts (3h)
   ```

2. **UI Component Tests (8h)**
   ```
   - Profile component render tests
   - Modal lifecycle tests
   - Form validation tests
   ```

3. **E2E Testing (8h)**
   ```
   - Full substitution flow (ChatGPT, Claude)
   - Profile CRUD operations
   - API Key Vault operations
   - Tier limit enforcement
   ```

4. **Performance Audit (2h)**
   - Lighthouse audit (target: 95+ performance score)
   - Bundle size check (target: <500kb)
   - Memory leak detection

**Deliverable:** Fully tested, production-ready extension

---

## 8. Starting Over: When It Makes Sense

You should **only** start over if:

1. ❌ **You want to switch to a different architecture**
   - Example: Moving from Chrome extension to Electron app
   - Example: Switching from MV3 to a different platform

2. ❌ **You're pivoting the core product**
   - Example: Changing from PII sanitizer to a different use case
   - Example: Switching from browser extension to desktop app

3. ❌ **The codebase is truly unsalvageable**
   - Your codebase is NOT in this category
   - Core library is production-quality
   - Only UI layer has issues

4. ❌ **You need a different tech stack**
   - Example: Must use React for team familiarity
   - Example: Need server-side rendering

**None of these apply to your situation.** Your core logic is solid.

---

## 9. Final Recommendation: The Hybrid Approach

### Option 1: Pure Refactor (Recommended)
Follow the 5-week roadmap above. Keep all code, modernize incrementally.

**Pros:**
- Lowest risk
- Fastest to market (4-5 weeks)
- Maintains test coverage
- Incremental improvements

**Cons:**
- Some legacy patterns remain
- UI refactor is tedious

### Option 2: Hybrid Approach (Alternative)
1. Create new `src-v3/` folder
2. Copy core library as-is (`lib/` → `src-v3/lib/`)
3. Rebuild UI from scratch with Lit-HTML in `src-v3/popup/`
4. Keep old code running during transition
5. Switch when ready

**Pros:**
- Clean slate for UI
- Core logic preserved
- Can compare old vs new

**Cons:**
- Longer timeline (6-7 weeks)
- Maintain two codebases temporarily
- More complex

### My Recommendation: **Pure Refactor**
- Your UI code isn't broken, just outdated
- Incremental migration is less risky
- 5 weeks is reasonable for a quality product
- Glassmorphism is easy with your current CSS

---

## 10. Action Plan: Next 7 Days

### Day 1: Quick Wins
```bash
# 1. Delete dead code (30min)
rm src/popup/popup.ts src/popup/popup.html src/popup/popup.css
rm src/popup/*.backup
rm src/content/content_plain.js

# 2. Fix memory leak (1h)
# Edit popup-v2.ts:104-106 to use chrome.storage.onChanged

# 3. Install Lit-HTML (5min)
npm install lit-html
```

### Days 2-3: Extract Text Processing (12h)
Create `lib/textProcessor.ts` and move logic from serviceWorker.

### Days 4-5: Chrome API Client (16h)
Create `popup/api.ts` centralized message sender.

### Days 6-7: First Component Migration (8h)
Convert one small component (settingsTab.ts) to Lit-HTML as proof-of-concept.

**End of Week 1:** You'll have:
- Clean codebase (no dead code)
- Better architecture (extracted modules)
- Proof that Lit-HTML migration works
- Foundation for Weeks 2-5

---

## 11. Conclusion

Your extension is at the **"messy teenager"** stage - solid foundation, awkward presentation. It doesn't need a complete rebuild; it needs targeted improvements.

**The Math:**
- Refactor: 130-180h (4-5 weeks) → Production-ready
- Restart: 200-250h (6-7 weeks) → Same result
- Savings: 70-100 hours (1.5-2 weeks)

**The Quality:**
- Core library: **KEEP** (excellent)
- Architecture: **KEEP** (sound)
- CSS system: **KEEP** (perfect for glassmorphism)
- UI components: **MODERNIZE** (not rebuild)
- Monetization: **ADD** (doesn't exist yet)

**The Risk:**
- Refactor: LOW (incremental, reversible)
- Restart: HIGH (all-or-nothing, might miss edge cases)

**Recommendation:** Start with Phase 1 (Foundation) this week. If after Week 1 you hate the refactor approach, you can still pivot to restart with only 30-40h invested.

---

## Appendix: File-by-File Salvageability

| File | Lines | Quality | Salvageable | Action |
|------|-------|---------|-------------|--------|
| `lib/aliasEngine.ts` | 366 | 9/10 | 100% | KEEP |
| `lib/storage.ts` | 792 | 8/10 | 95% | Minor encryption improvements |
| `lib/types.ts` | 193 | 10/10 | 100% | KEEP |
| `lib/apiKeyDetector.ts` | 170 | 9/10 | 100% | KEEP |
| `lib/store.ts` | 61 | 8/10 | 100% | KEEP |
| `background/serviceWorker.ts` | 772 | 5/10 | 60% | Extract text processing logic |
| `content/content.ts` | 154 | 7/10 | 90% | Minor cleanup |
| `popup/popup-v2.ts` | 370 | 6/10 | 40% | Migrate to Lit-HTML |
| `popup/profileRenderer.ts` | 101 | 4/10 | 20% | Rewrite as component |
| `popup/apiKeyVault.ts` | 450 | 5/10 | 30% | Rewrite as component |
| `popup/featuresTab.ts` | 147 | 5/10 | 30% | Rewrite as component |
| `popup/settingsTab.ts` | 89 | 5/10 | 30% | Rewrite as component |
| All CSS files | 2,063 | 9/10 | 100% | Add glassmorphism variables |
| Test files | 1,118 | 7/10 | 90% | Update for new components |

**Total Salvageable:** ~70% of codebase by line count, **80% by effort**

---

**Bottom Line:** Refactor incrementally. Your core is too good to throw away.