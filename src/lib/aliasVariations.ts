/**
 * Alias Variations Engine
 * Auto-generates name and email format variations to catch all possible matches
 *
 * Examples:
 * - "Greg Barker" → ["Greg Barker", "GregBarker", "gregbarker", "gbarker", "G.Barker", "G Barker"]
 * - "greg.barker@example.com" → ["greg.barker@example.com", "GregBarker@example.com", "gregbarker@example.com"]
 */

export interface VariationSet {
  original: string;
  variations: string[];
  type: 'name' | 'email' | 'phone' | 'other';
}

/**
 * Generate all variations of a name
 */
export function generateNameVariations(name: string): string[] {
  if (!name || name.trim() === '') return [];

  const variations = new Set<string>();
  const trimmed = name.trim();

  // Add original
  variations.add(trimmed);

  // Parse name parts
  const parts = trimmed.split(/\s+/);

  if (parts.length === 0) return [trimmed];

  // Single word name (e.g., "Madonna")
  if (parts.length === 1) {
    const word = parts[0];
    variations.add(word);
    variations.add(word.toLowerCase());
    variations.add(word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()); // Title case
    variations.add(word.toUpperCase());
    return Array.from(variations);
  }

  // Multi-part names
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  const middleParts = parts.slice(1, -1);

  // 1. Original with spaces
  variations.add(parts.join(' '));

  // 2. No spaces (CamelCase-like)
  variations.add(parts.join(''));

  // 3. All lowercase no spaces
  variations.add(parts.join('').toLowerCase());

  // 4. All lowercase with spaces
  variations.add(parts.join(' ').toLowerCase());

  // 5. Title Case
  const titleCase = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
  variations.add(titleCase);

  // 6. Title Case no spaces
  variations.add(titleCase.replace(/\s+/g, ''));

  // 7. First initial + Last name
  variations.add(`${firstName.charAt(0).toLowerCase()}${lastName.toLowerCase()}`);
  variations.add(`${firstName.charAt(0).toUpperCase()}${lastName.toLowerCase()}`);
  variations.add(`${firstName.charAt(0).toLowerCase()}${lastName}`);
  variations.add(`${firstName.charAt(0).toUpperCase()}${lastName}`);

  // 8. First initial with dot + space + Last name
  variations.add(`${firstName.charAt(0).toUpperCase()}. ${lastName}`);
  variations.add(`${firstName.charAt(0).toUpperCase()}.${lastName}`);

  // 9. First + Last (skip middle names if any)
  if (middleParts.length > 0) {
    variations.add(`${firstName} ${lastName}`);
    variations.add(`${firstName}${lastName}`);
    variations.add(`${firstName.toLowerCase()}${lastName.toLowerCase()}`);
  }

  // 10. All caps
  variations.add(parts.join(' ').toUpperCase());
  variations.add(parts.join('').toUpperCase());

  // 11. Snake case
  variations.add(parts.join('_').toLowerCase());
  variations.add(parts.join('_').toUpperCase());

  // 12. Hyphenated
  variations.add(parts.join('-').toLowerCase());
  variations.add(parts.join('-'));

  // 13. Dot separated
  variations.add(parts.join('.').toLowerCase());
  variations.add(parts.join('.'));

  // Remove empty strings and duplicates (Set already handles duplicates)
  return Array.from(variations).filter(v => v.length > 0);
}

/**
 * Generate all variations of an email
 */
export function generateEmailVariations(email: string): string[] {
  if (!email || !email.includes('@')) return [];

  const variations = new Set<string>();
  const trimmed = email.trim().toLowerCase();

  // Add original
  variations.add(trimmed);

  const [localPart, domain] = trimmed.split('@');

  // Email variations (local part only, domain stays same)
  // 1. All lowercase (already added)

  // 2. Dots removed
  const noDots = localPart.replace(/\./g, '');
  variations.add(`${noDots}@${domain}`);

  // 3. CamelCase local part
  if (localPart.includes('.')) {
    const parts = localPart.split('.');
    const camelCase = parts[0] + parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
    variations.add(`${camelCase}@${domain}`);
  }

  // 4. Underscores to dots
  if (localPart.includes('_')) {
    variations.add(`${localPart.replace(/_/g, '.')}@${domain}`);
  }

  // 5. Dots to underscores
  if (localPart.includes('.')) {
    variations.add(`${localPart.replace(/\./g, '_')}@${domain}`);
  }

  // 6. Title case entire local part
  const titleCase = localPart.charAt(0).toUpperCase() + localPart.slice(1);
  variations.add(`${titleCase}@${domain}`);

  return Array.from(variations);
}

/**
 * Generate all variations of a phone number
 */
