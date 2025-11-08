/**
 * Tests for Alias Variations Engine
 * Auto-generates name, email, and phone format variations to catch all formatting variations
 */

import {
  generateNameVariations,
  generateEmailVariations,
  generatePhoneVariations,
  generateGenericVariations,
  generateIdentityVariations,
  containsVariation,
  findVariations,
  getVariationStats,
} from '../src/lib/aliasVariations';

describe('Alias Variations Engine', () => {
  describe('generateNameVariations', () => {
    it('should generate variations for two-part name', () => {
      const variations = generateNameVariations('Greg Barker');

      expect(variations).toContain('Greg Barker');    // Original
      expect(variations).toContain('GregBarker');     // No space
      expect(variations).toContain('gregbarker');     // Lowercase no space
      expect(variations).toContain('gbarker');        // First initial + last (lowercase)
      expect(variations).toContain('GBarker');        // First initial + last (capitalized)
      expect(variations).toContain('G.Barker');       // Abbreviated with period
      expect(variations).toContain('G. Barker');      // Abbreviated with period and space
      expect(variations).toContain('greg.barker');    // Email-style with dots
      expect(variations).toContain('greg_barker');    // Snake case
      expect(variations).toContain('greg-barker');    // Hyphenated

      // Should have at least 10 variations for a two-part name
      expect(variations.length).toBeGreaterThanOrEqual(10);

      // All variations should be non-empty
      expect(variations.every(v => v.length > 0)).toBe(true);
    });

    it('should handle single word name', () => {
      const variations = generateNameVariations('Madonna');

      expect(variations).toContain('Madonna');
      expect(variations).toContain('madonna');
      expect(variations).toContain('MADONNA');

      // Should have at least 3 variations
      expect(variations.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle three-part name', () => {
      const variations = generateNameVariations('John Paul Smith');

      expect(variations).toContain('John Paul Smith'); // Original
      expect(variations).toContain('JohnSmith');       // Skip middle
      expect(variations).toContain('John Smith');      // Skip middle with space
      expect(variations).toContain('johnsmith');       // Skip middle, lowercase

      // Should have variations for full name
      expect(variations.some(v => v.includes('Paul'))).toBe(true);
    });

    it('should handle name with extra whitespace', () => {
      const variations = generateNameVariations('  Greg   Barker  ');

      expect(variations).toContain('Greg Barker');
      expect(variations).toContain('GregBarker');

      // Should trim extra whitespace and normalize to single spaces
      // (The implementation may include "Greg   Barker" as original before processing)
      // Main check: Should have properly formatted variations
      expect(variations.some(v => v === 'Greg Barker')).toBe(true);
      expect(variations.some(v => v === 'GregBarker')).toBe(true);
    });

    it('should return empty array for empty string', () => {
      const variations = generateNameVariations('');
      expect(variations).toEqual([]);
    });

    it('should return empty array for whitespace only', () => {
      const variations = generateNameVariations('   ');
      expect(variations).toEqual([]);
    });

    it('should generate unique variations (no duplicates)', () => {
      const variations = generateNameVariations('Greg Barker');
      const uniqueVariations = new Set(variations);

      expect(variations.length).toBe(uniqueVariations.size);
    });

    it('should handle names with hyphens', () => {
      const variations = generateNameVariations('Mary-Jane Watson');

      expect(variations).toContain('Mary-Jane Watson');
      // Should treat hyphenated first name as single part
      expect(variations.some(v => v.includes('Mary-Jane'))).toBe(true);
    });
  });

  describe('generateEmailVariations', () => {
    it('should generate email variations', () => {
      const variations = generateEmailVariations('greg.barker@example.com');

      expect(variations).toContain('greg.barker@example.com');  // Original lowercase
      expect(variations).toContain('gregbarker@example.com');   // No dots
      expect(variations).toContain('Greg.barker@example.com');  // Title case local

      // Should have at least 4 variations
      expect(variations.length).toBeGreaterThanOrEqual(4);

      // All variations should have @ symbol
      expect(variations.every(v => v.includes('@'))).toBe(true);
    });

    it('should handle email with underscores', () => {
      const variations = generateEmailVariations('greg_barker@example.com');

      expect(variations).toContain('greg_barker@example.com');
      expect(variations).toContain('greg.barker@example.com');  // Underscores to dots

      // All should be valid email format
      expect(variations.every(v => v.includes('@'))).toBe(true);
    });

    it('should handle email with dots in local part', () => {
      const variations = generateEmailVariations('greg.b.barker@example.com');

      expect(variations).toContain('greg.b.barker@example.com');
      expect(variations).toContain('gregbbarker@example.com');  // Remove all dots
      expect(variations).toContain('greg_b_barker@example.com'); // Dots to underscores
    });

    it('should return empty array for invalid email (no @)', () => {
      const variations = generateEmailVariations('not-an-email');
      expect(variations).toEqual([]);
    });

    it('should return empty array for empty string', () => {
      const variations = generateEmailVariations('');
      expect(variations).toEqual([]);
    });

    it('should preserve domain in all variations', () => {
      const variations = generateEmailVariations('user@example.com');

      // All variations should end with @example.com
      expect(variations.every(v => v.endsWith('@example.com'))).toBe(true);
    });

    it('should generate unique variations', () => {
      const variations = generateEmailVariations('test@example.com');
      const uniqueVariations = new Set(variations);

      expect(variations.length).toBe(uniqueVariations.size);
    });
  });

  describe('generatePhoneVariations', () => {
    it('should generate US phone variations from formatted number', () => {
      const variations = generatePhoneVariations('(555) 123-4567');

      expect(variations).toContain('(555) 123-4567');   // Original
      expect(variations).toContain('5551234567');       // Digits only
      expect(variations).toContain('555-123-4567');     // Dashes
      expect(variations).toContain('555.123.4567');     // Dots
      expect(variations).toContain('+1-555-123-4567');  // Country code with dashes
      expect(variations).toContain('+1 555 123 4567');  // Country code with spaces

      // Should have at least 6 variations
      expect(variations.length).toBeGreaterThanOrEqual(6);
    });

    it('should generate variations from digits-only number', () => {
      const variations = generatePhoneVariations('5551234567');

      expect(variations).toContain('5551234567');
      expect(variations).toContain('(555) 123-4567');
      expect(variations).toContain('555-123-4567');
      expect(variations).toContain('555.123.4567');
    });

    it('should handle 11-digit number with country code', () => {
      const variations = generatePhoneVariations('15551234567');

      expect(variations).toContain('15551234567');
      expect(variations).toContain('+15551234567');
      expect(variations).toContain('+1-555-123-4567');
      expect(variations).toContain('1-555-123-4567');
      expect(variations).toContain('(555) 123-4567');  // Without country code
    });

    it('should handle phone with dots', () => {
      const variations = generatePhoneVariations('555.123.4567');

      expect(variations).toContain('555.123.4567');
      expect(variations).toContain('5551234567');
      expect(variations).toContain('555-123-4567');
    });

    it('should handle empty string', () => {
      const variations = generatePhoneVariations('');
      expect(variations).toEqual([]);
    });

    it('should handle non-phone string gracefully', () => {
      const variations = generatePhoneVariations('abc');

      // Should still return original and attempt to process
      expect(variations).toContain('abc');
      expect(variations.length).toBeGreaterThanOrEqual(1);
    });

    it('should generate unique variations', () => {
      const variations = generatePhoneVariations('(555) 123-4567');
      const uniqueVariations = new Set(variations);

      expect(variations.length).toBe(uniqueVariations.size);
    });
  });

  describe('generateGenericVariations', () => {
    it('should generate case variations for company name', () => {
      const variations = generateGenericVariations('Acme Corporation');

      expect(variations).toContain('Acme Corporation');  // Original
      expect(variations).toContain('acme corporation');  // Lowercase
      expect(variations).toContain('ACME CORPORATION');  // Uppercase

      expect(variations.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle mixed case text', () => {
      const variations = generateGenericVariations('OpenAI Research');

      expect(variations).toContain('OpenAI Research');
      expect(variations).toContain('openai research');
      expect(variations).toContain('OPENAI RESEARCH');
    });

    it('should return empty array for empty string', () => {
      const variations = generateGenericVariations('');
      expect(variations).toEqual([]);
    });

    it('should handle whitespace properly', () => {
      const variations = generateGenericVariations('  Test Company  ');

      expect(variations).toContain('Test Company');
      // Should not have variations with leading/trailing spaces
      expect(variations.every(v => v === v.trim())).toBe(true);
    });
  });

  describe('generateIdentityVariations', () => {
    it('should generate variations for all identity fields', () => {
      const identity = {
        name: 'Greg Barker',
        email: 'greg.barker@example.com',
        phone: '(555) 123-4567',
        company: 'Acme Corp',
      };

      const variations = generateIdentityVariations(identity);

      expect(variations.name).toBeDefined();
      expect(variations.email).toBeDefined();
      expect(variations.phone).toBeDefined();
      expect(variations.company).toBeDefined();

      expect(variations.name.length).toBeGreaterThan(5);
      expect(variations.email.length).toBeGreaterThan(3);
      expect(variations.phone.length).toBeGreaterThan(5);
      expect(variations.company.length).toBeGreaterThan(2);
    });

    it('should handle partial identity data', () => {
      const identity = {
        name: 'Greg Barker',
        email: 'greg@example.com',
        // No phone, company, etc.
      };

      const variations = generateIdentityVariations(identity);

      expect(variations.name).toBeDefined();
      expect(variations.email).toBeDefined();
      expect(variations.phone).toBeUndefined();
      expect(variations.company).toBeUndefined();
    });

    it('should handle cellPhone separately from phone', () => {
      const identity = {
        phone: '(555) 123-4567',
        cellPhone: '(555) 987-6543',
      };

      const variations = generateIdentityVariations(identity);

      expect(variations.phone).toBeDefined();
      expect(variations.cellPhone).toBeDefined();
      expect(variations.phone).not.toEqual(variations.cellPhone);
    });

    it('should handle address variations', () => {
      const identity = {
        address: '123 Main Street',
      };

      const variations = generateIdentityVariations(identity);

      expect(variations.address).toBeDefined();
      expect(variations.address.length).toBeGreaterThan(2);
    });

    it('should return empty object for empty identity', () => {
      const variations = generateIdentityVariations({});

      expect(Object.keys(variations).length).toBe(0);
    });
  });

  describe('containsVariation', () => {
    it('should find variation in text (case-insensitive)', () => {
      const variations = ['GregBarker', 'gregbarker', 'gbarker'];
      const text = 'My username is gregbarker123';

      expect(containsVariation(text, variations)).toBe(true);
    });

    it('should find variation with different case', () => {
      const variations = ['gregbarker'];
      const text = 'My username is GREGBARKER';

      expect(containsVariation(text, variations)).toBe(true);
    });

    it('should not find variation when not present', () => {
      const variations = ['GregBarker', 'gregbarker'];
      const text = 'My name is John Smith';

      expect(containsVariation(text, variations)).toBe(false);
    });

    it('should handle empty variations array', () => {
      expect(containsVariation('test text', [])).toBe(false);
    });

    it('should handle empty text', () => {
      const variations = ['test'];
      expect(containsVariation('', variations)).toBe(false);
    });

    it('should find partial match in longer string', () => {
      const variations = ['Greg'];
      const text = 'Hello Greg, how are you?';

      expect(containsVariation(text, variations)).toBe(true);
    });
  });

  describe('findVariations', () => {
    it('should find all matching variations in text', () => {
      const variations = ['Greg Barker', 'GregBarker', 'gregbarker', 'gbarker'];
      const text = 'User gregbarker logged in as GregBarker';

      const found = findVariations(text, variations);

      expect(found).toContain('gregbarker');
      expect(found).toContain('GregBarker');
      expect(found.length).toBeGreaterThanOrEqual(2);
    });

    it('should return empty array when no variations found', () => {
      const variations = ['test1', 'test2'];
      const text = 'No matches here';

      const found = findVariations(text, variations);
      expect(found).toEqual([]);
    });

    it('should handle case-insensitive matching', () => {
      const variations = ['gregbarker'];
      const text = 'GREGBARKER and GregBarker';

      const found = findVariations(text, variations);
      expect(found.length).toBeGreaterThan(0);
    });

    it('should handle empty variations array', () => {
      const found = findVariations('test text', []);
      expect(found).toEqual([]);
    });

    it('should handle empty text', () => {
      const variations = ['test'];
      const found = findVariations('', variations);
      expect(found).toEqual([]);
    });

    it('should find multiple occurrences of same variation', () => {
      const variations = ['test'];
      const text = 'test test test';

      const found = findVariations(text, variations);
      expect(found).toContain('test');
    });
  });

  describe('getVariationStats', () => {
    it('should calculate variation statistics', () => {
      const variations = {
        name: ['Greg Barker', 'GregBarker', 'gregbarker'],
        email: ['greg.barker@example.com', 'gregbarker@example.com'],
        phone: ['5551234567', '555-123-4567', '(555) 123-4567'],
      };

      const stats = getVariationStats(variations);

      expect(stats.totalVariations).toBe(8);
      expect(stats.byField.name).toBe(3);
      expect(stats.byField.email).toBe(2);
      expect(stats.byField.phone).toBe(3);
    });

    it('should handle empty variations object', () => {
      const stats = getVariationStats({});

      expect(stats.totalVariations).toBe(0);
      expect(Object.keys(stats.byField).length).toBe(0);
    });

    it('should handle single field', () => {
      const variations = {
        name: ['Greg', 'greg', 'GREG'],
      };

      const stats = getVariationStats(variations);

      expect(stats.totalVariations).toBe(3);
      expect(stats.byField.name).toBe(3);
    });

    it('should handle fields with empty arrays', () => {
      const variations = {
        name: ['Greg'],
        email: [],
        phone: ['555'],
      };

      const stats = getVariationStats(variations);

      expect(stats.totalVariations).toBe(2);
      expect(stats.byField.name).toBe(1);
      expect(stats.byField.email).toBe(0);
      expect(stats.byField.phone).toBe(1);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null input gracefully', () => {
      expect(() => generateNameVariations(null as any)).not.toThrow();
      expect(() => generateEmailVariations(null as any)).not.toThrow();
      expect(() => generatePhoneVariations(null as any)).not.toThrow();
    });

    it('should handle undefined input gracefully', () => {
      expect(() => generateNameVariations(undefined as any)).not.toThrow();
      expect(() => generateEmailVariations(undefined as any)).not.toThrow();
      expect(() => generatePhoneVariations(undefined as any)).not.toThrow();
    });

    it('should handle very long names', () => {
      const longName = 'Christopher Alexander Montgomery Bartholomew Winchester III';
      const variations = generateNameVariations(longName);

      expect(variations).toContain(longName);
      expect(variations.length).toBeGreaterThan(0);
    });

    it('should handle names with special characters', () => {
      const variations = generateNameVariations("O'Brien");

      expect(variations).toContain("O'Brien");
      expect(variations.some(v => v.includes("O'Brien"))).toBe(true);
    });

    it('should handle international phone numbers', () => {
      const variations = generatePhoneVariations('+44 20 7946 0958');

      expect(variations).toContain('+44 20 7946 0958');
      expect(variations.length).toBeGreaterThan(0);
    });
  });
});
