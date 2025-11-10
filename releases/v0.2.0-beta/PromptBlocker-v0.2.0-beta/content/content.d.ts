/**
 * Content Script - ISOLATED world
 * Acts as a relay between page context (inject.js) and background script
 *
 * Architecture:
 * inject.js (page) → window.postMessage → content.ts → chrome.runtime.sendMessage → background.ts
 */
export {};
//# sourceMappingURL=content.d.ts.map