export function generatePhoneVariations(phone: string): string[] {
  if (!phone || phone.trim() === '') return [];

  const variations = new Set<string>();

  // Add original
  variations.add(phone.trim());

  // Extract digits only
  const digitsOnly = phone.replace(/\D/g, '');

  if (digitsOnly.length === 0) return [phone];

  // 1. Digits only
  variations.add(digitsOnly);

  // For US numbers (10 or 11 digits)
  if (digitsOnly.length === 10) {
    const areaCode = digitsOnly.slice(0, 3);
    const prefix = digitsOnly.slice(3, 6);
    const lineNumber = digitsOnly.slice(6, 10);

    // 2. (XXX) XXX-XXXX
    variations.add(`(${areaCode}) ${prefix}-${lineNumber}`);

    // 3. XXX-XXX-XXXX
    variations.add(`${areaCode}-${prefix}-${lineNumber}`);

    // 4. XXX.XXX.XXXX
    variations.add(`${areaCode}.${prefix}.${lineNumber}`);

    // 5. XXX XXX XXXX
    variations.add(`${areaCode} ${prefix} ${lineNumber}`);

    // 6. +1 XXX XXX XXXX
    variations.add(`+1 ${areaCode} ${prefix} ${lineNumber}`);

    // 7. +1-XXX-XXX-XXXX
    variations.add(`+1-${areaCode}-${prefix}-${lineNumber}`);

    // 8. 1-XXX-XXX-XXXX
    variations.add(`1-${areaCode}-${prefix}-${lineNumber}`);
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    // Has country code
    const areaCode = digitsOnly.slice(1, 4);
    const prefix = digitsOnly.slice(4, 7);
    const lineNumber = digitsOnly.slice(7, 11);

    variations.add(`+${digitsOnly}`);
    variations.add(`+1 ${areaCode} ${prefix} ${lineNumber}`);
    variations.add(`+1-${areaCode}-${prefix}-${lineNumber}`);
    variations.add(`1-${areaCode}-${prefix}-${lineNumber}`);
    variations.add(`(${areaCode}) ${prefix}-${lineNumber}`);
  }

  return Array.from(variations);
}

/**
 * Generate variations for a generic field (company, address, etc.)
 */
export function generateGenericVariations(text: string): string[] {
  if (!text || text.trim() === '') return [];

  const variations = new Set<string>();
  const trimmed = text.trim();

  // Add original
  variations.add(trimmed);

  // Add case variations
  variations.add(trimmed.toLowerCase());
  variations.add(trimmed.toUpperCase());

  // Title case
  const titleCase = trimmed.split(/\s+/).map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
  variations.add(titleCase);

  return Array.from(variations);
}

/**
 * Generate all variations for identity data
 */
export function generateIdentityVariations(identity: {
  name?: string;
  email?: string;
  phone?: string;
  cellPhone?: string;
  company?: string;
  address?: string;
}): Record<string, string[]> {
  const variations: Record<string, string[]> = {};

  if (identity.name) {
    variations.name = generateNameVariations(identity.name);
  }

  if (identity.email) {
    variations.email = generateEmailVariations(identity.email);
  }

  if (identity.phone) {
    variations.phone = generatePhoneVariations(identity.phone);
  }

  if (identity.cellPhone) {
    variations.cellPhone = generatePhoneVariations(identity.cellPhone);
  }

  if (identity.company) {
    variations.company = generateGenericVariations(identity.company);
  }

  if (identity.address) {
    variations.address = generateGenericVariations(identity.address);
  }

  return variations;
}

/**
 * Check if a text contains any variation of the given value
 */
export function containsVariation(text: string, variations: string[]): boolean {
  if (!text || variations.length === 0) return false;

  const lowerText = text.toLowerCase();

  return variations.some(variation => {
    // Case-insensitive search
    return lowerText.includes(variation.toLowerCase());
  });
}

/**
 * Find all variations present in text
 */
export function findVariations(text: string, variations: string[]): string[] {
  if (!text || variations.length === 0) return [];

  const found: string[] = [];
  const lowerText = text.toLowerCase();

  for (const variation of variations) {
    if (lowerText.includes(variation.toLowerCase())) {
      found.push(variation);
    }
  }

  return found;
}

/**
 * Get statistics about variations
 */
export function getVariationStats(variations: Record<string, string[]>): {
  totalVariations: number;
  byField: Record<string, number>;
} {
  let totalVariations = 0;
  const byField: Record<string, number> = {};

  for (const [field, vars] of Object.entries(variations)) {
    byField[field] = vars.length;
    totalVariations += vars.length;
  }

  return { totalVariations, byField };
}
