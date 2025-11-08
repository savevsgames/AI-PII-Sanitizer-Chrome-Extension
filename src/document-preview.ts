/**
 * Document Preview Page - Full Screen View
 * Handles display and actions for document sanitization preview
 */

import { DocumentAlias } from './lib/types';
import { downloadDocumentPair } from './lib/downloadUtils';
import { useAppStore } from './lib/store';

// Types for message passing
interface DocumentPreviewData {
  documentAlias: Omit<DocumentAlias, 'id' | 'createdAt' | 'updatedAt'>;
  originalText: string;
  sanitizedText: string;
}

let documentData: DocumentPreviewData | null = null;

// Pagination state
const CHARS_PER_PAGE = 3000; // ~1-2 pages of text
let currentPage = 1;
let totalPages = 1;
let originalPages: string[] = [];
let sanitizedPages: string[] = [];

/**
 * Initialize the preview page
 */
async function init() {
  console.log('[Document Preview] Initializing...');

  // Get document data from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const dataParam = urlParams.get('data');

  if (!dataParam) {
    showError('No document data provided');
    return;
  }

  try {
    // Decode and parse the document data
    documentData = JSON.parse(decodeURIComponent(dataParam));

    if (!documentData) {
      showError('Invalid document data');
      return;
    }

    // Render the document
    renderDocument(documentData);

    // Setup event listeners
    setupEventListeners();

    // Load storage quota
    updateStorageQuota();

    console.log('[Document Preview] Initialized successfully');
  } catch (error) {
    console.error('[Document Preview] Init error:', error);
    showError('Failed to load document data');
  }
}

/**
 * Split text into pages
 */
function paginateText(text: string): string[] {
  const pages: string[] = [];
  let currentPos = 0;

  while (currentPos < text.length) {
    const chunk = text.substring(currentPos, currentPos + CHARS_PER_PAGE);
    pages.push(chunk);
    currentPos += CHARS_PER_PAGE;
  }

  return pages.length > 0 ? pages : [''];
}

/**
 * Render the document comparison
 */
function renderDocument(data: DocumentPreviewData) {
  // Update header
  const documentNameEl = document.getElementById('documentName');
  const fileSizeEl = document.getElementById('fileSize');
  const substitutionCountEl = document.getElementById('substitutionCount');
  const confidenceEl = document.getElementById('confidence');

  if (documentNameEl) documentNameEl.textContent = data.documentAlias.documentName;
  if (fileSizeEl) fileSizeEl.textContent = formatFileSize(data.documentAlias.fileSize);
  if (substitutionCountEl) substitutionCountEl.textContent = `${data.documentAlias.substitutionCount}`;
  if (confidenceEl) confidenceEl.textContent = `${Math.round(data.documentAlias.confidence * 100)}`;

  // Paginate the text
  originalPages = paginateText(data.originalText);
  sanitizedPages = paginateText(data.sanitizedText);
  totalPages = Math.max(originalPages.length, sanitizedPages.length);
  currentPage = 1;

  console.log(`[Document Preview] Paginated: ${totalPages} pages (${CHARS_PER_PAGE} chars/page)`);

  // Render first page
  renderCurrentPage();

  // Render PII details
  renderPIIDetails(data.documentAlias.piiMap);
}

/**
 * Render the current page
 */
function renderCurrentPage() {
  if (!documentData) return;

  const originalContentEl = document.getElementById('originalContent');
  const sanitizedContentEl = document.getElementById('sanitizedContent');

  if (originalContentEl) {
    const pageText = originalPages[currentPage - 1] || '';
    originalContentEl.innerHTML = highlightPII(pageText, documentData.documentAlias.piiMap, 'original');
  }

  if (sanitizedContentEl) {
    const pageText = sanitizedPages[currentPage - 1] || '';
    sanitizedContentEl.innerHTML = highlightPII(pageText, documentData.documentAlias.piiMap, 'sanitized');
  }

  // Update pagination controls
  updatePaginationControls();
}

/**
 * Highlight PII in text
 */
