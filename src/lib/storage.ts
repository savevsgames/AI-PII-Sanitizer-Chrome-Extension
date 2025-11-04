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
  IdentityData
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

  private constructor() {}

  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  /**
   * Initialize storage with default values
   * Handles v1 to v2 migration if needed
   */
  async initialize(): Promise<void> {
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
   * Load and decrypt aliases
   */
  async loadAliases(): Promise<AliasEntry[]> {
    const data = await chrome.storage.local.get(StorageManager.KEYS.ALIASES);
    if (!data[StorageManager.KEYS.ALIASES]) {
      return [];
    }

    try {
      const decrypted = await this.decrypt(data[StorageManager.KEYS.ALIASES]);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Failed to decrypt aliases:', error);
      return [];
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
   */
  async loadProfiles(): Promise<AliasProfile[]> {
    const data = await chrome.storage.local.get(StorageManager.KEYS.PROFILES);
    if (!data[StorageManager.KEYS.PROFILES]) {
      return [];
    }

    try {
      const decrypted = await this.decrypt(data[StorageManager.KEYS.PROFILES]);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('[StorageManager] Failed to decrypt profiles:', error);
      return [];
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

    // Generate variations for both real and alias identities
    const realVariations = generateIdentityVariations(profileData.real);
    const aliasVariations = generateIdentityVariations(profileData.alias);

    const newProfile: AliasProfile = {
      id: this.generateId(),
      profileName: profileData.profileName,
      description: profileData.description,
      enabled: profileData.enabled ?? true,
      real: profileData.real,
      alias: profileData.alias,
      variations: {
        real: realVariations,
        alias: aliasVariations,
      },
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
        enableVariations: true, // Enable by default
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

      // Regenerate variations if real or alias identity changed
      if (updates.real || updates.alias) {
        const realVariations = generateIdentityVariations(updatedProfile.real);
        const aliasVariations = generateIdentityVariations(updatedProfile.alias);
        updatedProfile.variations = {
          real: realVariations,
          alias: aliasVariations,
        };
        console.log('[StorageManager] Regenerated variations for profile:', updatedProfile.profileName);
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
    if (configToSave.stats && configToSave.stats.activityLog.length > 0) {
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
  }

  /**
   * Load configuration
   * Decrypts all sensitive data: API keys, custom rules, activity logs, and account data
   */
  async loadConfig(): Promise<UserConfig | null> {
    console.log('[Theme Debug] 📂 StorageManager.loadConfig called...');
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
        console.error('[Storage] ❌ Failed to decrypt API key vault:', error);
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
        console.error('[Storage] ❌ Failed to decrypt custom rules:', error);
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
        console.error('[Storage] ❌ Failed to decrypt activity logs:', error);
        // Keep empty logs if decryption fails
      }
    } else if (config.stats && config.stats.activityLog.length > 0) {
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
        console.error('[Storage] ❌ Failed to decrypt account data:', error);
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
    };
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
    const hasPlaintextLogs = config.stats && config.stats.activityLog.length > 0;
    const hasEncryptedLogs = !!configWithEncrypted._encryptedActivityLogs;

    if (hasPlaintextLogs && !hasEncryptedLogs) {
      console.log('[StorageManager] 🔐 Migrating plaintext activity logs to encrypted storage...');
      console.log(`[StorageManager] Found ${config.stats.activityLog.length} plaintext activity log entries`);

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

  // ========== ENCRYPTION ==========

  /**
   * Simple encryption using Web Crypto API
   */
  private async encrypt(data: string): Promise<string> {
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
  private async decrypt(encryptedData: string): Promise<string> {
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
   * Get or generate encryption key
   * Uses randomly generated per-user key material stored in chrome.storage
   * This is more secure than using chrome.runtime.id (which is public/predictable)
   */
  private async getEncryptionKey(): Promise<CryptoKey> {
    const encoder = new TextEncoder();

    // Get or generate unique key material for this user
    const keyMaterial = await this.getOrGenerateKeyMaterial();

    // Import raw key material
    const importedKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(keyMaterial),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // Get or generate unique salt for this user
    const salt = await this.getOrGenerateSalt();

    // Derive AES key with strong parameters
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode(salt),
        iterations: 210000, // Increased from 100k (OWASP 2023 recommendation)
        hash: 'SHA-256',
      },
      importedKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
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
      console.error('[StorageManager] Failed to decrypt API key vault:', error);
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
      console.error('[StorageManager] Failed to decrypt custom rules:', error);
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
      console.error('[StorageManager] Failed to decrypt activity logs:', error);
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
      console.error('[StorageManager] Failed to decrypt account data:', error);
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
   * Generate unique ID for aliases
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
