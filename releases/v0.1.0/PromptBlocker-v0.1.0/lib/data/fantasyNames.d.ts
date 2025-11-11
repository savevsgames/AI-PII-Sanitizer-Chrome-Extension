/**
 * Fantasy Name Pools for Alias Generation (PRO Feature)
 *
 * Fantasy-themed data pools for generating medieval/dragon/fantasy aliases.
 * Perfect for RPG players, writers, and fantasy enthusiasts.
 *
 * Pools:
 * - 500 fantasy first names (200 male, 200 female, 100 neutral)
 * - 500 fantasy surnames (nature, combat, noble, mythical themes)
 * - 100 fantasy guilds/taverns/organizations
 * - 50 fantasy realm domains
 *
 * @module fantasyNames
 * @tier PRO
 */
/**
 * Pool of 500 fantasy first names
 * Distribution: 200 male, 200 female, 100 gender-neutral
 * Inspired by medieval, Celtic, Norse, and fantasy literature
 */
export declare const FANTASY_FIRST_NAMES: readonly string[];
/**
 * Pool of 500 fantasy surnames
 * Themes: Nature, elemental, combat, noble, mythical creatures
 */
export declare const FANTASY_LAST_NAMES: readonly string[];
/**
 * Pool of 100 fantasy organizations
 * Guilds, taverns, shops, and establishments
 */
export declare const FANTASY_ORGANIZATIONS: readonly string[];
/**
 * Pool of 50 fantasy realm domains
 */
export declare const FANTASY_DOMAINS: readonly string[];
/**
 * Type definitions
 */
export type FantasyFirstName = typeof FANTASY_FIRST_NAMES[number];
export type FantasyLastName = typeof FANTASY_LAST_NAMES[number];
export type FantasyOrganization = typeof FANTASY_ORGANIZATIONS[number];
export type FantasyDomain = typeof FANTASY_DOMAINS[number];
/**
 * Pool stats
 */
export declare const FANTASY_POOL_STATS: {
    readonly firstNames: number;
    readonly lastNames: number;
    readonly organizations: number;
    readonly domains: number;
};
//# sourceMappingURL=fantasyNames.d.ts.map