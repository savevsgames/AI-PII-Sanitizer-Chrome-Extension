/**
 * Alias Engine - Core substitution logic
 * Handles bidirectional text substitution with case preservation
 * Version 2.0 - Profile-based multi-PII matching
 * Version 2.1 - Added alias variations support
 */
import { AliasProfile, SubstitutionResult, SubstitutionOptions, PIIType } from './types';
export declare class AliasEngine {
    private static instance;
    private profiles;
    private realToAliasMap;
    private aliasToRealMap;
    private constructor();
    static getInstance(): Promise<AliasEngine>;
    /**
     * Load profiles from storage and build lookup maps
     * Handles service worker context gracefully (where encryption may not be available)
     */
    loadProfiles(): Promise<void>;
    /**
     * Set profiles directly (used by popup to send decrypted profiles to service worker)
     * This bypasses encryption issues in service worker context
     */
    setProfiles(profiles: AliasProfile[]): void;
    /**
     * Build efficient lookup maps from all PII fields in profiles
     * Includes variations if enabled
     */
    private buildLookupMaps;
    /**
     * Main substitution function
     * @param text - Text to process
     * @param direction - 'encode' (real→alias) or 'decode' (alias→real)
     * @param options - Optional substitution options
     */
    substitute(text: string, direction: 'encode' | 'decode', options?: SubstitutionOptions): SubstitutionResult;
    /**
     * Find PII in text without substituting
     * Used for highlighting in content script
     */
    findPII(text: string): Array<{
        text: string;
        start: number;
        end: number;
        alias: string;
        profileId: string;
        profileName: string;
        piiType: string;
    }>;
    /**
     * Escape special regex characters
     */
    private escapeRegex;
    /**
     * Preserve case pattern from original to replacement
     * Examples:
     *   "JOE SMITH" → "JOHN DOE"
     *   "Joe Smith" → "John Doe"
     *   "joe smith" → "john doe"
     */
    private preserveCase;
    /**
     * Handle possessive forms: "Joe's car" → "John's car"
     */
    private handlePossessives;
    /**
     * Calculate confidence score based on substitutions
     */
    private calculateConfidence;
    /**
     * Update profile usage statistics
     */
    updateProfileUsage(profileId: string, service: 'chatgpt' | 'claude' | 'gemini', piiType: PIIType): Promise<void>;
    /**
     * Get all enabled profiles
     */
    getProfiles(): AliasProfile[];
    /**
     * Get a single profile by ID
     */
    getProfile(id: string): AliasProfile | undefined;
    /**
     * Reload profiles from storage
     */
    reload(): Promise<void>;
    /**
     * Check if engine has any profiles loaded
     */
    hasProfiles(): boolean;
}
//# sourceMappingURL=aliasEngine.d.ts.map