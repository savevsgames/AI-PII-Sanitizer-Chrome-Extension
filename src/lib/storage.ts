/**
 * Storage Manager for persisting aliases and configuration
 * Uses Chrome Storage API with encryption for sensitive data
 * Version 2.0 - Profile-based architecture with backward compatibility
 * Version 2.1 - Added alias variations support
 * Version 3.0 - Refactored to modular architecture with sub-managers
 */

import {
  AliasEntry,
  AliasProfile,
  UserConfig,
  IdentityData,
  PromptTemplate,
  DocumentAlias,
  APIKey,
  APIKeyVaultConfig,
  CustomRulesConfig,
  PromptTemplatesConfig,
} from './types';

// Import all sub-managers
import { StorageEncryptionManager } from './storage/StorageEncryptionManager';
import { StorageConfigManager } from './storage/StorageConfigManager';
import { StorageProfileManager } from './storage/StorageProfileManager';
import { StorageAPIKeyVaultManager } from './storage/StorageAPIKeyVaultManager';
import { StorageCustomRulesManager } from './storage/StorageCustomRulesManager';
import { StoragePromptTemplatesManager } from './storage/StoragePromptTemplatesManager';
import { StorageDocumentAliasManager } from './storage/StorageDocumentAliasManager';
import { StorageMigrationManager } from './storage/StorageMigrationManager';
import { generateId, getStorageQuota } from './storage/storage-utils';

export class StorageManager {
  private static instance: StorageManager;
  private static readonly KEYS = {
    ALIASES: 'aliases',        // v1 legacy
    PROFILES: 'profiles',       // v2 new
    CONFIG: 'config',
    STATS: 'stats',
    VERSION: 'dataVersion',     // Track migration state
  };

  // Sub-managers
  private encryptionManager: StorageEncryptionManager;
  private configManager: StorageConfigManager;
  private profileManager: StorageProfileManager;
  private apiKeyVaultManager: StorageAPIKeyVaultManager;
  private customRulesManager: StorageCustomRulesManager;
  private promptTemplatesManager: StoragePromptTemplatesManager;
  private documentAliasManager: StorageDocumentAliasManager;
  private migrationManager: StorageMigrationManager;

  private constructor() {
    // Instantiate sub-managers in correct dependency order

    // 1. Encryption manager (no dependencies)
    this.encryptionManager = new StorageEncryptionManager();

    // 2. Config manager (depends on encryption)
    this.configManager = new StorageConfigManager(this.encryptionManager);

    // 3. Profile manager (depends on encryption and config)
    this.profileManager = new StorageProfileManager(
      this.encryptionManager,
      this.configManager
    );

    // 4. Feature managers (depend on config)
    this.apiKeyVaultManager = new StorageAPIKeyVaultManager(
      this.configManager
    );

    this.customRulesManager = new StorageCustomRulesManager(
      this.configManager
    );

    this.promptTemplatesManager = new StoragePromptTemplatesManager(
      this.configManager
    );

    this.documentAliasManager = new StorageDocumentAliasManager(
      this.encryptionManager
    );

    // 5. Migration manager (depends on encryption, config, and profile managers)
    this.migrationManager = new StorageMigrationManager(
      this.encryptionManager,
      this.configManager,
      this.profileManager
    );

    // Setup listeners
    this.setupStorageChangeListener();
    this.setupAuthListener();
  }

  /**
   * Setup Firebase auth state listener to invalidate cache when user signs in/out
   * This ensures fresh data loading when authentication state changes
   * NOTE: Only works in popup/content contexts, not in service worker (no DOM)
   */
  private setupAuthListener() {
    // Check if we're in a service worker context (no document object)
    if (typeof document === 'undefined') {
      console.log('[StorageManager] Running in service worker context - skipping auth listener setup');
      return;
    }

    // Dynamically import Firebase to avoid circular dependencies
    // Use webpack magic comments to enable conditional imports
    import(
      /* webpackMode: "eager" */
      /* webpackChunkName: "firebase-context" */
      './firebase'
    ).then(({ auth }) => {
      auth.onAuthStateChanged((user: any) => {
        console.log('[StorageManager] 🔐 Auth state changed:', user ? 'Signed in' : 'Signed out');
        console.log('[StorageManager] 🔄 Invalidating cache due to auth state change');
        this.configManager.clearCache();
      });
    }).catch(error => {
      console.error('[StorageManager] Failed to setup auth listener:', error);
    });
  }

