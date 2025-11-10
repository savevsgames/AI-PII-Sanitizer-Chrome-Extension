/**
 * Config Handlers
 * Handles configuration-related messages from popup/content scripts
 */
import { StorageManager } from '../../lib/storage';
export declare class ConfigHandlers {
    private storage;
    constructor(storage: StorageManager);
    /**
     * Update configuration
     */
    handleUpdateConfig(payload: any): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Get configuration
     */
    handleGetConfig(): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
}
//# sourceMappingURL=ConfigHandlers.d.ts.map