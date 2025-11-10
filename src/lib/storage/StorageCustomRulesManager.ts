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

export class StorageCustomRulesManager {
  private configManager: StorageConfigManager;

  constructor(configManager: StorageConfigManager) {
    this.configManager = configManager;
  }

  /**
   * Ensure custom rules config exists
   */
  private async ensureCustomRulesConfig(config: any): Promise<void> {
    if (!config.customRules) {
      config.customRules = {
        enabled: true,
        rules: []
      };
    }
  }

  /**
   * Add a custom redaction rule
   */
  async addCustomRule(ruleData: {
    name: string;
    pattern: string;
    replacement: string;
    category: 'pii' | 'financial' | 'medical' | 'custom';
    description?: string;
    priority?: number;
    testCases?: { input: string; expected: string }[];
  }): Promise<string> {
    const config = await this.configManager.loadConfig();
    if (!config) {
      throw new Error('Failed to load config');
    }

    await this.ensureCustomRulesConfig(config);

    // Check PRO tier requirement
    const isFree = config.account?.tier === 'free';
    if (isFree) {
      throw new Error('PRO_FEATURE: Custom redaction rules are a PRO feature. Upgrade to PRO to create custom rules.');
    }

    const ruleId = crypto.randomUUID();
    const newRule: CustomRule = {
      id: ruleId,
      name: ruleData.name,
      pattern: ruleData.pattern,
      replacement: ruleData.replacement,
      enabled: true,
      priority: ruleData.priority ?? 50,
      category: ruleData.category,
      description: ruleData.description,
      createdAt: Date.now(),
      matchCount: 0,
      testCases: ruleData.testCases
    };

    config.customRules!.rules.push(newRule);
    await this.configManager.saveConfig(config);

    console.log('[StorageCustomRulesManager] Added custom rule:', ruleId);
    return ruleId;
  }

  /**
   * Remove a custom rule
   */
  async removeCustomRule(ruleId: string): Promise<void> {
    const config = await this.configManager.loadConfig();
    if (!config?.customRules) {
      return;
    }

    config.customRules.rules = config.customRules.rules.filter(r => r.id !== ruleId);
    await this.configManager.saveConfig(config);

    console.log('[StorageCustomRulesManager] Removed custom rule:', ruleId);
  }

  /**
   * Update a custom rule
   */
  async updateCustomRule(ruleId: string, updates: Partial<CustomRule>): Promise<void> {
    const config = await this.configManager.loadConfig();
    if (!config?.customRules) {
      return;
    }

    const ruleIndex = config.customRules.rules.findIndex(r => r.id === ruleId);
    if (ruleIndex === -1) {
      throw new Error(`Rule not found: ${ruleId}`);
    }

    config.customRules.rules[ruleIndex] = {
      ...config.customRules.rules[ruleIndex],
      ...updates
    };

    await this.configManager.saveConfig(config);
    console.log('[StorageCustomRulesManager] Updated custom rule:', ruleId);
  }

  /**
   * Toggle custom rule enabled state
   */
  async toggleCustomRule(ruleId: string): Promise<void> {
    const config = await this.configManager.loadConfig();
    if (!config?.customRules) {
      return;
    }

    const rule = config.customRules.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = !rule.enabled;
      await this.configManager.saveConfig(config);
      console.log('[StorageCustomRulesManager] Toggled custom rule:', ruleId, 'enabled:', rule.enabled);
    }
  }

  /**
   * Update custom rules match count
   */
  async incrementRuleMatchCount(ruleId: string): Promise<void> {
    const config = await this.configManager.loadConfig();
    if (!config?.customRules) {
      return;
    }

    const rule = config.customRules.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.matchCount++;
      rule.lastUsed = Date.now();
      await this.configManager.saveConfig(config);
    }
  }

  /**
   * Update custom rules settings
   */
  async updateCustomRulesSettings(settings: Partial<CustomRulesConfig>): Promise<void> {
    const config = await this.configManager.loadConfig();
    if (!config) {
      return;
    }

    await this.ensureCustomRulesConfig(config);
    config.customRules = {
      ...config.customRules!,
      ...settings
    };

    await this.configManager.saveConfig(config);
    console.log('[StorageCustomRulesManager] Updated custom rules settings');
  }
}
