/**
 * Authentication Modal Component
 * Handles Google Sign-In and Email/Password authentication
 * Firebase Auth integration with multi-provider support
 */
/**
 * Initialize authentication modal
 */
export declare function initAuthModal(): Promise<void>;
/**
 * Open authentication modal
 */
export declare function openAuthModal(mode?: 'signin' | 'signup'): void;
/**
 * Close authentication modal
 */
export declare function closeAuthModal(): void;
/**
 * Sign out current user
 */
export declare function signOutUser(): Promise<void>;
//# sourceMappingURL=authModal.d.ts.map