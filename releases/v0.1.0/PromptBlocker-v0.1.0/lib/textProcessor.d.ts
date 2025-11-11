/**
 * Text Processing Utilities
 * Extracts and replaces text content in various AI service request/response formats
 */
/**
 * Extract all text content from request data
 * Supports ChatGPT, Claude, Gemini, Perplexity, Copilot, and other AI service formats
 */
export declare function extractAllText(data: any): string;
/**
 * Replace all text content in request data with substituted text
 * Maintains original data structure while replacing text content
 */
export declare function replaceAllText(data: any, substitutedText: string): any;
/**
 * Analyze text content for statistics
 */
export declare function analyzeText(text: string): {
    wordCount: number;
    characterCount: number;
    lineCount: number;
};
/**
 * Detect if data contains text content that can be processed
 */
export declare function hasTextContent(data: any): boolean;
/**
 * Extract metadata about the request format
 */
export declare function detectFormat(data: any): 'chatgpt' | 'claude' | 'gemini' | 'perplexity' | 'copilot' | 'unknown';
//# sourceMappingURL=textProcessor.d.ts.map