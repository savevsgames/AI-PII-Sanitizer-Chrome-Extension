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
export declare class StorageAPIKeyVaultManager {
    private configManager;
    constructor(configManager: StorageConfigManager);
    /**
     * Initialize API Key Vault in config if not present
     */
    private ensureAPIKeyVaultConfig;
    /**
     * Add API key to vault
     * FREE tier: 10 keys max, OpenAI detection only
     * PRO tier: Unlimited keys, all patterns
     */
    addAPIKey(keyData: {
        name?: string;
        keyValue: string;
        format?: APIKeyFormat;
    }): Promise<APIKey>;
    /**
     * Remove API key from vault
     */
    removeAPIKey(keyId: string): Promise<void>;
    /**
     * Update API key
     */
    updateAPIKey(keyId: string, updates: Partial<APIKey>): Promise<void>;
    /**
     * Get API key by ID
     */
    getAPIKey(keyId: string): Promise<APIKey | null>;
    /**
     * Get all API keys (encrypted values preserved)
     */
    getAllAPIKeys(): Promise<APIKey[]>;
    /**
     * Increment protection count for API key
     */
    incrementAPIKeyProtection(keyId: string): Promise<void>;
    /**
     * Update API Key Vault settings
     */
    updateAPIKeyVaultSettings(settings: Partial<APIKeyVaultConfig>): Promise<void>;
    /**
     * Detect API key format using simple pattern matching
     */
    private detectKeyFormat;
    /**
     * Generate unique ID for API keys
     */
    private generateId;
}
//# sourceMappingURL=StorageAPIKeyVaultManager.d.ts.map