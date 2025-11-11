/**
 * Alias Handlers
 * Handles alias and profile-related messages from popup/content scripts
 */

import { StorageManager } from '../../lib/storage';
import { AliasEngine } from '../../lib/aliasEngine';
import { AliasProfile } from '../../lib/types';

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
   *
   * LEGACY: This method tries to decrypt in service worker context which fails.
   * Use handleSetProfiles() instead (receives pre-decrypted profiles from popup)
   */
  async handleReloadProfiles(): Promise<{ success: boolean; profileCount: number }> {
    console.log('[AliasHandlers] Reloading profiles...');
    await this.aliasEngine.reload();
    const profiles = this.aliasEngine.getProfiles();
    console.log('[AliasHandlers] ✅ Profiles reloaded:', profiles.length, 'active profiles');
    return { success: true, profileCount: profiles.length };
  }

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
  async handleSetProfiles(profiles: AliasProfile[]): Promise<{ success: boolean; profileCount: number }> {
    console.log('[AliasHandlers] Setting profiles from popup:', profiles.length, 'profiles');
    this.aliasEngine.setProfiles(profiles);
    const loadedProfiles = this.aliasEngine.getProfiles();
    console.log('[AliasHandlers] ✅ Profiles loaded in AliasEngine:', loadedProfiles.length, 'active profiles');
    return { success: true, profileCount: loadedProfiles.length };
  }
}
