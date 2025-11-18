# Document Analysis Feature - Implementation Plan

**Date:** November 7, 2025
**Feature:** Document Analysis (Document Upload Sanitization)
**Priority:** HIGH (Transformational killer feature per marketing analysis)
**Status:** Ready for Implementation

---

## Executive Summary

This document provides a **complete implementation roadmap** for the Document Analysis feature - the most important feature for enterprise adoption. Based on deep codebase analysis, this plan leverages existing architecture (AliasEngine, StorageManager, Features Tab, Modal System) to deliver a production-ready feature in **2-3 weeks**.

**Feature Goals:**
1. Allow users to upload documents (PDF, TXT, DOCX, Images)
2. Scan for PII using existing AliasEngine
3. Show side-by-side preview (original ← → sanitized)
4. Provide delivery options (copy, auto-paste, re-bundle)
5. Track document aliases for future reference
6. Support all 5 AI platforms (ChatGPT, Claude, Gemini, Perplexity, Copilot)

**Enterprise Value:**
- **Prevents accidental PII leaks** in uploaded documents
- **Compliance-ready** (GDPR, HIPAA, SOC 2)
- **Audit trail** (document alias tracking)
- **Microsoft acquisition target** - this is the feature that makes Prompt Blocker enterprise-ready

---

## Implementation Phases

### Phase 1: MVP (PDF + TXT Support) - Week 1

**Goal:** Basic document upload with PDF and TXT parsing

**Deliverables:**
- ✅ Document Analysis feature card in Features Tab
- ✅ File picker UI
- ✅ PDF parsing (pdf.js)
- ✅ TXT parsing (native File API)
- ✅ PII detection via AliasEngine
- ✅ Preview modal with diff view
- ✅ Copy to clipboard functionality
- ✅ DocumentAlias storage

**Files to Create:**
1. `src/popup/components/documentAnalysis.ts` - Main component
2. `src/popup/components/documentPreviewModal.ts` - Full-screen preview
3. `src/lib/documentParsers/pdfParser.ts` - PDF.js wrapper
4. `src/lib/documentParsers/txtParser.ts` - TXT parser
5. `docs/features/document-analysis/README.md` - User documentation

**Files to Modify:**
1. `src/popup/components/featuresTab.ts` - Add feature card
2. `src/lib/types.ts` - Add DocumentAlias interface
3. `src/lib/storage.ts` - Add document storage methods
4. `src/lib/store.ts` - Add document state management
5. `src/popup/popup.html` - Add document preview modal container

**Dependencies:**
- pdf.js (~500 KB) - PDF parsing
- Install: `npm install pdfjs-dist`

---

### Phase 2: DOCX Support - Week 2

**Goal:** Add Microsoft Word document support

**Deliverables:**
- ✅ DOCX parsing (mammoth.js)
- ✅ Complex formatting handling
- ✅ Table/list extraction

**Files to Create:**
1. `src/lib/documentParsers/docxParser.ts` - Mammoth.js wrapper

**Files to Modify:**
1. `src/popup/components/documentAnalysis.ts` - Add DOCX support

**Dependencies:**
- mammoth.js (~150 KB) - DOCX parsing
- Install: `npm install mammoth`

---

### Phase 3: Auto-Paste Integration - Week 2-3

**Goal:** Auto-inject sanitized text into AI chat interfaces

**Deliverables:**
- ✅ Platform detection from current tab
- ✅ Auto-inject for ChatGPT (ProseMirror)
- ✅ Auto-inject for Claude (contenteditable)
- ✅ Auto-inject for Gemini (Quill editor)
- ✅ Auto-inject for Perplexity (textarea)
- ✅ Auto-inject for Copilot (textarea)

**Files to Create:**
1. `src/content/documentInjector.ts` - Platform-specific injection

**Files to Modify:**
1. `src/content/content.ts` - Add injection handlers
2. `src/popup/components/documentPreviewModal.ts` - Add auto-paste button

**Dependencies:** None (uses existing content script injection)

