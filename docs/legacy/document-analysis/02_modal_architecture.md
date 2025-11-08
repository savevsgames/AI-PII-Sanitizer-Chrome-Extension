# Modal Architecture & UI Patterns Analysis

**Date:** November 7, 2025
**Feature:** Document Analysis
**Purpose:** Understanding existing modal system for document upload UI

---

## Executive Summary

Prompt Blocker uses a **feature-based modal system** with:
- Full-screen modals for complex interactions (Image Editor)
- Feature detail views with slide-in animation (API Key Vault, Custom Rules, Templates)
- Shared modal utilities for consistent UX
- Glassmorphism design language throughout

**Key Finding:** The Features Tab already has the perfect architecture for adding Document Analysis - we just need to add a new feature card and detail view.

---

## Features Tab Architecture

**Location:** `src/popup/components/featuresTab.ts`

### Hub → Detail Navigation Pattern

The Features Tab uses a **2-level navigation**:

```
Features Hub (Grid of Cards)
    ↓ (click feature)
Feature Detail View (Full UI for that feature)
    ↑ (back button)
Features Hub
```

**Current Features:**
1. Quick Alias Generator (FREE)
2. API Key Vault (PRO)
3. Custom Redaction Rules (PRO)
4. Prompt Templates (FREE with limits)

**Where to Add Document Analysis:**
- Add new feature card to `FEATURES` array (line 28)
- Create detail view renderer
- Add initialization handlers

---

## Feature Card Structure

```typescript
interface Feature {
  id: string;               // 'document-analysis'
  name: string;             // 'Document Analysis'
  icon: string;             // '📄' or '🔍'
  description: string;      // 'Sanitize documents before uploading...'
  tier: 'free' | 'pro';    // Start as 'pro', consider 'free' later
  status: 'active' | 'locked' | 'coming-soon';
  stats?: {
    label: string;
    value: string | number;
  }[];
}
```

**Example Feature Card:**
```typescript
{
  id: 'document-analysis',
  name: 'Document Analysis',
  icon: '📄',
  description: 'Scan and sanitize documents before uploading to AI services',
  tier: 'free',  // or 'pro' - decision needed
  status: 'active',
  stats: [
    { icon: '📁', value: 12, label: 'documents analyzed' },
    { icon: '🔒', value: 47, label: 'PII redacted' }
  ]
}
```

---

## Modal Types in Codebase

### Type 1: Full-Screen Modal (Image Editor)

**Location:** `src/popup/components/imageEditor.ts`

**Use Case:** Complex image manipulation (pan, zoom, crop)

**Structure:**
```html
<div class="image-editor-modal-fullscreen">
  <div class="image-editor-overlay">
    <!-- Close button (top right) -->
    <button class="image-editor-close-btn">✕</button>

    <!-- Main content area -->
    <div class="image-editor-canvas-container">
      <canvas id="imageEditorCanvas"></canvas>
      <!-- Floating overlays -->
    </div>

    <!-- Bottom toolbar -->
    <div class="image-editor-toolbar">
      <!-- Controls grouped by section -->
    </div>
  </div>
</div>
```

**CSS Pattern:**
```css
.image-editor-modal-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  z-index: 999999;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

**Characteristics:**
- Full viewport coverage
- Dark semi-transparent background
- Toolbar at bottom
- Close button top-right
- Floating overlays for info/guides

**Best for:** Document preview with side-by-side diff view

---

### Type 2: Feature Detail View (Slide-in Panel)

**Location:** `src/popup/components/featuresTab.ts` lines 222-274

**Use Case:** Feature-specific UI within Features Tab

**Structure:**
```html
<!-- Hub View (Grid) -->
<div id="featuresHubView">
  <div id="featuresGrid">
    <!-- Feature cards here -->
  </div>
</div>

<!-- Detail View (Slide-in) -->
<div id="featureDetailView" class="hidden">
  <button id="featureBackBtn">← Back</button>
  <h2 id="featureDetailName"></h2>
  <span id="featureDetailTier" class="tier-badge"></span>

  <!-- Dynamic content container -->
  <div id="featureDetailContent">
    <!-- Feature-specific UI rendered here -->
  </div>
</div>
```

**Animation:**
```css
#featureDetailView {
  transform: translateX(100%);
  transition: transform 0.3s ease;
}

#featureDetailView.active {
  transform: translateX(0);
}
```

**Characteristics:**
- Slides in from right
- Back button to return to hub
- Tier badge shows FREE/PRO
- Content area dynamically rendered

**Best for:** Document upload flow (file picker → analysis → options)

---

### Type 3: Inline Modal (Auth, Prompts)

**Location:** `src/popup/components/authModal.ts`, `src/popup/components/promptTemplates.ts`

**Use Case:** Quick user input or confirmation

**Structure:**
```html
<div class="modal-overlay">
  <div class="modal-content">
    <h3>Modal Title</h3>
    <div class="modal-body">
      <!-- Form fields, info, etc. -->
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary">Cancel</button>
      <button class="btn btn-primary">Confirm</button>
    </div>
  </div>
