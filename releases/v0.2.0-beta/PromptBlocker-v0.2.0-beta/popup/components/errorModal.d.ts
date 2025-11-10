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
    dismissable?: boolean;
}
/**
 * Show error modal using existing notification modal
 */
export declare function showErrorModal(options: ErrorModalOptions): void;
/**
 * Hide error modal
 */
export declare function hideErrorModal(): void;
/**
 * Show auth error with fallback to email/password
 */
export declare function showAuthErrorModal(title: string, message: string, onSwitchToEmail?: () => void): void;
//# sourceMappingURL=errorModal.d.ts.map