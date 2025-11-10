/**
 * Config Handlers
 * Handles configuration-related messages from popup/content scripts
 */

import { StorageManager } from '../../lib/storage';

export class ConfigHandlers {
  constructor(private storage: StorageManager) {}

  /**
   * Update configuration
   */
  async handleUpdateConfig(payload: any): Promise<{ success: boolean; error?: string }> {
    try {
      await this.storage.saveConfig(payload);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get configuration
   */
  async handleGetConfig(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const config = await this.storage.loadConfig();
      return { success: true, data: config };
    } catch (error) {
      // If config loading fails due to auth, return a default disabled config
      if (error instanceof Error && error.message.includes('ENCRYPTION_KEY_UNAVAILABLE')) {
        console.log('[ConfigHandlers] Config requested but user not authenticated - returning default config');
        // Return a safe default config
        return {
          success: true,
          data: {
            settings: { enabled: false },
            features: {},
            stats: { totalSubstitutions: 0, totalInterceptions: 0, byService: {} },
            account: { tier: 'free' }
          }
        };
      }
      console.error('[ConfigHandlers] Error loading config:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