</div>
```

**Characteristics:**
- Centered on page
- Glassmorphism background
- Form-style layout
- Clear action buttons

**Best for:** Document alias naming, upload confirmation

---

## Existing Modal Utilities

**Location:** `src/popup/utils/modalUtils.ts` (inferred from usage)

**Expected utilities:**
- `showModal(content)` - Show generic modal
- `hideModal()` - Close active modal
- `createModal(options)` - Create modal element
- `showConfirm(message)` - Confirmation dialog

**For Document Analysis:**
- Use these utilities for consistency
- Don't reinvent modal system
- Follow existing patterns

---

## Design Language: Glassmorphism

### Color Palette

**From existing code (content.ts API Key Warning):**

```css
/* Background overlays */
background: rgba(0, 0, 0, 0.7);  /* Dark overlay */

/* Glass cards */
background: rgba(255, 255, 255, 0.95);
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.3);
box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);

/* Gradient headers */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);  /* Primary */
background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);  /* Warning */
background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);  /* Danger */
background: linear-gradient(135deg, #10b981 0%, #059669 100%);  /* Success */
```

### Button Styles

```css
/* Primary action */
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* Secondary action */
.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  color: #a0aec0;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Danger action */
.btn-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}
```

### Tier Badges

```css
.tier-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.tier-badge.free {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.tier-badge.pro {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
```

---

## Recommended Modal Design for Document Analysis

### Modal Flow

```
[Feature Card: Document Analysis]
    ↓ (click)
[Feature Detail View]
  ├─ Upload Button
  ├─ Recent Documents List (if any)
  └─ Settings Toggle
    ↓ (click Upload)
[File Picker Modal] (Native or Custom)
    ↓ (file selected)
[Processing Spinner]
    ↓ (parsing complete)
[Preview Modal - Full Screen]
  ├─ Split View: Original | Sanitized
  ├─ PII Detection Summary
  ├─ Document Alias UID
  └─ Actions: Copy | Auto-Paste | Cancel
```

### 1. Feature Detail View (In Features Tab)

```html
<div id="documentAnalysisContainer">
  <!-- Header -->
  <div class="tab-header">
    <h3>Document Analysis</h3>
    <button class="btn btn-primary" id="uploadDocumentBtn">
      📄 Upload Document
    </button>
  </div>

  <!-- Recent Documents (if any) -->
  <div class="documents-list" id="documentsList">
    <!-- Document cards rendered here -->
  </div>

  <!-- Empty State -->
  <div class="empty-state" id="documentsEmptyState">
    <div class="empty-state-icon">📄</div>
    <p class="empty-state-title">No documents analyzed yet</p>
    <p class="empty-state-hint">
      Upload a document to scan for PII before sending to AI services
    </p>
    <button class="btn btn-primary" id="uploadDocumentBtnEmpty">
      Upload Your First Document
    </button>
  </div>

  <!-- Settings -->
  <div class="settings-section">
    <h3>Supported Formats</h3>
    <div class="format-badges">
      <span class="format-badge">📄 PDF</span>
      <span class="format-badge">📝 TXT</span>
      <span class="format-badge">📃 DOCX</span>
      <span class="format-badge disabled">🖼️ Images (PRO)</span>
    </div>
  </div>
</div>
```

### 2. File Picker (Native Input)

```html
<input
  type="file"
  id="documentInput"
  accept=".pdf,.txt,.doc,.docx"
  style="display: none;"
  multiple  <!-- For bulk upload -->
/>
```

**Trigger:** Click "Upload Document" → Programmatically trigger file input

### 3. Processing Modal (Spinner)

```html
<div class="modal-overlay" id="processingModal">
  <div class="modal-content">
    <div class="spinner"></div>
    <h3>Analyzing Document...</h3>
    <p id="processingStatus">Parsing PDF...</p>
    <div class="progress-bar">
      <div class="progress-fill" id="progressFill"></div>
    </div>
  </div>
</div>
```

### 4. Preview Modal (Full-Screen Diff View)

```html
<div class="image-editor-modal-fullscreen" id="documentPreviewModal">
  <div class="image-editor-overlay">
    <!-- Close Button -->
    <button class="image-editor-close-btn" id="closePreview">✕</button>

    <!-- Split View Container -->
    <div class="document-preview-container">
      <!-- Left: Original -->
      <div class="document-pane">
        <h3>Original Document</h3>
        <div class="document-content" id="originalContent">
          <!-- Original text with PII highlighted -->
        </div>
      </div>

      <!-- Divider -->
      <div class="document-divider"></div>

      <!-- Right: Sanitized -->
      <div class="document-pane">
        <h3>Sanitized Document</h3>
        <div class="document-content" id="sanitizedContent">
          <!-- Sanitized text with replacements highlighted -->
        </div>
      </div>
    </div>

    <!-- Bottom Info Bar -->
    <div class="document-info-bar">
      <div class="info-section">
        <span class="info-icon">🔍</span>
        <span id="piiCount">5 PII items detected</span>
      </div>
      <div class="info-section">
        <span class="info-icon">🆔</span>
        <span id="documentAlias">doc_abc123</span>
      </div>
      <div class="info-section">
        <span class="info-icon">📝</span>
        <span id="wordCount">1,247 words</span>
      </div>
    </div>

    <!-- Bottom Action Bar -->
    <div class="image-editor-toolbar">
      <div class="toolbar-section">
        <button class="toolbar-btn toolbar-btn-secondary" id="cancelUpload">
          Cancel
        </button>
      </div>

      <div class="toolbar-section toolbar-section-right">
        <button class="toolbar-btn toolbar-btn-secondary" id="copyToClipboard">
          📋 Copy Text
        </button>
        <button class="toolbar-btn toolbar-btn-primary" id="autoPaste">
          ⚡ Auto-Paste
        </button>
      </div>
    </div>
  </div>
</div>
```

---

## CSS Patterns to Follow

### 1. Split View Layout

```css
.document-preview-container {
  display: grid;
  grid-template-columns: 1fr 2px 1fr;
  gap: 20px;
  height: calc(100vh - 200px);  /* Account for toolbars */
  padding: 20px;
  overflow: hidden;
}

.document-pane {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.document-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;  /* Preserve formatting */
}

.document-divider {
  width: 2px;
  background: linear-gradient(180deg,
    rgba(255,255,255,0.1) 0%,
    rgba(255,255,255,0.3) 50%,
    rgba(255,255,255,0.1) 100%
  );
}
```

### 2. PII Highlighting

```css
/* Original document - highlight real PII in red */
.pii-real {
  background: rgba(239, 68, 68, 0.3);
  color: #ef4444;
  padding: 2px 4px;
  border-radius: 3px;
  font-weight: 600;
}

/* Sanitized document - highlight aliases in green */
.pii-alias {
  background: rgba(16, 185, 129, 0.3);
  color: #10b981;
  padding: 2px 4px;
  border-radius: 3px;
  font-weight: 600;
}
```

### 3. Document Card (for recent documents list)

```css
.document-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.document-card:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.document-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.document-card-icon {
  font-size: 24px;
}

.document-card-title {
  font-weight: 600;
  font-size: 14px;
}

.document-card-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-secondary);
}
```

---

## Animation Patterns

### Modal Fade-In

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-overlay {
  animation: fadeIn 0.2s ease-out;
}
```

