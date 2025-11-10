/**
 * Alias Handlers
 * Handles alias and profile-related messages from popup/content scripts
 */

import { StorageManager } from '../../lib/storage';
import { AliasEngine } from '../../lib/aliasEngine';

export class AliasHandlers {
  constructor(
    private storage: StorageManager,
    private aliasEngine: AliasEngine
  ) {}

  /**
   * Get all aliases
   */
  async handleGetAliases(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const aliases = await this.storage.loadAliases();
      return { success: true, data: aliases };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all profiles (V2) - for Gemini observer
   */
  async handleGetProfiles(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const profiles = await this.storage.loadProfiles();
      return { success: true, data: profiles };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Add new alias
   */
  async handleAddAlias(payload: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const newAlias = await this.storage.addAlias(payload);

      // Reload alias engine
      await this.aliasEngine.reload();

      return { success: true, data: newAlias };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove alias
   */
  async handleRemoveAlias(payload: { id: string }): Promise<{ success: boolean; error?: string }> {
    try {
      await this.storage.removeAlias(payload.id);

      // Reload alias engine
      await this.aliasEngine.reload();

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Reload profiles in AliasEngine
   * Called when profiles are added/updated/deleted from popup
   */
  async handleReloadProfiles(): Promise<{ success: boolean; profileCount: number }> {
    console.log('[AliasHandlers] Reloading profiles...');
    await this.aliasEngine.reload();
    const profiles = this.aliasEngine.getProfiles();
    console.log('[AliasHandlers] ✅ Profiles reloaded:', profiles.length, 'active profiles');
    return { success: true, profileCount: profiles.length };
  }
}
