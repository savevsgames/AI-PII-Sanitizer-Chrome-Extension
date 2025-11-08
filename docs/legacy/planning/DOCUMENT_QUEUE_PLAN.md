# Document Upload Queue System - Implementation Plan

## Current Implementation Analysis

### What Exists Now (documentAnalysis.ts)

**UI Components:**
- Upload dropzone with drag & drop
- File input (hidden)
- Processing status modal
- Storage quota display
- Document list (shows previously saved documents)

**Current Flow:**
1. User drops/selects file → `handleFileUpload(file)` immediately triggered
2. Immediately parse document → `parseDocument(file)`
3. Immediately sanitize → `sanitizeText(extractedText, enabledProfiles)`
4. Immediately open preview window → `openPreviewWindow()`

**Event Listeners (setupEventListeners):**
- Line 211: File input change → `handleFileUpload(files[0])`
- Line 219: Dropzone click → Open file picker
- Line 229: Dragover → Add visual feedback
- Line 238: Dragleave → Remove visual feedback
- Line 246: Drop → `handleFileUpload(e.dataTransfer.files[0])`
- Line 257: Document card actions (view/download/delete saved docs)

**Key Functions:**
- `handleFileUpload(file)` - Lines 274-328 - Parses + sanitizes + opens preview immediately
- `sanitizeText()` - Line 333 - Processes text with enabled profiles
- `openPreviewWindow()` - Line 418 - Opens diff checker in new tab
- `showProcessingStatus()` / `hideProcessingStatus()` - Show/hide loading modal

---

## Proposed New System

### Goals
1. ✅ Allow multiple file uploads to queue before processing
2. ✅ Display list of queued files with metadata (name, size, type, status)
3. ✅ User selects which file(s) to analyze
4. ✅ Process one file at a time with existing diff checker workflow
5. ✅ Show status for each file (pending, processing, completed, error)
6. 🚀 **Future:** Batch process multiple docs and send all to chat together

---

## UI Changes Required

### 1. Upload Queue Section (NEW)
**Location:** Between upload dropzone and saved documents list

**Structure:**
```html
<div class="doc-upload-queue" id="docUploadQueue">
  <div class="queue-header">
    <h3>Upload Queue (<span id="queueCount">0</span>)</h3>
    <button class="btn btn-secondary btn-sm" id="clearQueueBtn">Clear All</button>
  </div>

  <div class="queue-list" id="queueList">
    <!-- Queue items inserted here -->
  </div>

  <div class="queue-actions" id="queueActions">
    <button class="btn btn-primary" id="analyzeSelectedBtn" disabled>
      Analyze Selected
    </button>
  </div>
</div>
```

**Queue Item Structure:**
```html
<div class="queue-item" data-file-id="{uniqueId}">
  <div class="queue-item-checkbox">
    <input type="checkbox" id="file_{id}" />
  </div>

  <div class="queue-item-icon">
    {PDF or TXT icon}
  </div>

  <div class="queue-item-info">
    <div class="queue-item-name">{filename}</div>
    <div class="queue-item-meta">{fileSize} • {fileType}</div>
  </div>

  <div class="queue-item-status">
    <span class="status-badge status-{pending|processing|completed|error}">
      {status}
    </span>
  </div>

  <div class="queue-item-actions">
    <button class="btn-icon" data-action="remove" title="Remove">×</button>
  </div>
</div>
```

### 2. Modified Upload Dropzone
**Change:** Update text to indicate queuing behavior
```html
<p><strong>Drop files here</strong> to add to queue</p>
<span class="doc-upload-formats">Add multiple files • PDF, TXT</span>
```

---

## Data Structure

### QueuedFile Interface (NEW)
```typescript
interface QueuedFile {
  id: string;                    // Unique identifier (timestamp + random)
  file: File;                    // Original File object
  fileName: string;              // Display name
  fileSize: number;              // Size in bytes
  fileType: string;              // MIME type
  status: 'pending' | 'processing' | 'completed' | 'error';
  errorMessage?: string;         // If status is error
  extractedText?: string;        // Cached after parsing (if completed)
  sanitizedText?: string;        // Cached after sanitizing (if completed)
  documentAlias?: Omit<DocumentAlias, 'id' | 'createdAt' | 'updatedAt'>; // Result
}
```

