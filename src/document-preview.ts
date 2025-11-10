/**
 * Document Preview Page - Full Screen View
 * Handles display and actions for document sanitization preview
 */

import { DocumentAlias } from './lib/types';
import { downloadDocumentPair } from './lib/downloadUtils';
import { useAppStore } from './lib/store';
import { EventManager } from './popup/utils/eventManager';

// Event manager for cleanup
const eventManager = new EventManager();

// Types for message passing
interface DocumentPreviewData {
  documentAlias: Omit<DocumentAlias, 'id' | 'createdAt' | 'updatedAt'>;
  originalText: string;
  sanitizedText: string;
  theme?: string; // Theme from main popup
  documentBoundaries?: Array<{ name: string; startChar: number; percentage: number }>; // Character-based from source
}

let documentData: DocumentPreviewData | null = null;

// Pagination state
const CHARS_PER_PAGE = 15000; // ~1 full page of dense text (increased from 3000)
let currentPage = 1;
let totalPages = 1;
let originalPages: string[] = [];
let sanitizedPages: string[] = [];
let documentBoundaries: Array<{ name: string; startPage: number; percentage: number }> = [];

/**
 * Initialize the preview page
 */
async function init() {
  console.log('[Document Preview] Initializing...');

  // Get session key from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const sessionKey = urlParams.get('sessionKey');

  if (!sessionKey) {
    showError('No session key provided');
    return;
  }

  try {
    console.log('[Document Preview] Loading data from session key:', sessionKey);

    // Get document data from chrome.storage.session
    const result = await chrome.storage.session.get(sessionKey);
    documentData = result[sessionKey];

    if (!documentData) {
      showError('Session data not found');
      return;
    }

    // Clean up session storage
    await chrome.storage.session.remove(sessionKey);
    console.log('[Document Preview] Session data loaded and cleaned up');

    // Document boundaries will be calculated after pagination
    if (documentData.documentBoundaries) {
      console.log('[Document Preview] Multi-document with', documentData.documentBoundaries.length, 'documents');
    }

    // Initialize drawer as collapsed
    const drawer = document.getElementById('piiDrawer');
    if (drawer) {
      drawer.classList.add('collapsed');
    }

    // Apply theme
    applyTheme(documentData.theme || 'classic-light');

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
 * Apply theme to the document
 */
function applyTheme(theme: string) {
  const body = document.body;

  // Determine if dark or light mode
  const darkThemes = ['classic-dark', 'midnight-purple', 'deep-ocean', 'embers', 'forest', 'sundown'];
  const themeMode = darkThemes.includes(theme) ? 'dark' : 'light';

  // Set theme attributes
  body.setAttribute('data-theme', theme);
  body.setAttribute('data-theme-mode', themeMode);

  // Update CSS variable to apply theme gradient background
  // This matches the theme system in variables.css
  const themeVar = `--theme-${theme}`;
  const headerVar = `--theme-${theme}-header`;

  body.style.setProperty('--theme-bg-gradient', `var(${themeVar})`);
  body.style.setProperty('--theme-header-gradient', `var(${headerVar})`);

  console.log('[Document Preview] Applied theme:', theme, '(mode:', themeMode, ')');
}

/**
 * Split text into pages using smart paragraph-based pagination
 * - Tries to get as close to CHARS_PER_PAGE (15,000) as possible
 * - Respects paragraph boundaries (double newlines)
 * - If a single paragraph exceeds 15k, that's fine - it becomes its own page
 * - Won't add a paragraph if it would exceed 15k (saves it for next page)
 */
function paginateText(text: string): string[] {
  const pages: string[] = [];

  // Split text into paragraphs (double newlines)
  const paragraphs = text.split(/\n\n+/);

  let currentPage = '';

  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    const paragraphWithNewline = i === 0 ? paragraph : '\n\n' + paragraph;

    // If current page is empty, add the paragraph regardless of length
    if (currentPage === '') {
      currentPage = paragraph;
    }
    // If adding this paragraph would exceed CHARS_PER_PAGE, save current page and start new one
    else if ((currentPage + paragraphWithNewline).length > CHARS_PER_PAGE) {
      pages.push(currentPage);
      currentPage = paragraph;
    }
    // Otherwise, add paragraph to current page
    else {
      currentPage += paragraphWithNewline;
    }
  }

  // Don't forget the last page
  if (currentPage) {
    pages.push(currentPage);
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

  // Calculate page-based boundaries if we have multiple documents
  if (data.documentBoundaries && data.documentBoundaries.length > 1) {
    calculatePageBoundaries(data.documentBoundaries);
    renderProgressBar(); // Render progress bar after calculating boundaries
  }

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

  // Update progress bar if multi-doc
  updateProgressBar();
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
  eventManager.add(closeBtn, 'click', handleClose);

  // Cancel button
  const cancelBtn = document.getElementById('cancelBtn');
  eventManager.add(cancelBtn, 'click', handleClose);

  // Download button
  const downloadBtn = document.getElementById('downloadBtn');
  eventManager.add(downloadBtn, 'click', handleDownload);

  // Save button
  const saveBtn = document.getElementById('saveBtn');
  eventManager.add(saveBtn, 'click', handleSave);

  // Save & Download Both button
  const saveBothBtn = document.getElementById('saveBothBtn');
  eventManager.add(saveBothBtn, 'click', handleSaveBoth);

  // Copy button
  const copyBtn = document.getElementById('copyBtn');
  eventManager.add(copyBtn, 'click', handleCopy);

  // Send to Chat button
  const sendToChatBtn = document.getElementById('sendToChatBtn');
  eventManager.add(sendToChatBtn, 'click', handleSendToChat);

  // PII Drawer toggle
  const piiDrawerToggle = document.getElementById('piiDrawerToggle');
  eventManager.add(piiDrawerToggle, 'click', togglePIIDrawer);

  // Pagination controls
  const firstPageBtn = document.getElementById('firstPageBtn');
  eventManager.add(firstPageBtn, 'click', () => goToPage(1));

  const prevPageBtn = document.getElementById('prevPageBtn');
  eventManager.add(prevPageBtn, 'click', () => goToPage(currentPage - 1));

  const nextPageBtn = document.getElementById('nextPageBtn');
  eventManager.add(nextPageBtn, 'click', () => goToPage(currentPage + 1));

  const lastPageBtn = document.getElementById('lastPageBtn');
  eventManager.add(lastPageBtn, 'click', () => goToPage(totalPages));

  const pageInput = document.getElementById('pageInput') as HTMLInputElement;
  eventManager.add(pageInput, 'change', (e) => {
    const page = parseInt((e.target as HTMLInputElement).value, 10);
    if (!isNaN(page)) {
      goToPage(page);
    }
  });

  eventManager.add(pageInput, 'keydown', (e) => {
    if ((e as KeyboardEvent).key === 'Enter') {
      const page = parseInt((e.target as HTMLInputElement).value, 10);
      if (!isNaN(page)) {
        goToPage(page);
      }
    }
  });

  // ESC key to close
  eventManager.add(document, 'keydown', (e) => {
    if ((e as KeyboardEvent).key === 'Escape') {
      handleClose();
    }
  });
}

/**
 * Toggle PII drawer open/closed
 */
function togglePIIDrawer() {
  const drawer = document.getElementById('piiDrawer');
  if (drawer) {
    drawer.classList.toggle('collapsed');
  }
}

/**
 * Handle copy to clipboard
 */
async function handleCopy() {
  if (!documentData) return;

  try {
    await navigator.clipboard.writeText(documentData.sanitizedText);
    showSuccess('Sanitized text copied to clipboard!');
  } catch (error) {
    console.error('[Document Preview] Copy error:', error);
    showError('Failed to copy to clipboard');
  }
}

/**
 * Handle send to chat
 */
async function handleSendToChat() {
  if (!documentData) return;

  const sendBtn = document.getElementById('sendToChatBtn') as HTMLButtonElement;
  if (sendBtn) {
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<span class="spinner" style="width: 14px; height: 14px; display: inline-block;"></span> Sending...';
  }

  try {
    // Query for tabs with chat platforms
    const chatPlatforms = [
      'chatgpt.com',
      'chat.openai.com',
      'claude.ai',
      'gemini.google.com',
      'perplexity.ai',
      'copilot.microsoft.com'
    ];

    const tabs = await chrome.tabs.query({ active: true, currentWindow: false });

    // Find a tab with a chat platform
    let targetTab = tabs.find(tab =>
      tab.url && chatPlatforms.some(platform => tab.url!.includes(platform))
    );

    // If no active chat tab, try any chat tab
    if (!targetTab) {
      const allTabs = await chrome.tabs.query({});
      targetTab = allTabs.find(tab =>
        tab.url && chatPlatforms.some(platform => tab.url!.includes(platform))
      );
    }

    if (!targetTab || !targetTab.id) {
      showError('No chat platform found. Please open ChatGPT, Claude, Gemini, Perplexity, or Copilot in another tab.');
      return;
    }

    // Send message to inject the sanitized text
    const response = await chrome.tabs.sendMessage(targetTab.id, {
      type: 'INJECT_TEMPLATE',
      payload: {
        content: documentData.sanitizedText
      }
    });

    if (response && response.success) {
      showSuccess(`Sanitized text sent to ${targetTab.title || 'chat'}!`);
      // Optionally switch to that tab
      await chrome.tabs.update(targetTab.id, { active: true });
    } else {
      showError(response?.error || 'Failed to send text to chat');
    }
  } catch (error: any) {
    console.error('[Document Preview] Send to chat error:', error);
    showError(`Failed to send to chat: ${error.message}`);
  } finally {
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.innerHTML = `
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        Send to Chat
      `;
    }
  }
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

/**
 * Calculate which page each document starts on
 */
function calculatePageBoundaries(boundaries: Array<{ name: string; startChar: number; percentage: number }>) {
  console.log('[Progress Bar] Calculating page boundaries...');

  // Find which page each document header appears on
  documentBoundaries = [];

  for (const boundary of boundaries) {
    // Find which page contains this character position
    let charsSoFar = 0;
    let foundPage = 1;

    for (let i = 0; i < sanitizedPages.length; i++) {
      const pageEndChar = charsSoFar + sanitizedPages[i].length;

      if (boundary.startChar >= charsSoFar && boundary.startChar < pageEndChar) {
        foundPage = i + 1; // Pages are 1-indexed
        break;
      }

      charsSoFar = pageEndChar + 2; // +2 for \n\n between pages
    }

    // Calculate percentage based on page position
    const percentage = ((foundPage - 1) / Math.max(1, totalPages - 1)) * 100;

    documentBoundaries.push({
      name: boundary.name,
      startPage: foundPage,
      percentage: percentage
    });

    console.log(`[Progress Bar] ${boundary.name} starts at page ${foundPage} (${percentage.toFixed(1)}%)`);
  }
}

/**
 * Render progress bar with document markers
 */
function renderProgressBar() {
  const progressBar = document.getElementById('docProgressBar');
  const markersContainer = document.getElementById('progressMarkers');

  if (!progressBar || !markersContainer || documentBoundaries.length === 0) return;

  // Show progress bar
  progressBar.style.display = 'flex';

  // Clear existing markers
  markersContainer.innerHTML = '';

  // Create marker for each document
  documentBoundaries.forEach((boundary, index) => {
    const marker = document.createElement('div');
    marker.className = 'doc-marker';
    marker.textContent = (index + 1).toString();
    marker.style.left = `${boundary.percentage}%`;
    marker.title = boundary.name;
    markersContainer.appendChild(marker);
  });

  console.log('[Progress Bar] Rendered', documentBoundaries.length, 'markers');

  // Initial progress update
  updateProgressBar();
}

/**
 * Update progress bar based on current page
 */
function updateProgressBar() {
  if (documentBoundaries.length === 0) return;

  const progressFill = document.getElementById('progressFill');
  if (!progressFill) return;

  // Calculate progress based on current page
  const progress = (currentPage / totalPages) * 100;
  progressFill.style.width = `${progress}%`;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
