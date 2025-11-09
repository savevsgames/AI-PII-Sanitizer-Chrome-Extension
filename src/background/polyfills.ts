/**
 * Service Worker Polyfills
 * MUST be imported FIRST before any other modules
 * Provides minimal browser API stubs for Firebase SDK compatibility
 */

// Firebase SDK checks for 'document' even in web-extension mode
// This polyfill prevents "document is not defined" errors
if (typeof document === 'undefined') {
  (globalThis as any).document = {
    readyState: 'complete',
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
    createElement: () => ({
      setAttribute: () => {},
      getAttribute: () => null,
      style: {},
    }),
    createEvent: () => ({
      initEvent: () => {},
    }),
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    head: {
      appendChild: () => {},
      removeChild: () => {},
    },
    body: {
      appendChild: () => {},
      removeChild: () => {},
    },
  };
  console.log('[Polyfills] Document stub installed for Firebase SDK');
}

// Window polyfill (some Firebase code checks window.location)
if (typeof window === 'undefined') {
  (globalThis as any).window = {
    location: {
      href: 'chrome-extension://',
      hostname: 'localhost',
      protocol: 'chrome-extension:',
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  console.log('[Polyfills] Window stub installed for Firebase SDK');
}

export {}; // Make this a module
