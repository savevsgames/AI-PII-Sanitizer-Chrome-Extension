/**
 * Tier Migration System
 *
 * Handles data migration when users change subscription tiers:
 * - PRO → FREE: Archive data and reset to clean FREE state
 * - FREE → PRO: Check for archived data and offer restoration
 */

import { archiveProData } from './tierArchive';
import { StorageManager } from './storage';

/**
 * Handle downgrade from PRO to FREE tier
 *
 * Strategy:
 * 1. Archive ALL PRO data (encrypted, 90-day expiration)
 * 2. Wipe user to clean FREE state (no profiles, only starter templates)
 * 3. User starts fresh with 1 profile allowed
 */
export async function handleDowngrade(userId: string): Promise<void> {
  console.log('[Downgrade] ⬇️  User downgraded to FREE, starting migration...');

  // Step 1: Archive all PRO data (90-day restoration)
  await archiveProData(userId);

  // Step 2: Wipe everything and reset to clean FREE state
  const storage = StorageManager.getInstance();

  // Clear all profiles
  await storage.saveProfiles([]);
  console.log('[Downgrade] 🗑️  Cleared all profiles');

  // Reset config to FREE defaults
  const config = await storage.loadConfig();
  if (config) {
    // Keep only starter templates
    config.promptTemplates!.templates = storage.getStarterTemplates();

    // Clear custom rules
    config.customRules = { enabled: false, rules: [] };

    // Clear API keys (or limit to 10)
    if (config.apiKeyVault && config.apiKeyVault.keys.length > 10) {
      config.apiKeyVault.keys = config.apiKeyVault.keys.slice(0, 10);
    }

    // Reset stats
    config.stats = {
      ...config.stats,
      totalSubstitutions: 0,
      activityLog: [],
    };

    await storage.saveConfig(config);
  }

  console.log('[Downgrade] ✅ Downgrade complete - user reset to FREE tier');
  console.log('[Downgrade] 📦 PRO data archived for 90 days');
}

/**
 * Handle upgrade from FREE to PRO tier (database tier change)
 *
 * Check if user has archived data and return info for restoration prompt
 */
export async function handleDatabaseUpgrade(userId: string): Promise<{
  hasArchive: boolean;
  archiveInfo?: {
    archivedAt: string;
    profileCount: number;
    templateCount: number;
    ruleCount: number;
  };
}> {
  console.log('[Upgrade] ⬆️  User upgraded to PRO');

  const { getArchiveStats } = await import('./tierArchive');
  const archiveStats = await getArchiveStats(userId);

  if (!archiveStats || !archiveStats.hasArchive) {
    console.log('[Upgrade] No archived data found - fresh PRO start');
    return { hasArchive: false };
  }

  console.log('[Upgrade] Found archived data from:', archiveStats.archivedAt);
  return {
    hasArchive: true,
    archiveInfo: {
      archivedAt: archiveStats.archivedAt!,
      profileCount: archiveStats.profileCount || 0,
      templateCount: archiveStats.templateCount || 0,
      ruleCount: archiveStats.ruleCount || 0,
    },
  };
}

/**
 * Show downgrade notification to user
 * Returns HTML for modal content
 */
export function getDowngradeNotificationHTML(): string {
  return `
    <div style="text-align: center; padding: 1rem;">
      <h2 style="margin-bottom: 1rem;">🔔 Your PRO Subscription Was Cancelled</h2>

      <p style="margin-bottom: 1rem;">You're now on the FREE tier:</p>
      <ul style="text-align: left; margin: 0 auto 1rem; max-width: 300px;">
        <li>1 alias profile</li>
        <li>3 starter templates (read-only)</li>
      </ul>

      <div style="background: var(--card-bg); border: 1px solid var(--border-neutral); border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
        <p style="margin: 0;">
          📦 Your PRO data has been archived and will be restored if you re-subscribe within 90 days.
        </p>
      </div>

      <div style="display: flex; gap: 0.5rem; justify-content: center;">
        <button class="btn btn-primary" id="downgradeReactivateBtn">
          Reactivate PRO
        </button>
        <button class="btn btn-secondary" id="downgradeContinueBtn">
          Continue Free
        </button>
      </div>
    </div>
  `;
}

/**
 * Show restoration prompt for re-subscription
 * Returns HTML for modal content
 */
export function getRestorationPromptHTML(archiveInfo: {
  archivedAt: string;
  profileCount: number;
  templateCount: number;
  ruleCount: number;
}): string {
  return `
    <div style="text-align: center; padding: 1rem;">
      <h2 style="margin-bottom: 1rem;">🎉 Welcome Back to PRO!</h2>

      <p style="margin-bottom: 1rem;">
        We found your archived data from <strong>${archiveInfo.archivedAt}</strong>
      </p>

      <div style="background: var(--card-bg); border: 1px solid var(--border-neutral); border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
        <p style="margin-bottom: 0.5rem;">Restore your previous setup?</p>
        <ul style="text-align: left; margin: 0 auto; max-width: 300px; list-style: none; padding: 0;">
          <li>• ${archiveInfo.profileCount} alias profiles</li>
          <li>• ${archiveInfo.templateCount} custom templates</li>
          <li>• ${archiveInfo.ruleCount} custom rules</li>
          <li>• All your settings</li>
        </ul>
      </div>

      <div style="display: flex; gap: 0.5rem; justify-content: center;">
        <button class="btn btn-primary" id="restoreDataBtn">
          Restore My Data
        </button>
        <button class="btn btn-secondary" id="startFreshBtn">
          Start Fresh
        </button>
      </div>
    </div>
  `;
}
