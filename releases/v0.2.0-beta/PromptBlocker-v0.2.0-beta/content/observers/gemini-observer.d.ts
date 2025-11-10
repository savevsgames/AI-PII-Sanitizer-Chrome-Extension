/**
 * Gemini DOM Observer
 * Watches for Gemini response text and replaces aliases with real names
 */
import type { Observer, AliasMapping } from './types';
export declare class GeminiObserver implements Observer {
    private observer;
    private aliases;
    private debounceTimer;
    private isActive;
    private readonly DEBOUNCE_MS;
    private readonly MAX_MUTATIONS_PER_BATCH;
    private readonly RESPONSE_SELECTORS;
    private readonly EXCLUDE_SELECTORS;
    constructor();
    /**
     * Start observing Gemini DOM for responses
     */
    start(): void;
    /**
     * Stop observing
     */
    stop(): void;
    /**
     * Check if observer is running
     */
    isRunning(): boolean;
    /**
     * Update alias mappings
     */
    updateAliases(aliases: AliasMapping[]): void;
    /**
     * Handle mutation events (debounced)
     */
    private handleMutations;
    /**
     * Process mutations and replace text
     */
    private processMutations;
    /**
     * Check if node is a Gemini response (not user message or excluded element)
     */
    private isResponseNode;
    /**
     * Get all text nodes within an element
     */
    private getTextNodes;
    /**
     * Replace aliases with real names in a text node
     */
    private replaceAliasesInText;
    /**
     * Fetch aliases from background script
     */
    private fetchAliases;
    /**
     * Escape special regex characters
     */
    private escapeRegex;
    /**
     * Convert string to Title Case
     */
    private toTitleCase;
}
//# sourceMappingURL=gemini-observer.d.ts.map