/**
 * Document Parsers - Export all parsers
 */

export { parsePDF, isPDF } from './pdfParser';
export { parseTXT, isTXT } from './txtParser';

/**
 * Parse document based on file type
 * @param file - File to parse
 * @returns Promise<string> - Extracted text
 */
export async function parseDocument(file: File): Promise<string> {
  const { parsePDF, isPDF } = await import('./pdfParser');
  const { parseTXT, isTXT } = await import('./txtParser');

  if (isPDF(file)) {
    return await parsePDF(file);
  } else if (isTXT(file)) {
    return await parseTXT(file);
  } else {
    throw new Error(`Unsupported file type: ${file.type || file.name}`);
  }
}

/**
 * Check if file type is supported
 * @param file - File to check
 * @returns boolean
 */
export function isSupportedFileType(file: File): boolean {
  const { isPDF } = require('./pdfParser');
  const { isTXT } = require('./txtParser');

  return isPDF(file) || isTXT(file);
}

/**
 * Get supported file extensions
 * @returns string - Comma-separated list for file input accept attribute
 */
export function getSupportedExtensions(): string {
  return '.pdf,.txt,.text';
}
