/**
 * Unit tests for RedactionEngine
 * Tests pattern matching, text replacement, and custom rule application
 */

import { RedactionEngine } from '../src/lib/redactionEngine';
import { CustomRule } from '../src/lib/types';

describe('RedactionEngine', () => {
  let engine: RedactionEngine;

  beforeEach(() => {
    engine = new RedactionEngine();
  });

  describe('compileRules', () => {
    test('compiles enabled rules', () => {
      const rules: CustomRule[] = [
        {
          id: 'rule1',
          name: 'Test Rule',
          pattern: '\\d{3}-\\d{2}-\\d{4}',
          replacement: '[SSN]',
          category: 'pii',
          priority: 100,
          enabled: true,
          matchCount: 0,
        },
      ];

      engine.compileRules(rules);
      const result = engine.applyRules('SSN: 123-45-6789', rules);

      expect(result.modifiedText).toBe('SSN: [SSN]');
      expect(result.matches.length).toBe(1);
    });

    test('skips disabled rules', () => {
      const rules: CustomRule[] = [
        {
          id: 'rule1',
          name: 'Disabled Rule',
          pattern: '\\d{3}-\\d{2}-\\d{4}',
          replacement: '[SSN]',
          category: 'pii',
          priority: 100,
          enabled: false,
          matchCount: 0,
        },
      ];

      engine.compileRules(rules);
      const result = engine.applyRules('SSN: 123-45-6789', rules);

      expect(result.modifiedText).toBe('SSN: 123-45-6789');
      expect(result.matches.length).toBe(0);
    });

    test('sorts rules by priority (highest first)', () => {
      const rules: CustomRule[] = [
        {
          id: 'rule1',
          name: 'Low Priority',
          pattern: '\\d+',
          replacement: '[LOW]',
          category: 'custom',
          priority: 50,
          enabled: true,
          matchCount: 0,
        },
        {
          id: 'rule2',
          name: 'High Priority',
          pattern: '\\d{3}-\\d{2}-\\d{4}',
          replacement: '[HIGH]',
          category: 'pii',
          priority: 100,
          enabled: true,
          matchCount: 0,
        },
      ];

      engine.compileRules(rules);
      const result = engine.applyRules('SSN: 123-45-6789', rules);

      // High priority rule should match first (more specific pattern)
      expect(result.modifiedText).toBe('SSN: [HIGH]');
      expect(result.rulesApplied).toContain('rule2');
    });

    test('handles invalid regex patterns gracefully', () => {
      const rules: CustomRule[] = [
        {
          id: 'rule1',
          name: 'Invalid Pattern',
          pattern: '[invalid(regex',
          replacement: '[REDACTED]',
          category: 'custom',
          priority: 100,
          enabled: true,
          matchCount: 0,
        },
      ];

      // Should not throw
      expect(() => engine.compileRules(rules)).not.toThrow();

      // Should return original text since rule didn't compile
      const result = engine.applyRules('test text', rules);
      expect(result.modifiedText).toBe('test text');
    });
  });

  describe('applyRules', () => {
    describe('SSN Pattern', () => {
      test('redacts Social Security Numbers', () => {
        const rules: CustomRule[] = [
          {
            id: 'ssn',
            name: 'SSN',
            pattern: '\\d{3}-\\d{2}-\\d{4}',
            replacement: '[REDACTED_SSN]',
            category: 'pii',
            priority: 100,
            enabled: true,
            matchCount: 0,
          },
        ];

        const result = engine.applyRules('My SSN is 123-45-6789', rules);

        expect(result.modifiedText).toBe('My SSN is [REDACTED_SSN]');
        expect(result.matches.length).toBe(1);
        expect(result.matches[0].match).toBe('123-45-6789');
        expect(result.rulesApplied).toContain('ssn');
      });

      test('redacts multiple SSNs', () => {
        const rules: CustomRule[] = [
          {
            id: 'ssn',
            name: 'SSN',
            pattern: '\\d{3}-\\d{2}-\\d{4}',
            replacement: '[SSN]',
            category: 'pii',
            priority: 100,
            enabled: true,
            matchCount: 0,
          },
        ];

        const result = engine.applyRules('SSNs: 123-45-6789 and 987-65-4321', rules);

        expect(result.modifiedText).toBe('SSNs: [SSN] and [SSN]');
        expect(result.matches.length).toBe(2);
      });
    });

    describe('Credit Card Pattern', () => {
      test('redacts credit card numbers', () => {
        const rules: CustomRule[] = [
          {
            id: 'cc',
            name: 'Credit Card',
            pattern: '\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}',
            replacement: '[CREDIT_CARD]',
            category: 'financial',
            priority: 100,
            enabled: true,
            matchCount: 0,
          },
        ];

        const result = engine.applyRules('Card: 1234-5678-9012-3456', rules);

        expect(result.modifiedText).toBe('Card: [CREDIT_CARD]');
        expect(result.matches[0].match).toBe('1234-5678-9012-3456');
      });

      test('handles credit cards with spaces', () => {
        const rules: CustomRule[] = [
          {
            id: 'cc',
            name: 'Credit Card',
            pattern: '\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}',
            replacement: '[CREDIT_CARD]',
            category: 'financial',
            priority: 100,
            enabled: true,
            matchCount: 0,
          },
        ];

        const result = engine.applyRules('Card: 1234 5678 9012 3456', rules);

        expect(result.modifiedText).toBe('Card: [CREDIT_CARD]');
      });
    });

    describe('Phone Number Pattern', () => {
      test('redacts phone numbers', () => {
        const rules: CustomRule[] = [
          {
            id: 'phone',
            name: 'Phone',
            pattern: '\\(\\d{3}\\)\\s*\\d{3}-\\d{4}',
            replacement: '[PHONE]',
            category: 'pii',
            priority: 100,
            enabled: true,
            matchCount: 0,
          },
        ];

        const result = engine.applyRules('Call me at (555) 123-4567', rules);

        expect(result.modifiedText).toBe('Call me at [PHONE]');
        expect(result.matches[0].match).toBe('(555) 123-4567');
      });
    });

    describe('IP Address Pattern', () => {
      test('redacts IP addresses', () => {
        const rules: CustomRule[] = [
          {
            id: 'ip',
            name: 'IP Address',
            pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b',
            replacement: '[IP_ADDRESS]',
            category: 'technical',
            priority: 100,
            enabled: true,
            matchCount: 0,
          },
        ];

        const result = engine.applyRules('Server IP: 192.168.1.1', rules);

        expect(result.modifiedText).toBe('Server IP: [IP_ADDRESS]');
        expect(result.matches[0].match).toBe('192.168.1.1');
      });
    });

    describe('Email Pattern', () => {
      test('redacts email addresses', () => {
        const rules: CustomRule[] = [
          {
            id: 'email',
            name: 'Email',
            pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
            replacement: '[EMAIL]',
            category: 'pii',
            priority: 100,
            enabled: true,
            matchCount: 0,
          },
        ];

        const result = engine.applyRules('Contact: john@example.com', rules);

        expect(result.modifiedText).toBe('Contact: [EMAIL]');
        expect(result.matches[0].match).toBe('john@example.com');
      });
    });

    describe('Capture Groups', () => {
      test('supports $1, $2 capture group replacements', () => {
        const rules: CustomRule[] = [
          {
            id: 'capture',
            name: 'Capture Test',
            pattern: '(\\w+)@(\\w+\\.\\w+)',
            replacement: '[USER:$1][DOMAIN:$2]',
            category: 'custom',
            priority: 100,
            enabled: true,
            matchCount: 0,
          },
        ];

        const result = engine.applyRules('Email: john@example.com', rules);

        expect(result.modifiedText).toBe('Email: [USER:john][DOMAIN:example.com]');
      });

      test('supports $& full match replacement', () => {
        const rules: CustomRule[] = [
          {
            id: 'fullmatch',
            name: 'Full Match Test',
            pattern: '\\d{3}-\\d{4}',
            replacement: '[REDACTED:$&]',
            category: 'custom',
            priority: 100,
            enabled: true,
            matchCount: 0,
          },
        ];

        const result = engine.applyRules('Number: 555-1234', rules);

        expect(result.modifiedText).toBe('Number: [REDACTED:555-1234]');
      });

      test('handles capture groups correctly', () => {
        const rules: CustomRule[] = [
          {
            id: 'capture',
            name: 'Capture Test',
            pattern: '(\\d+)',
            replacement: 'NUM:$1',
            category: 'custom',
            priority: 100,
            enabled: true,
            matchCount: 0,
          },
        ];

        const result = engine.applyRules('Number: 123', rules);

        expect(result.modifiedText).toBe('Number: NUM:123');
        expect(result.matches[0].replacement).toBe('NUM:123');
      });
    });

    describe('Multiple Rules', () => {
      test('applies multiple rules in priority order', () => {
        const rules: CustomRule[] = [
          {
            id: 'rule1',
            name: 'Generic Number',
            pattern: '\\d+',
            replacement: '[NUM]',
            category: 'custom',
            priority: 50,
            enabled: true,
            matchCount: 0,
          },
          {
            id: 'rule2',
            name: 'SSN',
            pattern: '\\d{3}-\\d{2}-\\d{4}',
            replacement: '[SSN]',
            category: 'pii',
            priority: 100,
            enabled: true,
            matchCount: 0,
          },
        ];

        const result = engine.applyRules('SSN: 123-45-6789, ZIP: 12345', rules);

        // High priority rule matches first
        expect(result.modifiedText).toContain('[SSN]');
        expect(result.rulesApplied.length).toBeGreaterThan(0);
      });

      test('tracks which rules were applied', () => {
        const rules: CustomRule[] = [
          {
            id: 'ssn',
            name: 'SSN',
            pattern: '\\d{3}-\\d{2}-\\d{4}',
            replacement: '[SSN]',
            category: 'pii',
            priority: 100,
            enabled: true,
            matchCount: 0,
          },
          {
            id: 'phone',
            name: 'Phone',
            pattern: '\\(\\d{3}\\)\\s*\\d{3}-\\d{4}',
            replacement: '[PHONE]',
            category: 'pii',
            priority: 90,
            enabled: true,
            matchCount: 0,
          },
        ];

        const result = engine.applyRules(
          'SSN: 123-45-6789, Phone: (555) 123-4567',
          rules
        );

        expect(result.rulesApplied).toContain('ssn');
        expect(result.rulesApplied).toContain('phone');
        expect(result.rulesApplied.length).toBe(2);
      });
    });

    describe('Edge Cases', () => {
      test('handles empty text', () => {
        const rules: CustomRule[] = [
          {
            id: 'rule1',
            name: 'Test',
            pattern: '\\d+',
            replacement: '[NUM]',
            category: 'custom',
            priority: 100,
            enabled: true,
            matchCount: 0,
          },
        ];

        const result = engine.applyRules('', rules);

        expect(result.modifiedText).toBe('');
        expect(result.matches.length).toBe(0);
      });

      test('handles empty rules array', () => {
        const result = engine.applyRules('test text', []);

        expect(result.modifiedText).toBe('test text');
        expect(result.matches.length).toBe(0);
        expect(result.rulesApplied.length).toBe(0);
      });

      test('handles text with no matches', () => {
        const rules: CustomRule[] = [
          {
            id: 'rule1',
            name: 'SSN',
            pattern: '\\d{3}-\\d{2}-\\d{4}',
            replacement: '[SSN]',
            category: 'pii',
            priority: 100,
            enabled: true,
            matchCount: 0,
          },
        ];

        const result = engine.applyRules('No SSN here', rules);

        expect(result.modifiedText).toBe('No SSN here');
        expect(result.matches.length).toBe(0);
      });

      test('preserves text order with overlapping patterns', () => {
        const rules: CustomRule[] = [
          {
            id: 'rule1',
            name: 'Three Digits',
            pattern: '\\d{3}',
            replacement: '[3D]',
            category: 'custom',
            priority: 100,
            enabled: true,
            matchCount: 0,
          },
        ];

        const result = engine.applyRules('Numbers: 123 456 789', rules);

        expect(result.modifiedText).toBe('Numbers: [3D] [3D] [3D]');
        expect(result.matches.length).toBe(3);
      });
    });

    describe('Match Details', () => {
      test('returns correct match indices', () => {
        const rules: CustomRule[] = [
          {
            id: 'rule1',
            name: 'SSN',
            pattern: '\\d{3}-\\d{2}-\\d{4}',
            replacement: '[SSN]',
            category: 'pii',
            priority: 100,
            enabled: true,
            matchCount: 0,
          },
        ];

        const text = 'SSN: 123-45-6789 here';
        const result = engine.applyRules(text, rules);

        expect(result.matches[0].startIndex).toBe(5);
        expect(result.matches[0].endIndex).toBe(16);
        expect(text.substring(result.matches[0].startIndex, result.matches[0].endIndex)).toBe(
          '123-45-6789'
        );
      });

      test('includes rule metadata in matches', () => {
        const rules: CustomRule[] = [
          {
            id: 'test-rule',
            name: 'Test Rule Name',
            pattern: '\\d+',
            replacement: '[NUM]',
            category: 'custom',
            priority: 100,
            enabled: true,
            matchCount: 0,
          },
        ];

        const result = engine.applyRules('Number: 123', rules);

        expect(result.matches[0].ruleId).toBe('test-rule');
        expect(result.matches[0].ruleName).toBe('Test Rule Name');
        expect(result.matches[0].replacement).toBe('[NUM]');
      });
    });
  });

  describe('validatePattern', () => {
    test('validates correct patterns', () => {
      const result = RedactionEngine.validatePattern('\\d{3}-\\d{2}-\\d{4}');

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('detects invalid patterns', () => {
      const result = RedactionEngine.validatePattern('[invalid(regex');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('accepts simple patterns', () => {
      const result = RedactionEngine.validatePattern('hello');

      expect(result.valid).toBe(true);
    });

    test('accepts complex patterns', () => {
      const result = RedactionEngine.validatePattern(
        '^(?:[a-z0-9!#$%&\'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&\'*+/=?^_`{|}~-]+)*|"(?:[\\x01-\\x08\\x0b\\x0c\\x0e-\\x1f\\x21\\x23-\\x5b\\x5d-\\x7f]|\\\\[\\x01-\\x09\\x0b\\x0c\\x0e-\\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\\x01-\\x08\\x0b\\x0c\\x0e-\\x1f\\x21-\\x5a\\x53-\\x7f]|\\\\[\\x01-\\x09\\x0b\\x0c\\x0e-\\x7f])+)\\])$'
      );

      expect(result.valid).toBe(true);
    });
  });

  describe('testRule', () => {
    test('returns matches for valid pattern', () => {
      const rule: CustomRule = {
        id: 'ssn',
        name: 'SSN',
        pattern: '\\d{3}-\\d{2}-\\d{4}',
        replacement: '[SSN]',
        category: 'pii',
        priority: 100,
        enabled: true,
        matchCount: 0,
      };

      const result = RedactionEngine.testRule(rule, 'SSN: 123-45-6789');

      expect(result.matches.length).toBe(1);
      expect(result.matches[0]).toBe('123-45-6789');
      expect(result.replacements[0]).toBe('[SSN]');
      expect(result.error).toBeUndefined();
    });

    test('returns multiple matches', () => {
      const rule: CustomRule = {
        id: 'phone',
        name: 'Phone',
        pattern: '\\d{3}-\\d{4}',
        replacement: '[PHONE]',
        category: 'pii',
        priority: 100,
        enabled: true,
        matchCount: 0,
      };

      const result = RedactionEngine.testRule(rule, 'Phones: 555-1234 and 555-5678');

      expect(result.matches.length).toBe(2);
      expect(result.matches).toEqual(['555-1234', '555-5678']);
    });

    test('handles capture groups in replacement', () => {
      const rule: CustomRule = {
        id: 'email',
        name: 'Email',
        pattern: '(\\w+)@(\\w+\\.\\w+)',
        replacement: '[USER:$1]',
        category: 'pii',
        priority: 100,
        enabled: true,
        matchCount: 0,
      };

      const result = RedactionEngine.testRule(rule, 'Email: john@example.com');

      expect(result.replacements[0]).toBe('[USER:john]');
    });

    test('returns error for invalid pattern', () => {
      const rule: CustomRule = {
        id: 'invalid',
        name: 'Invalid',
        pattern: '[invalid(regex',
        replacement: '[X]',
        category: 'custom',
        priority: 100,
        enabled: true,
        matchCount: 0,
      };

      const result = RedactionEngine.testRule(rule, 'test');

      expect(result.matches.length).toBe(0);
      expect(result.error).toBeDefined();
    });

    test('returns empty arrays when no matches', () => {
      const rule: CustomRule = {
        id: 'ssn',
        name: 'SSN',
        pattern: '\\d{3}-\\d{2}-\\d{4}',
        replacement: '[SSN]',
        category: 'pii',
        priority: 100,
        enabled: true,
        matchCount: 0,
      };

      const result = RedactionEngine.testRule(rule, 'No SSN here');

      expect(result.matches.length).toBe(0);
      expect(result.replacements.length).toBe(0);
      expect(result.error).toBeUndefined();
    });
  });

  describe('detectConflicts', () => {
    test('detects identical patterns', () => {
      const rules: CustomRule[] = [
        {
          id: 'rule1',
          name: 'Rule 1',
          pattern: '\\d{3}-\\d{2}-\\d{4}',
          replacement: '[A]',
          category: 'pii',
          priority: 100,
          enabled: true,
          matchCount: 0,
        },
        {
          id: 'rule2',
          name: 'Rule 2',
          pattern: '\\d{3}-\\d{2}-\\d{4}',
          replacement: '[B]',
          category: 'pii',
          priority: 90,
          enabled: true,
          matchCount: 0,
        },
      ];

      const conflicts = RedactionEngine.detectConflicts(rules);

      expect(conflicts.length).toBe(1);
      expect(conflicts[0].rule1).toBe('Rule 1');
      expect(conflicts[0].rule2).toBe('Rule 2');
      expect(conflicts[0].reason).toContain('overlap');
    });

    test('returns empty array when no conflicts', () => {
      const rules: CustomRule[] = [
        {
          id: 'rule1',
          name: 'SSN',
          pattern: '\\d{3}-\\d{2}-\\d{4}',
          replacement: '[SSN]',
          category: 'pii',
          priority: 100,
          enabled: true,
          matchCount: 0,
        },
        {
          id: 'rule2',
          name: 'Phone',
          pattern: '\\(\\d{3}\\)\\s*\\d{3}-\\d{4}',
          replacement: '[PHONE]',
          category: 'pii',
          priority: 90,
          enabled: true,
          matchCount: 0,
        },
      ];

      const conflicts = RedactionEngine.detectConflicts(rules);

      expect(conflicts.length).toBe(0);
    });

    test('handles single rule', () => {
      const rules: CustomRule[] = [
        {
          id: 'rule1',
          name: 'SSN',
          pattern: '\\d{3}-\\d{2}-\\d{4}',
          replacement: '[SSN]',
          category: 'pii',
          priority: 100,
          enabled: true,
          matchCount: 0,
        },
      ];

      const conflicts = RedactionEngine.detectConflicts(rules);

      expect(conflicts.length).toBe(0);
    });

    test('handles empty rules array', () => {
      const conflicts = RedactionEngine.detectConflicts([]);

      expect(conflicts.length).toBe(0);
    });
  });
});
