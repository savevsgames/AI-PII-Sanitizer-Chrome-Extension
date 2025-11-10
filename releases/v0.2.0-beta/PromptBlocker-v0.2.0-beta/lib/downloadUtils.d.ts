/**
 * Download Utilities - Helper functions for downloading documents
 */
/**
 * Download text file to user's filesystem
 * @param content - Text content to download
 * @param filename - Name for the downloaded file
 * @param mimeType - MIME type (default: text/plain)
 */
export declare function downloadTextFile(content: string, filename: string, mimeType?: string): void;
/**
 * Download document pair (original + sanitized)
 * @param originalText - Original document text
 * @param sanitizedText - Sanitized document text
 * @param documentName - Original document name
 */
export declare function downloadDocumentPair(originalText: string, sanitizedText: string, documentName: string): void;
/**
 * Download JSON export of document alias
 * @param documentAlias - Document alias to export
 */
export declare function downloadDocumentJSON(documentAlias: any): void;
//# sourceMappingURL=downloadUtils.d.ts.map