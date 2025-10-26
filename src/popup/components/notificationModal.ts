/**
 * Notification Modal Component
 * Replaces browser alerts with custom styled modals
 */

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationOptions {
  title?: string;
  message: string;
  type?: NotificationType;
  confirmText?: string;
  onConfirm?: () => void;
}

/**
 * Show notification modal
 */
export function showNotification(options: NotificationOptions): void {
  const {
    title,
    message,
    type = 'info',
    confirmText = 'OK',
    onConfirm
  } = options;

  // Remove existing notification if any
  const existing = document.getElementById('notificationModal');
  if (existing) {
    existing.remove();
  }

  // Create modal HTML
  const modal = document.createElement('div');
  modal.id = 'notificationModal';
  modal.className = 'modal notification-modal';
  modal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-content modal-small">
      <div class="modal-header notification-header notification-${type}">
        <div class="notification-icon">${getIcon(type)}</div>
        <h3>${title || getDefaultTitle(type)}</h3>
      </div>
      <div class="modal-body notification-body">
        <p>${escapeHtml(message)}</p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-primary" id="notificationConfirm">${confirmText}</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Add event listeners
  const confirmBtn = document.getElementById('notificationConfirm');
  const overlay = modal.querySelector('.modal-overlay');

  const closeModal = () => {
    modal.remove();
    if (onConfirm) onConfirm();
  };

  confirmBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', closeModal);

  // Show modal with animation
  requestAnimationFrame(() => {
    modal.classList.add('active');
  });

  // Auto-focus confirm button
  confirmBtn?.focus();
}

/**
 * Show success notification
 */
export function showSuccess(message: string, title?: string): void {
  showNotification({ message, type: 'success', title });
}

/**
 * Show error notification
 */
export function showError(message: string, title?: string): void {
  showNotification({ message, type: 'error', title });
}

/**
 * Show warning notification
 */
export function showWarning(message: string, title?: string): void {
  showNotification({ message, type: 'warning', title });
}

/**
 * Show info notification
 */
export function showInfo(message: string, title?: string): void {
  showNotification({ message, type: 'info', title });
}

/**
 * Show confirmation dialog
 */
export function showConfirm(options: {
  message: string;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}): void {
  const {
    title = 'Confirm',
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel
  } = options;

  // Remove existing notification if any
  const existing = document.getElementById('notificationModal');
  if (existing) {
    existing.remove();
  }

  // Create modal HTML
  const modal = document.createElement('div');
  modal.id = 'notificationModal';
  modal.className = 'modal notification-modal';
  modal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-content modal-small">
      <div class="modal-header notification-header notification-warning">
        <div class="notification-icon">${getIcon('warning')}</div>
        <h3>${escapeHtml(title)}</h3>
      </div>
      <div class="modal-body notification-body">
        <p>${escapeHtml(message)}</p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" id="notificationCancel">${cancelText}</button>
        <button type="button" class="btn btn-primary" id="notificationConfirm">${confirmText}</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Add event listeners
  const confirmBtn = document.getElementById('notificationConfirm');
  const cancelBtn = document.getElementById('notificationCancel');
  const overlay = modal.querySelector('.modal-overlay');

  const closeModal = () => {
    modal.remove();
  };

  confirmBtn?.addEventListener('click', () => {
    closeModal();
    onConfirm();
  });

  cancelBtn?.addEventListener('click', () => {
    closeModal();
    if (onCancel) onCancel();
  });

  overlay?.addEventListener('click', () => {
    closeModal();
    if (onCancel) onCancel();
  });

  // Show modal with animation
  requestAnimationFrame(() => {
    modal.classList.add('active');
  });

  // Auto-focus confirm button
  confirmBtn?.focus();
}

/**
 * Get icon for notification type
 */
function getIcon(type: NotificationType): string {
  switch (type) {
    case 'success':
      return '✓';
    case 'error':
      return '✕';
    case 'warning':
      return '⚠';
    case 'info':
    default:
      return 'ℹ';
  }
}

/**
 * Get default title for notification type
 */
function getDefaultTitle(type: NotificationType): string {
  switch (type) {
    case 'success':
      return 'Success';
    case 'error':
      return 'Error';
    case 'warning':
      return 'Warning';
    case 'info':
    default:
      return 'Information';
  }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
