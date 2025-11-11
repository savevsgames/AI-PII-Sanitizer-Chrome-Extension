/**
 * Background Images System
 * Manages curated backgrounds and custom uploads
 */
export type TierLevel = 'free' | 'pro';
export type BackgroundCategory = 'space' | 'gradient' | 'nature' | 'abstract' | 'minimal';
export interface Background {
    id: string;
    name: string;
    description?: string;
    url: string;
    thumbnail: string;
    tier: TierLevel;
    category: BackgroundCategory;
}
export interface BackgroundConfig {
    enabled: boolean;
    source: 'library' | 'custom';
    backgroundId?: string;
    customBanner?: string;
    customBackground?: string;
    opacity: number;
    blur: boolean;
}
/**
 * Curated background library
 * FREE tier: All 7 preview backgrounds (rotated seasonally)
 * PRO tier: All backgrounds + custom uploads
 *
 * Note: default_dark and default_light auto-load based on theme if no selection
 */
export declare const BACKGROUNDS: Background[];
/**
 * Get backgrounds available for a specific tier
 */
export declare function getAvailableBackgrounds(userTier: TierLevel): Background[];
/**
 * Get background by ID
 */
export declare function getBackgroundById(id: string): Background | undefined;
/**
 * Check if user can use a specific background
 */
export declare function canUseBackground(backgroundId: string, userTier: TierLevel): boolean;
/**
 * Get theme-appropriate default background
 * @param isDarkTheme - Current theme mode
 * @returns Background ID for theme-based default
 */
export declare function getThemeDefaultBackground(isDarkTheme: boolean): string;
/**
 * Default background configuration
 */
export declare const DEFAULT_BACKGROUND_CONFIG: BackgroundConfig;
//# sourceMappingURL=backgrounds.d.ts.map