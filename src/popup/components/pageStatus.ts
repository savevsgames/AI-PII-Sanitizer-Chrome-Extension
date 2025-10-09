/**
 * Page Status Component
 * Detects if content scripts are active and prompts user to reload if needed
 */

/**
 * Check if content scripts are active on current tab
 */
async function checkPageStatus(): Promise<boolean> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id) return false;

    // Don't check on chrome:// or extension pages
    if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://')) {
      return true; // Not applicable
    }

    // Try to ping content script with timeout
    const response = await Promise.race([
      chrome.tabs.sendMessage(tab.id, { type: 'PING' }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1000))
    ]);

    return response === 'PONG';
  } catch (error) {
    return false; // Content script not responding
  }
}

/**
 * Reload the current active tab
 */
async function reloadCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.tabs.reload(tab.id);
      console.log('[Page Status] Reloaded tab:', tab.id);
    }
  } catch (error) {
    console.error('[Page Status] Error reloading tab:', error);
  }
}

/**
 * Initialize page status checker
 */
export async function initPageStatus() {
  const statusBanner = document.getElementById('statusBanner');
  const reloadPageBtn = document.getElementById('reloadPageBtn');

  if (!statusBanner || !reloadPageBtn) return;

  // Check page status
  const isActive = await checkPageStatus();

  if (!isActive) {
    // Show warning banner
    statusBanner.classList.remove('hidden');
    console.log('[Page Status] Content scripts inactive - showing reload banner');
  } else {
    // Hide banner
    statusBanner.classList.add('hidden');
  }

  // Attach reload button handler
  reloadPageBtn.addEventListener('click', async () => {
    await reloadCurrentTab();
    // Close popup after reload (popup will close automatically)
  });

  console.log('[Page Status] Initialized');
}
