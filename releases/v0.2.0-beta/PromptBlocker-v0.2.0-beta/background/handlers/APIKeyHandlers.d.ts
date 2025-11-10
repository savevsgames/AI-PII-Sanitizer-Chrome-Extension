/**
 * API Key Handlers
 * Handles API Key Vault-related messages from popup
 */
import { StorageManager } from '../../lib/storage';
import type { APIKeyFormat, APIKey, APIKeyVaultConfig } from '../../lib/types';
export declare class APIKeyHandlers {
    private storage;
    constructor(storage: StorageManager);
    /**
     * Handle ADD_API_KEY message from popup
     */
    handleAddAPIKey(payload: {
        name?: string;
        keyValue: string;
        format?: APIKeyFormat;
    }): Promise<{
        success: boolean;
        data?: any;
        error?: string;
        message?: string;
    }>;
    /**
     * Handle REMOVE_API_KEY message from popup
     */
    handleRemoveAPIKey(payload: {
        id: string;
    }): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Handle UPDATE_API_KEY message from popup
     */
    handleUpdateAPIKey(payload: {
        id: string;
        updates: Partial<APIKey>;
    }): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Handle GET_API_KEYS message from popup
     */
    handleGetAPIKeys(): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    /**
     * Handle UPDATE_API_KEY_VAULT_SETTINGS message from popup
     */
    handleUpdateAPIKeyVaultSettings(payload: Partial<APIKeyVaultConfig>): Promise<{
        success: boolean;
        error?: string;
    }>;
}
//# sourceMappingURL=APIKeyHandlers.d.ts.map