# E2E Test Suite Expansion Plan

**Enterprise-Grade Test Coverage for PromptBlocker**

**Created:** 2025-01-12
**Status:** Planning Phase
**Target:** Comprehensive feature coverage across all user flows

---

## Executive Summary

This document outlines an enterprise-grade expansion of the PromptBlocker E2E test suite using Puppeteer. The plan covers **12 major features** across **50+ test scenarios**, organized into **4 implementation phases** over 4 weeks.

**Current Status:**
- ✅ **Core Tests (4):** Extension loading, popup UI, profile CRUD, profile toggle - **ALL PASSING**
- 🚧 **Platform Tests (5):** ChatGPT, Claude, Gemini, Perplexity, Copilot - **NOT STARTED**
- 🚧 **Feature Tests (6):** API Key Vault, Custom Rules, Templates, Document Analysis, Quick Generator, Minimal Mode - **NOT STARTED**

**Expansion Plan:**
- 📋 **13 New Test Files** covering features, customization, and advanced flows
- 🎯 **50+ New Test Cases** for comprehensive feature coverage
- ⏱️ **~4 Hours Total Runtime** (estimated, with parallelization)
- 🔄 **4-Week Implementation** (1 phase per week)

---

## Table of Contents

1. [Current Test Suite Status](#current-test-suite-status)
2. [Feature Analysis & Test Priorities](#feature-analysis--test-priorities)
3. [Test Organization Structure](#test-organization-structure)
4. [Phase 1: Core Feature Tests](#phase-1-core-feature-tests-week-1)
5. [Phase 2: Document & Media Processing](#phase-2-document--media-processing-week-2)
6. [Phase 3: Advanced Protection Features](#phase-3-advanced-protection-features-week-3)
7. [Phase 4: UX & Customization](#phase-4-ux--customization-week-4)
8. [Implementation Guidelines](#implementation-guidelines)
9. [Known Issues & Blockers](#known-issues--blockers)
10. [Test Execution Strategy](#test-execution-strategy)
11. [Success Metrics](#success-metrics)

---

## Current Test Suite Status

### Implemented Tests (15 tests, ~2 hours)

#### Core Tests (4 tests, ~40 minutes) ✅ ALL PASSING
- **01-extension-loading.test.ts** - Extension and service worker initialization
- **02-popup-ui.test.ts** - Popup UI rendering and navigation (10 tests)
- **03-profile-crud.test.ts** - Profile Create, Read, Update, Delete
- **04-profile-toggle.test.ts** - Profile enable/disable

#### Platform Tests (5 tests, ~60 minutes) - NOT STARTED
- **05-chatgpt.test.ts** - ChatGPT PII substitution
- **06-claude.test.ts** - Claude PII substitution
- **07-gemini.test.ts** - Gemini PII substitution
- **08-perplexity.test.ts** - Perplexity PII substitution
- **09-copilot.test.ts** - Copilot PII substitution

#### Feature Tests (6 tests, ~60 minutes) - NOT STARTED
- **10-api-key-vault.test.ts** - API Key detection and redaction
- **11-custom-rules.test.ts** - Custom redaction rules
- **12-prompt-templates.test.ts** - Template creation and injection
- **13-document-analysis.test.ts** - Multi-file document processing
- **14-quick-generator.test.ts** - Quick alias generator
- **15-minimal-mode.test.ts** - Minimal mode toggle

---

## Feature Analysis & Test Priorities

### 🔥 Priority 1: Must-Have Tests (Launch Blockers)

These features represent core value propositions and MUST have E2E coverage:

| Feature | Status | Test File | Tests | Runtime | Priority |
|---------|--------|-----------|-------|---------|----------|
| **Quick Alias Generator** | ✅ Implemented | `16-quick-alias-generator.test.ts` | 8 | 15 min | ⭐⭐⭐⭐⭐ |
| **Document Analysis Queue** | ✅ Implemented | `17-document-analysis.test.ts` | 12 | 25 min | ⭐⭐⭐⭐⭐ |
| **Prompt Templates** | ✅ Implemented | `18-prompt-templates.test.ts` | 10 | 20 min | ⭐⭐⭐⭐⭐ |
| **Alias Variations** | ⚠️ Phase 1 | `19-alias-variations.test.ts` | 6 | 12 min | ⭐⭐⭐⭐ |
| **Image Editor** | ✅ Implemented | `20-image-editor.test.ts` | 8 | 15 min | ⭐⭐⭐⭐ |

### 📌 Priority 2: Important Tests (Feature Completeness)

| Feature | Status | Test File | Tests | Runtime | Priority |
|---------|--------|-----------|-------|---------|----------|
| **API Key Vault** | 🚧 Backend Only | `21-api-key-vault.test.ts` | 10 | 18 min | ⭐⭐⭐⭐⭐ |
| **Background Customization** | ✅ Implemented | `22-background-customization.test.ts` | 8 | 12 min | ⭐⭐⭐ |
| **Minimal Mode** | ✅ Implemented | `23-minimal-mode.test.ts` | 5 | 8 min | ⭐⭐⭐ |
| **Chrome Theme Integration** | ✅ Implemented | `24-chrome-theme.test.ts` | 4 | 6 min | ⭐⭐ |

### 🌟 Priority 3: Nice-to-Have Tests (Future)

| Feature | Status | Test File | Tests | Runtime | Priority |
|---------|--------|-----------|-------|---------|----------|
| **Developer Terms Spell Check** | 📋 Planned | `25-dev-terms-spellcheck.test.ts` | 6 | 10 min | ⭐⭐⭐⭐ |
| **Keyboard Shortcuts** | 📋 Planned | `26-keyboard-shortcuts.test.ts` | 8 | 12 min | ⭐⭐ |
| **Image PII Scanner** | 📋 Planned | `27-image-pii-scanner.test.ts` | 5 | 15 min | ⭐⭐⭐ |

---

## Test Organization Structure

```
tests/e2e-puppeteer/
├── setup/                              # Test infrastructure
│   ├── ExtensionTestHarness.ts         # Core harness (completed)
│   ├── PageObjectModels.ts             # Page interaction classes (in progress)
│   └── TestHelpers.ts                  # Utility functions (completed)
│
├── core/                               # Core functionality ✅ COMPLETE
│   ├── 01-extension-loading.test.ts    # Extension initialization
│   ├── 02-popup-ui.test.ts             # Popup UI (10 tests) ✅ ALL PASSING
│   ├── 03-profile-crud.test.ts         # Profile CRUD
│   └── 04-profile-toggle.test.ts       # Profile toggle
│
├── platforms/                          # Platform-specific tests 🚧 TODO
│   ├── 05-chatgpt.test.ts
│   ├── 06-claude.test.ts
│   ├── 07-gemini.test.ts
│   ├── 08-perplexity.test.ts
│   └── 09-copilot.test.ts
│
├── features/                           # Advanced features 🚧 NEW
│   ├── 16-quick-alias-generator.test.ts    # Quick generator (Priority 1)
│   ├── 17-document-analysis.test.ts        # Document queue (Priority 1)
│   ├── 18-prompt-templates.test.ts         # Templates (Priority 1)
│   ├── 19-alias-variations.test.ts         # Variations (Priority 1)
│   ├── 20-image-editor.test.ts             # Image editor (Priority 1)
│   ├── 21-api-key-vault.test.ts            # API Key Vault (Priority 2, blocked)
│   ├── 25-dev-terms-spellcheck.test.ts     # Spell check (Priority 3, planned)
│   ├── 26-keyboard-shortcuts.test.ts       # Shortcuts (Priority 3, planned)
│   └── 27-image-pii-scanner.test.ts        # Image scanning (Priority 3, planned)
│
├── customization/                      # UI/UX customization 🚧 NEW
│   ├── 22-background-customization.test.ts # Backgrounds (Priority 2)
│   ├── 23-minimal-mode.test.ts             # Minimal mode (Priority 2)
│   └── 24-chrome-theme.test.ts             # Theme integration (Priority 2)
│
├── integration/                        # Cross-feature flows 🚧 NEW
│   ├── 28-end-to-end-protection.test.ts   # Full protection flow
│   └── 29-pro-feature-gating.test.ts      # PRO tier restrictions
│
├── screenshots/                        # Auto-captured screenshots
└── README.md                           # Test suite documentation
```

---

## Phase 1: Core Feature Tests (Week 1)

**Goal:** Cover the top 3 user-facing features that drive product value

### Test 1: Quick Alias Generator (16-quick-alias-generator.test.ts)

**Runtime:** ~15 minutes
**Tests:** 8 scenarios

#### Test Scenarios

1. **Open Quick Alias Generator modal**
   - Navigate to Features tab
   - Click "Quick Alias Generator" card
   - Verify modal opens with template selection

2. **Select template and generate preview**
   - Click "Professional" template
   - Verify preview displays: name, email, phone, company, address
   - Verify data is randomized (not placeholder text)

3. **Regenerate alias data**
   - Click "Regenerate" button
   - Verify all fields update with new random data
   - Verify data format is valid (email has @, phone has proper format)

4. **Use alias to create profile**
   - Click "Use This Alias" button
   - Verify profile modal opens
   - Verify all fields pre-filled with generated data
   - Save profile
   - Verify profile appears in profile list

5. **Test all template types** (FREE vs PRO)
   - Test FREE templates: Professional, Creative, Technical, Casual
   - Verify each template generates appropriate data
   - Test PRO templates (requires PRO tier)
   - Verify FREE user sees PRO lock badge

6. **Test bulk generation** (PRO only)
   - Enable bulk mode (if PRO)
   - Generate 5 profiles
   - Verify all 5 appear in queue
   - Batch save profiles
   - Verify all 5 profiles created

7. **Test regenerate with same template**
   - Select template
   - Regenerate 3 times
   - Verify each regeneration produces different data
   - Verify no duplicates across regenerations

8. **Test modal close without saving**
   - Generate alias
   - Close modal without clicking "Use This Alias"
   - Verify no profile created
   - Verify modal state resets on next open

#### Page Object Model Additions

```typescript
export class QuickAliasGeneratorModal {
  async selectTemplate(name: string): Promise<void>;
  async getPreviewData(): Promise<AliasPreview>;
  async regenerate(): Promise<void>;
  async useAlias(): Promise<void>;
  async enableBulkMode(count: number): Promise<void>;
  async getBulkProfiles(): Promise<AliasPreview[]>;
}
```

---

### Test 2: Document Analysis Queue (17-document-analysis.test.ts)

**Runtime:** ~25 minutes
**Tests:** 12 scenarios

#### Test Scenarios

1. **Upload single PDF file**
   - Click "Choose Files" button
   - Select test PDF (tests/fixtures/sample.pdf)
   - Verify file appears in queue with checkbox
   - Verify status: "Ready to analyze"

2. **Upload multiple mixed files**
   - Upload: PDF, TXT, DOCX (3 files)
   - Verify all 3 appear in queue
   - Verify each has checkbox, filename, file size

3. **Toggle file selection**
   - Upload 3 files
   - Uncheck file 2
   - Verify file 2 greyed out
   - Click "Analyze Documents"
   - Verify only files 1 and 3 process

4. **Process documents sequentially**
   - Upload 3 files
   - Click "Analyze Documents"
   - Watch status badges update:
     - File 1: Pending → Processing → Completed
     - File 2: Pending → Processing → Completed
     - File 3: Pending → Processing → Completed
   - Verify one file processes at a time

5. **Preview window auto-opens**
   - Process documents
   - Verify preview window appears automatically
   - Verify shows first document content
   - Verify progress bar shows 3 document markers

6. **Navigate between documents**
   - Process 3 documents
   - Click document marker 2 → jumps to doc 2 start
   - Click ► button → advances within document
   - Click ►► button → jumps to next document
   - Click ◄ button → goes back
   - Click ◄◄ button → jumps to previous document

7. **Test pagination controls**
   - Process multi-page PDF
   - Verify "Page 1 of X" indicator
   - Click ► repeatedly → pages advance
   - Verify can't advance past last page
   - Click ◄ repeatedly → pages go back
   - Verify can't go before first page

8. **Copy sanitized text**
   - Process document with PII (name, email)
   - Click "Copy" button
   - Read clipboard content
   - Verify PII replaced with aliases
   - Verify formatting preserved (line breaks, spacing)

9. **Download sanitized text**
   - Process document
   - Click "Download" button
   - Verify .txt file downloads
   - Read downloaded file
   - Verify PII sanitized
   - Verify filename format: `sanitized_analysis_YYYYMMDD_HHMMSS.txt`

10. **Remove file from queue**
    - Upload 3 files
    - Click X button on file 2
    - Verify file 2 removed from queue
    - Verify files 1 and 3 remain

11. **Clear all files**
    - Upload 3 files
    - Click "Clear All" button (if exists)
    - Verify all files removed
    - Verify queue empty state shown

12. **Test error handling**
    - Upload corrupted PDF
    - Click "Analyze"
    - Verify error status badge
    - Verify error message displays
    - Verify other files still process

#### Page Object Model Additions

```typescript
export class DocumentAnalysisCard {
  async uploadFiles(filePaths: string[]): Promise<void>;
  async toggleFileSelection(index: number): Promise<void>;
  async analyzeDocuments(): Promise<void>;
  async getQueueStatus(): Promise<FileStatus[]>;
  async removeFile(index: number): Promise<void>;
  async clearAll(): Promise<void>;
}

export class DocumentPreviewModal {
  async navigateNext(): Promise<void>;
  async navigatePrevious(): Promise<void>;
  async jumpToDocument(index: number): Promise<void>;
  async getCurrentPage(): Promise<number>;
  async getTotalPages(): Promise<number>;
  async copyText(): Promise<string>;
  async downloadText(): Promise<string>;
  async close(): Promise<void>;
}
```

---

### Test 3: Prompt Templates (18-prompt-templates.test.ts)

**Runtime:** ~20 minutes
**Tests:** 10 scenarios

#### Test Scenarios

1. **Open Templates tab**
   - Navigate to Templates tab
   - Verify template list displays
   - Verify "Create Template" button visible

2. **Create new template**
   - Click "Create Template"
   - Enter name: "Code Review Request"
   - Enter content with placeholders:
     ```
     Please review this code.

     Reviewer: {{name}} ({{email}})
     Company: {{company}}
     ```
   - Click "Save"
   - Verify template appears in list

3. **Test template placeholder substitution**
   - Create profile with alias data
   - Activate profile
   - Select template
   - Click "Use Template"
   - Switch to ChatGPT tab
   - Verify placeholders replaced:
     - `{{name}}` → alias name
     - `{{email}}` → alias email
     - `{{company}}` → alias company

4. **Test line break preservation** ⚠️ CRITICAL
   - Create template with multiple lines:
     ```
     Line 1
     Line 2
     Line 3
     ```
   - Use template in ChatGPT
   - **VERIFY:** Line breaks preserved (not collapsed)
   - **KNOWN ISSUE:** Currently fails - line breaks lost

5. **Edit existing template**
   - Click "Edit" on template
   - Modify name and content
   - Save changes
   - Verify changes persist
   - Use template → verify new content injected

6. **Delete template**
   - Create test template
   - Click "Delete" button
   - Verify confirmation dialog
   - Confirm deletion
   - Verify template removed from list

7. **Test template with no active profile**
   - Disable all profiles
   - Select template with placeholders
   - Click "Use Template"
   - **VERIFY:** Placeholders remain as `{{name}}` (not replaced)
   - OR: Warning shown "No active profile"

8. **Test FREE tier limits**
   - Create 10 templates (FREE limit)
   - Attempt to create 11th template
   - Verify error or PRO upgrade prompt
   - Verify first 10 templates work

9. **Test PRO tier unlimited templates**
   - Set tier to PRO
   - Create 20+ templates
   - Verify no limit enforced
   - Verify all templates usable

10. **Test template categories/tags** (if implemented)
    - Create templates with categories
    - Filter by category
    - Verify filtered list correct

#### Page Object Model Additions

```typescript
export class TemplatesTab {
  async createTemplate(name: string, content: string): Promise<void>;
  async editTemplate(index: number, newName: string, newContent: string): Promise<void>;
  async deleteTemplate(index: number): Promise<void>;
  async selectTemplate(index: number): Promise<void>;
  async useTemplate(): Promise<void>;
  async getTemplateCount(): Promise<number>;
}

export class ChatGPTPage {
  async getInputText(): Promise<string>;
  async send(): Promise<void>;
  async waitForResponse(): Promise<string>;
}
```

---

## Phase 2: Document & Media Processing (Week 2)

### Test 4: Alias Variations (19-alias-variations.test.ts)

**Runtime:** ~12 minutes
**Tests:** 6 scenarios

#### Test Scenarios

1. **Create profile with auto-generated variations**
   - Create profile: "Greg Barker"
   - Open profile edit modal
   - Verify variations section shows:
     - `GregBarker` (no space)
     - `gregbarker` (lowercase, no space)
     - `gbarker` (first initial + last)
     - `G.Barker` (abbreviated first)
     - `greg.barker` (dot separator)
     - `greg_barker` (underscore separator)
   - Verify ~6-10 variations auto-generated

2. **Add custom variation**
   - Open profile edit
   - Click "Add Custom Variation"
   - Enter: "Gregory Barker"
   - Save profile
   - Verify custom variation appears in list
   - Verify marked as "Custom"

3. **Delete custom variation**
   - Add custom variation
   - Click delete icon on custom variation
   - Verify variation removed
   - Verify auto-generated variations remain

4. **Test variation matching in ChatGPT**
   - Create profile with variations
   - Go to ChatGPT
   - Type message with variation: "This is for gregbarker"
   - Send message
   - Verify interceptor replaces `gregbarker` → alias name
   - Check activity log → verify substitution recorded

5. **Test FREE tier limits** (10 custom variations max)
   - Create profile
   - Add 10 custom variations
   - Attempt to add 11th
   - Verify error or PRO upgrade prompt
   - Verify first 10 variations work

6. **Test PRO tier unlimited variations**
   - Set tier to PRO
   - Add 20+ custom variations
   - Verify no limit enforced
   - Test several variations in ChatGPT → all match

#### Known Limitations
- **Phase 2-4 not implemented yet:**
  - AI-suggested variations (Phase 2)
  - Variation usage stats (Phase 3)
  - Bulk variation management (Phase 4)

---

### Test 5: Image Editor & Compression (20-image-editor.test.ts)

**Runtime:** ~15 minutes
**Tests:** 8 scenarios

#### Test Scenarios

1. **Open Image Editor with large file**
   - Navigate to Settings → Background
   - Click "Upload Custom Background"
   - Select 2MB image (tests/fixtures/large-image.jpg)
   - Verify editor modal opens automatically
   - Verify image displays in canvas

2. **Pan image with mouse drag**
   - Upload image
   - Drag image with mouse
   - Verify image moves smoothly
   - Release mouse → verify position updated

3. **Zoom in/out with mouse wheel**
   - Upload image
   - Scroll mouse wheel up → verify zoom in
   - Scroll mouse wheel down → verify zoom out
   - Verify zoom level indicator updates

4. **Zoom with +/- buttons**
   - Click "+" button 3 times
   - Verify zoom level increases
   - Click "-" button 2 times
   - Verify zoom level decreases

5. **Adjust quality slider**
   - Upload 2MB image
   - Drag quality slider from 90% → 70%
   - Verify live size preview updates
   - Verify size decreases (e.g., 2MB → 400KB)
   - Verify "Compressed: 400 KB ✅" indicator shows

6. **Save compressed background**
   - Compress image to <500KB
   - Click "Save & Apply"
   - Verify modal closes
   - Verify background applied to popup
   - Verify background persists after popup reload

7. **Edit existing custom background**
   - Upload and save custom background
   - Click "Edit" button
   - Verify editor re-opens with current background
   - Make changes (zoom, crop)
   - Save → verify changes applied

8. **Delete custom background**
   - Upload and save custom background
   - Click "Delete" button
   - Verify confirmation dialog
   - Confirm deletion
   - Verify background reverts to default

#### Page Object Model Additions

```typescript
export class ImageEditorModal {
  async panImage(deltaX: number, deltaY: number): Promise<void>;
  async zoomIn(clicks: number): Promise<void>;
  async zoomOut(clicks: number): Promise<void>;
  async setQuality(percent: number): Promise<void>;
  async getCompressedSize(): Promise<number>;
  async save(): Promise<void>;
  async cancel(): Promise<void>;
}
```

---

## Phase 3: Advanced Protection Features (Week 3)

### Test 6: API Key Vault (21-api-key-vault.test.ts) ⚠️ BLOCKED

**Status:** Backend implemented, UI not ready
**Runtime:** ~18 minutes
**Tests:** 10 scenarios

#### Test Scenarios

1. **Enable API Key Vault**
   - Navigate to Settings → API Key Vault
   - Toggle "Enable API Key Vault" ON
   - Verify vault activated

2. **Add API key manually**
   - Click "Add API Key"
   - Enter name: "OpenAI Production"
   - Paste actual OpenAI key: `sk-proj-XXX...`
   - Verify format auto-detected: "OpenAI Project Key"
   - Save key

3. **Test key detection modes**
   - Add API key
   - Set mode: "Warn First" (recommended)
   - Go to ChatGPT
   - Type message with key
   - Verify warning dialog appears
   - Select "Redact & Send"
   - Verify key replaced with `[OPENAI_API_KEY]`

4. **Test auto-redact mode**
   - Set mode: "Auto-Redact"
   - Type message with key
   - Send (no warning)
   - Verify key automatically replaced

5. **Test multiple key patterns**
   - Add keys: OpenAI, GitHub, AWS, Google
   - Type message with all 4 keys
   - Send
   - Verify all 4 keys redacted with appropriate labels

6. **View detection stats**
   - Redact several keys
   - Check Stats tab
   - Verify "API Keys Protected: X" counter updated

7. **Export key vault** (PRO only)
   - Add 5 keys
   - Click "Export Vault"
   - Verify JSON file downloads
   - Verify file contains encrypted keys

8. **Import key vault** (PRO only)
   - Export vault
   - Clear vault
   - Click "Import Vault"
   - Select exported JSON
   - Verify keys restored

9. **Test FREE tier limits** (10 keys max)
   - Add 10 keys
   - Attempt to add 11th
   - Verify error or PRO upgrade prompt

10. **Delete API key**
    - Add key
    - Click delete icon
    - Verify confirmation dialog
    - Confirm → verify key removed

#### Blockers
- **UI not implemented:** Settings → API Key Vault section missing
- **Action Required:** Implement UI before writing tests

---

## Phase 4: UX & Customization (Week 4)

### Test 7: Background Customization (22-background-customization.test.ts)

**Runtime:** ~12 minutes
**Tests:** 8 scenarios

#### Test Scenarios

1. **Select FREE background**
   - Navigate to Settings → Background
   - Click "Mountains" thumbnail
   - Verify background applied instantly
   - Verify checkmark appears on thumbnail

2. **Test PRO background lock (FREE user)**
   - Click "Ocean Sunset" (PRO background)
   - Verify lock badge visible
   - Verify upgrade prompt appears
   - Verify background NOT applied

3. **Adjust transparency slider**
   - Select background
   - Drag transparency slider to 50%
   - Verify background becomes more visible
   - Drag to 100%
   - Verify background completely hidden

4. **Toggle blur effect**
   - Select background
   - Enable "Apply Blur Effect" toggle
   - Verify background blurred
   - Disable toggle
   - Verify blur removed

5. **Test theme/background sync**
   - Select "Classic Dark" theme
   - Verify background auto-switches to `default_dark`
   - Verify transparency set to 100%
   - Select "Classic Light" theme
   - Verify background auto-switches to `default_light`

6. **Upload custom background** (PRO only)
   - Set tier to PRO
   - Click "Upload Custom Background"
   - Select 300KB image (under limit)
   - Verify background applies immediately
   - Verify no editor opens (under 500KB)

7. **Upload large custom background** (PRO only)
   - Select 2MB image (over limit)
   - Verify image editor opens automatically
   - Compress to <500KB
   - Save
   - Verify background applied

8. **Test persistence**
   - Select background + transparency + blur
   - Close popup
   - Reopen popup
   - Verify all settings restored

---

### Test 8: Minimal Mode (23-minimal-mode.test.ts)

**Runtime:** ~8 minutes
**Tests:** 5 scenarios

#### Test Scenarios

1. **Toggle to minimal mode**
   - Click minimize button (⊟)
   - Verify popup shrinks
   - Verify shows: stats, activity, expand button
   - Verify full view hidden

2. **Verify minimal mode stats**
   - Enable profile
   - Send message with PII to ChatGPT
   - Open minimal mode
   - Verify stats show: "3 protected" (or actual count)

3. **Verify activity indicator**
   - Minimal mode with no activity
   - Verify shows: "No activity yet"
   - Trigger substitution
   - Verify shows: "Last protected: just now"

4. **Expand back to full mode**
   - In minimal mode, click expand button (⚙️)
   - Verify popup expands
   - Verify full UI restored
   - Verify all tabs accessible

5. **Test mode persistence**
   - Switch to minimal mode
   - Close popup
   - Reopen popup
   - Verify opens in minimal mode (preference saved)

---

### Test 9: Chrome Theme Integration (24-chrome-theme.test.ts)

**Runtime:** ~6 minutes
**Tests:** 4 scenarios

#### Test Scenarios

1. **Detect light theme**
   - Set browser to light theme
   - Open popup
   - Verify theme colors are light
   - Check CSS variables: `--primary-color`, `--bg-color`

2. **Detect dark theme**
   - Set browser to dark theme
   - Open popup
   - Verify theme colors are dark

3. **Toggle "Follow Chrome Theme" setting**
   - Enable "Follow Chrome Theme" in Settings
   - Switch browser theme
   - Verify popup theme updates automatically
   - Disable "Follow Chrome Theme"
   - Switch browser theme
   - Verify popup theme does NOT change

4. **Test with Custom Chrome Theme**
   - Install custom Chrome theme (blue accent)
   - Enable "Follow Chrome Theme"
   - Verify popup extracts dominant color
   - Verify accent color applied to buttons, headers

---

## Implementation Guidelines

### Test Structure Template

```typescript
import { ExtensionTestHarness } from '../setup/ExtensionTestHarness';
import { PopupPage } from '../setup/PageObjectModels';
import { Page } from 'puppeteer';
import { wait } from '../setup/TestHelpers';

describe('Feature: [Feature Name]', () => {
  let harness: ExtensionTestHarness;
  let chatPage: Page;
  let popupPage: Page;
  let popup: PopupPage;

  beforeAll(async () => {
    harness = new ExtensionTestHarness({
      headless: false,
      devtools: false,
      slowMo: 0,
      captureConsole: true
    });

    await harness.setup();
    chatPage = await harness.setupPlatformPage(); // Open ChatGPT first
  }, 60000);

  beforeEach(async () => {
    popupPage = await harness.openPopup(); // Fresh popup per test
    popup = new PopupPage(popupPage);
  }, 30000);

  afterEach(async () => {
    if (popupPage && !popupPage.isClosed()) {
      await popupPage.close();
    }
  });

  afterAll(async () => {
    await harness.cleanup();
  });

  test('scenario 1', async () => {
    // Test implementation
  });

  test('scenario 2', async () => {
    // Test implementation
  });
});
```

### Page Object Model Best Practices

1. **Encapsulate all selectors** - No raw selectors in tests
2. **Return promises** - All methods async
3. **Wait for elements** - Use `waitForSelector` before interactions
4. **Handle errors gracefully** - Throw meaningful error messages
5. **Reuse common patterns** - Extract helper methods

### Test Naming Conventions

- **File names:** `XX-feature-name.test.ts` (numbered for execution order)
- **Test names:** Descriptive, action-oriented (e.g., "upload multiple files and verify queue")
- **Groups:** Use `describe` blocks for logical grouping

### Assertion Patterns

```typescript
// Good - Clear, specific
expect(profileName).toBe('Test Profile');

// Better - With context
const profileName = await popup.getProfileName(0);
expect(profileName).toBe('Test Profile');
console.log(`✓ Profile name: ${profileName}`);

// Best - Full verification flow
const profile = await popup.getProfile(0);
expect(profile.name).toBe('Test Profile');
expect(profile.enabled).toBe(true);
expect(profile.realName).toBe('John Smith');
console.log(`✓ Profile verified: ${JSON.stringify(profile)}`);
```

---

## Known Issues & Blockers

### 🚨 Critical Issues

#### 1. Prompt Template Line Breaks Lost ⚠️ UNRESOLVED
- **Issue:** Templates with `\n` lose line breaks when injected into ChatGPT
- **Impact:** Multi-line templates collapse into single line
- **Root Cause:** Unknown (possibly ProseMirror normalization in ChatGPT's editor)
- **Location:** `content.ts:180` - template injection logic
- **Blocker For:** Test 18 (Prompt Templates) - Test 4 will fail
- **Action Required:** Debug injection flow, find where `\n` is stripped

#### 2. API Key Vault UI Missing 🚧 BLOCKED
- **Issue:** Settings → API Key Vault section not implemented
- **Impact:** Cannot test full user flow (add key → detect → redact)
- **Root Cause:** Feature complete in backend, UI pending
- **Blocker For:** Test 21 (API Key Vault) - All tests blocked
- **Action Required:** Implement Settings tab UI section for key management

### ⚠️ Partial Implementations

#### 3. Alias Variations - Phases 2-4 Pending
- **Status:** Phase 1 (auto-generation) complete
- **Missing:** Custom variations UI, AI suggestions, usage stats
- **Impact:** Test 19 can only cover auto-generated variations
- **Workaround:** Test Phase 1 features only, mark Phase 2-4 as TODO

### 📋 Planned Features (Not Testable Yet)

#### 4. Developer Terms Spell Check
- **Status:** Planned for v1.2.0
- **Impact:** Test 25 cannot be written until implemented
- **Priority:** Medium (nice-to-have)

#### 5. Keyboard Shortcuts
- **Status:** Planned for v1.2.0
- **Impact:** Test 26 cannot be written until implemented
- **Priority:** Low (power user feature)

#### 6. Image PII Scanner
- **Status:** Future feature (no timeline)
- **Impact:** Test 27 cannot be written until implemented
- **Priority:** Low (optional feature)

---

## Test Execution Strategy

### Parallel Execution

Run tests in parallel groups to reduce total runtime:

```bash
# Group 1: Core tests (independent)
npm run test:e2e -- core/

# Group 2: Platform tests (can run in parallel)
npm run test:e2e -- platforms/ --maxWorkers=3

# Group 3: Feature tests (some dependencies)
npm run test:e2e -- features/ --maxWorkers=2

# Group 4: Customization tests (independent)
npm run test:e2e -- customization/ --maxWorkers=2
```

### CI/CD Integration

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e-core:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run build
      - run: npm run test:e2e -- core/
      - uses: actions/upload-artifact@v2
        if: failure()
        with:
          name: screenshots-core
          path: tests/e2e-puppeteer/screenshots/

  e2e-features:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run build
      - run: npm run test:e2e -- features/
      - uses: actions/upload-artifact@v2
        if: failure()
        with:
          name: screenshots-features
          path: tests/e2e-puppeteer/screenshots/
```

### Local Development

```bash
# Run all tests (slow, ~4 hours)
npm run test:e2e

# Run single test file (fast, ~10-20 minutes)
npm run test:e2e -- features/16-quick-alias-generator.test.ts

# Run with headful mode (debugging)
npm run test:e2e -- --headless=false features/16-quick-alias-generator.test.ts

# Run with slow motion (see interactions)
npm run test:e2e -- --slowMo=100 features/16-quick-alias-generator.test.ts
```

---

## Success Metrics

### Coverage Targets

- **Feature Coverage:** 90%+ of implemented features
- **User Flow Coverage:** 100% of critical paths
- **Test Stability:** <5% flaky test rate
- **Runtime:** <4 hours total (with parallelization)

### Quality Gates

- **All tests must pass** before merging to main
- **No skipped tests** without documented reason
- **Screenshot on failure** for all test failures
- **Meaningful test names** for easy debugging

### Maintenance

- **Monthly review** of test suite (remove obsolete, add new)
- **Update on feature changes** (keep tests in sync with features)
- **Refactor as needed** (improve Page Object Models, reduce duplication)

---

## Appendix: Test Fixtures

### Required Test Files

```
tests/fixtures/
├── documents/
│   ├── sample.pdf          # 1-page PDF with PII
│   ├── multi-page.pdf      # 5-page PDF for pagination
│   ├── sample.txt          # Plain text with PII
│   ├── sample.docx         # Word document with PII
│   └── corrupted.pdf       # Invalid PDF for error testing
│
├── images/
│   ├── small-image.jpg     # 200KB (under limit)
│   ├── large-image.jpg     # 2MB (requires compression)
│   ├── screenshot-pii.png  # Contains email address (for image scanner)
│   └── profile-photo.jpg   # 100KB (for profile avatars)
│
└── test-data.json          # JSON with test profiles, templates, keys
```

### Test Data JSON Structure

```json
{
  "profiles": [
    {
      "name": "Test Profile 1",
      "realName": "John Smith",
      "aliasName": "Alex Johnson",
      "realEmail": "john.smith@example.com",
      "aliasEmail": "alex.johnson@example.com"
    }
  ],
  "templates": [
    {
      "name": "Code Review",
      "content": "Please review this code by {{name}} at {{company}}"
    }
  ],
  "apiKeys": [
    {
      "name": "Test OpenAI Key",
      "key": "sk-proj-test123456789",
      "format": "OpenAI Project Key"
    }
  ]
}
```

---

**Document Version:** 1.0
**Last Updated:** 2025-01-12
**Status:** Ready for Implementation
**Next Steps:** Begin Phase 1 implementation (Week 1 - Core Feature Tests)
