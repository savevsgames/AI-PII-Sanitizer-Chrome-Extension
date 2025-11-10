/**
 * Document Preview Modal - Shows original vs sanitized text with PII highlighting
 */

import { DocumentAlias } from '../../lib/types';
import { downloadDocumentPair, downloadDocumentJSON } from '../../lib/downloadUtils';
import { EventManager } from '../utils/eventManager';

interface DocumentPreviewModalConfig {
  documentAlias: DocumentAlias;
  onClose: () => void;
}

export class DocumentPreviewModal {
  private config: DocumentPreviewModalConfig;
  private modalElement: HTMLElement | null = null;
  private eventManager: EventManager = new EventManager();

  constructor(config: DocumentPreviewModalConfig) {
    this.config = config;
  }

  /**
   * Render and show the modal
   */
  show(): void {
    this.render();
    this.attachEventListeners();
  }

  /**
   * Close and remove the modal
   */
  close(): void {
    if (this.modalElement) {
      this.modalElement.remove();
      this.modalElement = null;
    }
    this.config.onClose();
  }

  /**
   * Render the modal HTML
   */
  private render(): void {
    const { documentAlias } = this.config;

    const modal = document.createElement('div');
    modal.className = 'doc-preview-modal-overlay';
    modal.innerHTML = `
      <div class="doc-preview-modal">
        <div class="doc-preview-header">
          <div class="doc-preview-title">
            <svg class="icon-doc" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            <div>
              <h3>${this.escapeHtml(documentAlias.documentName)}</h3>
              <div class="doc-preview-meta">
                ${documentAlias.fileSize ? this.formatFileSize(documentAlias.fileSize) : ''} •
                ${documentAlias.substitutionCount} substitutions •
                ${new Date(documentAlias.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          <button class="doc-preview-close" data-action="close" title="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="doc-preview-tabs">
          <button class="doc-preview-tab active" data-tab="comparison">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            Comparison
          </button>
          <button class="doc-preview-tab" data-tab="pii-map">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            </svg>
            PII Details
          </button>
          <button class="doc-preview-tab" data-tab="metadata">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            Metadata
          </button>
        </div>

        <div class="doc-preview-content">
          <div class="doc-preview-panel active" data-panel="comparison">
            ${this.renderComparisonView()}
          </div>
          <div class="doc-preview-panel" data-panel="pii-map">
            ${this.renderPIIMapView()}
          </div>
          <div class="doc-preview-panel" data-panel="metadata">
            ${this.renderMetadataView()}
          </div>
        </div>

        <div class="doc-preview-actions">
          <button class="btn btn-secondary" data-action="download-pair">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Download Both
          </button>
          <button class="btn btn-secondary" data-action="download-json">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            </svg>
            Export Metadata
          </button>
          <button class="btn btn-primary" data-action="close">Done</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modalElement = modal;
  }

  /**
   * Render comparison view (original vs sanitized)
   */
  private renderComparisonView(): string {
    const { documentAlias } = this.config;

    return `
      <div class="doc-comparison-grid">
        <div class="doc-comparison-column">
          <div class="doc-comparison-header">
            <h4>Original Text</h4>
            <span class="doc-comparison-badge original">Contains PII</span>
          </div>
          <div class="doc-comparison-text" data-type="original">
            ${this.highlightPII(documentAlias.originalText || documentAlias.sanitizedText, 'original')}
          </div>
        </div>
        <div class="doc-comparison-column">
          <div class="doc-comparison-header">
            <h4>Sanitized Text</h4>
            <span class="doc-comparison-badge sanitized">PII Removed</span>
          </div>
          <div class="doc-comparison-text" data-type="sanitized">
            ${this.highlightPII(documentAlias.sanitizedText, 'sanitized')}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render PII mapping details
   */
  private renderPIIMapView(): string {
    const { documentAlias } = this.config;

    if (!documentAlias.piiMap || documentAlias.piiMap.length === 0) {
      return '<div class="doc-empty-state">No PII detected in this document.</div>';
    }

    const piiRows = documentAlias.piiMap
      .map(
        (pii) => `
      <div class="doc-pii-row">
        <div class="doc-pii-type">
          <span class="pii-badge pii-${pii.piiType.toLowerCase()}">${pii.piiType}</span>
          <span class="doc-pii-profile">${this.escapeHtml(pii.profileName)}</span>
        </div>
        <div class="doc-pii-mapping">
          <div class="doc-pii-original">
            <label>Original:</label>
            <code>${this.escapeHtml(pii.realValue)}</code>
          </div>
          <svg class="doc-pii-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
          <div class="doc-pii-alias">
            <label>Alias:</label>
            <code>${this.escapeHtml(pii.aliasValue)}</code>
          </div>
        </div>
        <div class="doc-pii-stats">
          ${pii.occurrences} occurrence${pii.occurrences !== 1 ? 's' : ''}
        </div>
      </div>
    `
      )
      .join('');

    return `<div class="doc-pii-list">${piiRows}</div>`;
  }

  /**
   * Render metadata view
   */
  private renderMetadataView(): string {
    const { documentAlias } = this.config;

    return `
      <div class="doc-metadata-grid">
        <div class="doc-metadata-item">
          <label>Document ID</label>
          <code>${this.escapeHtml(documentAlias.id)}</code>
        </div>
        <div class="doc-metadata-item">
          <label>File Name</label>
          <div>${this.escapeHtml(documentAlias.documentName)}</div>
        </div>
        <div class="doc-metadata-item">
          <label>File Type</label>
          <div>${this.escapeHtml(documentAlias.fileType)}</div>
        </div>
        <div class="doc-metadata-item">
          <label>File Size</label>
          <div>${this.formatFileSize(documentAlias.fileSize)}</div>
        </div>
        <div class="doc-metadata-item">
          <label>Created</label>
          <div>${new Date(documentAlias.createdAt).toLocaleString()}</div>
        </div>
        <div class="doc-metadata-item">
          <label>Last Updated</label>
          <div>${new Date(documentAlias.updatedAt).toLocaleString()}</div>
        </div>
        <div class="doc-metadata-item">
          <label>Substitutions</label>
          <div>${documentAlias.substitutionCount}</div>
        </div>
        <div class="doc-metadata-item">
          <label>Confidence</label>
          <div>${Math.round(documentAlias.confidence * 100)}%</div>
        </div>
        <div class="doc-metadata-item">
          <label>Profiles Used</label>
          <div>${documentAlias.profilesUsed.length} profile${documentAlias.profilesUsed.length !== 1 ? 's' : ''}</div>
        </div>
        <div class="doc-metadata-item">
          <label>Usage Count</label>
          <div>${documentAlias.usageCount}</div>
        </div>
        ${
          documentAlias.lastUsed
            ? `
          <div class="doc-metadata-item">
            <label>Last Used</label>
            <div>${new Date(documentAlias.lastUsed).toLocaleString()}</div>
          </div>
        `
            : ''
        }
        ${
          documentAlias.platform
            ? `
          <div class="doc-metadata-item">
            <label>Platform</label>
            <div>${this.escapeHtml(documentAlias.platform)}</div>
          </div>
        `
            : ''
        }
      </div>
    `;
  }

  /**
   * Highlight PII in text
   */
  private highlightPII(text: string, type: 'original' | 'sanitized'): string {
    if (!text) return '<div class="doc-empty-text">No text available</div>';

    let highlightedText = this.escapeHtml(text);

    // Highlight based on PII map
    if (this.config.documentAlias.piiMap) {
      this.config.documentAlias.piiMap.forEach((pii) => {
        const value = type === 'original' ? pii.realValue : pii.aliasValue;
        const escapedValue = this.escapeHtml(value);
        const regex = new RegExp(escapedValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');

        highlightedText = highlightedText.replace(
          regex,
          `<mark class="pii-highlight pii-${pii.piiType.toLowerCase()}" title="${pii.piiType}">${escapedValue}</mark>`
        );
      });
    }

    return `<div class="doc-text-content">${highlightedText}</div>`;
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    if (!this.modalElement) return;

    // Close button
    this.modalElement.querySelectorAll('[data-action="close"]').forEach((btn) => {
      this.eventManager.add(btn as HTMLElement, 'click', () => this.close());
    });

    // Overlay click
    this.eventManager.add(this.modalElement, 'click', (e) => {
      if (e.target === this.modalElement) {
        this.close();
      }
    });

    // Tab switching
    this.modalElement.querySelectorAll('[data-tab]').forEach((tab) => {
      this.eventManager.add(tab as HTMLElement, 'click', (e) => {
        const tabName = (e.currentTarget as HTMLElement).getAttribute('data-tab');
        this.switchTab(tabName!);
      });
    });

    // Download buttons
    const downloadPairBtn = this.modalElement.querySelector('[data-action="download-pair"]');
    if (downloadPairBtn) {
      this.eventManager.add(downloadPairBtn as HTMLElement, 'click', () => {
        this.handleDownloadPair();
      });
    }

    const downloadJsonBtn = this.modalElement.querySelector('[data-action="download-json"]');
    if (downloadJsonBtn) {
      this.eventManager.add(downloadJsonBtn as HTMLElement, 'click', () => {
        this.handleDownloadJSON();
      });
    }

    // ESC key to close
    const handleEscape = (e: Event) => {
      if ((e as KeyboardEvent).key === 'Escape') {
        this.close();
      }
    };
    this.eventManager.add(document, 'keydown', handleEscape);
  }

  /**
   * Switch active tab
   */
  private switchTab(tabName: string): void {
    if (!this.modalElement) return;

    // Update tab buttons
    this.modalElement.querySelectorAll('[data-tab]').forEach((tab) => {
      tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
    });

    // Update panels
    this.modalElement.querySelectorAll('[data-panel]').forEach((panel) => {
      panel.classList.toggle('active', panel.getAttribute('data-panel') === tabName);
    });
  }

  /**
   * Handle download document pair
   */
  private handleDownloadPair(): void {
    const { documentAlias } = this.config;

    downloadDocumentPair(
      documentAlias.originalText || documentAlias.sanitizedText,
      documentAlias.sanitizedText,
      documentAlias.documentName
    );

    console.log('[DocumentPreviewModal] Downloaded document pair');
  }

  /**
   * Handle download JSON metadata
   */
  private handleDownloadJSON(): void {
    const { documentAlias } = this.config;

    downloadDocumentJSON(documentAlias);

    console.log('[DocumentPreviewModal] Downloaded JSON metadata');
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Format file size
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${Math.round(bytes / Math.pow(k, i) * 100) / 100} ${sizes[i]}`;
  }
}
