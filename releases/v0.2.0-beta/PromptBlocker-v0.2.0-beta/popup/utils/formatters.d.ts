/**
 * Formatting Utilities
 * Date, number, and file size formatters
 */
/**
 * Format timestamp as relative time (e.g., "2 hours ago")
 */
export declare function formatRelativeTime(timestamp: number): string;
/**
 * Format date for display
 */
export declare function formatDate(timestamp: number): string;
/**
 * Format number with thousands separators
 */
export declare function formatNumber(num: number): string;
/**
 * Format count with abbreviations (1K, 1M, etc.)
 */
export declare function formatCount(count: number): string;
/**
 * Format file size in bytes to human-readable format
 */
export declare function formatFileSize(bytes: number): string;
/**
 * Format duration in milliseconds
 */
export declare function formatDuration(ms: number): string;
/**
 * Format percentage
 */
export declare function formatPercentage(value: number, total: number): string;
/**
 * Truncate text with ellipsis
 */
export declare function truncateText(text: string, maxLength: number): string;
/**
 * Format API key for display (mask middle characters)
 */
export declare function maskAPIKey(key: string): string;
//# sourceMappingURL=formatters.d.ts.map