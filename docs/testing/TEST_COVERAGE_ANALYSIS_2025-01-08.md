# Test Coverage Analysis - January 8, 2025

**Date:** 2025-01-08
**Purpose:** Identify all missing tests for features added since last test update
**Current Test Status:** 387/431 passing (90%), but ~50% of codebase has NO tests

---

## Executive Summary

**Problem:** Approximately half the application code written in the last 2 months has NO test coverage.

**Impact:**
- 🔴 **CRITICAL:** Major features (auth, payments, tier system, multi-doc queue) are untested
- 🔴 **CRITICAL:** 34KB document analysis component - 0 tests
- 🔴 **CRITICAL:** 72KB storage manager - only partial coverage
- 🟡 **HIGH:** 19 popup components (350KB total) - 0 tests

**Scope:** Need to write ~30-40 new test files covering recently added features

---

## Current Test Suite (15 files)

### ✅ Existing Tests:

1. **tests/aliasEngine.test.ts** - Alias substitution engine
2. **tests/aliasGenerator.test.ts** - Quick alias generator
3. **tests/apiKeyDetector.test.ts** - API key detection
4. **tests/e2e/chatgpt.test.ts** - End-to-end ChatGPT (FAILING)
5. **tests/firebase.test.ts** - Firebase auth (FAILING)
6. **tests/redactionEngine.test.ts** - Custom redaction rules
7. **tests/serviceWorker.test.ts** - Background service worker
8. **tests/storage.test.ts** - Storage manager (FAILING - partial coverage)
9. **tests/stripe.test.ts** - Stripe integration (FAILING)
10. **tests/templateEngine.test.ts** - Prompt template variables
11. **tests/textProcessor.test.ts** - Text processing utilities
12. **tests/tierSystem.test.ts** - FREE/PRO tier system (FAILING)
13. **tests/utils.test.ts** - Utility functions
14. **tests/validation.test.ts** - Form validation
15. **tests/xss-prevention.test.ts** - XSS security

**Total:** 15 test files, 431 tests (387 passing, 44 failing)

---

## Missing Tests - By Priority

## 🔴 CRITICAL PRIORITY (Launch Blockers)

### 1. Authentication System (NO TESTS)

**Files:**
- `src/auth/auth.ts` (1.8KB) - Google Sign-In redirect flow
- `src/popup/components/authModal.ts` (18KB) - Auth UI modal
- `src/popup/components/userProfile.ts` (23KB) - User profile display

**Missing Coverage:**
- [ ] Google Sign-In redirect flow
- [ ] Email/Password authentication
- [ ] Password reset flow
- [ ] Auth state management (`onAuthStateChanged`)
- [ ] Sign-out functionality
- [ ] User profile sync with Firestore
- [ ] User dropdown menu interactions
- [ ] Account settings modal

**Estimated Tests:** 40-50 tests
**Estimated Time:** 2-3 days

**Why Critical:** Authentication is the foundation of tier system and payments. Cannot verify tier features without auth tests.

---

### 2. Payment & Subscription System (PARTIAL TESTS - FAILING)

**Files:**
- `src/lib/stripe.ts` (3.5KB) - Stripe API integration
- `src/lib/firebaseService.ts` (6.1KB) - User/tier Firestore sync
- `tests/stripe.test.ts` (EXISTS but FAILING)

**Missing Coverage:**
- [ ] Checkout session creation
- [ ] Customer portal session creation
- [ ] Webhook event processing (subscription created, updated, deleted)
- [ ] Tier update on successful payment
- [ ] Subscription cancellation handling
- [ ] Firestore user document creation
- [ ] Firestore tier update propagation
- [ ] Real-time tier listener updates

**Estimated Tests:** 30-40 tests
**Estimated Time:** 2 days

**Why Critical:** Payment flow must work 100% correctly. Financial transactions require comprehensive testing.

---

### 3. Tier System & Migration (PARTIAL TESTS - FAILING)

