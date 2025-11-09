/**
 * Tests for Rule Templates
 * Preset redaction rules for common PII patterns
 */

import { RULE_TEMPLATES, templateToRule, type RuleTemplate } from '../src/lib/ruleTemplates';

describe('Rule Templates', () => {
  describe('RULE_TEMPLATES constant', () => {
    it('should have templates defined', () => {
      expect(RULE_TEMPLATES).toBeDefined();
      expect(Array.isArray(RULE_TEMPLATES)).toBe(true);
      expect(RULE_TEMPLATES.length).toBeGreaterThan(0);
    });

    it('should have at least 10 templates', () => {
      expect(RULE_TEMPLATES.length).toBeGreaterThanOrEqual(10);
    });

    it('should have valid template structure', () => {
      RULE_TEMPLATES.forEach(template => {
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('category');
        expect(template).toHaveProperty('pattern');
        expect(template).toHaveProperty('replacement');
        expect(template).toHaveProperty('priority');
        expect(template).toHaveProperty('testCases');

        expect(typeof template.name).toBe('string');
        expect(typeof template.description).toBe('string');
        expect(['pii', 'financial', 'medical', 'custom']).toContain(template.category);
        expect(typeof template.pattern).toBe('string');
        expect(typeof template.replacement).toBe('string');
        expect(typeof template.priority).toBe('number');
        expect(Array.isArray(template.testCases)).toBe(true);
      });
    });

    it('should have unique template names', () => {
      const names = RULE_TEMPLATES.map(t => t.name);
      const uniqueNames = new Set(names);

      expect(names.length).toBe(uniqueNames.size);
    });

    it('should have valid priority values', () => {
      RULE_TEMPLATES.forEach(template => {
        expect(template.priority).toBeGreaterThanOrEqual(0);
        expect(template.priority).toBeLessThanOrEqual(100);
      });
    });

    it('should have test cases for each template', () => {
      RULE_TEMPLATES.forEach(template => {
        expect(template.testCases.length).toBeGreaterThan(0);

        template.testCases.forEach(testCase => {
          expect(testCase).toHaveProperty('input');
          expect(testCase).toHaveProperty('expected');
          expect(typeof testCase.input).toBe('string');
          expect(typeof testCase.expected).toBe('string');
        });
      });
    });
  });

  describe('Template Categories', () => {
    it('should have PII templates', () => {
      const piiTemplates = RULE_TEMPLATES.filter(t => t.category === 'pii');
      expect(piiTemplates.length).toBeGreaterThan(0);
    });

    it('should have financial templates', () => {
      const financialTemplates = RULE_TEMPLATES.filter(t => t.category === 'financial');
      expect(financialTemplates.length).toBeGreaterThan(0);
    });

    it('should have medical templates', () => {
      const medicalTemplates = RULE_TEMPLATES.filter(t => t.category === 'medical');
      expect(medicalTemplates.length).toBeGreaterThan(0);
    });

    it('should group related templates by category', () => {
      const categories = new Set(RULE_TEMPLATES.map(t => t.category));

      // Should have multiple categories represented
      expect(categories.size).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Specific Templates', () => {
    it('should have SSN template', () => {
      const ssnTemplate = RULE_TEMPLATES.find(t => t.name === 'US Social Security Number');

      expect(ssnTemplate).toBeDefined();
      expect(ssnTemplate!.category).toBe('pii');
      expect(ssnTemplate!.pattern).toContain('\\d{3}-\\d{2}-\\d{4}');
      expect(ssnTemplate!.replacement).toContain('SSN');
    });

    it('should have Credit Card template', () => {
      const ccTemplate = RULE_TEMPLATES.find(t => t.name === 'Credit Card Number');

      expect(ccTemplate).toBeDefined();
      expect(ccTemplate!.category).toBe('financial');
      expect(ccTemplate!.pattern).toContain('\\d{4}');
      expect(ccTemplate!.replacement).toContain('CARD');
    });

    it('should have Phone Number template', () => {
      const phoneTemplate = RULE_TEMPLATES.find(t => t.name === 'US Phone Number');

      expect(phoneTemplate).toBeDefined();
      expect(phoneTemplate!.category).toBe('pii');
      expect(phoneTemplate!.replacement).toContain('PHONE');
    });

    it('should have IP Address template', () => {
      const ipTemplate = RULE_TEMPLATES.find(t => t.name === 'IP Address (IPv4)');

      expect(ipTemplate).toBeDefined();
      expect(ipTemplate!.category).toBe('custom');
      expect(ipTemplate!.replacement).toContain('IP');
    });

    it('should have Medical Record Number template', () => {
      const mrnTemplate = RULE_TEMPLATES.find(t => t.name === 'Medical Record Number');

      expect(mrnTemplate).toBeDefined();
      expect(mrnTemplate!.category).toBe('medical');
      expect(mrnTemplate!.replacement).toContain('MRN');
    });
  });

  describe('Pattern Validation', () => {
    it('should have valid regex patterns', () => {
      RULE_TEMPLATES.forEach(template => {
        // Should be able to create a RegExp from the pattern
        expect(() => new RegExp(template.pattern)).not.toThrow();
      });
    });

    it('should match expected test cases', () => {
      RULE_TEMPLATES.forEach(template => {
        const regex = new RegExp(template.pattern, 'g');

        template.testCases.forEach(testCase => {
          const matches = testCase.input.match(regex);

          // Each test case input should have at least one match
          expect(matches).not.toBeNull();
          expect(matches!.length).toBeGreaterThan(0);
        });
      });
    });

    it('should correctly redact SSN', () => {
      const ssnTemplate = RULE_TEMPLATES.find(t => t.name === 'US Social Security Number')!;
      const regex = new RegExp(ssnTemplate.pattern, 'g');

      const result = 'My SSN is 123-45-6789'.replace(regex, ssnTemplate.replacement);

      expect(result).toBe('My SSN is [SSN-REDACTED]');
      expect(result).not.toContain('123-45-6789');
    });

    it('should correctly redact credit card', () => {
      const ccTemplate = RULE_TEMPLATES.find(t => t.name === 'Credit Card Number')!;
      const regex = new RegExp(ccTemplate.pattern, 'g');

      const input = 'Card: 1234 5678 9012 3456';
      const result = input.replace(regex, ccTemplate.replacement);

      // Should redact with placeholder
      expect(result).toContain('CARD');
      expect(result).not.toContain('1234 5678 9012 3456');
    });

    it('should correctly redact phone numbers', () => {
      const phoneTemplate = RULE_TEMPLATES.find(t => t.name === 'US Phone Number')!;
      const regex = new RegExp(phoneTemplate.pattern, 'g');

      const result = 'Call me at 555-123-4567'.replace(regex, phoneTemplate.replacement);

      expect(result).toBe('Call me at [PHONE-REDACTED]');
      expect(result).not.toContain('555-123-4567');
    });

    it('should correctly redact IP addresses', () => {
      const ipTemplate = RULE_TEMPLATES.find(t => t.name === 'IP Address (IPv4)')!;
      const regex = new RegExp(ipTemplate.pattern, 'g');

      const result = 'Server IP: 192.168.1.1'.replace(regex, ipTemplate.replacement);

      expect(result).toBe('Server IP: [IP-REDACTED]');
      expect(result).not.toContain('192.168.1.1');
    });
  });

  describe('templateToRule', () => {
    it('should convert template to CustomRule format', () => {
      const template = RULE_TEMPLATES[0];
      const rule = templateToRule(template);

      expect(rule).toHaveProperty('name', template.name);
      expect(rule).toHaveProperty('pattern', template.pattern);
      expect(rule).toHaveProperty('replacement', template.replacement);
      expect(rule).toHaveProperty('priority', template.priority);
      expect(rule).toHaveProperty('category', template.category);
      expect(rule).toHaveProperty('description', template.description);
      expect(rule).toHaveProperty('testCases', template.testCases);
    });

    it('should set enabled to true by default', () => {
      const template = RULE_TEMPLATES[0];
      const rule = templateToRule(template);

      expect(rule.enabled).toBe(true);
    });

    it('should set matchCount to 0', () => {
      const template = RULE_TEMPLATES[0];
      const rule = templateToRule(template);

      expect(rule.matchCount).toBe(0);
    });

    it('should not include id or createdAt fields', () => {
      const template = RULE_TEMPLATES[0];
      const rule = templateToRule(template);

      expect(rule).not.toHaveProperty('id');
      expect(rule).not.toHaveProperty('createdAt');
    });

    it('should preserve test cases', () => {
      const template = RULE_TEMPLATES.find(t => t.name === 'US Social Security Number')!;
      const rule = templateToRule(template);

      expect(rule.testCases).toEqual(template.testCases);
      expect(rule.testCases.length).toBeGreaterThan(0);
    });

    it('should convert all templates successfully', () => {
      RULE_TEMPLATES.forEach(template => {
        const rule = templateToRule(template);

        expect(rule).toBeDefined();
        expect(rule.name).toBe(template.name);
        expect(rule.enabled).toBe(true);
        expect(rule.matchCount).toBe(0);
      });
    });
  });

  describe('Priority System', () => {
    it('should have higher priority for financial templates', () => {
      const financialTemplates = RULE_TEMPLATES.filter(t => t.category === 'financial');

      financialTemplates.forEach(template => {
        // Financial data should have high priority (>= 80)
        expect(template.priority).toBeGreaterThanOrEqual(80);
      });
    });

    it('should have higher priority for medical templates', () => {
      const medicalTemplates = RULE_TEMPLATES.filter(t => t.category === 'medical');

      medicalTemplates.forEach(template => {
        // Medical data should have high priority (>= 80)
        expect(template.priority).toBeGreaterThanOrEqual(80);
      });
    });

    it('should sort templates by priority descending', () => {
      const sorted = [...RULE_TEMPLATES].sort((a, b) => b.priority - a.priority);

      // First template should have highest priority
      expect(sorted[0].priority).toBeGreaterThanOrEqual(sorted[sorted.length - 1].priority);
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple matches in same text', () => {
      const phoneTemplate = RULE_TEMPLATES.find(t => t.name === 'US Phone Number')!;
      const regex = new RegExp(phoneTemplate.pattern, 'g');

      const input = 'Call 555-123-4567 or 555-987-6543';
      const result = input.replace(regex, phoneTemplate.replacement);

      // Both phone numbers should be redacted
      expect(result).toBe('Call [PHONE-REDACTED] or [PHONE-REDACTED]');
      expect(result).not.toContain('555-123-4567');
      expect(result).not.toContain('555-987-6543');
    });

    it('should handle text with no matches', () => {
      const ssnTemplate = RULE_TEMPLATES.find(t => t.name === 'US Social Security Number')!;
      const regex = new RegExp(ssnTemplate.pattern, 'g');

      const input = 'This text has no SSN';
      const result = input.replace(regex, ssnTemplate.replacement);

      // Should remain unchanged
      expect(result).toBe(input);
    });

    it('should not match partial patterns', () => {
      const ssnTemplate = RULE_TEMPLATES.find(t => t.name === 'US Social Security Number')!;
      const regex = new RegExp(ssnTemplate.pattern, 'g');

      const input = 'Incomplete SSN: 123-45-';
      const result = input.replace(regex, ssnTemplate.replacement);

      // Should not match incomplete pattern
      expect(result).toBe(input);
    });

    it('should handle patterns with special characters', () => {
      const phoneTemplate = RULE_TEMPLATES.find(t => t.name === 'US Phone Number')!;
      const regex = new RegExp(phoneTemplate.pattern, 'g');

      // Various formats
      const formats = [
        '555-123-4567',
        '(555) 123-4567',
        '555.123.4567',
        '+1 555-123-4567'
      ];

      formats.forEach(format => {
        const matches = format.match(regex);
        expect(matches).not.toBeNull();
      });
    });
  });

  describe('Description Quality', () => {
    it('should have meaningful descriptions', () => {
      RULE_TEMPLATES.forEach(template => {
        expect(template.description.length).toBeGreaterThan(10);
        expect(template.description).not.toBe(template.name);
      });
    });

    it('should include pattern format in description', () => {
      const templates = [
        { name: 'US Social Security Number', formatHint: 'XXX-XX-XXXX' },
        { name: 'Medical Record Number', formatHint: 'MRN-' },
        { name: 'Employee ID', formatHint: 'EMP-' }
      ];

      templates.forEach(({ name, formatHint }) => {
        const template = RULE_TEMPLATES.find(t => t.name === name);

        if (template) {
          expect(template.description.toLowerCase()).toContain(formatHint.toLowerCase());
        }
      });
    });
  });
});
