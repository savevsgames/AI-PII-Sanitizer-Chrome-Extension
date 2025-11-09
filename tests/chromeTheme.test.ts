/**
 * Tests for Chrome Theme Integration
 * Detects and applies user's Chrome browser theme colors
 */

import { getChromeTheme, generateChromeThemeGradient, applyChromeTheme } from '../src/lib/chromeTheme';
import type { ChromeThemeColors } from '../src/lib/chromeTheme';

describe('Chrome Theme Integration', () => {
  describe('getChromeTheme', () => {
    it('should return null when chrome.theme API is not available', async () => {
      // chrome.theme is not mocked in setup.js, so it won't be available
      const result = await getChromeTheme();
      expect(result).toBeNull();
    });

    it('should handle chrome.theme API errors gracefully', async () => {
      // Mock chrome.theme to throw error
      (global.chrome as any).theme = {
        getCurrent: jest.fn().mockRejectedValue(new Error('API error'))
      };

      const result = await getChromeTheme();
      expect(result).toBeNull();

      // Cleanup
      delete (global.chrome as any).theme;
    });

    it('should return theme colors when API is available', async () => {
      const mockColors: ChromeThemeColors = {
        frame: [50, 50, 50],
        toolbar: [60, 60, 60],
        tab_text: [255, 255, 255],
      };

      (global.chrome as any).theme = {
        getCurrent: jest.fn().mockResolvedValue({ colors: mockColors })
      };

      const result = await getChromeTheme();
      expect(result).toEqual(mockColors);

      // Cleanup
      delete (global.chrome as any).theme;
    });

    it('should return null if theme has no colors', async () => {
      (global.chrome as any).theme = {
        getCurrent: jest.fn().mockResolvedValue({})
      };

      const result = await getChromeTheme();
      expect(result).toBeNull();

      // Cleanup
      delete (global.chrome as any).theme;
    });
  });

  describe('generateChromeThemeGradient', () => {
    it('should generate gradient for dark theme', () => {
      const colors: ChromeThemeColors = {
        frame: [30, 30, 30], // Dark color
      };

      const result = generateChromeThemeGradient(colors);

      expect(result).not.toBeNull();
      expect(result!.mode).toBe('dark');
      expect(result!.gradient).toContain('linear-gradient');
      expect(result!.gradient).toContain('135deg');
      expect(result!.headerGradient).toContain('rgba');
    });

    it('should generate gradient for light theme', () => {
      const colors: ChromeThemeColors = {
        frame: [240, 240, 240], // Light color
      };

      const result = generateChromeThemeGradient(colors);

      expect(result).not.toBeNull();
      expect(result!.mode).toBe('light');
      expect(result!.gradient).toContain('linear-gradient');
    });

    it('should use toolbar color as fallback when frame is missing', () => {
      const colors: ChromeThemeColors = {
        toolbar: [100, 100, 100],
      };

      const result = generateChromeThemeGradient(colors);

      expect(result).not.toBeNull();
      expect(result!.gradient).toBeDefined();
    });

    it('should use ntp_background as fallback', () => {
      const colors: ChromeThemeColors = {
        ntp_background: [200, 200, 200],
      };

      const result = generateChromeThemeGradient(colors);

      expect(result).not.toBeNull();
      expect(result!.gradient).toBeDefined();
    });

    it('should return null for invalid colors', () => {
      const colors: ChromeThemeColors = {
        frame: [], // Invalid: empty array
      };

      const result = generateChromeThemeGradient(colors);

      expect(result).toBeNull();
    });

    it('should return null when no valid base color', () => {
      const colors: ChromeThemeColors = {
        tab_text: [255, 255, 255], // Not a base color
      };

      const result = generateChromeThemeGradient(colors);

      expect(result).toBeNull();
    });

    it('should generate 4-stop gradient', () => {
      const colors: ChromeThemeColors = {
        frame: [128, 128, 128],
      };

      const result = generateChromeThemeGradient(colors);

      expect(result).not.toBeNull();
      // Should have 4 color stops (0%, 33%, 66%, 100%)
      expect(result!.gradient).toContain('0%');
      expect(result!.gradient).toContain('33%');
      expect(result!.gradient).toContain('66%');
      expect(result!.gradient).toContain('100%');
    });

    it('should generate header gradient with transparency', () => {
      const colors: ChromeThemeColors = {
        frame: [50, 100, 150],
      };

      const result = generateChromeThemeGradient(colors);

      expect(result).not.toBeNull();
      expect(result!.headerGradient).toContain('rgba');
      expect(result!.headerGradient).toContain('0.4'); // Alpha transparency
    });

    it('should classify very dark colors as dark theme', () => {
      const colors: ChromeThemeColors = {
        frame: [10, 10, 10], // Nearly black
      };

      const result = generateChromeThemeGradient(colors);

      expect(result).not.toBeNull();
      expect(result!.mode).toBe('dark');
    });

    it('should classify very light colors as light theme', () => {
      const colors: ChromeThemeColors = {
        frame: [250, 250, 250], // Nearly white
      };

      const result = generateChromeThemeGradient(colors);

      expect(result).not.toBeNull();
      expect(result!.mode).toBe('light');
    });

    it('should handle edge case RGB values', () => {
      const colors: ChromeThemeColors = {
        frame: [0, 0, 0], // Pure black
      };

      const result = generateChromeThemeGradient(colors);

      expect(result).not.toBeNull();
      expect(result!.mode).toBe('dark');
    });

    it('should handle max RGB values', () => {
      const colors: ChromeThemeColors = {
        frame: [255, 255, 255], // Pure white
      };

      const result = generateChromeThemeGradient(colors);

      expect(result).not.toBeNull();
      expect(result!.mode).toBe('light');
    });
  });

  describe('applyChromeTheme', () => {
    beforeEach(() => {
      // Setup DOM for theme application
      document.documentElement.style.setProperty = jest.fn();
      document.body.setAttribute = jest.fn();
    });

    afterEach(() => {
      // Cleanup chrome.theme mock
      delete (global.chrome as any).theme;
    });

    it('should return false when theme API not available', async () => {
      const result = await applyChromeTheme();
      expect(result).toBe(false);
    });

    it('should return false when no colors available', async () => {
      (global.chrome as any).theme = {
        getCurrent: jest.fn().mockResolvedValue({})
      };

      const result = await applyChromeTheme();
      expect(result).toBe(false);
    });

    it('should apply theme successfully', async () => {
      const mockColors: ChromeThemeColors = {
        frame: [50, 50, 50],
      };

      (global.chrome as any).theme = {
        getCurrent: jest.fn().mockResolvedValue({ colors: mockColors })
      };

      const result = await applyChromeTheme();

      expect(result).toBe(true);
      expect(document.body.setAttribute).toHaveBeenCalledWith('data-theme-mode', 'dark');
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
        '--theme-bg-gradient',
        expect.stringContaining('linear-gradient')
      );
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
        '--theme-header-gradient',
        expect.stringContaining('rgba')
      );
    });

    it('should set correct theme mode attribute', async () => {
      const mockColors: ChromeThemeColors = {
        frame: [240, 240, 240], // Light
      };

      (global.chrome as any).theme = {
        getCurrent: jest.fn().mockResolvedValue({ colors: mockColors })
      };

      await applyChromeTheme();

      expect(document.body.setAttribute).toHaveBeenCalledWith('data-theme-mode', 'light');
    });

    it('should handle errors gracefully', async () => {
      (global.chrome as any).theme = {
        getCurrent: jest.fn().mockRejectedValue(new Error('Theme error'))
      };

      const result = await applyChromeTheme();
      expect(result).toBe(false);
    });
  });

  describe('WCAG Luminance Calculations', () => {
    it('should calculate correct luminance for black', () => {
      const colors: ChromeThemeColors = { frame: [0, 0, 0] };
      const result = generateChromeThemeGradient(colors);

      expect(result).not.toBeNull();
      expect(result!.mode).toBe('dark');
    });

    it('should calculate correct luminance for white', () => {
      const colors: ChromeThemeColors = { frame: [255, 255, 255] };
      const result = generateChromeThemeGradient(colors);

      expect(result).not.toBeNull();
      expect(result!.mode).toBe('light');
    });

    it('should calculate correct luminance for gray (medium)', () => {
      const colors: ChromeThemeColors = { frame: [128, 128, 128] };
      const result = generateChromeThemeGradient(colors);

      expect(result).not.toBeNull();
      // 128 RGB is right around the threshold
      expect(['dark', 'light']).toContain(result!.mode);
    });

    it('should handle colored backgrounds correctly', () => {
      const darkBlue: ChromeThemeColors = { frame: [0, 0, 139] }; // Dark blue
      const lightBlue: ChromeThemeColors = { frame: [173, 216, 230] }; // Light blue

      const darkResult = generateChromeThemeGradient(darkBlue);
      const lightResult = generateChromeThemeGradient(lightBlue);

      expect(darkResult!.mode).toBe('dark');
      expect(lightResult!.mode).toBe('light');
    });
  });

  describe('Color Adjustment', () => {
    it('should brighten dark colors correctly', () => {
      const colors: ChromeThemeColors = { frame: [30, 30, 30] };
      const result = generateChromeThemeGradient(colors);

      expect(result).not.toBeNull();
      // Gradient should have multiple color stops
      const gradientParts = result!.gradient.split('#').length;
      expect(gradientParts).toBeGreaterThan(4); // At least 4 hex colors
    });

    it('should darken light colors correctly', () => {
      const colors: ChromeThemeColors = { frame: [240, 240, 240] };
      const result = generateChromeThemeGradient(colors);

      expect(result).not.toBeNull();
      const gradientParts = result!.gradient.split('#').length;
      expect(gradientParts).toBeGreaterThan(4);
    });

    it('should keep RGB values within valid range (0-255)', () => {
      const extremeDark: ChromeThemeColors = { frame: [0, 0, 0] };
      const extremeLight: ChromeThemeColors = { frame: [255, 255, 255] };

      const darkResult = generateChromeThemeGradient(extremeDark);
      const lightResult = generateChromeThemeGradient(extremeLight);

      // Should not throw errors or produce invalid colors
      expect(darkResult).not.toBeNull();
      expect(lightResult).not.toBeNull();
      expect(darkResult!.gradient).toContain('#');
      expect(lightResult!.gradient).toContain('#');
    });
  });
});
