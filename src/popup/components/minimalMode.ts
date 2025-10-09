/**
 * Minimal Mode Component
 * Handles compact view toggle and updates
 */

import { UserConfig } from '../../lib/types';
import { formatRelativeTime } from './utils';

/**
 * Initialize minimal mode handlers
 */
export function initMinimalMode() {
  const minimizeBtn = document.getElementById('minimizeBtn');
  const expandBtn = document.getElementById('expandBtn');

  minimizeBtn?.addEventListener('click', switchToMinimalMode);
  expandBtn?.addEventListener('click', switchToFullMode);

  console.log('[Minimal Mode] Initialized');
}

/**
 * Switch to minimal mode
 */
function switchToMinimalMode() {
  const minimalView = document.getElementById('minimalView');
  const fullView = document.getElementById('fullView');

  if (minimalView && fullView) {
    minimalView.classList.remove('hidden');
    fullView.classList.add('hidden');
    document.body.classList.add('minimal-mode');

    // Save preference to chrome.storage instead of localStorage
    chrome.storage.local.set({ popupMode: 'minimal' });
    console.log('[Minimal Mode] Switched to minimal mode');
  }
}

/**
 * Switch to full mode
 */
function switchToFullMode() {
  const minimalView = document.getElementById('minimalView');
  const fullView = document.getElementById('fullView');

  if (minimalView && fullView) {
    minimalView.classList.add('hidden');
    fullView.classList.remove('hidden');
    document.body.classList.remove('minimal-mode');

    // Save preference to chrome.storage instead of localStorage
    chrome.storage.local.set({ popupMode: 'full' });
    console.log('[Minimal Mode] Switched to full mode');
  }
}

/**
 * Load saved mode preference
 */
export async function loadModePreference() {
  const { popupMode } = await chrome.storage.local.get('popupMode');
  const savedMode = popupMode || 'full';

  if (savedMode === 'minimal') {
    switchToMinimalMode();
  } else {
    switchToFullMode();
  }
}

/**
 * Update minimal view with latest stats and activity
 */
export function updateMinimalView(config: UserConfig | null) {
  if (!config) return;

  const minimalCount = document.getElementById('minimalCount');
  const minimalActivity = document.getElementById('minimalActivity');
  const pulseDot = document.querySelector('.pulse-dot');
  const activityIcon = document.querySelector('.activity-icon');

  if (minimalCount) {
    const todayCount = config.stats.totalSubstitutions || 0;
    minimalCount.textContent = todayCount.toString();
  }

  if (minimalActivity) {
    const latestLog = config.stats.activityLog?.[0];

    if (latestLog) {
      const timeAgo = formatRelativeTime(latestLog.timestamp);
      const count = latestLog.details.substitutionCount || 0;

      minimalActivity.textContent = `${count} items replaced (${timeAgo})`;

      // Trigger pulse animation if recent (< 5 seconds)
      const secondsAgo = Math.floor((Date.now() - latestLog.timestamp) / 1000);
      if (secondsAgo < 5) {
        pulseDot?.classList.add('active');
        activityIcon?.classList.add('active');

        setTimeout(() => {
          pulseDot?.classList.remove('active');
          activityIcon?.classList.remove('active');
        }, 1500);
      }
    } else {
      minimalActivity.textContent = 'No activity yet';
    }
  }
}
