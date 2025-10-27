/**
 * Chrome Theme Integration
 * Detects and applies user's Chrome browser theme colors
 */

export interface ChromeThemeColors {
  frame?: number[];
  toolbar?: number[];
  tab_background_text?: number[];
  tab_text?: number[];
  bookmark_text?: number[];
  ntp_background?: number[];
  ntp_text?: number[];
}

/**
 * Get the user's current Chrome theme
 */
export async function getChromeTheme(): Promise<ChromeThemeColors | null> {
  try {
    // Check if chrome.theme API is available (it's not in all browsers)
    const chromeAny = chrome as any;
    if (!chromeAny.theme || !chromeAny.theme.getCurrent) {
      console.warn('[Chrome Theme] chrome.theme API not available');
      return null;
    }

    const theme = await chromeAny.theme.getCurrent();
    return theme.colors || null;
  } catch (error) {
    console.error('[Chrome Theme] Failed to get Chrome theme:', error);
    return null;
  }
}

/**
 * Convert RGB array to hex color
 */
function rgbToHex(rgb: number[]): string {
  if (!rgb || rgb.length < 3) return '#000000';
  const [r, g, b] = rgb;
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Calculate relative luminance (WCAG formula)
 */
function getLuminance(rgb: number[]): number {
  if (!rgb || rgb.length < 3) return 0;
  const [r, g, b] = rgb.map(val => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Determine if a color is dark (luminance < 0.5)
 */
function isDarkColor(rgb: number[]): boolean {
  return getLuminance(rgb) < 0.5;
}

/**
 * Lighten or darken a color by a percentage
 */
function adjustBrightness(rgb: number[], percent: number): number[] {
  return rgb.map(val => {
    const adjusted = val + (255 - val) * (percent / 100);
    return Math.min(255, Math.max(0, Math.round(adjusted)));
  });
}

/**
 * Darken a color by a percentage
 */
function darkenColor(rgb: number[], percent: number): number[] {
  return rgb.map(val => {
    const adjusted = val * (1 - percent / 100);
    return Math.min(255, Math.max(0, Math.round(adjusted)));
  });
}

/**
 * Generate a gradient from Chrome theme colors
 */
export function generateChromeThemeGradient(colors: ChromeThemeColors): {
  gradient: string;
  headerGradient: string;
  mode: 'dark' | 'light';
} | null {
  try {
    // Prefer frame color (main browser chrome color), fallback to toolbar
    const baseColor = colors.frame || colors.toolbar || colors.ntp_background;

    if (!baseColor || baseColor.length < 3) {
      console.warn('[Chrome Theme] No valid base color found');
      return null;
    }

    const mode = isDarkColor(baseColor) ? 'dark' : 'light';

    // Generate 4-stop gradient by adjusting brightness
    const stop1 = baseColor;
    const stop2 = mode === 'dark'
      ? adjustBrightness(baseColor, 5)
      : darkenColor(baseColor, 5);
    const stop3 = mode === 'dark'
      ? adjustBrightness(baseColor, 15)
      : darkenColor(baseColor, 15);
    const stop4 = mode === 'dark'
      ? adjustBrightness(baseColor, 25)
      : darkenColor(baseColor, 25);

    const gradient = `linear-gradient(135deg, ${rgbToHex(stop1)} 0%, ${rgbToHex(stop2)} 33%, ${rgbToHex(stop3)} 66%, ${rgbToHex(stop4)} 100%)`;

    // Header gradient with transparency
    const headerGradient = `linear-gradient(135deg, rgba(${stop1.join(',')}, 0.4) 0%, rgba(${stop4.join(',')}, 0.4) 100%)`;

    console.log('[Chrome Theme] Generated gradient:', { gradient, mode });

    return { gradient, headerGradient, mode };
  } catch (error) {
    console.error('[Chrome Theme] Failed to generate gradient:', error);
    return null;
  }
}

/**
 * Apply Chrome theme to CSS variables
 */
export async function applyChromeTheme(): Promise<boolean> {
  try {
    const colors = await getChromeTheme();
    if (!colors) return false;

    const theme = generateChromeThemeGradient(colors);
    if (!theme) return false;

    const root = document.documentElement;
    const body = document.body;

    // Set theme mode
    body.setAttribute('data-theme-mode', theme.mode);

    // Set CSS variables
    root.style.setProperty('--theme-bg-gradient', theme.gradient);
    root.style.setProperty('--theme-header-gradient', theme.headerGradient);

    console.log('[Chrome Theme] Applied Chrome theme successfully');
    return true;
  } catch (error) {
    console.error('[Chrome Theme] Failed to apply Chrome theme:', error);
    return false;
  }
}
