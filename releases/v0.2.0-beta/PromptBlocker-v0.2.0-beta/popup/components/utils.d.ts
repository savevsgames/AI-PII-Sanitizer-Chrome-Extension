/**
 * Utility Functions
 * Helper functions used across popup components
 */
export { escapeHtml, safeHTML, safeMap } from '../utils/dom';
/**
 * Validate email format
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Format timestamp as relative time (e.g., "2 hours ago")
 */
export declare function formatRelativeTime(timestamp: number): string;
/**
 * Safely get element by ID with type assertion
 */
export declare function getElementById<T extends HTMLElement>(id: string): T | null;
/**
 * Safely query selector with type assertion
 */
export declare function querySelector<T extends Element>(selector: string): T | null;
/**
 * Safely query selector all with type assertion
 */
export declare function querySelectorAll<T extends Element>(selector: string): NodeListOf<T>;
//# sourceMappingURL=utils.d.ts.map