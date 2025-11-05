/**
 * Quick Alias Generator
 *
 * Template-based alias profile generation system for individual users (FREE + PRO tiers).
 * Uses pre-built name pools for instant, reliable profile generation (<100ms).
 *
 * Architecture designed for future enterprise expansion (2026+) while focusing
 * on individual user needs for 2024-2025 launch.
 */

import {
  FIRST_NAMES,
  LAST_NAMES,
  COMPANY_NAMES,
  EMAIL_DOMAINS,
  ADDRESSES,
  AREA_CODES,
} from './data/namePools';
import { FANTASY_FIRST_NAMES, FANTASY_LAST_NAMES, FANTASY_ORGANIZATIONS, FANTASY_DOMAINS } from './data/fantasyNames';
import { CODER_FIRST_NAMES, CODER_LAST_NAMES, CODER_COMPANIES, CODER_DOMAINS } from './data/coderNames';
import { VINTAGE_FIRST_NAMES, VINTAGE_LAST_NAMES, VINTAGE_ESTABLISHMENTS, VINTAGE_DOMAINS } from './data/vintageNames';
import { FUNNY_FIRST_NAMES, FUNNY_LAST_NAMES, FUNNY_COMPANIES, FUNNY_DOMAINS } from './data/funnyNames';

// ============================================================================
// Types
// ============================================================================

export type TierLevel = 'free' | 'pro';

export interface GenerationTemplate {
  id: string;
  name: string;
  tier: TierLevel;
  description: string;
  namePattern: string;        // e.g., "{{first}} {{last}}"
  emailPattern: string;       // e.g., "{{first}}.{{last}}@{{domain}}"
  phonePattern?: string;      // e.g., "({{areaCode}}) {{exchange}}-{{lineNumber}}"
  cellPhonePattern?: string;  // e.g., "({{areaCode}}) {{exchange}}-{{lineNumber}}"
  addressPattern?: string;    // e.g., "{{address}}"
  companyPattern?: string;    // e.g., "{{company}}"
}

export interface GeneratedProfile {
  name: string;
  email: string;
  phone?: string;
  cellPhone?: string;
  address?: string;
  company?: string;
  template: string; // template ID used
  timestamp: number;
}

export interface BulkGenerationOptions {
  templateId: string;
  count: number; // FREE: 1, PRO: 5-10
  ensureUnique?: boolean; // Prevent duplicate names in batch
}

// ============================================================================
// Built-in Templates
// ============================================================================