---

### Phase 4: Image OCR Support (PRO) - Week 3-4

**Goal:** Extract text from images via OCR

**Deliverables:**
- ✅ Image parsing (tesseract.js)
- ✅ OCR accuracy improvements
- ✅ Progress indication during OCR

**Files to Create:**
1. `src/lib/documentParsers/imageParser.ts` - Tesseract.js wrapper

**Files to Modify:**
1. `src/popup/components/documentAnalysis.ts` - Add image support

**Dependencies:**
- tesseract.js (~3 MB) - OCR library
- Install: `npm install tesseract.js`

---

### Phase 5: Polish & Testing - Week 4

**Goal:** Production-ready quality

**Deliverables:**
- ✅ Performance optimization
- ✅ Error handling
- ✅ Loading states
- ✅ Unit tests
- ✅ Integration tests
- ✅ User documentation

---

## Detailed Implementation Guide

### Step 1: Add DocumentAlias Type

**File:** `src/lib/types.ts`

```typescript
/**
 * Document Alias - Tracks a sanitized document
 */
export interface DocumentAlias {
  id: string;                    // "doc_1699394400000_abc123"
  documentName: string;          // "Contract_2024.pdf"
  createdAt: number;
  updatedAt: number;
  fileSize: number;              // Bytes
  fileType: string;              // MIME type
  platform?: AIService;          // Where it was used (optional)

  // PII detection results
  piiMap: Array<{
    profileId: string;           // Which profile matched
    profileName: string;         // "Greg - Work"
    piiType: PIIType;            // "name", "email", etc.
    realValue: string;           // "Greg Barker"
    aliasValue: string;          // "John Doe"
    occurrences: number;         // How many times found
    positions: number[];         // Character positions in text
  }>;

  // Text content
  originalText?: string;         // Optional: full original (encrypted)
  sanitizedText: string;         // Sanitized version (ready to use)

  // Metadata
  confidence: number;            // 0-1 from AliasEngine
  substitutionCount: number;
  profilesUsed: string[];        // Profile IDs

  // Usage tracking
  usageCount: number;
  lastUsed?: number;

  // Preview snippet (first 200 chars)
  preview: string;
}
```

**Add to UserConfig:**

```typescript
export interface UserConfig {
  // ...existing...

  // Document Analysis (NEW)
  documentAliases?: DocumentAlias[];
}
```

---

### Step 2: Add Storage Methods

**File:** `src/lib/storage.ts`

```typescript
/**
 * Load document aliases (decrypted)
 */
async loadDocumentAliases(): Promise<DocumentAlias[]> {
  const data = await chrome.storage.local.get('documentAliases');

  if (!data.documentAliases) {
    return [];
  }

  const aliases: DocumentAlias[] = [];

  for (const item of data.documentAliases) {
    try {
      const decrypted = await this.decrypt(item.encryptedData);
      aliases.push(JSON.parse(decrypted));
    } catch (error) {
      console.error('[Storage] Failed to decrypt document:', item.id);
      // Skip corrupted documents
    }
  }

  return aliases.sort((a, b) => b.createdAt - a.createdAt);  // Newest first
}

/**
 * Save document alias (encrypted)
 */
async saveDocumentAlias(documentAlias: DocumentAlias): Promise<void> {
  const encrypted = await this.encrypt(JSON.stringify(documentAlias));

  const data = await chrome.storage.local.get('documentAliases');
  const existing = data.documentAliases || [];

  existing.push({
    id: documentAlias.id,
    documentName: documentAlias.documentName,
    createdAt: documentAlias.createdAt,
    encryptedData: encrypted
  });

  // Limit to 50 documents (configurable)
  if (existing.length > 50) {
    // Remove oldest
    existing.shift();
  }

  await chrome.storage.local.set({ documentAliases: existing });
}

/**
 * Delete document alias
 */
async deleteDocumentAlias(id: string): Promise<void> {
  const data = await chrome.storage.local.get('documentAliases');
  const existing = data.documentAliases || [];

  const filtered = existing.filter(item => item.id !== id);

  await chrome.storage.local.set({ documentAliases: filtered });
}

/**
 * Update document usage stats
 */
async incrementDocumentUsage(id: string): Promise<void> {
  const aliases = await this.loadDocumentAliases();
  const document = aliases.find(d => d.id === id);

  if (document) {
    document.usageCount++;
    document.lastUsed = Date.now();
    await this.saveDocumentAlias(document);
  }
}
```