### Module State (NEW)
```typescript
// At top of documentAnalysis.ts
let uploadQueue: QueuedFile[] = [];
let isProcessing = false; // Prevent concurrent processing
```

---

## Function Changes

### 1. handleFileUpload() → addFilesToQueue()
**Old behavior:** Immediately parse and open preview
**New behavior:** Add to queue and render list

```typescript
async function addFilesToQueue(files: FileList | File[]) {
  const fileArray = Array.from(files);

  fileArray.forEach(file => {
    // Validate file type
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'txt'].includes(ext || '')) {
      showError('Invalid file type', `${file.name} is not supported`);
      return;
    }

    // Create queue entry
    const queuedFile: QueuedFile = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      file: file,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      status: 'pending'
    };

    uploadQueue.push(queuedFile);
  });

  renderUploadQueue();
}
```

### 2. renderUploadQueue() (NEW)
Renders the queue UI with all files and their statuses

```typescript
function renderUploadQueue() {
  const queueContainer = document.getElementById('queueList');
  const queueCountEl = document.getElementById('queueCount');
  const analyzeBtn = document.getElementById('analyzeSelectedBtn');

  if (!queueContainer) return;

  // Update count
  if (queueCountEl) queueCountEl.textContent = `${uploadQueue.length}`;

  // Show/hide queue section
  const queueSection = document.getElementById('docUploadQueue');
  if (queueSection) {
    queueSection.style.display = uploadQueue.length > 0 ? 'block' : 'none';
  }

  // Render items
  queueContainer.innerHTML = uploadQueue.map(renderQueueItem).join('');

  // Enable/disable analyze button
  const selectedCount = getSelectedFiles().length;
  if (analyzeBtn) {
    (analyzeBtn as HTMLButtonElement).disabled = selectedCount === 0 || isProcessing;
  }
}
```

### 3. renderQueueItem() (NEW)
Renders individual queue item HTML

```typescript
function renderQueueItem(queuedFile: QueuedFile): string {
  const icon = queuedFile.fileType.includes('pdf') ?
    '<svg>...PDF icon...</svg>' :
    '<svg>...TXT icon...</svg>';

  const statusClass = `status-${queuedFile.status}`;
  const statusText = queuedFile.status.charAt(0).toUpperCase() + queuedFile.status.slice(1);

  return `
    <div class="queue-item" data-file-id="${queuedFile.id}">
      <div class="queue-item-checkbox">
        <input
          type="checkbox"
          id="file_${queuedFile.id}"
          ${queuedFile.status === 'completed' ? 'checked disabled' : ''}
        />
      </div>
      <div class="queue-item-icon">${icon}</div>
      <div class="queue-item-info">
        <div class="queue-item-name">${escapeHtml(queuedFile.fileName)}</div>
        <div class="queue-item-meta">${formatFileSize(queuedFile.fileSize)} • ${queuedFile.fileType}</div>
      </div>
      <div class="queue-item-status">
        <span class="status-badge ${statusClass}">${statusText}</span>
      </div>
      <div class="queue-item-actions">
        <button class="btn-icon" data-action="remove" data-file-id="${queuedFile.id}">×</button>
      </div>
    </div>
  `;
}
```

### 4. analyzeSelectedFiles() (NEW)
Process the selected files one at a time

```typescript
async function analyzeSelectedFiles() {
  if (isProcessing) return;

  const selectedFiles = getSelectedFiles();
  if (selectedFiles.length === 0) return;

  // For now: Process first selected file only
  // Future: Process all selected files in sequence
  const fileToProcess = selectedFiles[0];

  isProcessing = true;
  await processQueuedFile(fileToProcess);
  isProcessing = false;
}
```

### 5. processQueuedFile() (NEW)
Process a single queued file (replaces old handleFileUpload logic)

