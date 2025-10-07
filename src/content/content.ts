/**
 * Content Script - ISOLATED world
 * Acts as a relay between page context (inject.js) and background script
 *
 * Architecture:
 * inject.js (page) → window.postMessage → content.ts → chrome.runtime.sendMessage → background.ts
 */

// Inject the fetch interceptor script into page context
const script = document.createElement('script');
script.src = chrome.runtime.getURL('inject.js');
script.onload = () => {
  script.remove();
  console.log('🛡️ AI PII Sanitizer: Injector loaded');
};
(document.head || document.documentElement).appendChild(script);

// Listen for messages from inject.js (page context)
window.addEventListener('message', async (event) => {
  // Only accept messages from our own page
  if (event.source !== window) return;

  // Check if message is from our inject script
  if (event.data?.source !== 'ai-pii-inject') return;

  const { messageId, type, payload } = event.data;

  console.log('🔄 Content script relaying:', type);

  try {
    // Forward to background script
    const response = await chrome.runtime.sendMessage({
      type,
      payload
    });

    // Send response back to inject.js
    window.postMessage({
      source: 'ai-pii-content',
      messageId,
      response
    }, '*');
  } catch (error) {
    console.error('❌ Content script relay error:', error);

    // Check if extension was invalidated (common during development)
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('Extension context invalidated')) {
      console.warn('⚠️ Extension reloaded - please refresh this page (Ctrl+Shift+R)');
    }

    // Send error response back
    window.postMessage({
      source: 'ai-pii-content',
      messageId,
      response: {
        success: false,
        error: errorMsg
      }
    }, '*');
  }
});