**Files:**
- `src/lib/tierMigration.ts` (5.4KB) - Upgrade/downgrade logic
- `src/lib/tierArchive.ts` (4.7KB) - 90-day archive system
- `tests/tierSystem.test.ts` (EXISTS but FAILING)

**Missing Coverage:**
- [ ] FREE → PRO upgrade (profile migration)
- [ ] PRO → FREE downgrade (archive creation)
- [ ] Archive creation (encrypt excess profiles)
- [ ] Archive restoration on re-subscription
- [ ] 90-day archive expiration
- [ ] Tier limit enforcement (1 profile FREE, unlimited PRO)
- [ ] Template limits (3 starter FREE, unlimited PRO)
- [ ] Custom rule limits (0 FREE, unlimited PRO)

**Estimated Tests:** 25-30 tests
**Estimated Time:** 1.5 days

**Why Critical:** Tier system is core monetization. Must handle upgrades/downgrades flawlessly without data loss.

---

### 4. Multi-Document Analysis Queue (NO TESTS)

**Files:**
- `src/popup/components/documentAnalysis.ts` (34KB) - Queue management UI
- `src/lib/documentParsers/pdfParser.ts` (3.2KB) - PDF parsing
- `src/lib/documentParsers/docxParser.ts` (980 bytes) - DOCX parsing
- `src/lib/documentParsers/txtParser.ts` (971 bytes) - TXT parsing
- `src/document-preview.ts` (unknown size) - Preview window

**Missing Coverage:**
- [ ] Upload multiple files (PDF, DOCX, TXT)
- [ ] Queue management (add, remove, clear)
- [ ] Status tracking (pending → processing → complete)
- [ ] Sequential processing (one file at a time)
- [ ] PDF text extraction
- [ ] DOCX text extraction
- [ ] TXT file reading
- [ ] Unified preview generation
- [ ] Progress bar calculation
- [ ] Document boundary markers
- [ ] Pagination (15k chars per page)
- [ ] Download sanitized documents

**Estimated Tests:** 35-40 tests
**Estimated Time:** 2 days

**Why Critical:** Major new feature (Phase 2E). Complex state management and file processing needs thorough testing.

---

### 5. Alias Variations Engine (NO DEDICATED TESTS)

**Files:**
- `src/lib/aliasVariations.ts` (8.9KB) - Variation generation

**Missing Coverage:**
- [ ] `generateNameVariations()` - 13+ variation types
  - GregBarker, gregbarker, gbarker, G.Barker, etc.
- [ ] `generateEmailVariations()` - 6 variation types
- [ ] `generatePhoneVariations()` - 8 variation types
- [ ] `generateGenericVariations()` - Company/address
- [ ] `containsVariation()` - Variation matching
- [ ] `findVariations()` - Find all matches
- [ ] `getVariationStats()` - Statistics

**Estimated Tests:** 25-30 tests
**Estimated Time:** 1 day

**Why Critical:** PRO feature completed Nov 1, 2025. Core protection feature that reduces false negatives by 25%.

---

## 🟡 HIGH PRIORITY (Quality & UX)

### 6. Background Customization & Image Editor (NO TESTS)

**Files:**
- `src/popup/components/backgroundManager.ts` (22KB) - Background selection
- `src/popup/components/imageEditor.ts` (19KB) - Image editing UI
- `src/lib/backgrounds.ts` (4.5KB) - Background library
- `src/lib/chromeTheme.ts` (4.4KB) - Theme integration

**Missing Coverage:**
- [ ] Upload custom background
- [ ] Image editor (crop, zoom, pan)
- [ ] Image compression
- [ ] Aspect ratio validation
- [ ] File size validation (500KB limit)
- [ ] Thumbnail generation
- [ ] Background library loading
- [ ] Theme swatch selection
- [ ] Chrome theme color detection
- [ ] WCAG luminance calculation

**Estimated Tests:** 30-35 tests
**Estimated Time:** 1.5-2 days

