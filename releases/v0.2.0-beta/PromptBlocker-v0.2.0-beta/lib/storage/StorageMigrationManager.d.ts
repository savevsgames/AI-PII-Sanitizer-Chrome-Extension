/**
 * Storage Migration Manager
 * Handles all data migration operations
 *
 * Features:
 * - V1 to V2 migration (aliases to profiles)
 * - Plaintext to encrypted storage migration
 * - Legacy key material to Firebase UID migration
 * - Automatic migration on initialization
 */
import { StorageEncryptionManager } from './StorageEncryptionManager';
import { StorageConfigManager } from './StorageConfigManager';
import { StorageProfileManager } from './StorageProfileManager';
export declare class StorageMigrationManager {
    private encryptionManager;
    private configManager;
    private profileManager;
    private static readonly KEYS;
    constructor(encryptionManager: StorageEncryptionManager, configManager: StorageConfigManager, profileManager: StorageProfileManager);
    /**
     * Initialize storage with default values
     * Handles v1 to v2 migration if needed
     * Gracefully handles unauthenticated state (returns empty data)
     * Works in both service worker and popup contexts (Firebase auth/web-extension support)
     */
    initialize(): Promise<void>;
    /**
     * Check if v1 data exists and migrate to v2 if needed
     */
    migrateV1ToV2IfNeeded(): Promise<void>;
    /**
     * Migrate all plaintext sensitive data to encrypted storage
     * This runs automatically on initialization and handles:
     * - API keys
     * - Custom rules
     * - Activity logs
     * - Account data
     */
    migrateAPIKeysToEncryptedIfNeeded(): Promise<void>;
    /**
     * Load and decrypt aliases (legacy v1 data) - used for migration
     * Supports automatic migration from legacy encryption to Firebase UID
     */
    private loadAliasesForMigration;
}
//# sourceMappingURL=StorageMigrationManager.d.ts.map