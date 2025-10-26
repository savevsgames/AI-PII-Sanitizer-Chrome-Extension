# Phase 3: Feature Completion - Master Plan
## AI PII Sanitizer Extension

**Branch:** `Phase_3`
**Goal:** Complete all planned features, make them production-ready
**Estimated Time:** 40-50 hours
**Status:** Planning Complete ✅

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Current State Assessment](#current-state-assessment)
3. [Feature Roadmap](#feature-roadmap)
4. [Implementation Plan](#implementation-plan)
5. [Testing Strategy](#testing-strategy)
6. [Success Criteria](#success-criteria)

---

## 🎯 Overview

Phase 3 focuses on completing the **three main features** of the extension:

1. **API Key Vault** (90% complete) - Protect API keys from leaking
2. **Custom Redaction Rules** (0% complete) - Domain-specific PII patterns
3. **Prompt Templates** (0% complete) - Save/reuse prompts with privacy

Additionally, we'll:
- Enhance the existing alias system
- Add import/export functionality
- Improve stats and analytics
- Polish the overall user experience

---

## 📊 Current State Assessment

### What's Already Implemented

#### ✅ Core Infrastructure (100%)
- Service worker with request interception
- Storage system with encryption
- Profile/alias system (fully functional)
- UI framework (modern glassmorphism design)
- Message passing architecture

#### ✅ Features Tab (80%)
- Feature hub view with cards
- Navigation system
- Tier badge system (FREE/PRO)
- Coming Soon badges

#### ⚠️ API Key Vault (90%)
**Backend:**
- ✅ API key detection (7 formats: OpenAI, GitHub, AWS, Stripe, Anthropic, Google, Hugging Face)
- ✅ Encryption and secure storage
- ✅ Active scanning in service worker
- ✅ Protection modes: auto-redact, warn-first, log-only
- ✅ Statistics tracking

**Frontend:**
- ✅ Vault UI rendering
- ✅ Add key modal (basic)
- ✅ Key cards with toggle/delete
- ✅ Empty state
- ❌ .env file import (planned, not implemented)
- ❌ Copy button (planned, not implemented)
- ❌ Show/hide toggle (planned, not implemented)
- ❌ Paste button (planned, not implemented)
- ❌ Improved stats display (planned, not implemented)

#### ❌ Custom Redaction Rules (0%)
- Backend logic: Not started
- UI: Not started
- Pattern editor: Not started

#### ❌ Prompt Templates (0%)
- Backend logic: Not started
- UI: Not started
- Template editor: Not started

---

## 🗺️ Feature Roadmap

### Feature 1: API Key Vault (Complete it)
**Priority:** HIGH
**Est. Time:** 8-12 hours
**Status:** 90% → 100%

#### 1.1 Enhanced Modal (4 hours)
- [ ] Add vertical form layout (API Key → Nickname → Project)
- [ ] Add paste button with clipboard API
- [ ] Add .env file import tab
- [ ] Implement .env parser using existing APIKeyDetector
- [ ] Add bulk import with checkbox selection
- [ ] Add project assignment for bulk imports
- [ ] Update modal HTML structure
- [ ] Add modal CSS styles

#### 1.2 Enhanced Key Cards (3 hours)
- [ ] Add show/hide toggle button (👁️)
- [ ] Add copy to clipboard button (📋)
- [ ] Add visual feedback for copy (checkmark, 2s timeout)
- [ ] Improve stats display with icons (🛡️ 🕐 📅)
- [ ] Update card HTML template
- [ ] Add card action CSS styles

#### 1.3 Additional Features (2 hours)
- [ ] Add project filtering/grouping in vault list
- [ ] Add search functionality for keys
- [ ] Add sort options (by name, date, usage)
- [ ] Add key usage analytics view

#### 1.4 Testing & Polish (3 hours)
- [ ] Test manual key entry flow
- [ ] Test .env import with sample file
- [ ] Test show/hide functionality
- [ ] Test copy to clipboard
- [ ] Test with 10+ keys (FREE tier limit)
- [ ] Test with multiple projects
- [ ] Cross-browser compatibility

**Files to Modify:**
- `src/popup/components/apiKeyModal.ts` (~300 lines to add)
- `src/popup/components/apiKeyVault.ts` (~200 lines to add)
- `src/popup/popup-v2.html` (modal HTML update)
- `src/popup/styles/api-key-vault.css` (new file, ~500 lines)

---

### Feature 2: Custom Redaction Rules
**Priority:** MEDIUM
**Est. Time:** 15-20 hours
**Status:** 0% → 100%

#### 2.1 Backend Implementation (8 hours)
- [ ] Create `src/lib/redactionEngine.ts` - Rule matching engine
- [ ] Define CustomRule interface (pattern, replacement, priority)
- [ ] Implement regex compilation and validation
- [ ] Add rule storage (encrypted patterns)
- [ ] Integrate with service worker request flow
- [ ] Add rule testing/preview functionality
- [ ] Implement rule priority system
- [ ] Add rule conflict detection

#### 2.2 Frontend Implementation (7 hours)
- [ ] Create `src/popup/components/customRulesUI.ts`
- [ ] Design rule editor modal
- [ ] Add pattern input with validation
- [ ] Add replacement input (supports variables like $1, $2)
- [ ] Add pattern tester (live preview)
- [ ] Add rule list with enable/disable toggles
- [ ] Add rule priority reordering (drag-and-drop)
- [ ] Add preset templates (SSN, credit card, etc.)

#### 2.3 UI Components (3 hours)
- [ ] Rule card component
- [ ] Pattern editor with syntax highlighting
- [ ] Test panel showing matches
- [ ] Rule template library
- [ ] Import/export rules

#### 2.4 Testing (2 hours)
- [ ] Test with common PII patterns
- [ ] Test regex edge cases
- [ ] Test rule conflicts
- [ ] Test performance with 50+ rules

**Files to Create:**
- `src/lib/redactionEngine.ts` (~400 lines)
- `src/popup/components/customRulesUI.ts` (~500 lines)
- `src/popup/styles/custom-rules.css` (~300 lines)
- `src/lib/ruleTemplates.ts` (~200 lines)

**Files to Modify:**
- `src/background/serviceWorker.ts` (integrate redaction engine)
- `src/lib/storage.ts` (add rule storage methods)
- `src/popup/components/featuresTab.ts` (add navigation)

---

### Feature 3: Prompt Templates
**Priority:** LOW
**Est. Time:** 12-15 hours
**Status:** 0% → 100%

#### 3.1 Backend Implementation (5 hours)
- [ ] Create `src/lib/templateEngine.ts`
- [ ] Define PromptTemplate interface
- [ ] Implement template variables ({{name}}, {{email}}, etc.)
- [ ] Add template storage
- [ ] Add template categories/tags
- [ ] Add template sharing (export as JSON)

#### 3.2 Frontend Implementation (5 hours)
- [ ] Create `src/popup/components/promptTemplatesUI.ts`
- [ ] Design template library view
- [ ] Design template editor modal
- [ ] Add variable insertion UI
- [ ] Add preview with sample data
- [ ] Add quick-use button (copies to clipboard)
- [ ] Add template categories/filtering

#### 3.3 Integration (2 hours)
- [ ] Add context menu integration (right-click → Use Template)
- [ ] Add keyboard shortcut support
- [ ] Add template auto-suggestions

#### 3.4 Testing (3 hours)
- [ ] Test template variable replacement
- [ ] Test with complex templates
- [ ] Test clipboard integration
- [ ] Test export/import

**Files to Create:**
- `src/lib/templateEngine.ts` (~300 lines)
- `src/popup/components/promptTemplatesUI.ts` (~400 lines)
- `src/popup/styles/prompt-templates.css` (~250 lines)

---

### Feature 4: Enhanced Aliases (Existing Feature)
**Priority:** MEDIUM
**Est. Time:** 5-8 hours
**Status:** 80% → 100%

#### 4.1 Alias Variations (3 hours)
- [ ] Add support for name variations (e.g., "Greg Barker" vs "Greg B." vs "G. Barker")
- [ ] Add fuzzy matching option
- [ ] Add case-insensitive matching toggle
- [ ] Add partial match warnings

#### 4.2 Import/Export (2 hours)
- [ ] Add CSV import for aliases
- [ ] Add JSON export
- [ ] Add bulk edit functionality

#### 4.3 Advanced Features (3 hours)
- [ ] Add alias templates (common formats)
- [ ] Add alias validation rules
- [ ] Add conflict detection (duplicate aliases)

**Files to Modify:**
- `src/background/handlers/aliasHandlers.ts` (~150 lines to add)
- `src/popup/components/profileCard.ts` (~100 lines to add)

---

## 📅 Implementation Plan

### Week 1: API Key Vault Completion
**Days 1-2:** Enhanced modal with .env import
**Day 3:** Enhanced key cards with show/hide/copy
**Day 4:** Additional features (filtering, search, analytics)
**Day 5:** Testing and bug fixes

**Deliverable:** Fully functional API Key Vault with all planned features

---

### Week 2: Custom Redaction Rules
**Days 1-2:** Backend redaction engine
**Days 3-4:** Frontend rule editor and tester
**Day 5:** Rule templates and testing

**Deliverable:** Custom Redaction Rules feature (PRO tier)

---

### Week 3: Prompt Templates & Polish
**Days 1-2:** Template engine backend
**Day 3:** Template library UI
**Day 4:** Integration and testing
**Day 5:** Enhanced aliases + overall polish

**Deliverable:** Complete feature set, production-ready

---

## 🧪 Testing Strategy

### Unit Testing
- API Key Detector patterns
- Redaction engine rule matching
- Template variable replacement
- Alias matching algorithms

### Integration Testing
- Service worker intercepts requests correctly
- UI components communicate with background
- Storage operations work correctly
- Encryption/decryption cycles

### Manual Testing
- Test on ChatGPT (chat.openai.com)
- Test on Claude (claude.ai)
- Test on Gemini (gemini.google.com)
- Test on various input formats

### Performance Testing
- 100+ aliases performance
- 50+ redaction rules performance
- Large .env file import (50+ keys)
- Memory usage monitoring

---

## ✅ Success Criteria

### API Key Vault
- [ ] Can add keys manually with paste button
- [ ] Can import keys from .env file
- [ ] Can show/hide key values
- [ ] Can copy keys to clipboard
- [ ] Free tier limits enforced (10 keys max, OpenAI only)
- [ ] Keys are successfully detected and redacted in real requests
- [ ] Stats update correctly (protection count, last used)

### Custom Redaction Rules
- [ ] Can create custom regex patterns
- [ ] Can test patterns with live preview
- [ ] Rules are applied in request interception
- [ ] Rule conflicts are detected
- [ ] Can import/export rules
- [ ] Performance acceptable with 50+ rules

### Prompt Templates
- [ ] Can create and save templates
- [ ] Variables are replaced correctly
- [ ] Can copy template to clipboard
- [ ] Categories/tags work
- [ ] Can export/import templates

### Overall Polish
- [ ] No console errors
- [ ] All features work on Chrome/Edge
- [ ] UI is responsive and smooth
- [ ] Help text/tooltips are clear
- [ ] Build completes without warnings (bundle size excluded)

---

## 🎯 Task Breakdown (For Implementation)

### Task 3.1: API Key Vault - Enhanced Modal
**File:** `src/popup/components/apiKeyModal.ts`
**Estimated Time:** 4 hours

#### Subtasks:
1. Add imports for APIKeyDetector and ParsedEnvKey interface
2. Add setupImportMethodTabs() function
3. Add setupPasteButton() function
4. Add setupEnvParser() function
5. Add parseEnvFile() function
6. Add renderEnvPreview() function
7. Update handleSaveAPIKey() to support both modes
8. Add handleSaveManualKey() function
9. Add handleImportEnvKeys() function
10. Update showAddAPIKeyModal() to reset form state

**Reference:** See FEATURE_UPGRADES.md lines 14-379 for complete implementation

---

### Task 3.2: API Key Vault - Enhanced Key Cards
**File:** `src/popup/components/apiKeyVault.ts`
**Estimated Time:** 3 hours

#### Subtasks:
1. Update renderAPIKeyCard() - add show/hide button HTML
2. Update renderAPIKeyCard() - add copy button HTML
3. Update renderAPIKeyCard() - improve stats display with icons
4. Add copy button event listener in renderAPIKeys()
5. Update show/hide button event listener
6. Add visual feedback for copy action (checkmark, timeout)
7. Test all button interactions

**Reference:** See FEATURE_UPGRADES.md lines 381-525 for complete implementation

---

### Task 3.3: API Key Vault - Modal HTML Update
**File:** `src/popup/popup-v2.html`
**Estimated Time:** 1 hour

#### Subtasks:
1. Replace existing modal HTML (lines ~440-491)
2. Add modal tabs structure
3. Add manual entry tab content
4. Add .env import tab content
5. Add env preview section
6. Test modal rendering

**Reference:** See FEATURE_UPGRADES.md lines 527-680 for complete HTML

---

### Task 3.4: API Key Vault - CSS Styles
**File:** `src/popup/styles/api-key-vault.css` (new file)
**Estimated Time:** 2 hours

#### Subtasks:
1. Create new CSS file
2. Add modal tab styles
3. Add import method content styles
4. Add vertical form styles
5. Add paste button styles
6. Add .env preview styles
7. Add key card action styles
8. Add stats with icons styles
9. Import in popup-v2.html

**Reference:** See VAULT_UI_IMPROVEMENTS.md lines 99-466 for complete CSS

---

### Task 3.5: Custom Redaction Rules - Backend
**File:** `src/lib/redactionEngine.ts` (new file)
**Estimated Time:** 8 hours

#### Subtasks:
1. Define CustomRule interface
2. Create RedactionEngine class
3. Implement rule compilation (regex validation)
4. Implement rule matching algorithm
5. Implement rule priority system
6. Add rule conflict detection
7. Add rule testing/preview
8. Add error handling for invalid patterns
9. Add performance optimization (memoization)
10. Write unit tests

---

### Task 3.6: Custom Redaction Rules - Frontend
**File:** `src/popup/components/customRulesUI.ts` (new file)
**Estimated Time:** 7 hours

#### Subtasks:
1. Create rule list view
2. Create rule editor modal
3. Add pattern input with validation
4. Add replacement input
5. Add live pattern tester
6. Add preset templates
7. Add rule enable/disable toggles
8. Add rule priority reordering (drag-drop)
9. Add import/export functionality
10. Connect to backend storage

---

### Task 3.7: Prompt Templates - Backend
**File:** `src/lib/templateEngine.ts` (new file)
**Estimated Time:** 5 hours

#### Subtasks:
1. Define PromptTemplate interface
2. Create TemplateEngine class
3. Implement variable replacement ({{var}})
4. Add template storage methods
5. Add template categories
6. Add template validation
7. Add export/import JSON
8. Write unit tests

---

### Task 3.8: Prompt Templates - Frontend
**File:** `src/popup/components/promptTemplatesUI.ts` (new file)
**Estimated Time:** 5 hours

#### Subtasks:
1. Create template library view
2. Create template editor modal
3. Add variable insertion UI
4. Add preview with sample data
5. Add quick-use (copy to clipboard)
6. Add categories/filtering
7. Add template search
8. Connect to backend storage

---

### Task 3.9: Enhanced Aliases
**Files:** Multiple
**Estimated Time:** 5 hours

#### Subtasks:
1. Add alias variations support in backend
2. Add fuzzy matching algorithm
3. Add CSV import functionality
4. Add JSON export functionality
5. Add bulk edit UI
6. Add alias templates
7. Add conflict detection

---

### Task 3.10: Testing & Polish
**Files:** All
**Estimated Time:** 10 hours

#### Subtasks:
1. Write unit tests for new features
2. Perform integration testing
3. Manual testing on ChatGPT, Claude, Gemini
4. Performance profiling
5. Fix all bugs found
6. Add error handling where missing
7. Add loading states
8. Add success/failure notifications
9. Update documentation
10. Final build and verification

---

## 📝 Notes for Implementation

### Development Workflow
1. **One feature at a time** - Complete API Key Vault before moving to Custom Rules
2. **Test incrementally** - Build and test after each subtask
3. **Use existing patterns** - Follow the glassmorphism design system from Phase 2
4. **Reference existing code** - Look at profileCard.ts for UI patterns
5. **Keep console logging** - Use `[Component Name]` prefix for all logs

### Code Style
- Use TypeScript strict mode
- Follow existing naming conventions
- Add JSDoc comments for all public functions
- Use async/await (not .then())
- Handle errors gracefully with try/catch

### UI Guidelines
- Follow Phase 2 glassmorphism design
- Use CSS variables from variables.css
- Use pill-style buttons (border-radius: 20px)
- Use modern color palette (indigo/violet)
- Add smooth transitions (0.25s cubic-bezier)

---

## 🚀 Getting Started

**To begin Phase 3:**

1. Review this plan thoroughly
2. Start with Task 3.1 (API Key Vault - Enhanced Modal)
3. Reference FEATURE_UPGRADES.md for detailed code
4. Build and test after each major change
5. Move to next task when current task is complete

**Build command:**
```bash
npm run build
```

**Testing:**
1. Load `dist/` folder in Chrome (chrome://extensions)
2. Open extension popup
3. Test the feature you just implemented
4. Check console for errors

---

## 📚 Reference Documents

- **FEATURE_UPGRADES.md** - Step-by-step implementation for API Key Vault enhancements
- **VAULT_TROUBLESHOOTING.md** - Diagnostic guide if vault isn't working
- **VAULT_UI_IMPROVEMENTS.md** - CSS and HTML reference for vault UI
- **PHASE_2_COMPLETE.md** - Glassmorphism implementation reference
- **src/lib/apiKeyDetector.ts** - API key detection patterns
- **src/background/serviceWorker.ts** - Request interception logic

---

**Phase 3 Start Date:** [To be filled]
**Expected Completion:** [To be filled]
**Current Status:** Planning Complete ✅

---

*Let's build some amazing features! 🎨🚀*