**Why High:** Recently completed (Nov 7, 2025). Complex UI component with image manipulation logic.

---

### 7. Prompt Templates System (PARTIAL TESTS)

**Files:**
- `src/popup/components/promptTemplates.ts` (30KB) - Template UI
- `src/lib/templateEngine.ts` (8.2KB) - Variable substitution
- `tests/templateEngine.test.ts` (EXISTS - covers engine only)

**Missing Coverage:**
- [ ] Template CRUD operations (create, edit, delete)
- [ ] Category organization
- [ ] Default profile selection
- [ ] Template variable UI ({{name}}, {{email}}, etc.)
- [ ] Starter template restrictions (FREE tier)
- [ ] Template duplication
- [ ] Template search/filter

**Estimated Tests:** 20-25 tests
**Estimated Time:** 1 day

**Why High:** Core productivity feature. Engine tested, but UI layer has no coverage.

---

### 8. Custom Rules UI (NO TESTS)

**Files:**
- `src/popup/components/customRulesUI.ts` (30KB) - Custom rules interface
- `src/lib/redactionEngine.ts` (6.2KB) - Rule execution
- `src/lib/ruleTemplates.ts` (4.8KB) - Rule templates
- `tests/redactionEngine.test.ts` (EXISTS - covers engine only)

**Missing Coverage:**
- [ ] Create custom rule
- [ ] Edit custom rule
- [ ] Delete custom rule
- [ ] Rule validation (regex syntax)
- [ ] Priority ordering
- [ ] Rule templates (SSN, credit card, etc.)
- [ ] Live pattern testing
- [ ] Match statistics
- [ ] PRO feature gating (FREE tier blocked)

**Estimated Tests:** 25-30 tests
**Estimated Time:** 1.5 days

**Why High:** PRO feature. Regex validation and live testing need thorough coverage.

---

### 9. API Key Vault UI (NO TESTS)

**Files:**
- `src/popup/components/apiKeyVault.ts` (13KB) - Key vault UI
- `src/popup/components/apiKeyModal.ts` (13KB) - Add/edit modal
- `src/lib/apiKeyDetector.ts` (4.9KB) - Key pattern detection
- `tests/apiKeyDetector.test.ts` (EXISTS - covers detector only)

**Missing Coverage:**
- [ ] Add API key
- [ ] Edit API key
- [ ] Delete API key
- [ ] Protection mode selection (auto-redact, warn, log)
- [ ] Custom key pattern support
- [ ] Key detection (OpenAI, GitHub, AWS, Stripe, Anthropic, Google)
- [ ] PRO feature gating

**Estimated Tests:** 20-25 tests
**Estimated Time:** 1 day

**Why High:** PRO feature. Security-critical (prevents API key leaks).

---

### 10. Profile Management UI (NO TESTS)

**Files:**
- `src/popup/components/profileModal.ts` (31KB) - Add/edit profile modal
- `src/popup/components/profileRenderer.ts` (7.4KB) - Profile list rendering

**Missing Coverage:**
- [ ] Create profile
- [ ] Edit profile
- [ ] Delete profile
- [ ] Enable/disable profile
- [ ] Field validation (email format, etc.)
- [ ] Duplicate profile detection
- [ ] Profile list rendering
- [ ] Profile selection
- [ ] Variation management UI (enable/disable, regenerate)
- [ ] FREE tier limit (1 profile max)

**Estimated Tests:** 30-35 tests
**Estimated Time:** 1.5 days

**Why High:** Core UI. Every user interacts with profile management.

---

## 🟢 MEDIUM PRIORITY (Polish & Enhancement)

### 11. Quick Alias Generator UI (NO TESTS)

**Files:**
- `src/popup/components/quickAliasGenerator.ts` (18KB) - Generator UI
- `src/lib/aliasGenerator.ts` (17KB) - Name generation
- `src/lib/data/*.ts` (5 files) - Name pools
- `tests/aliasGenerator.test.ts` (EXISTS - covers generator only)

