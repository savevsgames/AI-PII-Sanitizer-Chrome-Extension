/**
 * DOM manipulation utilities with XSS protection
 */
/**
 * Escape HTML to prevent XSS attacks
 * Use this whenever inserting user-generated content into innerHTML
 */
export declare function escapeHtml(text: string): string;
/**
 * Safely render HTML template with escaped user data
 * @param template - Template literal string
 * @param data - Object with values to escape
 * @returns Safe HTML string with escaped values
 *
 * @example
 * const html = safeHTML('<div>${name}</div>', { name: userInput });
 */
export declare function safeHTML(template: string, data: Record<string, string | number | boolean | null | undefined>): string;
/**
 * Safely map array items to HTML with automatic escaping
 * @param items - Array of items to render
 * @param renderFn - Function that returns HTML template for each item
 * @param escapeFields - Fields to escape (user-controlled data)
 * @returns Safe HTML string
 *
 * @example
 * const html = safeMap(
 *   profiles,
 *   (p) => `<div>${p.name}</div>`,
 *   ['name'] // Escape 'name' field
 * );
 */
export declare function safeMap<T extends Record<string, any>>(items: T[], renderFn: (item: T) => string, escapeFields: (keyof T)[]): string;
/**
 * Safely set innerHTML with sanitized content
 * SECURITY: This function sanitizes HTML to prevent XSS attacks
 */
export declare function setInnerHTML(element: HTMLElement, html: string): void;
/**
 * Create element with safe text content
 * Prefer this over template strings when possible
 */
export declare function createElement<K extends keyof HTMLElementTagNameMap>(tag: K, options?: {
    className?: string;
    textContent?: string;
    innerHTML?: string;
    attributes?: Record<string, string>;
    children?: HTMLElement[];
}): HTMLElementTagNameMap[K];
/**
 * Safely add event listener with automatic cleanup
 */
export declare function addEventListenerWithCleanup(element: HTMLElement, event: string, handler: EventListener, abortController?: AbortController): () => void;
/**
 * Remove all children from an element
 */
export declare function clearElement(element: HTMLElement): void;
/**
 * Toggle class on element
 */
export declare function toggleClass(element: HTMLElement, className: string, force?: boolean): boolean;
/**
 * Query selector with type safety
 */
export declare function qs<T extends HTMLElement = HTMLElement>(selector: string, parent?: HTMLElement | Document): T | null;
/**
 * Query selector all with type safety
 */
export declare function qsa<T extends HTMLElement = HTMLElement>(selector: string, parent?: HTMLElement | Document): T[];
//# sourceMappingURL=dom.d.ts.map