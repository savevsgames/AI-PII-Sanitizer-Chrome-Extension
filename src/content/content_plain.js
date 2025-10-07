/**
 * Content Script - Plain JS (not bundled)
 * Running in MAIN world to bypass CSP
 */

console.log('🛡️ AI PII Sanitizer: Loading...');

// Get native fetch
const nativeFetch = window.fetch;
window.__nativeFetch = nativeFetch;

let isIntercepting = false;

function createInterceptor(baseFetch) {
  return async function(...args) {
    if (isIntercepting) {
      return baseFetch.apply(window, args);
    }

    const [url, options] = args;
    const urlStr = typeof url === 'string' ? url : url.toString();

    // Check if this should be intercepted
    const aiDomains = [
      'api.openai.com',
      'backend-api/conversation',
      'claude.ai/api',
      'gemini.google.com/api'
    ];

    const shouldIntercept = aiDomains.some(domain => urlStr.includes(domain));

    if (shouldIntercept) {
      isIntercepting = true;
      console.log('🔒 AI PII Sanitizer: Intercepting', urlStr);

      try {
        const response = await chrome.runtime.sendMessage({
          type: 'INTERCEPT_REQUEST',
          payload: {
            url: urlStr,
            method: options?.method || 'POST',
            body: options?.body,
            headers: options?.headers || {}
          }
        });

        isIntercepting = false;

        if (response && response.success) {
          console.log('✅ AI PII Sanitizer: Processed');
          return new Response(
            JSON.stringify(response.modifiedResponse),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        } else {
          console.warn('⚠️ AI PII Sanitizer: Failed, passing through');
          return baseFetch.apply(window, args);
        }
      } catch (error) {
        isIntercepting = false;
        console.error('❌ AI PII Sanitizer:', error);
        return baseFetch.apply(window, args);
      }
    }

    return baseFetch.apply(window, args);
  };
}

// Apply interceptor
window.fetch = createInterceptor(nativeFetch);

// Re-apply if overwritten
let recheckCount = 0;
const recheckInterval = setInterval(() => {
  const fetchStr = window.fetch.toString();
  if (fetchStr.indexOf('AI PII Sanitizer') === -1) {
    console.warn('⚠️ Fetch overwritten, re-applying');
    window.fetch = createInterceptor(window.fetch);
  }

  recheckCount++;
  if (recheckCount > 20) {
    clearInterval(recheckInterval);
  }
}, 500);

console.log('🛡️ AI PII Sanitizer: Active and monitoring');
