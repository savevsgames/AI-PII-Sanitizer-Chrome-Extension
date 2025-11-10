/**
 * Storage API Key Vault Manager
 * Handles all API key vault operations
 *
 * Features:
 * - API key CRUD operations
 * - Automatic key format detection
 * - FREE tier enforcement (10 keys max, OpenAI only)
 * - Protection count tracking
 * - Encrypted storage via ConfigManager
 */

import { APIKey, APIKeyFormat, APIKeyVaultConfig } from '../types';
import { StorageConfigManager } from './StorageConfigManager';

export class StorageAPIKeyVaultManager {
  private configManager: StorageConfigManager;

  constructor(configManager: StorageConfigManager) {
    this.configManager = configManager;
  }

  /**
   * Initialize API Key Vault in config if not present
   */
  private async ensureAPIKeyVaultConfig(config: any): Promise<void> {
    if (!config.apiKeyVault) {
      config.apiKeyVault = {
        enabled: true,
        mode: 'warn-first',
        autoDetectPatterns: true,
        keys: [],
        customPatterns: [],
      };
    }
  }

  /**
   * Add API key to vault
   * FREE tier: 10 keys max, OpenAI detection only
   * PRO tier: Unlimited keys, all patterns
   */
  async addAPIKey(keyData: {
    name?: string;
    keyValue: string;
    format?: APIKeyFormat;
  }): Promise<APIKey> {
    const config = await this.configManager.loadConfig();
    if (!config) {
      throw new Error('Config not initialized');
    }

    await this.ensureAPIKeyVaultConfig(config);

    // FREE tier enforcement
    const isFree = config.account?.tier === 'free';
    if (isFree) {
      const currentKeyCount = config.apiKeyVault!.keys.length;
      if (currentKeyCount >= 10) {
        throw new Error('FREE_TIER_LIMIT: Upgrade to PRO for unlimited keys');
      }

      // Only OpenAI keys allowed in FREE tier
      const format = keyData.format || this.detectKeyFormat(keyData.keyValue);
      if (format !== 'openai') {
        throw new Error('FREE_TIER_PATTERN: Upgrade to PRO for non-OpenAI key detection');
      }
    }

    const newKey: APIKey = {
      id: this.generateId(),
      name: keyData.name,
      keyValue: keyData.keyValue, // Will be encrypted in config
      format: keyData.format || this.detectKeyFormat(keyData.keyValue),
      createdAt: Date.now(),
      lastUsed: 0,
      protectionCount: 0,
      enabled: true,
    };

    config.apiKeyVault!.keys.push(newKey);
    await this.configManager.saveConfig(config);

    console.log('[StorageAPIKeyVaultManager] Added API key:', newKey.format, newKey.name);
    return newKey;
  }

  /**
   * Remove API key from vault
   */
  async removeAPIKey(keyId: string): Promise<void> {
    const config = await this.configManager.loadConfig();
    if (!config || !config.apiKeyVault) {
      return;
    }

    config.apiKeyVault.keys = config.apiKeyVault.keys.filter(k => k.id !== keyId);
    await this.configManager.saveConfig(config);
    console.log('[StorageAPIKeyVaultManager] Removed API key:', keyId);
  }

  /**
   * Update API key
   */
  async updateAPIKey(keyId: string, updates: Partial<APIKey>): Promise<void> {
    const config = await this.configManager.loadConfig();
    if (!config || !config.apiKeyVault) {
      return;
    }

    const index = config.apiKeyVault.keys.findIndex(k => k.id === keyId);
    if (index !== -1) {
      config.apiKeyVault.keys[index] = {
        ...config.apiKeyVault.keys[index],
        ...updates,
      };
      await this.configManager.saveConfig(config);
      console.log('[StorageAPIKeyVaultManager] Updated API key:', keyId);
    }
  }

  /**
   * Get API key by ID
   */
  async getAPIKey(keyId: string): Promise<APIKey | null> {
    const config = await this.configManager.loadConfig();
    if (!config || !config.apiKeyVault) {
      return null;
    }

    return config.apiKeyVault.keys.find(k => k.id === keyId) || null;
  }

  /**
   * Get all API keys (encrypted values preserved)
   */
  async getAllAPIKeys(): Promise<APIKey[]> {
    const config = await this.configManager.loadConfig();
    if (!config || !config.apiKeyVault) {
      return [];
    }

    return config.apiKeyVault.keys;
  }

  /**
   * Increment protection count for API key
   */
  async incrementAPIKeyProtection(keyId: string): Promise<void> {
    const config = await this.configManager.loadConfig();
    if (!config || !config.apiKeyVault) {
      return;
    }

    const key = config.apiKeyVault.keys.find(k => k.id === keyId);
    if (key) {
      key.protectionCount++;
      key.lastUsed = Date.now();
      await this.configManager.saveConfig(config);
    }
  }

  /**
   * Update API Key Vault settings
   */
  async updateAPIKeyVaultSettings(settings: Partial<APIKeyVaultConfig>): Promise<void> {
    const config = await this.configManager.loadConfig();
    if (!config) {
      return;
    }

    await this.ensureAPIKeyVaultConfig(config);
    config.apiKeyVault = {
      ...config.apiKeyVault!,
      ...settings,
    };

    await this.configManager.saveConfig(config);
    console.log('[StorageAPIKeyVaultManager] Updated API Key Vault settings');
  }

  /**
   * Detect API key format using simple pattern matching
   */
  private detectKeyFormat(key: string): APIKeyFormat {
    if (/^sk-(proj-)?[A-Za-z0-9]{48,}/.test(key)) return 'openai';
    if (/^sk-ant-[A-Za-z0-9-]{95}/.test(key)) return 'anthropic';
    if (/^AIza[A-Za-z0-9_-]{35}/.test(key)) return 'google';
    if (/^(AKIA|ASIA)[A-Z0-9]{16}/.test(key)) return 'aws';
    if (/^gh[ps]_[A-Za-z0-9]{36}/.test(key)) return 'github';
    if (/^(sk|pk)_(live|test)_[A-Za-z0-9]{24,}/.test(key)) return 'stripe';
    return 'generic';
  }

  /**
   * Generate unique ID for API keys
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
