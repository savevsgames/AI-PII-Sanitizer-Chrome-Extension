/**
 * Firebase Service
 * Handles Firestore database operations for user management
 * Syncs user data, tier info, and settings
 */

import { db } from './firebase';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
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
export async function syncUserToFirestore(user: User): Promise<FirestoreUser> {
  const userRef = doc(db, `users/${user.uid}`);

  try {
    // Check if user document exists
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      // Update existing user
      await updateDoc(userRef, {
        email: user.email || '',
        displayName: user.displayName || null,
        photoURL: user.photoURL || null,
        updatedAt: serverTimestamp(),
      });

      console.log('[Firebase Service] User updated:', user.uid);

      return userSnap.data() as FirestoreUser;
    } else {
      // Create new user document
      const newUser: any = {
        email: user.email || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        tier: 'free', // Default to free tier
      };

      // Only add displayName and photoURL if they exist (Firestore doesn't allow undefined)
      if (user.displayName) {
        newUser.displayName = user.displayName;
      }
      if (user.photoURL) {
        newUser.photoURL = user.photoURL;
      }

      await setDoc(userRef, newUser);

      console.log('[Firebase Service] New user created:', user.uid);

      return {
        ...newUser,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
    }
  } catch (error) {
    console.error('[Firebase Service] Error syncing user:', error);
    throw error;
  }
}

/**
 * Load user's tier from Firestore
 */
export async function getUserTier(userId: string): Promise<'free' | 'pro'> {
  const userRef = doc(db, `users/${userId}`);

  try {
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data() as FirestoreUser;
      return userData.tier || 'free';
    }

    // User doesn't exist yet (shouldn't happen), return free
    return 'free';
  } catch (error) {
    console.error('[Firebase Service] Error loading user tier:', error);
    return 'free'; // Default to free on error
  }
}

/**
 * Load complete user data from Firestore
 */
export async function getUserData(userId: string): Promise<FirestoreUser | null> {
  const userRef = doc(db, `users/${userId}`);

  try {
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as FirestoreUser;
    }

    return null;
  } catch (error) {
    console.error('[Firebase Service] Error loading user data:', error);
    return null;
  }
}

/**
 * Listen to user tier changes in real-time
 * Returns an unsubscribe function
 */
export function listenToUserTier(
  userId: string,
  onTierChange: (tier: 'free' | 'pro') => void
): () => void {
  const userRef = doc(db, `users/${userId}`);

  console.log('[Firebase Service] Starting tier listener for user:', userId);

  const unsubscribe = onSnapshot(
    userRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.data() as FirestoreUser;
        const tier = userData.tier || 'free';
        console.log('[Firebase Service] Tier changed:', tier);
        onTierChange(tier);
      } else {
        console.warn('[Firebase Service] User document does not exist');
        onTierChange('free');
      }
    },
    (error) => {
      console.error('[Firebase Service] Error in tier listener:', error);
    }
  );

  return unsubscribe;
}

/**
 * Check if user has PRO tier
 */
export async function isProUser(userId: string): Promise<boolean> {
  const tier = await getUserTier(userId);
  return tier === 'pro';
}

/**
 * Check if user has active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const userData = await getUserData(userId);

  if (!userData || !userData.subscription) {
    return false;
  }

  const { status, currentPeriodEnd } = userData.subscription;

  // Check if subscription is active and not expired
  const isActive = status === 'active';
  const notExpired = currentPeriodEnd.toMillis() > Date.now();

  return isActive && notExpired;
}

/**
 * Upgrade user to PRO tier (called by Stripe webhook)
 * This should ONLY be called by backend webhook, not client-side
 */
export async function upgradeUserToPro(
  userId: string,
  subscriptionData: {
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    currentPeriodEnd: number; // Unix timestamp
  }
): Promise<void> {
  const userRef = doc(db, `users/${userId}`);

  try {
    await updateDoc(userRef, {
      tier: 'pro',
      subscription: {
        status: 'active',
        currentPeriodEnd: Timestamp.fromMillis(subscriptionData.currentPeriodEnd),
        stripeCustomerId: subscriptionData.stripeCustomerId,
        stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
      },
      updatedAt: serverTimestamp(),
    });

    console.log('[Firebase Service] User upgraded to PRO:', userId);
  } catch (error) {
    console.error('[Firebase Service] Error upgrading user:', error);
    throw error;
  }
}

/**
 * Downgrade user to FREE tier (called when subscription cancelled)
 */
export async function downgradeUserToFree(userId: string): Promise<void> {
  const userRef = doc(db, `users/${userId}`);

  try {
    await updateDoc(userRef, {
      tier: 'free',
      'subscription.status': 'cancelled',
      updatedAt: serverTimestamp(),
    });

    console.log('[Firebase Service] User downgraded to FREE:', userId);
  } catch (error) {
    console.error('[Firebase Service] Error downgrading user:', error);
    throw error;
  }
}

/**
 * Delete user account data from Firestore (GDPR Right to Erasure)
 * Deletes user document and subscription document (if exists)
 *
 * NOTE: This does NOT delete the Firebase Auth account - that must be done separately
 * using deleteUser() from firebase/auth
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  try {
    console.log('[Firebase Service] Deleting user data for:', userId);

    // Delete user document
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
    console.log('[Firebase Service] ✅ User document deleted');

    // Delete subscription document if it exists
    const subscriptionRef = doc(db, 'subscriptions', userId);
    const subscriptionSnap = await getDoc(subscriptionRef);

    if (subscriptionSnap.exists()) {
      await deleteDoc(subscriptionRef);
      console.log('[Firebase Service] ✅ Subscription document deleted');
    } else {
      console.log('[Firebase Service] No subscription document found (user may be on free tier)');
    }

    console.log('[Firebase Service] ✅ User data deleted from Firestore:', userId);
  } catch (error) {
    console.error('[Firebase Service] ❌ Error deleting user data:', error);
    throw error;
  }
}
