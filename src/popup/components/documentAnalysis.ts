/**
 * Document Analysis Component
 * Upload and sanitize documents (PDF, TXT) before sharing with AI
 */

import { useAppStore } from '../../lib/store';
import { parseDocument, getSupportedExtensions } from '../../lib/documentParsers';
import { DocumentAlias, UserConfig } from '../../lib/types';
import { DocumentPreviewModal } from './documentPreviewModal';
import { downloadDocumentPair } from '../../lib/downloadUtils';

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
    <!-- Upload Section -->
    <div class="doc-upload-section">
      <div class="doc-upload-card">
        <div class="doc-upload-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
          </svg>
        </div>
        <h3>Upload Document</h3>
        <p>Upload PDF or TXT files to sanitize PII before sharing with AI services</p>

        <div class="doc-upload-dropzone" id="docUploadDropzone">
          <svg class="doc-upload-cloud" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <p><strong>Drop file here</strong> or click to browse</p>
          <span class="doc-upload-formats">Supports: PDF, TXT</span>
          <input
            type="file"
            id="docFileInput"
            accept="${getSupportedExtensions()}"
            style="display: none;"
          />
        </div>

        <!-- Storage Quota -->
        <div class="doc-storage-quota" id="docStorageQuota">
          <div class="quota-header">
            <span>Storage Used</span>
            <span id="quotaPercentage">Loading...</span>
          </div>
          <div class="quota-bar">
            <div class="quota-fill" id="quotaFill" style="width: 0%"></div>
          </div>
          <div class="quota-details" id="quotaDetails">
            <span>-</span>
          </div>
        </div>
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
        <h3>
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
          Saved Documents
        </h3>
        <span class="doc-count">${documents.length} document${documents.length !== 1 ? 's' : ''}</span>
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
  document.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    if (target.id === 'docFileInput' && target.files && target.files[0]) {
      handleFileUpload(target.files[0]);
    }
  });

  // Dropzone click
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const dropzone = target.closest('#docUploadDropzone');
    if (dropzone) {
      const fileInput = document.getElementById('docFileInput') as HTMLInputElement;
      fileInput?.click();
    }
  });

  // Drag and drop
  document.addEventListener('dragover', (e) => {
    const target = e.target as HTMLElement;
    const dropzone = target.closest('#docUploadDropzone');
    if (dropzone) {
      e.preventDefault();
      dropzone.classList.add('dragover');
    }
  });

  document.addEventListener('dragleave', (e) => {
    const target = e.target as HTMLElement;
    const dropzone = target.closest('#docUploadDropzone');
    if (dropzone && e.target === dropzone) {
      dropzone.classList.remove('dragover');
    }
  });

  document.addEventListener('drop', (e) => {
    const target = e.target as HTMLElement;
    const dropzone = target.closest('#docUploadDropzone');
    if (dropzone && e.dataTransfer?.files && e.dataTransfer.files[0]) {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      handleFileUpload(e.dataTransfer.files[0]);
    }
  });

  // Document card actions
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const button = target.closest('[data-action]') as HTMLElement;
    if (!button) return;

    const action = button.getAttribute('data-action');
    const docId = button.getAttribute('data-doc-id');

    if (action && docId) {
      handleDocumentAction(action, docId);
    }
  });
}

/**
 * Handle file upload
 */
async function handleFileUpload(file: File) {
  console.log('[Document Analysis] Uploading file:', file.name);

  showProcessingStatus('Parsing document...', `Reading ${file.name}`);

  try {
    // Parse document
    const extractedText = await parseDocument(file);
    console.log('[Document Analysis] Extracted text:', extractedText.length, 'chars');

    updateProcessingStatus('Sanitizing PII...', 'Applying alias profiles');

    // Sanitize text using enabled profiles
    const state = useAppStore.getState();
    const enabledProfiles = state.profiles.filter((p) => p.enabled);

    if (enabledProfiles.length === 0) {
      hideProcessingStatus();
      showError('No enabled profiles', 'Please enable at least one profile to sanitize documents');
      return;
    }

    const result = sanitizeText(extractedText, enabledProfiles);

    updateProcessingStatus('Opening preview...', 'Preparing document comparison');

    // Create document alias
    const documentData: Omit<DocumentAlias, 'id' | 'createdAt' | 'updatedAt'> = {
      documentName: file.name,
      fileSize: file.size,
      fileType: file.type,
      piiMap: result.piiMap,
      originalText: extractedText,
      sanitizedText: result.sanitizedText,
      confidence: result.confidence,
      substitutionCount: result.substitutionCount,
      profilesUsed: result.profilesUsed,
      usageCount: 0,
      preview: result.sanitizedText.substring(0, 150).trim() + '...',
    };

    hideProcessingStatus();

    // Open preview window
    openPreviewWindow({
      documentAlias: documentData,
      originalText: extractedText,
      sanitizedText: result.sanitizedText,
    });
  } catch (error: any) {
    console.error('[Document Analysis] Upload error:', error);
    hideProcessingStatus();
    showError('Processing failed', error.message || 'Unknown error');
  }
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
function openPreviewWindow(data: {
  documentAlias: Omit<DocumentAlias, 'id' | 'createdAt' | 'updatedAt'>;
  originalText: string;
  sanitizedText: string;
}) {
  // Encode document data as URL parameter
  const encodedData = encodeURIComponent(JSON.stringify(data));
  const previewUrl = chrome.runtime.getURL(`document-preview.html?data=${encodedData}`);

  // Open in new tab
  chrome.tabs.create({ url: previewUrl }, (tab) => {
    console.log('[Document Analysis] Opened preview window:', tab?.id);
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
        quotaDetails.innerHTML = `<span>${formatBytes(quota.used)} used (Unlimited)</span>`;
      } else {
        quotaDetails.innerHTML = `<span>${formatBytes(quota.used)} / ${formatBytes(quota.quota)}</span>`;
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

/**
 * Format file size
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

/**
 * Format bytes
 */
function formatBytes(bytes: number): string {
  return formatFileSize(bytes);
}

/**
 * Escape HTML
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
