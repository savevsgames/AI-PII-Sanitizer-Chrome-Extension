/**
 * Jest setup file - runs before all tests
 * Provides global mocks for Chrome APIs and Web Crypto API
 */

const { TextEncoder, TextDecoder } = require('util');
const { Crypto } = require('@peculiar/webcrypto');

// Mock Chrome Storage API
const mockStorageData = {};

const mockStorage = {
  local: {
    get: jest.fn((keys) => {
      if (typeof keys === 'string') {
        return Promise.resolve({ [keys]: mockStorageData[keys] });
      }
      const result = {};
      if (Array.isArray(keys)) {
        keys.forEach((key) => {
          if (mockStorageData[key] !== undefined) {
            result[key] = mockStorageData[key];
          }
        });
      }
      return Promise.resolve(result);
    }),
    set: jest.fn((items) => {
      Object.assign(mockStorageData, items);
      return Promise.resolve();
    }),
    remove: jest.fn((keys) => {
      const keysArray = typeof keys === 'string' ? [keys] : keys;
      keysArray.forEach((key) => delete mockStorageData[key]);
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      Object.keys(mockStorageData).forEach((key) => delete mockStorageData[key]);
      return Promise.resolve();
    }),
    getBytesInUse: jest.fn((keys) => {
      // Mock implementation: calculate approximate size
      const json = JSON.stringify(mockStorageData);
      return Promise.resolve(json.length);
    }),
    QUOTA_BYTES: 10485760, // 10MB
  },
  onChanged: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
    hasListener: jest.fn(() => false),
  },
};

// Setup Web Crypto API polyfill (real implementation for testing encryption)
const crypto = new Crypto();

// Setup global mocks BEFORE any imports
global.chrome = {
  storage: mockStorage,
  runtime: {
    id: 'hwkgjuwvftjkmgja',
    getURL: jest.fn((path) => `chrome-extension://hwkgjuwvftjkmgja/${path}`),
  },
};

global.crypto = crypto;
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill File.text() for Node.js environment (not available in jsdom)
if (typeof File !== 'undefined' && !File.prototype.text) {
  File.prototype.text = function() {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(this);
    });
  };
}

// Polyfill File.arrayBuffer() for Node.js environment (not available in jsdom)
if (typeof File !== 'undefined' && !File.prototype.arrayBuffer) {
  File.prototype.arrayBuffer = function() {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(this);
    });
  };
}

// Export for tests that need to access mock data
module.exports = { mockStorageData, mockStorage };
