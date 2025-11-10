/**
 * API Key Detection Engine
 * Detects common API key formats in text
 */
import { APIKeyFormat } from './types';
export interface DetectedKey {
    value: string;
    format: APIKeyFormat;
    startIndex: number;
    endIndex: number;
    lineNumber?: number;
    context?: string;
}
export declare class APIKeyDetector {
    private static patterns;
    /**
     * Scan text for API keys
     */
    static detect(text: string, options?: {
        includeGeneric?: boolean;
        customPatterns?: RegExp[];
        storedKeys?: string[];
    }): DetectedKey[];
    /**
     * Redact detected keys
     */
    static redact(text: string, detectedKeys: DetectedKey[], mode?: 'full' | 'partial' | 'placeholder'): string;
    /**
     * Detect format from key value
     */
    static detectFormat(key: string): APIKeyFormat;
    /**
     * Get surrounding context for preview
     */
    private static getContext;
    /**
     * Remove duplicate detections (same key at same position)
     */
    private static deduplicateKeys;
}
//# sourceMappingURL=apiKeyDetector.d.ts.map