**Missing Coverage:**
- [ ] Theme selection (coder, fantasy, funny, vintage)
- [ ] One-click generation
- [ ] Profile auto-fill
- [ ] Name pool selection
- [ ] Save generated profile

**Estimated Tests:** 15-20 tests
**Estimated Time:** 0.5-1 day

**Why Medium:** Core generator tested. UI layer needs coverage.

---

### 12. Features Tab & Settings (NO TESTS)

**Files:**
- `src/popup/components/featuresTab.ts` (21KB) - Features overview
- `src/popup/components/settingsHandlers.ts` (20KB) - Settings logic
- `src/popup/components/minimalMode.ts` (3.2KB) - Minimal UI mode

**Missing Coverage:**
- [ ] Feature discovery UI
- [ ] Feature enable/disable toggles
- [ ] Settings persistence
- [ ] Minimal mode toggle
- [ ] Theme selection
- [ ] Export/import settings

**Estimated Tests:** 20-25 tests
**Estimated Time:** 1 day

**Why Medium:** UX enhancements. Not critical for core functionality.

---

### 13. Activity Log & Stats (NO TESTS)

**Files:**
- `src/popup/components/activityLog.ts` (2.9KB) - Activity display
- `src/popup/components/statsRenderer.ts` (7.9KB) - Statistics rendering

**Missing Coverage:**
- [ ] Activity log rendering
- [ ] Substitution history
- [ ] Date range filtering
- [ ] Statistics calculations
- [ ] Export to CSV/JSON (PRO)

**Estimated Tests:** 15-20 tests
**Estimated Time:** 0.5-1 day

**Why Medium:** Informational feature. Bugs here won't break core protection.

---

### 14. Document Preview Modal (NO TESTS)

**Files:**
- `src/popup/components/documentPreviewModal.ts` (14KB) - Preview UI

**Missing Coverage:**
- [ ] Preview rendering (original vs sanitized)
- [ ] Pagination controls
- [ ] Copy sanitized text
- [ ] Download sanitized document
- [ ] Send to chat integration

**Estimated Tests:** 15-20 tests
**Estimated Time:** 0.5-1 day

**Why Medium:** Secondary UI for document analysis feature.

---

### 15. Status Indicators & Page Status (NO TESTS)

**Files:**
- `src/popup/components/statusIndicator.ts` (2.0KB) - Status badge
- `src/popup/components/pageStatus.ts` (2.1KB) - Page protection status

**Missing Coverage:**
- [ ] Status badge rendering (protected, unprotected, error)
- [ ] Badge color logic
- [ ] Page status detection
- [ ] Platform detection
- [ ] Protection health check

**Estimated Tests:** 10-15 tests
**Estimated Time:** 0.5 day

**Why Medium:** Visual indicators. Important UX but not critical.

---

## ⚪ LOW PRIORITY (Nice to Have)

### 16. Utility Functions (PARTIAL TESTS)

**Files:**
- `src/popup/utils/modalUtils.ts` - Modal helpers
- `src/popup/utils/formatters.ts` - Data formatting
- `src/popup/utils/dom.ts` - DOM utilities
- `src/popup/components/utils.ts` (1.5KB) - Component utilities
- `tests/utils.test.ts` (EXISTS - partial coverage)

**Missing Coverage:**
- [ ] Modal creation helpers
- [ ] Date/time formatters
- [ ] Number formatters
- [ ] DOM manipulation utilities
- [ ] Event handler helpers

**Estimated Tests:** 15-20 tests
**Estimated Time:** 0.5-1 day

**Why Low:** Utilities. Can be tested via integration tests of features that use them.

---

### 17. Content Scripts & Observers (NO TESTS)

**Files:**
- `src/content/content.ts` - Main content script
- `src/content/gemini-xhr-integration.ts` - Gemini XHR interception
- `src/content/xhr-interceptor.ts` - Generic XHR interception
- `src/content/observers/gemini-observer.ts` - Gemini DOM observer
- `src/content/observers/index.ts` - Observer index

