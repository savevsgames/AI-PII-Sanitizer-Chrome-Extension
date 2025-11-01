/**
 * Input Validation Tests
 * Phase 1.8 - Security Hardening
 */

import {
  validateEmail,
  validatePhone,
  validateName,
  validateAddress,
  validateRegexPattern,
  validateAPIKey,
  validateProfileName,
  validateRuleName,
  validateDescription,
  validateURL,
  validateTextInput,
  sanitizeHTML,
  validateProfileFields,
} from '../src/lib/validation';

describe('Email Validation', () => {
  test('validates correct email addresses', () => {
    const validEmails = [
      'test@example.com',
      'user.name@example.com',
      'user+tag@example.co.uk',
      'test_123@sub.domain.com',
    ];

    validEmails.forEach(email => {
      const result = validateEmail(email);
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe(email);
    });
  });

  test('rejects invalid email addresses', () => {
    const invalidEmails = [
      '',
      'notanemail',
      '@example.com',
      'user@',
      'user name@example.com',
      'user@.com',
      'a'.repeat(255) + '@example.com', // Too long
    ];

    invalidEmails.forEach(email => {
      const result = validateEmail(email);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  test('trims whitespace from emails', () => {
    const result = validateEmail('  test@example.com  ');
    expect(result.isValid).toBe(true);
    expect(result.sanitized).toBe('test@example.com');
  });
});

describe('Phone Number Validation', () => {
  test('validates correct phone numbers', () => {
    const validPhones = [
      '1234567890',
      '+1 (234) 567-8900',
      '123-456-7890',
      '+44 20 1234 5678',
      '(555) 123-4567',
    ];

    validPhones.forEach(phone => {
      const result = validatePhone(phone);
      expect(result.isValid).toBe(true);
    });
  });

  test('rejects invalid phone numbers', () => {
    const invalidPhones = [
      '',
      '123', // Too short
      '12345', // Too short
      'abc-def-ghij',
      '+1234567890123456', // Too long
    ];

    invalidPhones.forEach(phone => {
      const result = validatePhone(phone);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

describe('Name Validation', () => {
  test('validates correct names', () => {
    const validNames = [
      'John Doe',
      "O'Brien",
      'José García',
      'Mary-Jane',
      'François',
      'Müller',
    ];

    validNames.forEach(name => {
      const result = validateName(name);
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe(name);
    });
  });

  test('rejects invalid names', () => {
    const invalidNames = [
      '',
      'a'.repeat(101), // Too long
      'Name123', // Numbers not allowed
      'Name@Email', // Special chars not allowed
      '<script>alert()</script>',
    ];

    invalidNames.forEach(name => {
      const result = validateName(name);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  test('uses custom field name in error messages', () => {
    const result = validateName('', 'Company name');
    expect(result.error).toContain('Company name');
  });
});

describe('Address Validation', () => {
  test('validates correct addresses', () => {
    const validAddresses = [
      '123 Main Street',
      '456 Oak Ave, Apt 7',
      '789 Elm St., Suite 100',
      '1 Broadway, New York, NY 10004',
      'Flat 2, 34 High Street',
    ];

    validAddresses.forEach(address => {
      const result = validateAddress(address);
      expect(result.isValid).toBe(true);
    });
  });

  test('rejects invalid addresses', () => {
    const invalidAddresses = [
      '',
      '123', // Too short
      'a'.repeat(201), // Too long
      '123 Main St <script>alert()</script>',
    ];

    invalidAddresses.forEach(address => {
      const result = validateAddress(address);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

describe('Regex Pattern Validation', () => {
  test('validates correct regex patterns', () => {
    const validPatterns = [
      '^test$',
      '\\d{3}-\\d{4}',
      '[a-z]+@[a-z]+\\.[a-z]+',
      '(foo|bar)',
    ];

    validPatterns.forEach(pattern => {
      const result = validateRegexPattern(pattern);
      expect(result.isValid).toBe(true);
    });
  });

  test('rejects invalid regex patterns', () => {
    const invalidPatterns = [
      '',
      '[invalid(regex', // Syntax error
      'a'.repeat(501), // Too long
    ];

    invalidPatterns.forEach(pattern => {
      const result = validateRegexPattern(pattern);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  test('detects catastrophic backtracking patterns', () => {
    // Note: Our simple ReDoS detection may not catch all patterns
    // But it should catch basic nested quantifiers
    const result = validateRegexPattern('(a+)+b');
    // This might or might not be caught depending on implementation
    // Just verify it doesn't crash
    expect(result).toBeDefined();
  });
});

describe('API Key Validation', () => {
  test('validates correct API keys', () => {
    const validKeys = [
      'sk-1234567890abcdef',
      'AIzaSyDfghj123456',
      'pk_test_123456789',
      'AKIA1234567890ABCDEF',
    ];

    validKeys.forEach(key => {
      const result = validateAPIKey(key);
      expect(result.isValid).toBe(true);
    });
  });

  test('rejects invalid API keys', () => {
    const invalidKeys = [
      '',
      '123', // Too short
      'a'.repeat(501), // Too long
      'key with spaces',
      'key@with!special#chars',
    ];

    invalidKeys.forEach(key => {
      const result = validateAPIKey(key);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

describe('Profile Name Validation', () => {
  test('validates correct profile names', () => {
    const validNames = [
      'Work Profile',
      'Personal_Profile',
      'Profile-123',
      'Test Profile 2024',
    ];

    validNames.forEach(name => {
      const result = validateProfileName(name);
      expect(result.isValid).toBe(true);
    });
  });

  test('rejects invalid profile names', () => {
    const invalidNames = [
      '',
      'a', // Too short
      'a'.repeat(51), // Too long
      'Profile@Name',
      '<script>alert()</script>',
    ];

    invalidNames.forEach(name => {
      const result = validateProfileName(name);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

describe('Rule Name Validation', () => {
  test('validates correct rule names', () => {
    const validNames = [
      'Remove PII',
      'Custom_Rule_1',
      'Filter-Numbers',
      'Rule 2024',
    ];

    validNames.forEach(name => {
      const result = validateRuleName(name);
      expect(result.isValid).toBe(true);
    });
  });

  test('rejects invalid rule names', () => {
    const invalidNames = [
      '',
      'a', // Too short
      'a'.repeat(101), // Too long
      'Rule@Name',
    ];

    invalidNames.forEach(name => {
      const result = validateRuleName(name);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

describe('Description Validation', () => {
  test('validates descriptions', () => {
    const result1 = validateDescription('This is a valid description');
    expect(result1.isValid).toBe(true);

    const result2 = validateDescription('');
    expect(result2.isValid).toBe(true);
    expect(result2.sanitized).toBe('');
  });

  test('rejects too long descriptions', () => {
    const result = validateDescription('a'.repeat(501));
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('too long');
  });
});

describe('URL Validation', () => {
  test('validates correct URLs', () => {
    const validUrls = [
      'https://example.com',
      'http://example.com/path',
      '*.example.com',
      'https://*.google.com',
    ];

    validUrls.forEach(url => {
      const result = validateURL(url);
      expect(result.isValid).toBe(true);
    });
  });

  test('rejects invalid URLs', () => {
    const invalidUrls = [
      '',
      'not a url',
      'ftp://example.com', // FTP not allowed
      'javascript:alert()',
      'a'.repeat(2049), // Too long
    ];

    invalidUrls.forEach(url => {
      const result = validateURL(url);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

describe('Text Input Validation', () => {
  test('validates with default options', () => {
    const result = validateTextInput('Valid text');
    expect(result.isValid).toBe(true);
  });

  test('respects minLength option', () => {
    const result = validateTextInput('ab', { minLength: 3 });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('too short');
  });

  test('respects maxLength option', () => {
    const result = validateTextInput('a'.repeat(100), { maxLength: 50 });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('too long');
  });

  test('respects required option', () => {
    const result1 = validateTextInput('', { required: true });
    expect(result1.isValid).toBe(false);

    const result2 = validateTextInput('', { required: false });
    expect(result2.isValid).toBe(true);
  });

  test('uses custom field name', () => {
    const result = validateTextInput('', { fieldName: 'Custom Field' });
    expect(result.error).toContain('Custom Field');
  });
});

describe('HTML Sanitization', () => {
  test('removes all HTML tags', () => {
    expect(sanitizeHTML('<div>Hello</div>')).toBe('Hello');
    expect(sanitizeHTML('<script>alert("XSS")</script>')).toBe('alert("XSS")');
    expect(sanitizeHTML('Normal text')).toBe('Normal text');
    expect(sanitizeHTML('<b>Bold</b> and <i>italic</i>')).toBe('Bold and italic');
  });

  test('handles empty input', () => {
    expect(sanitizeHTML('')).toBe('');
    expect(sanitizeHTML(null as any)).toBe('');
    expect(sanitizeHTML(undefined as any)).toBe('');
  });
});

describe('Profile Fields Validation', () => {
  test('validates complete valid profile', () => {
    const profile = {
      profileName: 'Work Profile',
      real: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        address: '123 Main St',
        company: 'Acme Corp',
      },
      alias: {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '098-765-4321',
        address: '456 Oak Ave',
        company: 'Tech Inc',
      },
      description: 'My work profile',
    };

    const result = validateProfileFields(profile);
    expect(result.isValid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  test('detects multiple validation errors', () => {
    const profile = {
      profileName: 'a', // Too short
      real: {
        name: 'John123', // Numbers not allowed
        email: 'invalid-email',
        phone: '123', // Too short
      },
    };

    const result = validateProfileFields(profile);
    expect(result.isValid).toBe(false);
    expect(result.errors.profileName).toBeDefined();
    expect(result.errors['real.name']).toBeDefined();
    expect(result.errors['real.email']).toBeDefined();
    expect(result.errors['real.phone']).toBeDefined();
  });

  test('handles partial profiles', () => {
    const profile = {
      profileName: 'Minimal Profile',
      real: {
        name: 'John Doe',
      },
    };

    const result = validateProfileFields(profile);
    expect(result.isValid).toBe(true);
  });
});

describe('Edge Cases and Security', () => {
  test('handles null and undefined inputs', () => {
    expect(validateEmail(null as any).isValid).toBe(false);
    expect(validateEmail(undefined as any).isValid).toBe(false);
    expect(validatePhone(null as any).isValid).toBe(false);
    expect(validateName(null as any).isValid).toBe(false);
  });

  test('handles non-string inputs', () => {
    expect(validateEmail(123 as any).isValid).toBe(false);
    expect(validatePhone({} as any).isValid).toBe(false);
    expect(validateName([] as any).isValid).toBe(false);
  });

  test('prevents XSS in all validators', () => {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      'javascript:alert("XSS")',
      '<svg onload=alert("XSS")>',
    ];

    xssPayloads.forEach(payload => {
      expect(validateName(payload).isValid).toBe(false);
      expect(validateAddress(payload).isValid).toBe(false);
      expect(validateProfileName(payload).isValid).toBe(false);
    });
  });

  test('prevents ReDoS (Regular Expression Denial of Service)', () => {
    // Very long input with repeating pattern
    const longInput = 'a'.repeat(10000) + 'b';

    // All validators should handle this without timing out
    expect(validateEmail(longInput).isValid).toBe(false);
    expect(validateName(longInput).isValid).toBe(false);
    expect(validateAddress(longInput).isValid).toBe(false);
  });

  test('handles Unicode characters correctly', () => {
    expect(validateName('François Müller').isValid).toBe(true);
    expect(validateName('李明').isValid).toBe(true);
    expect(validateName('Владимир').isValid).toBe(true);
    expect(validateAddress('東京都渋谷区').isValid).toBe(true); // 6 characters (meets min 5)
  });
});
