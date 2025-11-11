/**
 * Custom Rules Handlers
 * Handles custom redaction rules-related messages from popup
 */
import { StorageManager } from '../../lib/storage';
import type { CustomRulesConfig } from '../../lib/types';
export declare class CustomRulesHandlers {
    private storage;
    constructor(storage: StorageManager);
    /**
     * Add custom redaction rule
     */
    handleAddCustomRule(payload: any): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    /**
     * Remove custom redaction rule
     */
    handleRemoveCustomRule(payload: {
        ruleId: string;
    }): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Update custom redaction rule
     */
    handleUpdateCustomRule(payload: {
        ruleId: string;
        updates: any;
    }): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Toggle custom rule enabled state
     */
    handleToggleCustomRule(payload: {
        ruleId: string;
    }): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Update custom rules settings
     */
    handleUpdateCustomRulesSettings(payload: Partial<CustomRulesConfig>): Promise<{
        success: boolean;
        error?: string;
    }>;
}
//# sourceMappingURL=CustomRulesHandlers.d.ts.map