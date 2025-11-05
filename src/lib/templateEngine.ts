/**
 * Template Engine
 * Handles placeholder parsing and replacement for prompt templates
 */

import { PromptTemplate, AliasProfile } from './types';

/**
 * Placeholder pattern: {{field_name}} or {{ field_name }}
 * Matches: {{name}}, {{ email }}, {{alias_name}}, etc.
 */
const PLACEHOLDER_REGEX = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;

/**
 * Supported placeholder fields
 */
export const SUPPORTED_PLACEHOLDERS = [
  // Real identity
  'name',
  'email',
  'phone',
  'cellPhone',
  'address',
  'company',
  'jobTitle',

  // Alias identity
  'alias_name',
  'alias_email',
  'alias_phone',
  'alias_cellPhone',
  'alias_address',
  'alias_company',
  'alias_jobTitle',
] as const;

export type PlaceholderField = typeof SUPPORTED_PLACEHOLDERS[number];

/**
 * Parsed placeholder information
 */
export interface ParsedPlaceholder {
  fullMatch: string;           // "{{name}}" or "{{ email }}"
  field: string;               // "name" or "email"
  isAlias: boolean;            // true if field starts with "alias_"
  position: number;            // Character position in template
}

/**
 * Template replacement result
 */
export interface TemplateResult {
  content: string;             // Final text with placeholders replaced
  replacements: Array<{
    placeholder: string;
    value: string;
    field: string;
  }>;
  missingFields: string[];     // Placeholders that couldn't be filled
}

/**
 * Parse template content and extract all placeholders
 */
export function parsePlaceholders(template: string): ParsedPlaceholder[] {
  const placeholders: ParsedPlaceholder[] = [];
  let match: RegExpExecArray | null;

  // Reset regex state
  PLACEHOLDER_REGEX.lastIndex = 0;

  while ((match = PLACEHOLDER_REGEX.exec(template)) !== null) {
    const fullMatch = match[0];         // "{{name}}"
    const field = match[1].trim();      // "name"

    placeholders.push({
      fullMatch,
      field: field.toLowerCase(),       // Normalize to lowercase
      isAlias: field.toLowerCase().startsWith('alias_'),
      position: match.index,
    });
  }

  return placeholders;
}

/**
 * Replace placeholders in template with profile data
 * @param template Template content with {{placeholders}}
 * @param profile Profile to use for data
 * @param useAlias If true, use alias data; if false, use real data
 * @returns Result with replaced content and metadata
 */
export function replacePlaceholders(
  template: string,
  profile: AliasProfile,
  useAlias: boolean = true
): TemplateResult {
  const replacements: Array<{ placeholder: string; value: string; field: string }> = [];
  const missingFields: string[] = [];

  let result = template;

  // Parse all placeholders
  const placeholders = parsePlaceholders(template);

  // Replace each placeholder
  for (const ph of placeholders) {
    const value = getFieldValue(ph.field, profile, useAlias);

    if (value) {
      // Replace this specific placeholder
      result = result.replace(ph.fullMatch, value);
      replacements.push({
        placeholder: ph.fullMatch,
        value,
        field: ph.field,
      });
    } else {
      // Track missing field
      missingFields.push(ph.field);
    }
  }

  return {
    content: result,
    replacements,
    missingFields,
  };
}

/**
 * Get field value from profile
 * @param field Field name (e.g., "name", "alias_email")
 * @param profile Profile to extract from
 * @param preferAlias If true and field is not explicitly prefixed, prefer alias data
 */
function getFieldValue(field: string, profile: AliasProfile, preferAlias: boolean): string | undefined {
  const fieldLower = field.toLowerCase();

  // Handle alias_ prefix explicitly
  if (fieldLower.startsWith('alias_')) {
    const actualField = fieldLower.substring(6); // Remove "alias_"
    return profile.alias[actualField as keyof typeof profile.alias] as string | undefined;
  }

  // Handle real data (or default based on preferAlias)
  if (preferAlias) {
    // Check alias first, fall back to real
    return (profile.alias[fieldLower as keyof typeof profile.alias] as string | undefined) ||
           (profile.real[fieldLower as keyof typeof profile.real] as string | undefined);
  } else {
    // Check real first, fall back to alias
    return (profile.real[fieldLower as keyof typeof profile.real] as string | undefined) ||
           (profile.alias[fieldLower as keyof typeof profile.alias] as string | undefined);
  }
}

