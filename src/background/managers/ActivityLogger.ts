/**
 * Activity Logger
 * Logs activity directly to encrypted storage
 * Service worker can now encrypt with Firebase auth/web-extension support
 */

import type { AIService } from '../../lib/types';
import { StorageManager } from '../../lib/storage';

/**
 * Activity log entry (without id/timestamp - added when saving)
 */
export interface ActivityLogEntryInput {
  type: 'interception' | 'substitution' | 'warning' | 'error';
  service: AIService;
  details: {
    url: string;
    profilesUsed?: string[];
    piiTypesFound?: string[];
    substitutionCount: number;
    error?: string;
    apiKeysProtected?: number;
    apiKeysFound?: number;
    keyTypes?: string[];
  };
  message: string;
}

export class ActivityLogger {
  constructor(private storage: StorageManager) {}

  /**
   * Log activity directly to encrypted storage
   */
  async logActivity(entry: ActivityLogEntryInput): Promise<void> {
    console.log('[ActivityLogger] Activity:', entry.message);

    try {
      // Load current config
      const config = await this.storage.loadConfig();
      if (!config) {
        console.warn('[ActivityLogger] No config found - skipping activity log');
        return;
      }

      // Get current activity logs (decrypted)
      const currentLogs = config.stats?.activityLog || [];

      // Add new entry with id and timestamp
      const newEntry = {
        ...entry,
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        timestamp: Date.now(),
      };

      // Add to beginning (most recent first)
      const updatedLogs = [newEntry, ...currentLogs];

      // Keep only last 100 entries to prevent unbounded growth
      const trimmedLogs = updatedLogs.slice(0, 100);

      // Save back to encrypted storage
      await this.storage.saveConfig({
        ...config,
        stats: {
          ...config.stats,
          activityLog: trimmedLogs,
        },
      });

      console.log('[ActivityLogger] ✅ Activity logged to encrypted storage');
    } catch (error) {
      console.error('[ActivityLogger] Failed to log activity:', error);
      // Don't throw - activity logging is non-critical
    }
  }
}