```typescript
async function processQueuedFile(queuedFile: QueuedFile) {
  console.log('[Document Analysis] Processing file:', queuedFile.fileName);

  // Update status
  queuedFile.status = 'processing';
  renderUploadQueue();

  showProcessingStatus('Parsing document...', `Reading ${queuedFile.fileName}`);

  try {
    // Parse document
    const extractedText = await parseDocument(queuedFile.file);
    queuedFile.extractedText = extractedText;

    updateProcessingStatus('Sanitizing PII...', 'Applying alias profiles');

    // Sanitize
    const state = useAppStore.getState();
    const enabledProfiles = state.profiles.filter(p => p.enabled);

    if (enabledProfiles.length === 0) {
      throw new Error('No enabled profiles. Please enable at least one profile.');
    }

    const result = sanitizeText(extractedText, enabledProfiles);
    queuedFile.sanitizedText = result.sanitizedText;

    // Create document alias
    const documentData: Omit<DocumentAlias, 'id' | 'createdAt' | 'updatedAt'> = {
      documentName: queuedFile.fileName,
      fileSize: queuedFile.fileSize,
      fileType: queuedFile.fileType,
      piiMap: result.piiMap,
      originalText: extractedText,
      sanitizedText: result.sanitizedText,
      confidence: result.confidence,
      substitutionCount: result.substitutionCount,
      profilesUsed: result.profilesUsed,
      usageCount: 0,
      preview: result.sanitizedText.substring(0, 150).trim() + '...',
    };

    queuedFile.documentAlias = documentData;
    queuedFile.status = 'completed';

    hideProcessingStatus();
    renderUploadQueue();

    // Open preview window
    updateProcessingStatus('Opening preview...', 'Preparing document comparison');
    openPreviewWindow({
      documentAlias: documentData,
      originalText: extractedText,
      sanitizedText: result.sanitizedText,
    });

  } catch (error: any) {
    console.error('[Document Analysis] Processing error:', error);
    queuedFile.status = 'error';
    queuedFile.errorMessage = error.message || 'Unknown error';
    hideProcessingStatus();
    renderUploadQueue();
    showError('Processing failed', error.message || 'Unknown error');
  }
}
```

### 6. Helper Functions (NEW)

```typescript
function getSelectedFiles(): QueuedFile[] {
  return uploadQueue.filter(qf => {
    const checkbox = document.getElementById(`file_${qf.id}`) as HTMLInputElement;
    return checkbox?.checked && qf.status === 'pending';
  });
}

function removeFileFromQueue(fileId: string) {
  uploadQueue = uploadQueue.filter(qf => qf.id !== fileId);
  renderUploadQueue();
}

function clearQueue() {
  uploadQueue = [];
  renderUploadQueue();
}
```

---

## Event Listener Updates

### Modified Listeners
```typescript
// CHANGE: Drop handler - add to queue instead of immediate processing
document.addEventListener('drop', (e) => {
  const target = e.target as HTMLElement;
  const dropzone = target.closest('#docUploadDropzone');
  if (dropzone && e.dataTransfer?.files) {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    addFilesToQueue(e.dataTransfer.files); // CHANGED
  }
});

// CHANGE: File input - add to queue instead of immediate processing
document.addEventListener('change', (e) => {
  const target = e.target as HTMLInputElement;
  if (target.id === 'docFileInput' && target.files) {
    addFilesToQueue(target.files); // CHANGED
  }
});
```

### New Listeners
```typescript
// NEW: Checkbox changes - enable/disable analyze button
document.addEventListener('change', (e) => {
  const target = e.target as HTMLInputElement;
  if (target.type === 'checkbox' && target.id.startsWith('file_')) {
    renderUploadQueue(); // Re-render to update button state
  }
});

// NEW: Analyze selected button
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target.id === 'analyzeSelectedBtn' || target.closest('#analyzeSelectedBtn')) {
    analyzeSelectedFiles();
  }
});

// NEW: Remove file from queue
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const removeBtn = target.closest('[data-action="remove"]') as HTMLElement;
  if (removeBtn) {
    const fileId = removeBtn.getAttribute('data-file-id');
    if (fileId) {
      removeFileFromQueue(fileId);
    }
  }
});

// NEW: Clear all queue
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target.id === 'clearQueueBtn' || target.closest('#clearQueueBtn')) {
    if (confirm('Clear all files from queue?')) {
      clearQueue();
    }
  }
});
```

---

## CSS Requirements (document-analysis.css)

