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
  backgroundId?: string; // For library backgrounds
  customBanner?: string; // Base64 for custom banner
  customBackground?: string; // Base64 for custom full background
  opacity: number; // 0-100
  blur: boolean;
}

/**
 * Curated background library
 * FREE tier: All 7 preview backgrounds (rotated seasonally)
 * PRO tier: All backgrounds + custom uploads
 *
 * Note: default_dark and default_light auto-load based on theme if no selection
 */
export const BACKGROUNDS: Background[] = [
  // ==========================================
  // THEME-BASED DEFAULTS (Auto-selected)
  // ==========================================
  {
    id: 'default_dark',
    name: 'Default Dark',
    description: 'Automatic dark theme background',
    url: '/assets/backgrounds/default_dark.jpg',
    thumbnail: '/assets/backgrounds/thumbs/default_dark.jpg',
    tier: 'free',
    category: 'minimal'
  },
  {
    id: 'default_light',
    name: 'Default Light',
    description: 'Automatic light theme background',
    url: '/assets/backgrounds/default_light.jpg',
    thumbnail: '/assets/backgrounds/thumbs/default_light.jpg',
    tier: 'free',
    category: 'minimal'
  },

  // ==========================================
  // FREE TIER BACKGROUNDS (Preview collection)
  // Rotated seasonally to keep fresh
  // ==========================================
  {
    id: 'aurora_borealis',
    name: 'Aurora Dreams',
    description: 'Northern lights over snowy landscape',
    url: '/assets/backgrounds/aurora_borealis_01.jpg',
    thumbnail: '/assets/backgrounds/thumbs/aurora_borealis_01.jpg',
    tier: 'free',
    category: 'nature'
  },
  {
    id: 'jungle_waterfall',
    name: 'Jungle Falls',
    description: 'Tropical waterfall paradise',
    url: '/assets/backgrounds/jungle_waterfall_01.jpg',
    thumbnail: '/assets/backgrounds/thumbs/jungle_waterfall_01.jpg',
    tier: 'free',
    category: 'nature'
  },
  {
    id: 'mountains_snow',
    name: 'Mountain Peak',
    description: 'Snow-covered mountain vista',
    url: '/assets/backgrounds/mountains_snow_01.jpg',
    thumbnail: '/assets/backgrounds/thumbs/mountains_snow_01.jpg',
    tier: 'free',
    category: 'nature'
  },
  {
    id: 'sky_clouds',
    name: 'Blue Skies',
    description: 'Peaceful cloud formations',
    url: '/assets/backgrounds/sky_clouds.jpg',
    thumbnail: '/assets/backgrounds/thumbs/sky_clouds.jpg',
    tier: 'free',
    category: 'nature'
  },
  {
    id: 'trees_and_stars',
    name: 'Starry Forest',
    description: 'Trees under starlit night sky',
    url: '/assets/backgrounds/trees_and_stars.jpg',
    thumbnail: '/assets/backgrounds/thumbs/trees_and_stars.jpg',
    tier: 'free',
    category: 'space'
  },
];

/**
 * Get backgrounds available for a specific tier
 */
export function getAvailableBackgrounds(userTier: TierLevel): Background[] {
  if (userTier === 'pro') {
    return BACKGROUNDS; // All backgrounds
  }
  return BACKGROUNDS.filter(bg => bg.tier === 'free'); // FREE tier only
}

/**
 * Get background by ID
 */
export function getBackgroundById(id: string): Background | undefined {
  return BACKGROUNDS.find(bg => bg.id === id);
}

/**
 * Check if user can use a specific background
 */
export function canUseBackground(backgroundId: string, userTier: TierLevel): boolean {
  const background = getBackgroundById(backgroundId);
  if (!background) return false;

  if (background.tier === 'free') return true;
  return userTier === 'pro';
}

/**
 * Get theme-appropriate default background
 * @param isDarkTheme - Current theme mode
 * @returns Background ID for theme-based default
 */
export function getThemeDefaultBackground(isDarkTheme: boolean): string {
  return isDarkTheme ? 'default_dark' : 'default_light';
}

/**
 * Default background configuration
 */
export const DEFAULT_BACKGROUND_CONFIG: BackgroundConfig = {
  enabled: true, // Enabled by default with theme-based background
  source: 'library',
  backgroundId: 'default_dark', // Will be auto-updated based on theme
  opacity: 80,
  blur: false,
};
