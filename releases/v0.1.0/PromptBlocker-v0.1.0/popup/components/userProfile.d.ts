/**
 * User Profile Display Component
 * Shows authenticated user info in header
 * Handles sign-out and account management
 */
import { User } from 'firebase/auth';
/**
 * Initialize user profile display
 */
export declare function initUserProfile(): void;
/**
 * Update tier badge in UI
 */
export declare function updateTierBadge(): void;
/**
 * Get current authenticated user
 */
export declare function getCurrentUser(): User | null;
/**
 * Check if user is authenticated
 */
export declare function isAuthenticated(): boolean;
/**
 * Handle Quick Start with Google - pre-fill profile with Google account info
 * This function is exported to be used by the Quick Start button in the UI
 */
export declare function handleGoogleQuickStart(): void;
//# sourceMappingURL=userProfile.d.ts.map