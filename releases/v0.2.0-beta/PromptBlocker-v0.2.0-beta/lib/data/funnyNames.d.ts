/**
 * Funny Names Alias Generation System - Data Pools
 *
 * PRO tier feature providing hilarious, family-friendly comedic aliases.
 * Names are designed to work in various combinations to create funny results.
 *
 * @module funnyNames
 */
/**
 * Pool of 500 funny first names (200 male, 200 female, 100 neutral)
 */
export declare const FUNNY_FIRST_NAMES: readonly string[];
/**
 * Pool of 500 funny surnames
 */
export declare const FUNNY_LAST_NAMES: readonly string[];
/**
 * Pool of 100 hilarious company names
 */
export declare const FUNNY_COMPANIES: readonly string[];
/**
 * Pool of 50 funny email domains
 */
export declare const FUNNY_DOMAINS: readonly string[];
export type FunnyFirstName = typeof FUNNY_FIRST_NAMES[number];
export type FunnyLastName = typeof FUNNY_LAST_NAMES[number];
export type FunnyCompany = typeof FUNNY_COMPANIES[number];
export type FunnyDomain = typeof FUNNY_DOMAINS[number];
//# sourceMappingURL=funnyNames.d.ts.map