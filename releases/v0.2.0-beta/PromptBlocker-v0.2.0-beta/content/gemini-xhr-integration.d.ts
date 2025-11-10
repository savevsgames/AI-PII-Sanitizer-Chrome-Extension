/**
 * Gemini XHR Integration
 *
 * IMPORTANT: This file is ONLY loaded for Gemini pages.
 * It does NOT affect ChatGPT or Claude (which use fetch interception).
 *
 * Purpose: Integrate XHR interceptor with Gemini's batchexecute API
 * Status: Phase 1 - Basic integration (format parsing in Phase 2)
 */
/**
 * Initialize XHR interception for Gemini ONLY
 * This function is only called on gemini.google.com pages
 */
export declare function initGeminiXHRInterception(): void;
/**
 * Clean up XHR interception (for testing/debugging)
 */
export declare function cleanupGeminiXHRInterception(): void;
//# sourceMappingURL=gemini-xhr-integration.d.ts.map