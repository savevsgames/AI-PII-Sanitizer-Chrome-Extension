/**
 * API Key Handlers
 * Handles API Key Vault-related messages from popup
 */

import { StorageManager } from '../../lib/storage';
import type { APIKeyFormat, APIKey, APIKeyVaultConfig } from '../../lib/types';

export class APIKeyHandlers {
  constructor(private storage: StorageManager) {}

  /**
   * Handle ADD_API_KEY message from popup
   */
  async handleAddAPIKey(payload: {
    name?: string;
    keyValue: string;
    format?: APIKeyFormat
  }): Promise<{ success: boolean; data?: any; error?: string; message?: string }> {
    try {
      const newKey = await this.storage.addAPIKey(payload);
      return { success: true, data: newKey };
    } catch (error: any) {
      console.error('[APIKeyHandlers] Failed to add API key:', error);

      // Check for FREE tier limits
      if (error.message.startsWith('FREE_TIER_LIMIT')) {
        return {
          success: false,
          error: 'FREE_TIER_LIMIT',
          message: 'You have reached the FREE tier limit of 10 API keys. Upgrade to PRO for unlimited keys.',
        };
      }

      if (error.message.startsWith('FREE_TIER_PATTERN')) {
        return {
          success: false,
          error: 'FREE_TIER_PATTERN',
          message: 'FREE tier only supports OpenAI key detection. Upgrade to PRO for GitHub, AWS, Stripe, and other patterns.',
        };
      }

      return { success: false, error: error.message };
    }
  }

  /**
   * Handle REMOVE_API_KEY message from popup
   */
  async handleRemoveAPIKey(payload: { id: string }): Promise<{ success: boolean; error?: string }> {
    try {
      await this.storage.removeAPIKey(payload.id);
      return { success: true };
    } catch (error: any) {
      console.error('[APIKeyHandlers] Failed to remove API key:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle UPDATE_API_KEY message from popup
   */
  async handleUpdateAPIKey(payload: {
    id: string;
    updates: Partial<APIKey>
  }): Promise<{ success: boolean; error?: string }> {
    try {
      await this.storage.updateAPIKey(payload.id, payload.updates);
      return { success: true };
    } catch (error: any) {
      console.error('[APIKeyHandlers] Failed to update API key:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle GET_API_KEYS message from popup
   */
  async handleGetAPIKeys(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const keys = await this.storage.getAllAPIKeys();
      return { success: true, data: keys };
    } catch (error: any) {
      console.error('[APIKeyHandlers] Failed to get API keys:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle UPDATE_API_KEY_VAULT_SETTINGS message from popup
   */
  async handleUpdateAPIKeyVaultSettings(
    payload: Partial<APIKeyVaultConfig>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.storage.updateAPIKeyVaultSettings(payload);
      return { success: true };
    } catch (error: any) {
      console.error('[APIKeyHandlers] Failed to update API Key Vault settings:', error);
      return { success: false, error: error.message };
    }
  }
}
