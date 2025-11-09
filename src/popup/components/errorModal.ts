/**
 * Error Modal Component
 * Professional error display with action buttons
 * Used for auth errors and other critical user-facing errors
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

let currentErrorModal: HTMLElement | null = null;

/**
 * Show error modal with custom actions
 */
export function showErrorModal(options: ErrorModalOptions): void {
  // Remove existing error modal if any
  hideErrorModal();

  const { title, message, primaryAction, secondaryAction, dismissable = true } = options;

  // Create modal HTML
  const modal = document.createElement('div');
  modal.id = 'errorModal';
  modal.className = 'modal-overlay active';
  modal.innerHTML = `
    <div class="modal error-modal">
      <div class="modal-header">
        <h2 class="modal-title">${escapeHtml(title)}</h2>
        ${dismissable ? '<button class="modal-close" id="errorModalClose">✕</button>' : ''}
      </div>
      <div class="modal-body">
        <div class="error-icon">⚠️</div>
        <p class="error-message">${escapeHtml(message).replace(/\n/g, '<br>')}</p>
      </div>
      <div class="modal-footer">
        ${secondaryAction ? `<button class="btn btn-secondary" id="errorSecondaryAction">${escapeHtml(secondaryAction.text)}</button>` : ''}
        ${primaryAction ? `<button class="btn btn-primary" id="errorPrimaryAction">${escapeHtml(primaryAction.text)}</button>` : ''}
        ${!primaryAction && !secondaryAction && dismissable ? '<button class="btn btn-secondary" id="errorDismiss">OK</button>' : ''}
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  currentErrorModal = modal;

  // Event listeners
  if (dismissable) {
    const closeBtn = modal.querySelector('#errorModalClose');
    const overlay = modal;
    const dismissBtn = modal.querySelector('#errorDismiss');

    closeBtn?.addEventListener('click', hideErrorModal);
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) hideErrorModal();
    });
    dismissBtn?.addEventListener('click', hideErrorModal);
  }

  if (primaryAction) {
    const primaryBtn = modal.querySelector('#errorPrimaryAction');
    primaryBtn?.addEventListener('click', () => {
      primaryAction.onClick();
      hideErrorModal();
    });
  }

  if (secondaryAction) {
    const secondaryBtn = modal.querySelector('#errorSecondaryAction');
    secondaryBtn?.addEventListener('click', () => {
      secondaryAction.onClick();
      hideErrorModal();
    });
  }

  console.log('[Error Modal] Shown:', title);
}

/**
 * Hide error modal
 */
export function hideErrorModal(): void {
  if (currentErrorModal) {
    currentErrorModal.remove();
    currentErrorModal = null;
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
    secondaryAction: {
      text: 'Try Again',
      onClick: () => {
        // Just closes the modal
      },
    },
  });
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