function highlightPII(
  text: string,
  piiMap: DocumentAlias['piiMap'],
  type: 'original' | 'sanitized'
): string {
  if (!text) return '<div class="loading-spinner"><p>No text available</p></div>';

  let highlightedText = escapeHtml(text);

  // Highlight each PII occurrence
  piiMap.forEach((pii) => {
    const value = type === 'original' ? pii.realValue : pii.aliasValue;
    const escapedValue = escapeHtml(value);

    // Create regex that escapes special characters
    const regex = new RegExp(
      escapedValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      'g'
    );

    highlightedText = highlightedText.replace(
      regex,
      `<mark class="pii-highlight" title="${pii.piiType}: ${escapedValue}">${escapedValue}</mark>`
    );
  });

  return highlightedText;
}

/**
 * Render PII details list
 */
function renderPIIDetails(piiMap: DocumentAlias['piiMap']) {
  const piiListEl = document.getElementById('piiList');
  const piiCountEl = document.getElementById('piiCount');

  if (!piiListEl || !piiCountEl) return;

  piiCountEl.textContent = `${piiMap.length}`;

  if (piiMap.length === 0) {
    piiListEl.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: var(--space-lg);">No PII detected</p>';
    return;
  }

  const piiItems = piiMap
    .map(
      (pii) => `
    <div class="pii-item-full">
      <span class="pii-type-badge">${escapeHtml(pii.piiType)}</span>
      <code class="pii-value">${escapeHtml(pii.realValue)}</code>
      <svg class="pii-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
      </svg>
      <code class="pii-value">${escapeHtml(pii.aliasValue)}</code>
      <span class="pii-count">${pii.occurrences}×</span>
    </div>
  `
    )
    .join('');

  piiListEl.innerHTML = piiItems;
}

/**
 * Update pagination controls
 */
function updatePaginationControls() {
  const pageInput = document.getElementById('pageInput') as HTMLInputElement;
  const pageTotal = document.getElementById('pageTotal');
  const firstPageBtn = document.getElementById('firstPageBtn') as HTMLButtonElement;
  const prevPageBtn = document.getElementById('prevPageBtn') as HTMLButtonElement;
  const nextPageBtn = document.getElementById('nextPageBtn') as HTMLButtonElement;
  const lastPageBtn = document.getElementById('lastPageBtn') as HTMLButtonElement;

  if (pageInput) pageInput.value = `${currentPage}`;
  if (pageTotal) pageTotal.textContent = `${totalPages}`;

  // Disable buttons at boundaries
  if (firstPageBtn) firstPageBtn.disabled = currentPage === 1;
  if (prevPageBtn) prevPageBtn.disabled = currentPage === 1;
  if (nextPageBtn) nextPageBtn.disabled = currentPage === totalPages;
  if (lastPageBtn) lastPageBtn.disabled = currentPage === totalPages;
}

/**
 * Navigate to specific page
 */
function goToPage(page: number) {
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderCurrentPage();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Close button
  const closeBtn = document.getElementById('closeBtn');
  closeBtn?.addEventListener('click', handleClose);

  // Cancel button
  const cancelBtn = document.getElementById('cancelBtn');
  cancelBtn?.addEventListener('click', handleClose);

  // Download button
  const downloadBtn = document.getElementById('downloadBtn');
  downloadBtn?.addEventListener('click', handleDownload);

  // Save button
  const saveBtn = document.getElementById('saveBtn');
  saveBtn?.addEventListener('click', handleSave);

  // Save & Download Both button
  const saveBothBtn = document.getElementById('saveBothBtn');
  saveBothBtn?.addEventListener('click', handleSaveBoth);

  // Pagination controls
  const firstPageBtn = document.getElementById('firstPageBtn');
  firstPageBtn?.addEventListener('click', () => goToPage(1));

  const prevPageBtn = document.getElementById('prevPageBtn');
  prevPageBtn?.addEventListener('click', () => goToPage(currentPage - 1));

  const nextPageBtn = document.getElementById('nextPageBtn');
  nextPageBtn?.addEventListener('click', () => goToPage(currentPage + 1));

  const lastPageBtn = document.getElementById('lastPageBtn');
  lastPageBtn?.addEventListener('click', () => goToPage(totalPages));

  const pageInput = document.getElementById('pageInput') as HTMLInputElement;
  pageInput?.addEventListener('change', (e) => {
    const page = parseInt((e.target as HTMLInputElement).value, 10);
    if (!isNaN(page)) {
      goToPage(page);
    }
  });

  pageInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const page = parseInt((e.target as HTMLInputElement).value, 10);
      if (!isNaN(page)) {
        goToPage(page);
      }
    }
  });

  // ESC key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  });
}

