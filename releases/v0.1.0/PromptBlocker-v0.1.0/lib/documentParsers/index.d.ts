/**
 * Document Parsers - Export all parsers
 */
export { parsePDF, isPDF } from './pdfParser';
export { parseTXT, isTXT } from './txtParser';
export { parseDocx } from './docxParser';
/**
 * Check if file is DOCX
 */
export declare function isDocx(file: File): boolean;
/**
 * Parse document based on file type
 * @param file - File to parse
 * @returns Promise<string> - Extracted text
 */
export declare function parseDocument(file: File): Promise<string>;
/**
 * Check if file type is supported
 * @param file - File to check
 * @returns boolean
 */
export declare function isSupportedFileType(file: File): boolean;
/**
 * Get supported file extensions
 * @returns string - Comma-separated list for file input accept attribute
 */
export declare function getSupportedExtensions(): string;
//# sourceMappingURL=index.d.ts.map