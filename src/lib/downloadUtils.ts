/**
 * Download Utilities - Helper functions for downloading documents
 */

/**
 * Download text file to user's filesystem
 * @param content - Text content to download
 * @param filename - Name for the downloaded file
 * @param mimeType - MIME type (default: text/plain)
 */
export function downloadTextFile(
  content: string,
  filename: string,
  mimeType: string = 'text/plain'
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);

  console.log('[Download] Downloaded:', filename);
}

/**
 * Download document pair (original + sanitized)
 * @param originalText - Original document text
 * @param sanitizedText - Sanitized document text
 * @param documentName - Original document name
 */
export function downloadDocumentPair(
  originalText: string,
  sanitizedText: string,
  documentName: string
): void {
  // Get base name without extension
  const baseName = documentName.replace(/\.[^/.]+$/, '');

  // Download original
  downloadTextFile(originalText, `${baseName}_original.txt`, 'text/plain');

  // Download sanitized (slight delay to avoid browser blocking multiple downloads)
  setTimeout(() => {
    downloadTextFile(sanitizedText, `${baseName}_sanitized.txt`, 'text/plain');
  }, 200);

  console.log('[Download] Downloaded document pair:', documentName);
}

/**
 * Download JSON export of document alias
 * @param documentAlias - Document alias to export
 */
export function downloadDocumentJSON(documentAlias: any): void {
  const json = JSON.stringify(documentAlias, null, 2);
  const filename = `${documentAlias.documentName.replace(/\.[^/.]+$/, '')}_metadata.json`;

  downloadTextFile(json, filename, 'application/json');

  console.log('[Download] Downloaded JSON:', filename);
}
