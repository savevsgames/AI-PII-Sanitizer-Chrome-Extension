/**
 * Storage Manager for persisting aliases and configuration
 * Uses Chrome Storage API with encryption for sensitive data
 * Version 2.0 - Profile-based architecture with backward compatibility
 * Version 2.1 - Added alias variations support
 * Version 3.0 - Refactored to modular architecture with sub-managers
 */
import { AliasEntry, AliasProfile, UserConfig, IdentityData, PromptTemplate, DocumentAlias, APIKey, APIKeyVaultConfig, CustomRulesConfig, PromptTemplatesConfig } from './types';
export declare class StorageManager {
    private static instance;
    private static readonly KEYS;
    private encryptionManager;
    private configManager;
    private profileManager;
    private apiKeyVaultManager;
    private customRulesManager;
    private promptTemplatesManager;
    private documentAliasManager;
    private migrationManager;
    private constructor();
    /**
     * Setup Firebase auth state listener to invalidate cache when user signs in/out
     * This ensures fresh data loading when authentication state changes
     * NOTE: Only works in popup/content contexts, not in service worker (no DOM)
     */
    private setupAuthListener;
    /**
     * Setup storage change listener for cross-context synchronization
     */
    private setupStorageChangeListener;
    static getInstance(): StorageManager;
    /**
     * Set custom Firebase Auth instance (for testing with separate Firebase instances)
     * This allows integration tests to use a separate test auth instance while
     * production code uses the default instance
     * @param auth - Firebase Auth instance to use for encryption key derivation
     */
    setCustomAuth(auth: any): void;
    /**
     * Clear custom auth instance (restore default behavior)
     */
    clearCustomAuth(): void;
    /**
     * Initialize storage with default values
     * Handles v1 to v2 migration if needed
     * Gracefully handles unauthenticated state (returns empty data)
     * In service worker context, skips profile loading (profiles sent from popup)
     */
    initialize(): Promise<void>;
    saveConfig(config: UserConfig): Promise<void>;
    loadConfig(): Promise<UserConfig | null>;
    clearCache(): void;
    saveProfiles(profiles: AliasProfile[]): Promise<void>;
    loadProfiles(): Promise<AliasProfile[]>;
    createProfile(profileData: {
        profileName: string;
        description?: string;
        real: IdentityData;
        alias: IdentityData;
        enabled?: boolean;
    }): Promise<AliasProfile>;
    updateProfile(id: string, updates: Partial<AliasProfile>): Promise<void>;
    deleteProfile(id: string): Promise<void>;
    toggleProfile(id: string): Promise<void>;
    getProfile(id: string): Promise<AliasProfile | null>;
    incrementProfileUsage(profileId: string, service: 'chatgpt' | 'claude' | 'gemini', piiType: keyof AliasProfile['metadata']['usageStats']['byPIIType']): Promise<void>;
    /**
     * Save alias dictionary (legacy v1)
     */
    saveAliases(aliases: AliasEntry[]): Promise<void>;
    /**
     * Load and decrypt aliases (legacy v1 data)
     * Supports automatic migration from legacy encryption to Firebase UID
     */
    loadAliases(): Promise<AliasEntry[]>;
    /**
     * Add a new alias (legacy v1)
     */
    addAlias(alias: Omit<AliasEntry, 'id' | 'metadata'>): Promise<AliasEntry>;
    /**
     * Remove an alias by ID (legacy v1)
     */
    removeAlias(id: string): Promise<void>;
    /**
     * Update an existing alias (legacy v1)
     */
    updateAlias(id: string, updates: Partial<AliasEntry>): Promise<void>;
    addAPIKey(keyData: {
        name?: string;
        keyValue: string;
        format?: import('./types').APIKeyFormat;
    }): Promise<APIKey>;
    removeAPIKey(keyId: string): Promise<void>;
    updateAPIKey(keyId: string, updates: Partial<APIKey>): Promise<void>;
    getAPIKey(keyId: string): Promise<APIKey | null>;
    getAllAPIKeys(): Promise<APIKey[]>;
    incrementAPIKeyProtection(keyId: string): Promise<void>;
    updateAPIKeyVaultSettings(settings: Partial<APIKeyVaultConfig>): Promise<void>;
    addCustomRule(ruleData: {
        name: string;
        pattern: string;
        replacement: string;
        category: 'pii' | 'financial' | 'medical' | 'custom';
        description?: string;
        priority?: number;
        testCases?: {
            input: string;
            expected: string;
        }[];
    }): Promise<string>;
    removeCustomRule(ruleId: string): Promise<void>;
    updateCustomRule(ruleId: string, updates: Partial<import('./types').CustomRule>): Promise<void>;
    toggleCustomRule(ruleId: string): Promise<void>;
    incrementRuleMatchCount(ruleId: string): Promise<void>;
    updateCustomRulesSettings(settings: Partial<CustomRulesConfig>): Promise<void>;
    addPromptTemplate(templateData: {
        name: string;
        content: string;
        description?: string;
        category?: string;
        tags?: string[];
        profileId?: string;
    }): Promise<PromptTemplate>;
    removePromptTemplate(templateId: string): Promise<void>;
    updatePromptTemplate(templateId: string, updates: Partial<PromptTemplate>): Promise<void>;
    getPromptTemplate(templateId: string): Promise<PromptTemplate | null>;
    getAllPromptTemplates(): Promise<PromptTemplate[]>;
    incrementTemplateUsage(templateId: string): Promise<void>;
    updatePromptTemplatesSettings(settings: Partial<PromptTemplatesConfig>): Promise<void>;
    loadDocumentAliases(): Promise<DocumentAlias[]>;
    saveDocumentAlias(documentAlias: DocumentAlias): Promise<void>;
    deleteDocumentAlias(id: string): Promise<void>;
    updateDocumentAlias(documentAlias: DocumentAlias): Promise<void>;
    getStorageQuota(): Promise<{
        used: number;
        quota: number;
        percentage: number;
        hasUnlimitedStorage: boolean;
    }>;
    /**
     * Encrypt data (delegates to encryptionManager)
     * Used by tier archive/migration systems
     */
    encrypt(data: string): Promise<string>;
    /**
     * Decrypt data (delegates to encryptionManager)
     * Used by tier archive/migration systems
     */
    decrypt(encryptedData: string): Promise<string>;
    /**
     * Get starter templates (delegates to configManager)
     * Used by tier archive/migration systems
     */
    getStarterTemplates(): PromptTemplate[];
}
export default StorageManager;
//# sourceMappingURL=storage.d.ts.map