### Slide-Up

```css
@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-content {
  animation: slideUp 0.3s ease-out;
}
```

### Progress Bar Fill

```css
@keyframes progressFill {
  from { width: 0%; }
  to { width: 100%; }
}

.progress-fill {
  animation: progressFill 2s ease-in-out;
}
```

---

## Integration Points

### 1. Add to Features Array

**File:** `src/popup/components/featuresTab.ts` line 28

```typescript
{
  id: 'document-analysis',
  name: 'Document Analysis',
  icon: '📄',
  description: 'Scan and sanitize documents before uploading to AI services',
  tier: 'free',  // Decision: Start FREE, consider PRO features later
  status: 'active',
  stats: []  // Will populate with usage data
}
```

### 2. Add Feature Content Renderer

**File:** `src/popup/components/featuresTab.ts` line 291 (in `renderFeatureContent()`)

```typescript
case 'document-analysis':
  return `<div id="documentAnalysisContainer"></div>`;
```

### 3. Add Feature Handlers

**File:** `src/popup/components/featuresTab.ts` line 488 (in `initFeatureHandlers()`)

```typescript
case 'document-analysis': {
  renderDocumentAnalysis();
  initDocumentAnalysisUI();
  console.log('[Features Tab] Document Analysis handlers ready');
  break;
}
```

### 4. Create Component File

**File:** `src/popup/components/documentAnalysis.ts` (NEW)

```typescript
export function renderDocumentAnalysis() {
  // Render main UI
}

export function initDocumentAnalysisUI() {
  // Setup event listeners
}

export function openDocumentPicker() {
  // Trigger file input
}

export function showDocumentPreview(documentData) {
  // Show full-screen preview modal
}
```

---

## State Management

**Use existing Zustand store:** `src/lib/store.ts`

```typescript
// Add to AppState interface
interface AppState {
  // ...existing state...

  // Document Analysis state
  documentAliases: DocumentAlias[];
  loadDocumentAliases: () => Promise<void>;
  addDocumentAlias: (documentData) => Promise<void>;
  deleteDocumentAlias: (id: string) => Promise<void>;
}
```

**Storage pattern:**
- Document aliases stored in encrypted chrome.storage.local
- Each document alias has a UID
- Contains map of all PII found in that document
- Linked to real aliases from active profiles

---

## Next Steps

1. ✅ Modal architecture documented
2. 🔜 Create `documentAnalysis.ts` component file
3. 🔜 Design DocumentAlias type in `types.ts`
4. 🔜 Implement file picker UI
5. 🔜 Build preview modal with diff view
6. 🔜 Add document alias storage methods

---

**Status:** ✅ Analysis Complete
**Confidence:** High - Existing patterns analyzed
**Ready for Implementation:** Yes
