/**
 * Content Script
 * Injected into AI chat pages to intercept fetch requests and highlight PII
 */

import { Message } from '../lib/types';

// Inject fetch wrapper early
injectFetchInterceptor();

/**
 * Inject fetch interceptor into page context
 * This must run before the page's own scripts
 */
function injectFetchInterceptor() {
  const script = document.createElement('script');
  script.textContent = `
    (function() {
      const originalFetch = window.fetch;

      // Store original fetch for extension use
      window.__originalFetch = originalFetch;

      // Intercept fetch calls to AI APIs
      window.fetch = async function(...args) {
        const [url, options] = args;
        const urlStr = typeof url === 'string' ? url : url.toString();

        // Check if this is an AI API request that should be intercepted
        if (shouldIntercept(urlStr)) {
          try {
            // Notify content script to handle this request
            const event = new CustomEvent('ai-pii-fetch-intercept', {
              detail: {
                url: urlStr,
                method: options?.method || 'GET',
                body: options?.body,
                headers: options?.headers || {}
              }
            });
            document.dispatchEvent(event);

            // Wait for response from extension
            return new Promise((resolve) => {
              const handler = (e) => {
                document.removeEventListener('ai-pii-fetch-response', handler);

                if (e.detail.success) {
                  resolve(new Response(
                    JSON.stringify(e.detail.modifiedResponse),
                    {
                      status: 200,
                      headers: { 'Content-Type': 'application/json' }
                    }
                  ));
                } else {
                  // Fall back to original fetch on error
                  resolve(originalFetch.apply(this, args));
                }
              };
              document.addEventListener('ai-pii-fetch-response', handler);
            });
          } catch (error) {
            console.error('Intercept error:', error);
            return originalFetch.apply(this, args);
          }
        }

        // Pass through if not intercepting
        return originalFetch.apply(this, args);
      };

      function shouldIntercept(url) {
        const aiDomains = [
          'api.openai.com',
          'claude.ai/api',
          'gemini.google.com/api'
        ];
        return aiDomains.some(domain => url.includes(domain));
      }
    })();
  `;

  (document.head || document.documentElement).appendChild(script);
  script.remove();
}

/**
 * Listen for fetch intercept events from page
 */
document.addEventListener('ai-pii-fetch-intercept', async (e: any) => {
  const { url, method, body, headers } = e.detail;

  try {
    // Send to background script for processing
    const response = await chrome.runtime.sendMessage({
      type: 'INTERCEPT_REQUEST',
      payload: { url, method, body, headers }
    } as Message);

    // Send response back to page
    const responseEvent = new CustomEvent('ai-pii-fetch-response', {
      detail: response
    });
    document.dispatchEvent(responseEvent);
  } catch (error) {
    console.error('Error communicating with background script:', error);

    // Send error response
    const responseEvent = new CustomEvent('ai-pii-fetch-response', {
      detail: { success: false, error: (error as Error).message }
    });
    document.dispatchEvent(responseEvent);
  }
});

/**
 * Initialize PII highlighter
 * Highlights PII in input fields as user types
 */
class PIIHighlighter {
  private enabled: boolean = true;

  constructor() {
    this.init();
  }

  async init() {
    // Check if highlighting is enabled
    const response = await chrome.runtime.sendMessage({
      type: 'GET_CONFIG'
    } as Message);

    if (response.success && response.data) {
      this.enabled = response.data.settings.autoHighlight;
    }

    if (this.enabled) {
      this.observeInputFields();
    }
  }

  observeInputFields() {
    // Monitor for new text input fields
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            this.attachToInputs(node as Element);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Attach to existing inputs
    this.attachToInputs(document.body);
  }

  attachToInputs(root: Element | Document) {
    const inputs = root.querySelectorAll(
      'textarea, input[type="text"], [contenteditable="true"]'
    );

    inputs.forEach(input => {
      input.addEventListener('input', this.handleInput.bind(this));
    });
  }

  async handleInput(event: Event) {
    const element = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLElement;
    const text = 'value' in element ? element.value : (element.textContent || '');

    // TODO: Implement PII detection and highlighting
    // This will be added in Phase 2 (Week 5)
    // For now, just log that we're monitoring
    if (text.length > 10) {
      console.log('Monitoring input for PII...');
    }
  }
}

// Initialize highlighter
void new PIIHighlighter();

// Show extension is active
console.log('AI PII Sanitizer: Active');
