/**
 * Template Engine
 * Handles placeholder parsing and replacement for prompt templates
 */
import { PromptTemplate, AliasProfile } from './types';
/**
 * Supported placeholder fields
 */
export declare const SUPPORTED_PLACEHOLDERS: readonly ["name", "email", "phone", "cellPhone", "address", "company", "jobTitle", "alias_name", "alias_email", "alias_phone", "alias_cellPhone", "alias_address", "alias_company", "alias_jobTitle"];
export type PlaceholderField = typeof SUPPORTED_PLACEHOLDERS[number];
/**
 * Parsed placeholder information
 */
export interface ParsedPlaceholder {
    fullMatch: string;
    field: string;
    isAlias: boolean;
    position: number;
}
/**
 * Template replacement result
 */
export interface TemplateResult {
    content: string;
    replacements: Array<{
        placeholder: string;
        value: string;
        field: string;
    }>;
    missingFields: string[];
}
/**
 * Parse template content and extract all placeholders
 */
export declare function parsePlaceholders(template: string): ParsedPlaceholder[];
/**
 * Replace placeholders in template with profile data
 * @param template Template content with {{placeholders}}
 * @param profile Profile to use for data
 * @param useAlias If true, use alias data; if false, use real data
 * @returns Result with replaced content and metadata
 */
export declare function replacePlaceholders(template: string, profile: AliasProfile, useAlias?: boolean): TemplateResult;
/**
 * Validate template content
 * Checks for unsupported placeholders or invalid syntax
 */
export declare function validateTemplate(template: string): {
    valid: boolean;
    errors: string[];
    warnings: string[];
};
/**
 * Get list of placeholders used in a template
 * Useful for showing user which fields are needed
 */
export declare function getUsedPlaceholders(template: string): string[];
/**
 * Preview template with placeholder names shown
 * Useful for displaying template in UI before filling
 */
export declare function previewTemplate(template: string): string;
/**
 * Generate example template filled with placeholder names
 * Useful for showing users what the template will look like
 */
export declare function generateExample(template: PromptTemplate): string;
//# sourceMappingURL=templateEngine.d.ts.map