/**
 * UI Initialization
 * Handles tab navigation, keyboard shortcuts, and theme
 */

/**
 * Initialize tab switching functionality
 */
export function initTabNavigation(): void {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');

      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      // Add active class to clicked button and corresponding content
      button.classList.add('active');
      const targetTab = document.getElementById(`${tabName}-tab`);
      if (targetTab) {
        targetTab.classList.add('active');
      }

      console.log(`[Popup V2] Switched to ${tabName} tab`);
    });
  });
}

/**
 * Initialize keyboard shortcuts
 */
export function initKeyboardShortcuts(): void {
  document.addEventListener('keydown', (e) => {
    // Cmd/Ctrl + K: Focus search (future feature)
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      // Focus search when implemented
    }

    // Cmd/Ctrl + N: New profile
    if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
      e.preventDefault();
      const addButton = document.getElementById('addProfileBtn');
      addButton?.click();
    }

    // Escape: Close modals
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });
}

/**
 * Close all open modals
 */
function closeAllModals(): void {
  const modals = document.querySelectorAll('.modal:not(.hidden)');
  modals.forEach(modal => {
    modal.classList.add('hidden');
  });
}

/**
 * Initialize theme based on user preference
 */
export function initTheme(): void {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (prefersDark) {
    document.body.classList.add('dark-theme');
  }

  // Listen for theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (e.matches) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  });
}

/**
 * Save last active tab to storage
 */
export async function saveLastActiveTab(tabName: string): Promise<void> {
  await chrome.storage.local.set({ lastActiveTab: tabName });
}

/**
 * Restore last active tab from storage
 */
export async function restoreLastActiveTab(): Promise<void> {
  const result = await chrome.storage.local.get('lastActiveTab');
  const lastTab = result.lastActiveTab || 'profiles';

  const button = document.querySelector(`[data-tab="${lastTab}"]`);
  if (button) {
    (button as HTMLElement).click();
  }
}