---

### Step 3: Add Feature to Features Tab

**File:** `src/popup/components/featuresTab.ts`

**3a. Add to FEATURES array (line 28):**

```typescript
{
  id: 'document-analysis',
  name: 'Document Analysis',
  icon: '📄',
  description: 'Scan and sanitize documents before uploading to AI services',
  tier: 'free',  // Decision: FREE tier (competitive advantage)
  status: 'active',
  stats: []  // Will populate from config
}
```

**3b. Add stats calculation (line 182):**

```typescript
case 'document-analysis': {
  const documentCount = config.documentAliases?.length || 0;
  const totalRedactions = config.documentAliases?.reduce(
    (sum, doc) => sum + doc.substitutionCount,
    0
  ) || 0;

  return documentCount > 0 ? [
    { icon: '📁', value: documentCount, label: documentCount === 1 ? 'document' : 'documents' },
    { icon: '🔒', value: totalRedactions, label: 'redactions' }
  ] : [];
}
```

**3c. Add content renderer (line 291):**

```typescript
case 'document-analysis':
  return '<div id="documentAnalysisContainer"></div>';
```

**3d. Add handler initialization (line 488):**

```typescript
case 'document-analysis': {
  const docState = useAppStore.getState();
  if (docState.config) {
    renderDocumentAnalysis(docState.config);
  }
  initDocumentAnalysisUI();
  console.log('[Features Tab] Document Analysis handlers ready');
  break;
}
```

---

### Step 4: Create Document Analysis Component

**File:** `src/popup/components/documentAnalysis.ts` (NEW)

