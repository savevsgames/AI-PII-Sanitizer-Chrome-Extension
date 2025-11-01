/**
 * Input Validation Utilities
 * Provides type-safe validation for all user inputs
 * Part of Phase 1.8 - Security Hardening
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitized?: string;
}

/**
 * Email validation (RFC 5322 simplified)
 * Allows standard email formats
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required' };
  }

  const trimmed = email.trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: 'Email cannot be empty' };
  }

  if (trimmed.length > 254) {
    return { isValid: false, error: 'Email too long (max 254 characters)' };
  }

  // RFC 5322 simplified regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  return { isValid: true, sanitized: trimmed };
}

/**
 * Phone number validation (flexible international format)
 * Allows: +1234567890, (123) 456-7890, 123-456-7890, etc.
 */
export function validatePhone(phone: string): ValidationResult {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, error: 'Phone number is required' };
  }

  const trimmed = phone.trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: 'Phone number cannot be empty' };
  }

  if (trimmed.length > 20) {
    return { isValid: false, error: 'Phone number too long (max 20 characters)' };
  }

  // Extract digits only
  const digits = trimmed.replace(/[^\d]/g, '');

  if (digits.length < 7) {
    return { isValid: false, error: 'Phone number too short (minimum 7 digits)' };
  }

  if (digits.length > 15) {
    return { isValid: false, error: 'Phone number too long (maximum 15 digits)' };
  }

  // Allow common phone number formats
  const phoneRegex = /^[\d\s()+-]+$/;

  if (!phoneRegex.test(trimmed)) {
    return { isValid: false, error: 'Phone number contains invalid characters' };
  }

  return { isValid: true, sanitized: trimmed };
}

/**
 * Name validation (person or company names)
 * Allows letters, spaces, hyphens, apostrophes, and common international characters
 */
export function validateName(name: string, fieldName: string = 'Name'): ValidationResult {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: `${fieldName} is required` };
  }

  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: `${fieldName} cannot be empty` };
  }

  if (trimmed.length < 1) {
    return { isValid: false, error: `${fieldName} too short (minimum 1 character)` };
  }

  if (trimmed.length > 100) {
    return { isValid: false, error: `${fieldName} too long (maximum 100 characters)` };
  }

  // Allow letters, spaces, hyphens, apostrophes, periods, and international characters
  const nameRegex = /^[\p{L}\p{M}\s.'\-]+$/u;

  if (!nameRegex.test(trimmed)) {
    return { isValid: false, error: `${fieldName} contains invalid characters` };
  }

  return { isValid: true, sanitized: trimmed };
}

/**
 * Address validation (street address)
 * Allows letters, numbers, spaces, and common address punctuation
 */
export function validateAddress(address: string): ValidationResult {
  if (!address || typeof address !== 'string') {
    return { isValid: false, error: 'Address is required' };
  }

  const trimmed = address.trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: 'Address cannot be empty' };
  }

  if (trimmed.length < 5) {
    return { isValid: false, error: 'Address too short (minimum 5 characters)' };
  }

  if (trimmed.length > 200) {
    return { isValid: false, error: 'Address too long (maximum 200 characters)' };
  }

  // Allow letters, numbers, spaces, and common address punctuation
  const addressRegex = /^[\p{L}\p{M}\d\s.,'#\-/]+$/u;

  if (!addressRegex.test(trimmed)) {
    return { isValid: false, error: 'Address contains invalid characters' };
  }

  return { isValid: true, sanitized: trimmed };
}

/**
 * Regex pattern validation (for custom rules)
 * Validates regex syntax and security
 */