**Missing Coverage:**
- [ ] Content script initialization
- [ ] Platform detection (ChatGPT, Claude, Gemini, etc.)
- [ ] Fetch interception (ChatGPT, Claude)
- [ ] XHR interception (Gemini)
- [ ] WebSocket interception (Copilot)
- [ ] DOM observers (Gemini text areas)
- [ ] Message passing (content ↔ background)

**Estimated Tests:** 40-50 tests
**Estimated Time:** 2-3 days

**Why Low:** E2E tests cover this. Unit testing content scripts is complex (requires DOM mocking).

---

### 18. Download Utilities (NO TESTS)

**Files:**
- `src/lib/downloadUtils.ts` (2.0KB) - File download helpers

**Missing Coverage:**
- [ ] Download as TXT
- [ ] Download as JSON
- [ ] Download as CSV
- [ ] Filename generation

**Estimated Tests:** 8-10 tests
**Estimated Time:** 0.5 day

**Why Low:** Simple utility. Low risk.

---

### 19. Store (Zustand State Management) (NO TESTS)

**Files:**
- `src/lib/store.ts` (15KB) - Zustand app state

**Missing Coverage:**
- [ ] State initialization
- [ ] State updates
- [ ] Config loading
- [ ] Profile loading
- [ ] Stats updates
- [ ] Theme changes

**Estimated Tests:** 20-25 tests
**Estimated Time:** 1 day

**Why Low:** State management. Can be tested via component integration tests.

---

## Summary Statistics

### Test Coverage by Feature Area

| Area | Files | Total Size | Tests | Coverage |
|------|-------|-----------|-------|----------|
| **Authentication** | 3 | 43KB | 0 | 0% ❌ |
| **Payments** | 2 | 9.6KB | 0 (failing) | 10% ❌ |
| **Tier System** | 2 | 10.1KB | 0 (failing) | 20% ❌ |
| **Multi-Document** | 5 | ~42KB | 0 | 0% ❌ |
| **Alias Variations** | 1 | 8.9KB | 0 | 0% ❌ |
| **Background/Image** | 4 | 50KB | 0 | 0% ❌ |
| **Prompt Templates** | 2 | 38KB | 5 | 10% ⚠️ |
| **Custom Rules UI** | 3 | 42KB | 10 | 20% ⚠️ |
| **API Key Vault UI** | 3 | 31KB | 8 | 20% ⚠️ |
| **Profile UI** | 2 | 38KB | 0 | 0% ❌ |
| **Quick Generator UI** | 6 | 40KB | 15 | 30% ⚠️ |
| **Features/Settings** | 3 | 44KB | 0 | 0% ❌ |
| **Activity/Stats** | 2 | 11KB | 0 | 0% ❌ |
| **Content Scripts** | 5 | ~15KB | 1 (failing) | 5% ❌ |
| **Utilities** | 7 | ~15KB | 10 | 40% ⚠️ |

**Total Untested Code:** ~437KB (~65% of codebase)
**Total Missing Tests:** Estimated 450-550 new tests needed

---

## Recommended Testing Roadmap

### Week 1: Critical Foundation (Launch Blockers)
**Priority:** 🔴 CRITICAL
**Goal:** Test authentication, payments, tier system

1. **Day 1-2:** Authentication tests (40-50 tests)
   - Auth modal, Google Sign-In, Email/Password, User profile
2. **Day 3:** Payment system tests (30-40 tests)
   - Stripe checkout, webhooks, Firestore sync
3. **Day 4:** Tier system tests (25-30 tests)
   - Migration, archive, tier limits

**Deliverable:** Auth, payments, and tier system fully tested (100-120 new tests)

---

### Week 2: Core Features (Major Features)
**Priority:** 🔴 CRITICAL + 🟡 HIGH
**Goal:** Test multi-doc queue and alias variations