```typescript
import { UserConfig, DocumentAlias } from '../../lib/types';
import { useAppStore } from '../../lib/store';
import { openDocumentPreviewModal } from './documentPreviewModal';
import { parsePDF } from '../../lib/documentParsers/pdfParser';
import { parseTXT } from '../../lib/documentParsers/txtParser';
import { AliasEngine } from '../../lib/aliasEngine';

/**
 * Render document analysis UI
 */
export function renderDocumentAnalysis(config: UserConfig) {
  const container = document.getElementById('documentAnalysisContainer');
  if (!container) return;

  const documentAliases = config.documentAliases || [];

  container.innerHTML = `
    <!-- Header -->
    <div class="tab-header">
      <h3>Document Analysis</h3>
      <button class="btn btn-primary" id="uploadDocumentBtn">
        📄 Upload Document
      </button>
    </div>

    <!-- Recent Documents List -->
    ${documentAliases.length > 0 ? `
      <div class="documents-list" id="documentsList">
        ${documentAliases.map(doc => renderDocumentCard(doc)).join('')}
      </div>
    ` : `
      <!-- Empty State -->
      <div class="empty-state">
        <div class="empty-state-icon">📄</div>
        <p class="empty-state-title">No documents analyzed yet</p>
        <p class="empty-state-hint">
          Upload a document to scan for PII before sending to AI services
        </p>
        <button class="btn btn-primary" id="uploadDocumentBtnEmpty">
          Upload Your First Document
        </button>
      </div>
    `}

    <!-- Supported Formats -->
    <div class="settings-section">
      <h3>Supported Formats</h3>
      <div class="format-badges">
        <span class="format-badge">📄 PDF</span>
        <span class="format-badge">📝 TXT</span>
        <span class="format-badge">📃 DOCX</span>
        <span class="format-badge format-badge-pro">🖼️ Images (PRO)</span>
      </div>
    </div>

    <!-- Hidden File Input -->
    <input
      type="file"
      id="documentFileInput"
      accept=".pdf,.txt,.doc,.docx"
      style="display: none;"
    />
  `;
}

/**
 * Render document card
 */
function renderDocumentCard(doc: DocumentAlias): string {
  const formattedDate = new Date(doc.createdAt).toLocaleDateString();
  const formattedSize = formatFileSize(doc.fileSize);

  return `
    <div class="document-card" data-document-id="${doc.id}">
      <div class="document-card-header">
        <span class="document-card-icon">${getFileIcon(doc.fileType)}</span>
        <div class="document-card-info">
          <h4 class="document-card-title">${doc.documentName}</h4>
          <div class="document-card-meta">
            <span>📅 ${formattedDate}</span>
            <span>📏 ${formattedSize}</span>
            <span>🔒 ${doc.substitutionCount} PII items</span>
          </div>
        </div>
      </div>
      <div class="document-card-preview">
        ${doc.preview}...
      </div>
      <div class="document-card-actions">
        <button class="btn btn-sm btn-secondary" onclick="viewDocument('${doc.id}')">
          👁️ View
        </button>
        <button class="btn btn-sm btn-primary" onclick="copyDocument('${doc.id}')">
          📋 Copy
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteDocument('${doc.id}')">
          🗑️ Delete
        </button>
      </div>
    </div>
  `;
}

/**
 * Initialize event handlers
 */
export function initDocumentAnalysisUI() {
  const uploadBtn = document.getElementById('uploadDocumentBtn');
  const uploadBtnEmpty = document.getElementById('uploadDocumentBtnEmpty');
  const fileInput = document.getElementById('documentFileInput') as HTMLInputElement;

  // Upload button handlers
  if (uploadBtn) {
    uploadBtn.addEventListener('click', () => fileInput?.click());
  }
  if (uploadBtnEmpty) {
    uploadBtnEmpty.addEventListener('click', () => fileInput?.click());
  }

  // File input handler
  if (fileInput) {
    fileInput.addEventListener('change', handleFileSelection);
  }

  console.log('[Document Analysis] UI initialized');
}

/**
 * Handle file selection
 */
async function handleFileSelection(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  console.log('[Document Analysis] File selected:', file.name, file.type, file.size);

  // Show processing modal
  showProcessingModal('Parsing document...');

  try {
    // Parse document
    const text = await parseDocument(file);

    // Detect PII
    updateProcessingStatus('Detecting PII...');
    const engine = await AliasEngine.getInstance();
    const detectionResult = engine.substitute(text, 'encode', { mode: 'detect-only' });

    if (detectionResult.substitutions.length === 0) {
      // No PII found
      hideProcessingModal();
      alert('No PII detected in this document. Upload as-is.');
      return;
    }

    // Generate sanitized version
    updateProcessingStatus('Sanitizing document...');
    const sanitizedResult = engine.substitute(text, 'encode');

    // Create document alias
    const documentAlias: DocumentAlias = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      documentName: file.name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      fileSize: file.size,
      fileType: file.type,
      piiMap: buildPIIMap(sanitizedResult),
      originalText: text,  // Optional: store for re-analysis
      sanitizedText: sanitizedResult.text,
      confidence: sanitizedResult.confidence,
      substitutionCount: sanitizedResult.substitutions.length,
      profilesUsed: sanitizedResult.profilesMatched?.map(p => p.profileId) || [],
      usageCount: 0,
      preview: sanitizedResult.text.substring(0, 200)
    };

    // Save document alias
    updateProcessingStatus('Saving...');
    const store = useAppStore.getState();
    await store.addDocumentAlias(documentAlias);

    // Hide processing modal
    hideProcessingModal();

    // Show preview modal
    openDocumentPreviewModal(documentAlias, text, sanitizedResult.text);

  } catch (error) {
    console.error('[Document Analysis] Processing error:', error);
    hideProcessingModal();
    alert(`Failed to process document: ${error.message}`);
  }

  // Reset file input
  input.value = '';
}

/**
 * Parse document based on file type
 */
async function parseDocument(file: File): Promise<string> {
  if (file.type === 'application/pdf') {
    return await parsePDF(file);
  } else if (file.type === 'text/plain') {
    return await parseTXT(file);
  } else if (file.type.includes('word') || file.name.endsWith('.docx')) {
    // Future: return await parseDOCX(file);
    throw new Error('DOCX support coming soon');
  } else {
    throw new Error(`Unsupported file type: ${file.type}`);
  }
}

/**
 * Build PII map from substitution result
 */
function buildPIIMap(result: SubstitutionResult): DocumentAlias['piiMap'] {
  const piiMap: DocumentAlias['piiMap'] = [];

  // Group substitutions by profile + PII type
  const grouped = new Map<string, {
    profileId: string;
    profileName: string;
    piiType: string;
    realValue: string;
    aliasValue: string;
    positions: number[];
  }>();

  for (const sub of result.substitutions) {
    const key = `${sub.profileId}_${sub.piiType}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        profileId: sub.profileId!,
        profileName: result.profilesMatched?.find(p => p.profileId === sub.profileId)?.profileName || '',
        piiType: sub.piiType!,
        realValue: sub.from,
        aliasValue: sub.to,
        positions: [sub.position]
      });
    } else {
      grouped.get(key)!.positions.push(sub.position);
    }
  }

  // Convert to array
  for (const item of grouped.values()) {
    piiMap.push({
      ...item,
      occurrences: item.positions.length
    });
  }

  return piiMap;
}