export const BUILTIN_TEMPLATES: GenerationTemplate[] = [
  // FREE Templates (4)
  {
    id: 'standard',
    name: 'Standard Professional',
    tier: 'free',
    description: 'Professional first and last name with standard email',
    namePattern: '{{first}} {{last}}',
    emailPattern: '{{first}}.{{last}}@{{domain}}',
    phonePattern: '({{areaCode}}) {{exchange}}-{{lineNumber}}',
    companyPattern: '{{company}}',
  },
  {
    id: 'with-middle',
    name: 'With Middle Initial',
    tier: 'free',
    description: 'First name, middle initial, and last name',
    namePattern: '{{first}} {{middleInitial}}. {{last}}',
    emailPattern: '{{first}}.{{middleInitial}}.{{last}}@{{domain}}',
    phonePattern: '({{areaCode}}) {{exchange}}-{{lineNumber}}',
    companyPattern: '{{company}}',
  },
  {
    id: 'casual',
    name: 'Casual Style',
    tier: 'free',
    description: 'Casual first name only email format',
    namePattern: '{{first}} {{last}}',
    emailPattern: '{{first}}{{lastInitial}}@{{domain}}',
    phonePattern: '({{areaCode}}) {{exchange}}-{{lineNumber}}',
    companyPattern: '{{company}}',
  },
  {
    id: 'professional',
    name: 'Corporate Professional',
    tier: 'free',
    description: 'Formal business format with full details',
    namePattern: '{{first}} {{last}}',
    emailPattern: '{{first}}.{{last}}@{{domain}}',
    phonePattern: '({{areaCode}}) {{exchange}}-{{lineNumber}}',
    cellPhonePattern: '({{areaCode}}) {{exchange}}-{{lineNumber}}',
    addressPattern: '{{address}}',
    companyPattern: '{{company}}',
  },

  // PRO Templates (8)
  {
    id: 'fantasy-hero',
    name: 'Fantasy Hero',
    tier: 'pro',
    description: 'Epic fantasy names for RPG and medieval themes',
    namePattern: '{{fantasyFirst}} {{fantasyLast}}',
    emailPattern: '{{fantasyFirst}}.{{fantasyLast}}@{{fantasyDomain}}',
    companyPattern: '{{fantasyOrg}}',
  },
  {
    id: 'coder-dev',
    name: 'Coder/Developer',
    tier: 'pro',
    description: 'Tech-themed names with programming references',
    namePattern: '{{coderFirst}} {{coderLast}}',
    emailPattern: '{{coderFirst}}.{{coderLast}}@{{coderDomain}}',
    companyPattern: '{{coderCompany}}',
  },
  {
    id: 'vintage-aristocrat',
    name: 'Vintage Aristocrat',
    tier: 'pro',
    description: 'Victorian-era aristocratic names (1880s-1920s)',
    namePattern: '{{vintageFirst}} {{vintageLast}}',
    emailPattern: '{{vintageFirst}}.{{vintageLast}}@{{vintageDomain}}',
    companyPattern: '{{vintageEstablishment}}',
  },
  {
    id: 'funny-silly',
    name: 'Funny & Silly',
    tier: 'pro',
    description: 'Hilarious family-friendly comedic names',
    namePattern: '{{funnyFirst}} {{funnyLast}}',
    emailPattern: '{{funnyFirst}}.{{funnyLast}}@{{funnyDomain}}',
    companyPattern: '{{funnyCompany}}',
  },
  {
    id: 'fantasy-casual',
    name: 'Fantasy Casual',
    tier: 'pro',
    description: 'Short fantasy names with casual email',
    namePattern: '{{fantasyFirst}} {{fantasyLast}}',
    emailPattern: '{{fantasyFirst}}@{{fantasyDomain}}',
    companyPattern: '{{fantasyOrg}}',
  },
  {
    id: 'coder-ninja',
    name: 'Code Ninja',
    tier: 'pro',
    description: 'Elite developer theme with tech jargon',
    namePattern: '{{coderFirst}} "{{coderLast}}" {{last}}',
    emailPattern: '{{coderFirst}}.{{coderLast}}@{{coderDomain}}',
    companyPattern: '{{coderCompany}}',
  },
  {
    id: 'vintage-formal',
    name: 'Gilded Age Formal',
    tier: 'pro',
    description: 'Extremely formal Victorian aristocratic style',
    namePattern: '{{vintageFirst}} {{first}} {{vintageLast}}',
    emailPattern: '{{vintageLast}}@{{vintageDomain}}',
    companyPattern: '{{vintageEstablishment}}',
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get random element from readonly array
 */
function getRandomElement<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate random 3-digit exchange (200-999, avoiding reserved)
 */
function generateExchange(): string {
  return String(Math.floor(Math.random() * 800) + 200).padStart(3, '0');
}

/**
 * Generate random 4-digit line number (0000-9999)
 */
function generateLineNumber(): string {
  return String(Math.floor(Math.random() * 10000)).padStart(4, '0');
}

/**
 * Generate random alphabet letter for middle initial
 */
function generateMiddleInitial(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return letters[Math.floor(Math.random() * letters.length)];
}

/**
 * Sanitize string for email use (lowercase, remove spaces, special chars)
 */
function sanitizeForEmail(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, '')
    .replace(/\.+/g, '.') // Collapse multiple dots
    .replace(/^\.+|\.+$/g, ''); // Remove leading/trailing dots
}

/**
 * Get placeholder values for pattern replacement
 */
function getPlaceholderValues(): Record<string, string> {
  // Standard pools
  const first = getRandomElement(FIRST_NAMES);
  const last = getRandomElement(LAST_NAMES);
  const company = getRandomElement(COMPANY_NAMES);
  const domain = getRandomElement(EMAIL_DOMAINS);
  const address = getRandomElement(ADDRESSES);
  const areaCode = getRandomElement(AREA_CODES);

  // Fantasy pools
  const fantasyFirst = getRandomElement(FANTASY_FIRST_NAMES);
  const fantasyLast = getRandomElement(FANTASY_LAST_NAMES);
  const fantasyOrg = getRandomElement(FANTASY_ORGANIZATIONS);
  const fantasyDomain = getRandomElement(FANTASY_DOMAINS);

  // Coder pools
  const coderFirst = getRandomElement(CODER_FIRST_NAMES);
  const coderLast = getRandomElement(CODER_LAST_NAMES);
  const coderCompany = getRandomElement(CODER_COMPANIES);
  const coderDomain = getRandomElement(CODER_DOMAINS);

  // Vintage pools
  const vintageFirst = getRandomElement(VINTAGE_FIRST_NAMES);
  const vintageLast = getRandomElement(VINTAGE_LAST_NAMES);
  const vintageEstablishment = getRandomElement(VINTAGE_ESTABLISHMENTS);
  const vintageDomain = getRandomElement(VINTAGE_DOMAINS);

  // Funny pools
  const funnyFirst = getRandomElement(FUNNY_FIRST_NAMES);
  const funnyLast = getRandomElement(FUNNY_LAST_NAMES);
  const funnyCompany = getRandomElement(FUNNY_COMPANIES);
  const funnyDomain = getRandomElement(FUNNY_DOMAINS);

  return {
    // Standard
    first,
    last,
    company,
    domain,
    address,
    areaCode,
    exchange: generateExchange(),
    lineNumber: generateLineNumber(),
    middleInitial: generateMiddleInitial(),
    lastInitial: last[0].toUpperCase(),

    // Fantasy
    fantasyFirst,
    fantasyLast,
    fantasyOrg,
    fantasyDomain,

    // Coder
    coderFirst,
    coderLast,
    coderCompany,
    coderDomain,

    // Vintage
    vintageFirst,
    vintageLast,
    vintageEstablishment,
    vintageDomain,

    // Funny
    funnyFirst,
    funnyLast,
    funnyCompany,
    funnyDomain,
  };
}

/**
 * Replace {{placeholder}} patterns in template string
 */
function replacePlaceholders(pattern: string, values: Record<string, string>): string {
  return pattern.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return values[key] || match; // Keep original if key not found
  });
}

