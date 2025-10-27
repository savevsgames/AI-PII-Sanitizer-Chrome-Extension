/**
 * Rule Templates
 * Preset redaction rules for common patterns
 */

import { CustomRule } from './types';

export interface RuleTemplate {
  name: string;
  description: string;
  category: 'pii' | 'financial' | 'medical' | 'custom';
  pattern: string;
  replacement: string;
  priority: number;
  testCases: { input: string; expected: string }[];
}

export const RULE_TEMPLATES: RuleTemplate[] = [
  {
    name: 'US Social Security Number',
    description: 'Matches SSN in format XXX-XX-XXXX',
    category: 'pii',
    pattern: '\\b\\d{3}-\\d{2}-\\d{4}\\b',
    replacement: '[SSN-REDACTED]',
    priority: 80,
    testCases: [
      { input: 'My SSN is 123-45-6789', expected: 'My SSN is [SSN-REDACTED]' },
      { input: 'SSN: 987-65-4321', expected: 'SSN: [SSN-REDACTED]' }
    ]
  },
  {
    name: 'Credit Card Number',
    description: 'Matches 16-digit credit card numbers',
    category: 'financial',
    pattern: '\\b\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}\\b',
    replacement: '[CARD-****-****-****-$4]',
    priority: 90,
    testCases: [
      {
        input: 'Card: 1234 5678 9012 3456',
        expected: 'Card: [CARD-****-****-****-3456]'
      },
      {
        input: 'Card: 1234-5678-9012-3456',
        expected: 'Card: [CARD-****-****-****-3456]'
      }
    ]
  },
  {
    name: 'US Phone Number',
    description: 'Matches phone numbers in various formats',
    category: 'pii',
    pattern: '\\b(?:\\+?1[\\s.-]?)?\\(?\\d{3}\\)?[\\s.-]?\\d{3}[\\s.-]?\\d{4}\\b',
    replacement: '[PHONE-REDACTED]',
    priority: 70,
    testCases: [
      { input: 'Call me at 555-123-4567', expected: 'Call me at [PHONE-REDACTED]' },
      { input: 'Phone: (555) 123-4567', expected: 'Phone: [PHONE-REDACTED]' },
      { input: '+1 555 123 4567', expected: '+1 [PHONE-REDACTED]' }
    ]
  },
  {
    name: 'IP Address (IPv4)',
    description: 'Matches IPv4 addresses',
    category: 'custom',
    pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b',
    replacement: '[IP-REDACTED]',
    priority: 60,
    testCases: [
      { input: 'Server IP: 192.168.1.1', expected: 'Server IP: [IP-REDACTED]' },
      { input: 'Connect to 10.0.0.1', expected: 'Connect to [IP-REDACTED]' }
    ]
  },
  {
    name: 'Employee ID',
    description: 'Matches employee IDs in format EMP-XXXXX',
    category: 'pii',
    pattern: '\\bEMP-\\d{5}\\b',
    replacement: '[EMPLOYEE-ID]',
    priority: 50,
    testCases: [
      { input: 'Employee EMP-12345 worked on this', expected: 'Employee [EMPLOYEE-ID] worked on this' }
    ]
  },
  {
    name: 'Medical Record Number',
    description: 'Matches MRN in format MRN-XXXXXXX',
    category: 'medical',
    pattern: '\\bMRN-\\d{7}\\b',
    replacement: '[MRN-REDACTED]',
    priority: 85,
    testCases: [
      { input: 'Patient MRN-1234567', expected: 'Patient [MRN-REDACTED]' }
    ]
  },
  {
    name: 'Driver License Number',
    description: 'Matches DL numbers in format DL-XXXXXXXX',
    category: 'pii',
    pattern: '\\bDL-[A-Z0-9]{8}\\b',
    replacement: '[DL-REDACTED]',
    priority: 75,
    testCases: [
      { input: 'License: DL-A1234567', expected: 'License: [DL-REDACTED]' }
    ]
  },
  {
    name: 'Bank Account Number',
    description: 'Matches bank account numbers (8-12 digits)',
    category: 'financial',
    pattern: '\\b(?:Account|Acct)\\s*#?\\s*:?\\s*(\\d{8,12})\\b',
    replacement: 'Account: [ACCOUNT-REDACTED]',
    priority: 90,
    testCases: [
      { input: 'Account: 123456789012', expected: 'Account: [ACCOUNT-REDACTED]' },
      { input: 'Acct #: 98765432', expected: 'Acct #: [ACCOUNT-REDACTED]' }
    ]
  },
  {
    name: 'Passport Number',
    description: 'Matches passport numbers (9 characters)',
    category: 'pii',
    pattern: '\\b[A-Z]{1,2}\\d{7,9}\\b',
    replacement: '[PASSPORT-REDACTED]',
    priority: 80,
    testCases: [
      { input: 'Passport: A12345678', expected: 'Passport: [PASSPORT-REDACTED]' },
      { input: 'ID: AB1234567', expected: 'ID: [PASSPORT-REDACTED]' }
    ]
  },
  {
    name: 'Date of Birth',
    description: 'Matches dates in MM/DD/YYYY format',
    category: 'pii',
    pattern: '\\b(?:DOB|Date of Birth)\\s*:?\\s*(\\d{1,2}/\\d{1,2}/\\d{4})\\b',
    replacement: 'DOB: [DOB-REDACTED]',
    priority: 70,
    testCases: [
      { input: 'DOB: 01/15/1990', expected: 'DOB: [DOB-REDACTED]' },
      { input: 'Date of Birth: 12/25/1985', expected: 'Date of Birth: [DOB-REDACTED]' }
    ]
  }
];

/**
 * Convert a template to a CustomRule
 */
export function templateToRule(template: RuleTemplate): Omit<CustomRule, 'id' | 'createdAt'> {
  return {
    name: template.name,
    pattern: template.pattern,
    replacement: template.replacement,
    enabled: true,
    priority: template.priority,
    category: template.category,
    description: template.description,
    matchCount: 0,
    testCases: template.testCases
  };
}
