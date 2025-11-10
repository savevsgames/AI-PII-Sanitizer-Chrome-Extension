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
import { generateIdentityVariations } from '../aliasVariations';

export class StorageProfileManager {
  private encryptionManager: StorageEncryptionManager;
  private configManager: StorageConfigManager;

  private static readonly PROFILES_KEY = 'profiles';

  constructor(
    encryptionManager: StorageEncryptionManager,
    configManager: StorageConfigManager
  ) {
    this.encryptionManager = encryptionManager;
    this.configManager = configManager;
  }

  /**
   * Save profiles array
   */
  async saveProfiles(profiles: AliasProfile[]): Promise<void> {
    const encrypted = await this.encryptionManager.encrypt(JSON.stringify(profiles));
    await chrome.storage.local.set({
      [StorageProfileManager.PROFILES_KEY]: encrypted,
    });
  }

  /**
   * Load and decrypt profiles
   * Supports automatic migration from legacy encryption (random key material) to Firebase UID
   */
  async loadProfiles(): Promise<AliasProfile[]> {
    const data = await chrome.storage.local.get(StorageProfileManager.PROFILES_KEY);
    if (!data[StorageProfileManager.PROFILES_KEY]) {
      return [];
    }

    const encryptedData = data[StorageProfileManager.PROFILES_KEY];

    try {
      // Try Firebase UID key first (new method)
      console.log('[StorageProfileManager] Attempting decryption with Firebase UID key...');
      const decrypted = await this.encryptionManager.decrypt(encryptedData);
      const profiles = JSON.parse(decrypted);
      console.log('[StorageProfileManager] ✅ Firebase UID decryption successful');
      return profiles;

    } catch (error) {
      // Log the ACTUAL decryption error for debugging
      console.error('[StorageProfileManager] ❌ Profiles decryption failed:', error);
      console.error('[StorageProfileManager] Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('[StorageProfileManager] Error message:', error instanceof Error ? error.message : String(error));

      // Check if legacy key material exists (indicates data not yet migrated)
      const legacyKeyData = await chrome.storage.local.get('_encryptionKeyMaterial');
      const hasLegacyKey = !!legacyKeyData['_encryptionKeyMaterial'];

      console.log('[StorageProfileManager] Legacy key check:', { hasLegacyKey });

      if (!hasLegacyKey) {
        // No legacy key = already migrated to Firebase UID
        // If we're in service worker, we can't decrypt Firebase UID encrypted data
        console.log('[StorageProfileManager] Data already migrated to Firebase UID (no legacy key found)');

        // Re-throw the original error (likely ENCRYPTION_KEY_UNAVAILABLE in service worker)
        if (error instanceof Error && error.message.includes('ENCRYPTION_KEY_UNAVAILABLE')) {
          throw error;
        }

        // Include the original error in the new error message
        const originalError = error instanceof Error ? error.message : String(error);
        throw new Error(`DECRYPTION_FAILED: Profiles encrypted with Firebase UID. Authentication required. Original error: ${originalError}`);
      }

      console.warn('[StorageProfileManager] Legacy key found - attempting legacy key migration...');

      try {
        // Fall back to legacy random key material
        const legacyKey = await this.encryptionManager.getLegacyEncryptionKey();
        const decrypted = await this.encryptionManager.decryptWithKey(encryptedData, legacyKey);
        const profiles = JSON.parse(decrypted);

        console.log('[StorageProfileManager] ✅ Legacy decryption successful');

        // Check if we're in service worker context
        const isServiceWorker = typeof document === 'undefined';

        if (isServiceWorker) {
          // In service worker, can't re-encrypt (no Firebase auth)
          // Just return the decrypted profiles, migration will happen in popup
          console.log('[StorageProfileManager] ⏭️ Running in service worker - skipping migration (will happen in popup)');
          return profiles;
        }

        // In popup/content context - proceed with migration
        console.log('[StorageProfileManager] 🔄 Migrating to Firebase UID encryption...');

        // Re-encrypt with Firebase UID key
        await this.saveProfiles(profiles); // Uses Firebase UID automatically

        // Clean up old key material (no longer needed)
        await chrome.storage.local.remove('_encryptionKeyMaterial');
        console.log('[StorageProfileManager] ✅ Migration complete - old key material removed');
        console.log('[StorageProfileManager] 🔐 Data now encrypted with Firebase UID');

        return profiles;

      } catch (legacyError) {
        console.error('[StorageProfileManager] Both decryption methods failed:', legacyError);
        console.error('[StorageProfileManager] Original error:', error);

        // Check if it's an authentication error
        if (error instanceof Error && error.message.includes('ENCRYPTION_KEY_UNAVAILABLE')) {
          throw error; // Re-throw auth error for UI to handle
        }

        throw new Error('DECRYPTION_FAILED: Cannot decrypt profiles. Data may be corrupted or authentication required.');
      }
    }
  }

  /**
   * Create a new profile
   */
  async createProfile(profileData: {
    profileName: string;
    description?: string;
    real: IdentityData;
    alias: IdentityData;
    enabled?: boolean;
  }): Promise<AliasProfile> {
    const profiles = await this.loadProfiles();

    // Check FREE tier limit (1 profile max)
    const config = await this.configManager.loadConfig();
    const isFree = config?.account?.tier === 'free';

    if (isFree && profiles.length >= 1) {
      throw new Error('FREE_TIER_LIMIT: You can only create 1 profile on the FREE tier. Upgrade to PRO for unlimited profiles.');
    }

    // Generate variations ONLY for PRO users (PRO feature)
    let variations: AliasProfile['variations'] | undefined;
    if (!isFree) {
      const realVariations = generateIdentityVariations(profileData.real);
      const aliasVariations = generateIdentityVariations(profileData.alias);
      variations = {
        real: realVariations,
        alias: aliasVariations,
      };
    }

    const newProfile: AliasProfile = {
      id: this.generateId(),
      profileName: profileData.profileName,
      description: profileData.description,
      enabled: profileData.enabled ?? true,
      real: profileData.real,
      alias: profileData.alias,
      variations, // Only populated for PRO users
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageStats: {
          totalSubstitutions: 0,
          lastUsed: 0,
          byService: {
            chatgpt: 0,
            claude: 0,
            gemini: 0,
            perplexity: 0,
            copilot: 0,
          },
          byPIIType: {
            name: 0,
            email: 0,
            phone: 0,
            cellPhone: 0,
            address: 0,
            company: 0,
            custom: 0,
          },
        },
        confidence: 1,
      },
      settings: {
        autoReplace: true,
        highlightInUI: true,
        activeServices: ['chatgpt', 'claude', 'gemini'],
        enableVariations: !isFree, // PRO only: Enable variations for PRO users, disable for FREE
      },
    };

    profiles.push(newProfile);
    await this.saveProfiles(profiles);
    console.log('[StorageProfileManager] Created profile:', newProfile.profileName, 'with variations');
    return newProfile;
  }

