/**
 * Background Manager Component
 * Handles background selection, customization, and application
 */
/**
 * Initialize background manager in Settings tab
 */
export declare function initializeBackgroundManager(): Promise<void>;
/**
 * Export for use in Settings tab
 */
export declare function initializeBackgroundSettings(): void;
/**
 * Initialize background on popup load
 * Applies saved background configuration or theme-based default
 */
export declare function initializeBackgroundOnLoad(): Promise<void>;
/**
 * Handle classic theme selection
 * Bidirectional sync: Selecting classic theme sets matching background + 100% opacity
 */
export declare function onClassicThemeSelected(themeName: 'classic-dark' | 'classic-light'): Promise<void>;
/**
 * Handle theme changes
 * Updates background to match new theme if no explicit user selection
 */
export declare function onThemeChange(isDarkTheme: boolean): Promise<void>;
//# sourceMappingURL=backgroundManager.d.ts.map