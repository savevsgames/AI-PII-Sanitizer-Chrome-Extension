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

import { AliasProfile, AliasEntry, IdentityData, UserConfig, UserConfigV1 } from '../types';
import { StorageEncryptionManager } from './StorageEncryptionManager';
import { StorageConfigManager } from './StorageConfigManager';
import { StorageProfileManager } from './StorageProfileManager';
import { generateId } from './storage-utils';

export class StorageMigrationManager {
  private encryptionManager: StorageEncryptionManager;
  private configManager: StorageConfigManager;
  private profileManager: StorageProfileManager;

  private static readonly KEYS = {
    ALIASES: 'aliases',
    PROFILES: 'profiles',
    CONFIG: 'config',
    VERSION: 'dataVersion',
  };

  constructor(
    encryptionManager: StorageEncryptionManager,
    configManager: StorageConfigManager,
    profileManager: StorageProfileManager
  ) {
    this.encryptionManager = encryptionManager;
    this.configManager = configManager;
    this.profileManager = profileManager;
  }

  /**
   * Initialize storage with default values
   * Handles v1 to v2 migration if needed
   * Gracefully handles unauthenticated state (returns empty data)
   * In service worker context, skips profile loading (profiles sent from popup)
   */
  async initialize(): Promise<void> {
    // Check if we're in service worker context
    const isServiceWorker = typeof document === 'undefined';

    try {
      // Check for v1 data and migrate if needed
      await this.migrateV1ToV2IfNeeded();

      // Migrate plaintext API keys to encrypted storage if needed
      await this.migrateAPIKeysToEncryptedIfNeeded();

      const config = await this.configManager.loadConfig();
      if (!config) {
        await this.configManager.saveConfig(this.configManager.getDefaultConfig());
      }

      // Skip profile loading in service worker - profiles will be sent from popup
      if (isServiceWorker) {
        console.log('[StorageMigrationManager] Service worker context - skipping profile initialization');
        console.log('[StorageMigrationManager] Profiles will be sent from popup via SET_PROFILES message');
        return;
      }

      const profiles = await this.profileManager.loadProfiles();
      if (!profiles || profiles.length === 0) {
        // Initialize with empty profiles array
        await this.profileManager.saveProfiles([]);
      }
    } catch (error) {
      // If user not authenticated, skip initialization (data locked)
      if (error instanceof Error && error.message.includes('ENCRYPTION_KEY_UNAVAILABLE')) {
        console.log('[StorageMigrationManager] User not authenticated - skipping data initialization');
        return;
      }
      // If decryption fails (wrong UID), allow app to function with empty profiles
      if (error instanceof Error && error.message.includes('DECRYPTION_FAILED')) {
        console.warn('[StorageMigrationManager] ⚠️ Decryption failed - possible UID mismatch');
        console.warn('[StorageMigrationManager] App will run with empty profiles. Sign in with original provider to access encrypted data.');

        // Show auth issue banner in popup (not in service worker)
        if (typeof document !== 'undefined') {
          // Notify popup to show the banner
          setTimeout(() => {
            const event = new CustomEvent('auth-decryption-failed');
            window.dispatchEvent(event);
          }, 100);
        }

        // Don't throw - allow app to continue
        return;
      }
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Check if v1 data exists and migrate to v2 if needed
   */
  async migrateV1ToV2IfNeeded(): Promise<void> {
    const dataVersion = await chrome.storage.local.get(StorageMigrationManager.KEYS.VERSION);

    // Already on v2 or higher
    if (dataVersion[StorageMigrationManager.KEYS.VERSION] >= 2) {
      console.log('[StorageMigrationManager] Already on v2');
      return;
    }

    // Check if v1 aliases exist
    const v1Aliases = await this.loadAliasesForMigration();
    if (!v1Aliases || v1Aliases.length === 0) {
      console.log('[StorageMigrationManager] No v1 data to migrate');
      await chrome.storage.local.set({ [StorageMigrationManager.KEYS.VERSION]: 2 });
      return;
    }

    console.log('[StorageMigrationManager] Migrating v1 aliases to v2 profiles...');

    // Group aliases by category/person to create profiles
    const profileMap = new Map<string, AliasEntry[]>();

    // Group aliases by category or create individual profiles
    v1Aliases.forEach(alias => {
      const key = alias.category || `profile-${alias.id}`;
      if (!profileMap.has(key)) {
        profileMap.set(key, []);
      }
      profileMap.get(key)!.push(alias);
    });

    // Convert groups to profiles
    const newProfiles: AliasProfile[] = [];

    profileMap.forEach((aliases, categoryName) => {
      const real: IdentityData = {};
      const aliasData: IdentityData = {};

      // Build real and alias identity from grouped aliases
      aliases.forEach(alias => {
        switch (alias.type) {
          case 'name':
            real.name = alias.realValue;
            aliasData.name = alias.aliasValue;
            break;
          case 'email':
            real.email = alias.realValue;
            aliasData.email = alias.aliasValue;
            break;
          case 'phone':
            real.phone = alias.realValue;
            aliasData.phone = alias.aliasValue;
            break;
          case 'address':
            real.address = alias.realValue;
            aliasData.address = alias.aliasValue;
            break;
        }
      });

      // Get highest usage stats from aliases
      const totalUsage = aliases.reduce((sum, a) => sum + a.metadata.usageCount, 0);
      const lastUsed = Math.max(...aliases.map(a => a.metadata.lastUsed));
      const createdAt = Math.min(...aliases.map(a => a.metadata.createdAt));

      const profile: AliasProfile = {
        id: generateId(),
        profileName: categoryName === `profile-${aliases[0].id}`
          ? `Profile - ${real.name || real.email || 'Unknown'}`
          : categoryName,
        description: 'Migrated from v1',
        enabled: aliases[0].enabled,
        real,
        alias: aliasData,
        metadata: {
          createdAt,
          updatedAt: Date.now(),
          usageStats: {
            totalSubstitutions: totalUsage,
            lastUsed,
            byService: { chatgpt: 0, claude: 0, gemini: 0, perplexity: 0, copilot: 0 },
            byPIIType: { name: 0, email: 0, phone: 0, cellPhone: 0, address: 0, company: 0, custom: 0 },
          },
          confidence: aliases[0].metadata.confidence,
        },
        settings: {
          autoReplace: true,
          highlightInUI: true,
          activeServices: ['chatgpt', 'claude', 'gemini'],
          enableVariations: true,
        },
      };

      newProfiles.push(profile);
    });

    // Save migrated profiles
    await this.profileManager.saveProfiles(newProfiles);

    // Update config to v2
    const oldConfig = await this.configManager.loadConfig() as UserConfigV1 | null;
    if (oldConfig) {
      const newConfig: UserConfig = {
        version: 2,
        account: {
          emailOptIn: false,
          tier: 'free',
          syncEnabled: false,
        },
        settings: {
          enabled: oldConfig.settings.enabled,
          defaultMode: 'auto-replace',
          showNotifications: oldConfig.settings.showNotifications,
          decodeResponses: false,        // Default to false for migrated configs
          theme: 'classic-dark',         // Default theme for migrated configs
          protectedDomains: oldConfig.settings.protectedDomains,
          excludedDomains: oldConfig.settings.excludedDomains,
          strictMode: oldConfig.settings.strictMode,
          debugMode: false,
          cloudSync: false,
        },
        profiles: newProfiles,
        stats: {
          totalSubstitutions: oldConfig.stats.totalSubstitutions,
          totalInterceptions: 0,
          totalWarnings: 0,
          successRate: oldConfig.stats.successRate,
          lastSyncTimestamp: oldConfig.stats.lastSyncTimestamp,
          byService: {
            chatgpt: { requests: 0, substitutions: 0 },
            claude: { requests: 0, substitutions: 0 },
            gemini: { requests: 0, substitutions: 0 },
            perplexity: { requests: 0, substitutions: 0 },
            copilot: { requests: 0, substitutions: 0 },
          },
          activityLog: [],
        },
      };

      await this.configManager.saveConfig(newConfig);
    }

    // Mark as v2
    await chrome.storage.local.set({ [StorageMigrationManager.KEYS.VERSION]: 2 });

    console.log(`[StorageMigrationManager] Migration complete! Created ${newProfiles.length} profiles from ${v1Aliases.length} aliases`);
  }

  /**
   * Migrate all plaintext sensitive data to encrypted storage
   * This runs automatically on initialization and handles:
   * - API keys
   * - Custom rules
   * - Activity logs
   * - Account data
   */
  async migrateAPIKeysToEncryptedIfNeeded(): Promise<void> {
    const data = await chrome.storage.local.get(StorageMigrationManager.KEYS.CONFIG);
    const config = data[StorageMigrationManager.KEYS.CONFIG];

    if (!config) {
      return; // No config to migrate
    }

    const configWithEncrypted = config as any;
    let needsSave = false;

    // 1. Migrate API keys
    const hasPlaintextKeys = config.apiKeyVault && config.apiKeyVault.keys.length > 0;
    const hasEncryptedVault = !!configWithEncrypted._encryptedApiKeyVault;

    if (hasPlaintextKeys && !hasEncryptedVault) {
      console.log('[StorageMigrationManager] 🔐 Migrating plaintext API keys to encrypted storage...');
      console.log(`[StorageMigrationManager] Found ${config.apiKeyVault.keys.length} plaintext API keys`);

      try {
        const encryptedVault = await this.encryptionManager.encryptAPIKeyVault(config.apiKeyVault);
        configWithEncrypted._encryptedApiKeyVault = encryptedVault;
        config.apiKeyVault = {
          ...config.apiKeyVault,
          keys: [], // Clear plaintext keys
        };
        needsSave = true;
        console.log('[StorageMigrationManager] ✅ API key migration complete - keys are now encrypted');
      } catch (error) {
        console.error('[StorageMigrationManager] ❌ Failed to migrate API keys:', error);
      }
    }

    // 2. Migrate custom rules
    const hasPlaintextRules = config.customRules && config.customRules.rules.length > 0;
    const hasEncryptedRules = !!configWithEncrypted._encryptedCustomRules;

    if (hasPlaintextRules && !hasEncryptedRules) {
      console.log('[StorageMigrationManager] 🔐 Migrating plaintext custom rules to encrypted storage...');
      console.log(`[StorageMigrationManager] Found ${config.customRules.rules.length} plaintext custom rules`);

      try {
        const encryptedRules = await this.encryptionManager.encryptCustomRules(config.customRules);
        configWithEncrypted._encryptedCustomRules = encryptedRules;
        config.customRules = {
          ...config.customRules,
          rules: [], // Clear plaintext rules
        };
        needsSave = true;
        console.log('[StorageMigrationManager] ✅ Custom rules migration complete - rules are now encrypted');
      } catch (error) {
        console.error('[StorageMigrationManager] ❌ Failed to migrate custom rules:', error);
      }
    }

    // 3. Migrate activity logs
    const hasPlaintextLogs = config.stats && config.stats.activityLog && config.stats.activityLog.length > 0;
    const hasEncryptedLogs = !!configWithEncrypted._encryptedActivityLogs;

    if (hasPlaintextLogs && !hasEncryptedLogs) {
      console.log('[StorageMigrationManager] 🔐 Migrating plaintext activity logs to encrypted storage...');
      console.log(`[StorageMigrationManager] Found ${config.stats!.activityLog!.length} plaintext activity log entries`);

      try {
        const encryptedLogs = await this.encryptionManager.encryptActivityLogs(config.stats.activityLog);
        configWithEncrypted._encryptedActivityLogs = encryptedLogs;
        config.stats = {
          ...config.stats,
          activityLog: [], // Clear plaintext logs
        };
        needsSave = true;
        console.log('[StorageMigrationManager] ✅ Activity logs migration complete - logs are now encrypted');
      } catch (error) {
        console.error('[StorageMigrationManager] ❌ Failed to migrate activity logs:', error);
      }
    }

    // 4. Migrate account data
    const hasPlaintextAccount = config.account && (config.account.email || config.account.displayName);
    const hasEncryptedAccount = !!configWithEncrypted._encryptedAccountData;

    if (hasPlaintextAccount && !hasEncryptedAccount) {
      console.log('[StorageMigrationManager] 🔐 Migrating plaintext account data to encrypted storage...');
      console.log('[StorageMigrationManager] Found plaintext account data (email, displayName, etc.)');

      try {
        const accountToEncrypt = {
          email: config.account.email,
          displayName: config.account.displayName,
          photoURL: config.account.photoURL,
          firebaseUid: config.account.firebaseUid,
        };
        const encryptedAccount = await this.encryptionManager.encryptAccountData(accountToEncrypt);
        configWithEncrypted._encryptedAccountData = encryptedAccount;
        config.account = {
          ...config.account,
          email: undefined,
          displayName: undefined,
          photoURL: undefined,
          firebaseUid: undefined,
        };
        needsSave = true;
        console.log('[StorageMigrationManager] ✅ Account data migration complete - account data is now encrypted');
      } catch (error) {
        console.error('[StorageMigrationManager] ❌ Failed to migrate account data:', error);
      }
    }

    // Save updated config if any migrations occurred
    if (needsSave) {
      await chrome.storage.local.set({
        [StorageMigrationManager.KEYS.CONFIG]: config,
      });
      console.log('[StorageMigrationManager] 🎉 All sensitive data migration complete - all data is now encrypted');
    }
  }

  /**
   * Load and decrypt aliases (legacy v1 data) - used for migration
   * Supports automatic migration from legacy encryption to Firebase UID
   */
  private async loadAliasesForMigration(): Promise<AliasEntry[]> {
    const data = await chrome.storage.local.get(StorageMigrationManager.KEYS.ALIASES);
    if (!data[StorageMigrationManager.KEYS.ALIASES]) {
      return [];
    }

    const encryptedData = data[StorageMigrationManager.KEYS.ALIASES];

    try {
      // Try Firebase UID key first (new method)
      const decrypted = await this.encryptionManager.decrypt(encryptedData);
      return JSON.parse(decrypted);

    } catch (error) {
      // Check if legacy key material exists
      const legacyKeyData = await chrome.storage.local.get('_encryptionKeyMaterial');
      const hasLegacyKey = !!legacyKeyData['_encryptionKeyMaterial'];

      if (!hasLegacyKey) {
        // No legacy key = already migrated
        console.log('[StorageMigrationManager] Aliases already migrated to Firebase UID');

        if (error instanceof Error && error.message.includes('ENCRYPTION_KEY_UNAVAILABLE')) {
          throw error;
        }

        return []; // Return empty if can't decrypt
      }

      console.warn('[StorageMigrationManager] Aliases: Firebase UID decryption failed, attempting legacy migration...');

      try {
        // Fall back to legacy key
        const legacyKey = await this.encryptionManager.getLegacyEncryptionKey();
        const decrypted = await this.encryptionManager.decryptWithKey(encryptedData, legacyKey);
        const aliases = JSON.parse(decrypted);

        console.log('[StorageMigrationManager] ✅ Legacy aliases decrypted');

        // Check if we're in service worker context
        const isServiceWorker = typeof document === 'undefined';

        if (isServiceWorker) {
          // In service worker, can't re-encrypt (no Firebase auth)
          console.log('[StorageMigrationManager] ⏭️ Running in service worker - skipping aliases migration');
          return aliases;
        }

        // In popup/content context - proceed with migration
        console.log('[StorageMigrationManager] 🔄 Migrating aliases to Firebase UID...');

        // Re-encrypt with Firebase UID
        const encrypted = await this.encryptionManager.encrypt(JSON.stringify(aliases));
        await chrome.storage.local.set({
          [StorageMigrationManager.KEYS.ALIASES]: encrypted,
        });

        return aliases;

      } catch (legacyError) {
        console.error('[StorageMigrationManager] Failed to decrypt aliases:', legacyError);

        // Re-throw auth errors for UI handling
        if (error instanceof Error && error.message.includes('ENCRYPTION_KEY_UNAVAILABLE')) {
          throw error;
        }

        return [];
      }
    }
  }
}