/**
 * Helper functions
 */
function getFileIcon(mimeType: string): string {
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word')) return '📃';
  if (mimeType.includes('text')) return '📝';
  if (mimeType.includes('image')) return '🖼️';
  return '📁';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Export global functions for onclick handlers
(window as any).viewDocument = async (id: string) => {
  const store = useAppStore.getState();
  const doc = store.config?.documentAliases?.find(d => d.id === id);
  if (doc) {
    openDocumentPreviewModal(doc, doc.originalText || '', doc.sanitizedText);
  }
};

(window as any).copyDocument = async (id: string) => {
  const store = useAppStore.getState();
  const doc = store.config?.documentAliases?.find(d => d.id === id);
  if (doc) {
    await navigator.clipboard.writeText(doc.sanitizedText);
    await store.incrementDocumentUsage(id);
    alert('Sanitized text copied to clipboard!');
  }
};

(window as any).deleteDocument = async (id: string) => {
  if (confirm('Delete this document alias?')) {
    const store = useAppStore.getState();
    await store.deleteDocumentAlias(id);
    // Refresh UI
    const config = await store.loadConfig();
    renderDocumentAnalysis(config!);
  }
};

// Processing modal helpers
function showProcessingModal(message: string) {
  // Implementation in modalUtils.ts
}

function updateProcessingStatus(message: string) {
  // Implementation in modalUtils.ts
}

function hideProcessingModal() {
  // Implementation in modalUtils.ts
}
```

---

### Step 5: Create PDF Parser

**File:** `src/lib/documentParsers/pdfParser.ts` (NEW)

```typescript
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('pdf.worker.min.js');

/**
 * Parse PDF file and extract text
 */
export async function parsePDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  console.log(`[PDF Parser] Loaded PDF: ${pdf.numPages} pages`);

  const textPages: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Extract text items
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');

    textPages.push(pageText);

    console.log(`[PDF Parser] Page ${pageNum}: ${pageText.length} chars`);
  }

  return textPages.join('\n\n');
}
```

**Dependencies Setup:**

```bash
npm install pdfjs-dist
```

**Copy Worker File:** (in build process)

```javascript
// In webpack.config.js or vite.config.js
{
  entry: {
    'pdf.worker': 'pdfjs-dist/build/pdf.worker.entry'
  }
}
```

---

### Step 6: Create TXT Parser

**File:** `src/lib/documentParsers/txtParser.ts` (NEW)

```typescript
/**
 * Parse TXT file (simple text extraction)
 */
