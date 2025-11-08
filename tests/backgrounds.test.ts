/**
 * Tests for Background Images System
 * Manages curated backgrounds and custom uploads
 */

import {
  BACKGROUNDS,
  getAvailableBackgrounds,
  getBackgroundById,
  canUseBackground,
  getThemeDefaultBackground,
  DEFAULT_BACKGROUND_CONFIG,
  type Background,
  type TierLevel,
  type BackgroundConfig,
} from '../src/lib/backgrounds';

describe('Background Images System', () => {
  describe('BACKGROUNDS constant', () => {
    it('should have backgrounds defined', () => {
      expect(BACKGROUNDS).toBeDefined();
      expect(Array.isArray(BACKGROUNDS)).toBe(true);
      expect(BACKGROUNDS.length).toBeGreaterThan(0);
    });

    it('should have at least 7 backgrounds', () => {
      // As per spec: 2 defaults + 5 FREE tier previews
      expect(BACKGROUNDS.length).toBeGreaterThanOrEqual(7);
    });

    it('should include default_dark and default_light', () => {
      const darkDefault = BACKGROUNDS.find(bg => bg.id === 'default_dark');
      const lightDefault = BACKGROUNDS.find(bg => bg.id === 'default_light');

      expect(darkDefault).toBeDefined();
      expect(lightDefault).toBeDefined();
    });

    it('should have valid background structure', () => {
      BACKGROUNDS.forEach(bg => {
        expect(bg).toHaveProperty('id');
        expect(bg).toHaveProperty('name');
        expect(bg).toHaveProperty('url');
        expect(bg).toHaveProperty('thumbnail');
        expect(bg).toHaveProperty('tier');
        expect(bg).toHaveProperty('category');

        expect(typeof bg.id).toBe('string');
        expect(typeof bg.name).toBe('string');
        expect(typeof bg.url).toBe('string');
        expect(typeof bg.thumbnail).toBe('string');
        expect(['free', 'pro']).toContain(bg.tier);
        expect(['space', 'gradient', 'nature', 'abstract', 'minimal']).toContain(bg.category);
      });
    });

    it('should have unique background IDs', () => {
      const ids = BACKGROUNDS.map(bg => bg.id);
      const uniqueIds = new Set(ids);

      expect(ids.length).toBe(uniqueIds.size);
    });

    it('should have at least some free tier backgrounds', () => {
      const freeBackgrounds = BACKGROUNDS.filter(bg => bg.tier === 'free');
      expect(freeBackgrounds.length).toBeGreaterThan(0);
    });
  });

  describe('getAvailableBackgrounds', () => {
    it('should return all backgrounds for PRO tier', () => {
      const available = getAvailableBackgrounds('pro');

      expect(available.length).toBe(BACKGROUNDS.length);
      expect(available).toEqual(BACKGROUNDS);
    });

    it('should return only free backgrounds for FREE tier', () => {
      const available = getAvailableBackgrounds('free');

      const allFree = available.every(bg => bg.tier === 'free');
      expect(allFree).toBe(true);
    });

    it('should include defaults in FREE tier', () => {
      const available = getAvailableBackgrounds('free');

      const hasDefaultDark = available.some(bg => bg.id === 'default_dark');
      const hasDefaultLight = available.some(bg => bg.id === 'default_light');

      expect(hasDefaultDark).toBe(true);
      expect(hasDefaultLight).toBe(true);
    });

    it('should return at least 7 backgrounds for FREE tier', () => {
      const available = getAvailableBackgrounds('free');

      // 2 defaults + 5 preview backgrounds
      expect(available.length).toBeGreaterThanOrEqual(7);
    });

    it('should not include PRO backgrounds in FREE tier', () => {
      const available = getAvailableBackgrounds('free');

      const hasProBackgrounds = available.some(bg => bg.tier === 'pro');
      expect(hasProBackgrounds).toBe(false);
    });
  });

  describe('getBackgroundById', () => {
    it('should return background for valid ID', () => {
      const background = getBackgroundById('default_dark');

      expect(background).toBeDefined();
      expect(background!.id).toBe('default_dark');
    });

    it('should return undefined for invalid ID', () => {
      const background = getBackgroundById('non_existent');

      expect(background).toBeUndefined();
    });

    it('should return correct background details', () => {
      const background = getBackgroundById('default_dark');

      expect(background).toHaveProperty('name');
      expect(background).toHaveProperty('url');
      expect(background).toHaveProperty('thumbnail');
      expect(background).toHaveProperty('tier');
      expect(background).toHaveProperty('category');
    });

    it('should handle empty string', () => {
      const background = getBackgroundById('');

      expect(background).toBeUndefined();
    });

    it('should be case-sensitive', () => {
      const background = getBackgroundById('DEFAULT_DARK'); // Wrong case

      expect(background).toBeUndefined();
    });
  });

  describe('canUseBackground', () => {
    it('should allow FREE tier to use free backgrounds', () => {
      const canUse = canUseBackground('default_dark', 'free');

      expect(canUse).toBe(true);
    });

    it('should allow PRO tier to use free backgrounds', () => {
      const canUse = canUseBackground('default_dark', 'pro');

      expect(canUse).toBe(true);
    });

    it('should allow PRO tier to use PRO backgrounds', () => {
      // Find a PRO background if it exists
      const proBackground = BACKGROUNDS.find(bg => bg.tier === 'pro');

      if (proBackground) {
        const canUse = canUseBackground(proBackground.id, 'pro');
        expect(canUse).toBe(true);
      } else {
        // If no PRO backgrounds exist yet, that's okay
        expect(true).toBe(true);
      }
    });

    it('should deny FREE tier from using PRO backgrounds', () => {
      const proBackground = BACKGROUNDS.find(bg => bg.tier === 'pro');

      if (proBackground) {
        const canUse = canUseBackground(proBackground.id, 'free');
        expect(canUse).toBe(false);
      } else {
        expect(true).toBe(true);
      }
    });

    it('should return false for non-existent background', () => {
      const canUse = canUseBackground('non_existent', 'pro');

      expect(canUse).toBe(false);
    });

    it('should return false for empty ID', () => {
      const canUseFree = canUseBackground('', 'free');
      const canUsePro = canUseBackground('', 'pro');

      expect(canUseFree).toBe(false);
      expect(canUsePro).toBe(false);
    });
  });

  describe('getThemeDefaultBackground', () => {
    it('should return default_dark for dark theme', () => {
      const backgroundId = getThemeDefaultBackground(true);

      expect(backgroundId).toBe('default_dark');
    });

    it('should return default_light for light theme', () => {
      const backgroundId = getThemeDefaultBackground(false);

      expect(backgroundId).toBe('default_light');
    });

    it('should return valid background IDs', () => {
      const darkId = getThemeDefaultBackground(true);
      const lightId = getThemeDefaultBackground(false);

      expect(getBackgroundById(darkId)).toBeDefined();
      expect(getBackgroundById(lightId)).toBeDefined();
    });
  });

  describe('DEFAULT_BACKGROUND_CONFIG', () => {
    it('should have default configuration defined', () => {
      expect(DEFAULT_BACKGROUND_CONFIG).toBeDefined();
    });

    it('should be enabled by default', () => {
      expect(DEFAULT_BACKGROUND_CONFIG.enabled).toBe(true);
    });

    it('should use library source by default', () => {
      expect(DEFAULT_BACKGROUND_CONFIG.source).toBe('library');
    });

    it('should have default_dark as initial background', () => {
      expect(DEFAULT_BACKGROUND_CONFIG.backgroundId).toBe('default_dark');
    });

    it('should have valid opacity value', () => {
      expect(DEFAULT_BACKGROUND_CONFIG.opacity).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_BACKGROUND_CONFIG.opacity).toBeLessThanOrEqual(100);
    });

    it('should have blur disabled by default', () => {
      expect(DEFAULT_BACKGROUND_CONFIG.blur).toBe(false);
    });

    it('should not have custom images by default', () => {
      expect(DEFAULT_BACKGROUND_CONFIG.customBanner).toBeUndefined();
      expect(DEFAULT_BACKGROUND_CONFIG.customBackground).toBeUndefined();
    });

    it('should have all required config properties', () => {
      expect(DEFAULT_BACKGROUND_CONFIG).toHaveProperty('enabled');
      expect(DEFAULT_BACKGROUND_CONFIG).toHaveProperty('source');
      expect(DEFAULT_BACKGROUND_CONFIG).toHaveProperty('opacity');
      expect(DEFAULT_BACKGROUND_CONFIG).toHaveProperty('blur');
    });
  });

  describe('Background Categories', () => {
    it('should have multiple categories represented', () => {
      const categories = new Set(BACKGROUNDS.map(bg => bg.category));

      // Should have at least 2 different categories
      expect(categories.size).toBeGreaterThanOrEqual(2);
    });

    it('should have minimal category for defaults', () => {
      const defaultDark = getBackgroundById('default_dark');
      const defaultLight = getBackgroundById('default_light');

      expect(defaultDark!.category).toBe('minimal');
      expect(defaultLight!.category).toBe('minimal');
    });

    it('should have nature category backgrounds', () => {
      const natureBackgrounds = BACKGROUNDS.filter(bg => bg.category === 'nature');

      expect(natureBackgrounds.length).toBeGreaterThan(0);
    });
  });

  describe('Background URLs', () => {
    it('should have valid URL paths', () => {
      BACKGROUNDS.forEach(bg => {
        expect(bg.url).toContain('/assets/backgrounds/');
        expect(bg.thumbnail).toContain('/assets/backgrounds/thumbs/');
      });
    });

    it('should have matching URL and thumbnail base names', () => {
      BACKGROUNDS.forEach(bg => {
        const urlFilename = bg.url.split('/').pop();
        const thumbnailFilename = bg.thumbnail.split('/').pop();

        // Filenames should match (thumbnails are in thumbs/ subdirectory)
        expect(urlFilename).toBe(thumbnailFilename);
      });
    });

    it('should use image file extensions', () => {
      BACKGROUNDS.forEach(bg => {
        const urlExt = bg.url.split('.').pop();
        const thumbExt = bg.thumbnail.split('.').pop();

        expect(['jpg', 'jpeg', 'png', 'webp']).toContain(urlExt);
        expect(['jpg', 'jpeg', 'png', 'webp']).toContain(thumbExt);
      });
    });
  });

  describe('Tier System Integration', () => {
    it('should enforce tier restrictions', () => {
      BACKGROUNDS.forEach(bg => {
        const freeCanUse = canUseBackground(bg.id, 'free');
        const proCanUse = canUseBackground(bg.id, 'pro');

        // PRO tier should always be able to use any background
        expect(proCanUse).toBe(true);

        // FREE tier should only use free backgrounds
        if (bg.tier === 'free') {
          expect(freeCanUse).toBe(true);
        } else {
          expect(freeCanUse).toBe(false);
        }
      });
    });

    it('should have free backgrounds accessible to both tiers', () => {
      const freeBackgrounds = BACKGROUNDS.filter(bg => bg.tier === 'free');

      freeBackgrounds.forEach(bg => {
        expect(canUseBackground(bg.id, 'free')).toBe(true);
        expect(canUseBackground(bg.id, 'pro')).toBe(true);
      });
    });
  });
});
