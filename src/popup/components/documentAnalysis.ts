/**
 * Document Analysis Component
 * Upload and sanitize documents (PDF, TXT) before sharing with AI
 */

import { useAppStore } from '../../lib/store';
import { parseDocument, getSupportedExtensions } from '../../lib/documentParsers';
import { DocumentAlias, UserConfig, QueuedFile } from '../../lib/types';
import { DocumentPreviewModal } from './documentPreviewModal';
import { downloadDocumentPair } from '../../lib/downloadUtils';
import { EventManager } from '../utils/eventManager';

// Event manager for cleanup
const eventManager = new EventManager();

// Upload Queue State
let uploadQueue: QueuedFile[] = [];
let isProcessing = false;

// Track previous state to detect changes
let previousDocumentAliases: DocumentAlias[] = [];
let previousLoadingState = false;

/**
 * Initialize Document Analysis UI
 */
export function initDocumentAnalysisUI() {
  console.log('[Document Analysis] Initializing...');

  const container = document.getElementById('documentAnalysisContainer');
  if (!container) {
    console.error('[Document Analysis] Container not found');
    return;
  }

  // Subscribe to store changes
  useAppStore.subscribe((state) => {
    // Re-render when document aliases change
    if (state.documentAliases !== previousDocumentAliases) {
      console.log('[Document Analysis] Document aliases changed, re-rendering...');
      previousDocumentAliases = state.documentAliases;
      renderDocumentAnalysis(state.config!);
    }

    // Re-render when loading completes
    if (previousLoadingState && !state.isLoadingDocuments) {
      console.log('[Document Analysis] Loading complete, re-rendering...');
      renderDocumentAnalysis(state.config!);
    }
    previousLoadingState = state.isLoadingDocuments;
  });

  setupEventListeners();
  console.log('[Document Analysis] Initialized');
}

/**
 * Render Document Analysis UI
 */
export function renderDocumentAnalysis(_config: UserConfig) {
  const container = document.getElementById('documentAnalysisContainer');
  if (!container) return;

  const state = useAppStore.getState();
  const documents = state.documentAliases || [];
  const isLoading = state.isLoadingDocuments;

  // Load documents if not already loaded
  if (documents.length === 0 && !isLoading) {
    state.loadDocumentAliases();
  }

  container.innerHTML = `
    <!-- Compact Upload Area -->
    <div class="doc-upload-compact">
      <div class="doc-upload-header">
        <div class="doc-upload-title">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          <span>Document Sanitizer</span>
        </div>
        <span class="doc-upload-count" id="uploadCount">0 files</span>
      </div>

      <div class="doc-upload-actions">
        <input
          type="file"
          id="docFileInput"
          accept="${getSupportedExtensions()}"
          multiple
          style="display: none;"
        />
        <button class="btn btn-primary btn-compact" id="selectFilesBtn">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          Select Files
        </button>
        <div class="doc-upload-dropzone-compact" id="docUploadDropzone">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <span>or drag & drop files here</span>
        </div>
      </div>

      <p class="doc-upload-help">Upload PDF, TXT, or DOCX files. Your PII will be replaced with aliases before sending to AI.</p>
    </div>

    <!-- Upload Queue -->
    <div class="doc-upload-queue" id="docUploadQueue">
      <div class="queue-header">
        <h3>
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          </svg>
          Upload Queue
          <span class="queue-count">(<span id="queueCount">0</span>)</span>
        </h3>
        <button class="btn btn-secondary btn-compact" id="clearQueueBtn">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          Clear All
        </button>
      </div>
      <div class="queue-list" id="queueList">
        <!-- Queue items will be inserted here -->
      </div>
      <div class="queue-actions">
        <button class="btn btn-primary" id="analyzeSelectedBtn" disabled>
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 11 12 14 22 4"></polyline>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
          Analyze Selected
        </button>
      </div>
    </div>

    <!-- Processing Status -->
    <div class="doc-processing-status" id="docProcessingStatus" style="display: none;">
      <div class="doc-processing-spinner"></div>
      <div class="doc-processing-text">
        <strong id="docProcessingTitle">Processing document...</strong>
        <p id="docProcessingMessage">Please wait</p>
      </div>
    </div>

    <!-- Document List -->
    <div class="doc-list-section">
      <div class="doc-list-header">
        <div class="doc-list-title-row">
          <h3>
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            Saved Documents
          </h3>
          <span class="doc-count">${documents.length} document${documents.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="doc-storage-quota">
          <div class="quota-bar">
            <div class="quota-fill" id="quotaFill" style="width: 0%"></div>
          </div>
          <div class="quota-info">
            <span id="quotaDetails">Loading...</span>
            <span class="quota-percentage" id="quotaPercentage">0%</span>
          </div>
        </div>
      </div>

      ${isLoading ? renderLoadingState() : ''}
      ${!isLoading && documents.length === 0 ? renderEmptyState() : ''}
      ${!isLoading && documents.length > 0 ? renderDocumentList(documents) : ''}
    </div>
  `;

  // Update storage quota
  updateStorageQuota();

  console.log('[Document Analysis] Rendered with', documents.length, 'documents');
}

