/**
 * Error Modal Component
 * Uses existing notificationModal system instead of creating new modals
 * Integrates with app's theme system
 */

export interface ErrorModalOptions {
  title: string;
  message: string;
  primaryAction?: {
    text: string;
    onClick: () => void;
  };
  secondaryAction?: {
    text: string;
    onClick: () => void;
  };
  dismissable?: boolean; // Default: true
}

/**
 * Show error modal using existing notification modal
 */
export function showErrorModal(options: ErrorModalOptions): void {
  const { title, message, primaryAction } = options;

  // Use existing notification modal from popup-v2.html
  const modal = document.getElementById('notificationModal');
  const titleEl = document.getElementById('notificationModalTitle');
  const messageEl = document.getElementById('notificationModalMessage');
  const okBtn = document.getElementById('notificationModalOk');
  const closeBtn = document.getElementById('notificationModalClose');

  if (!modal || !titleEl || !messageEl || !okBtn) {
    console.error('[Error Modal] Notification modal elements not found');
    alert(`${title}\n\n${message}`); // Fallback
    return;
  }

  // Set content
  titleEl.textContent = title;
  messageEl.textContent = message;

  // Update button text and handler
  if (primaryAction) {
    okBtn.textContent = primaryAction.text;
    okBtn.onclick = () => {
      primaryAction.onClick();
      modal.classList.add('hidden');
    };
  } else {
    okBtn.textContent = 'OK';
    okBtn.onclick = () => {
      modal.classList.add('hidden');
    };
  }

  // Close button handler
  closeBtn!.onclick = () => {
    modal.classList.add('hidden');
  };

  // Show modal
  modal.classList.remove('hidden');

  console.log('[Error Modal] Shown:', title);
}

/**
 * Hide error modal
 */
export function hideErrorModal(): void {
  const modal = document.getElementById('notificationModal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

/**
 * Show auth error with fallback to email/password
 */
export function showAuthErrorModal(
  title: string,
  message: string,
  onSwitchToEmail?: () => void
): void {
  showErrorModal({
    title,
    message,
    primaryAction: onSwitchToEmail
      ? {
          text: 'Use Email/Password Instead',
          onClick: onSwitchToEmail,
        }
      : undefined,
  });
}
