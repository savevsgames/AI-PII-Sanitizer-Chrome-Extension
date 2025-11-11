/**
 * Document Preview Modal - Shows original vs sanitized text with PII highlighting
 */
import { DocumentAlias } from '../../lib/types';
interface DocumentPreviewModalConfig {
    documentAlias: DocumentAlias;
    onClose: () => void;
}
export declare class DocumentPreviewModal {
    private config;
    private modalElement;
    private eventManager;
    constructor(config: DocumentPreviewModalConfig);
    /**
     * Render and show the modal
     */
    show(): void;
    /**
     * Close and remove the modal
     */
    close(): void;
    /**
     * Render the modal HTML
     */
    private render;
    /**
     * Render comparison view (original vs sanitized)
     */
    private renderComparisonView;
    /**
     * Render PII mapping details
     */
    private renderPIIMapView;
    /**
     * Render metadata view
     */
    private renderMetadataView;
    /**
     * Highlight PII in text
     */
    private highlightPII;
    /**
     * Attach event listeners
     */
    private attachEventListeners;
    /**
     * Switch active tab
     */
    private switchTab;
    /**
     * Handle download document pair
     */
    private handleDownloadPair;
    /**
     * Handle download JSON metadata
     */
    private handleDownloadJSON;
    /**
     * Escape HTML to prevent XSS
     */
    private escapeHtml;
    /**
     * Format file size
     */
    private formatFileSize;
}
export {};
//# sourceMappingURL=documentPreviewModal.d.ts.map