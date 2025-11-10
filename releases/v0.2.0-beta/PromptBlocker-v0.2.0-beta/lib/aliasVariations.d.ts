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
export declare function generateNameVariations(name: string): string[];
/**
 * Generate all variations of an email
 */
export declare function generateEmailVariations(email: string): string[];
/**
 * Generate all variations of a phone number
 */
export declare function generatePhoneVariations(phone: string): string[];
/**
 * Generate variations for a generic field (company, address, etc.)
 */
export declare function generateGenericVariations(text: string): string[];
/**
 * Generate all variations for identity data
 */
export declare function generateIdentityVariations(identity: {
    name?: string;
    email?: string;
    phone?: string;
    cellPhone?: string;
    company?: string;
    address?: string;
}): Record<string, string[]>;
/**
 * Check if a text contains any variation of the given value
 */
export declare function containsVariation(text: string, variations: string[]): boolean;
/**
 * Find all variations present in text
 */
export declare function findVariations(text: string, variations: string[]): string[];
/**
 * Get statistics about variations
 */
export declare function getVariationStats(variations: Record<string, string[]>): {
    totalVariations: number;
    byField: Record<string, number>;
};
//# sourceMappingURL=aliasVariations.d.ts.map