import { onCall, HttpsError } from 'firebase-functions/v2/https';
import Stripe from 'stripe';
import { getFirestore } from 'firebase-admin/firestore';

interface CheckoutSessionData {
  priceId: string;
  mode?: 'subscription' | 'payment';
}

export const createCheckoutSession = onCall(async (request) => {
  // Verify user is authenticated
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'User must be authenticated to create a checkout session'
    );
  }

  const data = request.data as CheckoutSessionData;
  const { priceId, mode = 'subscription' } = data;
  const userId = request.auth.uid;
  const userEmail = request.auth.token.email;

  if (!priceId) {
    throw new HttpsError('invalid-argument', 'Price ID is required');
  }

  // Initialize Stripe
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16',
  });

  try {
    const db = getFirestore();

    // Get or create Stripe customer
    const userDoc = await db.collection('users').doc(userId).get();
    let customerId = userDoc.data()?.stripeCustomerId;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: userEmail || undefined,
        metadata: {
          firebaseUID: userId,
        },
      });
      customerId = customer.id;

      // Save customer ID to Firestore
      await db.collection('users').doc(userId).update({
        stripeCustomerId: customerId,
        updatedAt: Date.now(),
      });

      console.log(`Created Stripe customer ${customerId} for user ${userId}`);
    }

    // Check if user already has an active subscription
    const existingSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    if (existingSubscriptions.data.length > 0) {
      throw new HttpsError(
        'failed-precondition',
        'You already have an active subscription. Please manage your existing subscription instead.'
      );
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: mode,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `https://promptblocker.com/welcome-pro`,
      cancel_url: `https://promptblocker.com/checkout-cancelled`,
      metadata: {
        firebaseUID: userId,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    });

    console.log(`Created checkout session ${session.id} for user ${userId}`);

    return {
      sessionId: session.id,
      url: session.url,
    };
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    throw new HttpsError('internal', `Failed to create checkout session: ${error.message}`);
  }
});
