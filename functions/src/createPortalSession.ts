import { onCall, HttpsError } from 'firebase-functions/v2/https';
import Stripe from 'stripe';
import { getFirestore } from 'firebase-admin/firestore';

export const createPortalSession = onCall(async (request) => {
  // Verify user is authenticated
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'User must be authenticated to access billing portal'
    );
  }

  const userId = request.auth.uid;

  // Initialize Stripe
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16',
  });

  try {
    const db = getFirestore();

    // Get user's Stripe customer ID
    const userDoc = await db.collection('users').doc(userId).get();
    const customerId = userDoc.data()?.stripeCustomerId;

    if (!customerId) {
      throw new HttpsError(
        'failed-precondition',
        'No Stripe customer found. Please subscribe first.'
      );
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: 'https://promptblocker.com/',
    });

    console.log(`Created portal session for user ${userId}`);

    return {
      url: session.url,
    };
  } catch (error: any) {
    console.error('Error creating portal session:', error);
    throw new HttpsError('internal', `Failed to create portal session: ${error.message}`);
  }
});
