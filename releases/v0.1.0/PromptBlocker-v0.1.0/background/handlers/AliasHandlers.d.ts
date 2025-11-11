/**
 * Alias Handlers
 * Handles alias and profile-related messages from popup/content scripts
 */
import { StorageManager } from '../../lib/storage';
import { AliasEngine } from '../../lib/aliasEngine';
import { AliasProfile } from '../../lib/types';
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
     *
     * LEGACY: This method tries to decrypt in service worker context which fails.
     * Use handleSetProfiles() instead (receives pre-decrypted profiles from popup)
     */
    handleReloadProfiles(): Promise<{
        success: boolean;
        profileCount: number;
    }>;
    /**
     * Set profiles directly from popup (pre-decrypted)
     * This bypasses service worker encryption limitations by receiving profiles
     * that were already decrypted in the popup context (which has Firebase auth)
     *
     * Called when:
     * - Profiles are created/updated/deleted in popup
     * - User signs in and popup loads profiles
     *
     * @param profiles - Array of decrypted AliasProfile objects from popup
     */
    handleSetProfiles(profiles: AliasProfile[]): Promise<{
        success: boolean;
        profileCount: number;
    }>;
}
//# sourceMappingURL=AliasHandlers.d.ts.map