// ============================================================================
// Core Generation Functions
// ============================================================================

/**
 * Generate a single alias profile using specified template
 * @param templateId - ID of template to use
 * @returns Generated profile
 * @throws Error if template not found
 */
export function generateProfile(templateId: string): GeneratedProfile {
  const template = BUILTIN_TEMPLATES.find((t) => t.id === templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  const values = getPlaceholderValues();

  // Generate name
  const name = replacePlaceholders(template.namePattern, values);

  // Generate email (sanitize name parts)
  const emailPattern = template.emailPattern.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    if (key === 'domain' || key.includes('Domain')) {
      return `{{${key}}}`; // Keep domain as-is
    }
    // Sanitize other parts for email
    const value = values[key] || '';
    return sanitizeForEmail(value);
  });
  const email = replacePlaceholders(emailPattern, values);

  // Generate phone (optional)
  const phone = template.phonePattern
    ? replacePlaceholders(template.phonePattern, values)
    : undefined;

  // Generate cellPhone (optional)
  const cellPhone = template.cellPhonePattern
    ? replacePlaceholders(template.cellPhonePattern, values)
    : undefined;

  // Generate address (optional)
  const address = template.addressPattern
    ? replacePlaceholders(template.addressPattern, values)
    : undefined;

  // Generate company (optional)
  const company = template.companyPattern
    ? replacePlaceholders(template.companyPattern, values)
    : undefined;

  return {
    name,
    email,
    phone,
    cellPhone,
    address,
    company,
    template: templateId,
    timestamp: Date.now(),
  };
}

/**
 * Generate multiple profiles in bulk
 * @param options - Bulk generation options
 * @returns Array of generated profiles
 * @throws Error if template not found or count exceeds tier limits
 */
