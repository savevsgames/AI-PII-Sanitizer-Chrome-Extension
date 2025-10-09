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

      const details = [
        `URL: ${entry.details.url}`,
        entry.details.profilesUsed?.length > 0
          ? `Profiles: ${entry.details.profilesUsed.join(', ')}`
          : '',
        entry.details.piiTypesFound?.length > 0
          ? `PII Types: ${entry.details.piiTypesFound.join(', ')}`
          : '',
        `Substitutions: ${entry.details.substitutionCount}`,
        entry.details.error ? `Error: ${entry.details.error}` : '',
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
