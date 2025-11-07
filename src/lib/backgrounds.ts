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
 * FREE tier: First 2-4 backgrounds
 * PRO tier: All backgrounds + custom uploads
 */
export const BACKGROUNDS: Background[] = [
  // ==========================================
  // FREE TIER BACKGROUNDS (Preview feature)
  // ==========================================
  {
    id: 'default',
    name: 'Default',
    description: 'Clean solid color background',
    url: '', // No background image
    thumbnail: 'gradient:#1a1a2e',
    tier: 'free',
    category: 'minimal'
  },
  {
    id: 'gradient-purple',
    name: 'Purple Dreams',
    description: 'Smooth purple gradient',
    url: 'gradient:radial-gradient(circle at 50% 50%, #667eea 0%, #764ba2 100%)',
    thumbnail: 'gradient:radial-gradient(circle at 50% 50%, #667eea 0%, #764ba2 100%)',
    tier: 'free',
    category: 'gradient'
  },
  {
    id: 'gradient-blue',
    name: 'Ocean Blue',
    description: 'Calming blue gradient',
    url: 'gradient:linear-gradient(180deg, #4facfe 0%, #00f2fe 100%)',
    thumbnail: 'gradient:linear-gradient(180deg, #4facfe 0%, #00f2fe 100%)',
    tier: 'free',
    category: 'gradient'
  },
  {
    id: 'space-stars',
    name: 'Starry Night',
    description: 'Trees under starfield sky',
    url: '/assets/backgrounds/space-stars.jpg',
    thumbnail: '/assets/backgrounds/thumbs/space-stars.jpg',
    tier: 'free',
    category: 'space'
  },

  // ==========================================
  // PRO TIER BACKGROUNDS (Exclusive collection)
  // ==========================================
  {
    id: 'gradient-sunset',
    name: 'Sunset Glow',
    description: 'Warm sunset colors',
    url: 'gradient:linear-gradient(180deg, #f093fb 0%, #f5576c 100%)',
    thumbnail: 'gradient:linear-gradient(180deg, #f093fb 0%, #f5576c 100%)',
    tier: 'pro',
    category: 'gradient'
  },
  {
    id: 'gradient-ocean',
    name: 'Deep Ocean',
    description: 'Deep blue ocean gradient',
    url: 'gradient:linear-gradient(180deg, #2e3192 0%, #1bffff 100%)',
    thumbnail: 'gradient:linear-gradient(180deg, #2e3192 0%, #1bffff 100%)',
    tier: 'pro',
    category: 'gradient'
  },
  {
    id: 'gradient-fire',
    name: 'Fire Glow',
    description: 'Warm fire gradient',
    url: 'gradient:linear-gradient(180deg, #ff6a00 0%, #ee0979 100%)',
    thumbnail: 'gradient:linear-gradient(180deg, #ff6a00 0%, #ee0979 100%)',
    tier: 'pro',
    category: 'gradient'
  },
  {
    id: 'gradient-forest',
    name: 'Forest Mist',
    description: 'Green forest gradient',
    url: 'gradient:linear-gradient(180deg, #134e5e 0%, #71b280 100%)',
    thumbnail: 'gradient:linear-gradient(180deg, #134e5e 0%, #71b280 100%)',
    tier: 'pro',
    category: 'nature'
  },
  {
    id: 'minimal-dark',
    name: 'Midnight',
    description: 'Deep dark minimal',
    url: 'gradient:#0a0a0a',
    thumbnail: 'gradient:#0a0a0a',
    tier: 'pro',
    category: 'minimal'
  },
  {
    id: 'minimal-light',
    name: 'Cloud',
    description: 'Light minimal background',
    url: 'gradient:#f5f7fa',
    thumbnail: 'gradient:#f5f7fa',
    tier: 'pro',
    category: 'minimal'
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
 * Default background configuration
 */
export const DEFAULT_BACKGROUND_CONFIG: BackgroundConfig = {
  enabled: false,
  source: 'library',
  backgroundId: 'default',
  opacity: 80,
  blur: false,
};
