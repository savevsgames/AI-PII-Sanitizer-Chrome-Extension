/**
 * Gemini XHR Integration
 *
 * IMPORTANT: This file is ONLY loaded for Gemini pages.
 * It does NOT affect ChatGPT or Claude (which use fetch interception).
 *
 * Purpose: Integrate XHR interceptor with Gemini's batchexecute API
 * Status: Phase 1 - Basic integration (format parsing in Phase 2)
 */

import { XHRInterceptor } from './xhr-interceptor';

/**
 * Initialize XHR interception for Gemini ONLY
 * This function is only called on gemini.google.com pages
 */
export function initGeminiXHRInterception(): void {
  console.log('[Gemini XHR] Initializing XHR interception for Gemini');

  // Safety check: only run on Gemini
  if (!window.location.hostname.includes('gemini.google.com')) {
    console.warn('[Gemini XHR] Not on Gemini domain, skipping XHR interception');
    return;
  }

  const interceptor = new XHRInterceptor({
    shouldIntercept: (url: string, method: string) => {
      // Only intercept POST requests to BardChatUi batchexecute endpoint
      const shouldIntercept = method === 'POST' &&
        (url.includes('BardChatUi') || url.includes('batchexecute'));

      if (shouldIntercept) {
        console.log('[Gemini XHR] Will intercept:', method, url);
      }

      return shouldIntercept;
    },

    onRequest: async (body: any, url: string, _method: string) => {
      console.log('[Gemini XHR] 🔒 Request interception');
      console.log('[Gemini XHR] URL:', url);
      console.log('[Gemini XHR] Body length:', body.length);
      console.log('[Gemini XHR] Body preview:', body.substring(0, 200));

      // Phase 1: Pass through unchanged (no parsing yet)
      // Phase 2 will implement batchexecute format parsing

      // TODO Phase 2: Parse batchexecute format
      // TODO Phase 2: Extract text content
      // TODO Phase 2: Send to background for substitution
      // TODO Phase 2: Reconstruct batchexecute format

      // For now, return original body unchanged
      return {
        modifiedBody: body,
        metadata: {
          originalBody: body,
          url: url,
          timestamp: Date.now()
        }
      };
    },

    onResponse: async (responseText: string, _metadata: any) => {
      console.log('[Gemini XHR] 🔓 Response interception');
      console.log('[Gemini XHR] Response length:', responseText.length);
      console.log('[Gemini XHR] Response preview:', responseText.substring(0, 200));

      // Phase 1: Pass through unchanged (no parsing yet)
      // Phase 2 will implement batchexecute response parsing

      // TODO Phase 2: Parse batchexecute response format
      // TODO Phase 2: Extract response text
      // TODO Phase 2: Send to background for decoding
      // TODO Phase 2: Reconstruct batchexecute response

      // For now, return original response unchanged
      return responseText;
    },

    onError: (error: Error) => {
      console.error('[Gemini XHR] ❌ Interception error:', error);
      // Non-fatal - XHR will fall back to original behavior
    }
  });

  // Enable the interceptor
  interceptor.enable();

  console.log('[Gemini XHR] ✅ XHR interception initialized for Gemini');

  // Store interceptor reference for potential cleanup
  (window as any).__geminiXHRInterceptor = interceptor;
}

/**
 * Clean up XHR interception (for testing/debugging)
 */
export function cleanupGeminiXHRInterception(): void {
  const interceptor = (window as any).__geminiXHRInterceptor;
  if (interceptor) {
    interceptor.disable();
    delete (window as any).__geminiXHRInterceptor;
    console.log('[Gemini XHR] ✅ XHR interception cleaned up');
  }
}
