/**
 * Modal Utilities
 * Provides reusable modal functions to replace alert() calls
 */

/**
 * Show notification modal (replaces alert())
 * @param message - Message to display
 * @param title - Optional title (defaults to "PromptBlocker")
 */
export function showNotification(message: string, title: string = 'Prompt Blocker') {
  const modal = document.getElementById('notificationModal');
  const titleEl = document.getElementById('notificationModalTitle');
  const messageEl = document.getElementById('notificationModalMessage');
  const okBtn = document.getElementById('notificationModalOk') as HTMLButtonElement;
  const closeBtn = document.getElementById('notificationModalClose') as HTMLButtonElement;
  const overlay = modal?.querySelector('.modal-overlay') as HTMLElement;

  if (!modal || !titleEl || !messageEl || !okBtn || !closeBtn) {
    // Fallback to alert if modal not found
    console.error('[Modal Utils] Notification modal not found, using alert fallback');
    alert(message);
    return;
  }

  // Set content
  titleEl.textContent = title;
  messageEl.textContent = message;

  // Show modal
  modal.classList.remove('hidden');

  // Close handlers
  const closeModal = () => {
    modal.classList.add('hidden');
  };

  okBtn.onclick = closeModal;
  closeBtn.onclick = closeModal;
  if (overlay) {
    overlay.onclick = closeModal;
  }

  console.log('[Modal Utils] Showing notification:', title, message);
}

/**
 * Show error notification
 * @param message - Error message to display
 */
export function showError(message: string) {
  showNotification(message, '❌ Error');
}

/**
 * Show success notification
 * @param message - Success message to display
 */
export function showSuccess(message: string) {
  showNotification(message, '✅ Success');
}

/**
 * Show info notification
 * @param message - Info message to display
 */
export function showInfo(message: string) {
  showNotification(message, 'ℹ️ Information');
}

/**
 * Show warning notification
 * @param message - Warning message to display
 */
export function showWarning(message: string) {
  showNotification(message, '⚠️ Warning');
}

/**
 * Show PRO feature notification
 * @param featureName - Name of the PRO feature
 * @param description - Optional description
 */
export function showProFeature(featureName: string, description?: string) {
  const message = description
    ? `🔒 ${featureName} is a PRO feature!\n\n${description}\n\nUpgrade to PRO in Account Settings to unlock this feature.`
    : `🔒 ${featureName} is a PRO feature!\n\nUpgrade to PRO in Account Settings to unlock this feature.`;

  showNotification(message, 'PRO Feature');
}
