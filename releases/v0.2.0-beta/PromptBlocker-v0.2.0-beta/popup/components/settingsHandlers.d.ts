/**
 * Settings Handlers Component
 * Handles settings tab interactions
 */
import { UserConfig } from '../../lib/types';
type ThemeName = 'chrome-theme' | 'classic-light' | 'lavender' | 'sky' | 'fire' | 'leaf' | 'sunlight' | 'classic-dark' | 'midnight-purple' | 'deep-ocean' | 'embers' | 'forest' | 'sundown';
/**
 * Initialize settings handlers
 */
export declare function initSettingsHandlers(): void;
/**
 * Update settings UI from config
 */
export declare function updateSettingsUI(config: UserConfig | null): Promise<void>;
/**
 * Apply theme to CSS variables and set theme mode
 */
export declare function applyTheme(themeInput: ThemeName | string): Promise<void>;
/**
 * Update theme UI from config
 */
export declare function updateThemeUI(config: UserConfig | null): void;
export {};
//# sourceMappingURL=settingsHandlers.d.ts.map