/**
 * Activity Log Component
 * Renders debug console activity log
 */

import { useAppStore } from '../../lib/store';
import { ActivityLogEntry } from '../../lib/types';
import { escapeHtml } from './utils';

/**
 * Initialize activity log handlers
 */
export function initActivityLog() {
  const clearLogBtn = document.getElementById('clearLogBtn');
  clearLogBtn?.addEventListener('click', handleClearLog);

  console.log('[Activity Log] Initialized');
}

/**
 * Handle clear log button
 */
async function handleClearLog() {
  const store = useAppStore.getState();
  await store.clearActivityLog();
  console.log('[Activity Log] Debug log cleared');
}

/**
 * Render activity log from store
 */
export function renderActivityLog(activityLog: ActivityLogEntry[]) {
  const debugConsole = document.getElementById('debugConsole');
  const emptyState = document.getElementById('debugEmptyState');

  if (!debugConsole || !emptyState) return;

  if (activityLog.length === 0) {
    emptyState.classList.remove('hidden');
    debugConsole.innerHTML = '';
    return;
  }

  emptyState.classList.add('hidden');
  debugConsole.innerHTML = activityLog
    .map((entry) => {
      const timestamp = new Date(entry.timestamp).toLocaleTimeString();
      const typeIcon = entry.type === 'substitution' ? '✓' : entry.type === 'warning' ? '⚠' : '✗';
      const typeClass = entry.type === 'substitution' ? 'success' : entry.type === 'warning' ? 'warning' : 'error';

      // Ensure optional arrays are defined before accessing length
      const profiles = entry.details.profilesUsed || [];
      const piiTypes = entry.details.piiTypesFound || [];
      const keyTypes = (entry.details as any).keyTypes || [];

      const details = [
        `URL: ${escapeHtml(entry.details.url)}`,
        profiles.length > 0 ? `Profiles: ${escapeHtml(profiles.join(', '))}` : '',
        piiTypes.length > 0 ? `PII Types: ${escapeHtml(piiTypes.join(', '))}` : '',
        `Substitutions: ${entry.details.substitutionCount}`,
        // API Key Vault info if present
        (entry.details as any).apiKeysProtected !== undefined
          ? `API Keys Protected: ${(entry.details as any).apiKeysProtected}`
          : (entry.details as any).apiKeysFound !== undefined
          ? `API Keys Found: ${(entry.details as any).apiKeysFound}`
          : '',
        keyTypes.length > 0 ? `Key Types: ${escapeHtml(keyTypes.join(', '))}` : '',
        entry.details.error ? `Error: ${escapeHtml(entry.details.error)}` : '',
      ]
        .filter(Boolean)
        .join('<br>');

      return `
        <div class="debug-entry">
          <span class="debug-timestamp">[${timestamp}]</span>
          <span class="debug-type ${typeClass}">${typeIcon}</span>
          <span class="debug-message">${escapeHtml(entry.message)}</span>
          <div class="debug-details">
            ${details}
          </div>
        </div>
      `;
    })
    .join('');
}