export function validateRegexPattern(pattern: string): ValidationResult {
  if (!pattern || typeof pattern !== 'string') {
    return { isValid: false, error: 'Regex pattern is required' };
  }

  const trimmed = pattern.trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: 'Regex pattern cannot be empty' };
  }

  if (trimmed.length > 500) {
    return { isValid: false, error: 'Regex pattern too long (maximum 500 characters)' };
  }

  // Check for obvious ReDoS (Regular Expression Denial of Service) patterns
  // Note: This is a simplified check, not comprehensive
  const obviousReDoS = /(\(.*\+.*\).*\+)|(\(.*\*.*\).*\*)/;

  if (obviousReDoS.test(trimmed)) {
    return {
      isValid: false,
      error: 'Regex pattern may cause performance issues (nested quantifiers detected)'
    };
  }

  // Try to compile the regex
  try {
    new RegExp(trimmed);
  } catch (error) {
    return {
      isValid: false,
      error: `Invalid regex syntax: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }

  return { isValid: true, sanitized: trimmed };
}

/**
 * API Key validation (format detection)
 * Validates that the input looks like a plausible API key
 */
export function validateAPIKey(key: string): ValidationResult {
  if (!key || typeof key !== 'string') {
    return { isValid: false, error: 'API key is required' };
  }

  const trimmed = key.trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: 'API key cannot be empty' };
  }

  if (trimmed.length < 10) {
    return { isValid: false, error: 'API key too short (minimum 10 characters)' };
  }

  if (trimmed.length > 500) {
    return { isValid: false, error: 'API key too long (maximum 500 characters)' };
  }

  // API keys should be alphanumeric with some special chars (-, _, .)
  const apiKeyRegex = /^[a-zA-Z0-9._\-]+$/;

  if (!apiKeyRegex.test(trimmed)) {
    return { isValid: false, error: 'API key contains invalid characters' };
  }

  return { isValid: true, sanitized: trimmed };
}

/**
 * Profile name validation
 * Validates profile names for alias profiles
 */
export function validateProfileName(name: string): ValidationResult {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Profile name is required' };
  }

  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: 'Profile name cannot be empty' };
  }

  if (trimmed.length < 2) {
    return { isValid: false, error: 'Profile name too short (minimum 2 characters)' };
  }

  if (trimmed.length > 50) {
    return { isValid: false, error: 'Profile name too long (maximum 50 characters)' };
  }

  // Allow letters, numbers, spaces, hyphens, underscores
  const profileNameRegex = /^[\p{L}\p{M}\d\s_\-]+$/u;

  if (!profileNameRegex.test(trimmed)) {
    return { isValid: false, error: 'Profile name contains invalid characters' };
  }

  return { isValid: true, sanitized: trimmed };
}

/**
 * Custom rule name validation
 */
export function validateRuleName(name: string): ValidationResult {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Rule name is required' };
  }

  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: 'Rule name cannot be empty' };
  }

  if (trimmed.length < 2) {
    return { isValid: false, error: 'Rule name too short (minimum 2 characters)' };
  }

  if (trimmed.length > 100) {
    return { isValid: false, error: 'Rule name too long (maximum 100 characters)' };
  }

  // Allow letters, numbers, spaces, hyphens, underscores
  const ruleNameRegex = /^[\p{L}\p{M}\d\s_\-]+$/u;

  if (!ruleNameRegex.test(trimmed)) {
    return { isValid: false, error: 'Rule name contains invalid characters' };
  }

  return { isValid: true, sanitized: trimmed };
}

/**
 * Description validation (for profiles, rules, etc.)
 */
export function validateDescription(description: string): ValidationResult {
  if (!description || typeof description !== 'string') {
    // Description is optional
    return { isValid: true, sanitized: '' };
  }

  const trimmed = description.trim();

  if (trimmed.length === 0) {
    return { isValid: true, sanitized: '' };
  }

  if (trimmed.length > 500) {
    return { isValid: false, error: 'Description too long (maximum 500 characters)' };
  }

  return { isValid: true, sanitized: trimmed };
}

/**
 * URL validation (for custom rule patterns)
 */
export function validateURL(url: string): ValidationResult {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL is required' };
  }

  const trimmed = url.trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: 'URL cannot be empty' };
  }

  if (trimmed.length > 2048) {
    return { isValid: false, error: 'URL too long (maximum 2048 characters)' };
  }

  // Try to parse as URL
  try {
    const parsedUrl = new URL(trimmed);

    // Only allow http and https
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return { isValid: false, error: 'URL must use http:// or https://' };
    }

    return { isValid: true, sanitized: trimmed };
  } catch {
    // Not a valid URL, try as URL pattern (with wildcards)
    const urlPatternRegex = /^(?:https?:\/\/)?(?:\*\.)?[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*(?:\/.*)?$/;

    if (!urlPatternRegex.test(trimmed)) {
      return { isValid: false, error: 'Invalid URL or URL pattern' };
    }

    return { isValid: true, sanitized: trimmed };
  }
}

/**
 * Generic text input validation
 * For fields that don't have specific validation rules
 */
export function validateTextInput(
  text: string,
  options: {
    fieldName?: string;
    minLength?: number;
    maxLength?: number;
    required?: boolean;
  } = {}
): ValidationResult {
  const {
    fieldName = 'Input',
    minLength = 0,
    maxLength = 1000,
    required = true
  } = options;

  if (!text || typeof text !== 'string') {
    if (required) {
      return { isValid: false, error: `${fieldName} is required` };
    }
    return { isValid: true, sanitized: '' };
  }

  const trimmed = text.trim();

  if (trimmed.length === 0 && required) {
    return { isValid: false, error: `${fieldName} cannot be empty` };
  }

  if (trimmed.length < minLength) {
    return { isValid: false, error: `${fieldName} too short (minimum ${minLength} characters)` };
  }

  if (trimmed.length > maxLength) {
    return { isValid: false, error: `${fieldName} too long (maximum ${maxLength} characters)` };
  }

  return { isValid: true, sanitized: trimmed };
}

/**
 * Sanitize HTML input (prevent XSS)
 * This is a defense-in-depth measure alongside escapeHtml()
 */
export function sanitizeHTML(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Remove all HTML tags
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Validate and sanitize all profile fields
 */
export function validateProfileFields(profile: {
  profileName?: string;
  real?: { name?: string; email?: string; phone?: string; address?: string; company?: string };
  alias?: { name?: string; email?: string; phone?: string; address?: string; company?: string };
  description?: string;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Validate profile name
  if (profile.profileName) {
    const result = validateProfileName(profile.profileName);
    if (!result.isValid) {
      errors.profileName = result.error!;
    }
  }

  // Validate real fields
  if (profile.real) {
    if (profile.real.name) {
      const result = validateName(profile.real.name, 'Real name');
      if (!result.isValid) errors['real.name'] = result.error!;
    }
    if (profile.real.email) {
      const result = validateEmail(profile.real.email);
      if (!result.isValid) errors['real.email'] = result.error!;
    }
    if (profile.real.phone) {
      const result = validatePhone(profile.real.phone);
      if (!result.isValid) errors['real.phone'] = result.error!;
    }
    if (profile.real.address) {
      const result = validateAddress(profile.real.address);
      if (!result.isValid) errors['real.address'] = result.error!;
    }
    if (profile.real.company) {
      const result = validateName(profile.real.company, 'Company name');
      if (!result.isValid) errors['real.company'] = result.error!;
    }
  }

  // Validate alias fields
  if (profile.alias) {
    if (profile.alias.name) {
      const result = validateName(profile.alias.name, 'Alias name');
      if (!result.isValid) errors['alias.name'] = result.error!;
    }
    if (profile.alias.email) {
      const result = validateEmail(profile.alias.email);
      if (!result.isValid) errors['alias.email'] = result.error!;
    }
    if (profile.alias.phone) {
      const result = validatePhone(profile.alias.phone);
      if (!result.isValid) errors['alias.phone'] = result.error!;
    }
    if (profile.alias.address) {
      const result = validateAddress(profile.alias.address);
      if (!result.isValid) errors['alias.address'] = result.error!;
    }
    if (profile.alias.company) {
      const result = validateName(profile.alias.company, 'Alias company');
      if (!result.isValid) errors['alias.company'] = result.error!;
    }
  }

  // Validate description
  if (profile.description) {
    const result = validateDescription(profile.description);
    if (!result.isValid) errors.description = result.error!;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