/**
 * Handle close window
 */
function handleClose() {
  window.close();
}

/**
 * Handle download files
 */
function handleDownload() {
  if (!documentData) return;

  downloadDocumentPair(
    documentData.originalText,
    documentData.sanitizedText,
    documentData.documentAlias.documentName
  );

  showSuccess('Files downloaded successfully!');
}

/**
 * Handle save to storage
 */
async function handleSave() {
  if (!documentData) return;

  const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner" style="width: 16px; height: 16px; display: inline-block;"></span> Saving...';
  }

  try {
    const state = useAppStore.getState();
    await state.addDocumentAlias(documentData.documentAlias);

    showSuccess('Document saved to chrome storage!');

    // Update storage quota
    await updateStorageQuota();
  } catch (error: any) {
    console.error('[Document Preview] Save error:', error);
    showError(`Failed to save: ${error.message}`);
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
          <polyline points="17 21 17 13 7 13 7 21"></polyline>
          <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
        Save to Storage
      `;
    }
  }
}

/**
 * Handle save & download both
 */
async function handleSaveBoth() {
  if (!documentData) return;

  const saveBothBtn = document.getElementById('saveBothBtn') as HTMLButtonElement;
  if (saveBothBtn) {
    saveBothBtn.disabled = true;
    saveBothBtn.innerHTML = '<span class="spinner" style="width: 16px; height: 16px; display: inline-block;"></span> Processing...';
  }

  try {
    // Save to storage
    const state = useAppStore.getState();
    await state.addDocumentAlias(documentData.documentAlias);

    // Download files
    downloadDocumentPair(
      documentData.originalText,
      documentData.sanitizedText,
      documentData.documentAlias.documentName
    );

    showSuccess('Document saved and files downloaded!');

    // Update storage quota
    await updateStorageQuota();
  } catch (error: any) {
    console.error('[Document Preview] Save both error:', error);
    showError(`Failed to save: ${error.message}`);
  } finally {
    if (saveBothBtn) {
      saveBothBtn.disabled = false;
      saveBothBtn.innerHTML = `
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        Save & Download Both
      `;
    }
  }
}

/**
 * Update storage quota display
 */
async function updateStorageQuota() {
  const state = useAppStore.getState();

  try {
    const quota = await state.getStorageQuota();

    const storageFillEl = document.getElementById('storageFill');
    const storageTextEl = document.getElementById('storageText');

    if (storageFillEl && storageTextEl) {
      storageFillEl.style.width = `${quota.percentage}%`;

      if (quota.hasUnlimitedStorage) {
        storageTextEl.textContent = `${formatBytes(quota.used)} used (Unlimited)`;
      } else {
        storageTextEl.textContent = `${formatBytes(quota.used)} / ${formatBytes(quota.quota)}`;
      }

      // Add warning class if > 80%
      if (quota.percentage > 80) {
        storageFillEl.style.background = 'var(--color-warning)';
      } else {
        storageFillEl.style.background = 'var(--color-primary)';
      }
    }
  } catch (error) {
    console.error('[Document Preview] Quota error:', error);
  }
}

/**
 * Show success message
 */
function showSuccess(message: string) {
  // TODO: Implement toast notification
  alert(message);
}

/**
 * Show error message
 */
function showError(message: string) {
  // TODO: Implement toast notification
  alert(`Error: ${message}`);
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

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
