/**
 * Quick Alias Generator
 *
 * Template-based alias profile generation system for individual users (FREE + PRO tiers).
 * Uses pre-built name pools for instant, reliable profile generation (<100ms).
 *
 * Architecture designed for future enterprise expansion (2026+) while focusing
 * on individual user needs for 2024-2025 launch.
 */
export type TierLevel = 'free' | 'pro';
export interface GenerationTemplate {
    id: string;
    name: string;
    tier: TierLevel;
    description: string;
    namePattern: string;
    emailPattern: string;
    phonePattern?: string;
    cellPhonePattern?: string;
    addressPattern?: string;
    companyPattern?: string;
}
export interface GeneratedProfile {
    name: string;
    email: string;
    phone?: string;
    cellPhone?: string;
    address?: string;
    company?: string;
    template: string;
    timestamp: number;
}
export interface BulkGenerationOptions {
    templateId: string;
    count: number;
    ensureUnique?: boolean;
}
export declare const BUILTIN_TEMPLATES: GenerationTemplate[];
/**
 * Generate a single alias profile using specified template
 * @param templateId - ID of template to use
 * @returns Generated profile
 * @throws Error if template not found
 */
export declare function generateProfile(templateId: string): GeneratedProfile;
/**
 * Generate multiple profiles in bulk
 * @param options - Bulk generation options
 * @returns Array of generated profiles
 * @throws Error if template not found or count exceeds tier limits
 */
export declare function generateBulkProfiles(options: BulkGenerationOptions): GeneratedProfile[];
/**
 * Get templates available for specified tier
 * @param tier - User's subscription tier
 * @returns Array of available templates
 */
export declare function getAvailableTemplates(tier: TierLevel): GenerationTemplate[];
/**
 * Check if user can access template based on tier
 * @param templateId - Template to check
 * @param userTier - User's subscription tier
 * @returns True if accessible
 */
export declare function canAccessTemplate(templateId: string, userTier: TierLevel): boolean;
/**
 * Get maximum bulk generation count for tier
 * @param tier - User's subscription tier
 * @returns Maximum number of profiles that can be generated at once
 */
export declare function getMaxBulkCount(tier: TierLevel): number;
/**
 * FUTURE: Custom template support for PRO users
 *
 * Allows users to create and save their own templates with custom patterns.
 * Will be stored in chrome.storage.local and synced across devices.
 */
export interface CustomTemplate extends GenerationTemplate {
    userId?: string;
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
/**
 * Get statistics about available name pools
 */
export declare function getPoolStatistics(): {
    standard: {
        firstNames: number;
        lastNames: number;
        companies: number;
        domains: number;
        combinations: number;
    };
    fantasy: {
        firstNames: number;
        lastNames: number;
        organizations: number;
        domains: number;
        combinations: number;
    };
    coder: {
        firstNames: number;
        lastNames: number;
        companies: number;
        domains: number;
        combinations: number;
    };
    vintage: {
        firstNames: number;
        lastNames: number;
        establishments: number;
        domains: number;
        combinations: number;
    };
    funny: {
        firstNames: number;
        lastNames: number;
        companies: number;
        domains: number;
        combinations: number;
    };
    totalCombinations: number;
};
/**
 * Preview what a template pattern will generate (for UI previews)
 * @param pattern - Template pattern string
 * @returns Example output
 */
export declare function previewPattern(pattern: string): string;
//# sourceMappingURL=aliasGenerator.d.ts.map