/**
 * Render loading state
 */
function renderLoadingState(): string {
  return `
    <div class="doc-loading">
      <div class="doc-loading-spinner"></div>
      <p>Loading documents...</p>
    </div>
  `;
}

/**
 * Render empty state
 */
function renderEmptyState(): string {
  return `
    <div class="doc-empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
      </svg>
      <h4>No documents yet</h4>
      <p>Upload a document above to get started</p>
    </div>
  `;
}

/**
 * Render document list
 */
function renderDocumentList(documents: DocumentAlias[]): string {
  const documentCards = documents
    .map(
      (doc) => `
    <div class="doc-card" data-doc-id="${doc.id}">
      <div class="doc-card-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
      </div>
      <div class="doc-card-content">
        <h4>${escapeHtml(doc.documentName)}</h4>
        <div class="doc-card-meta">
          <span>${formatFileSize(doc.fileSize)}</span>
          <span>•</span>
          <span>${doc.substitutionCount} substitutions</span>
          <span>•</span>
          <span>${new Date(doc.createdAt).toLocaleDateString()}</span>
        </div>
        <div class="doc-card-preview">${escapeHtml(doc.preview)}</div>
      </div>
      <div class="doc-card-actions">
        <button class="btn-icon" data-action="preview" data-doc-id="${doc.id}" title="Preview">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>
        <button class="btn-icon" data-action="download" data-doc-id="${doc.id}" title="Download">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </button>
        <button class="btn-icon btn-danger" data-action="delete" data-doc-id="${doc.id}" title="Delete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </div>
  `
    )
    .join('');

  return `<div class="doc-list">${documentCards}</div>`;
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // File input change
  eventManager.add(document, 'change', (e) => {
    const target = e.target as HTMLInputElement;
    if (target.id === 'docFileInput' && target.files) {
      addFilesToQueue(target.files);
      target.value = ''; // Reset so same file can be added again
    }
  });

  // Select Files button click
  eventManager.add(document, 'click', (e) => {
    const target = e.target as HTMLElement;
    if (target.id === 'selectFilesBtn' || target.closest('#selectFilesBtn')) {
      const fileInput = document.getElementById('docFileInput') as HTMLInputElement;
      fileInput?.click();
    }
  });

  // Dropzone click
  eventManager.add(document, 'click', (e) => {
    const target = e.target as HTMLElement;
    const dropzone = target.closest('#docUploadDropzone');
    if (dropzone) {
      const fileInput = document.getElementById('docFileInput') as HTMLInputElement;
      fileInput?.click();
    }
  });

  // Drag and drop
  eventManager.add(document, 'dragover', (e) => {
    const target = e.target as HTMLElement;
    const dropzone = target.closest('#docUploadDropzone');
    if (dropzone) {
      e.preventDefault();
      dropzone.classList.add('dragover');
    }
  });

  eventManager.add(document, 'dragleave', (e) => {
    const target = e.target as HTMLElement;
    const dropzone = target.closest('#docUploadDropzone');
    if (dropzone && e.target === dropzone) {
      dropzone.classList.remove('dragover');
    }
  });

  eventManager.add(document, 'drop', (e) => {
    const target = e.target as HTMLElement;
    const dropzone = target.closest('#docUploadDropzone');
    if (dropzone && (e as DragEvent).dataTransfer?.files) {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      addFilesToQueue((e as DragEvent).dataTransfer!.files);
    }
  });

  // Document card actions
  eventManager.add(document, 'click', (e) => {
    const target = e.target as HTMLElement;
    const button = target.closest('[data-action]') as HTMLElement;
    if (!button) return;

    const action = button.getAttribute('data-action');
    const docId = button.getAttribute('data-doc-id');

    if (action && docId) {
      handleDocumentAction(action, docId);
    }
  });

  // Queue UI - Checkbox changes (update button state)
  eventManager.add(document, 'change', (e) => {
    const target = e.target as HTMLInputElement;
    console.log('[Document Analysis] Change event detected:', {
      targetId: target.id,
      targetType: target.type,
      checked: target.checked,
      isFileCheckbox: target.id.startsWith('file_')
    });

    if (target.type === 'checkbox' && target.id.startsWith('file_')) {
      console.log('[Document Analysis] File checkbox changed, updating button state only (NOT re-rendering)');

      // Update button state without re-rendering (which destroys checkbox states)
      const selectedCount = getSelectedFiles().length;
      const analyzeBtn = document.getElementById('analyzeSelectedBtn') as HTMLButtonElement;
      if (analyzeBtn) {
        analyzeBtn.disabled = selectedCount === 0 || isProcessing;
        console.log('[Document Analysis] Analyze button disabled:', analyzeBtn.disabled, '(selected:', selectedCount, ')');
      }
    }
  });

  // Additional logging for clicks on toggle area
  eventManager.add(document, 'click', (e) => {
    const target = e.target as HTMLElement;
    const toggleSwitch = target.closest('.toggle-switch');
    const queueItem = target.closest('.queue-item');

    if (toggleSwitch || queueItem) {
      console.log('[Document Analysis] Click detected:', {
        clickedElement: target.className,
        isToggleSwitch: !!toggleSwitch,
        isQueueItem: !!queueItem,
        queueItemId: queueItem?.getAttribute('data-file-id')
      });
    }
  });

  // Queue UI - Analyze Selected button
  eventManager.add(document, 'click', (e) => {
    const target = e.target as HTMLElement;
    if (target.id === 'analyzeSelectedBtn' || target.closest('#analyzeSelectedBtn')) {
      analyzeSelectedFiles();
    }
  });

  // Queue UI - Remove file button
  eventManager.add(document, 'click', (e) => {
    const target = e.target as HTMLElement;
    const button = target.closest('[data-action="remove"]') as HTMLElement;
    if (button && button.hasAttribute('data-file-id')) {
      const fileId = button.getAttribute('data-file-id');
      if (fileId) {
        removeFileFromQueue(fileId);
      }
    }
  });

  // Queue UI - Clear All button
  eventManager.add(document, 'click', (e) => {
    const target = e.target as HTMLElement;
    if (target.id === 'clearQueueBtn' || target.closest('#clearQueueBtn')) {
      clearQueue();
    }
  });
}

