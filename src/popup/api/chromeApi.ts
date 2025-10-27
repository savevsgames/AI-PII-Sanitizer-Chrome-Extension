/**
 * Centralized Chrome API Client
 * Type-safe messaging layer for all Chrome extension APIs
 */

import type { UserConfig, APIKey } from '../../lib/types';

/**
 * Generic message sender with error handling
 */
async function sendMessage<T = any>(
  type: string,
  payload: any = {}
): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type, payload },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (response?.success === false) {
          reject(new Error(response.error || response.message || 'Unknown error'));
          return;
        }

        resolve(response);
      }
    );
  });
}

/**
 * Chrome API client with typed methods
 */
export const chromeApi = {
  // ========== CONFIG ==========

  /**
   * Get user configuration
   */
  async getConfig(): Promise<{ success: boolean; config: UserConfig }> {
    return sendMessage('GET_CONFIG');
  },

  /**
   * Update user configuration
   */
  async updateConfig(config: Partial<UserConfig>): Promise<{ success: boolean }> {
    return sendMessage('UPDATE_CONFIG', config);
  },

  // ========== PROFILES ==========

  /**
   * Reload profiles (triggers background to refresh)
   */
  async reloadProfiles(): Promise<{ success: boolean }> {
    return sendMessage('RELOAD_PROFILES');
  },

  // ========== ALIASES ==========

  /**
   * Get all aliases
   */
  async getAliases(): Promise<{ success: boolean; data: any[] }> {
    return sendMessage('GET_ALIASES');
  },

  /**
   * Add new alias
   */
  async addAlias(alias: any): Promise<{ success: boolean; data: any }> {
    return sendMessage('ADD_ALIAS', alias);
  },

  /**
   * Remove alias
   */
  async removeAlias(aliasId: string): Promise<{ success: boolean }> {
    return sendMessage('REMOVE_ALIAS', { id: aliasId });
  },

  // ========== API KEYS ==========

  /**
   * Get all API keys
   */
  async getAPIKeys(): Promise<{ success: boolean; data: APIKey[] }> {
    return sendMessage('GET_API_KEYS');
  },

  /**
   * Add new API key
   */
  async addAPIKey(keyData: {
    name?: string;
    project?: string;
    keyValue: string;
  }): Promise<{ success: boolean; data: APIKey }> {
    return sendMessage('ADD_API_KEY', keyData);
  },

  /**
   * Remove API key
   */
  async removeAPIKey(keyId: string): Promise<{ success: boolean }> {
    return sendMessage('REMOVE_API_KEY', { id: keyId });
  },

  /**
   * Update API key
   */
  async updateAPIKey(keyId: string, updates: Partial<APIKey>): Promise<{ success: boolean }> {
    return sendMessage('UPDATE_API_KEY', { id: keyId, ...updates });
  },

  /**
   * Update API Key Vault settings
   */
  async updateAPIKeyVaultSettings(settings: any): Promise<{ success: boolean }> {
    return sendMessage('UPDATE_API_KEY_VAULT_SETTINGS', settings);
  },

  // ========== CUSTOM REDACTION RULES ==========

  /**
   * Add a custom redaction rule
   */
  async addCustomRule(ruleData: {
    name: string;
    pattern: string;
    replacement: string;
    category: 'pii' | 'financial' | 'medical' | 'custom';
    description?: string;
    priority?: number;
    testCases?: { input: string; expected: string }[];
  }): Promise<{ success: boolean; data: any }> {
    return sendMessage('ADD_CUSTOM_RULE', ruleData);
  },

  /**
   * Remove a custom rule
   */
  async removeCustomRule(ruleId: string): Promise<{ success: boolean }> {
    return sendMessage('REMOVE_CUSTOM_RULE', { ruleId });
  },

  /**
   * Update a custom rule
   */
  async updateCustomRule(ruleId: string, updates: any): Promise<{ success: boolean }> {
    return sendMessage('UPDATE_CUSTOM_RULE', { ruleId, updates });
  },

  /**
   * Toggle custom rule enabled state
   */
  async toggleCustomRule(ruleId: string): Promise<{ success: boolean }> {
    return sendMessage('TOGGLE_CUSTOM_RULE', { ruleId });
  },

  /**
   * Update custom rules settings
   */
  async updateCustomRulesSettings(settings: any): Promise<{ success: boolean }> {
    return sendMessage('UPDATE_CUSTOM_RULES_SETTINGS', settings);
  },

  // ========== CONTENT SCRIPTS ==========

  /**
   * Reinject content scripts into tabs
   */
  async reinjectContentScripts(): Promise<{ success: boolean }> {
    return sendMessage('REINJECT_CONTENT_SCRIPTS');
  },

  // ========== STORAGE ==========

  /**
   * Listen for storage changes
   */
  onStorageChanged(callback: (changes: any, areaName: string) => void): void {
    chrome.storage.onChanged.addListener(callback);
  },

  /**
   * Remove storage change listener
   */
  removeStorageListener(callback: (changes: any, areaName: string) => void): void {
    chrome.storage.onChanged.removeListener(callback);
  },

  /**
   * Get from local storage
   */
  async getFromStorage<T = any>(key: string): Promise<T | undefined> {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, (result) => {
        resolve(result[key]);
      });
    });
  },

  /**
   * Set to local storage
   */
  async setToStorage(key: string, value: any): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => {
        resolve();
      });
    });
  },

  /**
   * Remove from local storage
   */
  async removeFromStorage(key: string): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.remove(key, () => {
        resolve();
      });
    });
  },

  // ========== UTILITIES ==========

  /**
   * Health check (verify extension is responsive)
   */
  async healthCheck(): Promise<{ success: boolean; status: string }> {
    return sendMessage('HEALTH_CHECK');
  },
};

/**
 * Mock API for testing (optional)
 */
export const mockChromeApi = {
  getConfig: async () => ({ success: true, config: {} as UserConfig }),
  updateConfig: async () => ({ success: true }),
  reloadProfiles: async () => ({ success: true }),
  getAliases: async () => ({ success: true, data: [] }),
  addAlias: async () => ({ success: true, data: {} }),
  removeAlias: async () => ({ success: true }),
  getAPIKeys: async () => ({ success: true, data: [] }),
  addAPIKey: async () => ({ success: true, data: {} as APIKey }),
  removeAPIKey: async () => ({ success: true }),
  updateAPIKey: async () => ({ success: true }),
  updateAPIKeyVaultSettings: async () => ({ success: true }),
  reinjectContentScripts: async () => ({ success: true }),
  healthCheck: async () => ({ success: true, status: 'ok' }),
  onStorageChanged: () => {},
  removeStorageListener: () => {},
  getFromStorage: async () => undefined,
  setToStorage: async () => {},
  removeFromStorage: async () => {},
};
