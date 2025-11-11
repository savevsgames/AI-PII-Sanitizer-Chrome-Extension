/**
 * Storage Config Manager
 * Handles all UserConfig storage operations with selective field encryption
 *
 * Features:
 * - 5-second config cache to prevent excessive decryption
 * - Selective encryption: API keys, custom rules, activity logs, account data
 * - Cross-context cache invalidation
 * - Automatic migration of plaintext to encrypted storage
 * - Starter templates initialization
 */
import { UserConfig, PromptTemplate } from '../types';
import { StorageEncryptionManager } from './StorageEncryptionManager';
export declare class StorageConfigManager {
    private encryptionManager;
    private configCache;
    private configCacheTimestamp;
    private readonly CACHE_TTL_MS;
    private static readonly CONFIG_KEY;
    constructor(encryptionManager: StorageEncryptionManager);
    /**
     * Save configuration
     * Encrypts ALL sensitive data before saving:
     * - API key vault
     * - Custom rules
     * - Activity logs
     * - Account data (email, displayName, photoURL)
     */
    saveConfig(config: UserConfig): Promise<void>;
    /**
     * Load configuration
     * Decrypts all sensitive data: API keys, custom rules, activity logs, and account data
     * Uses 5-second cache to prevent excessive decryption calls
     */
    loadConfig(): Promise<UserConfig | null>;
    /**
     * Get default configuration (v2)
     */
    getDefaultConfig(): UserConfig;
    /**
     * Get starter templates to help users understand the feature
     */
    getStarterTemplates(): PromptTemplate[];
    /**
     * Clear internal cache (for testing purposes)
     * @internal
     */
    clearCache(): void;
}
//# sourceMappingURL=StorageConfigManager.d.ts.map