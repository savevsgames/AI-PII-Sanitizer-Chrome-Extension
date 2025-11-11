/**
 * Vintage/Old-Timey Name Pools for Alias Generation (PRO Feature)
 *
 * Aristocratic names from the Gilded Age & Victorian Era (1880s-1920s).
 * Extremely obscure names from high society - perfect for Great Gatsby vibes.
 *
 * Pools:
 * - 500 vintage first names (Algernon, Araminta, Worthington, etc.)
 * - 500 aristocratic surnames (double-barreled, titled families)
 * - 100 period establishments (trading companies, banking houses, clubs)
 * - 50 Victorian-era domains
 *
 * Examples: "Lord Worthington Cholmondeley-Warner", "Lady Araminta Cavendish-Bentinck"
 *
 * @module vintageNames
 * @tier PRO
 */
/**
 * Pool of 500 vintage first names from the Gilded Age
 * Obscure aristocratic names rarely used today
 */
export declare const VINTAGE_FIRST_NAMES: readonly string[];
/**
 * Pool of 500 aristocratic surnames
 * Double-barreled names, titled families, old money
 */
export declare const VINTAGE_LAST_NAMES: readonly string[];
/**
 * Pool of 100 Gilded Age establishments
 */
export declare const VINTAGE_ESTABLISHMENTS: readonly string[];
/**
 * Pool of 50 Victorian-era domains
 */
export declare const VINTAGE_DOMAINS: readonly string[];
/**
 * Type definitions
 */
export type VintageFirstName = typeof VINTAGE_FIRST_NAMES[number];
export type VintageLastName = typeof VINTAGE_LAST_NAMES[number];
export type VintageEstablishment = typeof VINTAGE_ESTABLISHMENTS[number];
export type VintageDomain = typeof VINTAGE_DOMAINS[number];
/**
 * Pool stats
 */
export declare const VINTAGE_POOL_STATS: {
    readonly firstNames: number;
    readonly lastNames: number;
    readonly establishments: number;
    readonly domains: number;
};
//# sourceMappingURL=vintageNames.d.ts.map