/**
 * Add files to upload queue
 */
function addFilesToQueue(files: FileList | File[]) {
  const fileArray = Array.from(files);
  console.log('[Document Analysis] addFilesToQueue called with', fileArray.length, 'files');

  fileArray.forEach(file => {
    // Validate file type
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'txt', 'text', 'docx'].includes(ext || '')) {
      console.warn('[Document Analysis] Invalid file type:', file.name, ext);
      showError('Invalid file type', `${file.name} is not supported. Use PDF, TXT, or DOCX files.`);
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
    console.log('[Document Analysis] Added to queue:', {
      id: queuedFile.id,
      fileName: queuedFile.fileName,
      status: queuedFile.status
    });
  });

  console.log('[Document Analysis] Queue now has', uploadQueue.length, 'files');
  renderUploadQueue();
}

/**
 * Render upload queue UI
 */
function renderUploadQueue() {
  console.log('[Document Analysis] renderUploadQueue called');

  const queueContainer = document.getElementById('queueList');
  const queueCountEl = document.getElementById('queueCount');
  const uploadCountEl = document.getElementById('uploadCount');
  const analyzeBtn = document.getElementById('analyzeSelectedBtn') as HTMLButtonElement;
  const queueSection = document.getElementById('docUploadQueue');

  console.log('[Document Analysis] DOM elements found:', {
    queueContainer: !!queueContainer,
    queueCountEl: !!queueCountEl,
    uploadCountEl: !!uploadCountEl,
    analyzeBtn: !!analyzeBtn,
    queueSection: !!queueSection
  });

  if (!queueContainer) {
    console.error('[Document Analysis] queueList container not found!');
    return;
  }

  // Update counts
  if (queueCountEl) queueCountEl.textContent = `${uploadQueue.length}`;
  if (uploadCountEl) {
    uploadCountEl.textContent = uploadQueue.length === 1 ? '1 file' : `${uploadQueue.length} files`;
  }

  // Show/hide queue section
  if (queueSection) {
    queueSection.style.display = uploadQueue.length > 0 ? 'block' : 'none';
    console.log('[Document Analysis] Queue section display:', queueSection.style.display);
  }

  // Render items
  queueContainer.innerHTML = uploadQueue.map(renderQueueItem).join('');
  console.log('[Document Analysis] Rendered', uploadQueue.length, 'queue items');

  // Enable/disable analyze button
  const selectedCount = getSelectedFiles().length;
  console.log('[Document Analysis] Selected files count:', selectedCount);

  if (analyzeBtn) {
    analyzeBtn.disabled = selectedCount === 0 || isProcessing;
    console.log('[Document Analysis] Analyze button disabled:', analyzeBtn.disabled, '(selected:', selectedCount, 'processing:', isProcessing, ')');
  }
}

