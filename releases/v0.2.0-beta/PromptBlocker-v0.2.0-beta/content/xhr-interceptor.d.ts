/**
 * Generic XMLHttpRequest Interceptor
 *
 * Provides a reusable framework for intercepting XHR requests and responses
 * for services that don't use fetch() API (e.g., Gemini).
 *
 * Design Goals:
 * - Non-breaking: Preserves XHR API contract completely
 * - Async-friendly: Converts XHR to promise-based flow
 * - Service-agnostic: Works with any XHR-based service
 * - Error-resilient: Fails gracefully, falls back to native XHR
 *
 * @example
 * const interceptor = new XHRInterceptor({
 *   shouldIntercept: (url, method) => url.includes('/api/'),
 *   onRequest: async (body, url) => ({ modifiedBody: body, metadata: {} }),
 *   onResponse: async (text, metadata) => text,
 *   onError: (error) => console.error(error)
 * });
 * interceptor.enable();
 */
export interface XHRInterceptorConfig {
    /**
     * Determine if a request should be intercepted
     * @param url - Request URL
     * @param method - HTTP method (GET, POST, etc.)
     * @returns true to intercept, false to pass through
     */
    shouldIntercept: (url: string, method: string) => boolean;
    /**
     * Handle request interception (substitute real → alias)
     * @param body - Original request body
     * @param url - Request URL
     * @param method - HTTP method
     * @returns Modified body and metadata for response handling
     */
    onRequest: (body: any, url: string, method: string) => Promise<{
        modifiedBody: any;
        metadata?: any;
    }>;
    /**
     * Handle response interception (decode alias → real)
     * @param responseText - Original response text
     * @param metadata - Metadata from request handling
     * @returns Modified response text
     */
    onResponse: (responseText: string, metadata: any) => Promise<string>;
    /**
     * Handle errors during interception
     * @param error - Error that occurred
     */
    onError: (error: Error) => void;
}
export declare class XHRInterceptor {
    private config;
    private enabled;
    private nativeOpen;
    private nativeSend;
    constructor(config: XHRInterceptorConfig);
    /**
     * Enable XHR interception
     */
    enable(): void;
    /**
     * Disable XHR interception (restore native behavior)
     */
    disable(): void;
    /**
     * Handle async XHR with request/response interception
     */
    private handleAsyncXHR;
    /**
     * Intercept XHR response and decode it
     */
    private interceptResponse;
    /**
     * Convert various body types to string
     */
    private bodyToString;
}
//# sourceMappingURL=xhr-interceptor.d.ts.map