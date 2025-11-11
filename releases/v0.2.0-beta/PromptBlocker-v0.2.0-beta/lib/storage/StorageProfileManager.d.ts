/**
 * Storage Profile Manager
 * Handles all AliasProfile storage operations
 *
 * Features:
 * - Profile CRUD operations
 * - Automatic variation generation for PRO users
 * - FREE tier limit enforcement (1 profile max)
 * - Usage statistics tracking
 * - Encrypted storage support
 */
import { AliasProfile, IdentityData } from '../types';
import { StorageEncryptionManager } from './StorageEncryptionManager';
import { StorageConfigManager } from './StorageConfigManager';
export declare class StorageProfileManager {
    private encryptionManager;
    private configManager;
    private static readonly PROFILES_KEY;
    constructor(encryptionManager: StorageEncryptionManager, configManager: StorageConfigManager);
    /**
     * Save profiles array
     */
    saveProfiles(profiles: AliasProfile[]): Promise<void>;
    /**
     * Load and decrypt profiles
     * Supports automatic migration from legacy encryption (random key material) to Firebase UID
     */
    loadProfiles(): Promise<AliasProfile[]>;
    /**
     * Create a new profile
     */
    createProfile(profileData: {
        profileName: string;
        description?: string;
        real: IdentityData;
        alias: IdentityData;
        enabled?: boolean;
    }): Promise<AliasProfile>;
    /**
     * Update an existing profile
     */
    updateProfile(id: string, updates: Partial<AliasProfile>): Promise<void>;
    /**
     * Delete a profile by ID
     */
    deleteProfile(id: string): Promise<void>;
    /**
     * Toggle profile enabled state
     */
    toggleProfile(id: string): Promise<void>;
    /**
     * Get a single profile by ID
     */
    getProfile(id: string): Promise<AliasProfile | null>;
    /**
     * Increment usage stats for a profile
     */
    incrementProfileUsage(profileId: string, service: 'chatgpt' | 'claude' | 'gemini', piiType: keyof AliasProfile['metadata']['usageStats']['byPIIType']): Promise<void>;
    /**
     * Generate unique ID for profiles
     */
    private generateId;
}
//# sourceMappingURL=StorageProfileManager.d.ts.map