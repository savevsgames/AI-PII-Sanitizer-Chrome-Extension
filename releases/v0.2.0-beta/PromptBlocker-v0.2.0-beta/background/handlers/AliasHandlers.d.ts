/**
 * Alias Handlers
 * Handles alias and profile-related messages from popup/content scripts
 */
import { StorageManager } from '../../lib/storage';
import { AliasEngine } from '../../lib/aliasEngine';
export declare class AliasHandlers {
    private storage;
    private aliasEngine;
    constructor(storage: StorageManager, aliasEngine: AliasEngine);
    /**
     * Get all aliases
     */
    handleGetAliases(): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    /**
     * Get all profiles (V2) - for Gemini observer
     */
    handleGetProfiles(): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    /**
     * Add new alias
     */
    handleAddAlias(payload: any): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    /**
     * Remove alias
     */
    handleRemoveAlias(payload: {
        id: string;
    }): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Reload profiles in AliasEngine
     * Called when profiles are added/updated/deleted from popup
     */
    handleReloadProfiles(): Promise<{
        success: boolean;
        profileCount: number;
    }>;
}
//# sourceMappingURL=AliasHandlers.d.ts.map