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
export declare function getChromeTheme(): Promise<ChromeThemeColors | null>;
/**
 * Generate a gradient from Chrome theme colors
 */
export declare function generateChromeThemeGradient(colors: ChromeThemeColors): {
    gradient: string;
    headerGradient: string;
    mode: 'dark' | 'light';
} | null;
/**
 * Apply Chrome theme to CSS variables
 */
export declare function applyChromeTheme(): Promise<boolean>;
//# sourceMappingURL=chromeTheme.d.ts.map