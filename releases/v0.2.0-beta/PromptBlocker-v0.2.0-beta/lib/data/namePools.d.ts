/**
 * Name Pools for Alias Generation
 *
 * Pre-built data pools for generating realistic fake identities.
 * No AI needed - instant generation, works offline.
 *
 * Pools:
 * - 500 first names (200 male, 200 female, 100 neutral)
 * - 500 last names (diverse cultural backgrounds)
 * - 100 company names
 * - 50 email domains
 *
 * @module namePools
 */
/**
 * Pool of 500 diverse first names
 * Distribution: 200 male, 200 female, 100 gender-neutral
 */
export declare const FIRST_NAMES: readonly string[];
/**
 * Pool of 500 common surnames from diverse backgrounds
 */
export declare const LAST_NAMES: readonly string[];
/**
 * Pool of 100 realistic business names
 */
export declare const COMPANY_NAMES: readonly string[];
/**
 * Pool of 50 professional email domains
 */
export declare const EMAIL_DOMAINS: readonly string[];
/**
 * Pool of 100 realistic US addresses
 */
export declare const ADDRESSES: readonly string[];
/**
 * Common area codes for phone number generation
 */
export declare const AREA_CODES: readonly string[];
/**
 * Type definitions for type safety
 */
export type FirstName = typeof FIRST_NAMES[number];
export type LastName = typeof LAST_NAMES[number];
export type CompanyName = typeof COMPANY_NAMES[number];
export type EmailDomain = typeof EMAIL_DOMAINS[number];
export type Address = typeof ADDRESSES[number];
export type AreaCode = typeof AREA_CODES[number];
/**
 * Metadata about the data pools
 */
export declare const POOL_STATS: {
    readonly firstNames: number;
    readonly lastNames: number;
    readonly companyNames: number;
    readonly emailDomains: number;
    readonly addresses: number;
    readonly areaCodes: number;
};
//# sourceMappingURL=namePools.d.ts.map