/**
 * Render single queue item
 */
function renderQueueItem(queuedFile: QueuedFile): string {
  const isPDF = queuedFile.fileType.includes('pdf') || queuedFile.fileName.endsWith('.pdf');
  const isDocx = queuedFile.fileType.includes('word') || queuedFile.fileName.endsWith('.docx');
  const fileTypeLabel = isPDF ? 'PDF' : isDocx ? 'DOCX' : 'TXT';

  const icon = isPDF ? `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <path d="M9 13h6"></path>
      <path d="M9 17h6"></path>
    </svg>
  ` : isDocx ? `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <path d="M9 9h6"></path>
      <path d="M9 13h6"></path>
      <path d="M9 17h3"></path>
    </svg>
  ` : `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="9" y1="15" x2="15" y2="15"></line>
    </svg>
  `;

  const statusClass = `status-${queuedFile.status}`;
  const statusText = queuedFile.status.charAt(0).toUpperCase() + queuedFile.status.slice(1);

  const isCompleted = queuedFile.status === 'completed';
  const isDisabled = queuedFile.status !== 'pending';

  return `
    <div class="queue-item" data-file-id="${queuedFile.id}">
      <div class="queue-item-toggle">
        <label class="toggle-switch" title="Select for analysis">
          <input
            type="checkbox"
            id="file_${queuedFile.id}"
            ${isCompleted ? 'checked' : ''}
            ${isDisabled ? 'disabled' : ''}
          />
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="queue-item-icon">${icon}</div>
      <div class="queue-item-info">
        <div class="queue-item-name">${escapeHtml(queuedFile.fileName)}</div>
        <div class="queue-item-meta">${formatFileSize(queuedFile.fileSize)} • ${fileTypeLabel}</div>
      </div>
      <div class="queue-item-status">
        <span class="status-badge ${statusClass}">${statusText}</span>
        ${queuedFile.errorMessage ? `<div class="error-message">${escapeHtml(queuedFile.errorMessage)}</div>` : ''}
      </div>
      <div class="queue-item-actions">
        <button class="btn-icon" data-action="remove" data-file-id="${queuedFile.id}" title="Remove from queue">×</button>
      </div>
    </div>
  `;
}

