/**
 * Coder/Tech Name Pools for Alias Generation (PRO Feature)
 *
 * Fun, comedic, and cool coder-themed aliases for developers.
 * Perfect for tech professionals, hackers, and coding enthusiasts.
 *
 * Pools:
 * - 500 tech first names (programming terms, famous devs, jokes)
 * - 500 coding surnames (languages, frameworks, algorithms, memes)
 * - 100 funny company names (tech parodies and developer jokes)
 * - 50 developer email domains
 *
 * Examples: "Debug NullPointer", "Cache StackOverflow", "Ada JavaScript"
 *
 * @module coderNames
 * @tier PRO
 */
/**
 * Pool of 500 coder-themed first names
 * Mix of tech terms, programming languages, and coding culture
 */
export declare const CODER_FIRST_NAMES: readonly string[];
/**
 * Pool of 500 coding surnames
 * Languages, frameworks, algorithms, concepts, and developer jokes
 */
export declare const CODER_LAST_NAMES: readonly string[];
/**
 * Pool of 100 funny coder companies
 */
export declare const CODER_COMPANIES: readonly string[];
/**
 * Pool of 50 developer email domains
 */
export declare const CODER_DOMAINS: readonly string[];
/**
 * Type definitions
 */
export type CoderFirstName = typeof CODER_FIRST_NAMES[number];
export type CoderLastName = typeof CODER_LAST_NAMES[number];
export type CoderCompany = typeof CODER_COMPANIES[number];
export type CoderDomain = typeof CODER_DOMAINS[number];
/**
 * Pool stats
 */
export declare const CODER_POOL_STATS: {
    readonly firstNames: number;
    readonly lastNames: number;
    readonly companies: number;
    readonly domains: number;
};
//# sourceMappingURL=coderNames.d.ts.map