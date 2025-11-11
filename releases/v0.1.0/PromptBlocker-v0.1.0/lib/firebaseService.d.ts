/**
 * Firebase Service
 * Handles Firestore database operations for user management
 * Syncs user data, tier info, and settings
 */
import { Timestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';
export interface FirestoreUser {
    email: string;
    displayName?: string;
    photoURL?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    tier: 'free' | 'pro';
    subscription?: {
        status: 'active' | 'cancelled' | 'past_due';
        currentPeriodEnd: Timestamp;
        stripeCustomerId?: string;
        stripeSubscriptionId?: string;
    };
}
/**
 * Create or update user document in Firestore
 */
export declare function syncUserToFirestore(user: User): Promise<FirestoreUser>;
/**
 * Load user's tier from Firestore
 */
export declare function getUserTier(userId: string): Promise<'free' | 'pro'>;
/**
 * Load complete user data from Firestore
 */
export declare function getUserData(userId: string): Promise<FirestoreUser | null>;
/**
 * Listen to user tier changes in real-time
 * Returns an unsubscribe function
 */
export declare function listenToUserTier(userId: string, onTierChange: (tier: 'free' | 'pro') => void): () => void;
/**
 * Check if user has PRO tier
 */
export declare function isProUser(userId: string): Promise<boolean>;
/**
 * Check if user has active subscription
 */
export declare function hasActiveSubscription(userId: string): Promise<boolean>;
/**
 * Upgrade user to PRO tier (called by Stripe webhook)
 * This should ONLY be called by backend webhook, not client-side
 */
export declare function upgradeUserToPro(userId: string, subscriptionData: {
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    currentPeriodEnd: number;
}): Promise<void>;
/**
 * Downgrade user to FREE tier (called when subscription cancelled)
 */
export declare function downgradeUserToFree(userId: string): Promise<void>;
/**
 * Delete user account data from Firestore (GDPR Right to Erasure)
 * Deletes user document and subscription document (if exists)
 *
 * NOTE: This does NOT delete the Firebase Auth account - that must be done separately
 * using deleteUser() from firebase/auth
 */
export declare function deleteUserAccount(userId: string): Promise<void>;
//# sourceMappingURL=firebaseService.d.ts.map