4. **Day 5-6:** Multi-document analysis tests (35-40 tests)
   - Queue management, parsers, preview
5. **Day 7:** Alias variations tests (25-30 tests)
   - Name/email/phone variation generation
6. **Day 8:** Background/image editor tests (30-35 tests)
   - Upload, crop, compression, themes

**Deliverable:** All major Phase 3.x features tested (90-105 new tests)

---

### Week 3: UI Components (User-Facing)
**Priority:** 🟡 HIGH
**Goal:** Test all major UI components

7. **Day 9:** Profile UI tests (30-35 tests)
8. **Day 10:** Custom Rules UI tests (25-30 tests)
9. **Day 11:** API Key Vault UI tests (20-25 tests)
10. **Day 12:** Prompt Templates UI tests (20-25 tests)

**Deliverable:** All PRO feature UIs tested (95-115 new tests)

---

### Week 4: Polish & Completion
**Priority:** 🟢 MEDIUM
**Goal:** Fill remaining gaps

11. **Day 13:** Quick Generator UI tests (15-20 tests)
12. **Day 14:** Features/Settings tests (20-25 tests)
13. **Day 15:** Activity/Stats tests (15-20 tests)
14. **Day 16:** Status/Preview tests (25-35 tests)
15. **Day 17:** Utilities cleanup (15-20 tests)

**Deliverable:** All UI components tested (90-120 new tests)

---

### Optional: Content Scripts & E2E
**Priority:** ⚪ LOW (covered by manual testing)
**Goal:** Unit test content scripts (if time permits)

- Content script platform detection (10-15 tests)
- Fetch/XHR/WebSocket interception (25-30 tests)
- DOM observers (10-15 tests)

**Deliverable:** Content scripts unit tested (45-60 new tests)

---

## Total Effort Estimate

### Minimum Viable Test Suite (Weeks 1-3)
- **Tests:** ~310-345 new tests
- **Time:** 15 days (3 weeks)
- **Coverage:** All critical features + major UIs
- **Result:** ~95% test coverage on core features

### Comprehensive Test Suite (Weeks 1-4)
- **Tests:** ~400-465 new tests
- **Time:** 17 days (3.5 weeks)
- **Coverage:** All features except low-priority utilities
- **Result:** ~98% test coverage

### Complete Test Suite (Weeks 1-4 + Content Scripts)
- **Tests:** ~445-525 new tests
- **Time:** 20 days (4 weeks)
- **Coverage:** Everything
- **Result:** 100% test coverage

---

## Next Steps

1. **Review & Prioritize** - Confirm testing roadmap with stakeholders
2. **Fix Failing Tests First** - Get to 100% pass rate on existing 431 tests (1-2 days)
3. **Week 1: Critical Tests** - Auth, payments, tier system (5 days)
4. **Week 2: Feature Tests** - Multi-doc, variations, backgrounds (4 days)
5. **Week 3: UI Tests** - Profile, rules, vault, templates (4 days)
6. **Week 4: Polish** - Remaining UI components (5 days)

**Target:** 100% test coverage within 3-4 weeks

---

## Risk Assessment

### High Risk (No Tests)
- ❌ **Authentication** - Users can't sign in → no tier access
- ❌ **Payments** - Charge failures or incorrect tier updates → revenue loss
- ❌ **Tier Migration** - Data loss on downgrade → user complaints
- ❌ **Multi-Doc Queue** - File processing failures → feature unusable

### Medium Risk (Partial Tests)
- ⚠️ **Prompt Templates** - Engine tested, UI bugs possible
- ⚠️ **Custom Rules** - Engine tested, UI validation untested
- ⚠️ **API Key Vault** - Detector tested, UI CRUD untested

### Low Risk (Can Ship Without)
- ✅ **Content Scripts** - Covered by E2E tests
- ✅ **Utilities** - Tested via component integration

---

**Conclusion:** Need ~400-500 new tests to reach production-ready quality. Estimate 3-4 weeks of focused testing work.