### New Classes Needed
```css
/* Upload Queue */
.doc-upload-queue {
  margin-top: var(--space-2xl);
  display: none; /* Hidden when empty */
}

.queue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
}

.queue-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.queue-item {
  display: grid;
  grid-template-columns: 40px 40px 1fr auto 40px;
  gap: var(--space-md);
  align-items: center;
  padding: var(--space-md);
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  transition: var(--transition-base);
}

.queue-item:hover {
  background: var(--card-bg-medium);
}

.queue-item-checkbox input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.queue-item-icon svg {
  width: 32px;
  height: 32px;
  color: var(--color-primary);
}

.queue-item-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.queue-item-name {
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.queue-item-meta {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.queue-item-status .status-badge {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  text-transform: uppercase;
}

.status-pending {
  background: var(--color-info-light);
  color: var(--color-info);
}

.status-processing {
  background: var(--color-warning-light);
  color: var(--color-warning);
}

.status-completed {
  background: var(--color-success-light);
  color: var(--color-success);
}

.status-error {
  background: var(--color-danger-light);
  color: var(--color-danger);
}

.queue-item-actions .btn-icon {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 20px;
  border-radius: var(--radius-sm);
  transition: var(--transition-base);
}

.queue-item-actions .btn-icon:hover {
  background: var(--color-danger-light);
  color: var(--color-danger);
}

.queue-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
}
```

---

## Testing Plan

### Phase 1: Single File Upload
1. Drop one PDF → Verify it appears in queue with "pending" status
2. Select checkbox → Verify "Analyze Selected" button enables
3. Click "Analyze Selected" → Verify status changes to "processing", then "completed"
4. Verify diff checker opens with correct data
5. Remove file from queue → Verify it disappears

### Phase 2: Multiple Files
1. Drop 3 files at once → Verify all appear in queue
2. Select 2 files → Analyze → Verify only first processes (current limitation)
3. After first completes, verify can select and analyze second file
4. Verify "Clear All" removes all files

### Phase 3: Error Handling
1. Drop unsupported file type → Verify error message
2. Analyze with no enabled profiles → Verify status shows "error"
3. Drop corrupted PDF → Verify graceful error handling

### Phase 4: UI/UX
1. Test drag & drop visual feedback
2. Test checkbox interactions
3. Test button states (disabled when no selection)
4. Test status badge colors match theme

---

## Future Enhancements (Not in Scope)

### Multi-Document Batch Processing
1. Select multiple files → Process all sequentially
2. Show progress (e.g., "Processing 2 of 5...")
3. Collect all sanitized texts
4. "Send All to Chat" button → Combine all docs into one prompt

### Queue Persistence
1. Store queue in chrome.storage.local
2. Restore queue on popup reopen
3. Handle File objects (may need to re-upload)

### Advanced Features
1. Reorder queue (drag & drop)
2. Edit file names before processing
3. Preview original text before sanitizing
4. Download all sanitized docs as ZIP

---

## Implementation Checklist

- [ ] Create `QueuedFile` interface in types
- [ ] Add queue state variables to documentAnalysis.ts
- [ ] Rename `handleFileUpload()` to `addFilesToQueue()`
- [ ] Create `renderUploadQueue()` function
- [ ] Create `renderQueueItem()` function
- [ ] Create `processQueuedFile()` function
- [ ] Create `analyzeSelectedFiles()` function
- [ ] Create helper functions (getSelectedFiles, removeFile, clearQueue)
- [ ] Update event listeners for drop/file input
- [ ] Add new event listeners (checkbox, analyze button, remove, clear)
- [ ] Update HTML in `renderDocumentAnalysis()` to include queue section
- [ ] Add CSS for queue UI components
- [ ] Test single file workflow
- [ ] Test multiple file workflow
- [ ] Test error cases
- [ ] Document user-facing changes

---

## Migration Notes

**Breaking Changes:** None - this is additive functionality

**Backward Compatibility:**
- Saved documents list still works the same
- Processing logic is identical, just triggered differently
- Preview window unchanged

**User Impact:**
- Positive: More control over when to process files
- Positive: Can queue multiple files for sequential processing
- Learning curve: Need to click "Analyze" instead of automatic processing
