/**
 * Predefined Custom Redaction Rule Templates
 * Common PII patterns users can quickly add to their rules
 */

import { CustomRedactionRule } from './types';

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Predefined rule templates
 */
export const RULE_TEMPLATES: Omit<CustomRedactionRule, 'id' | 'createdAt' | 'updatedAt' | 'lastUsed' | 'matchCount'>[] = [
  // ========== FINANCIAL ==========
  {
    name: 'Social Security Number (SSN)',
    description: 'Matches US Social Security Numbers (XXX-XX-XXXX)',
    pattern: '\\b\\d{3}-\\d{2}-\\d{4}\\b',
    replacement: '[SSN-REDACTED]',
    priority: 90,
    enabled: true,
    caseSensitive: false,
    global: true,
    category: 'financial',
    tags: ['ssn', 'social security', 'financial'],
    examples: ['123-45-6789', '987-65-4321']
  },
  {
    name: 'Credit Card Number',
    description: 'Matches credit card numbers (4-digit groups)',
    pattern: '\\b\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}\\b',
    replacement: '[CARD-REDACTED]',
    priority: 90,
    enabled: true,
    caseSensitive: false,
    global: true,
    category: 'financial',
    tags: ['credit card', 'payment', 'financial'],
    examples: ['1234 5678 9012 3456', '1234-5678-9012-3456', '1234567890123456']
  },
  {
    name: 'Bank Account Number',
    description: 'Matches US bank account numbers (8-17 digits)',
    pattern: '\\b\\d{8,17}\\b',
    replacement: '[ACCOUNT-REDACTED]',
    priority: 80,
    enabled: true,
    caseSensitive: false,
    global: true,
    category: 'financial',
    tags: ['bank', 'account', 'financial'],
    examples: ['12345678', '1234567890123456']
  },
  {
    name: 'Routing Number',
    description: 'Matches US bank routing numbers (9 digits)',
    pattern: '\\b\\d{9}\\b',
    replacement: '[ROUTING-REDACTED]',
    priority: 75,
    enabled: false, // Disabled by default (overlaps with account numbers)
    caseSensitive: false,
    global: true,
    category: 'financial',
    tags: ['routing', 'bank', 'financial'],
    examples: ['123456789', '987654321']
  },

  // ========== MEDICAL ==========
  {
    name: 'Medical Record Number (MRN)',
    description: 'Matches medical record numbers (MRN followed by 6-10 digits)',
    pattern: '\\bMRN[:\\s#-]?\\d{6,10}\\b',
    replacement: '[MRN-REDACTED]',
    priority: 85,
    enabled: true,
    caseSensitive: false,
    global: true,
    category: 'medical',
    tags: ['medical', 'health', 'mrn'],
    examples: ['MRN: 1234567', 'MRN#1234567', 'MRN-1234567']
  },
  {
    name: 'Health Insurance ID',
    description: 'Matches health insurance member IDs (alphanumeric, 8-15 chars)',
    pattern: '\\b[A-Z0-9]{8,15}\\b',
    replacement: '[INSURANCE-REDACTED]',
    priority: 70,
    enabled: false, // Disabled by default (may match other IDs)
    caseSensitive: true,
    global: true,
    category: 'medical',
    tags: ['insurance', 'health', 'medical'],
    examples: ['ABC12345678', 'XYZ987654321']
  },
  {
    name: 'Prescription Number (Rx)',
    description: 'Matches prescription numbers',
    pattern: '\\bRx[:\\s#-]?\\d{6,10}\\b',
    replacement: '[RX-REDACTED]',
    priority: 80,
    enabled: true,
    caseSensitive: false,
    global: true,
    category: 'medical',
    tags: ['prescription', 'rx', 'medical'],
    examples: ['Rx: 123456', 'Rx#1234567']
  },

  // ========== PERSONAL ==========
  {
    name: 'Passport Number',
    description: 'Matches US passport numbers (9 digits)',
    pattern: '\\b\\d{9}\\b',
    replacement: '[PASSPORT-REDACTED]',
    priority: 75,
    enabled: false, // Disabled by default (overlaps with other numbers)
    caseSensitive: false,
    global: true,
    category: 'personal',
    tags: ['passport', 'travel', 'id'],
    examples: ['123456789', '987654321']
  },
  {
    name: 'Driver License Number',
    description: 'Matches driver license numbers (varies by state)',
    pattern: '\\bDL[:\\s#-]?[A-Z0-9]{5,15}\\b',
    replacement: '[DL-REDACTED]',
    priority: 85,
    enabled: true,
    caseSensitive: false,
    global: true,
    category: 'personal',
    tags: ['drivers license', 'id', 'dmv'],
    examples: ['DL: A1234567', 'DL#A1234567']
  },
  {
    name: 'Date of Birth (DOB)',
    description: 'Matches dates in MM/DD/YYYY or MM-DD-YYYY format',
    pattern: '\\b(0?[1-9]|1[0-2])[/-](0?[1-9]|[12]\\d|3[01])[/-](19|20)\\d{2}\\b',
    replacement: '[DOB-REDACTED]',
    priority: 80,
    enabled: false, // Disabled by default (may match non-DOB dates)
    caseSensitive: false,
    global: true,
    category: 'personal',
    tags: ['dob', 'birthday', 'date'],
    examples: ['01/15/1990', '12-31-1985', '3/7/2000']
  },

  // ========== CORPORATE ==========
  {
    name: 'Employee ID',
    description: 'Matches employee IDs (EMP or EID followed by digits)',
    pattern: '\\b(EMP|EID)[:\\s#-]?\\d{4,8}\\b',
    replacement: '[EMP-REDACTED]',
    priority: 85,
    enabled: true,
    caseSensitive: false,
    global: true,
    category: 'corporate',
    tags: ['employee', 'id', 'work'],
    examples: ['EMP: 12345', 'EID#123456', 'EMP-1234567']
  },
  {
    name: 'Internal Project Code',
    description: 'Matches internal project codes (PROJ followed by alphanumeric)',
    pattern: '\\bPROJ[:\\s#-]?[A-Z0-9]{4,10}\\b',
    replacement: '[PROJECT-REDACTED]',
    priority: 75,
    enabled: false, // Disabled by default (company-specific)
    caseSensitive: false,
    global: true,
    category: 'corporate',
    tags: ['project', 'internal', 'work'],
    examples: ['PROJ: ABC123', 'PROJ#XYZ789']
  },
  {
    name: 'Customer ID',
    description: 'Matches customer IDs (CUST followed by digits)',
    pattern: '\\bCUST[:\\s#-]?\\d{4,10}\\b',
    replacement: '[CUSTOMER-REDACTED]',
    priority: 75,
    enabled: false,
    caseSensitive: false,
    global: true,
    category: 'corporate',
    tags: ['customer', 'id', 'crm'],
    examples: ['CUST: 12345', 'CUST#123456']
  },

  // ========== CUSTOM/UTILITY ==========
  {
    name: 'IPv4 Address',
    description: 'Matches IPv4 addresses',
    pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b',
    replacement: '[IP-REDACTED]',
    priority: 70,
    enabled: false,
    caseSensitive: false,
    global: true,
    category: 'custom',
    tags: ['ip', 'network', 'address'],
    examples: ['192.168.1.1', '10.0.0.1']
  },
  {
    name: 'MAC Address',
    description: 'Matches MAC addresses',
    pattern: '\\b(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}\\b',
    replacement: '[MAC-REDACTED]',
    priority: 70,
    enabled: false,
    caseSensitive: false,
    global: true,
    category: 'custom',
    tags: ['mac', 'network', 'hardware'],
    examples: ['00:1A:2B:3C:4D:5E', '00-1A-2B-3C-4D-5E']
  },
  {
    name: 'UUID/GUID',
    description: 'Matches UUIDs/GUIDs',
    pattern: '\\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\\b',
    replacement: '[UUID-REDACTED]',
    priority: 70,
    enabled: false,
    caseSensitive: false,
    global: true,
    category: 'custom',
    tags: ['uuid', 'guid', 'id'],
    examples: ['550e8400-e29b-41d4-a716-446655440000']
  }
];

/**
 * Get all rule templates
 */
export function getRuleTemplates(): Omit<CustomRedactionRule, 'id' | 'createdAt' | 'updatedAt' | 'lastUsed' | 'matchCount'>[] {
  return RULE_TEMPLATES;
}

/**
 * Create a new rule from a template
 */
export function createRuleFromTemplate(templateName: string): CustomRedactionRule | null {
  const template = RULE_TEMPLATES.find(t => t.name === templateName);
  if (!template) return null;

  const now = Date.now();
  return {
    ...template,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    lastUsed: 0,
    matchCount: 0
  };
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: 'financial' | 'medical' | 'personal' | 'corporate' | 'custom'): typeof RULE_TEMPLATES {
  return RULE_TEMPLATES.filter(t => t.category === category);
}

/**
 * Search templates by tag
 */
export function searchTemplatesByTag(tag: string): typeof RULE_TEMPLATES {
  return RULE_TEMPLATES.filter(t => t.tags?.includes(tag.toLowerCase()));
}
