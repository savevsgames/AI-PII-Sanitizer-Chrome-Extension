# Refactor Progress - Session 1

**Date:** January 2025
**Goal:** Modularize CSS and TypeScript for maintainability

---

## ✅ COMPLETED: CSS Refactoring (100%)

### Before
- **popup-v2.css**: 1,027 lines (monolithic)
- Hard to maintain
- No design tokens
- Duplicated values

### After
- **popup-v2.css**: 28 lines (imports only)
- **10 modular files**: 1,246 lines total (including variables)

### New Structure
```
src/popup/styles/
├── variables.css (165 lines) - All design tokens
├── base.css (61 lines) - Reset & layout
├── header.css (69 lines) - Header component
├── tabs.css (92 lines) - Tab navigation
├── buttons.css (107 lines) - Button styles
├── profile-card.css (68 lines) - Profile cards
├── modal.css (200 lines) - Modal & forms
├── stats.css (66 lines) - Stats dashboard
├── minimal.css (96 lines) - Minimal mode
└── utilities.css (204 lines) - Utilities & debug
```

### Benefits
- ✅ Easy to find styles (organized by component)
- ✅ Design tokens in one place (variables.css)
- ✅ No duplicate CSS values
- ✅ Scalable - add new modules easily
- ✅ Tested: Build successful

**Commit:** `0c215f2`

---

## 🚧 IN PROGRESS: TypeScript Refactoring (10%)

### Current State
- **popup-v2.ts**: 901 lines (too large)
- Multiple responsibilities mixed together
- Hard to test individual features

### Target Structure
```
src/popup/
├── popup-v2.ts (100 lines) - Main entry point
├── components/
│   ├── utils.ts (60 lines) ✅ CREATED
│   ├── profileModal.ts (280 lines) - Profile CRUD
│   ├── profileRenderer.ts (120 lines) - Profile cards
│   ├── statsRenderer.ts (100 lines) - Stats display
│   ├── activityLog.ts (100 lines) - Debug console
│   └── minimalMode.ts (90 lines) - Minimal view
```

### Work Completed
- [x] Created `src/popup/components/` directory
- [x] Created `utils.ts` with helpers:
  - `isValidEmail()`
  - `escapeHtml()` ← **XSS protection**
  - `formatRelativeTime()`
  - Type-safe DOM helpers

### Remaining Work
- [ ] Extract profileModal.ts (lines 158-433)
- [ ] Extract profileRenderer.ts (lines 435-558)
- [ ] Extract statsRenderer.ts (lines 560-658)
- [ ] Extract activityLog.ts (lines 660-764)
- [ ] Extract minimalMode.ts (lines 766-850)
- [ ] Update popup-v2.ts to import components
- [ ] Test all functionality works

**Estimated Time:** 2-3 hours

---

## 🎯 NEXT STEPS (Priority Order)

### 1. Complete TypeScript Refactoring (1-2 hours)
Break popup-v2.ts into components as outlined above.

**Why Important:**
- Makes code testable
- Easier to maintain
- Clear separation of concerns
- Multiple devs can work in parallel

**Files to Create:**
1. `profileModal.ts` - Most complex, do first
2. `profileRenderer.ts` - Uses profileModal
3. `statsRenderer.ts` - Independent
4. `activityLog.ts` - Independent
5. `minimalMode.ts` - Uses localStorage (needs fixing)
6. Update `popup-v2.ts` - Wire everything together

### 2. Fix Security Issues (30 minutes)

**Priority 1: XSS Vulnerabilities**
- Replace all `.innerHTML =` with `escapeHtml()` calls
- Use `utils.ts` helper everywhere
- Test with `<script>alert('XSS')</script>` in profile names

**Priority 2: localStorage → chrome.storage**
- File: `src/popup/components/minimalMode.ts` (lines 814, 832, 841)
- Replace `localStorage.getItem/setItem` with `chrome.storage.local`
- Async/await pattern required

### 3. Implement Alias Variations (2-3 hours)

**PRO Feature:** Auto-generate name variations for better matching

**New Files:**
- `src/lib/aliasVariations.ts` - Generator class
- Update `src/lib/aliasEngine.ts` - Use variations

**Example:**
```
Input: "Greg Barker"
Output: [
  "Greg Barker",      // Original
  "GregBarker",       // No space
  "gregbarker",       // Lowercase
  "gbarker",          // First initial + last
  "G.Barker",         // Dot notation
  "G Barker",         // Initial + last
  "greg.barker",      // Email style
]
```

