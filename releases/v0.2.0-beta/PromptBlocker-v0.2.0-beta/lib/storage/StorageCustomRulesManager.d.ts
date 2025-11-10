/**
 * Storage Custom Rules Manager
 * Handles all custom redaction rules operations
 *
 * Features:
 * - Custom rule CRUD operations
 * - PRO tier requirement enforcement
 * - Match count tracking
 * - Test case support
 * - Encrypted storage via ConfigManager
 */
import { CustomRule, CustomRulesConfig } from '../types';
import { StorageConfigManager } from './StorageConfigManager';
export declare class StorageCustomRulesManager {
    private configManager;
    constructor(configManager: StorageConfigManager);
    /**
     * Ensure custom rules config exists
     */
    private ensureCustomRulesConfig;
    /**
     * Add a custom redaction rule
     */
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
    /**
     * Remove a custom rule
     */
    removeCustomRule(ruleId: string): Promise<void>;
    /**
     * Update a custom rule
     */
    updateCustomRule(ruleId: string, updates: Partial<CustomRule>): Promise<void>;
    /**
     * Toggle custom rule enabled state
     */
    toggleCustomRule(ruleId: string): Promise<void>;
    /**
     * Update custom rules match count
     */
    incrementRuleMatchCount(ruleId: string): Promise<void>;
    /**
     * Update custom rules settings
     */
    updateCustomRulesSettings(settings: Partial<CustomRulesConfig>): Promise<void>;
}
//# sourceMappingURL=StorageCustomRulesManager.d.ts.map