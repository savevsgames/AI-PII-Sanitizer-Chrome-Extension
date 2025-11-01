/**
 * Jest setup file - runs before all tests
 * Provides global mocks for Chrome APIs and Web Crypto API
 */

const { TextEncoder, TextDecoder } = require('util');

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
  },
};

// Mock Web Crypto API with proper SubtleCrypto implementation
const mockCrypto = {
  getRandomValues: (arr) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  },
  subtle: {
    importKey: jest.fn(() => Promise.resolve({})),
    deriveKey: jest.fn(() => Promise.resolve({})),
    encrypt: jest.fn((algorithm, key, data) => {
      // Simple mock encryption: just return the data as-is
      return Promise.resolve(data);
    }),
    decrypt: jest.fn((algorithm, key, data) => {
      // Simple mock decryption: just return the data as-is
      return Promise.resolve(data);
    }),
  },
};

// Setup global mocks BEFORE any imports
global.chrome = {
  storage: mockStorage,
  runtime: {
    id: 'test-extension-id',
  },
};

global.crypto = mockCrypto;
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Export for tests that need to access mock data
module.exports = { mockStorageData, mockStorage, mockCrypto };