**UI:**
- Add "Generate Variations" button in profile editor
- Show preview of variations
- PRO badge (free tier = 1 variation only)

### 4. Rebrand to Pseudonize (1 hour)

**Files to Update:** ~30 files
- `package.json` (name, description)
- `src/manifest.json` (name, description)
- All HTML files (titles, headers)
- `PRIVACY_POLICY.md` and `privacy-policy.html`
- All documentation in `docs/`
- Console.log messages in source code

**Bash Script:**
```bash
find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.json" -o -name "*.html" -o -name "*.md" \) \
  ! -path "*/node_modules/*" ! -path "*/dist/*" \
  -exec sed -i 's/AI PII Sanitizer/Pseudonize/g' {} +
```

### 5. Change License to Apache 2.0 (15 minutes)

**Why Apache 2.0:**
- Requires attribution (forks must credit you)
- Patent protection
- Enterprise-friendly for acquisitions
- Used by Google, Facebook, Apache

**Tasks:**
- Download Apache 2.0 license → `LICENSE`
- Create `NOTICE` file
- Add header to all `.ts` files
- Update `package.json` → `"license": "Apache-2.0"`
- Create `CONTRIBUTING.md` with CLA

---

## 📊 Overall Progress

| Phase | Status | Complete |
|-------|--------|----------|
| CSS Refactoring | ✅ Done | 100% |
| TypeScript Refactoring | 🚧 Started | 10% |
| Security Fixes | ⏳ Pending | 0% |
| Alias Variations | ⏳ Pending | 0% |
| Rebrand | ⏳ Pending | 0% |
| License Change | ⏳ Pending | 0% |

**Total Progress:** ~18% complete

**Estimated Time to Complete All:** 6-8 hours

---

## 🔥 Quick Wins (Do These First)

1. **Finish TypeScript refactoring** (biggest impact on maintainability)
2. **Fix XSS** (critical security issue)
3. **Replace localStorage** (security + correctness)
4. **Implement alias variations** (killer feature)

---

## 📝 Notes

### CSS Refactoring Learnings
- Using @import in CSS works great for Chrome extensions
- Design tokens (CSS variables) make theme changes trivial
- Modular CSS is much easier to maintain
- Build time unchanged (still ~2.4s)

### TypeScript Refactoring Plan
- Extract components one at a time
- Test after each extraction
- Use dependency injection for testability
- Keep main file small (orchestration only)

### Security Priorities
1. XSS - Highest priority (user data at risk)
2. localStorage - Medium priority (should use chrome.storage)
3. Input length limits - Low priority (DoS prevention)

---

## 🐛 SERVICE WORKER INJECTION ISSUE

**Problem:** Content script injection fails on regular page refresh. Users need to hit Ctrl+Shift+R for injection to work properly. The reload button in popup only refreshes the page which doesn't trigger content script injection.

**Root Cause:**

- Content scripts only inject on extension load/reload or hard refresh
- Regular page refresh doesn't re-inject content scripts
- Current reload button just refreshes the page
- Therefore: Extension must load before page is hard-refreshed

**Solution Implemented:**

1. **Auto-inject on startup:** Modified service worker to inject content scripts into all existing AI service tabs on `chrome.runtime.onStartup` and `chrome.runtime.onInstalled`
2. **Smart injection:** Added `injectIntoExistingTabs()` function that:
   - Queries all tabs for AI service URLs
   - Checks if content script already injected (ping/pong test)
   - Injects only where needed to avoid double-injection
3. **Proper reload handler:** Added `REINJECT_CONTENT_SCRIPTS` message type that reinjects content scripts when popup reload button is clicked
4. **User feedback:** Added notification system to show reload success/failure

**Code Changes Required:**

- **serviceWorker.ts:** Add `injectIntoExistingTabs()`, `handleReinjectContentScripts()`, startup listeners
- **types.ts:** Add `REINJECT_CONTENT_SCRIPTS` and `PING` message types  
- **content.ts:** Add ping message handler
- **popup.ts:** Update reload button to use new reinject functionality with user feedback

**Files Modified:**

- `src/background/serviceWorker.ts` (major changes)
- `src/lib/types.ts` (add message types)
- `src/content/content.ts` (add ping handler)
- `src/popup/popup-v2.ts` (update reload button)

**Testing:**

1. Load extension in dev mode
2. Open ChatGPT/Claude in multiple tabs
3. Click reload button in popup
4. Verify content scripts work without hard refresh

**Priority:** HIGH - This affects core functionality and user experience

---

**Next Action:** Continue TypeScript refactoring with `profileModal.ts`
