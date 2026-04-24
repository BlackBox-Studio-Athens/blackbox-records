import type { StoreItemSlug, StripePriceId, VariantId } from '../../../domain/commerce/repositories';

export type StoreOfferAvailability = {
    status: 'available' | 'sold_out';
    label: string;
};

export type StoreOffer = {
    storeItemSlug: StoreItemSlug;
    variantId: VariantId;
    availability: StoreOfferAvailability;
    canCheckout: boolean;
};

export type EmbeddedCheckoutSessionRequest = {
    returnUrl: string;
    storeItemSlug: StoreItemSlug;
    stripePriceId: StripePriceId;
    variantId: VariantId;
};

export type EmbeddedCheckoutSession = {
    checkoutSessionId: string;
    clientSecret: string;
};

export type StripeCheckoutSessionStatus = 'open' | 'complete' | 'expired' | null;

export type StripeCheckoutPaymentStatus = 'paid' | 'unpaid' | 'no_payment_required';

export type StripeCheckoutSessionState = {
    checkoutSessionId: string;
    paymentStatus: StripeCheckoutPaymentStatus;
    status: StripeCheckoutSessionStatus;
};

export type CheckoutState = {
    checkoutSessionId: string;
    paymentStatus: StripeCheckoutPaymentStatus;
    state: 'open' | 'paid' | 'processing' | 'expired' | 'unknown';
    status: StripeCheckoutSessionStatus;
};

export interface CheckoutGateway {
    createEmbeddedCheckoutSession(request: EmbeddedCheckoutSessionRequest): Promise<EmbeddedCheckoutSession>;
    readCheckoutSession(checkoutSessionId: string): Promise<StripeCheckoutSessionState>;
}