export function generateBulkProfiles(options: BulkGenerationOptions): GeneratedProfile[] {
  const { templateId, count, ensureUnique = true } = options;

  if (count < 1 || count > 10) {
    throw new Error('Bulk generation count must be between 1 and 10');
  }

  const template = BUILTIN_TEMPLATES.find((t) => t.id === templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  const profiles: GeneratedProfile[] = [];
  const usedNames = new Set<string>();

  let attempts = 0;
  const maxAttempts = count * 100; // Prevent infinite loops

  while (profiles.length < count && attempts < maxAttempts) {
    attempts++;
    const profile = generateProfile(templateId);

    if (ensureUnique) {
      if (!usedNames.has(profile.name)) {
        usedNames.add(profile.name);
        profiles.push(profile);
      }
    } else {
      profiles.push(profile);
    }
  }

  if (profiles.length < count) {
    console.warn(`Only generated ${profiles.length} unique profiles out of requested ${count}`);
  }

  return profiles;
}

/**
 * Get templates available for specified tier
 * @param tier - User's subscription tier
 * @returns Array of available templates
 */
export function getAvailableTemplates(tier: TierLevel): GenerationTemplate[] {
  if (tier === 'pro') {
    return BUILTIN_TEMPLATES; // All templates
  }
  return BUILTIN_TEMPLATES.filter((t) => t.tier === 'free');
}

/**
 * Check if user can access template based on tier
 * @param templateId - Template to check
 * @param userTier - User's subscription tier
 * @returns True if accessible
 */
export function canAccessTemplate(templateId: string, userTier: TierLevel): boolean {
  const template = BUILTIN_TEMPLATES.find((t) => t.id === templateId);
  if (!template) return false;

  if (template.tier === 'free') return true;
  return userTier === 'pro';
}

/**
 * Get maximum bulk generation count for tier
 * @param tier - User's subscription tier
 * @returns Maximum number of profiles that can be generated at once
 */
export function getMaxBulkCount(tier: TierLevel): number {
  switch (tier) {
    case 'free':
      return 1; // Single generation only
    case 'pro':
      return 10; // Bulk 5-10
    default:
      return 1;
  }
}

// ============================================================================
// Future Enterprise Expansion (2026+)
// ============================================================================

/**
 * FUTURE: Custom template support for PRO users
 *
 * Allows users to create and save their own templates with custom patterns.
 * Will be stored in chrome.storage.local and synced across devices.
 */
export interface CustomTemplate extends GenerationTemplate {
  userId?: string; // FUTURE: For enterprise user association
  createdAt: number;
  updatedAt: number;
}

/**
 * FUTURE: Sequential ID generation for enterprise
 *
 * Enterprise templates will support patterns like:
 * - {{id5}} = 00054 (5-digit zero-padded)
 * - {{dept}} = A, B, C (department codes)
 * - {{sequential}} = auto-incrementing counter
 *
 * Example: "employee-{{id5}}{{dept}}" → "employee-00054A"
 */

/**
 * FUTURE: Organization-level template sharing
 *
 * Enterprise admins can create templates that are shared across
 * their organization, with centralized management and usage tracking.
 */

// ============================================================================
// Statistics & Utilities
// ============================================================================

/**
 * Get statistics about available name pools
 */
export function getPoolStatistics() {
  return {
    standard: {
      firstNames: FIRST_NAMES.length,
      lastNames: LAST_NAMES.length,
      companies: COMPANY_NAMES.length,
      domains: EMAIL_DOMAINS.length,
      combinations: FIRST_NAMES.length * LAST_NAMES.length,
    },
    fantasy: {
      firstNames: FANTASY_FIRST_NAMES.length,
      lastNames: FANTASY_LAST_NAMES.length,
      organizations: FANTASY_ORGANIZATIONS.length,
      domains: FANTASY_DOMAINS.length,
      combinations: FANTASY_FIRST_NAMES.length * FANTASY_LAST_NAMES.length,
    },
    coder: {
      firstNames: CODER_FIRST_NAMES.length,
      lastNames: CODER_LAST_NAMES.length,
      companies: CODER_COMPANIES.length,
      domains: CODER_DOMAINS.length,
      combinations: CODER_FIRST_NAMES.length * CODER_LAST_NAMES.length,
    },
    vintage: {
      firstNames: VINTAGE_FIRST_NAMES.length,
      lastNames: VINTAGE_LAST_NAMES.length,
      establishments: VINTAGE_ESTABLISHMENTS.length,
      domains: VINTAGE_DOMAINS.length,
      combinations: VINTAGE_FIRST_NAMES.length * VINTAGE_LAST_NAMES.length,
    },
    funny: {
      firstNames: FUNNY_FIRST_NAMES.length,
      lastNames: FUNNY_LAST_NAMES.length,
      companies: FUNNY_COMPANIES.length,
      domains: FUNNY_DOMAINS.length,
      combinations: FUNNY_FIRST_NAMES.length * FUNNY_LAST_NAMES.length,
    },
    totalCombinations:
      (FIRST_NAMES.length * LAST_NAMES.length) +
      (FANTASY_FIRST_NAMES.length * FANTASY_LAST_NAMES.length) +
      (CODER_FIRST_NAMES.length * CODER_LAST_NAMES.length) +
      (VINTAGE_FIRST_NAMES.length * VINTAGE_LAST_NAMES.length) +
      (FUNNY_FIRST_NAMES.length * FUNNY_LAST_NAMES.length),
  };
}

/**
 * Preview what a template pattern will generate (for UI previews)
 * @param pattern - Template pattern string
 * @returns Example output
 */
export function previewPattern(pattern: string): string {
  const values = getPlaceholderValues();
  return replacePlaceholders(pattern, values);
}