export async function parseTXT(file: File): Promise<string> {
  const text = await file.text();
  console.log(`[TXT Parser] Loaded TXT: ${text.length} chars`);
  return text;
}
```

---

### Step 7: Create Preview Modal

**File:** `src/popup/components/documentPreviewModal.ts` (NEW)

```typescript
import { DocumentAlias } from '../../lib/types';
import { useAppStore } from '../../lib/store';

/**
 * Open document preview modal (full-screen split view)
 */
export function openDocumentPreviewModal(
  documentAlias: DocumentAlias,
  originalText: string,
  sanitizedText: string
) {
  // Create modal if doesn't exist
  if (!document.getElementById('documentPreviewModal')) {
    createDocumentPreviewModal();
  }

  // Populate content
  populatePreviewModal(documentAlias, originalText, sanitizedText);

  // Show modal
  const modal = document.getElementById('documentPreviewModal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

/**
 * Create modal DOM
 */
function createDocumentPreviewModal() {
  const modal = document.createElement('div');
  modal.id = 'documentPreviewModal';
  modal.className = 'image-editor-modal-fullscreen';  // Reuse existing modal styles

  modal.innerHTML = `
    <div class="image-editor-overlay">
      <!-- Close Button -->
      <button class="image-editor-close-btn" id="closeDocumentPreview">✕</button>

      <!-- Split View Container -->
      <div class="document-preview-container">
        <!-- Left: Original -->
        <div class="document-pane">
          <h3>Original Document</h3>
          <div class="document-content" id="originalDocumentContent"></div>
        </div>

        <!-- Divider -->
        <div class="document-divider"></div>

        <!-- Right: Sanitized -->
        <div class="document-pane">
          <h3>Sanitized Document</h3>
          <div class="document-content" id="sanitizedDocumentContent"></div>
        </div>
      </div>

      <!-- Bottom Info Bar -->
      <div class="document-info-bar">
        <div class="info-section">
          <span class="info-icon">🔍</span>
          <span id="piiCountDisplay">0 PII items</span>
        </div>
        <div class="info-section">
          <span class="info-icon">🆔</span>
          <span id="documentIdDisplay">doc_...</span>
        </div>
        <div class="info-section">
          <span class="info-icon">📝</span>
          <span id="wordCountDisplay">0 words</span>
        </div>
      </div>

      <!-- Bottom Action Bar -->
      <div class="image-editor-toolbar">
        <div class="toolbar-section">
          <button class="toolbar-btn toolbar-btn-secondary" id="cancelDocumentPreview">
            Cancel
          </button>
        </div>

        <div class="toolbar-section toolbar-section-right">
          <button class="toolbar-btn toolbar-btn-secondary" id="copyDocumentText">
            📋 Copy Text
          </button>
          <button class="toolbar-btn toolbar-btn-primary" id="autoPasteDocument">
            ⚡ Auto-Paste
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Setup event listeners
  setupPreviewModalListeners();
}

/**
 * Populate modal with document data
 */
function populatePreviewModal(
  documentAlias: DocumentAlias,
  originalText: string,
  sanitizedText: string
) {
  // Highlight PII in original
  const highlightedOriginal = highlightPII(originalText, documentAlias.piiMap, 'original');
  const originalContent = document.getElementById('originalDocumentContent');
  if (originalContent) {
    originalContent.innerHTML = highlightedOriginal;
  }

  // Highlight aliases in sanitized
  const highlightedSanitized = highlightPII(sanitizedText, documentAlias.piiMap, 'sanitized');
  const sanitizedContent = document.getElementById('sanitizedDocumentContent');
  if (sanitizedContent) {
    sanitizedContent.innerHTML = highlightedSanitized;
  }

  // Update info bar
  const piiCount = document.getElementById('piiCountDisplay');
  if (piiCount) {
    const count = documentAlias.substitutionCount;
    piiCount.textContent = `${count} PII ${count === 1 ? 'item' : 'items'} detected`;
  }

  const docId = document.getElementById('documentIdDisplay');
  if (docId) {
    docId.textContent = documentAlias.id;
  }

  const wordCount = document.getElementById('wordCountDisplay');
  if (wordCount) {
    const words = sanitizedText.split(/\s+/).length;
    wordCount.textContent = `${words.toLocaleString()} words`;
  }

  // Store current document for action handlers
  (window as any).__currentDocumentAlias = documentAlias;
}

/**
 * Highlight PII in text
 */
function highlightPII(
  text: string,
  piiMap: DocumentAlias['piiMap'],
  mode: 'original' | 'sanitized'
): string {
  let highlighted = escapeHTML(text);

  // Sort by position (reverse) to prevent index shifting
  const sorted = [...piiMap]
    .flatMap(item => item.positions.map(pos => ({ ...item, pos })))
    .sort((a, b) => b.pos - a.pos);

  for (const item of sorted) {
    const value = mode === 'original' ? item.realValue : item.aliasValue;
    const className = mode === 'original' ? 'pii-real' : 'pii-alias';

    const start = item.pos;
    const end = start + value.length;

    highlighted =
      highlighted.substring(0, start) +
      `<span class="${className}" title="${item.piiType}">${escapeHTML(value)}</span>` +
      highlighted.substring(end);
  }

  return highlighted;
}

/**
 * Setup event listeners
 */
function setupPreviewModalListeners() {
  const closeBtn = document.getElementById('closeDocumentPreview');
  const cancelBtn = document.getElementById('cancelDocumentPreview');
  const copyBtn = document.getElementById('copyDocumentText');
  const autoPasteBtn = document.getElementById('autoPasteDocument');

  if (closeBtn) closeBtn.onclick = closeDocumentPreviewModal;
  if (cancelBtn) cancelBtn.onclick = closeDocumentPreviewModal;
  if (copyBtn) copyBtn.onclick = handleCopyDocument;
  if (autoPasteBtn) autoPasteBtn.onclick = handleAutoPaste;
}

/**
 * Close modal
 */
function closeDocumentPreviewModal() {
  const modal = document.getElementById('documentPreviewModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

/**
 * Handle copy to clipboard
 */
async function handleCopyDocument() {
  const doc = (window as any).__currentDocumentAlias as DocumentAlias;
  if (!doc) return;

  try {
    await navigator.clipboard.writeText(doc.sanitizedText);
    const store = useAppStore.getState();
    await store.incrementDocumentUsage(doc.id);
    alert('✅ Sanitized text copied to clipboard!');
  } catch (error) {
    alert('❌ Failed to copy to clipboard');
  }
}

/**
 * Handle auto-paste (Future implementation)
 */
async function handleAutoPaste() {
  alert('Auto-paste coming soon! Use "Copy Text" for now.');
  // TODO: Implement auto-paste in Phase 3
}

/**
 * Helper: Escape HTML
 */
function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

---

## CSS Additions

**File:** `src/popup/popup.css`

```css
/* Document Preview Modal */
.document-preview-container {
  display: grid;
  grid-template-columns: 1fr 2px 1fr;
  gap: 20px;
  height: calc(100vh - 200px);
  padding: 20px;
  overflow: hidden;
}

.document-pane {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.document-pane h3 {
  margin: 0 0 16px 0;
  color: var(--text-primary);
  font-size: 18px;
}

.document-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.8;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.document-divider {
  width: 2px;
  background: linear-gradient(180deg,
    rgba(255,255,255,0.1) 0%,
    rgba(255,255,255,0.3) 50%,
    rgba(255,255,255,0.1) 100%
  );
}

/* PII Highlighting */
.pii-real {
  background: rgba(239, 68, 68, 0.3);
  color: #ef4444;
  padding: 2px 4px;
  border-radius: 3px;
  font-weight: 600;
  cursor: help;
}

.pii-alias {
  background: rgba(16, 185, 129, 0.3);
  color: #10b981;
  padding: 2px 4px;
  border-radius: 3px;
  font-weight: 600;
  cursor: help;
}

/* Document Info Bar */
.document-info-bar {
  display: flex;
  justify-content: center;
  gap: 32px;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.info-section {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary);
}

.info-icon {
  font-size: 16px;
}

/* Document Cards */
.documents-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 20px 0;
}

.document-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 16px;
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
  margin-bottom: 12px;
}

.document-card-icon {
  font-size: 32px;
}

.document-card-info {
  flex: 1;
}

.document-card-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.document-card-meta {
  display: flex;
  gap: 16px;
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.document-card-preview {
  margin: 12px 0;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  font-size: 12px;
  color: var(--text-secondary);
  font-family: 'Courier New', monospace;
  line-height: 1.4;
  white-space: pre-wrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-height: 60px;
}

.document-card-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

/* Format Badges */
.format-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.format-badge {
  padding: 8px 12px;
  background: rgba(102, 126, 234, 0.2);
  color: #667eea;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
}

.format-badge-pro {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2));
  color: #764ba2;
}
```

---

## Testing Plan

### Unit Tests

**File:** `tests/documentAnalysis.test.ts`

1. **PDF Parsing:**
   - ✅ Parse simple PDF (1 page)
   - ✅ Parse multi-page PDF (10 pages)
   - ✅ Handle corrupted PDF (error handling)

2. **TXT Parsing:**
   - ✅ Parse UTF-8 text file
   - ✅ Parse large text file (1 MB+)

3. **PII Detection:**
   - ✅ Detect single PII type (name only)
   - ✅ Detect multiple PII types (name, email, phone)
   - ✅ Detect PII across multiple profiles
   - ✅ No false positives

4. **Document Alias:**
   - ✅ Create document alias
   - ✅ Save/load encrypted
   - ✅ Delete document alias
   - ✅ Increment usage count

### Integration Tests

1. **End-to-End Flow:**
   - ✅ Upload PDF → Detect PII → Show Preview → Copy → Verify clipboard

2. **Cross-Platform:**
   - ✅ Test on Chrome, Edge, Brave

3. **Performance:**
   - ✅ 10-page PDF parsing < 5 seconds
   - ✅ 100 KB text file parsing < 1 second
   - ✅ PII detection in 10,000 word document < 2 seconds

### User Acceptance Testing

1. **Usability:**
   - ✅ User can upload document easily
   - ✅ Preview is clear and informative
   - ✅ Copy works reliably

2. **Edge Cases:**
   - ✅ Very large document (10 MB PDF)
   - ✅ Document with no PII
   - ✅ Document with 100+ PII items

---

## Deployment Checklist

- [ ] PDF.js worker bundled correctly
- [ ] Document aliases encrypted with Firebase UID
- [ ] Storage limit enforcement (max 50 documents)
- [ ] Error handling for all file types
- [ ] Loading states for all async operations
- [ ] User documentation updated
- [ ] CHANGELOG.md updated
- [ ] Feature announced in release notes

---

## Success Metrics

**Week 1 (MVP):**
- ✅ 30%+ of active users try document upload
- ✅ 10%+ of users upload > 3 documents
- ✅ <1% error rate on PDF parsing

**Week 4 (Full Feature):**
- ✅ 50%+ of PRO users use document analysis
- ✅ 5%+ conversion rate (Free → PRO) for document feature
- ✅ User satisfaction: 4.5+ stars

---

## Next Steps

1. ✅ Deep dive analysis complete (all docs created)
2. 🔜 Present plan to user for approval
3. 🔜 Begin Phase 1 implementation (PDF + TXT)
4. 🔜 Create feature branch: `feature/document-analysis`
5. 🔜 Install dependencies (pdf.js)
6. 🔜 Create component files
7. 🔜 Build and test MVP

---

**Status:** ✅ Implementation Plan Complete
**Confidence:** Very High - Leveraging proven architecture
**Ready to Code:** YES

**Estimated Timeline:** 2-3 weeks to production-ready feature
