/**
 * Centralized Chrome API Client
 * Type-safe messaging layer for all Chrome extension APIs
 */
import type { UserConfig, APIKey } from '../../lib/types';
/**
 * Chrome API client with typed methods
 */
export declare const chromeApi: {
    /**
     * Get user configuration
     */
    getConfig(): Promise<{
        success: boolean;
        config: UserConfig;
    }>;
    /**
     * Update user configuration
     */
    updateConfig(config: Partial<UserConfig>): Promise<{
        success: boolean;
    }>;
    /**
     * Reload profiles (triggers background to refresh)
     */
    reloadProfiles(): Promise<{
        success: boolean;
    }>;
    /**
     * Get all aliases
     */
    getAliases(): Promise<{
        success: boolean;
        data: any[];
    }>;
    /**
     * Add new alias
     */
    addAlias(alias: any): Promise<{
        success: boolean;
        data: any;
    }>;
    /**
     * Remove alias
     */
    removeAlias(aliasId: string): Promise<{
        success: boolean;
    }>;
    /**
     * Get all API keys
     */
    getAPIKeys(): Promise<{
        success: boolean;
        data: APIKey[];
    }>;
    /**
     * Add new API key
     */
    addAPIKey(keyData: {
        name?: string;
        project?: string;
        keyValue: string;
    }): Promise<{
        success: boolean;
        data: APIKey;
    }>;
    /**
     * Remove API key
     */
    removeAPIKey(keyId: string): Promise<{
        success: boolean;
    }>;
    /**
     * Update API key
     */
    updateAPIKey(keyId: string, updates: Partial<APIKey>): Promise<{
        success: boolean;
    }>;
    /**
     * Update API Key Vault settings
     */
    updateAPIKeyVaultSettings(settings: any): Promise<{
        success: boolean;
    }>;
    /**
     * Add a custom redaction rule
     */
    addCustomRule(ruleData: {
        name: string;
        pattern: string;
        replacement: string;
        category: "pii" | "financial" | "medical" | "custom";
        description?: string;
        priority?: number;
        testCases?: {
            input: string;
            expected: string;
        }[];
    }): Promise<{
        success: boolean;
        data: any;
    }>;
    /**
     * Remove a custom rule
     */
    removeCustomRule(ruleId: string): Promise<{
        success: boolean;
    }>;
    /**
     * Update a custom rule
     */
    updateCustomRule(ruleId: string, updates: any): Promise<{
        success: boolean;
    }>;
    /**
     * Toggle custom rule enabled state
     */
    toggleCustomRule(ruleId: string): Promise<{
        success: boolean;
    }>;
    /**
     * Update custom rules settings
     */
    updateCustomRulesSettings(settings: any): Promise<{
        success: boolean;
    }>;
    /**
     * Reinject content scripts into tabs
     */
    reinjectContentScripts(): Promise<{
        success: boolean;
    }>;
    /**
     * Listen for storage changes
     */
    onStorageChanged(callback: (changes: any, areaName: string) => void): void;
    /**
     * Remove storage change listener
     */
    removeStorageListener(callback: (changes: any, areaName: string) => void): void;
    /**
     * Get from local storage
     */
    getFromStorage<T = any>(key: string): Promise<T | undefined>;
    /**
     * Set to local storage
     */
    setToStorage(key: string, value: any): Promise<void>;
    /**
     * Remove from local storage
     */
    removeFromStorage(key: string): Promise<void>;
    /**
     * Health check (verify extension is responsive)
     */
    healthCheck(): Promise<{
        success: boolean;
        status: string;
    }>;
};
/**
 * Mock API for testing (optional)
 */
export declare const mockChromeApi: {
    getConfig: () => Promise<{
        success: boolean;
        config: UserConfig;
    }>;
    updateConfig: () => Promise<{
        success: boolean;
    }>;
    reloadProfiles: () => Promise<{
        success: boolean;
    }>;
    getAliases: () => Promise<{
        success: boolean;
        data: never[];
    }>;
    addAlias: () => Promise<{
        success: boolean;
        data: {};
    }>;
    removeAlias: () => Promise<{
        success: boolean;
    }>;
    getAPIKeys: () => Promise<{
        success: boolean;
        data: never[];
    }>;
    addAPIKey: () => Promise<{
        success: boolean;
        data: APIKey;
    }>;
    removeAPIKey: () => Promise<{
        success: boolean;
    }>;
    updateAPIKey: () => Promise<{
        success: boolean;
    }>;
    updateAPIKeyVaultSettings: () => Promise<{
        success: boolean;
    }>;
    reinjectContentScripts: () => Promise<{
        success: boolean;
    }>;
    healthCheck: () => Promise<{
        success: boolean;
        status: string;
    }>;
    onStorageChanged: () => void;
    removeStorageListener: () => void;
    getFromStorage: () => Promise<undefined>;
    setToStorage: () => Promise<void>;
    removeFromStorage: () => Promise<void>;
};
//# sourceMappingURL=chromeApi.d.ts.map