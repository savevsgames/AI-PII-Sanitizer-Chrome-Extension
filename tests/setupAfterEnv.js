/**
 * Jest setupAfterEnv file - runs after test environment is initialized
 * Overrides jsdom's incomplete crypto with @peculiar/webcrypto
 */

const { Crypto } = require('@peculiar/webcrypto');

// Override global.crypto with full Web Crypto API implementation
// jsdom provides a stub crypto object, but it doesn't have subtle
const crypto = new Crypto();
Object.defineProperty(global, 'crypto', {
  value: crypto,
  writable: false,
  configurable: true,
});

console.log('[Test Setup] Web Crypto API polyfill loaded - crypto.subtle available:', !!global.crypto.subtle);
