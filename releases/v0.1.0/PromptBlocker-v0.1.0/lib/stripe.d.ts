/**
 * Stripe Integration Utilities
 * Connects the extension to Firebase Functions for payment processing
 */
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
export declare function initiateCheckout(priceId: string): Promise<void>;
/**
 * Initiates monthly subscription checkout
 */
export declare function upgradeToMonthly(): Promise<void>;
/**
 * Initiates yearly subscription checkout
 */
export declare function upgradeToYearly(): Promise<void>;
/**
 * Opens Stripe Customer Portal for managing billing
 * Allows users to cancel, update payment method, view invoices, etc.
 */
export declare function openCustomerPortal(): Promise<void>;
//# sourceMappingURL=stripe.d.ts.map