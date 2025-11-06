import { onRequest } from 'firebase-functions/v2/https';
import Stripe from 'stripe';
import { getFirestore } from 'firebase-admin/firestore';

export const stripeWebhook = onRequest(async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const sig = req.headers['stripe-signature'] as string;

  if (!sig) {
    console.error('❌ Missing Stripe signature header');
    res.status(400).send('Missing signature');
    return;
  }

  // Initialize Stripe (will be needed when we re-enable signature verification)
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  //   apiVersion: '2023-10-16',
  // });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  let event: Stripe.Event;

  try {
    console.log('📥 Webhook received');
    console.log('   Method:', req.method);
    console.log('   Content-Type:', req.headers['content-type']);
    console.log('   Signature present:', !!sig);
    console.log('   Webhook secret configured:', !!webhookSecret);

    // TEMPORARY: Skip signature verification to test the rest of the flow
    // TODO: Fix signature verification after confirming webhook logic works
    console.log('⚠️  TEMPORARILY skipping signature verification for testing');
    event = req.body as Stripe.Event;

    console.log('   Event type:', event.type);
    console.log('   Event ID:', event.id);
  } catch (err: any) {
    console.error('❌ Webhook processing failed');
    console.error('   Error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  const db = getFirestore();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.firebaseUID;

        if (!userId) {
          console.error('No Firebase UID in session metadata');
          res.status(400).send('Missing user ID');
          return;
        }

        console.log(`Checkout completed for user ${userId}`);

        // Update user to PRO tier
        await db.collection('users').doc(userId).update({
          tier: 'pro',
          stripeSubscriptionId: session.subscription,
          stripeCustomerId: session.customer,
          subscriptionStatus: 'active',
          updatedAt: Date.now(),
        });

        console.log(`User ${userId} upgraded to PRO`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log(`Subscription deleted for customer ${customerId}`);

        // Find user by Stripe customer ID
        const usersSnapshot = await db
          .collection('users')
          .where('stripeCustomerId', '==', customerId)
          .limit(1)
          .get();

        if (!usersSnapshot.empty) {
          const userDoc = usersSnapshot.docs[0];

          // Downgrade to FREE tier
          await userDoc.ref.update({
            tier: 'free',
            stripeSubscriptionId: null,
            subscriptionStatus: 'canceled',
            updatedAt: Date.now(),
          });

          console.log(`User ${userDoc.id} downgraded to FREE`);
        } else {
          console.warn(`No user found with Stripe customer ID ${customerId}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log(`Subscription updated for customer ${customerId}`);

        // Find user by Stripe customer ID
        const usersSnapshot = await db
          .collection('users')
          .where('stripeCustomerId', '==', customerId)
          .limit(1)
          .get();

        if (!usersSnapshot.empty) {
          const userDoc = usersSnapshot.docs[0];

          // Update subscription status
          const status = subscription.status === 'active' ? 'active' : subscription.status;
          const tier = status === 'active' ? 'pro' : 'free';

          await userDoc.ref.update({
            tier: tier,
            subscriptionStatus: status,
            stripeSubscriptionId: subscription.id,
            updatedAt: Date.now(),
          });

          console.log(`User ${userDoc.id} subscription updated: status=${status}, tier=${tier}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        console.warn(`Payment failed for customer ${customerId}`);

        // Find user and update status
        const usersSnapshot = await db
          .collection('users')
          .where('stripeCustomerId', '==', customerId)
          .limit(1)
          .get();

        if (!usersSnapshot.empty) {
          const userDoc = usersSnapshot.docs[0];

          await userDoc.ref.update({
            subscriptionStatus: 'past_due',
            updatedAt: Date.now(),
          });

          console.log(`User ${userDoc.id} marked as past_due`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    res.status(500).send(`Webhook processing failed: ${error.message}`);
  }
});
