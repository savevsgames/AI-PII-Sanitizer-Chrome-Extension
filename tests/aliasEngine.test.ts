/**
 * Unit tests for AliasEngine
 */

import { AliasEngine } from '../src/lib/aliasEngine';

// Mock Chrome Storage API
const mockStorage = {
  local: {
    get: jest.fn(),
    set: jest.fn(),
  },
};

(global as any).chrome = {
  storage: mockStorage,
  runtime: {
    id: 'test-extension-id',
  },
};

describe('AliasEngine', () => {
  let engine: AliasEngine;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock storage to return empty aliases
    mockStorage.local.get.mockResolvedValue({});

    // Get instance (will be initialized with empty aliases)
    engine = await AliasEngine.getInstance();
  });

  describe('substitute', () => {
    test('substitutes single name', () => {
      // Manually add aliases for testing
      (engine as any).realToAliasMap.set('joe smith', 'John Doe');
      (engine as any).aliasToRealMap.set('john doe', 'Joe Smith');

      const result = engine.substitute('Hello Joe Smith', 'encode');
      expect(result.text).toBe('Hello John Doe');
      expect(result.substitutions.length).toBe(1);
    });

    test('preserves case - uppercase', () => {
      (engine as any).realToAliasMap.set('joe smith', 'John Doe');

      const result = engine.substitute('JOE SMITH is here', 'encode');
      expect(result.text).toBe('JOHN DOE is here');
    });

    test('preserves case - lowercase', () => {
      (engine as any).realToAliasMap.set('joe smith', 'John Doe');

      const result = engine.substitute('joe smith is here', 'encode');
      expect(result.text).toBe('john doe is here');
    });

    test('handles possessives', () => {
      (engine as any).realToAliasMap.set('joe smith', 'John Doe');

      const result = engine.substitute("Joe Smith's car", 'encode');
      expect(result.text).toContain("John Doe's");
    });

    test('bidirectional substitution', () => {
      (engine as any).realToAliasMap.set('joe smith', 'John Doe');
      (engine as any).aliasToRealMap.set('john doe', 'Joe Smith');

      const encoded = engine.substitute('Meet Joe Smith', 'encode');
      expect(encoded.text).toBe('Meet John Doe');

      const decoded = engine.substitute(encoded.text, 'decode');
      expect(decoded.text).toBe('Meet Joe Smith');
    });

    test('handles multiple names', () => {
      (engine as any).realToAliasMap.set('joe smith', 'John Doe');
      (engine as any).realToAliasMap.set('sarah chen', 'Emma Wilson');

      const result = engine.substitute(
        'Joe Smith and Sarah Chen are friends',
        'encode'
      );

      expect(result.text).toContain('John Doe');
      expect(result.text).toContain('Emma Wilson');
      expect(result.substitutions.length).toBeGreaterThanOrEqual(2);
    });

    test('does not substitute partial matches', () => {
      (engine as any).realToAliasMap.set('joe', 'John');

      const result = engine.substitute('Joelle went to see Joey', 'encode');

      // Should not substitute "Joe" in "Joelle" or "Joey"
      expect(result.text).toBe('Joelle went to see Joey');
    });
  });

  describe('findPII', () => {
    test('finds PII in text', () => {
      (engine as any).realToAliasMap.set('joe smith', 'John Doe');

      const matches = engine.findPII('Hello Joe Smith, how are you?');

      expect(matches.length).toBe(1);
      expect(matches[0].text).toBe('Joe Smith');
      expect(matches[0].alias).toBe('John Doe');
    });

    test('finds multiple PII instances', () => {
      (engine as any).realToAliasMap.set('joe smith', 'John Doe');
      (engine as any).realToAliasMap.set('sarah chen', 'Emma Wilson');

      const matches = engine.findPII('Joe Smith met Sarah Chen yesterday');

      expect(matches.length).toBe(2);
    });
  });
});
