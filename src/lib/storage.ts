/**
 * Storage Manager for persisting aliases and configuration
 * Uses Chrome Storage API with encryption for sensitive data
 * Version 2.0 - Profile-based architecture with backward compatibility
 * Version 2.1 - Added alias variations support
 */

import {
  AliasEntry,
  AliasProfile,
  UserConfig,
  UserConfigV1,
  IdentityData,
  PromptTemplate
} from './types';
import { generateIdentityVariations } from './aliasVariations';

export class StorageManager {
  private static instance: StorageManager;
  private static readonly KEYS = {
    ALIASES: 'aliases',        // v1 legacy
    PROFILES: 'profiles',       // v2 new
    CONFIG: 'config',
    STATS: 'stats',
    VERSION: 'dataVersion',     // Track migration state
  };

  // Cache to prevent excessive decryption
  // Longer cache since each context (popup, background) has its own instance
  private configCache: UserConfig | null = null;
  private configCacheTimestamp: number = 0;
  private readonly CACHE_TTL_MS = 5000; // 5 second cache (longer due to cross-context issues)

  private constructor() {
    // Listen for storage changes from OTHER contexts to invalidate cache
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes[StorageManager.KEYS.CONFIG]) {
        console.log('[Storage] 🔄 Config changed in another context, invalidating cache');
        this.configCache = null;
        this.configCacheTimestamp = 0;
      }
    });
  }

  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  /**
   * Initialize storage with default values
   * Handles v1 to v2 migration if needed
   * Gracefully handles unauthenticated state (returns empty data)
   */
  async initialize(): Promise<void> {
    try {
      // Check for v1 data and migrate if needed
      await this.migrateV1ToV2IfNeeded();

      // Migrate plaintext API keys to encrypted storage if needed
      await this.migrateAPIKeysToEncryptedIfNeeded();

      const config = await this.loadConfig();
      if (!config) {
        await this.saveConfig(this.getDefaultConfig());
      }

      const profiles = await this.loadProfiles();
      if (!profiles || profiles.length === 0) {
        // Initialize with empty profiles array
        await this.saveProfiles([]);
      }
    } catch (error) {
      // If user not authenticated, skip initialization (data locked)
      if (error instanceof Error && error.message.includes('ENCRYPTION_KEY_UNAVAILABLE')) {
        console.log('[StorageManager] User not authenticated - skipping data initialization');
        return;
      }
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Save alias dictionary
   */
  async saveAliases(aliases: AliasEntry[]): Promise<void> {
    const encrypted = await this.encrypt(JSON.stringify(aliases));
    await chrome.storage.local.set({
      [StorageManager.KEYS.ALIASES]: encrypted,
    });
  }

  /**
   * Load and decrypt aliases (legacy v1 data)
   * Supports automatic migration from legacy encryption to Firebase UID
   */
  async loadAliases(): Promise<AliasEntry[]> {
    const data = await chrome.storage.local.get(StorageManager.KEYS.ALIASES);
    if (!data[StorageManager.KEYS.ALIASES]) {
      return [];
    }

    const encryptedData = data[StorageManager.KEYS.ALIASES];

    try {
      // Try Firebase UID key first (new method)
      const decrypted = await this.decrypt(encryptedData);
      return JSON.parse(decrypted);

    } catch (error) {
      console.warn('[StorageManager] Aliases: Firebase UID decryption failed, attempting legacy migration...');

      try {
        // Fall back to legacy key
        const legacyKey = await this.getLegacyEncryptionKey();
        const decrypted = await this.decryptWithKey(encryptedData, legacyKey);
        const aliases = JSON.parse(decrypted);

        console.log('[StorageManager] ✅ Legacy aliases decrypted - migrating to Firebase UID...');

        // Re-encrypt with Firebase UID
        await this.saveAliases(aliases);

        return aliases;

      } catch (legacyError) {
        console.error('[StorageManager] Failed to decrypt aliases:', legacyError);

        // Re-throw auth errors for UI handling
        if (error instanceof Error && error.message.includes('ENCRYPTION_KEY_UNAVAILABLE')) {
          throw error;
        }

        return [];
      }
    }
  }

  /**
   * Add a new alias
   */
  async addAlias(alias: Omit<AliasEntry, 'id' | 'metadata'>): Promise<AliasEntry> {
    const aliases = await this.loadAliases();

    const newAlias: AliasEntry = {
      ...alias,
      id: this.generateId(),
      metadata: {
        createdAt: Date.now(),
        usageCount: 0,
        lastUsed: 0,
        confidence: 1,
      },
    };

    aliases.push(newAlias);
    await this.saveAliases(aliases);
    return newAlias;
  }

  /**
   * Remove an alias by ID
   */
  async removeAlias(id: string): Promise<void> {
    const aliases = await this.loadAliases();
    const filtered = aliases.filter(a => a.id !== id);
    await this.saveAliases(filtered);
  }

  /**
   * Update an existing alias
   */
  async updateAlias(id: string, updates: Partial<AliasEntry>): Promise<void> {
    const aliases = await this.loadAliases();
    const index = aliases.findIndex(a => a.id === id);

    if (index !== -1) {
      aliases[index] = { ...aliases[index], ...updates };
      await this.saveAliases(aliases);
    }
  }

  // ========== V2 PROFILE METHODS ==========

  /**
   * Save profiles array
   */
  async saveProfiles(profiles: AliasProfile[]): Promise<void> {
    const encrypted = await this.encrypt(JSON.stringify(profiles));
    await chrome.storage.local.set({
      [StorageManager.KEYS.PROFILES]: encrypted,
    });
  }

  /**
   * Load and decrypt profiles
   * Supports automatic migration from legacy encryption (random key material) to Firebase UID
   */
  async loadProfiles(): Promise<AliasProfile[]> {
    const data = await chrome.storage.local.get(StorageManager.KEYS.PROFILES);
    if (!data[StorageManager.KEYS.PROFILES]) {
      return [];
    }

    const encryptedData = data[StorageManager.KEYS.PROFILES];

    try {
      // Try Firebase UID key first (new method)
      console.log('[StorageManager] Attempting decryption with Firebase UID key...');
      const decrypted = await this.decrypt(encryptedData);
      const profiles = JSON.parse(decrypted);
      console.log('[StorageManager] ✅ Firebase UID decryption successful');
      return profiles;

    } catch (error) {
      console.warn('[StorageManager] Firebase UID decryption failed, attempting legacy key migration...');

      try {
        // Fall back to legacy random key material
        const legacyKey = await this.getLegacyEncryptionKey();
        const decrypted = await this.decryptWithKey(encryptedData, legacyKey);
        const profiles = JSON.parse(decrypted);

        console.log('[StorageManager] ✅ Legacy decryption successful - migrating to Firebase UID...');

        // Re-encrypt with Firebase UID key
        await this.saveProfiles(profiles); // Uses Firebase UID automatically

        // Clean up old key material (no longer needed)
        await chrome.storage.local.remove('_encryptionKeyMaterial');
        console.log('[StorageManager] ✅ Migration complete - old key material removed');
        console.log('[StorageManager] 🔐 Data now encrypted with Firebase UID');

        return profiles;

      } catch (legacyError) {
        console.error('[StorageManager] Both decryption methods failed:', legacyError);
        console.error('[StorageManager] Original error:', error);

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
    const config = await this.loadConfig();
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
    console.log('[StorageManager] Created profile:', newProfile.profileName, 'with variations');
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
        const config = await this.loadConfig();
        const isFree = config?.account?.tier === 'free';

        if (!isFree) {
          // PRO feature: Generate variations
          const realVariations = generateIdentityVariations(updatedProfile.real);
          const aliasVariations = generateIdentityVariations(updatedProfile.alias);
          updatedProfile.variations = {
            real: realVariations,
            alias: aliasVariations,
          };
          console.log('[StorageManager] Regenerated variations for profile:', updatedProfile.profileName);
        } else {
          // FREE tier: No variations
          updatedProfile.variations = undefined;
          console.log('[StorageManager] Variations disabled for FREE tier profile:', updatedProfile.profileName);
        }
      }

      profiles[index] = updatedProfile;
      await this.saveProfiles(profiles);
      console.log('[StorageManager] Updated profile:', profiles[index].profileName);
    }
  }

  /**
   * Delete a profile by ID
   */
  async deleteProfile(id: string): Promise<void> {
    const profiles = await this.loadProfiles();
    const filtered = profiles.filter(p => p.id !== id);
    await this.saveProfiles(filtered);
    console.log('[StorageManager] Deleted profile:', id);
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
      console.log('[StorageManager] Toggled profile:', profiles[index].profileName, 'to', profiles[index].enabled);
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
   * Save configuration
   * Encrypts ALL sensitive data before saving:
   * - API key vault
   * - Custom rules
   * - Activity logs
   * - Account data (email, displayName, photoURL)
   */
  async saveConfig(config: UserConfig): Promise<void> {
    console.log('[Storage] 💾 Saving config with encryption...');

    // Clone config to avoid mutating the original
    const configToSave = { ...config };
    const encryptedData = configToSave as any;

    // 1. Encrypt API key vault if it exists and has keys
    if (configToSave.apiKeyVault && configToSave.apiKeyVault.keys.length > 0) {
      console.log('[Storage] 🔐 Encrypting API key vault...');
      encryptedData._encryptedApiKeyVault = await this.encryptAPIKeyVault(configToSave.apiKeyVault);
      configToSave.apiKeyVault = { ...configToSave.apiKeyVault, keys: [] };
      console.log('[Storage] ✅ API key vault encrypted');
    }

    // 2. Encrypt custom rules if they exist
    if (configToSave.customRules && configToSave.customRules.rules.length > 0) {
      console.log('[Storage] 🔐 Encrypting custom rules...');
      encryptedData._encryptedCustomRules = await this.encryptCustomRules(configToSave.customRules);
      configToSave.customRules = { ...configToSave.customRules, rules: [] };
      console.log('[Storage] ✅ Custom rules encrypted');
    }

    // 3. Encrypt activity logs if they exist
    if (configToSave.stats && configToSave.stats.activityLog && configToSave.stats.activityLog.length > 0) {
      console.log('[Storage] 🔐 Encrypting activity logs...');
      encryptedData._encryptedActivityLogs = await this.encryptActivityLogs(configToSave.stats.activityLog);
      configToSave.stats = { ...configToSave.stats, activityLog: [] };
      console.log('[Storage] ✅ Activity logs encrypted');
    }

    // 4. Encrypt account data (email, displayName, photoURL)
    if (configToSave.account && (configToSave.account.email || configToSave.account.displayName)) {
      console.log('[Storage] 🔐 Encrypting account data...');
      const accountToEncrypt = {
        email: configToSave.account.email,
        displayName: configToSave.account.displayName,
        photoURL: configToSave.account.photoURL,
      };
      encryptedData._encryptedAccountData = await this.encryptAccountData(accountToEncrypt);

      // Keep tier and other non-sensitive fields, clear sensitive ones
      configToSave.account = {
        ...configToSave.account,
        email: undefined,
        displayName: undefined,
        photoURL: undefined,
        firebaseUid: undefined, // Also encrypt UID
      };
      console.log('[Storage] ✅ Account data encrypted');
    }

    await chrome.storage.local.set({
      [StorageManager.KEYS.CONFIG]: configToSave,
    });
    console.log('[Storage] ✅ Config saved with all sensitive data encrypted');

    // Update cache with the new config instead of invalidating
    // This prevents unnecessary re-decryption in the same context
    this.configCache = config;
    this.configCacheTimestamp = Date.now();
  }

  /**
   * Load configuration
   * Decrypts all sensitive data: API keys, custom rules, activity logs, and account data
   * Uses 1-second cache to prevent excessive decryption calls
   */
  async loadConfig(): Promise<UserConfig | null> {
    // Check cache first
    const now = Date.now();
    if (this.configCache && (now - this.configCacheTimestamp) < this.CACHE_TTL_MS) {
      // Silently return cached config (remove spam)
      return this.configCache;
    }

    // Cache miss - need to decrypt
    console.log('[Storage] 📂 Loading config from storage (cache miss)');
    const data = await chrome.storage.local.get(StorageManager.KEYS.CONFIG);
    const config = data[StorageManager.KEYS.CONFIG] || null;

    if (!config) {
      console.log('[Theme Debug] 📂 No config found in storage');
      return null;
    }

    const configWithEncrypted = config as any;

    // 1. Decrypt API key vault if it exists
    if (configWithEncrypted._encryptedApiKeyVault) {
      try {
        console.log('[Storage] 🔓 Decrypting API key vault...');
        const decryptedVault = await this.decryptAPIKeyVault(configWithEncrypted._encryptedApiKeyVault);
        config.apiKeyVault = decryptedVault;
        console.log('[Storage] ✅ API key vault decrypted');
      } catch (error) {
        // User not authenticated - expected, don't spam console
        if (error instanceof Error && error.message.includes('ENCRYPTION_KEY_UNAVAILABLE')) {
          console.log('[Storage] 🔒 API key vault locked (user not authenticated)');
        } else {
          console.error('[Storage] ❌ Failed to decrypt API key vault:', error);
        }
        // Keep the empty vault if decryption fails
      }
    } else if (config.apiKeyVault && config.apiKeyVault.keys.length > 0) {
      console.warn('[Storage] ⚠️ Found plaintext API keys - will encrypt on next save');
    }

    // 2. Decrypt custom rules if they exist
    if (configWithEncrypted._encryptedCustomRules) {
      try {
        console.log('[Storage] 🔓 Decrypting custom rules...');
        const decryptedRules = await this.decryptCustomRules(configWithEncrypted._encryptedCustomRules);
        config.customRules = decryptedRules;
        console.log('[Storage] ✅ Custom rules decrypted');
      } catch (error) {
        // User not authenticated - expected, don't spam console
        if (error instanceof Error && error.message.includes('ENCRYPTION_KEY_UNAVAILABLE')) {
          console.log('[Storage] 🔒 Custom rules locked (user not authenticated)');
        } else {
          console.error('[Storage] ❌ Failed to decrypt custom rules:', error);
        }
        // Keep the empty rules if decryption fails
      }
    } else if (config.customRules && config.customRules.rules.length > 0) {
      console.warn('[Storage] ⚠️ Found plaintext custom rules - will encrypt on next save');
    }

    // 3. Decrypt activity logs if they exist
    if (configWithEncrypted._encryptedActivityLogs) {
      try {
        console.log('[Storage] 🔓 Decrypting activity logs...');
        const decryptedLogs = await this.decryptActivityLogs(configWithEncrypted._encryptedActivityLogs);
        config.stats.activityLog = decryptedLogs;
        console.log('[Storage] ✅ Activity logs decrypted');
      } catch (error) {
        // User not authenticated - expected, don't spam console
        if (error instanceof Error && error.message.includes('ENCRYPTION_KEY_UNAVAILABLE')) {
          console.log('[Storage] 🔒 Activity logs locked (user not authenticated)');
        } else {
          console.error('[Storage] ❌ Failed to decrypt activity logs:', error);
        }
        // Keep empty logs if decryption fails
      }
    } else if (config.stats && config.stats.activityLog && config.stats.activityLog.length > 0) {
      console.warn('[Storage] ⚠️ Found plaintext activity logs - will encrypt on next save');
    }

    // 4. Decrypt account data if it exists
    if (configWithEncrypted._encryptedAccountData) {
      try {
        console.log('[Storage] 🔓 Decrypting account data...');
        const decryptedAccount = await this.decryptAccountData(configWithEncrypted._encryptedAccountData);
        config.account = {
          ...config.account,
          email: decryptedAccount.email,
          displayName: decryptedAccount.displayName,
          photoURL: decryptedAccount.photoURL,
          firebaseUid: decryptedAccount.firebaseUid,
        };
        console.log('[Storage] ✅ Account data decrypted');
      } catch (error) {
        // User not authenticated - expected, don't spam console
        if (error instanceof Error && error.message.includes('ENCRYPTION_KEY_UNAVAILABLE')) {
          console.log('[Storage] 🔒 Account data locked (user not authenticated)');
        } else {
          console.error('[Storage] ❌ Failed to decrypt account data:', error);
        }
        // Keep empty account data if decryption fails
      }
    } else if (config.account && (config.account.email || config.account.displayName)) {
      console.warn('[Storage] ⚠️ Found plaintext account data - will encrypt on next save');
    }

    console.log('[Theme Debug] 📂 Config retrieved from chrome.storage.local:', {
      hasConfig: !!config,
      theme: config?.settings?.theme || 'none',
      isNull: config === null,
      hasEncryptedKeys: !!configWithEncrypted._encryptedApiKeyVault,
      hasEncryptedRules: !!configWithEncrypted._encryptedCustomRules,
      hasEncryptedLogs: !!configWithEncrypted._encryptedActivityLogs,
      hasEncryptedAccount: !!configWithEncrypted._encryptedAccountData,
      keyCount: config.apiKeyVault?.keys?.length || 0,
      rulesCount: config.customRules?.rules?.length || 0,
      logsCount: config.stats?.activityLog?.length || 0,
      hasAccountEmail: !!config.account?.email
    });

    // 5. Initialize prompt templates if missing (for existing users)
    if (!config.promptTemplates) {
      console.log('[Storage] 🆕 Adding starter prompt templates to existing config');
      config.promptTemplates = {
        templates: this.getStarterTemplates(),
        maxTemplates: 10,
        enableKeyboardShortcuts: true,
      };
      // Save the updated config
      await this.saveConfig(config);
    }

    // Cache the result
    this.configCache = config;
    this.configCacheTimestamp = Date.now();

    return config;
  }

  // ========== API KEY VAULT METHODS ==========

  /**
   * Initialize API Key Vault in config if not present
   */
  private async ensureAPIKeyVaultConfig(config: UserConfig): Promise<void> {
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
    format?: import('./types').APIKeyFormat;
  }): Promise<import('./types').APIKey> {
    const config = await this.loadConfig();
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

    const newKey: import('./types').APIKey = {
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
    await this.saveConfig(config);

    console.log('[StorageManager] Added API key:', newKey.format, newKey.name);
    return newKey;
  }

  /**
   * Remove API key from vault
   */
  async removeAPIKey(keyId: string): Promise<void> {
    const config = await this.loadConfig();
    if (!config || !config.apiKeyVault) {
      return;
    }

    config.apiKeyVault.keys = config.apiKeyVault.keys.filter(k => k.id !== keyId);
    await this.saveConfig(config);
    console.log('[StorageManager] Removed API key:', keyId);
  }

  /**
   * Update API key
   */
  async updateAPIKey(keyId: string, updates: Partial<import('./types').APIKey>): Promise<void> {
    const config = await this.loadConfig();
    if (!config || !config.apiKeyVault) {
      return;
    }

    const index = config.apiKeyVault.keys.findIndex(k => k.id === keyId);
    if (index !== -1) {
      config.apiKeyVault.keys[index] = {
        ...config.apiKeyVault.keys[index],
        ...updates,
      };
      await this.saveConfig(config);
      console.log('[StorageManager] Updated API key:', keyId);
    }
  }

  /**
   * Get API key by ID
   */
  async getAPIKey(keyId: string): Promise<import('./types').APIKey | null> {
    const config = await this.loadConfig();
    if (!config || !config.apiKeyVault) {
      return null;
    }

    return config.apiKeyVault.keys.find(k => k.id === keyId) || null;
  }

  /**
   * Get all API keys (encrypted values preserved)
   */
  async getAllAPIKeys(): Promise<import('./types').APIKey[]> {
    const config = await this.loadConfig();
    if (!config || !config.apiKeyVault) {
      return [];
    }

    return config.apiKeyVault.keys;
  }

  /**
   * Increment protection count for API key
   */
  async incrementAPIKeyProtection(keyId: string): Promise<void> {
    const config = await this.loadConfig();
    if (!config || !config.apiKeyVault) {
      return;
    }

    const key = config.apiKeyVault.keys.find(k => k.id === keyId);
    if (key) {
      key.protectionCount++;
      key.lastUsed = Date.now();
      await this.saveConfig(config);
    }
  }

  /**
   * Update API Key Vault settings
   */
  async updateAPIKeyVaultSettings(settings: Partial<import('./types').APIKeyVaultConfig>): Promise<void> {
    const config = await this.loadConfig();
    if (!config) {
      return;
    }

    await this.ensureAPIKeyVaultConfig(config);
    config.apiKeyVault = {
      ...config.apiKeyVault!,
      ...settings,
    };

    await this.saveConfig(config);
    console.log('[StorageManager] Updated API Key Vault settings');
  }

  /**
   * Detect API key format using simple pattern matching
   */
  private detectKeyFormat(key: string): import('./types').APIKeyFormat {
    if (/^sk-(proj-)?[A-Za-z0-9]{48,}/.test(key)) return 'openai';
    if (/^sk-ant-[A-Za-z0-9-]{95}/.test(key)) return 'anthropic';
    if (/^AIza[A-Za-z0-9_-]{35}/.test(key)) return 'google';
    if (/^(AKIA|ASIA)[A-Z0-9]{16}/.test(key)) return 'aws';
    if (/^gh[ps]_[A-Za-z0-9]{36}/.test(key)) return 'github';
    if (/^(sk|pk)_(live|test)_[A-Za-z0-9]{24,}/.test(key)) return 'stripe';
    return 'generic';
  }

  // ========== CUSTOM REDACTION RULES METHODS ==========

  /**
   * Ensure custom rules config exists
   */
  private async ensureCustomRulesConfig(config: import('./types').UserConfig): Promise<void> {
    if (!config.customRules) {
      config.customRules = {
        enabled: true,
        rules: []
      };
    }
  }

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
  }): Promise<string> {
    const config = await this.loadConfig();
    if (!config) {
      throw new Error('Failed to load config');
    }

    await this.ensureCustomRulesConfig(config);

    // Check PRO tier requirement
    const isFree = config.account?.tier === 'free';
    if (isFree) {
      throw new Error('PRO_FEATURE: Custom redaction rules are a PRO feature. Upgrade to PRO to create custom rules.');
    }

    const ruleId = crypto.randomUUID();
    const newRule: import('./types').CustomRule = {
      id: ruleId,
      name: ruleData.name,
      pattern: ruleData.pattern,
      replacement: ruleData.replacement,
      enabled: true,
      priority: ruleData.priority ?? 50,
      category: ruleData.category,
      description: ruleData.description,
      createdAt: Date.now(),
      matchCount: 0,
      testCases: ruleData.testCases
    };

    config.customRules!.rules.push(newRule);
    await this.saveConfig(config);

    console.log('[StorageManager] Added custom rule:', ruleId);
    return ruleId;
  }

  /**
   * Remove a custom rule
   */
  async removeCustomRule(ruleId: string): Promise<void> {
    const config = await this.loadConfig();
    if (!config?.customRules) {
      return;
    }

    config.customRules.rules = config.customRules.rules.filter(r => r.id !== ruleId);
    await this.saveConfig(config);

    console.log('[StorageManager] Removed custom rule:', ruleId);
  }

  /**
   * Update a custom rule
   */
  async updateCustomRule(ruleId: string, updates: Partial<import('./types').CustomRule>): Promise<void> {
    const config = await this.loadConfig();
    if (!config?.customRules) {
      return;
    }

    const ruleIndex = config.customRules.rules.findIndex(r => r.id === ruleId);
    if (ruleIndex === -1) {
      throw new Error(`Rule not found: ${ruleId}`);
    }

    config.customRules.rules[ruleIndex] = {
      ...config.customRules.rules[ruleIndex],
      ...updates
    };

    await this.saveConfig(config);
    console.log('[StorageManager] Updated custom rule:', ruleId);
  }

  /**
   * Toggle custom rule enabled state
   */
  async toggleCustomRule(ruleId: string): Promise<void> {
    const config = await this.loadConfig();
    if (!config?.customRules) {
      return;
    }

    const rule = config.customRules.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = !rule.enabled;
      await this.saveConfig(config);
      console.log('[StorageManager] Toggled custom rule:', ruleId, 'enabled:', rule.enabled);
    }
  }

  /**
   * Update custom rules match count
   */
  async incrementRuleMatchCount(ruleId: string): Promise<void> {
    const config = await this.loadConfig();
    if (!config?.customRules) {
      return;
    }

    const rule = config.customRules.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.matchCount++;
      rule.lastUsed = Date.now();
      await this.saveConfig(config);
    }
  }

  /**
   * Update custom rules settings
   */
  async updateCustomRulesSettings(settings: Partial<import('./types').CustomRulesConfig>): Promise<void> {
    const config = await this.loadConfig();
    if (!config) {
      return;
    }

    await this.ensureCustomRulesConfig(config);
    config.customRules = {
      ...config.customRules!,
      ...settings
    };

    await this.saveConfig(config);
    console.log('[StorageManager] Updated custom rules settings');
  }

  // ========== PROMPT TEMPLATES MANAGEMENT ==========

  /**
   * Ensure config has prompt templates structure
   */
  private async ensurePromptTemplatesConfig(config: UserConfig): Promise<void> {
    if (!config.promptTemplates) {
      const userTier = config.account?.tier || 'free';
      config.promptTemplates = {
        templates: [],
        maxTemplates: userTier === 'pro' || userTier === 'enterprise' ? -1 : 3, // -1 = unlimited
        enableKeyboardShortcuts: true,
      };
    }
  }

  /**
   * Add a new prompt template
   */
  async addPromptTemplate(templateData: {
    name: string;
    content: string;
    description?: string;
    category?: string;
    tags?: string[];
    profileId?: string;
  }): Promise<import('./types').PromptTemplate> {
    const config = await this.loadConfig();
    if (!config) throw new Error('Config not initialized');

    await this.ensurePromptTemplatesConfig(config);

    // FREE users cannot create custom templates (starter templates are always free)
    const isFree = config.account?.tier === 'free';
    if (isFree) {
      throw new Error('PRO_FEATURE: Creating custom templates requires PRO tier. Upgrade to unlock unlimited templates.');
    }

    const newTemplate: import('./types').PromptTemplate = {
      id: this.generateId(),
      name: templateData.name,
      content: templateData.content,
      description: templateData.description,
      category: templateData.category,
      tags: templateData.tags,
      profileId: templateData.profileId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageCount: 0,
      lastUsed: undefined,
    };

    config.promptTemplates!.templates.push(newTemplate);
    await this.saveConfig(config);
    console.log('[StorageManager] Added prompt template:', newTemplate.name);

    return newTemplate;
  }

  /**
   * Remove a prompt template by ID
   */
  async removePromptTemplate(templateId: string): Promise<void> {
    const config = await this.loadConfig();
    if (!config || !config.promptTemplates) return;

    config.promptTemplates.templates = config.promptTemplates.templates.filter(t => t.id !== templateId);
    await this.saveConfig(config);
    console.log('[StorageManager] Removed prompt template:', templateId);
  }

  /**
   * Update a prompt template
   */
  async updatePromptTemplate(templateId: string, updates: Partial<import('./types').PromptTemplate>): Promise<void> {
    const config = await this.loadConfig();
    if (!config || !config.promptTemplates) return;

    const template = config.promptTemplates.templates.find(t => t.id === templateId);
    if (!template) {
      console.error('[StorageManager] Template not found:', templateId);
      return;
    }

    // FREE users cannot edit starter templates
    const isFree = config.account?.tier === 'free';
    if (isFree && template.isStarter) {
      throw new Error('PRO_FEATURE: Editing templates requires PRO tier. Upgrade to unlock.');
    }

    Object.assign(template, updates, { updatedAt: Date.now() });
    await this.saveConfig(config);
    console.log('[StorageManager] Updated prompt template:', templateId);
  }

  /**
   * Get a single prompt template by ID
   */
  async getPromptTemplate(templateId: string): Promise<import('./types').PromptTemplate | null> {
    const config = await this.loadConfig();
    if (!config || !config.promptTemplates) return null;

    return config.promptTemplates.templates.find(t => t.id === templateId) || null;
  }

  /**
   * Get all prompt templates
   */
  async getAllPromptTemplates(): Promise<import('./types').PromptTemplate[]> {
    const config = await this.loadConfig();
    if (!config || !config.promptTemplates) return [];

    return config.promptTemplates.templates;
  }

  /**
   * Increment template usage counter
   */
  async incrementTemplateUsage(templateId: string): Promise<void> {
    const config = await this.loadConfig();
    if (!config || !config.promptTemplates) return;

    const template = config.promptTemplates.templates.find(t => t.id === templateId);
    if (template) {
      template.usageCount++;
      template.lastUsed = Date.now();
      await this.saveConfig(config);
      console.log('[StorageManager] Incremented template usage:', templateId);
    }
  }

  /**
   * Update prompt templates settings
   */
  async updatePromptTemplatesSettings(settings: Partial<import('./types').PromptTemplatesConfig>): Promise<void> {
    const config = await this.loadConfig();
    if (!config) return;

    await this.ensurePromptTemplatesConfig(config);

    config.promptTemplates = {
      ...config.promptTemplates!,
      ...settings
    };

    await this.saveConfig(config);
    console.log('[StorageManager] Updated prompt templates settings');
  }

  /**
   * Get default configuration (v2)
   */
  private getDefaultConfig(): UserConfig {
    return {
      version: 2,
      account: {
        emailOptIn: false,
        tier: 'pro',
        syncEnabled: false,
      },
      settings: {
        enabled: true,
        defaultMode: 'auto-replace',
        showNotifications: true,
        decodeResponses: false,        // Don't convert aliases back to real names by default
        theme: 'classic-dark',         // Default background theme (dark mode)
        protectedDomains: [
          'chat.openai.com',
          'chatgpt.com',
          'claude.ai',
          'gemini.google.com',
          'perplexity.ai',
          'copilot.microsoft.com',
        ],
        excludedDomains: [],
        strictMode: false,
        debugMode: false,
        cloudSync: false,
      },
      profiles: [],
      stats: {
        totalSubstitutions: 0,
        totalInterceptions: 0,
        totalWarnings: 0,
        successRate: 1.0,
        lastSyncTimestamp: Date.now(),
        byService: {
          chatgpt: { requests: 0, substitutions: 0 },
          claude: { requests: 0, substitutions: 0 },
          gemini: { requests: 0, substitutions: 0 },
          perplexity: { requests: 0, substitutions: 0 },
          copilot: { requests: 0, substitutions: 0 },
        },
        activityLog: [],
      },
      promptTemplates: {
        templates: this.getStarterTemplates(),
        maxTemplates: 10, // Free tier limit
        enableKeyboardShortcuts: true,
      },
    };
  }

  /**
   * Get starter templates to help users understand the feature
   */
  private getStarterTemplates(): PromptTemplate[] {
    const now = Date.now();

    return [
      {
        id: `starter-professional-email`,
        isStarter: true,
        readonly: false, // Will be set dynamically based on tier
        name: 'Professional Email',
        description: 'Generate a professional email using your protected identity',
        content: `Write a professional email with the following details:

From: {{name}} ({{email}})
Company: {{company}}
Subject: [Your subject here]

Please draft a polite, professional email that:
- Introduces myself and my company
- Clearly states the purpose
- Includes a call to action
- Ends with appropriate closing

Tone: Professional and friendly`,
        category: 'Email',
        usageCount: 0,
        createdAt: now,
        updatedAt: now,
        lastUsed: undefined,
      },
      {
        id: `starter-code-review`,
        isStarter: true,
        readonly: false, // Will be set dynamically based on tier
        name: 'Code Review Request',
        description: 'Request AI to review code as your developer persona',
        content: `I'm {{name}}, a developer at {{company}}. Please review the following code:

[Paste your code here]

Specifically, please check for:
- Security vulnerabilities
- Performance issues
- Code style and best practices
- Potential bugs or edge cases

Provide feedback as if you're conducting a professional code review.`,
        category: 'Code Review',
        usageCount: 0,
        createdAt: now,
        updatedAt: now,
        lastUsed: undefined,
      },
      {
        id: `starter-meeting-summary`,
        isStarter: true,
        readonly: false, // Will be set dynamically based on tier
        name: 'Meeting Summary',
        description: 'Create meeting notes using your work identity',
        content: `Create professional meeting notes for:

Attendee: {{name}} ({{email}})
Company: {{company}}
Date: [Today's date]
Topic: [Meeting topic]

Please help me structure meeting notes that include:
- Key discussion points
- Action items and owners
- Decisions made
- Next steps and timeline

Keep it concise and professional, suitable for sharing with stakeholders.`,
        category: 'Writing',
        usageCount: 0,
        createdAt: now,
        updatedAt: now,
        lastUsed: undefined,
      },
    ];
  }

  // ========== MIGRATION ==========

  /**
   * Check if v1 data exists and migrate to v2 if needed
   */
  async migrateV1ToV2IfNeeded(): Promise<void> {
    const dataVersion = await chrome.storage.local.get(StorageManager.KEYS.VERSION);

    // Already on v2 or higher
    if (dataVersion[StorageManager.KEYS.VERSION] >= 2) {
      console.log('[StorageManager] Already on v2');
      return;
    }

    // Check if v1 aliases exist
    const v1Aliases = await this.loadAliases();
    if (!v1Aliases || v1Aliases.length === 0) {
      console.log('[StorageManager] No v1 data to migrate');
      await chrome.storage.local.set({ [StorageManager.KEYS.VERSION]: 2 });
      return;
    }

    console.log('[StorageManager] Migrating v1 aliases to v2 profiles...');

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
        id: this.generateId(),
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
    await this.saveProfiles(newProfiles);

    // Update config to v2
    const oldConfig = await this.loadConfig() as UserConfigV1 | null;
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

      await this.saveConfig(newConfig);
    }

    // Mark as v2
    await chrome.storage.local.set({ [StorageManager.KEYS.VERSION]: 2 });

    console.log(`[StorageManager] Migration complete! Created ${newProfiles.length} profiles from ${v1Aliases.length} aliases`);
  }

  /**
   * Migrate all plaintext sensitive data to encrypted storage
   * This runs automatically on initialization and handles:
   * - API keys
   * - Custom rules
   * - Activity logs
   * - Account data
   */
  private async migrateAPIKeysToEncryptedIfNeeded(): Promise<void> {
    const data = await chrome.storage.local.get(StorageManager.KEYS.CONFIG);
    const config = data[StorageManager.KEYS.CONFIG];

    if (!config) {
      return; // No config to migrate
    }

    const configWithEncrypted = config as any;
    let needsSave = false;

    // 1. Migrate API keys
    const hasPlaintextKeys = config.apiKeyVault && config.apiKeyVault.keys.length > 0;
    const hasEncryptedVault = !!configWithEncrypted._encryptedApiKeyVault;

    if (hasPlaintextKeys && !hasEncryptedVault) {
      console.log('[StorageManager] 🔐 Migrating plaintext API keys to encrypted storage...');
      console.log(`[StorageManager] Found ${config.apiKeyVault.keys.length} plaintext API keys`);

      try {
        const encryptedVault = await this.encryptAPIKeyVault(config.apiKeyVault);
        configWithEncrypted._encryptedApiKeyVault = encryptedVault;
        config.apiKeyVault = {
          ...config.apiKeyVault,
          keys: [], // Clear plaintext keys
        };
        needsSave = true;
        console.log('[StorageManager] ✅ API key migration complete - keys are now encrypted');
      } catch (error) {
        console.error('[StorageManager] ❌ Failed to migrate API keys:', error);
      }
    }

    // 2. Migrate custom rules
    const hasPlaintextRules = config.customRules && config.customRules.rules.length > 0;
    const hasEncryptedRules = !!configWithEncrypted._encryptedCustomRules;

    if (hasPlaintextRules && !hasEncryptedRules) {
      console.log('[StorageManager] 🔐 Migrating plaintext custom rules to encrypted storage...');
      console.log(`[StorageManager] Found ${config.customRules.rules.length} plaintext custom rules`);

      try {
        const encryptedRules = await this.encryptCustomRules(config.customRules);
        configWithEncrypted._encryptedCustomRules = encryptedRules;
        config.customRules = {
          ...config.customRules,
          rules: [], // Clear plaintext rules
        };
        needsSave = true;
        console.log('[StorageManager] ✅ Custom rules migration complete - rules are now encrypted');
      } catch (error) {
        console.error('[StorageManager] ❌ Failed to migrate custom rules:', error);
      }
    }

    // 3. Migrate activity logs
    const hasPlaintextLogs = config.stats && config.stats.activityLog && config.stats.activityLog.length > 0;
    const hasEncryptedLogs = !!configWithEncrypted._encryptedActivityLogs;

    if (hasPlaintextLogs && !hasEncryptedLogs) {
      console.log('[StorageManager] 🔐 Migrating plaintext activity logs to encrypted storage...');
      console.log(`[StorageManager] Found ${config.stats!.activityLog!.length} plaintext activity log entries`);

      try {
        const encryptedLogs = await this.encryptActivityLogs(config.stats.activityLog);
        configWithEncrypted._encryptedActivityLogs = encryptedLogs;
        config.stats = {
          ...config.stats,
          activityLog: [], // Clear plaintext logs
        };
        needsSave = true;
        console.log('[StorageManager] ✅ Activity logs migration complete - logs are now encrypted');
      } catch (error) {
        console.error('[StorageManager] ❌ Failed to migrate activity logs:', error);
      }
    }

    // 4. Migrate account data
    const hasPlaintextAccount = config.account && (config.account.email || config.account.displayName);
    const hasEncryptedAccount = !!configWithEncrypted._encryptedAccountData;

    if (hasPlaintextAccount && !hasEncryptedAccount) {
      console.log('[StorageManager] 🔐 Migrating plaintext account data to encrypted storage...');
      console.log('[StorageManager] Found plaintext account data (email, displayName, etc.)');

      try {
        const accountToEncrypt = {
          email: config.account.email,
          displayName: config.account.displayName,
          photoURL: config.account.photoURL,
          firebaseUid: config.account.firebaseUid,
        };
        const encryptedAccount = await this.encryptAccountData(accountToEncrypt);
        configWithEncrypted._encryptedAccountData = encryptedAccount;
        config.account = {
          ...config.account,
          email: undefined,
          displayName: undefined,
          photoURL: undefined,
          firebaseUid: undefined,
        };
        needsSave = true;
        console.log('[StorageManager] ✅ Account data migration complete - account data is now encrypted');
      } catch (error) {
        console.error('[StorageManager] ❌ Failed to migrate account data:', error);
      }
    }

    // Save updated config if any migrations occurred
    if (needsSave) {
      await chrome.storage.local.set({
        [StorageManager.KEYS.CONFIG]: config,
      });
      console.log('[StorageManager] 🎉 All sensitive data migration complete - all data is now encrypted');
    }
  }

  // ========== STORAGE QUOTA MONITORING ==========

  /**
   * Get current storage usage and quota
   * Chrome provides 10MB (QUOTA_BYTES) for local storage
   */
  async getStorageUsage(): Promise<{
    bytesInUse: number;
    quota: number;
    percentUsed: number;
    formattedUsage: string;
    formattedQuota: string;
  }> {
    const bytesInUse = await chrome.storage.local.getBytesInUse();
    const quota = chrome.storage.local.QUOTA_BYTES || 10485760; // 10MB default

    const percentUsed = (bytesInUse / quota) * 100;

    return {
      bytesInUse,
      quota,
      percentUsed,
      formattedUsage: this.formatBytes(bytesInUse),
      formattedQuota: this.formatBytes(quota),
    };
  }


  // ========== ENCRYPTION ==========

  /**
   * Simple encryption using Web Crypto API
   */
  async encrypt(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    const key = await this.getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      dataBuffer
    );

    // Combine IV + encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return this.arrayBufferToBase64(combined);
  }

  /**
   * Decrypt data
   */
  async decrypt(encryptedData: string): Promise<string> {
    const combined = this.base64ToArrayBuffer(encryptedData);
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const key = await this.getEncryptionKey();
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  }

  /**
   * Get encryption key using Firebase UID as key material
   * SECURITY: Key material is NOT stored locally - derived from Firebase auth session
   * This provides true key separation: encrypted data in chrome.storage, key material in Firebase
   */
  private async getEncryptionKey(): Promise<CryptoKey> {
    const encoder = new TextEncoder();

    // Get Firebase UID as key material (throws if not authenticated)
    const keyMaterial = await this.getFirebaseKeyMaterial();

    // Import Firebase UID as PBKDF2 key
    const importedKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(keyMaterial),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // Get or generate unique salt (salt can be public - stored in chrome.storage is OK)
    const salt = await this.getOrGenerateSalt();

    // Derive AES-256-GCM key with 210k iterations
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode(salt),
        iterations: 210000, // OWASP 2023 recommendation
        hash: 'SHA-256',
      },
      importedKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Get Firebase UID as encryption key material
   * SECURITY: Never stored locally - only available when user is authenticated
   * @throws Error if user is not authenticated
   */
  private async getFirebaseKeyMaterial(): Promise<string> {
    try {
      const { auth } = await import('./firebase');

      // Check if user is authenticated
      if (!auth.currentUser) {
        throw new Error(
          'ENCRYPTION_KEY_UNAVAILABLE: Please sign in to access encrypted data. ' +
          'Your data is locked and requires authentication.'
        );
      }

      const uid = auth.currentUser.uid;

      if (!uid || uid.trim() === '') {
        throw new Error('ENCRYPTION_KEY_INVALID: Firebase UID is missing or empty.');
      }

      console.log('[StorageManager] Using Firebase UID for encryption key derivation');
      return uid;

    } catch (error) {
      if (error instanceof Error && error.message.includes('ENCRYPTION_KEY')) {
        throw error; // Re-throw our custom errors (don't log, already descriptive)
      }
      // Unexpected error during Firebase import/access
      console.error('[StorageManager] Unexpected error accessing Firebase auth:', error);
      throw new Error('ENCRYPTION_KEY_UNAVAILABLE: Authentication required to access encrypted data.');
    }
  }

  /**
   * Get legacy encryption key (uses random key material from chrome.storage)
   * DEPRECATED: Only used for migration from old encryption method
   * Will be removed in v2.0
   */
  private async getLegacyEncryptionKey(): Promise<CryptoKey> {
    const encoder = new TextEncoder();

    // Get old random key material
    const keyMaterial = await this.getOrGenerateKeyMaterial();

    const importedKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(keyMaterial),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const salt = await this.getOrGenerateSalt();

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode(salt),
        iterations: 210000,
        hash: 'SHA-256',
      },
      importedKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Decrypt data with a specific key (used for migration)
   */
  private async decryptWithKey(encryptedData: string, key: CryptoKey): Promise<string> {
    const combined = this.base64ToArrayBuffer(encryptedData);
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  }

  /**
   * Encrypt API key vault
   * Encrypts the entire apiKeyVault object including all key values
   */
  private async encryptAPIKeyVault(vault: any): Promise<string> {
    try {
      const json = JSON.stringify(vault);
      return await this.encrypt(json);
    } catch (error) {
      console.error('[StorageManager] Failed to encrypt API key vault:', error);
      throw error;
    }
  }

  /**
   * Decrypt API key vault
   * Decrypts the encrypted vault string back to the original object
   */
  private async decryptAPIKeyVault(encryptedVault: string): Promise<any> {
    try {
      const json = await this.decrypt(encryptedVault);
      return JSON.parse(json);
    } catch (error) {
      // Don't log ENCRYPTION_KEY_UNAVAILABLE as error (expected when not authenticated)
      if (!(error instanceof Error && error.message.includes('ENCRYPTION_KEY_UNAVAILABLE'))) {
        console.error('[StorageManager] Failed to decrypt API key vault:', error);
      }
      throw error;
    }
  }

  /**
   * Encrypt custom rules
   * Encrypts the custom rules array including patterns and replacements
   */
  private async encryptCustomRules(rules: any): Promise<string> {
    try {
      const json = JSON.stringify(rules);
      return await this.encrypt(json);
    } catch (error) {
      console.error('[StorageManager] Failed to encrypt custom rules:', error);
      throw error;
    }
  }

  /**
   * Decrypt custom rules
   */
  private async decryptCustomRules(encryptedRules: string): Promise<any> {
    try {
      const json = await this.decrypt(encryptedRules);
      return JSON.parse(json);
    } catch (error) {
      // Don't log ENCRYPTION_KEY_UNAVAILABLE as error (expected when not authenticated)
      if (!(error instanceof Error && error.message.includes('ENCRYPTION_KEY_UNAVAILABLE'))) {
        console.error('[StorageManager] Failed to decrypt custom rules:', error);
      }
      throw error;
    }
  }

  /**
   * Encrypt activity logs
   * Encrypts activity log array to protect usage history
   */
  private async encryptActivityLogs(logs: any): Promise<string> {
    try {
      const json = JSON.stringify(logs);
      return await this.encrypt(json);
    } catch (error) {
      console.error('[StorageManager] Failed to encrypt activity logs:', error);
      throw error;
    }
  }

  /**
   * Decrypt activity logs
   */
  private async decryptActivityLogs(encryptedLogs: string): Promise<any> {
    try {
      const json = await this.decrypt(encryptedLogs);
      return JSON.parse(json);
    } catch (error) {
      // Don't log ENCRYPTION_KEY_UNAVAILABLE as error (expected when not authenticated)
      if (!(error instanceof Error && error.message.includes('ENCRYPTION_KEY_UNAVAILABLE'))) {
        console.error('[StorageManager] Failed to decrypt activity logs:', error);
      }
      throw error;
    }
  }

  /**
   * Encrypt account data
   * Encrypts email, displayName, photoURL
   */
  private async encryptAccountData(account: any): Promise<string> {
    try {
      const json = JSON.stringify(account);
      return await this.encrypt(json);
    } catch (error) {
      console.error('[StorageManager] Failed to encrypt account data:', error);
      throw error;
    }
  }

  /**
   * Decrypt account data
   */
  private async decryptAccountData(encryptedAccount: string): Promise<any> {
    try {
      const json = await this.decrypt(encryptedAccount);
      return JSON.parse(json);
    } catch (error) {
      // Don't log ENCRYPTION_KEY_UNAVAILABLE as error (expected when not authenticated)
      if (!(error instanceof Error && error.message.includes('ENCRYPTION_KEY_UNAVAILABLE'))) {
        console.error('[StorageManager] Failed to decrypt account data:', error);
      }
      throw error;
    }
  }

  /**
   * Get or generate random key material unique to this user
   * Stored in chrome.storage (not encrypted, as it's used for encryption)
   */
  private async getOrGenerateKeyMaterial(): Promise<string> {
    const STORAGE_KEY = '_encryptionKeyMaterial';

    // Try to load existing key material
    const data = await chrome.storage.local.get(STORAGE_KEY);

    if (data[STORAGE_KEY]) {
      return data[STORAGE_KEY];
    }

    // Generate new random key material (256 bits = 32 bytes)
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    const keyMaterial = this.arrayBufferToBase64(randomBytes);

    // Store for future use
    await chrome.storage.local.set({ [STORAGE_KEY]: keyMaterial });

    console.log('[StorageManager] Generated new encryption key material');
    return keyMaterial;
  }

  /**
   * Get or generate random salt unique to this user
   */
  private async getOrGenerateSalt(): Promise<string> {
    const STORAGE_KEY = '_encryptionSalt';

    // Try to load existing salt
    const data = await chrome.storage.local.get(STORAGE_KEY);

    if (data[STORAGE_KEY]) {
      return data[STORAGE_KEY];
    }

    // Generate new random salt (128 bits = 16 bytes)
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    const salt = this.arrayBufferToBase64(randomBytes);

    // Store for future use
    await chrome.storage.local.set({ [STORAGE_KEY]: salt });

    console.log('[StorageManager] Generated new encryption salt');
    return salt;
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < buffer.byteLength; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    const buffer = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      buffer[i] = binary.charCodeAt(i);
    }
    return buffer;
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Generate unique ID for aliases
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear internal cache (for testing purposes)
   * @internal
   */
  clearCache(): void {
    this.configCache = null;
    this.configCacheTimestamp = 0;
  }
}