  /**
   * Update an existing profile
   */
  async updateProfile(id: string, updates: Partial<AliasProfile>): Promise<void> {
    const profiles = await this.loadProfiles();
    const index = profiles.findIndex(p => p.id === id);

    if (index !== -1) {
      const updatedProfile = {
        ...profiles[index],
        ...updates,
        metadata: {
          ...profiles[index].metadata,
          updatedAt: Date.now(),
        },
        // Merge settings properly
        settings: {
          ...profiles[index].settings,
          ...(updates.settings || {}),
        },
      };

      // Regenerate variations if real or alias identity changed (PRO only)
      if (updates.real || updates.alias) {
        const config = await this.configManager.loadConfig();
        const isFree = config?.account?.tier === 'free';

        if (!isFree) {
          // PRO feature: Generate variations
          const realVariations = generateIdentityVariations(updatedProfile.real);
          const aliasVariations = generateIdentityVariations(updatedProfile.alias);
          updatedProfile.variations = {
            real: realVariations,
            alias: aliasVariations,
          };
          console.log('[StorageProfileManager] Regenerated variations for profile:', updatedProfile.profileName);
        } else {
          // FREE tier: No variations
          updatedProfile.variations = undefined;
          console.log('[StorageProfileManager] Variations disabled for FREE tier profile:', updatedProfile.profileName);
        }
      }

      profiles[index] = updatedProfile;
      await this.saveProfiles(profiles);
      console.log('[StorageProfileManager] Updated profile:', profiles[index].profileName);
    }
  }

  /**
   * Delete a profile by ID
   */
  async deleteProfile(id: string): Promise<void> {
    const profiles = await this.loadProfiles();
    const filtered = profiles.filter(p => p.id !== id);
    await this.saveProfiles(filtered);
    console.log('[StorageProfileManager] Deleted profile:', id);
  }

  /**
   * Toggle profile enabled state
   */
  async toggleProfile(id: string): Promise<void> {
    const profiles = await this.loadProfiles();
    const index = profiles.findIndex(p => p.id === id);

    if (index !== -1) {
      profiles[index].enabled = !profiles[index].enabled;
      profiles[index].metadata.updatedAt = Date.now();
      await this.saveProfiles(profiles);
      console.log('[StorageProfileManager] Toggled profile:', profiles[index].profileName, 'to', profiles[index].enabled);
    }
  }

  /**
   * Get a single profile by ID
   */
  async getProfile(id: string): Promise<AliasProfile | null> {
    const profiles = await this.loadProfiles();
    return profiles.find(p => p.id === id) || null;
  }

  /**
   * Increment usage stats for a profile
   */
  async incrementProfileUsage(
    profileId: string,
    service: 'chatgpt' | 'claude' | 'gemini',
    piiType: keyof AliasProfile['metadata']['usageStats']['byPIIType']
  ): Promise<void> {
    const profiles = await this.loadProfiles();
    const index = profiles.findIndex(p => p.id === profileId);

    if (index !== -1) {
      const profile = profiles[index];
      profile.metadata.usageStats.totalSubstitutions++;
      profile.metadata.usageStats.lastUsed = Date.now();
      profile.metadata.usageStats.byService[service]++;
      profile.metadata.usageStats.byPIIType[piiType]++;
      profile.metadata.updatedAt = Date.now();

      await this.saveProfiles(profiles);
    }
  }

  /**
   * Generate unique ID for profiles
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
