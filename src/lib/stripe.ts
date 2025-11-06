/**
 * Stripe Integration Utilities
 * Connects the extension to Firebase Functions for payment processing
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';

// Initialize Firebase Functions
const functions = getFunctions(app);

// Price IDs from environment
const STRIPE_PRICE_MONTHLY = process.env.STRIPE_PRICE_MONTHLY;
const STRIPE_PRICE_YEARLY = process.env.STRIPE_PRICE_YEARLY;

// Debug logging
console.log('[Stripe] Price IDs loaded:', {
  monthly: STRIPE_PRICE_MONTHLY ? 'SET' : 'MISSING',
  yearly: STRIPE_PRICE_YEARLY ? 'SET' : 'MISSING'
});

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export interface PortalSessionResponse {
  url: string;
}

/**
 * Initiates Stripe checkout for a subscription
 * Opens Stripe Checkout in a new tab
 */
export async function initiateCheckout(priceId: string): Promise<void> {
  console.log('[Stripe] initiateCheckout called with priceId:', priceId);

  try {
    console.log('[Stripe] Calling Firebase function: createCheckoutSession');

    const createCheckoutSession = httpsCallable<
      { priceId: string },
      CheckoutSessionResponse
    >(functions, 'createCheckoutSession');

    const result = await createCheckoutSession({ priceId });
    console.log('[Stripe] Function result:', result);

    const { url } = result.data;

    if (!url) {
      console.error('[Stripe] No checkout URL in response:', result.data);
      throw new Error('No checkout URL returned');
    }

    console.log('[Stripe] Opening checkout URL:', url);
    // Open Stripe Checkout in new tab
    chrome.tabs.create({ url });
  } catch (error) {
    console.error('[Stripe] Error in initiateCheckout:', error);
    throw new Error('Failed to start checkout. Please try again.');
  }
}

/**
 * Initiates monthly subscription checkout
 */
export async function upgradeToMonthly(): Promise<void> {
  console.log('[Stripe] upgradeToMonthly called, price ID:', STRIPE_PRICE_MONTHLY);

  if (!STRIPE_PRICE_MONTHLY) {
    console.error('[Stripe] Monthly price ID not configured!');
    throw new Error('Monthly price ID not configured. Please contact support.');
  }

  return initiateCheckout(STRIPE_PRICE_MONTHLY);
}

/**
 * Initiates yearly subscription checkout
 */
export async function upgradeToYearly(): Promise<void> {
  if (!STRIPE_PRICE_YEARLY) {
    throw new Error('Yearly price ID not configured');
  }
  return initiateCheckout(STRIPE_PRICE_YEARLY);
}

/**
 * Opens Stripe Customer Portal for managing billing
 * Allows users to cancel, update payment method, view invoices, etc.
 */
export async function openCustomerPortal(): Promise<void> {
  try {
    const createPortalSession = httpsCallable<void, PortalSessionResponse>(
      functions,
      'createPortalSession'
    );

    const result = await createPortalSession();
    const { url } = result.data;

    if (!url) {
      throw new Error('No portal URL returned');
    }

    // Open Customer Portal in new tab
    chrome.tabs.create({ url });
  } catch (error) {
    console.error('Failed to open customer portal:', error);
    throw new Error('Failed to open billing portal. Please try again.');
  }
}