/**
 * Process queued file (single file)
 */
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
      sanitizedText: result.sanitizedText
    });

    hideProcessingStatus();

  } catch (error: any) {
    console.error('[Document Analysis] Processing error:', error);
    queuedFile.status = 'error';
    queuedFile.errorMessage = error.message || 'Unknown error';
    hideProcessingStatus();
    renderUploadQueue();
    showError('Processing failed', error.message || 'Unknown error');
  }
}

/**
 * Analyze selected files from queue
 */
async function analyzeSelectedFiles() {
  if (isProcessing) return;

  const selectedFiles = getSelectedFiles();
  if (selectedFiles.length === 0) return;

  isProcessing = true;

  try {
    if (selectedFiles.length === 1) {
      // Single file: Use existing logic
      await processQueuedFile(selectedFiles[0]);
    } else {
      // Multiple files: Combine them
      await processMultipleFiles(selectedFiles);
    }
  } finally {
    isProcessing = false;
  }
}

/**
 * Process multiple files and combine into one document
 */
async function processMultipleFiles(files: QueuedFile[]) {
  console.log('[Document Analysis] Processing multiple files:', files.length);

  const state = useAppStore.getState();
  const enabledProfiles = state.profiles.filter(p => p.enabled);

  if (enabledProfiles.length === 0) {
    showError('No enabled profiles', 'Please enable at least one profile.');
    return;
  }

  // Mark all as processing
  files.forEach(f => {
    f.status = 'processing';
  });
  renderUploadQueue();

  const combinedOriginal: string[] = [];
  const combinedSanitized: string[] = [];
  let totalSize = 0;
  let totalSubstitutions = 0;
  const fileNames: string[] = [];
  const documentBoundaries: Array<{ name: string; startChar: number; percentage: number }> = [];

  try {
    let currentCharPosition = 0;

    for (let i = 0; i < files.length; i++) {
      const queuedFile = files[i];
      fileNames.push(queuedFile.fileName);

      showProcessingStatus(
        `Processing ${i + 1} of ${files.length}...`,
        `Parsing ${queuedFile.fileName}`
      );

      // Parse document
      const extractedText = await parseDocument(queuedFile.file);
      queuedFile.extractedText = extractedText;

      updateProcessingStatus(
        `Processing ${i + 1} of ${files.length}...`,
        `Sanitizing ${queuedFile.fileName}`
      );

      // Sanitize
      const result = sanitizeText(extractedText, enabledProfiles);
      queuedFile.sanitizedText = result.sanitizedText;

      // Add document header separator
      const documentHeader = `DOCUMENT ${i + 1}: ${queuedFile.fileName}\n${'='.repeat(80)}\n\n`;

      // Track this document's starting position
      documentBoundaries.push({
        name: queuedFile.fileName,
        startChar: currentCharPosition,
        percentage: 0 // Will calculate after we know total length
      });

      const fullDocument = documentHeader + result.sanitizedText;
      combinedOriginal.push(documentHeader + extractedText);
      combinedSanitized.push(fullDocument);

      currentCharPosition += fullDocument.length + 2; // +2 for the \n\n joining

      totalSize += queuedFile.fileSize;
      totalSubstitutions += result.substitutionCount;

      // Mark as completed
      queuedFile.status = 'completed';
      renderUploadQueue();
    }

    hideProcessingStatus();

    // Create combined document alias
    const combinedDocumentName = `Combined: ${fileNames.join(', ')}`;
    const combinedOriginalText = combinedOriginal.join('\n\n');
    const combinedSanitizedText = combinedSanitized.join('\n\n');

    // Calculate percentages for each document boundary
    const totalChars = combinedSanitizedText.length;
    documentBoundaries.forEach(boundary => {
      boundary.percentage = (boundary.startChar / totalChars) * 100;
    });

    // Re-run sanitization on combined text to get accurate PII map
    const finalResult = sanitizeText(combinedOriginalText, enabledProfiles);

    const documentData: Omit<DocumentAlias, 'id' | 'createdAt' | 'updatedAt'> = {
      documentName: combinedDocumentName,
      fileSize: totalSize,
      fileType: 'application/pdf', // Generic type for combined
      piiMap: finalResult.piiMap,
      originalText: combinedOriginalText,
      sanitizedText: combinedSanitizedText,
      confidence: finalResult.confidence,
      substitutionCount: totalSubstitutions,
      profilesUsed: finalResult.profilesUsed,
      usageCount: 0,
      preview: combinedSanitizedText.substring(0, 150).trim() + '...',
    };

    // Open preview window
    updateProcessingStatus('Opening preview...', 'Preparing combined document');

    openPreviewWindow({
      documentAlias: documentData,
      originalText: combinedOriginalText,
      sanitizedText: combinedSanitizedText,
      documentBoundaries: documentBoundaries.length > 1 ? documentBoundaries : undefined
    });

    hideProcessingStatus();

  } catch (error: any) {
    console.error('[Document Analysis] Multi-file processing error:', error);

    // Mark all as error
    files.forEach(f => {
      if (f.status === 'processing') {
        f.status = 'error';
        f.errorMessage = error.message || 'Unknown error';
      }
    });

    hideProcessingStatus();
    renderUploadQueue();
    showError('Processing failed', error.message || 'Unknown error');
  }
}

