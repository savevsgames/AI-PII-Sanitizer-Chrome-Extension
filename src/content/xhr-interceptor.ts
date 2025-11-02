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

export class XHRInterceptor {
  private config: XHRInterceptorConfig;
  private enabled: boolean = false;
  private nativeOpen: typeof XMLHttpRequest.prototype.open;
  private nativeSend: typeof XMLHttpRequest.prototype.send;

  constructor(config: XHRInterceptorConfig) {
    this.config = config;

    // Store native methods
    this.nativeOpen = XMLHttpRequest.prototype.open;
    this.nativeSend = XMLHttpRequest.prototype.send;
  }

  /**
   * Enable XHR interception
   */
  public enable(): void {
    if (this.enabled) {
      console.warn('[XHR Interceptor] Already enabled');
      return;
    }

    console.log('[XHR Interceptor] Enabling interception');

    const self = this;

    // Intercept open() to capture URL and method
    XMLHttpRequest.prototype.open = function(
      method: string,
      url: string | URL,
      async: boolean = true,
      username?: string | null,
      password?: string | null
    ): void {
      const urlStr = typeof url === 'string' ? url : url.toString();

      // Store interception data on the XHR instance
      (this as any)._interceptor = {
        url: urlStr,
        method: method.toUpperCase(),
        async: async,
        shouldIntercept: false,
      };

      // Check if we should intercept this request
      try {
        (this as any)._interceptor.shouldIntercept = self.config.shouldIntercept(urlStr, method);
      } catch (error) {
        console.error('[XHR Interceptor] Error in shouldIntercept:', error);
        (this as any)._interceptor.shouldIntercept = false;
      }

      // Call native open
      return self.nativeOpen.call(this, method, url, async, username, password);
    };

    // Intercept send() for request/response handling
    XMLHttpRequest.prototype.send = function(body?: Document | XMLHttpRequestBodyInit | null): void {
      const interceptorData = (this as any)._interceptor;

      // Pass through if not intercepting
      if (!interceptorData || !interceptorData.shouldIntercept) {
        return self.nativeSend.call(this, body);
      }

      // Only support async XHR (sync is deprecated)
      if (!interceptorData.async) {
        console.warn('[XHR Interceptor] Synchronous XHR not supported, passing through');
        return self.nativeSend.call(this, body);
      }

      console.log('[XHR Interceptor] Intercepting XHR:', interceptorData.method, interceptorData.url);

      // Handle async XHR with interception
      self.handleAsyncXHR(this, body, interceptorData);
    };

    this.enabled = true;
    console.log('[XHR Interceptor] ✅ Enabled successfully');
  }

  /**
   * Disable XHR interception (restore native behavior)
   */
  public disable(): void {
    if (!this.enabled) {
      return;
    }

    console.log('[XHR Interceptor] Disabling interception');

    // Restore native methods
    XMLHttpRequest.prototype.open = this.nativeOpen;
    XMLHttpRequest.prototype.send = this.nativeSend;

    this.enabled = false;
    console.log('[XHR Interceptor] ✅ Disabled successfully');
  }

  /**
   * Handle async XHR with request/response interception
   */
  private handleAsyncXHR(
    xhr: XMLHttpRequest,
    originalBody: Document | XMLHttpRequestBodyInit | null | undefined,
    interceptorData: any
  ): void {
    const self = this;

    // Step 1: Intercept and modify request body
    (async () => {
      try {
        // Convert body to string for processing
        const bodyStr = this.bodyToString(originalBody);

        console.log('[XHR Interceptor] Original body length:', bodyStr.length);

        // Call onRequest handler
        const { modifiedBody, metadata } = await this.config.onRequest(
          bodyStr,
          interceptorData.url,
          interceptorData.method
        );

        // Store metadata for response handling
        interceptorData.metadata = metadata;

        console.log('[XHR Interceptor] Modified body length:', this.bodyToString(modifiedBody).length);

        // Step 2: Set up response interceptor
        this.interceptResponse(xhr, interceptorData);

        // Step 3: Send modified request
        self.nativeSend.call(xhr, modifiedBody);

      } catch (error) {
        console.error('[XHR Interceptor] Error in request handling:', error);
        this.config.onError(error as Error);

        // Fallback: send original request
        self.nativeSend.call(xhr, originalBody);
      }
    })();
  }

  /**
   * Intercept XHR response and decode it
   */
  private interceptResponse(xhr: XMLHttpRequest, interceptorData: any): void {
    const self = this;

    // Store original onreadystatechange handler
    const originalOnReadyStateChange = xhr.onreadystatechange;

    // Override onreadystatechange to intercept response
    xhr.onreadystatechange = async function(this: XMLHttpRequest, ev: Event) {
      // Only intercept when response is complete
      if (this.readyState === XMLHttpRequest.DONE) {
        try {
          const originalResponse = this.responseText;

          console.log('[XHR Interceptor] Intercepting response, length:', originalResponse.length);

          // Call onResponse handler
          const decodedResponse = await self.config.onResponse(
            originalResponse,
            interceptorData.metadata
          );

          console.log('[XHR Interceptor] Decoded response, length:', decodedResponse.length);

          // Replace responseText with decoded version
          // Note: We need to override the getter to return our decoded text
          Object.defineProperty(this, 'responseText', {
            value: decodedResponse,
            writable: false,
            configurable: true
          });

          // Also handle response property (might be same as responseText)
          Object.defineProperty(this, 'response', {
            value: this.responseType === '' || this.responseType === 'text'
              ? decodedResponse
              : this.response,
            writable: false,
            configurable: true
          });

        } catch (error) {
          console.error('[XHR Interceptor] Error in response handling:', error);
          self.config.onError(error as Error);
          // Continue with original response (already set)
        }
      }

      // Call original handler if it exists
      if (originalOnReadyStateChange) {
        originalOnReadyStateChange.call(this, ev);
      }
    };

    // Also handle addEventListener('readystatechange')
    const originalAddEventListener = xhr.addEventListener;
    (xhr as any).addEventListener = function(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ) {
      // If adding readystatechange listener, wrap it with our interception
      if (type === 'readystatechange') {
        const wrappedListener = async function(this: XMLHttpRequest, ev: Event) {
          // Our interception already handled via onreadystatechange above
          // Just call the original listener
          if (typeof listener === 'function') {
            listener.call(this, ev);
          } else if (listener && typeof listener.handleEvent === 'function') {
            listener.handleEvent(ev);
          }
        };
        return originalAddEventListener.call(this, type, wrappedListener, options);
      }

      // Pass through other event types
      return originalAddEventListener.call(this, type, listener, options);
    };
  }

  /**
   * Convert various body types to string
   */
  private bodyToString(body: Document | XMLHttpRequestBodyInit | null | undefined): string {
    if (!body) return '';

    if (typeof body === 'string') {
      return body;
    }

    if (body instanceof FormData) {
      // Convert FormData to URLSearchParams string
      const params = new URLSearchParams();
      body.forEach((value, key) => {
        params.append(key, value.toString());
      });
      return params.toString();
    }

    if (body instanceof URLSearchParams) {
      return body.toString();
    }

    if (body instanceof Blob) {
      console.warn('[XHR Interceptor] Blob body not fully supported, converting to string may fail');
      return '[Blob]';
    }

    if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) {
      console.warn('[XHR Interceptor] Binary body not fully supported');
      return '[Binary Data]';
    }

    // Try to stringify as JSON
    try {
      return JSON.stringify(body);
    } catch {
      return String(body);
    }
  }
}