  /**
   * Setup storage change listener for cross-context synchronization
   */
  private setupStorageChangeListener() {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes[StorageManager.KEYS.CONFIG]) {
        console.log('[StorageManager] 🔄 Config changed in another context');
      }
    });
  }

  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  // ========== AUTH INJECTION (for testing) ==========

  /**
   * Set custom Firebase Auth instance (for testing with separate Firebase instances)
   * This allows integration tests to use a separate test auth instance while
   * production code uses the default instance
   * @param auth - Firebase Auth instance to use for encryption key derivation
   */
  public setCustomAuth(auth: any): void {
    this.encryptionManager.setCustomAuth(auth);
    console.log('[StorageManager] Custom auth instance configured for testing');
  }

  /**
   * Clear custom auth instance (restore default behavior)
   */
  public clearCustomAuth(): void {
    this.encryptionManager.clearCustomAuth();
    console.log('[StorageManager] Cleared custom auth instance');
  }

  // ========== INITIALIZATION & MIGRATION ==========

  /**
   * Initialize storage with default values
   * Handles v1 to v2 migration if needed
   * Gracefully handles unauthenticated state (returns empty data)
   * In service worker context, skips profile loading (profiles sent from popup)
   */
  async initialize(): Promise<void> {
    return this.migrationManager.initialize();
  }

  // ========== CONFIG METHODS ==========

  async saveConfig(config: UserConfig): Promise<void> {
    return this.configManager.saveConfig(config);
  }

  async loadConfig(): Promise<UserConfig | null> {
    return this.configManager.loadConfig();
  }

  clearCache(): void {
    this.configManager.clearCache();
  }

  // ========== PROFILE METHODS (V2) ==========

  async saveProfiles(profiles: AliasProfile[]): Promise<void> {
    return this.profileManager.saveProfiles(profiles);
  }

  async loadProfiles(): Promise<AliasProfile[]> {
    return this.profileManager.loadProfiles();
  }

  async createProfile(profileData: {
    profileName: string;
    description?: string;
    real: IdentityData;
    alias: IdentityData;
    enabled?: boolean;
  }): Promise<AliasProfile> {
    return this.profileManager.createProfile(profileData);
  }

  async updateProfile(id: string, updates: Partial<AliasProfile>): Promise<void> {
    return this.profileManager.updateProfile(id, updates);
  }

  async deleteProfile(id: string): Promise<void> {
    return this.profileManager.deleteProfile(id);
  }

  async toggleProfile(id: string): Promise<void> {
    return this.profileManager.toggleProfile(id);
  }

  async getProfile(id: string): Promise<AliasProfile | null> {
    return this.profileManager.getProfile(id);
  }

  async incrementProfileUsage(
    profileId: string,
    service: 'chatgpt' | 'claude' | 'gemini',
    piiType: keyof AliasProfile['metadata']['usageStats']['byPIIType']
  ): Promise<void> {
    return this.profileManager.incrementProfileUsage(profileId, service, piiType);
  }

  // ========== LEGACY V1 ALIAS METHODS (backward compatibility) ==========

  /**
   * Save alias dictionary (legacy v1)
   */
  async saveAliases(aliases: AliasEntry[]): Promise<void> {
    const encrypted = await this.encryptionManager.encrypt(JSON.stringify(aliases));
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
      const decrypted = await this.encryptionManager.decrypt(encryptedData);
      return JSON.parse(decrypted);

    } catch (error) {
      // Check if legacy key material exists
      const legacyKeyData = await chrome.storage.local.get('_encryptionKeyMaterial');
      const hasLegacyKey = !!legacyKeyData['_encryptionKeyMaterial'];

      if (!hasLegacyKey) {
        // No legacy key = already migrated
        console.log('[StorageManager] Aliases already migrated to Firebase UID');

        if (error instanceof Error && error.message.includes('ENCRYPTION_KEY_UNAVAILABLE')) {
          throw error;
        }

        return []; // Return empty if can't decrypt
      }

      console.warn('[StorageManager] Aliases: Firebase UID decryption failed, attempting legacy migration...');

      try {
        // Fall back to legacy key
        const legacyKey = await this.encryptionManager.getLegacyEncryptionKey();
        const decrypted = await this.encryptionManager.decryptWithKey(encryptedData, legacyKey);
        const aliases = JSON.parse(decrypted);

        console.log('[StorageManager] ✅ Legacy aliases decrypted');

        // Check if we're in service worker context
        const isServiceWorker = typeof document === 'undefined';

        if (isServiceWorker) {
          // In service worker, can't re-encrypt (no Firebase auth)
          console.log('[StorageManager] ⏭️ Running in service worker - skipping aliases migration');
          return aliases;
        }

        // In popup/content context - proceed with migration
        console.log('[StorageManager] 🔄 Migrating aliases to Firebase UID...');

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
   * Add a new alias (legacy v1)
   */
  async addAlias(alias: Omit<AliasEntry, 'id' | 'metadata'>): Promise<AliasEntry> {
    const aliases = await this.loadAliases();

    const newAlias: AliasEntry = {
      ...alias,
      id: generateId(),
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
   * Remove an alias by ID (legacy v1)
   */
  async removeAlias(id: string): Promise<void> {
    const aliases = await this.loadAliases();
    const filtered = aliases.filter(a => a.id !== id);
    await this.saveAliases(filtered);
  }

  /**
   * Update an existing alias (legacy v1)
   */
  async updateAlias(id: string, updates: Partial<AliasEntry>): Promise<void> {
    const aliases = await this.loadAliases();
    const index = aliases.findIndex(a => a.id === id);

    if (index !== -1) {
      aliases[index] = { ...aliases[index], ...updates };
      await this.saveAliases(aliases);
    }
  }

  // ========== API KEY VAULT METHODS ==========

  async addAPIKey(keyData: {
    name?: string;
    keyValue: string;
    format?: import('./types').APIKeyFormat;
  }): Promise<APIKey> {
    return this.apiKeyVaultManager.addAPIKey(keyData);
  }

  async removeAPIKey(keyId: string): Promise<void> {
    return this.apiKeyVaultManager.removeAPIKey(keyId);
  }

  async updateAPIKey(keyId: string, updates: Partial<APIKey>): Promise<void> {
    return this.apiKeyVaultManager.updateAPIKey(keyId, updates);
  }

  async getAPIKey(keyId: string): Promise<APIKey | null> {
    return this.apiKeyVaultManager.getAPIKey(keyId);
  }

  async getAllAPIKeys(): Promise<APIKey[]> {
    return this.apiKeyVaultManager.getAllAPIKeys();
  }

  async incrementAPIKeyProtection(keyId: string): Promise<void> {
    return this.apiKeyVaultManager.incrementAPIKeyProtection(keyId);
  }

  async updateAPIKeyVaultSettings(settings: Partial<APIKeyVaultConfig>): Promise<void> {
    return this.apiKeyVaultManager.updateAPIKeyVaultSettings(settings);
  }

  // ========== CUSTOM REDACTION RULES METHODS ==========

  async addCustomRule(ruleData: {
    name: string;
    pattern: string;
    replacement: string;
    category: 'pii' | 'financial' | 'medical' | 'custom';
    description?: string;
    priority?: number;
    testCases?: { input: string; expected: string }[];
  }): Promise<string> {
    return this.customRulesManager.addCustomRule(ruleData);
  }

  async removeCustomRule(ruleId: string): Promise<void> {
    return this.customRulesManager.removeCustomRule(ruleId);
  }

  async updateCustomRule(ruleId: string, updates: Partial<import('./types').CustomRule>): Promise<void> {
    return this.customRulesManager.updateCustomRule(ruleId, updates);
  }

  async toggleCustomRule(ruleId: string): Promise<void> {
    return this.customRulesManager.toggleCustomRule(ruleId);
  }

  async incrementRuleMatchCount(ruleId: string): Promise<void> {
    return this.customRulesManager.incrementRuleMatchCount(ruleId);
  }

  async updateCustomRulesSettings(settings: Partial<CustomRulesConfig>): Promise<void> {
    return this.customRulesManager.updateCustomRulesSettings(settings);
  }

  // ========== PROMPT TEMPLATES MANAGEMENT ==========

  async addPromptTemplate(templateData: {
    name: string;
    content: string;
    description?: string;
    category?: string;
    tags?: string[];
    profileId?: string;
  }): Promise<PromptTemplate> {
    return this.promptTemplatesManager.addPromptTemplate(templateData);
  }

  async removePromptTemplate(templateId: string): Promise<void> {
    return this.promptTemplatesManager.removePromptTemplate(templateId);
  }

  async updatePromptTemplate(templateId: string, updates: Partial<PromptTemplate>): Promise<void> {
    return this.promptTemplatesManager.updatePromptTemplate(templateId, updates);
  }

  async getPromptTemplate(templateId: string): Promise<PromptTemplate | null> {
    return this.promptTemplatesManager.getPromptTemplate(templateId);
  }

  async getAllPromptTemplates(): Promise<PromptTemplate[]> {
    return this.promptTemplatesManager.getAllPromptTemplates();
  }

  async incrementTemplateUsage(templateId: string): Promise<void> {
    return this.promptTemplatesManager.incrementTemplateUsage(templateId);
  }

  async updatePromptTemplatesSettings(settings: Partial<PromptTemplatesConfig>): Promise<void> {
    return this.promptTemplatesManager.updatePromptTemplatesSettings(settings);
  }

  // ========== DOCUMENT ANALYSIS METHODS ==========

  async loadDocumentAliases(): Promise<DocumentAlias[]> {
    return this.documentAliasManager.loadDocumentAliases();
  }

  async saveDocumentAlias(documentAlias: DocumentAlias): Promise<void> {
    return this.documentAliasManager.saveDocumentAlias(documentAlias);
  }

  async deleteDocumentAlias(id: string): Promise<void> {
    return this.documentAliasManager.deleteDocumentAlias(id);
  }

  async updateDocumentAlias(documentAlias: DocumentAlias): Promise<void> {
    return this.documentAliasManager.updateDocumentAlias(documentAlias);
  }

  // ========== STORAGE QUOTA MONITORING ==========

  async getStorageQuota(): Promise<{
    used: number;
    quota: number;
    percentage: number;
    hasUnlimitedStorage: boolean;
  }> {
    return getStorageQuota();
  }

  // ========== ENCRYPTION DELEGATION ==========

  /**
   * Encrypt data (delegates to encryptionManager)
   * Used by tier archive/migration systems
   */
  async encrypt(data: string): Promise<string> {
    return this.encryptionManager.encrypt(data);
  }

  /**
   * Decrypt data (delegates to encryptionManager)
   * Used by tier archive/migration systems
   */
  async decrypt(encryptedData: string): Promise<string> {
    return this.encryptionManager.decrypt(encryptedData);
  }

  // ========== CONFIG DELEGATION ==========

  /**
   * Get starter templates (delegates to configManager)
   * Used by tier archive/migration systems
   */
  getStarterTemplates(): PromptTemplate[] {
    return this.configManager.getStarterTemplates();
  }
}

export default StorageManager;
