/**
 * Activity Logger
 * Manages activity log queue for popup debug console
 */

import type { AIService } from '../../lib/types';

/**
 * Activity log entry
 */
export interface ActivityLogEntry {
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
  /**
   * Queue for activity logs waiting to be sent to popup
   * Service worker can't encrypt logs, so we buffer them until popup is available
   */
  private activityLogQueue: ActivityLogEntry[] = [];

  /**
   * Log activity to storage for debug console
   */
  async logActivity(entry: ActivityLogEntry): Promise<void> {
    console.log('[ActivityLogger] Activity:', entry.message);

    // Add to queue first
    this.activityLogQueue.push(entry);
    console.log('[ActivityLogger] Activity queued (queue size:', this.activityLogQueue.length, ')');

    // Try to send immediately if popup is available
    try {
      await chrome.runtime.sendMessage({
        type: 'ADD_ACTIVITY_LOG',
        payload: entry
      });
      console.log('[ActivityLogger] ✅ Activity log sent to popup immediately');

      // Remove from queue if sent successfully
      const index = this.activityLogQueue.indexOf(entry);
      if (index > -1) {
        this.activityLogQueue.splice(index, 1);
        console.log('[ActivityLogger] Removed from queue (remaining:', this.activityLogQueue.length, ')');
      }
    } catch (error) {
      // Popup not open - entry stays in queue and will be sent when popup opens
      console.log('[ActivityLogger] Popup not available - activity queued for next popup open');
    }
  }

  /**
   * Flush activity log queue to popup
   * Called when popup opens to send all queued activity logs
   */
  async flushQueueToPopup(): Promise<number> {
    if (this.activityLogQueue.length === 0) {
      return 0;
    }

    console.log('[ActivityLogger] Flushing', this.activityLogQueue.length, 'queued activity logs to popup...');

    const logs = [...this.activityLogQueue]; // Copy to avoid modification during iteration
    let successCount = 0;

    for (const entry of logs) {
      try {
        await chrome.runtime.sendMessage({
          type: 'ADD_ACTIVITY_LOG',
          payload: entry
        });
        successCount++;

        // Remove from queue after successful send
        const index = this.activityLogQueue.indexOf(entry);
        if (index > -1) {
          this.activityLogQueue.splice(index, 1);
        }
      } catch (error) {
        console.error('[ActivityLogger] Failed to flush activity log:', error);
        break; // Stop if popup closes mid-flush
      }
    }

    console.log('[ActivityLogger] ✅ Flushed', successCount, 'logs, remaining:', this.activityLogQueue.length);
    return successCount;
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.activityLogQueue.length;
  }
}
