/**
 * Custom Rules Handlers
 * Handles custom redaction rules-related messages from popup
 */

import { StorageManager } from '../../lib/storage';
import type { CustomRulesConfig } from '../../lib/types';

export class CustomRulesHandlers {
  constructor(private storage: StorageManager) {}

  /**
   * Add custom redaction rule
   */
  async handleAddCustomRule(payload: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const ruleId = await this.storage.addCustomRule(payload);
      return { success: true, data: { ruleId } };
    } catch (error: any) {
      console.error('[CustomRulesHandlers] Failed to add custom rule:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove custom redaction rule
   */
  async handleRemoveCustomRule(payload: { ruleId: string }): Promise<{ success: boolean; error?: string }> {
    try {
      await this.storage.removeCustomRule(payload.ruleId);
      return { success: true };
    } catch (error: any) {
      console.error('[CustomRulesHandlers] Failed to remove custom rule:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update custom redaction rule
   */
  async handleUpdateCustomRule(payload: {
    ruleId: string;
    updates: any
  }): Promise<{ success: boolean; error?: string }> {
    try {
      await this.storage.updateCustomRule(payload.ruleId, payload.updates);
      return { success: true };
    } catch (error: any) {
      console.error('[CustomRulesHandlers] Failed to update custom rule:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Toggle custom rule enabled state
   */
  async handleToggleCustomRule(payload: { ruleId: string }): Promise<{ success: boolean; error?: string }> {
    try {
      await this.storage.toggleCustomRule(payload.ruleId);
      return { success: true };
    } catch (error: any) {
      console.error('[CustomRulesHandlers] Failed to toggle custom rule:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update custom rules settings
   */
  async handleUpdateCustomRulesSettings(
    payload: Partial<CustomRulesConfig>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.storage.updateCustomRulesSettings(payload);
      return { success: true };
    } catch (error: any) {
      console.error('[CustomRulesHandlers] Failed to update custom rules settings:', error);
      return { success: false, error: error.message };
    }
  }
}