/**
 * Get selected files from queue
 */
function getSelectedFiles(): QueuedFile[] {
  console.log('[Document Analysis] getSelectedFiles called, checking', uploadQueue.length, 'files');

  const selected = uploadQueue.filter(qf => {
    const checkbox = document.getElementById(`file_${qf.id}`) as HTMLInputElement;
    const isChecked = checkbox?.checked;
    const isPending = qf.status === 'pending';

    console.log('[Document Analysis] File:', qf.fileName, {
      checkboxFound: !!checkbox,
      checked: isChecked,
      status: qf.status,
      isPending: isPending,
      willSelect: isChecked && isPending
    });

    return checkbox?.checked && qf.status === 'pending';
  });

  console.log('[Document Analysis] Selected', selected.length, 'files');
  return selected;
}

/**
 * Remove file from queue
 */
function removeFileFromQueue(fileId: string) {
  uploadQueue = uploadQueue.filter(qf => qf.id !== fileId);
  renderUploadQueue();
}

/**
 * Clear all files from queue
 */
function clearQueue() {
  uploadQueue = [];
  renderUploadQueue();
}

/**
 * Helper: Format file size
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

/**
 * Helper: Escape HTML
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Sanitize text using profiles
 */
function sanitizeText(text: string, profiles: any[]) {
  let sanitizedText = text;
  const piiMap: any[] = [];
  let substitutionCount = 0;

  profiles.forEach((profile) => {
    // Iterate over all PII types in profile.real
    Object.entries(profile.real).forEach(([piiType, realValue]) => {
      if (!realValue || typeof realValue !== 'string') return;

      const aliasValue = (profile.alias as any)[piiType];
      if (!aliasValue) return;

      // Find all occurrences
      const regex = new RegExp(realValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = [...text.matchAll(regex)];

      if (matches.length > 0) {
        // Replace in sanitized text
        sanitizedText = sanitizedText.replace(regex, aliasValue);

        // Track in PII map
        piiMap.push({
          profileId: profile.id,
          profileName: profile.profileName,
          piiType,
          realValue,
          aliasValue,
          occurrences: matches.length,
          positions: matches.map((m) => m.index || 0),
        });

        substitutionCount += matches.length;
      }
    });
  });

  return {
    sanitizedText,
    piiMap,
    substitutionCount,
    confidence: piiMap.length > 0 ? 0.95 : 1.0,
    profilesUsed: profiles.map((p) => p.id),
  };
}

/**
 * Handle document actions (preview, download, delete)
 */
function handleDocumentAction(action: string, docId: string) {
  const state = useAppStore.getState();
  const document = state.documentAliases.find((d) => d.id === docId);

  if (!document) {
    console.error('[Document Analysis] Document not found:', docId);
    return;
  }

  switch (action) {
    case 'preview':
      showPreviewModal(document);
      break;
    case 'download':
      downloadDocumentPair(
        document.originalText || document.sanitizedText,
        document.sanitizedText,
        document.documentName
      );
      state.incrementDocumentUsage(docId);
      break;
    case 'delete':
      if (confirm(`Delete "${document.documentName}"?`)) {
        state.deleteDocumentAlias(docId);
        const config = state.config;
        if (config) {
          renderDocumentAnalysis(config);
        }
      }
      break;
  }
}

/**
 * Open preview window in new tab
 */
async function openPreviewWindow(data: {
  documentAlias: Omit<DocumentAlias, 'id' | 'createdAt' | 'updatedAt'>;
  originalText: string;
  sanitizedText: string;
  documentBoundaries?: Array<{ name: string; startChar: number; percentage: number }>;
}) {
  // Get current theme from store
  const state = useAppStore.getState();
  const theme = state.config?.settings?.theme || 'classic-light';

  // Add theme to data
  const dataWithTheme = {
    ...data,
    theme: theme
  };

  // Generate unique session key
  const sessionKey = `doc_preview_${Date.now()}`;

  // Store data in chrome.storage.session (supports large data)
  await chrome.storage.session.set({ [sessionKey]: dataWithTheme });

  // Pass only the session key in URL
  const previewUrl = chrome.runtime.getURL(`document-preview.html?sessionKey=${sessionKey}`);

  // Open in new tab
  chrome.tabs.create({ url: previewUrl }, (tab) => {
    console.log('[Document Analysis] Opened preview window:', tab?.id, 'sessionKey:', sessionKey);
  });
}

/**
 * Show preview modal (for saved documents)
 */
function showPreviewModal(documentAlias: DocumentAlias) {
  const modal = new DocumentPreviewModal({
    documentAlias,
    onClose: () => {
      console.log('[Document Analysis] Preview modal closed');
    },
  });

  modal.show();
}

/**
 * Update storage quota display
 */
async function updateStorageQuota() {
  const state = useAppStore.getState();

  try {
    const quota = await state.getStorageQuota();

    const quotaPercentage = document.getElementById('quotaPercentage');
    const quotaFill = document.getElementById('quotaFill');
    const quotaDetails = document.getElementById('quotaDetails');

    if (quotaPercentage && quotaFill && quotaDetails) {
      quotaPercentage.textContent = `${Math.round(quota.percentage)}%`;
      quotaFill.style.width = `${quota.percentage}%`;

      if (quota.hasUnlimitedStorage) {
        quotaDetails.innerHTML = `<span>${formatFileSize(quota.used)} used (Unlimited)</span>`;
      } else {
        quotaDetails.innerHTML = `<span>${formatFileSize(quota.used)} / ${formatFileSize(quota.quota)}</span>`;
      }

      // Add warning class if > 80%
      quotaFill.className = quota.percentage > 80 ? 'quota-fill warning' : 'quota-fill';
    }
  } catch (error) {
    console.error('[Document Analysis] Quota error:', error);
  }
}

/**
 * Show processing status
 */
function showProcessingStatus(title: string, message: string) {
  const status = document.getElementById('docProcessingStatus');
  const titleEl = document.getElementById('docProcessingTitle');
  const messageEl = document.getElementById('docProcessingMessage');

  if (status && titleEl && messageEl) {
    titleEl.textContent = title;
    messageEl.textContent = message;
    status.style.display = 'flex';
  }
}

/**
 * Update processing status
 */
function updateProcessingStatus(title: string, message: string) {
  const titleEl = document.getElementById('docProcessingTitle');
  const messageEl = document.getElementById('docProcessingMessage');

  if (titleEl && messageEl) {
    titleEl.textContent = title;
    messageEl.textContent = message;
  }
}

/**
 * Hide processing status
 */
function hideProcessingStatus() {
  const status = document.getElementById('docProcessingStatus');
  if (status) {
    status.style.display = 'none';
  }
}

/**
 * Show error notification
 */
function showError(title: string, message: string) {
  // TODO: Implement toast notification system
  console.error(`[Error] ${title}: ${message}`);
  alert(`Error: ${title}\n\n${message}`);
}
