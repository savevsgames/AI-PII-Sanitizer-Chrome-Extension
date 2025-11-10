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

export class StorageConfigManager {
  private encryptionManager: StorageEncryptionManager;

  // Cache to prevent excessive decryption
  // Longer cache since each context (popup, background) has its own instance
  private configCache: UserConfig | null = null;
  private configCacheTimestamp: number = 0;
  private readonly CACHE_TTL_MS = 5000; // 5 second cache (longer due to cross-context issues)

  private static readonly CONFIG_KEY = 'config';

  constructor(encryptionManager: StorageEncryptionManager) {
    this.encryptionManager = encryptionManager;

    // Listen for storage changes from OTHER contexts to invalidate cache
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes[StorageConfigManager.CONFIG_KEY]) {
        console.log('[StorageConfigManager] 🔄 Config changed in another context, invalidating cache');
        this.configCache = null;
        this.configCacheTimestamp = 0;
      }
    });
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
    console.log('[StorageConfigManager] 💾 Saving config with encryption...');

    // Clone config to avoid mutating the original
    const configToSave = { ...config };
    const encryptedData = configToSave as any;

    // 1. Encrypt API key vault if it exists and has keys
    if (configToSave.apiKeyVault && configToSave.apiKeyVault.keys.length > 0) {
      console.log('[StorageConfigManager] 🔐 Encrypting API key vault...');
      encryptedData._encryptedApiKeyVault = await this.encryptionManager.encryptAPIKeyVault(configToSave.apiKeyVault);
      configToSave.apiKeyVault = { ...configToSave.apiKeyVault, keys: [] };
      console.log('[StorageConfigManager] ✅ API key vault encrypted');
    }

    // 2. Encrypt custom rules if they exist
    if (configToSave.customRules && configToSave.customRules.rules.length > 0) {
      console.log('[StorageConfigManager] 🔐 Encrypting custom rules...');
      encryptedData._encryptedCustomRules = await this.encryptionManager.encryptCustomRules(configToSave.customRules);
      configToSave.customRules = { ...configToSave.customRules, rules: [] };
      console.log('[StorageConfigManager] ✅ Custom rules encrypted');
    }

    // 3. Encrypt activity logs if they exist
    if (configToSave.stats && configToSave.stats.activityLog && configToSave.stats.activityLog.length > 0) {
      console.log('[StorageConfigManager] 🔐 Encrypting activity logs...');
      encryptedData._encryptedActivityLogs = await this.encryptionManager.encryptActivityLogs(configToSave.stats.activityLog);
      configToSave.stats = { ...configToSave.stats, activityLog: [] };
      console.log('[StorageConfigManager] ✅ Activity logs encrypted');
    }

    // 4. Encrypt account data (email, displayName, photoURL)
    if (configToSave.account && (configToSave.account.email || configToSave.account.displayName)) {
      console.log('[StorageConfigManager] 🔐 Encrypting account data...');
      const accountToEncrypt = {
        email: configToSave.account.email,
        displayName: configToSave.account.displayName,
        photoURL: configToSave.account.photoURL,
      };
      encryptedData._encryptedAccountData = await this.encryptionManager.encryptAccountData(accountToEncrypt);

      // Keep tier and other non-sensitive fields, clear sensitive ones
      configToSave.account = {
        ...configToSave.account,
        email: undefined,
        displayName: undefined,
        photoURL: undefined,
        firebaseUid: undefined, // Also encrypt UID
      };
      console.log('[StorageConfigManager] ✅ Account data encrypted');
    }

    await chrome.storage.local.set({
      [StorageConfigManager.CONFIG_KEY]: configToSave,
    });
    console.log('[StorageConfigManager] ✅ Config saved with all sensitive data encrypted');

    // Update cache with the new config instead of invalidating
    // This prevents unnecessary re-decryption in the same context
    this.configCache = config;
    this.configCacheTimestamp = Date.now();
  }

  /**
   * Load configuration
   * Decrypts all sensitive data: API keys, custom rules, activity logs, and account data
   * Uses 5-second cache to prevent excessive decryption calls
   */
  async loadConfig(): Promise<UserConfig | null> {
    // Check cache first
    const now = Date.now();
    if (this.configCache && (now - this.configCacheTimestamp) < this.CACHE_TTL_MS) {
      // Silently return cached config (remove spam)
      return this.configCache;
    }

    // Cache miss - need to decrypt
    console.log('[StorageConfigManager] 📂 Loading config from storage (cache miss)');
    const data = await chrome.storage.local.get(StorageConfigManager.CONFIG_KEY);
    const config = data[StorageConfigManager.CONFIG_KEY] || null;

    if (!config) {
      console.log('[Theme Debug] 📂 No config found in storage');
      return null;
    }

    const configWithEncrypted = config as any;

    // 1. Decrypt API key vault if it exists
    if (configWithEncrypted._encryptedApiKeyVault) {
      try {
        // Removed verbose logging for production
        const decryptedVault = await this.encryptionManager.decryptAPIKeyVault(configWithEncrypted._encryptedApiKeyVault);
        config.apiKeyVault = decryptedVault;
        console.log('[StorageConfigManager] ✅ API key vault decrypted');
      } catch (error) {
        // User not authenticated - expected, don't spam console
        if (error instanceof Error && error.message.includes('ENCRYPTION_KEY_UNAVAILABLE')) {
          // Locked state is expected in service worker
        } else {
          console.error('[StorageConfigManager] ❌ Failed to decrypt API key vault:', error);
        }
        // Keep the empty vault if decryption fails
      }
    } else if (config.apiKeyVault && config.apiKeyVault.keys.length > 0) {
      console.warn('[StorageConfigManager] ⚠️ Found plaintext API keys - will encrypt on next save');
    }

    // 2. Decrypt custom rules if they exist
    if (configWithEncrypted._encryptedCustomRules) {
      try {
        // Removed verbose logging for production
        const decryptedRules = await this.encryptionManager.decryptCustomRules(configWithEncrypted._encryptedCustomRules);
        config.customRules = decryptedRules;
        console.log('[StorageConfigManager] ✅ Custom rules decrypted');
      } catch (error) {
        // User not authenticated - expected, don't spam console
        if (error instanceof Error && error.message.includes('ENCRYPTION_KEY_UNAVAILABLE')) {
          // Locked state is expected in service worker
        } else {
          console.error('[StorageConfigManager] ❌ Failed to decrypt custom rules:', error);
        }
        // Keep the empty rules if decryption fails
      }
    } else if (config.customRules && config.customRules.rules.length > 0) {
      console.warn('[StorageConfigManager] ⚠️ Found plaintext custom rules - will encrypt on next save');
    }

    // 3. Decrypt activity logs if they exist
    if (configWithEncrypted._encryptedActivityLogs) {
      try {
        // Removed verbose logging for production
        const decryptedLogs = await this.encryptionManager.decryptActivityLogs(configWithEncrypted._encryptedActivityLogs);
        config.stats.activityLog = decryptedLogs;
        console.log('[StorageConfigManager] ✅ Activity logs decrypted');
      } catch (error) {
        // User not authenticated - expected, don't spam console
        if (error instanceof Error && error.message.includes('ENCRYPTION_KEY_UNAVAILABLE')) {
          // Locked state is expected in service worker
        } else {
          console.error('[StorageConfigManager] ❌ Failed to decrypt activity logs:', error);
        }
        // Keep empty logs if decryption fails
      }
    } else if (config.stats && config.stats.activityLog && config.stats.activityLog.length > 0) {
      console.warn('[StorageConfigManager] ⚠️ Found plaintext activity logs - will encrypt on next save');
    }

    // 4. Decrypt account data if it exists
    if (configWithEncrypted._encryptedAccountData) {
      try {
        // Removed verbose logging for production
        const decryptedAccount = await this.encryptionManager.decryptAccountData(configWithEncrypted._encryptedAccountData);
        config.account = {
          ...config.account,
          email: decryptedAccount.email,
          displayName: decryptedAccount.displayName,
          photoURL: decryptedAccount.photoURL,
          firebaseUid: decryptedAccount.firebaseUid,
        };
        console.log('[StorageConfigManager] ✅ Account data decrypted');
      } catch (error) {
        // User not authenticated - expected, don't spam console
        if (error instanceof Error && error.message.includes('ENCRYPTION_KEY_UNAVAILABLE')) {
          // Locked state is expected in service worker
        } else {
          console.error('[StorageConfigManager] ❌ Failed to decrypt account data:', error);
        }
        // Keep empty account data if decryption fails
      }
    } else if (config.account && (config.account.email || config.account.displayName)) {
      console.warn('[StorageConfigManager] ⚠️ Found plaintext account data - will encrypt on next save');
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
      console.log('[StorageConfigManager] 🆕 Adding starter prompt templates to existing config');
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

  /**
   * Get default configuration (v2)
   */
  getDefaultConfig(): UserConfig {
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
  getStarterTemplates(): PromptTemplate[] {
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

  /**
   * Clear internal cache (for testing purposes)
   * @internal
   */
  clearCache(): void {
    this.configCache = null;
    this.configCacheTimestamp = 0;
  }
}
