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

    // Clear maps between tests (singleton instance persists)
    (engine as any).realToAliasMap.clear();
    (engine as any).aliasToRealMap.clear();
  });

  describe('substitute', () => {
    test('substitutes single name', () => {
      // Manually add aliases for testing - need PIIMapping objects, not simple strings
      const mapping = {
        real: 'Joe Smith',
        alias: 'John Doe',
        profileId: 'test-profile-1',
        profileName: 'Test Profile',
        piiType: 'name' as const,
      };
      (engine as any).realToAliasMap.set('joe smith', mapping);
      (engine as any).aliasToRealMap.set('john doe', mapping);

      const result = engine.substitute('Hello Joe Smith', 'encode');
      expect(result.text).toBe('Hello John Doe');
      expect(result.substitutions.length).toBe(1);
    });

    test('preserves case - uppercase', () => {
      const mapping = {
        real: 'Joe Smith',
        alias: 'John Doe',
        profileId: 'test-profile-1',
        profileName: 'Test Profile',
        piiType: 'name' as const,
      };
      (engine as any).realToAliasMap.set('joe smith', mapping);

      const result = engine.substitute('JOE SMITH is here', 'encode');
      expect(result.text).toBe('JOHN DOE is here');
    });

    test('preserves case - lowercase', () => {
      const mapping = {
        real: 'Joe Smith',
        alias: 'John Doe',
        profileId: 'test-profile-1',
        profileName: 'Test Profile',
        piiType: 'name' as const,
      };
      (engine as any).realToAliasMap.set('joe smith', mapping);

      const result = engine.substitute('joe smith is here', 'encode');
      expect(result.text).toBe('john doe is here');
    });

    test('handles possessives', () => {
      const mapping = {
        real: 'Joe Smith',
        alias: 'John Doe',
        profileId: 'test-profile-1',
        profileName: 'Test Profile',
        piiType: 'name' as const,
      };
      (engine as any).realToAliasMap.set('joe smith', mapping);

      const result = engine.substitute("Joe Smith's car", 'encode');
      expect(result.text).toContain("John Doe's");
    });

    test('bidirectional substitution', () => {
      const mapping = {
        real: 'Joe Smith',
        alias: 'John Doe',
        profileId: 'test-profile-1',
        profileName: 'Test Profile',
        piiType: 'name' as const,
      };
      (engine as any).realToAliasMap.set('joe smith', mapping);
      (engine as any).aliasToRealMap.set('john doe', mapping);

      const encoded = engine.substitute('Meet Joe Smith', 'encode');
      expect(encoded.text).toBe('Meet John Doe');

      const decoded = engine.substitute(encoded.text, 'decode');
      expect(decoded.text).toBe('Meet Joe Smith');
    });

    test('handles multiple names', () => {
      const mapping1 = {
        real: 'Joe Smith',
        alias: 'John Doe',
        profileId: 'test-profile-1',
        profileName: 'Test Profile',
        piiType: 'name' as const,
      };
      const mapping2 = {
        real: 'Sarah Chen',
        alias: 'Emma Wilson',
        profileId: 'test-profile-2',
        profileName: 'Test Profile 2',
        piiType: 'name' as const,
      };
      (engine as any).realToAliasMap.set('joe smith', mapping1);
      (engine as any).realToAliasMap.set('sarah chen', mapping2);

      const result = engine.substitute(
        'Joe Smith and Sarah Chen are friends',
        'encode'
      );

      expect(result.text).toContain('John Doe');
      expect(result.text).toContain('Emma Wilson');
      expect(result.substitutions.length).toBeGreaterThanOrEqual(2);
    });

    test('does not substitute partial matches', () => {
      const mapping = {
        real: 'Joe',
        alias: 'John',
        profileId: 'test-profile-1',
        profileName: 'Test Profile',
        piiType: 'name' as const,
      };
      (engine as any).realToAliasMap.set('joe', mapping);

      const result = engine.substitute('Joelle went to see Joey', 'encode');

      // Should not substitute "Joe" in "Joelle" or "Joey"
      expect(result.text).toBe('Joelle went to see Joey');
    });
  });

  describe('findPII', () => {
    test('finds PII in text', () => {
      const mapping = {
        real: 'Joe Smith',
        alias: 'John Doe',
        profileId: 'test-profile-1',
        profileName: 'Test Profile',
        piiType: 'name' as const,
      };
      (engine as any).realToAliasMap.set('joe smith', mapping);

      const matches = engine.findPII('Hello Joe Smith, how are you?');

      expect(matches.length).toBe(1);
      expect(matches[0].text).toBe('Joe Smith');
      expect(matches[0].alias).toBe('John Doe');
    });

    test('finds multiple PII instances', () => {
      const mapping1 = {
        real: 'Joe Smith',
        alias: 'John Doe',
        profileId: 'test-profile-1',
        profileName: 'Test Profile',
        piiType: 'name' as const,
      };
      const mapping2 = {
        real: 'Sarah Chen',
        alias: 'Emma Wilson',
        profileId: 'test-profile-2',
        profileName: 'Test Profile 2',
        piiType: 'name' as const,
      };
      (engine as any).realToAliasMap.set('joe smith', mapping1);
      (engine as any).realToAliasMap.set('sarah chen', mapping2);

      const matches = engine.findPII('Joe Smith met Sarah Chen yesterday');

      expect(matches.length).toBe(2);
    });
  });
});
