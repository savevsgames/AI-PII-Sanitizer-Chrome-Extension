/**
 * Injected script that runs in page context
 * This file is loaded via <script src="..."> to bypass CSP
 */

(function() {
  console.log('🛡️ AI PII Sanitizer: Loading...');

  // Get extension ID from data attribute set by content script
  const EXTENSION_ID = document.documentElement.getAttribute('data-ai-pii-extension-id');
  if (!EXTENSION_ID) {
    console.error('❌ AI PII Sanitizer: Extension ID not found');
    return;
  }

  console.log('🔑 Extension ID:', EXTENSION_ID);

  const nativeFetch = window.fetch;
  window.__nativeFetch = nativeFetch;

  let isIntercepting = false;

  window.fetch = async function(...args) {
    if (isIntercepting) {
      return nativeFetch.apply(this, args);
    }

    const [url, options] = args;
    const urlStr = typeof url === 'string' ? url : url.toString();

    // Debug: Log all fetch calls
    console.log('🔍 Fetch called:', urlStr);

    const aiDomains = [
      'api.openai.com',
      'backend-api/conversation',
      'backend-api/f/conversation',
      'claude.ai/api',
      'gemini.google.com/api'
    ];

    if (aiDomains.some(domain => urlStr.includes(domain))) {
      isIntercepting = true;
      console.log('🔒 AI PII Sanitizer: Intercepting', urlStr);

      try {
        const response = await new Promise((resolve) => {
          chrome.runtime.sendMessage(
            EXTENSION_ID,
            {
              type: 'INTERCEPT_REQUEST',
              payload: {
                url: urlStr,
                method: options?.method || 'POST',
                body: options?.body,
                headers: options?.headers || {}
              }
            },
            resolve
          );
        });

        isIntercepting = false;

        if (response && response.success) {
          console.log('✅ AI PII Sanitizer: Processed');
          return new Response(
            JSON.stringify(response.modifiedResponse),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        } else {
          console.warn('⚠️ AI PII Sanitizer: Failed, passing through');
          return nativeFetch.apply(window, args);
        }
      } catch (error) {
        isIntercepting = false;
        console.error('❌ AI PII Sanitizer:', error);
        return nativeFetch.apply(window, args);
      }
    }

    return nativeFetch.apply(window, args);
  };

  console.log('🛡️ AI PII Sanitizer: Active and monitoring');
})();
