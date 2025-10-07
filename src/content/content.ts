/**
 * Content Script - ISOLATED world
 * Loads external script to bypass CSP
 */

// Set extension ID as data attribute (accessible from page context)
document.documentElement.setAttribute('data-ai-pii-extension-id', chrome.runtime.id);

// Inject script tag pointing to our external file (allowed by CSP)
const script = document.createElement('script');
script.src = chrome.runtime.getURL('inject.js');
script.onload = () => {
  script.remove();
  console.log('🛡️ AI PII Sanitizer: Injector loaded');
};
(document.head || document.documentElement).appendChild(script);
