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
export declare function validateEmail(email: string): ValidationResult;
/**
 * Phone number validation (flexible international format)
 * Allows: +1234567890, (123) 456-7890, 123-456-7890, etc.
 */
export declare function validatePhone(phone: string): ValidationResult;
/**
 * Name validation (person or company names)
 * Allows letters, spaces, hyphens, apostrophes, and common international characters
 */
export declare function validateName(name: string, fieldName?: string): ValidationResult;
/**
 * Address validation (street address)
 * Allows letters, numbers, spaces, and common address punctuation
 */
export declare function validateAddress(address: string): ValidationResult;
/**
 * Regex pattern validation (for custom rules)
 * Validates regex syntax and security
 */
export declare function validateRegexPattern(pattern: string): ValidationResult;
/**
 * API Key validation (format detection)
 * Validates that the input looks like a plausible API key
 */
export declare function validateAPIKey(key: string): ValidationResult;
/**
 * Profile name validation
 * Validates profile names for alias profiles
 */
export declare function validateProfileName(name: string): ValidationResult;
/**
 * Custom rule name validation
 */
export declare function validateRuleName(name: string): ValidationResult;
/**
 * Description validation (for profiles, rules, etc.)
 */
export declare function validateDescription(description: string): ValidationResult;
/**
 * URL validation (for custom rule patterns)
 */
export declare function validateURL(url: string): ValidationResult;
/**
 * Generic text input validation
 * For fields that don't have specific validation rules
 */
export declare function validateTextInput(text: string, options?: {
    fieldName?: string;
    minLength?: number;
    maxLength?: number;
    required?: boolean;
}): ValidationResult;
/**
 * Sanitize HTML input (prevent XSS)
 * This is a defense-in-depth measure alongside escapeHtml()
 */
export declare function sanitizeHTML(html: string): string;
/**
 * Validate and sanitize all profile fields
 */
export declare function validateProfileFields(profile: {
    profileName?: string;
    real?: {
        name?: string;
        email?: string;
        phone?: string;
        address?: string;
        company?: string;
    };
    alias?: {
        name?: string;
        email?: string;
        phone?: string;
        address?: string;
        company?: string;
    };
    description?: string;
}): {
    isValid: boolean;
    errors: Record<string, string>;
};
//# sourceMappingURL=validation.d.ts.map