/**
 * Validate template content
 * Checks for unsupported placeholders or invalid syntax
 */
export function validateTemplate(template: string): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for empty template
  if (!template || template.trim().length === 0) {
    errors.push('Template content cannot be empty');
    return { valid: false, errors, warnings };
  }

  // Check for unclosed placeholders
  const openBraces = (template.match(/\{\{/g) || []).length;
  const closeBraces = (template.match(/\}\}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push('Unclosed placeholder braces - check that all {{placeholders}} are properly closed');
  }

  // Check for invalid placeholder syntax (e.g., {{ }} or {{  }})
  const emptyPlaceholder = /\{\{\s*\}\}/g;
  if (emptyPlaceholder.test(template)) {
    errors.push('Empty placeholder found - placeholders must contain a field name');
  }

  // Parse placeholders and check if they're supported
  const placeholders = parsePlaceholders(template);
  const unsupportedFields: string[] = [];

  for (const ph of placeholders) {
    const normalizedField = ph.field.toLowerCase();
    const isSupported = SUPPORTED_PLACEHOLDERS.some(
      supported => supported.toLowerCase() === normalizedField
    );

    if (!isSupported) {
      unsupportedFields.push(ph.field);
    }
  }

  if (unsupportedFields.length > 0) {
    warnings.push(`Unsupported placeholders: ${unsupportedFields.join(', ')}. These will not be replaced.`);
  }

  // Check for very long templates (might impact performance)
  if (template.length > 10000) {
    warnings.push('Template is very long (>10,000 characters). Consider breaking it into smaller templates.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get list of placeholders used in a template
 * Useful for showing user which fields are needed
 */
export function getUsedPlaceholders(template: string): string[] {
  const placeholders = parsePlaceholders(template);
  // Return unique field names
  return [...new Set(placeholders.map(ph => ph.field))];
}

/**
 * Preview template with placeholder names shown
 * Useful for displaying template in UI before filling
 */
export function previewTemplate(template: string): string {
  return template.replace(PLACEHOLDER_REGEX, (_, field: string) => {
    return `[${field.trim()}]`;
  });
}

/**
 * Generate example template filled with placeholder names
 * Useful for showing users what the template will look like
 */
export function generateExample(template: PromptTemplate): string {
  const exampleProfile: AliasProfile = {
    id: 'example',
    profileName: 'Example Profile',
    enabled: true,
    real: {
      name: 'John Smith',
      email: 'john.smith@company.com',
      phone: '+1 (555) 123-4567',
      address: '123 Main St, City, ST 12345',
      company: 'Acme Corp',
      jobTitle: 'Software Engineer',
    },
    alias: {
      name: 'Alex Johnson',
      email: 'alex.j@example.com',
      phone: '+1 (555) 987-6543',
      address: '456 Oak Ave, Town, ST 54321',
      company: 'Tech Solutions Inc',
      jobTitle: 'Developer',
    },
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageStats: {
        totalSubstitutions: 0,
        lastUsed: 0,
        byService: { chatgpt: 0, claude: 0, gemini: 0, perplexity: 0, copilot: 0 },
        byPIIType: { name: 0, email: 0, phone: 0, cellPhone: 0, address: 0, company: 0, custom: 0 },
      },
      confidence: 1,
    },
    settings: {
      autoReplace: true,
      highlightInUI: true,
      activeServices: ['chatgpt', 'claude', 'gemini'],
      enableVariations: true,
    },
  };

  const result = replacePlaceholders(template.content, exampleProfile, true);
  return result.content;
}
